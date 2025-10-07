// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

/// @title IUltraVerifier - Interface for Noir ZK proof verifier
interface IUltraVerifier {
    function verify(bytes calldata proof, bytes32[] calldata publicInputs) external view returns (bool);
}

/// @title IdentityProofFactory
/// @notice Factory contract for registering and verifying zero-knowledge identity proofs
/// @dev Uses UUPS upgradeable pattern for future enhancements
contract IdentityProofFactory is 
    OwnableUpgradeable, 
    PausableUpgradeable, 
    ReentrancyGuardUpgradeable,
    UUPSUpgradeable 
{
    // ========== STRUCTS ==========
    
    /// @notice User's registered identity proof data
    struct UserIdentityProof {
        bytes32 identityCommitment;    // Hash commitment to user's identity
        uint256 proofTimestamp;        // When proof was registered
        uint256 expiryTimestamp;       // When proof expires
        bytes32 nullifierHash;         // Prevents proof reuse
        address userWallet;            // User's wallet address
        uint8 proofTypes;              // Bitmask of proven attributes (age|residency|nationality|composite)
        bool isActive;                 // Whether proof is currently valid
        bytes proofData;               // The actual ZK proof bytes
    }
    
    /// @notice Configuration for each proof type
    struct ProofTypeConfig {
        bool enabled;                  // Whether this proof type is accepted
        uint256 validityPeriod;        // How long proofs of this type are valid (seconds)
        uint256 minStakeAmount;        // Minimum stake required (anti-spam)
        IUltraVerifier verifier;       // Verifier contract for this proof type
    }
    
    // ========== STATE VARIABLES ==========
    
    /// @notice Mapping from user address to their identity proof
    mapping(address => UserIdentityProof) public userProofs;
    
    /// @notice Track used nullifiers to prevent replay attacks
    mapping(bytes32 => bool) public usedNullifiers;
    
    /// @notice Configuration for each proof type (1=age, 2=residency, 3=nationality, 4=composite)
    mapping(uint8 => ProofTypeConfig) public proofTypeConfigs;
    
    /// @notice Map identity commitment to user address (reverse lookup)
    mapping(bytes32 => address) public commitmentToUser;
    
    /// @notice Total number of registered proofs
    uint256 public totalProofsRegistered;
    
    /// @notice Total stake collected
    uint256 public totalStakeCollected;
    
    // ========== EVENTS ==========
    
    event ProofRegistered(
        address indexed user,
        bytes32 indexed identityCommitment,
        uint8 proofTypes,
        uint256 expiryTimestamp,
        uint256 stakeAmount
    );
    
    event ProofRevoked(
        address indexed user, 
        bytes32 indexed identityCommitment,
        string reason
    );
    
    event ProofTypeConfigUpdated(
        uint8 indexed proofType, 
        bool enabled, 
        uint256 validityPeriod,
        uint256 minStakeAmount
    );
    
    event ProofExpired(
        address indexed user,
        bytes32 indexed identityCommitment
    );
    
    event StakeWithdrawn(
        address indexed owner,
        uint256 amount
    );
    
    // ========== ERRORS ==========
    
    error ProofAlreadyExists();
    error ProofVerificationFailed();
    error NullifierAlreadyUsed();
    error ProofTypeNotSupported();
    error InsufficientStake();
    error ProofExpired();
    error InvalidProofType();
    error UnauthorizedRevocation();
    error NoActiveProof();
    error InvalidPublicSignals();
    error InvalidWalletAddress();
    error WithdrawalFailed();
    
    // ========== MODIFIERS ==========
    
    modifier validProofType(uint8 proofType) {
        if (proofType != 1 && proofType != 2 && proofType != 3 && proofType != 4) {
            revert InvalidProofType();
        }
        _;
    }
    
    // ========== INITIALIZATION ==========
    
    /// @notice Initialize the contract (replaces constructor for upgradeable contracts)
    function initialize() external initializer {
        __Ownable_init();
        __Pausable_init();
        __ReentrancyGuard_init();
        __UUPSUpgradeable_init();
        
        // Initialize default proof type configurations
        // Age proof (type 1): valid for 1 year
        proofTypeConfigs[1] = ProofTypeConfig({
            enabled: true,
            validityPeriod: 365 days,
            minStakeAmount: 0.01 ether,
            verifier: IUltraVerifier(address(0)) // Set during deployment
        });
        
        // Residency proof (type 2): valid for 3 months
        proofTypeConfigs[2] = ProofTypeConfig({
            enabled: true,
            validityPeriod: 90 days,
            minStakeAmount: 0.005 ether,
            verifier: IUltraVerifier(address(0))
        });
        
        // Nationality proof (type 3): valid for 1 year
        proofTypeConfigs[3] = ProofTypeConfig({
            enabled: true,
            validityPeriod: 365 days,
            minStakeAmount: 0.005 ether,
            verifier: IUltraVerifier(address(0))
        });
        
        // Composite proof (type 4): valid for 6 months
        proofTypeConfigs[4] = ProofTypeConfig({
            enabled: true,
            validityPeriod: 180 days,
            minStakeAmount: 0.02 ether,
            verifier: IUltraVerifier(address(0))
        });
    }
    
    // ========== MAIN FUNCTIONS ==========
    
    /// @notice Register a new identity proof on-chain
    /// @param identityCommitment Hash commitment to user's identity data
    /// @param proofType Type of proof being registered (1=age, 2=residency, 3=nationality, 4=composite)
    /// @param proof The ZK proof bytes
    /// @param publicSignals Public inputs for the proof [proofType, nullifierHash, identityCommitment, verifierChallenge, walletAddress]
    /// @param nullifierHash Anti-replay nullifier
    function registerProof(
        bytes32 identityCommitment,
        uint8 proofType,
        bytes calldata proof,
        bytes32[] calldata publicSignals,
        bytes32 nullifierHash
    ) 
        external 
        payable 
        whenNotPaused 
        nonReentrant
        validProofType(proofType)
    {
        // Validate proof type configuration
        ProofTypeConfig memory config = proofTypeConfigs[proofType];
        if (!config.enabled) revert ProofTypeNotSupported();
        
        // Check minimum stake
        if (msg.value < config.minStakeAmount) revert InsufficientStake();
        
        // Check if user already has an active proof
        if (userProofs[msg.sender].isActive) revert ProofAlreadyExists();
        
        // Check nullifier hasn't been used (prevents replay attacks)
        if (usedNullifiers[nullifierHash]) revert NullifierAlreadyUsed();
        
        // Validate public signals format and content
        if (publicSignals.length != 5) revert InvalidPublicSignals();
        
        // publicSignals[0] = proof_type
        if (uint8(uint256(publicSignals[0])) != proofType) revert InvalidProofType();
        
        // publicSignals[1] = nullifier_hash
        if (publicSignals[1] != nullifierHash) revert InvalidPublicSignals();
        
        // publicSignals[2] = identity_commitment
        if (publicSignals[2] != identityCommitment) revert InvalidPublicSignals();
        
        // publicSignals[4] = wallet_address
        address providedWallet = address(uint160(uint256(publicSignals[4])));
        if (providedWallet != msg.sender) revert InvalidWalletAddress();
        
        // Verify the ZK proof
        bool proofValid = config.verifier.verify(proof, publicSignals);
        if (!proofValid) revert ProofVerificationFailed();
        
        // Calculate expiry timestamp
        uint256 expiryTimestamp = block.timestamp + config.validityPeriod;
        
        // Store the proof
        userProofs[msg.sender] = UserIdentityProof({
            identityCommitment: identityCommitment,
            proofTimestamp: block.timestamp,
            expiryTimestamp: expiryTimestamp,
            nullifierHash: nullifierHash,
            userWallet: msg.sender,
            proofTypes: proofType,
            isActive: true,
            proofData: proof
        });
        
        // Mark nullifier as used
        usedNullifiers[nullifierHash] = true;
        
        // Link commitment to user (for reverse lookup)
        commitmentToUser[identityCommitment] = msg.sender;
        
        // Update statistics
        totalProofsRegistered++;
        totalStakeCollected += msg.value;
        
        emit ProofRegistered(msg.sender, identityCommitment, proofType, expiryTimestamp, msg.value);
    }
    
    /// @notice Verify if a user has a valid proof of a specific type
    /// @param user User's wallet address
    /// @param requiredProofType Type of proof to check (1, 2, 3, or 4)
    /// @return isValid Whether the user has a valid proof
    /// @return expiryTimestamp When the proof expires (0 if invalid)
    function verifyUserProof(address user, uint8 requiredProofType) 
        external 
        view 
        validProofType(requiredProofType)
        returns (bool isValid, uint256 expiryTimestamp) 
    {
        UserIdentityProof memory userProof = userProofs[user];
        
        // Check if proof exists and is active
        if (!userProof.isActive) {
            return (false, 0);
        }
        
        // Check if proof has expired
        if (block.timestamp > userProof.expiryTimestamp) {
            return (false, userProof.expiryTimestamp);
        }
        
        // Check if user has the required proof type (bitwise check)
        // For single type proofs, this is a direct comparison
        // For composite proofs (type 4), all types are proven
        bool hasRequiredType = (userProof.proofTypes == requiredProofType) || 
                              (userProof.proofTypes == 4); // Composite includes all
        
        return (hasRequiredType, userProof.expiryTimestamp);
    }
    
    /// @notice Get user's full proof data
    /// @param user User's wallet address
    /// @return proof The UserIdentityProof struct
    function getUserProof(address user) external view returns (UserIdentityProof memory) {
        return userProofs[user];
    }
    
    /// @notice Get user's identity commitment
    /// @param user User's wallet address
    /// @return identityCommitment The user's identity commitment hash
    function getUserIdentityCommitment(address user) external view returns (bytes32) {
        return userProofs[user].identityCommitment;
    }
    
    /// @notice Get user address from identity commitment (reverse lookup)
    /// @param commitment The identity commitment hash
    /// @return user The user's wallet address
    function getUserFromCommitment(bytes32 commitment) external view returns (address) {
        return commitmentToUser[commitment];
    }
    
    /// @notice Check if a nullifier has been used
    /// @param nullifier The nullifier hash to check
    /// @return used Whether the nullifier has been used
    function isNullifierUsed(bytes32 nullifier) external view returns (bool) {
        return usedNullifiers[nullifier];
    }
    
    // ========== REVOCATION & MANAGEMENT ==========
    
    /// @notice Revoke user's proof (only user or owner)
    /// @param user User whose proof to revoke
    /// @param reason Reason for revocation
    function revokeProof(address user, string calldata reason) external {
        if (msg.sender != user && msg.sender != owner()) {
            revert UnauthorizedRevocation();
        }
        
        UserIdentityProof storage userProof = userProofs[user];
        if (!userProof.isActive) revert NoActiveProof();
        
        userProof.isActive = false;
        
        emit ProofRevoked(user, userProof.identityCommitment, reason);
    }
    
    /// @notice Mark expired proofs as inactive (can be called by anyone)
    /// @param users Array of user addresses to check
    function markExpiredProofs(address[] calldata users) external {
        for (uint256 i = 0; i < users.length; i++) {
            UserIdentityProof storage userProof = userProofs[users[i]];
            
            if (userProof.isActive && block.timestamp > userProof.expiryTimestamp) {
                userProof.isActive = false;
                emit ProofExpired(users[i], userProof.identityCommitment);
            }
        }
    }
    
    // ========== ADMIN FUNCTIONS ==========
    
    /// @notice Update proof type configuration (owner only)
    /// @param proofType The proof type to update (1-4)
    /// @param enabled Whether this proof type is enabled
    /// @param validityPeriod How long proofs are valid (seconds)
    /// @param minStakeAmount Minimum stake required
    /// @param verifier The verifier contract address
    function updateProofTypeConfig(
        uint8 proofType,
        bool enabled,
        uint256 validityPeriod,
        uint256 minStakeAmount,
        address verifier
    ) external onlyOwner validProofType(proofType) {
        proofTypeConfigs[proofType] = ProofTypeConfig({
            enabled: enabled,
            validityPeriod: validityPeriod,
            minStakeAmount: minStakeAmount,
            verifier: IUltraVerifier(verifier)
        });
        
        emit ProofTypeConfigUpdated(proofType, enabled, validityPeriod, minStakeAmount);
    }
    
    /// @notice Withdraw accumulated stakes (owner only)
    /// @param amount Amount to withdraw (0 = all)
    function withdrawStakes(uint256 amount) external onlyOwner nonReentrant {
        uint256 withdrawAmount = amount == 0 ? address(this).balance : amount;
        
        (bool success, ) = payable(owner()).call{value: withdrawAmount}("");
        if (!success) revert WithdrawalFailed();
        
        emit StakeWithdrawn(owner(), withdrawAmount);
    }
    
    /// @notice Pause the contract (owner only)
    function pause() external onlyOwner {
        _pause();
    }
    
    /// @notice Unpause the contract (owner only)
    function unpause() external onlyOwner {
        _unpause();
    }
    
    /// @notice Authorize contract upgrade (UUPS pattern)
    /// @param newImplementation Address of new implementation
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}
    
    // ========== VIEW FUNCTIONS ==========
    
    /// @notice Get proof type configuration
    /// @param proofType The proof type (1-4)
    /// @return config The ProofTypeConfig struct
    function getProofTypeConfig(uint8 proofType) 
        external 
        view 
        validProofType(proofType)
        returns (ProofTypeConfig memory) 
    {
        return proofTypeConfigs[proofType];
    }
    
    /// @notice Get contract statistics
    /// @return totalProofs Total proofs registered
    /// @return totalStake Total stake collected
    /// @return contractBalance Current contract balance
    function getStatistics() 
        external 
        view 
        returns (
            uint256 totalProofs, 
            uint256 totalStake, 
            uint256 contractBalance
        ) 
    {
        return (totalProofsRegistered, totalStakeCollected, address(this).balance);
    }
    
    /// @notice Check if user has any active proof
    /// @param user User's address
    /// @return hasProof Whether user has an active proof
    function hasActiveProof(address user) external view returns (bool) {
        return userProofs[user].isActive && block.timestamp <= userProofs[user].expiryTimestamp;
    }
}

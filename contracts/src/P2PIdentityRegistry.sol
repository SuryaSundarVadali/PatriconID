// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

// Verifier contract interface for different proof types
interface IZKVerifier {
    function verifyProof(
        bytes calldata proof,
        uint256[] calldata publicInputs
    ) external view returns (bool);
}

/**
 * @title P2PIdentityRegistry
 * @dev Gas-optimized smart contract for P2P zero-knowledge identity verification
 * @dev Supports Merkle-based registry and selective disclosure verifiers
 * @notice Enables optional on-chain verification for DeFi/payment integration
 */
contract P2PIdentityRegistry is 
    Initializable,
    OwnableUpgradeable, 
    ReentrancyGuardUpgradeable, 
    PausableUpgradeable,
    UUPSUpgradeable {

    // Custom errors for gas optimization
    error InvalidProofType(uint8 proofType);
    error NullifierAlreadyUsed(bytes32 nullifier);
    error VerifierNotSet(uint8 proofType);
    error InvalidZKProof();
    error InvalidPasskeySignature();
    error ArrayLengthMismatch();
    error TooManyProofs(uint256 count);
    error ProofExpired(bytes32 proofHash);
    error UnauthorizedUpgrade();

    // Gas-optimized proof structure
    struct ZKProof {
        bytes32 proofHash;      // Hash of the actual proof data
        uint8 proofType;        // 1=age, 2=residency, 3=nationality, 4=credit, 5=composite
        bytes32 nullifierHash;  // Anti-replay nullifier
        bytes32 commitment;     // Identity commitment
        uint32 timestamp;       // Proof generation timestamp
    }

    // Registry state
    mapping(uint8 => address) public verifierContracts;           // proof type => verifier address
    mapping(bytes32 => bool) public usedNullifiers;              // nullifier => used
    mapping(address => mapping(uint8 => bytes32)) public userProofs; // user => proof type => proof hash
    mapping(bytes32 => uint256) public proofTimestamps;          // proof hash => timestamp
    
    // Merkle tree for privacy-preserving inclusion proofs
    bytes32 public merkleRoot;
    mapping(bytes32 => bool) public verifiedCommitments;         // commitment => verified

    // Events for P2P coordination
    event ProofVerified(
        address indexed user,
        uint8 indexed proofType,
        bytes32 indexed proofHash,
        bytes32 nullifierHash,
        uint32 timestamp
    );
    
    event CommitmentRegistered(
        bytes32 indexed commitment,
        address indexed user,
        uint32 timestamp
    );
    
    event VerifierUpdated(uint8 indexed proofType, address verifier);
    event MerkleRootUpdated(bytes32 newRoot);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address _owner) public initializer {
        __Ownable_init(_owner);
        __ReentrancyGuard_init();
        __Pausable_init();
        __UUPSUpgradeable_init();
    }

    /**
     * @notice Verify P2P proof on-chain (optional for DeFi integration)
     * @param proof The ZK proof data
     * @param publicInputs Public inputs for verification
     * @param passkeySignature Passkey signature for non-transferability
     */
    function verifyP2PProof(
        bytes calldata proof,
        uint256[] calldata publicInputs,
        bytes calldata passkeySignature,
        uint8 proofType,
        bytes32 nullifierHash,
        bytes32 commitment
    ) external nonReentrant whenNotPaused returns (bool) {
        if (proofType < 1 || proofType > 5) {
            revert InvalidProofType(proofType);
        }
        if (usedNullifiers[nullifierHash]) {
            revert NullifierAlreadyUsed(nullifierHash);
        }
        if (verifierContracts[proofType] == address(0)) {
            revert VerifierNotSet(proofType);
        }

        // Verify ZK proof using appropriate verifier contract
        IZKVerifier verifier = IZKVerifier(verifierContracts[proofType]);
        bool proofValid = verifier.verifyProof(proof, publicInputs);
        if (!proofValid) {
            revert InvalidZKProof();
        }

        // Verify passkey signature for non-transferability
        bool signatureValid = _verifyPasskeySignature(
            keccak256(proof),
            passkeySignature,
            msg.sender
        );
        if (!signatureValid) {
            revert InvalidPasskeySignature();
        }

        // Mark nullifier as used (anti-replay)
        usedNullifiers[nullifierHash] = true;

        // Create proof record
        bytes32 proofHash = keccak256(abi.encodePacked(proof, block.timestamp, msg.sender));
        userProofs[msg.sender][proofType] = proofHash;
        proofTimestamps[proofHash] = block.timestamp;

        // Register commitment if not already done
        if (!verifiedCommitments[commitment]) {
            verifiedCommitments[commitment] = true;
            emit CommitmentRegistered(commitment, msg.sender, uint32(block.timestamp));
        }

        emit ProofVerified(
            msg.sender,
            proofType,
            proofHash,
            nullifierHash,
            uint32(block.timestamp)
        );

        return true;
    }

    /**
     * @notice Batch verify multiple proofs for gas efficiency
     */
    function batchVerifyProofs(
        bytes[] calldata proofs,
        uint256[][] calldata publicInputs,
        bytes[] calldata passkeySignatures,
        uint8[] calldata proofTypes,
        bytes32[] calldata nullifierHashes,
        bytes32[] calldata commitments
    ) external nonReentrant whenNotPaused returns (bool[] memory) {
        if (proofs.length != proofTypes.length) {
            revert ArrayLengthMismatch();
        }
        if (proofs.length > 10) {
            revert TooManyProofs(proofs.length);
        }

        bool[] memory results = new bool[](proofs.length);
        
        for (uint256 i = 0; i < proofs.length; i++) {
            // Skip if nullifier already used
            if (usedNullifiers[nullifierHashes[i]]) {
                results[i] = false;
                continue;
            }

            try this.verifyP2PProof(
                proofs[i],
                publicInputs[i],
                passkeySignatures[i],
                proofTypes[i],
                nullifierHashes[i],
                commitments[i]
            ) {
                results[i] = true;
            } catch {
                results[i] = false;
            }
        }
        
        return results;
    }

    /**
     * @notice Check if user has valid proof for specific type
     */
    function hasValidProof(address user, uint8 proofType) external view returns (bool) {
        bytes32 proofHash = userProofs[user][proofType];
        if (proofHash == bytes32(0)) return false;
        
        // Check if proof is not expired (24 hours for demo)
        uint256 proofTime = proofTimestamps[proofHash];
        return (block.timestamp - proofTime) <= 86400;
    }

    /**
     * @notice Verify Merkle inclusion proof for privacy-preserving whitelist
     */
    function verifyMerkleInclusion(
        bytes32 leaf,
        bytes32[] calldata proof,
        uint256 index
    ) external view returns (bool) {
        return _verifyMerkleProof(proof, merkleRoot, leaf, index);
    }

    /**
     * @notice Get user's proof status for all types
     */
    function getUserProofStatus(address user) external view returns (
        bool[5] memory hasProof,
        uint256[5] memory timestamps
    ) {
        for (uint8 i = 1; i <= 5; i++) {
            bytes32 proofHash = userProofs[user][i];
            hasProof[i-1] = proofHash != bytes32(0);
            timestamps[i-1] = proofHash != bytes32(0) ? proofTimestamps[proofHash] : 0;
        }
    }

    // Admin functions

    function setVerifierContract(uint8 proofType, address verifier) external onlyOwner {
        if (proofType < 1 || proofType > 5) {
            revert InvalidProofType(proofType);
        }
        verifierContracts[proofType] = verifier;
        emit VerifierUpdated(proofType, verifier);
    }

    function updateMerkleRoot(bytes32 newRoot) external onlyOwner {
        merkleRoot = newRoot;
        emit MerkleRootUpdated(newRoot);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    // Internal functions

    function _verifyPasskeySignature(
        bytes32 messageHash,
        bytes calldata signature,
        address signer
    ) internal pure returns (bool) {
        // Simplified passkey signature verification
        // In production, implement proper WebAuthn signature verification
        return signature.length >= 64 && signer != address(0);
    }

    function _verifyMerkleProof(
        bytes32[] memory proof,
        bytes32 root,
        bytes32 leaf,
        uint256 index
    ) internal pure returns (bool) {
        bytes32 hash = leaf;

        for (uint256 i = 0; i < proof.length; i++) {
            bytes32 proofElement = proof[i];
            if (index % 2 == 0) {
                hash = keccak256(abi.encodePacked(hash, proofElement));
            } else {
                hash = keccak256(abi.encodePacked(proofElement, hash));
            }
            index /= 2;
        }

        return hash == root;
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {
        // Additional authorization logic can be added here if needed
        // The onlyOwner modifier already handles the basic authorization
    }

    // Gas optimization: Pack multiple values into single storage slot
    struct PackedProofData {
        uint128 timestamp;      // Sufficient for timestamps
        uint64 proofType;       // Pack proof type
        uint64 status;          // Additional status flags
    }

    mapping(bytes32 => PackedProofData) public packedProofData;

    /**
     * @notice Gas-optimized proof storage
     */
    function setPackedProofData(
        bytes32 proofHash,
        uint128 timestamp,
        uint64 proofType,
        uint64 status
    ) external onlyOwner {
        packedProofData[proofHash] = PackedProofData({
            timestamp: timestamp,
            proofType: proofType,
            status: status
        });
    }
}
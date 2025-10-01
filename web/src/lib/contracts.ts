// Smart Contract Configuration
export const P2P_IDENTITY_REGISTRY_ADDRESS = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"; // Local deployment address

// Contract ABI (Application Binary Interface)
export const P2P_IDENTITY_REGISTRY_ABI = [
  // Events
  "event ProofVerified(address indexed user, uint8 indexed proofType, bytes32 indexed proofHash, bytes32 nullifierHash, uint32 timestamp)",
  "event CommitmentRegistered(bytes32 indexed commitment, address indexed user, uint32 timestamp)",
  "event VerifierUpdated(uint8 indexed proofType, address verifier)",
  "event MerkleRootUpdated(bytes32 newRoot)",
  
  // Custom Errors
  "error InvalidProofType(uint8 proofType)",
  "error NullifierAlreadyUsed(bytes32 nullifier)",
  "error VerifierNotSet(uint8 proofType)",
  "error InvalidZKProof()",
  "error InvalidPasskeySignature()",
  "error ArrayLengthMismatch()",
  "error TooManyProofs(uint256 count)",
  "error ProofExpired(bytes32 proofHash)",
  "error UnauthorizedUpgrade()",
  "error PublicInputsLengthMismatch()",
  "error SignaturesLengthMismatch()",
  "error NullifiersLengthMismatch()",
  "error CommitmentsLengthMismatch()",

  // Main Functions
  "function initialize(address _owner) external",
  "function verifyP2PProof(bytes calldata proof, uint256[] calldata publicInputs, bytes calldata passkeySignature, uint8 proofType, bytes32 nullifierHash, bytes32 commitment) external returns (bool)",
  "function batchVerifyProofs(bytes[] calldata proofs, uint256[][] calldata publicInputs, bytes[] calldata passkeySignatures, uint8[] calldata proofTypes, bytes32[] calldata nullifierHashes, bytes32[] calldata commitments) external returns (bool[] memory)",
  
  // View Functions
  "function hasValidProof(address user, uint8 proofType) external view returns (bool)",
  "function getUserProofStatus(address user) external view returns (bool[5] memory hasProof, uint256[5] memory timestamps)",
  "function verifyMerkleInclusion(bytes32 leaf, bytes32[] calldata proof, uint256 index) external view returns (bool)",
  
  // State Variables
  "function verifierContracts(uint8) external view returns (address)",
  "function usedNullifiers(bytes32) external view returns (bool)",
  "function userProofs(address, uint8) external view returns (bytes32)",
  "function proofTimestamps(bytes32) external view returns (uint256)",
  "function merkleRoot() external view returns (bytes32)",
  "function verifiedCommitments(bytes32) external view returns (bool)",
  
  // Admin Functions
  "function setVerifierContract(uint8 proofType, address verifier) external",
  "function updateMerkleRoot(bytes32 newRoot) external",
  "function pause() external",
  "function unpause() external",
  "function owner() external view returns (address)",
  
  // UUPS Upgrade Functions
  "function upgradeTo(address newImplementation) external",
  "function upgradeToAndCall(address newImplementation, bytes calldata data) external",
  
  // OpenZeppelin Standard Functions
  "function paused() external view returns (bool)"
] as const;

// Network configurations
export const NETWORKS = {
  // Local development (Anvil)
  31337: {
    chainId: 31337,
    name: "Anvil Local",
    rpcUrl: "http://127.0.0.1:8545",
    blockExplorer: "http://localhost:8545",
    contractAddress: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"
  },
  
  // Ethereum Sepolia Testnet
  11155111: {
    chainId: 11155111,
    name: "Sepolia Testnet",
    rpcUrl: "https://sepolia.infura.io/v3/YOUR_INFURA_KEY",
    blockExplorer: "https://sepolia.etherscan.io",
    contractAddress: "0x0000000000000000000000000000000000000000" // To be updated after deployment
  },
  
  // Ethereum Mainnet
  1: {
    chainId: 1,
    name: "Ethereum Mainnet",
    rpcUrl: "https://mainnet.infura.io/v3/YOUR_INFURA_KEY",
    blockExplorer: "https://etherscan.io",
    contractAddress: "0x0000000000000000000000000000000000000000" // To be updated after deployment
  }
};

// Alias for backward compatibility
export const NETWORK_CONFIGS = NETWORKS;

// Proof type mappings
export const PROOF_TYPES = {
  AGE_VERIFICATION: 1,
  RESIDENCY_PROOF: 2,
  NATIONALITY_PROOF: 3,
  CREDIT_SCORE: 4,
  COMPOSITE_PROOF: 5
} as const;

export const PROOF_TYPE_NAMES = {
  1: "Age Verification",
  2: "Residency Proof",
  3: "Nationality Proof", 
  4: "Credit Score",
  5: "Composite Proof"
} as const;

// Gas limit configurations
export const GAS_LIMITS = {
  VERIFY_PROOF: 500000,
  BATCH_VERIFY: 2000000,
  SET_VERIFIER: 100000,
  UPDATE_MERKLE_ROOT: 50000
} as const;

// Get network configuration by chain ID
export function getNetworkConfig(chainId: number) {
  return NETWORK_CONFIGS[chainId as keyof typeof NETWORK_CONFIGS];
}

// Get contract address for current network
export function getContractAddress(chainId: number): string {
  const config = getNetworkConfig(chainId);
  return config?.contractAddress || P2P_IDENTITY_REGISTRY_ADDRESS;
}
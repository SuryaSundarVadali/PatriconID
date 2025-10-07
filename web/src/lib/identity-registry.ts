import { ethers } from 'ethers';

// ========== INTERFACES ==========

export interface RegistryConfig {
  factoryAddress: string;
  chainId: number;
  rpcUrl: string;
}

export interface UserIdentityProof {
  identityCommitment: string;
  proofTimestamp: number;
  expiryTimestamp: number;
  nullifierHash: string;
  userWallet: string;
  proofTypes: number;
  isActive: boolean;
  proofData: string;
}

export interface ProofTypeConfig {
  enabled: boolean;
  validityPeriod: number;
  minStakeAmount: string;
  verifier: string;
}

export enum ProofType {
  Age = 1,
  Residency = 2,
  Nationality = 3,
  Composite = 4
}

// ========== FACTORY CONTRACT ABI ==========

const FACTORY_ABI = [
  // Read functions
  "function verifyUserProof(address user, uint8 requiredProofType) external view returns (bool isValid, uint256 expiryTimestamp)",
  "function getUserProof(address user) external view returns (tuple(bytes32 identityCommitment, uint256 proofTimestamp, uint256 expiryTimestamp, bytes32 nullifierHash, address userWallet, uint8 proofTypes, bool isActive, bytes proofData))",
  "function getUserIdentityCommitment(address user) external view returns (bytes32)",
  "function getUserFromCommitment(bytes32 commitment) external view returns (address)",
  "function isNullifierUsed(bytes32 nullifier) external view returns (bool)",
  "function getProofTypeConfig(uint8 proofType) external view returns (tuple(bool enabled, uint256 validityPeriod, uint256 minStakeAmount, address verifier))",
  "function getStatistics() external view returns (uint256 totalProofs, uint256 totalStake, uint256 contractBalance)",
  "function hasActiveProof(address user) external view returns (bool)",
  
  // Write functions
  "function registerProof(bytes32 identityCommitment, uint8 proofType, bytes calldata proof, bytes32[] calldata publicSignals, bytes32 nullifierHash) external payable",
  "function revokeProof(address user, string calldata reason) external",
  "function markExpiredProofs(address[] calldata users) external",
  
  // Events
  "event ProofRegistered(address indexed user, bytes32 indexed identityCommitment, uint8 proofTypes, uint256 expiryTimestamp, uint256 stakeAmount)",
  "event ProofRevoked(address indexed user, bytes32 indexed identityCommitment, string reason)",
  "event ProofExpired(address indexed user, bytes32 indexed identityCommitment)"
];

// ========== IDENTITY PROOF REGISTRY CLASS ==========

export class IdentityProofRegistry {
  private contract: ethers.Contract;
  private signer: ethers.Signer;
  private provider: ethers.Provider;
  public readonly config: RegistryConfig;
  
  constructor(config: RegistryConfig, signer: ethers.Signer) {
    this.config = config;
    this.provider = new ethers.JsonRpcProvider(config.rpcUrl);
    this.signer = signer.connect(this.provider);
    this.contract = new ethers.Contract(config.factoryAddress, FACTORY_ABI, this.signer);
  }
  
  // ========== WRITE METHODS ==========
  
  /**
   * Register a new identity proof on-chain
   * @param identityCommitment - Hash commitment to user's identity
   * @param proofType - Type of proof (1=age, 2=residency, 3=nationality, 4=composite)
   * @param proof - The ZK proof bytes (hex string)
   * @param publicSignals - Array of public signals (hex strings)
   * @param nullifierHash - Anti-replay nullifier
   * @param stakeAmount - Amount to stake (in ETH)
   * @returns Transaction receipt
   */
  async registerProof(
    identityCommitment: string,
    proofType: ProofType,
    proof: string,
    publicSignals: string[],
    nullifierHash: string,
    stakeAmount: string
  ): Promise<ethers.ContractTransactionReceipt | null> {
    try {
      console.log('Registering proof with params:', {
        identityCommitment,
        proofType,
        nullifierHash,
        stakeAmount
      });
      
      const tx = await this.contract.registerProof(
        identityCommitment,
        proofType,
        proof,
        publicSignals,
        nullifierHash,
        { value: ethers.parseEther(stakeAmount) }
      );
      
      console.log('Transaction sent:', tx.hash);
      const receipt = await tx.wait();
      console.log('Proof registered successfully:', receipt);
      
      return receipt;
    } catch (error: any) {
      console.error('Failed to register proof:', error);
      throw new Error(`Proof registration failed: ${error.message || error}`);
    }
  }
  
  /**
   * Revoke user's own proof
   * @param reason - Reason for revocation
   * @returns Transaction receipt
   */
  async revokeOwnProof(reason: string): Promise<ethers.ContractTransactionReceipt | null> {
    try {
      const userAddress = await this.signer.getAddress();
      const tx = await this.contract.revokeProof(userAddress, reason);
      const receipt = await tx.wait();
      console.log('Proof revoked successfully:', receipt);
      return receipt;
    } catch (error: any) {
      console.error('Failed to revoke proof:', error);
      throw new Error(`Proof revocation failed: ${error.message || error}`);
    }
  }
  
  /**
   * Mark expired proofs as inactive (can be called by anyone)
   * @param userAddresses - Array of user addresses to check
   * @returns Transaction receipt
   */
  async markExpiredProofs(userAddresses: string[]): Promise<ethers.ContractTransactionReceipt | null> {
    try {
      const tx = await this.contract.markExpiredProofs(userAddresses);
      const receipt = await tx.wait();
      console.log('Expired proofs marked:', receipt);
      return receipt;
    } catch (error: any) {
      console.error('Failed to mark expired proofs:', error);
      throw new Error(`Failed to mark expired proofs: ${error.message || error}`);
    }
  }
  
  // ========== READ METHODS ==========
  
  /**
   * Verify if a user has a valid proof of a specific type
   * @param userAddress - User's wallet address
   * @param proofType - Type of proof to verify
   * @returns Verification result with expiry timestamp
   */
  async verifyUserProof(
    userAddress: string,
    proofType: ProofType
  ): Promise<{ isValid: boolean; expiryTimestamp: number }> {
    try {
      const result = await this.contract.verifyUserProof(userAddress, proofType);
      return {
        isValid: result[0],
        expiryTimestamp: Number(result[1])
      };
    } catch (error: any) {
      console.error('Failed to verify user proof:', error);
      return { isValid: false, expiryTimestamp: 0 };
    }
  }
  
  /**
   * Get user's full proof data
   * @param userAddress - User's wallet address
   * @returns UserIdentityProof object
   */
  async getUserProof(userAddress: string): Promise<UserIdentityProof | null> {
    try {
      const proof = await this.contract.getUserProof(userAddress);
      
      return {
        identityCommitment: proof.identityCommitment,
        proofTimestamp: Number(proof.proofTimestamp),
        expiryTimestamp: Number(proof.expiryTimestamp),
        nullifierHash: proof.nullifierHash,
        userWallet: proof.userWallet,
        proofTypes: Number(proof.proofTypes),
        isActive: proof.isActive,
        proofData: proof.proofData
      };
    } catch (error: any) {
      console.error('Failed to get user proof:', error);
      return null;
    }
  }
  
  /**
   * Get user's identity commitment hash
   * @param userAddress - User's wallet address
   * @returns Identity commitment (bytes32)
   */
  async getUserCommitment(userAddress: string): Promise<string> {
    try {
      return await this.contract.getUserIdentityCommitment(userAddress);
    } catch (error: any) {
      console.error('Failed to get user commitment:', error);
      return ethers.ZeroHash;
    }
  }
  
  /**
   * Get user address from identity commitment (reverse lookup)
   * @param commitment - Identity commitment hash
   * @returns User's wallet address
   */
  async getUserFromCommitment(commitment: string): Promise<string> {
    try {
      return await this.contract.getUserFromCommitment(commitment);
    } catch (error: any) {
      console.error('Failed to get user from commitment:', error);
      return ethers.ZeroAddress;
    }
  }
  
  /**
   * Check if a nullifier has been used
   * @param nullifier - Nullifier hash
   * @returns Whether the nullifier has been used
   */
  async isNullifierUsed(nullifier: string): Promise<boolean> {
    try {
      return await this.contract.isNullifierUsed(nullifier);
    } catch (error: any) {
      console.error('Failed to check nullifier:', error);
      return false;
    }
  }
  
  /**
   * Get proof type configuration
   * @param proofType - Type of proof
   * @returns ProofTypeConfig object
   */
  async getProofTypeConfig(proofType: ProofType): Promise<ProofTypeConfig | null> {
    try {
      const config = await this.contract.getProofTypeConfig(proofType);
      return {
        enabled: config.enabled,
        validityPeriod: Number(config.validityPeriod),
        minStakeAmount: ethers.formatEther(config.minStakeAmount),
        verifier: config.verifier
      };
    } catch (error: any) {
      console.error('Failed to get proof type config:', error);
      return null;
    }
  }
  
  /**
   * Get contract statistics
   * @returns Statistics object
   */
  async getStatistics(): Promise<{
    totalProofs: number;
    totalStake: string;
    contractBalance: string;
  }> {
    try {
      const stats = await this.contract.getStatistics();
      return {
        totalProofs: Number(stats.totalProofs),
        totalStake: ethers.formatEther(stats.totalStake),
        contractBalance: ethers.formatEther(stats.contractBalance)
      };
    } catch (error: any) {
      console.error('Failed to get statistics:', error);
      return { totalProofs: 0, totalStake: '0', contractBalance: '0' };
    }
  }
  
  /**
   * Check if user has any active proof
   * @param userAddress - User's wallet address
   * @returns Whether user has an active proof
   */
  async hasActiveProof(userAddress: string): Promise<boolean> {
    try {
      return await this.contract.hasActiveProof(userAddress);
    } catch (error: any) {
      console.error('Failed to check active proof:', error);
      return false;
    }
  }
  
  // ========== UTILITY METHODS ==========
  
  /**
   * Get proof type name
   * @param proofType - Proof type enum
   * @returns Human-readable proof type name
   */
  static getProofTypeName(proofType: ProofType): string {
    switch (proofType) {
      case ProofType.Age:
        return 'Age Verification';
      case ProofType.Residency:
        return 'Residency Verification';
      case ProofType.Nationality:
        return 'Nationality Verification';
      case ProofType.Composite:
        return 'Composite Verification';
      default:
        return 'Unknown';
    }
  }
  
  /**
   * Format timestamp to readable date
   * @param timestamp - Unix timestamp
   * @returns Formatted date string
   */
  static formatTimestamp(timestamp: number): string {
    if (timestamp === 0) return 'N/A';
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  
  /**
   * Check if proof has expired
   * @param expiryTimestamp - Expiry timestamp
   * @returns Whether proof has expired
   */
  static isExpired(expiryTimestamp: number): boolean {
    return Date.now() / 1000 > expiryTimestamp;
  }
  
  /**
   * Get time until expiry
   * @param expiryTimestamp - Expiry timestamp
   * @returns Human-readable time until expiry
   */
  static getTimeUntilExpiry(expiryTimestamp: number): string {
    const now = Date.now() / 1000;
    const diff = expiryTimestamp - now;
    
    if (diff <= 0) return 'Expired';
    
    const days = Math.floor(diff / 86400);
    const hours = Math.floor((diff % 86400) / 3600);
    
    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ${hours}h`;
    return `${hours} hour${hours > 1 ? 's' : ''}`;
  }
}

// ========== REACT HOOK ==========

export const useIdentityRegistry = (config: RegistryConfig) => {
  const [registry, setRegistry] = React.useState<IdentityProofRegistry | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  
  React.useEffect(() => {
    const initRegistry = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        if (typeof window !== 'undefined' && (window as any).ethereum) {
          const provider = new ethers.BrowserProvider((window as any).ethereum);
          const signer = await provider.getSigner();
          const registryInstance = new IdentityProofRegistry(config, signer);
          setRegistry(registryInstance);
        } else {
          setError('Ethereum wallet not found. Please install MetaMask.');
        }
      } catch (err: any) {
        console.error('Failed to initialize registry:', err);
        setError(err.message || 'Failed to initialize registry');
      } finally {
        setIsLoading(false);
      }
    };
    
    initRegistry();
  }, [config.factoryAddress, config.chainId, config.rpcUrl]);
  
  return { registry, isLoading, error };
};

// Import React for the hook
import * as React from 'react';

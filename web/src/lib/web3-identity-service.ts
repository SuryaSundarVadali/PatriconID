import { ethers, Contract, Signer, BrowserProvider } from 'ethers';
import { P2P_IDENTITY_REGISTRY_ABI, P2P_IDENTITY_REGISTRY_ADDRESS, NETWORKS, PROOF_TYPES } from './contracts';
import { 
  ZKProofData, 
  Web3ProofData, 
  ContractVerificationResult, 
  UserProofStatus,
  NetworkInfo,
  WalletInfo,
  ProofVerifiedEventHandler,
  CommitmentRegisteredEventHandler,
  EthersEvent,
  Web3Error,
  ContractError,
  TransactionOptions,
  TransactionReceipt
} from './types';

export class Web3IdentityService {
  private provider: BrowserProvider | null = null;
  private signer: Signer | null = null;
  private contract: Contract | null = null;
  private readonly contractAddress: string;

  constructor(contractAddress?: string) {
    this.contractAddress = contractAddress || P2P_IDENTITY_REGISTRY_ADDRESS;
  }

  /**
   * Initialize Web3 connection and contract instance
   */
  async initialize(): Promise<void> {
    try {
      // Check if MetaMask or other Web3 provider is available
      if (!window.ethereum) {
        throw new Error('No Web3 provider found. Please install MetaMask.');
      }

      // Create provider and request account access
      this.provider = new ethers.BrowserProvider(window.ethereum);
      await this.provider.send("eth_requestAccounts", []);
      
      // Get signer
      this.signer = await this.provider.getSigner();
      
      // Create contract instance
      this.contract = new ethers.Contract(
        this.contractAddress,
        P2P_IDENTITY_REGISTRY_ABI,
        this.signer
      );

      console.log('Web3 Identity Service initialized successfully');
      console.log('Contract address:', this.contractAddress);
      console.log('User address:', await this.signer.getAddress());
    } catch (error) {
      console.error('Failed to initialize Web3 Identity Service:', error);
      throw error;
    }
  }

  /**
   * Connect to MetaMask wallet
   */
  async connectWallet(): Promise<{ success: boolean; address?: string; error?: string }> {
    try {
      if (!this.provider) {
        await this.initialize();
      }
      
      if (!this.signer) {
        throw new Error('Signer not available');
      }

      const address = await this.signer.getAddress();
      return { success: true, address };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to connect wallet' 
      };
    }
  }

  /**
   * Disconnect wallet
   */
  async disconnectWallet(): Promise<void> {
    this.provider = null;
    this.signer = null;
    this.contract = null;
  }

  /**
   * Check if wallet is connected
   */
  async isWalletConnected(): Promise<boolean> {
    return this.provider !== null && this.signer !== null;
  }

  /**
   * Get wallet information
   */
  async getWalletInfo(): Promise<WalletInfo> {
    if (!this.signer) {
      throw new Error('Wallet not connected');
    }

    const address = await this.signer.getAddress();
    const balance = await this.provider!.getBalance(address);
    
    // Try to get ENS name
    let ensName: string | undefined;
    try {
      ensName = await this.provider!.lookupAddress(address) || undefined;
    } catch {
      // ENS lookup failed, continue without it
    }

    return { address, balance, ensName };
  }

  /**
   * Get contract address
   */
  getContractAddress(): string {
    return this.contractAddress;
  }

  /**
   * Get current user address
   */
  async getUserAddress(): Promise<string> {
    if (!this.signer) {
      throw new Error('Wallet not connected');
    }
    return await this.signer.getAddress();
  }

  /**
   * Get network information
   */
  async getNetworkInfo(): Promise<NetworkInfo> {
    if (!this.provider) {
      throw new Error('Provider not initialized');
    }

    const network = await this.provider.getNetwork();
    const blockNumber = await this.provider.getBlockNumber();
    const gasPrice = (await this.provider.getFeeData()).gasPrice;
    
    return {
      chainId: Number(network.chainId),
      name: network.name,
      blockNumber,
      gasPrice: gasPrice || BigInt(0)
    };
  }

  /**
   * Verify a proof on-chain through the smart contract
   */
  async verifyProofOnChain(proofData: Web3ProofData): Promise<ContractVerificationResult> {
    if (!this.contract || !this.signer) {
      throw new Error('Contract not initialized or wallet not connected');
    }

    try {
      console.log('Verifying proof on-chain...', proofData);

      // Call the smart contract's verifyP2PProof function
      const tx = await this.contract.verifyP2PProof(
        proofData.proof,
        proofData.publicInputs,
        proofData.passkeySignature,
        proofData.proofType,
        proofData.nullifierHash,
        proofData.commitment
      );

      console.log('Transaction submitted:', tx.hash);

      // Wait for transaction confirmation
      const receipt = await tx.wait();
      
      if (receipt.status === 1) {
        // Find the ProofVerified event
        const proofVerifiedEvent = receipt.logs.find((log: any) => {
          try {
            const parsed = this.contract!.interface.parseLog(log);
            return parsed?.name === 'ProofVerified';
          } catch {
            return false;
          }
        });

        let proofHash = '';
        let timestamp = 0;

        if (proofVerifiedEvent) {
          const parsed = this.contract.interface.parseLog(proofVerifiedEvent);
          proofHash = parsed?.args.proofHash || '';
          timestamp = Number(parsed?.args.timestamp || 0);
        }

        return {
          isValid: true,
          proofHash,
          timestamp
        };
      } else {
        return {
          isValid: false,
          error: 'Transaction failed'
        };
      }
    } catch (error: any) {
      console.error('Proof verification failed:', error);
      
      // Parse custom error messages
      let errorMessage = 'Verification failed';
      if (error.reason) {
        errorMessage = error.reason;
      } else if (error.message.includes('InvalidProofType')) {
        errorMessage = 'Invalid proof type (must be 1-5)';
      } else if (error.message.includes('NullifierAlreadyUsed')) {
        errorMessage = 'This proof has already been used';
      } else if (error.message.includes('VerifierNotSet')) {
        errorMessage = 'Verifier contract not configured for this proof type';
      } else if (error.message.includes('InvalidZKProof')) {
        errorMessage = 'Invalid zero-knowledge proof';
      } else if (error.message.includes('InvalidPasskeySignature')) {
        errorMessage = 'Invalid passkey signature';
      }

      return {
        isValid: false,
        error: errorMessage
      };
    }
  }

  /**
   * Batch verify multiple proofs
   */
  async batchVerifyProofs(proofs: Web3ProofData[]): Promise<ContractVerificationResult[]> {
    if (!this.contract || !this.signer) {
      throw new Error('Contract not initialized or wallet not connected');
    }

    try {
      console.log('Batch verifying proofs...', proofs.length);

      // Prepare batch data
      const batchProofs = proofs.map(p => p.proof);
      const batchPublicInputs = proofs.map(p => p.publicInputs);
      const batchPasskeySignatures = proofs.map(p => p.passkeySignature);
      const batchProofTypes = proofs.map(p => p.proofType);
      const batchNullifierHashes = proofs.map(p => p.nullifierHash);
      const batchCommitments = proofs.map(p => p.commitment);

      // Call batch verification
      const tx = await this.contract.batchVerifyProofs(
        batchProofs,
        batchPublicInputs,
        batchPasskeySignatures,
        batchProofTypes,
        batchNullifierHashes,
        batchCommitments
      );

      const receipt = await tx.wait();
      
      // The function returns bool[] so we need to parse the return value
      // For now, return based on transaction success
      const results: ContractVerificationResult[] = proofs.map(() => ({
        isValid: receipt.status === 1
      }));

      return results;
    } catch (error: any) {
      console.error('Batch verification failed:', error);
      return proofs.map(() => ({
        isValid: false,
        error: error.message || 'Batch verification failed'
      }));
    }
  }

  /**
   * Check if user has valid proof for specific type
   */
  async hasValidProof(userAddress: string, proofType: number): Promise<boolean> {
    if (!this.contract) {
      throw new Error('Contract not initialized');
    }

    try {
      return await this.contract.hasValidProof(userAddress, proofType);
    } catch (error) {
      console.error('Failed to check proof validity:', error);
      return false;
    }
  }

  /**
   * Get user's proof status for all types
   */
  async getUserProofStatus(userAddress: string): Promise<{
    hasProof: boolean[];
    timestamps: number[];
  }> {
    if (!this.contract) {
      throw new Error('Contract not initialized');
    }

    try {
      const result = await this.contract.getUserProofStatus(userAddress);
      return {
        hasProof: result.hasProof,
        timestamps: result.timestamps.map((t: bigint) => Number(t))
      };
    } catch (error) {
      console.error('Failed to get user proof status:', error);
      return {
        hasProof: [false, false, false, false, false],
        timestamps: [0, 0, 0, 0, 0]
      };
    }
  }

  /**
   * Verify Merkle inclusion proof
   */
  async verifyMerkleInclusion(
    leaf: string,
    proof: string[],
    index: number
  ): Promise<boolean> {
    if (!this.contract) {
      throw new Error('Contract not initialized');
    }

    try {
      return await this.contract.verifyMerkleInclusion(leaf, proof, index);
    } catch (error) {
      console.error('Failed to verify Merkle inclusion:', error);
      return false;
    }
  }

  /**
   * Get contract events (for monitoring)
   */
  async getProofVerifiedEvents(userAddress?: string): Promise<any[]> {
    if (!this.contract) {
      throw new Error('Contract not initialized');
    }

    try {
      const filter = this.contract.filters.ProofVerified(userAddress || null);
      const events = await this.contract.queryFilter(filter, -1000); // Last 1000 blocks
      
      return events.map(event => {
        // Check if event has args property (EventLog type)
        if ('args' in event && event.args) {
          return {
            user: event.args.user,
            proofType: Number(event.args.proofType),
            proofHash: event.args.proofHash,
            nullifierHash: event.args.nullifierHash,
            timestamp: Number(event.args.timestamp),
            blockNumber: event.blockNumber,
            transactionHash: event.transactionHash
          };
        } else {
          // Fallback for Log type events
          const parsed = this.contract!.interface.parseLog(event);
          return {
            user: parsed?.args?.user || '',
            proofType: Number(parsed?.args?.proofType || 0),
            proofHash: parsed?.args?.proofHash || '',
            nullifierHash: parsed?.args?.nullifierHash || '',
            timestamp: Number(parsed?.args?.timestamp || 0),
            blockNumber: event.blockNumber,
            transactionHash: event.transactionHash
          };
        }
      });
    } catch (error) {
      console.error('Failed to get events:', error);
      return [];
    }
  }

  /**
   * Estimate gas for proof verification
   */
  async estimateVerificationGas(proofData: Web3ProofData): Promise<bigint> {
    if (!this.contract) {
      throw new Error('Contract not initialized');
    }

    try {
      return await this.contract.verifyP2PProof.estimateGas(
        proofData.proof,
        proofData.publicInputs,
        proofData.passkeySignature,
        proofData.proofType,
        proofData.nullifierHash,
        proofData.commitment
      );
    } catch (error) {
      console.error('Failed to estimate gas:', error);
      return BigInt(500000); // Default estimate
    }
  }

  /**
   * Disconnect wallet
   */
  disconnect(): void {
    this.provider = null;
    this.signer = null;
    this.contract = null;
    console.log('Web3 Identity Service disconnected');
  }
}

// Singleton instance
export const web3IdentityService = new Web3IdentityService();
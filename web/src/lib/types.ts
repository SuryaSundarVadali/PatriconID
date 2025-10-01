// Global type declarations for Web3 integration

declare global {
  interface Window {
    ethereum?: {
      isMetaMask?: boolean;
      request: (args: { method: string; params?: any[] }) => Promise<any>;
      on: (event: string, handler: (...args: any[]) => void) => void;
      removeListener: (event: string, handler: (...args: any[]) => void) => void;
      selectedAddress: string | null;
    };
  }
}

// Ethers.js event types
export interface EthersEvent {
  args?: {
    user?: string;
    proofType?: bigint;
    proofHash?: string;
    nullifierHash?: string;
    timestamp?: bigint;
    commitment?: string;
    [key: string]: any;
  };
  blockNumber: number;
  transactionHash: string;
  address: string;
  topics: string[];
  data: string;
}

// P2P Proof related types
export interface ZKProofData {
  proof: string;
  public_signals: string[];
  nullifier_hash: string;
  commitment: string;
  signature: string;
  timestamp: number;
}

export interface ProofGenerationRequest {
  proofType: number;
  idData: {
    birthdate?: number;
    nationality?: number;
    residency_code?: number;
    document_hash?: string;
    credit_score?: number;
  };
  challenge: {
    current_date: number;
    min_age?: number;
    required_nationality?: number;
    required_residency?: number;
    min_credit_score?: number;
    nullifier_secret: string;
  };
}

export interface Web3ProofData {
  proof: string;
  publicInputs: string[];
  passkeySignature: string;
  proofType: number;
  nullifierHash: string;
  commitment: string;
}

export interface ContractVerificationResult {
  isValid: boolean;
  proofHash?: string;
  timestamp?: number;
  error?: string;
  transactionHash?: string;
  blockNumber?: number;
  gasUsed?: bigint;
}

export interface UserProofStatus {
  hasProof: boolean[];
  timestamps: number[];
  proofHashes: string[];
}

export interface NetworkInfo {
  chainId: number;
  name: string;
  blockNumber?: number;
  gasPrice?: bigint;
}

export interface WalletInfo {
  address: string;
  balance: bigint;
  ensName?: string;
}

// Event listener types
export type ProofVerifiedEventHandler = (event: {
  user: string;
  proofType: number;
  proofHash: string;
  nullifierHash: string;
  timestamp: number;
}) => void;

export type CommitmentRegisteredEventHandler = (event: {
  commitment: string;
  user: string;
  timestamp: number;
}) => void;

// Error types
export interface Web3Error extends Error {
  code?: number;
  reason?: string;
  action?: string;
  transaction?: any;
}

export interface ContractError extends Error {
  errorName?: string;
  errorArgs?: any[];
  method?: string;
  transaction?: any;
}

// Transaction types
export interface TransactionOptions {
  gasLimit?: bigint;
  gasPrice?: bigint;
  value?: bigint;
  nonce?: number;
}

export interface TransactionReceipt {
  status: number;
  transactionHash: string;
  blockNumber: number;
  gasUsed: bigint;
  effectiveGasPrice: bigint;
  logs: any[];
}

export {}; // Make this a module
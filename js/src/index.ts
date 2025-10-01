// PatriconID TypeScript SDK
// Main entry point for P2P identity verification

export { P2PProofService } from './p2p-proof-service'
export { IdentityVerifier } from './identity-verifier'
export { CryptoUtils } from './crypto-utils'
export { StorageManager } from './storage-manager'

// Type definitions
export interface IdentityProof {
  id: string
  type: 'age' | 'residency' | 'nationality' | 'credit_score'
  proof: Uint8Array
  publicInputs: string[]
  nullifier: string
  commitment: string
  timestamp: number
  expiresAt?: number
}

export interface ProofRequest {
  requiredFields: string[]
  minAge?: number
  allowedCountries?: string[]
  minCreditScore?: number
  challenge?: string
}

export interface VerificationResult {
  isValid: boolean
  proofType: string
  verifiedFields: string[]
  timestamp: number
  error?: string
}

export interface P2PSession {
  id: string
  peerId: string
  proofRequest: ProofRequest
  status: 'pending' | 'completed' | 'failed' | 'expired'
  createdAt: number
  expiresAt: number
}

export interface WebAuthnCredential {
  id: string
  publicKey: Uint8Array
  counter: number
  createdAt: number
}

// Configuration
export interface PatriconConfig {
  rpcUrl?: string
  contractAddress?: string
  wasmPath?: string
  enableLogging?: boolean
  storagePrefix?: string
}

// Error types
export class PatriconError extends Error {
  constructor(message: string, public code: string) {
    super(message)
    this.name = 'PatriconError'
  }
}

export class ProofGenerationError extends PatriconError {
  constructor(message: string) {
    super(message, 'PROOF_GENERATION_ERROR')
  }
}

export class VerificationError extends PatriconError {
  constructor(message: string) {
    super(message, 'VERIFICATION_ERROR')
  }
}

export class StorageError extends PatriconError {
  constructor(message: string) {
    super(message, 'STORAGE_ERROR')
  }
}

// Constants
export const SUPPORTED_PROOF_TYPES = ['age', 'residency', 'nationality', 'credit_score'] as const
export const DEFAULT_PROOF_EXPIRY = 24 * 60 * 60 * 1000 // 24 hours
export const MAX_PROOF_SIZE = 1024 * 1024 // 1MB
export const CURRENT_VERSION = '1.0.0'
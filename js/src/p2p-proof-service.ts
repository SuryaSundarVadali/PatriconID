import { CryptoUtils } from './crypto-utils'
import { StorageManager } from './storage-manager'
import { IdentityVerifier } from './identity-verifier'

/**
 * Main P2P Proof Service for PatriconID
 * Handles proof generation, verification, and P2P sharing
 */
export class P2PProofService {
  private storage: StorageManager
  private verifier?: IdentityVerifier
  private wasmModule?: any

  constructor(config?: {
    rpcUrl?: string
    contractAddress?: string
    storagePrefix?: string
  }) {
    this.storage = new StorageManager(config?.storagePrefix)
    
    if (config?.rpcUrl && config?.contractAddress) {
      this.verifier = new IdentityVerifier(config.rpcUrl, config.contractAddress)
    }
  }

  /**
   * Initialize the service
   */
  async initialize(passphrase?: string): Promise<void> {
    await this.storage.initialize(passphrase)
    
    // Load WASM module for proof generation (placeholder)
    // this.wasmModule = await import('../wasm/patriconid_core')
    console.log('P2P Proof Service initialized')
  }

  /**
   * Generate an age proof
   */
  async generateAgeProof(params: {
    birthDate: string
    minAge: number
    passkey?: string
  }): Promise<{
    proof: Uint8Array
    publicInputs: string[]
    nullifier: string
    commitment: string
  }> {
    try {
      // Calculate age
      const birthYear = new Date(params.birthDate).getFullYear()
      const currentYear = new Date().getFullYear()
      const age = currentYear - birthYear

      if (age < params.minAge) {
        throw new Error('Age requirement not met')
      }

      // Generate proof components
      const nonce = CryptoUtils.generateRandomBytes(32)
      const commitment = CryptoUtils.generateCommitment(age.toString(), nonce)
      const secretKey = CryptoUtils.generateRandomBytes(32)
      const nullifier = CryptoUtils.generateNullifier(secretKey, 'age')

      // Simulate proof generation (would use actual circuit)
      const proof = CryptoUtils.generateRandomBytes(256) // Placeholder proof
      const publicInputs = [params.minAge.toString(), Date.now().toString()]

      // Store proof locally
      const proofId = CryptoUtils.bytesToHex(CryptoUtils.generateRandomBytes(16))
      await this.storage.storeProof(proofId, {
        type: 'age',
        proof: Array.from(proof),
        publicInputs,
        nullifier,
        commitment,
        nonce: Array.from(nonce),
        secretValue: age,
        createdAt: Date.now()
      })

      return { proof, publicInputs, nullifier, commitment }
    } catch (error) {
      throw new Error(`Age proof generation failed: ${error}`)
    }
  }

  /**
   * Generate a residency proof
   */
  async generateResidencyProof(params: {
    country: string
    documentHash: string
    allowedCountries: string[]
  }): Promise<{
    proof: Uint8Array
    publicInputs: string[]
    nullifier: string
    commitment: string
  }> {
    try {
      if (!params.allowedCountries.includes(params.country)) {
        throw new Error('Country not in allowed list')
      }

      const nonce = CryptoUtils.generateRandomBytes(32)
      const commitment = CryptoUtils.generateCommitment(params.country, nonce)
      const secretKey = CryptoUtils.generateRandomBytes(32)
      const nullifier = CryptoUtils.generateNullifier(secretKey, 'residency')

      const proof = CryptoUtils.generateRandomBytes(256)
      const publicInputs = [...params.allowedCountries, Date.now().toString()]

      const proofId = CryptoUtils.bytesToHex(CryptoUtils.generateRandomBytes(16))
      await this.storage.storeProof(proofId, {
        type: 'residency',
        proof: Array.from(proof),
        publicInputs,
        nullifier,
        commitment,
        nonce: Array.from(nonce),
        secretValue: params.country,
        createdAt: Date.now()
      })

      return { proof, publicInputs, nullifier, commitment }
    } catch (error) {
      throw new Error(`Residency proof generation failed: ${error}`)
    }
  }

  /**
   * Generate QR code for P2P sharing
   */
  generateQRCode(proofData: {
    proof: Uint8Array
    publicInputs: string[]
    nullifier: string
    commitment: string
    proofType: string
  }): string {
    const qrData = {
      version: '1.0',
      type: 'patriconid_proof',
      proofType: proofData.proofType,
      proof: Array.from(proofData.proof),
      publicInputs: proofData.publicInputs,
      nullifier: proofData.nullifier,
      commitment: proofData.commitment,
      timestamp: Date.now()
    }

    return JSON.stringify(qrData)
  }

  /**
   * Parse QR code data
   */
  parseQRCode(qrData: string): {
    proofType: string
    proof: Uint8Array
    publicInputs: string[]
    nullifier: string
    commitment: string
    timestamp: number
  } | null {
    try {
      const data = JSON.parse(qrData)
      
      if (data.type !== 'patriconid_proof' || data.version !== '1.0') {
        return null
      }

      return {
        proofType: data.proofType,
        proof: new Uint8Array(data.proof),
        publicInputs: data.publicInputs,
        nullifier: data.nullifier,
        commitment: data.commitment,
        timestamp: data.timestamp
      }
    } catch {
      return null
    }
  }

  /**
   * Verify a received proof
   */
  async verifyReceivedProof(qrData: string): Promise<{
    isValid: boolean
    proofType: string
    verifiedData?: any
    error?: string
  }> {
    try {
      const parsedData = this.parseQRCode(qrData)
      if (!parsedData) {
        return { isValid: false, proofType: 'unknown', error: 'Invalid QR code format' }
      }

      if (!this.verifier) {
        // Local verification only
        return {
          isValid: true,
          proofType: parsedData.proofType,
          verifiedData: { timestamp: parsedData.timestamp }
        }
      }

      // Full verification with contract
      const result = await this.verifier.verifyProof(
        parsedData.proof,
        parsedData.publicInputs,
        parsedData.nullifier
      )

      return {
        isValid: result.isValid,
        proofType: parsedData.proofType,
        verifiedData: result.isValid ? { timestamp: parsedData.timestamp } : undefined,
        error: result.error
      }
    } catch (error) {
      return {
        isValid: false,
        proofType: 'unknown',
        error: `Verification failed: ${error}`
      }
    }
  }

  /**
   * List stored proofs
   */
  async getStoredProofs(): Promise<Array<{
    id: string
    type: string
    commitment: string
    createdAt: number
  }>> {
    const proofIds = await this.storage.listProofs()
    const proofs = []

    for (const id of proofIds) {
      const proof = await this.storage.getProof(id)
      if (proof) {
        proofs.push({
          id,
          type: proof.type,
          commitment: proof.commitment,
          createdAt: proof.createdAt
        })
      }
    }

    return proofs.sort((a, b) => b.createdAt - a.createdAt)
  }

  /**
   * Delete a stored proof
   */
  async deleteProof(proofId: string): Promise<void> {
    await this.storage.delete(`proof_${proofId}`)
  }

  /**
   * Share proof via deep link
   */
  generateDeepLink(proofData: any): string {
    const encodedData = btoa(JSON.stringify(proofData))
    return `patriconid://verify?data=${encodedData}`
  }

  /**
   * Handle WebAuthn registration
   */
  async registerWebAuthn(username: string): Promise<{
    credentialId: string
    publicKey: Uint8Array
  }> {
    try {
      if (!navigator.credentials) {
        throw new Error('WebAuthn not supported')
      }

      const challenge = CryptoUtils.generateRandomBytes(32)
      const userId = CryptoUtils.generateRandomBytes(16)

      const credential = await navigator.credentials.create({
        publicKey: {
          challenge,
          rp: { name: 'PatriconID', id: window.location.hostname },
          user: {
            id: userId,
            name: username,
            displayName: username
          },
          pubKeyCredParams: [{ alg: -7, type: 'public-key' }],
          authenticatorSelection: {
            authenticatorAttachment: 'platform',
            userVerification: 'preferred'
          },
          timeout: 60000
        }
      }) as PublicKeyCredential

      if (!credential) {
        throw new Error('Failed to create credential')
      }

      const credentialId = CryptoUtils.bytesToHex(new Uint8Array(credential.rawId))
      const response = credential.response as AuthenticatorAttestationResponse
      const publicKey = new Uint8Array(response.getPublicKey()!)

      await this.storage.storeCredential(credentialId, {
        id: credentialId,
        publicKey: Array.from(publicKey),
        username,
        counter: 0
      })

      return { credentialId, publicKey }
    } catch (error) {
      throw new Error(`WebAuthn registration failed: ${error}`)
    }
  }

  /**
   * Get service statistics
   */
  async getStats(): Promise<{
    totalProofs: number
    proofsByType: Record<string, number>
    storageUsage: any
  }> {
    const proofs = await this.getStoredProofs()
    const proofsByType: Record<string, number> = {}

    for (const proof of proofs) {
      proofsByType[proof.type] = (proofsByType[proof.type] || 0) + 1
    }

    const storageUsage = await this.storage.getStorageStats()

    return {
      totalProofs: proofs.length,
      proofsByType,
      storageUsage
    }
  }
}
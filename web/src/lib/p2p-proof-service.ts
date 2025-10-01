// P2P Proof Service TypeScript SDK wrapper
// Provides TypeScript bindings for the Rust/WASM P2P service

export interface P2PProofRequest {
  proof_type: number // 1=age, 2=residency, 3=nationality, 4=credit, 5=composite
  challenge: ProofChallenge
  verifier_address: string
  nonce: string
}

export interface ProofChallenge {
  current_date: number
  min_age: number
  required_nationality: number
  required_residency: number
  min_credit_score: number
  nullifier_secret: string
}

export interface P2PProofResponse {
  proof: string
  public_signals: string[]
  signature: string
  nullifier_hash: string
  commitment: string
  timestamp: number
}

export interface IDData {
  birthdate: number
  nationality: number
  residency_code: number
  document_hash: string
  credit_score: number
}

// Mock implementation for development - replace with actual WASM bindings
export class P2PProofService {
  private initialized = false

  async initialize(): Promise<void> {
    // In production, this would load the WASM module
    await new Promise(resolve => setTimeout(resolve, 1000))
    this.initialized = true
    console.log('P2P Proof Service initialized')
  }

  async generate_proof(
    id_data_json: string,
    challenge_json: string,
    proof_type: number
  ): Promise<string> {
    if (!this.initialized) {
      throw new Error('Service not initialized')
    }

    // Simulate proof generation (target <2s)
    await new Promise(resolve => setTimeout(resolve, 1500))

    const id_data: IDData = JSON.parse(id_data_json)
    const challenge: ProofChallenge = JSON.parse(challenge_json)

    // Generate mock proof response
    const response: P2PProofResponse = {
      proof: `0x${Array(128).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('')}`,
      public_signals: [
        proof_type.toString(),
        `nullifier_${Math.random().toString(36).substr(2, 9)}`,
        'merkle_root_placeholder',
        `commitment_${Math.random().toString(36).substr(2, 9)}`
      ],
      signature: `passkey_sig_${Math.random().toString(36).substr(2, 16)}`,
      nullifier_hash: `nullifier_${Math.random().toString(36).substr(2, 9)}`,
      commitment: `commitment_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now()
    }

    return JSON.stringify(response)
  }

  async verify_proof(
    proof_json: string,
    verifier_public_key: string
  ): Promise<boolean> {
    if (!this.initialized) {
      throw new Error('Service not initialized')
    }

    // Simulate verification
    await new Promise(resolve => setTimeout(resolve, 500))
    
    try {
      const proof: P2PProofResponse = JSON.parse(proof_json)
      
      // Basic validation
      const hasValidProof = proof.proof && proof.proof.length > 0
      const hasValidSignature = proof.signature && proof.signature.includes('passkey_sig')
      const hasValidNullifier = proof.nullifier_hash && proof.nullifier_hash.length > 0
      
      return Boolean(hasValidProof && hasValidSignature && hasValidNullifier)
    } catch (error) {
      console.error('Proof verification failed:', error)
      return false
    }
  }

  async send_proof_p2p(
    proof_json: string,
    channel: string,
    recipient: string
  ): Promise<string> {
    if (!this.initialized) {
      throw new Error('Service not initialized')
    }

    // Simulate P2P sending
    await new Promise(resolve => setTimeout(resolve, 300))

    switch (channel) {
      case 'qr':
        return `patricon://verify?proof=${btoa(proof_json)}`
      case 'walletconnect':
        return `Sent to ${recipient} via WalletConnect`
      case 'direct':
        return `Sent to ${recipient} via direct P2P channel`
      default:
        throw new Error(`Unsupported channel: ${channel}`)
    }
  }

  // WebAuthn/Passkey integration
  async register_passkey(): Promise<boolean> {
    try {
      const credential = await navigator.credentials.create({
        publicKey: {
          challenge: crypto.getRandomValues(new Uint8Array(32)),
          rp: {
            name: "PatriconID P2P",
            id: window.location.hostname,
          },
          user: {
            id: crypto.getRandomValues(new Uint8Array(32)),
            name: "p2p-user@patriconidd.com",
            displayName: "P2P User",
          },
          pubKeyCredParams: [{ alg: -7, type: "public-key" }],
          authenticatorSelection: {
            authenticatorAttachment: "platform",
            userVerification: "required",
          },
        },
      })

      return credential !== null
    } catch (error) {
      console.error('Passkey registration failed:', error)
      return false
    }
  }

  async authenticate_passkey(): Promise<boolean> {
    try {
      const assertion = await navigator.credentials.get({
        publicKey: {
          challenge: crypto.getRandomValues(new Uint8Array(32)),
          userVerification: "required",
        },
      })

      return assertion !== null
    } catch (error) {
      console.error('Passkey authentication failed:', error)
      return false
    }
  }

  // NFC scanning for document data
  async scan_nfc_document(): Promise<IDData | null> {
    try {
      // @ts-ignore - NFC API
      if ('NDEFReader' in window) {
        // @ts-ignore
        const ndef = new NDEFReader()
        await ndef.scan()
        
        // Mock NFC data for development
        return {
          birthdate: 19950615,
          nationality: 840, // US
          residency_code: 840,
          document_hash: `0x${Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('')}`,
          credit_score: 750
        }
      } else {
        throw new Error('NFC not supported')
      }
    } catch (error) {
      console.error('NFC scan failed:', error)
      return null
    }
  }

  // Local storage for nullifier tracking (anti-replay)
  private getNullifierKey(nullifier: string): string {
    return `patricon_nullifier_${nullifier}`
  }

  async check_nullifier_used(nullifier: string): Promise<boolean> {
    const key = this.getNullifierKey(nullifier)
    const used = localStorage.getItem(key)
    return used !== null
  }

  async mark_nullifier_used(nullifier: string): Promise<void> {
    const key = this.getNullifierKey(nullifier)
    localStorage.setItem(key, Date.now().toString())
  }

  // Secure key storage for ZK keys
  async store_zk_key(key: string, value: string): Promise<void> {
    // In production, use secure storage (Web Crypto API, IndexedDB with encryption)
    localStorage.setItem(`patricon_zk_${key}`, value)
  }

  async retrieve_zk_key(key: string): Promise<string | null> {
    return localStorage.getItem(`patricon_zk_${key}`)
  }
}
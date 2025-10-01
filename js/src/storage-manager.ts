import { CryptoUtils } from './crypto-utils'

/**
 * Storage manager for secure local storage of identity proofs and keys
 */
export class StorageManager {
  private prefix: string
  private encryptionKey?: Uint8Array

  constructor(prefix: string = 'patriconid_') {
    this.prefix = prefix
  }

  /**
   * Initialize storage with encryption key
   */
  async initialize(passphrase?: string): Promise<void> {
    if (passphrase) {
      const salt = this.getSalt()
      this.encryptionKey = CryptoUtils.deriveKey(passphrase, salt)
    }
  }

  /**
   * Store data securely
   */
  async store(key: string, data: any): Promise<void> {
    try {
      const serialized = JSON.stringify(data)
      const dataBytes = new TextEncoder().encode(serialized)
      
      let finalData: Uint8Array
      if (this.encryptionKey) {
        finalData = CryptoUtils.xorCrypt(dataBytes, this.encryptionKey)
      } else {
        finalData = dataBytes
      }
      
      const base64Data = btoa(String.fromCharCode(...finalData))
      localStorage.setItem(this.prefix + key, base64Data)
    } catch (error) {
      throw new Error(`Failed to store data: ${error}`)
    }
  }

  /**
   * Retrieve data securely
   */
  async retrieve<T>(key: string): Promise<T | null> {
    try {
      const base64Data = localStorage.getItem(this.prefix + key)
      if (!base64Data) return null
      
      const dataBytes = new Uint8Array(
        atob(base64Data).split('').map(char => char.charCodeAt(0))
      )
      
      let finalData: Uint8Array
      if (this.encryptionKey) {
        finalData = CryptoUtils.xorCrypt(dataBytes, this.encryptionKey)
      } else {
        finalData = dataBytes
      }
      
      const serialized = new TextDecoder().decode(finalData)
      return JSON.parse(serialized)
    } catch (error) {
      console.error('Failed to retrieve data:', error)
      return null
    }
  }

  /**
   * Delete stored data
   */
  async delete(key: string): Promise<void> {
    localStorage.removeItem(this.prefix + key)
  }

  /**
   * List all stored keys
   */
  async listKeys(): Promise<string[]> {
    const keys: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith(this.prefix)) {
        keys.push(key.substring(this.prefix.length))
      }
    }
    return keys
  }

  /**
   * Clear all stored data
   */
  async clear(): Promise<void> {
    const keys = await this.listKeys()
    for (const key of keys) {
      await this.delete(key)
    }
  }

  /**
   * Store WebAuthn credential securely
   */
  async storeCredential(credentialId: string, credential: any): Promise<void> {
    await this.store(`credential_${credentialId}`, {
      ...credential,
      createdAt: Date.now()
    })
  }

  /**
   * Retrieve WebAuthn credential
   */
  async getCredential(credentialId: string): Promise<any | null> {
    return await this.retrieve(`credential_${credentialId}`)
  }

  /**
   * Store identity proof
   */
  async storeProof(proofId: string, proof: any): Promise<void> {
    await this.store(`proof_${proofId}`, {
      ...proof,
      storedAt: Date.now()
    })
  }

  /**
   * Retrieve identity proof
   */
  async getProof(proofId: string): Promise<any | null> {
    return await this.retrieve(`proof_${proofId}`)
  }

  /**
   * List all stored proofs
   */
  async listProofs(): Promise<string[]> {
    const keys = await this.listKeys()
    return keys.filter(key => key.startsWith('proof_')).map(key => key.substring(6))
  }

  /**
   * Store P2P session data
   */
  async storeSession(sessionId: string, session: any): Promise<void> {
    await this.store(`session_${sessionId}`, session)
  }

  /**
   * Retrieve P2P session data
   */
  async getSession(sessionId: string): Promise<any | null> {
    return await this.retrieve(`session_${sessionId}`)
  }

  /**
   * Store user preferences
   */
  async storePreferences(preferences: any): Promise<void> {
    await this.store('preferences', preferences)
  }

  /**
   * Retrieve user preferences
   */
  async getPreferences(): Promise<any | null> {
    return await this.retrieve('preferences')
  }

  /**
   * Get or generate salt for key derivation
   */
  private getSalt(): Uint8Array {
    const stored = localStorage.getItem(this.prefix + 'salt')
    if (stored) {
      return new Uint8Array(atob(stored).split('').map(char => char.charCodeAt(0)))
    }
    
    const salt = CryptoUtils.generateRandomBytes(32)
    const base64Salt = btoa(String.fromCharCode(...salt))
    localStorage.setItem(this.prefix + 'salt', base64Salt)
    return salt
  }

  /**
   * Check if storage is available
   */
  static isAvailable(): boolean {
    try {
      const testKey = '__patriconid_test__'
      localStorage.setItem(testKey, 'test')
      localStorage.removeItem(testKey)
      return true
    } catch {
      return false
    }
  }

  /**
   * Get storage usage statistics
   */
  async getStorageStats(): Promise<{
    totalKeys: number
    totalSize: number
    proofs: number
    credentials: number
    sessions: number
  }> {
    const keys = await this.listKeys()
    let totalSize = 0
    let proofs = 0
    let credentials = 0
    let sessions = 0

    for (const key of keys) {
      const data = localStorage.getItem(this.prefix + key)
      if (data) {
        totalSize += data.length
        
        if (key.startsWith('proof_')) proofs++
        else if (key.startsWith('credential_')) credentials++
        else if (key.startsWith('session_')) sessions++
      }
    }

    return {
      totalKeys: keys.length,
      totalSize,
      proofs,
      credentials,
      sessions
    }
  }
}
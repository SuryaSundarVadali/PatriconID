import { sha256 } from '@noble/hashes/sha256'
import { secp256k1 } from '@noble/secp256k1'
import { randomBytes } from '@noble/hashes/utils'

/**
 * Cryptographic utilities for PatriconID P2P operations
 */
export class CryptoUtils {
  /**
   * Generate a cryptographically secure random byte array
   */
  static generateRandomBytes(length: number): Uint8Array {
    return randomBytes(length)
  }

  /**
   * Hash data using SHA-256
   */
  static hash(data: Uint8Array): Uint8Array {
    return sha256(data)
  }

  /**
   * Generate a commitment for selective disclosure
   */
  static generateCommitment(value: string, nonce: Uint8Array): string {
    const valueBytes = new TextEncoder().encode(value)
    const combined = new Uint8Array(valueBytes.length + nonce.length)
    combined.set(valueBytes)
    combined.set(nonce, valueBytes.length)
    
    const hash = this.hash(combined)
    return Array.from(hash, byte => byte.toString(16).padStart(2, '0')).join('')
  }

  /**
   * Generate a nullifier to prevent double-spending/replay attacks
   */
  static generateNullifier(secretKey: Uint8Array, proofType: string): string {
    const typeBytes = new TextEncoder().encode(proofType)
    const combined = new Uint8Array(secretKey.length + typeBytes.length)
    combined.set(secretKey)
    combined.set(typeBytes, secretKey.length)
    
    const hash = this.hash(combined)
    return Array.from(hash, byte => byte.toString(16).padStart(2, '0')).join('')
  }

  /**
   * Generate secp256k1 key pair
   */
  static generateKeyPair(): { privateKey: Uint8Array; publicKey: Uint8Array } {
    const privateKey = secp256k1.utils.randomPrivateKey()
    const publicKey = secp256k1.getPublicKey(privateKey)
    
    return { privateKey, publicKey }
  }

  /**
   * Sign data with secp256k1
   */
  static sign(data: Uint8Array, privateKey: Uint8Array): Uint8Array {
    const hash = this.hash(data)
    const signature = secp256k1.sign(hash, privateKey)
    return signature.toCompactRawBytes()
  }

  /**
   * Verify secp256k1 signature
   */
  static verify(data: Uint8Array, signature: Uint8Array, publicKey: Uint8Array): boolean {
    try {
      const hash = this.hash(data)
      const sig = secp256k1.Signature.fromCompact(signature)
      return secp256k1.verify(sig, hash, publicKey)
    } catch {
      return false
    }
  }

  /**
   * Derive deterministic key from passphrase
   */
  static deriveKey(passphrase: string, salt: Uint8Array): Uint8Array {
    const passphraseBytes = new TextEncoder().encode(passphrase)
    const combined = new Uint8Array(passphraseBytes.length + salt.length)
    combined.set(passphraseBytes)
    combined.set(salt, passphraseBytes.length)
    
    // Simple key derivation - in production, use PBKDF2 or Argon2
    let derived = this.hash(combined)
    for (let i = 0; i < 1000; i++) {
      derived = this.hash(derived)
    }
    
    return derived.slice(0, 32) // 256-bit key
  }

  /**
   * XOR encryption/decryption (for simple data protection)
   */
  static xorCrypt(data: Uint8Array, key: Uint8Array): Uint8Array {
    const result = new Uint8Array(data.length)
    for (let i = 0; i < data.length; i++) {
      result[i] = data[i] ^ key[i % key.length]
    }
    return result
  }

  /**
   * Generate Merkle tree leaf hash for registry inclusion
   */
  static merkleLeaf(commitment: string, nullifier: string): string {
    const commitmentBytes = new TextEncoder().encode(commitment)
    const nullifierBytes = new TextEncoder().encode(nullifier)
    const combined = new Uint8Array(commitmentBytes.length + nullifierBytes.length)
    combined.set(commitmentBytes)
    combined.set(nullifierBytes, commitmentBytes.length)
    
    const hash = this.hash(combined)
    return Array.from(hash, byte => byte.toString(16).padStart(2, '0')).join('')
  }

  /**
   * Verify Merkle inclusion proof
   */
  static verifyMerkleProof(
    leaf: string,
    proof: string[],
    root: string,
    index: number
  ): boolean {
    let currentHash = leaf
    let currentIndex = index

    for (const sibling of proof) {
      const left = currentIndex % 2 === 0 ? currentHash : sibling
      const right = currentIndex % 2 === 0 ? sibling : currentHash
      
      const leftBytes = new TextEncoder().encode(left)
      const rightBytes = new TextEncoder().encode(right)
      const combined = new Uint8Array(leftBytes.length + rightBytes.length)
      combined.set(leftBytes)
      combined.set(rightBytes, leftBytes.length)
      
      const hash = this.hash(combined)
      currentHash = Array.from(hash, byte => byte.toString(16).padStart(2, '0')).join('')
      currentIndex = Math.floor(currentIndex / 2)
    }

    return currentHash === root
  }

  /**
   * Convert hex string to Uint8Array
   */
  static hexToBytes(hex: string): Uint8Array {
    const bytes = new Uint8Array(hex.length / 2)
    for (let i = 0; i < hex.length; i += 2) {
      bytes[i / 2] = parseInt(hex.substr(i, 2), 16)
    }
    return bytes
  }

  /**
   * Convert Uint8Array to hex string
   */
  static bytesToHex(bytes: Uint8Array): string {
    return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('')
  }
}
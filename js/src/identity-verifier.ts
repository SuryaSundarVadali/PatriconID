import { ethers } from 'ethers'
import { CryptoUtils } from './crypto-utils'

/**
 * Identity verifier for validating P2P proofs
 */
export class IdentityVerifier {
  private provider: ethers.Provider
  private contractAddress: string
  private contractABI: string[]

  constructor(rpcUrl: string, contractAddress: string) {
    this.provider = new ethers.JsonRpcProvider(rpcUrl)
    this.contractAddress = contractAddress
    this.contractABI = [
      // P2P Identity Registry ABI
      'function verifyProof(bytes memory proof, uint256[] memory publicInputs) public view returns (bool)',
      'function isNullifierUsed(bytes32 nullifier) public view returns (bool)',
      'function getMerkleRoot() public view returns (bytes32)',
      'function verifyInclusion(bytes32 leaf, bytes32[] memory proof, uint256 index) public view returns (bool)'
    ]
  }

  /**
   * Verify a zero-knowledge proof
   */
  async verifyProof(
    proof: Uint8Array,
    publicInputs: string[],
    nullifier: string
  ): Promise<{ isValid: boolean; error?: string }> {
    try {
      const contract = new ethers.Contract(this.contractAddress, this.contractABI, this.provider)
      
      // Check if nullifier has been used (prevent replay attacks)
      const nullifierHash = ethers.keccak256(ethers.toUtf8Bytes(nullifier))
      const isNullifierUsed = await contract.isNullifierUsed(nullifierHash)
      
      if (isNullifierUsed) {
        return { isValid: false, error: 'Nullifier already used' }
      }

      // Verify the proof on-chain
      const isValid = await contract.verifyProof(proof, publicInputs)
      
      return { isValid, error: isValid ? undefined : 'Proof verification failed' }
    } catch (error) {
      return { isValid: false, error: `Verification error: ${error}` }
    }
  }

  /**
   * Verify proof locally (for P2P scenarios)
   */
  async verifyProofLocal(
    proof: Uint8Array,
    publicInputs: string[],
    verificationKey: Uint8Array
  ): Promise<{ isValid: boolean; error?: string }> {
    try {
      // This would typically use a WASM-compiled verifier
      // For now, we'll simulate the verification
      console.log('Local verification - proof:', proof.length, 'bytes')
      console.log('Public inputs:', publicInputs)
      console.log('Verification key:', verificationKey.length, 'bytes')
      
      // In a real implementation, this would:
      // 1. Load the Barretenberg WASM verifier
      // 2. Verify the proof against the verification key
      // 3. Return the result
      
      // Simulate verification (always returns true for demo)
      const isValid = proof.length > 0 && publicInputs.length > 0 && verificationKey.length > 0
      
      return { isValid, error: isValid ? undefined : 'Local verification failed' }
    } catch (error) {
      return { isValid: false, error: `Local verification error: ${error}` }
    }
  }

  /**
   * Verify Merkle inclusion proof
   */
  async verifyMerkleInclusion(
    commitment: string,
    nullifier: string,
    merkleProof: string[],
    index: number
  ): Promise<{ isValid: boolean; error?: string }> {
    try {
      const contract = new ethers.Contract(this.contractAddress, this.contractABI, this.provider)
      
      // Get current Merkle root
      const merkleRoot = await contract.getMerkleRoot()
      
      // Generate leaf hash
      const leaf = CryptoUtils.merkleLeaf(commitment, nullifier)
      const leafHash = ethers.keccak256(ethers.toUtf8Bytes(leaf))
      
      // Verify inclusion on-chain
      const proofBytes32 = merkleProof.map(p => ethers.keccak256(ethers.toUtf8Bytes(p)))
      const isValid = await contract.verifyInclusion(leafHash, proofBytes32, index)
      
      return { isValid, error: isValid ? undefined : 'Merkle inclusion verification failed' }
    } catch (error) {
      return { isValid: false, error: `Merkle verification error: ${error}` }
    }
  }

  /**
   * Verify commitment opening
   */
  verifyCommitmentOpening(
    commitment: string,
    value: string,
    nonce: Uint8Array
  ): boolean {
    const expectedCommitment = CryptoUtils.generateCommitment(value, nonce)
    return commitment === expectedCommitment
  }

  /**
   * Verify age proof
   */
  async verifyAgeProof(
    proof: Uint8Array,
    minAge: number,
    currentTimestamp: number
  ): Promise<{ isValid: boolean; verifiedAge?: number; error?: string }> {
    try {
      // Public inputs for age proof: [minAge, currentTimestamp]
      const publicInputs = [minAge.toString(), currentTimestamp.toString()]
      
      // Verification key for age circuit (would be loaded from file/storage)
      const verificationKey = new Uint8Array(32) // Placeholder
      
      const result = await this.verifyProofLocal(proof, publicInputs, verificationKey)
      
      if (result.isValid) {
        // In a real implementation, the proof would contain the verified age
        return { isValid: true, verifiedAge: minAge }
      }
      
      return { isValid: false, error: result.error }
    } catch (error) {
      return { isValid: false, error: `Age verification error: ${error}` }
    }
  }

  /**
   * Verify residency proof
   */
  async verifyResidencyProof(
    proof: Uint8Array,
    allowedCountries: string[],
    currentTimestamp: number
  ): Promise<{ isValid: boolean; verifiedCountry?: string; error?: string }> {
    try {
      // Public inputs for residency proof
      const publicInputs = [
        ...allowedCountries.map(c => ethers.keccak256(ethers.toUtf8Bytes(c))),
        currentTimestamp.toString()
      ]
      
      const verificationKey = new Uint8Array(32) // Placeholder
      const result = await this.verifyProofLocal(proof, publicInputs.map(String), verificationKey)
      
      if (result.isValid) {
        return { isValid: true, verifiedCountry: allowedCountries[0] }
      }
      
      return { isValid: false, error: result.error }
    } catch (error) {
      return { isValid: false, error: `Residency verification error: ${error}` }
    }
  }

  /**
   * Verify credit score proof
   */
  async verifyCreditScoreProof(
    proof: Uint8Array,
    minScore: number,
    currentTimestamp: number
  ): Promise<{ isValid: boolean; verifiedScore?: number; error?: string }> {
    try {
      const publicInputs = [minScore.toString(), currentTimestamp.toString()]
      const verificationKey = new Uint8Array(32) // Placeholder
      
      const result = await this.verifyProofLocal(proof, publicInputs, verificationKey)
      
      if (result.isValid) {
        return { isValid: true, verifiedScore: minScore }
      }
      
      return { isValid: false, error: result.error }
    } catch (error) {
      return { isValid: false, error: `Credit score verification error: ${error}` }
    }
  }

  /**
   * Batch verify multiple proofs
   */
  async verifyBatch(
    proofs: Array<{
      proof: Uint8Array
      publicInputs: string[]
      nullifier: string
      proofType: string
    }>
  ): Promise<Array<{ isValid: boolean; proofType: string; error?: string }>> {
    const results = []
    
    for (const proofData of proofs) {
      const result = await this.verifyProof(
        proofData.proof,
        proofData.publicInputs,
        proofData.nullifier
      )
      
      results.push({
        isValid: result.isValid,
        proofType: proofData.proofType,
        error: result.error
      })
    }
    
    return results
  }

  /**
   * Get contract information
   */
  async getContractInfo(): Promise<{
    address: string
    merkleRoot: string
    totalProofs: number
  }> {
    try {
      const contract = new ethers.Contract(this.contractAddress, this.contractABI, this.provider)
      const merkleRoot = await contract.getMerkleRoot()
      
      return {
        address: this.contractAddress,
        merkleRoot: merkleRoot.toString(),
        totalProofs: 0 // Would get from contract
      }
    } catch (error) {
      throw new Error(`Failed to get contract info: ${error}`)
    }
  }
}
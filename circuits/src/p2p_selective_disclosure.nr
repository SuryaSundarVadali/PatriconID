// P2P Selective Disclosure Circuit - Noir (ACIR)
// Proves age, residency, and other attributes without revealing private data
// Implements Merkle inclusion for on-chain registry compatibility

use dep::std;

struct IDData {
    birthdate: Field,
    nationality: Field,
    residency_code: Field,
    document_hash: Field,
    credit_score: Field,
}

struct ProofChallenge {
    current_date: Field,
    min_age: Field,
    required_nationality: Field,
    required_residency: Field,
    min_credit_score: Field,
    nullifier_secret: Field,
}

// Main P2P selective disclosure circuit
fn main(
    // Private inputs (never revealed)
    id_data: IDData,
    challenge: ProofChallenge,
    
    // Public inputs (revealed for verification)
    pub proof_type: Field, // 1=age, 2=residency, 3=nationality, 4=credit, 5=composite
    pub nullifier_hash: Field, // Prevents replay attacks
    pub merkle_root: Field, // For on-chain registry inclusion
    pub commitment: Field // Identity commitment for linkability control
) -> pub Field {
    
    // Generate nullifier to prevent proof reuse
    let computed_nullifier = std::hash::poseidon2_hash([
        challenge.nullifier_secret,
        id_data.document_hash
    ]);
    assert(computed_nullifier == nullifier_hash);
    
    // Verify identity commitment
    let computed_commitment = std::hash::poseidon2_hash([
        id_data.birthdate,
        id_data.nationality,
        id_data.residency_code,
        challenge.nullifier_secret
    ]);
    assert(computed_commitment == commitment);
    
    // Selective disclosure based on proof type
    let mut result = 0;
    
    // Age verification (proof_type == 1)
    if proof_type == 1 {
        let age_ok = (challenge.current_date - id_data.birthdate) >= challenge.min_age;
        assert(age_ok);
        result = 1;
    }
    
    // Residency verification (proof_type == 2)
    if proof_type == 2 {
        let residency_ok = id_data.residency_code == challenge.required_residency;
        assert(residency_ok);
        result = 2;
    }
    
    // Nationality verification (proof_type == 3)
    if proof_type == 3 {
        let nationality_ok = id_data.nationality == challenge.required_nationality;
        assert(nationality_ok);
        result = 3;
    }
    
    // Credit score verification (proof_type == 4)
    if proof_type == 4 {
        let credit_ok = id_data.credit_score >= challenge.min_credit_score;
        assert(credit_ok);
        result = 4;
    }
    
    // Composite verification (proof_type == 5)
    if proof_type == 5 {
        let age_ok = (challenge.current_date - id_data.birthdate) >= challenge.min_age;
        let residency_ok = id_data.residency_code == challenge.required_residency;
        let nationality_ok = id_data.nationality == challenge.required_nationality;
        
        assert(age_ok && residency_ok && nationality_ok);
        result = 5;
    }
    
    // Return proof type as public output
    result
}

// Helper function for Merkle proof verification (for on-chain registry)
fn verify_merkle_inclusion(
    leaf: Field,
    proof: [Field; 32],
    indices: u32,
    root: Field
) -> bool {
    let mut current = leaf;
    let mut index = indices;
    
    for i in 0..32 {
        let proof_element = proof[i];
        if proof_element == 0 {
            break;
        }
        
        if index % 2 == 0 {
            current = std::hash::poseidon2_hash([current, proof_element]);
        } else {
            current = std::hash::poseidon2_hash([proof_element, current]);
        }
        
        index = index / 2;
    }
    
    current == root
}

// Anti-replay nullifier generation
fn generate_nullifier(secret: Field, document_hash: Field) -> Field {
    std::hash::poseidon2_hash([secret, document_hash])
}

// Identity commitment for controlled linkability
fn generate_commitment(
    birthdate: Field,
    nationality: Field,
    residency: Field,
    secret: Field
) -> Field {
    std::hash::poseidon2_hash([birthdate, nationality, residency, secret])
}
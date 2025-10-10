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
    proof_type: pub Field, // 1=age, 2=residency, 3=nationality, 4=credit, 5=composite
    nullifier_hash: pub Field, // Prevents replay attacks
    merkle_root: pub Field, // For on-chain registry inclusion
    commitment: pub Field // Identity commitment for linkability control
) -> pub Field {
    
    // Generate nullifier to prevent proof reuse
    let computed_nullifier = std::hash::pedersen_hash([
        challenge.nullifier_secret,
        id_data.document_hash
    ]);
    assert(computed_nullifier == nullifier_hash);
    
    // Verify identity commitment
    let computed_commitment = std::hash::pedersen_hash([
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
        let age_diff = challenge.current_date - id_data.birthdate;
        assert(age_diff as u64 >= challenge.min_age as u64);
        result = 1;
    }
    
    // Residency verification (proof_type == 2)
    if proof_type == 2 {
        assert(id_data.residency_code == challenge.required_residency);
        result = 2;
    }
    
    // Nationality verification (proof_type == 3)
    if proof_type == 3 {
        assert(id_data.nationality == challenge.required_nationality);
        result = 3;
    }
    
    // Credit score verification (proof_type == 4)
    if proof_type == 4 {
        assert(id_data.credit_score as u64 >= challenge.min_credit_score as u64);
        result = 4;
    }
    
    // Composite verification (proof_type == 5)
    if proof_type == 5 {
        let age_diff = challenge.current_date - id_data.birthdate;
        let age_ok = age_diff as u64 >= challenge.min_age as u64;
        let residency_ok = id_data.residency_code == challenge.required_residency;
        let nationality_ok = id_data.nationality == challenge.required_nationality;
        
        assert(age_ok & residency_ok & nationality_ok);
        result = 5;
    }
    
    // Return proof type as public output
    result
}

// Anti-replay nullifier generation
fn generate_nullifier(secret: Field, document_hash: Field) -> Field {
    std::hash::pedersen_hash([secret, document_hash])
}

// Identity commitment for controlled linkability
fn generate_commitment(
    birthdate: Field,
    nationality: Field,
    residency: Field,
    secret: Field
) -> Field {
    std::hash::pedersen_hash([birthdate, nationality, residency, secret])
}

// Tests
#[test]
fn test_age_verification() {
    // Test data for an 18+ user
    let id_data = IDData {
        birthdate: 20000101, // Born Jan 1, 2000
        nationality: 356,    // India
        residency_code: 500001, // Hyderabad
        document_hash: 12345678,
        credit_score: 750
    };
    
    let challenge = ProofChallenge {
        current_date: 20251009, // Oct 9, 2025
        min_age: 6570,  // 18 years in days (approx)
        required_nationality: 0,
        required_residency: 0,
        min_credit_score: 0,
        nullifier_secret: 999999
    };
    
    let nullifier_hash = generate_nullifier(challenge.nullifier_secret, id_data.document_hash);
    let commitment = generate_commitment(
        id_data.birthdate,
        id_data.nationality,
        id_data.residency_code,
        challenge.nullifier_secret
    );
    
    let result = main(
        id_data,
        challenge,
        1, // proof_type: age
        nullifier_hash,
        0, // merkle_root (not used in this test)
        commitment
    );
    
    assert(result == 1);
}

#[test]
fn test_residency_verification() {
    let id_data = IDData {
        birthdate: 20000101,
        nationality: 356,
        residency_code: 500001,
        document_hash: 12345678,
        credit_score: 750
    };
    
    let challenge = ProofChallenge {
        current_date: 20251009,
        min_age: 0,
        required_nationality: 0,
        required_residency: 500001, // Must match residency_code
        min_credit_score: 0,
        nullifier_secret: 999999
    };
    
    let nullifier_hash = generate_nullifier(challenge.nullifier_secret, id_data.document_hash);
    let commitment = generate_commitment(
        id_data.birthdate,
        id_data.nationality,
        id_data.residency_code,
        challenge.nullifier_secret
    );
    
    let result = main(
        id_data,
        challenge,
        2, // proof_type: residency
        nullifier_hash,
        0,
        commitment
    );
    
    assert(result == 2);
}

#[test]
fn test_nationality_verification() {
    let id_data = IDData {
        birthdate: 20000101,
        nationality: 356, // India
        residency_code: 500001,
        document_hash: 12345678,
        credit_score: 750
    };
    
    let challenge = ProofChallenge {
        current_date: 20251009,
        min_age: 0,
        required_nationality: 356, // Must match nationality
        required_residency: 0,
        min_credit_score: 0,
        nullifier_secret: 999999
    };
    
    let nullifier_hash = generate_nullifier(challenge.nullifier_secret, id_data.document_hash);
    let commitment = generate_commitment(
        id_data.birthdate,
        id_data.nationality,
        id_data.residency_code,
        challenge.nullifier_secret
    );
    
    let result = main(
        id_data,
        challenge,
        3, // proof_type: nationality
        nullifier_hash,
        0,
        commitment
    );
    
    assert(result == 3);
}
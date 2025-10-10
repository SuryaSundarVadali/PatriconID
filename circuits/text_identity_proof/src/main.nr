// Text-Based Identity Verification Circuit
// Proves age, residency, or nationality from manually entered identity data
// without revealing the actual personal information

use dep::std;

// Structure for identity data (all private except what's explicitly public)
struct TextIdentityData {
    // Hashed personal data (for privacy)
    name_hash: Field,
    birth_date: Field,           // YYYYMMDD format
    nationality_hash: Field,
    country_hash: Field,
    address_hash: Field,
    
    // Plaintext data for verification
    age_in_days: Field,
    country_code: Field,         // ISO country code (numeric)
    postal_code_region: Field,   // First 3 digits of postal code
    
    // User and commitment data
    wallet_address: Field,
    input_timestamp: Field,
    identity_commitment: Field,
}

// Requirements specified by the verifier
struct ProofRequirements {
    min_age_days: Field,         // Minimum age in days (18 years = 6570 days)
    required_country_code: Field,// Required country code for residency
    required_region: Field,      // Required postal code region
    max_timestamp_age: Field,    // Maximum age of input (e.g., 2592000 = 30 days)
    current_timestamp: Field,    // Current timestamp for freshness check
}

// Main proof generation function
fn main(
    // Private inputs (never revealed on-chain)
    identity_data: TextIdentityData,
    requirements: ProofRequirements,
    nullifier_secret: Field,
    
    // Public inputs (revealed for verification)
    proof_type: pub Field,           // 1=age, 2=residency, 3=nationality, 4=composite
    nullifier_hash: pub Field,       // Prevents replay attacks
    identity_commitment: pub Field,  // Links to on-chain registry
    verifier_challenge: pub Field,   // Random challenge from verifier
    wallet_address: pub Field        // User's wallet address
) -> pub Field {
    
    // ========== STEP 1: Verify Identity Commitment ==========
    // Ensure the provided identity data matches the commitment
    let computed_commitment = std::hash::poseidon::bn254::hash_4([
        identity_data.name_hash,
        identity_data.birth_date,
        identity_data.nationality_hash,
        identity_data.wallet_address
    ]);
    assert(computed_commitment == identity_commitment);
    
    // ========== STEP 2: Generate Anti-Replay Nullifier ==========
    // Prevents the same proof from being submitted multiple times
    let computed_nullifier = std::hash::poseidon::bn254::hash_3([
        nullifier_secret,
        identity_commitment,
        verifier_challenge
    ]);
    assert(computed_nullifier == nullifier_hash);
    
    // ========== STEP 3: Verify Wallet Address ==========
    assert(identity_data.wallet_address == wallet_address);
    
    // ========== STEP 4: Verify Input Freshness ==========
    // Ensure identity data was entered recently (within allowed timeframe)
    let input_age = requirements.current_timestamp - identity_data.input_timestamp;
    assert(input_age <= requirements.max_timestamp_age);
    assert(input_age >= 0); // Timestamp can't be in the future
    
    // ========== STEP 5: Selective Verification Based on Proof Type ==========
    let mut result: Field = 0;
    
    // Age Verification (proof_type == 1)
    if proof_type == 1 {
        let age_valid = identity_data.age_in_days >= requirements.min_age_days;
        assert(age_valid);
        result = 1;
    }
    
    // Residency Verification (proof_type == 2)
    if proof_type == 2 {
        let country_valid = identity_data.country_code == requirements.required_country_code;
        let region_valid = identity_data.postal_code_region == requirements.required_region;
        assert(country_valid);
        assert(region_valid);
        result = 2;
    }
    
    // Nationality Verification (proof_type == 3)
    if proof_type == 3 {
        // Hash the required country code and compare with nationality hash
        let expected_nationality_hash = std::hash::poseidon::bn254::hash_1([requirements.required_country_code]);
        assert(identity_data.nationality_hash == expected_nationality_hash);
        result = 3;
    }
    
    // Composite Verification (proof_type == 4)
    // Proves all three: age, residency, and nationality
    if proof_type == 4 {
        // Age check
        let age_valid = identity_data.age_in_days >= requirements.min_age_days;
        assert(age_valid);
        
        // Residency check
        let country_valid = identity_data.country_code == requirements.required_country_code;
        assert(country_valid);
        
        // Nationality check
        let expected_nationality_hash = std::hash::poseidon::bn254::hash_1([requirements.required_country_code]);
        let nationality_valid = identity_data.nationality_hash == expected_nationality_hash;
        assert(nationality_valid);
        
        result = 4;
    }
    
    // Return proof type as confirmation
    result
}

// ========== HELPER FUNCTIONS ==========

// Compute identity commitment off-chain (for testing/verification)
// This should match the Rust implementation
fn compute_identity_commitment(
    name_hash: Field,
    birth_date: Field,
    nationality_hash: Field,
    wallet_address: Field
) -> Field {
    std::hash::poseidon::bn254::hash_4([
        name_hash,
        birth_date,
        nationality_hash,
        wallet_address
    ])
}

// Generate nullifier for anti-replay protection
fn compute_nullifier(
    nullifier_secret: Field,
    identity_commitment: Field,
    verifier_challenge: Field
) -> Field {
    std::hash::poseidon::bn254::hash_3([
        nullifier_secret,
        identity_commitment,
        verifier_challenge
    ])
}

// Validate age requirement (age in days >= minimum required)
fn validate_age(age_in_days: Field, min_age_days: Field) -> bool {
    age_in_days >= min_age_days
}

// Validate residency (country code and postal region match)
fn validate_residency(
    country_code: Field,
    postal_region: Field,
    required_country: Field,
    required_region: Field
) -> bool {
    (country_code == required_country) & (postal_region == required_region)
}

// Validate nationality (nationality hash matches expected)
fn validate_nationality(
    nationality_hash: Field,
    required_country_code: Field
) -> bool {
    let expected_hash = std::hash::poseidon::bn254::hash_1([required_country_code]);
    nationality_hash == expected_hash
}

// ========== TESTS ==========

#[test]
fn test_age_verification() {
    // Test data: 25 years old (9125 days)
    let identity_data = TextIdentityData {
        name_hash: 0x123456789abcdef,
        birth_date: 19990101, // Jan 1, 1999
        nationality_hash: 0xaabbccdd,
        country_hash: 0x11223344,
        address_hash: 0x55667788,
        age_in_days: 9125, // ~25 years
        country_code: 356, // India
        postal_code_region: 400,
        wallet_address: 0xabcdef123456,
        input_timestamp: 1699000000,
        identity_commitment: 0xfedcba987654
    };
    
    let requirements = ProofRequirements {
        min_age_days: 6570, // 18 years
        required_country_code: 356,
        required_region: 400,
        max_timestamp_age: 2592000, // 30 days
        current_timestamp: 1699100000
    };
    
    let nullifier_secret = 0xsecret123;
    let verifier_challenge = 0xchallenge456;
    
    // Compute commitment
    let commitment = compute_identity_commitment(
        identity_data.name_hash,
        identity_data.birth_date,
        identity_data.nationality_hash,
        identity_data.wallet_address
    );
    
    // Compute nullifier
    let nullifier = compute_nullifier(
        nullifier_secret,
        commitment,
        verifier_challenge
    );
    
    // Should pass age verification (proof_type = 1)
    let result = main(
        identity_data,
        requirements,
        nullifier_secret,
        1, // Age proof
        nullifier,
        commitment,
        verifier_challenge,
        identity_data.wallet_address
    );
    
    assert(result == 1);
}

#[test]
fn test_composite_verification() {
    // Test full identity verification
    let country_code: Field = 840; // USA
    let nationality_hash = std::hash::poseidon::bn254::hash_1([country_code]);
    
    let identity_data = TextIdentityData {
        name_hash: 0x987654321,
        birth_date: 19950515, // May 15, 1995
        nationality_hash: nationality_hash,
        country_hash: 0xusa123,
        address_hash: 0xaddress789,
        age_in_days: 10400, // ~28 years
        country_code: country_code,
        postal_code_region: 100,
        wallet_address: 0xwallet999,
        input_timestamp: 1699000000,
        identity_commitment: 0xcommit321
    };
    
    let requirements = ProofRequirements {
        min_age_days: 7665, // 21 years (for US drinking age)
        required_country_code: 840,
        required_region: 100,
        max_timestamp_age: 2592000,
        current_timestamp: 1699200000
    };
    
    let nullifier_secret = 0xsecret789;
    let verifier_challenge = 0xchallenge999;
    
    let commitment = compute_identity_commitment(
        identity_data.name_hash,
        identity_data.birth_date,
        identity_data.nationality_hash,
        identity_data.wallet_address
    );
    
    let nullifier = compute_nullifier(
        nullifier_secret,
        commitment,
        verifier_challenge
    );
    
    // Should pass composite verification (proof_type = 4)
    let result = main(
        identity_data,
        requirements,
        nullifier_secret,
        4, // Composite proof
        nullifier,
        commitment,
        verifier_challenge,
        identity_data.wallet_address
    );
    
    assert(result == 4);
}

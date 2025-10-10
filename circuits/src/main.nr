// Main entry point for PatriconID circuits
// This file orchestrates the different proof types

mod p2p_selective_disclosure;
mod text_identity_proof;

// Re-export the main circuit functions
use p2p_selective_disclosure as p2p;
use text_identity_proof as text;

// Main function that routes to the appropriate circuit based on proof type
fn main(
    proof_type: pub Field,
    // Add other common public inputs here if needed
) {
    // This is a placeholder main function
    // The actual circuits are in separate modules
    assert(proof_type > 0);
}

// Tests for both circuits
#[test]
fn test_p2p_age_proof() {
    // Test P2P selective disclosure circuit
    // This will be implemented with actual test data
}

#[test]
fn test_text_identity_proof() {
    // Test text identity proof circuit
    // This will be implemented with actual test data
}

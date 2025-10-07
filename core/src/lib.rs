// PatriconID Core Library
// Provides P2P identity verification with ZK proofs and Aadhaar integration

pub mod p2p_service;
pub mod aadhaar_xml_parser;
pub mod identity_input;

// Re-export main types
pub use p2p_service::P2PProofService;
pub use aadhaar_xml_parser::{
    AadhaarXMLParser,
    VerifiedAadhaarData,
    AadhaarAddress,
    AadhaarVerificationError,
    validate_aadhaar_number,
};
pub use identity_input::{
    ManualIdentityData,
    Gender,
    IdentityInputValidator,
    ValidationResult,
    CircuitInputs,
    FieldHashes,
};

// WASM initialization
use wasm_bindgen::prelude::*;

#[wasm_bindgen(start)]
pub fn init() {
    #[cfg(feature = "console_error_panic_hook")]
    console_error_panic_hook::set_once();
}

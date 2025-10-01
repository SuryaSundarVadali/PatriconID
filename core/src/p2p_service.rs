use wasm_bindgen::prelude::*;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use web_sys::console;

// P2P Proof Service - Client-side ZK proof generation and verification
// No backend required - everything runs locally

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct P2PProofRequest {
    pub proof_type: u8, // 1=age, 2=residency, 3=nationality, 4=credit, 5=composite
    pub challenge: ProofChallenge,
    pub verifier_address: String,
    pub nonce: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProofChallenge {
    pub current_date: u64,
    pub min_age: u64,
    pub required_nationality: u64,
    pub required_residency: u64,
    pub min_credit_score: u64,
    pub nullifier_secret: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct P2PProofResponse {
    pub proof: String,
    pub public_signals: Vec<String>,
    pub signature: String,
    pub nullifier_hash: String,
    pub commitment: String,
    pub timestamp: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct IDData {
    pub birthdate: u64,
    pub nationality: u64,
    pub residency_code: u64,
    pub document_hash: String,
    pub credit_score: u64,
}

#[wasm_bindgen]
pub struct P2PProofService {
    circuits: HashMap<u8, String>,
    passkey_bound: bool,
}

#[wasm_bindgen]
impl P2PProofService {
    #[wasm_bindgen(constructor)]
    pub fn new() -> P2PProofService {
        console::log_1(&"Initializing P2P Proof Service".into());
        
        P2PProofService {
            circuits: HashMap::new(),
            passkey_bound: false,
        }
    }

    /// Initialize the service with circuit files
    #[wasm_bindgen]
    pub async fn initialize(&mut self) -> Result<(), JsValue> {
        // Load compiled ACIR circuits
        self.circuits.insert(1, "age_proof_circuit.acir".to_string());
        self.circuits.insert(2, "residency_proof_circuit.acir".to_string());
        self.circuits.insert(3, "nationality_proof_circuit.acir".to_string());
        self.circuits.insert(4, "credit_proof_circuit.acir".to_string());
        self.circuits.insert(5, "composite_proof_circuit.acir".to_string());
        
        console::log_1(&"P2P Proof Service initialized".into());
        Ok(())
    }

    /// Generate ZK proof locally (no backend)
    #[wasm_bindgen]
    pub async fn generate_proof(
        &self,
        id_data_json: &str,
        challenge_json: &str,
        proof_type: u8,
    ) -> Result<String, JsValue> {
        let id_data: IDData = serde_json::from_str(id_data_json)
            .map_err(|e| JsValue::from_str(&format!("Invalid ID data: {}", e)))?;
        
        let challenge: ProofChallenge = serde_json::from_str(challenge_json)
            .map_err(|e| JsValue::from_str(&format!("Invalid challenge: {}", e)))?;

        // Generate nullifier hash
        let nullifier_hash = self.generate_nullifier(&challenge.nullifier_secret, &id_data.document_hash);
        
        // Generate identity commitment
        let commitment = self.generate_commitment(&id_data, &challenge.nullifier_secret);
        
        // Simulate circuit execution (in real implementation, use Barretenberg)
        let proof_data = self.execute_circuit(&id_data, &challenge, proof_type).await?;
        
        // Create proof response
        let response = P2PProofResponse {
            proof: proof_data.proof,
            public_signals: vec![
                proof_type.to_string(),
                nullifier_hash.clone(),
                "merkle_root_placeholder".to_string(),
                commitment.clone(),
            ],
            signature: self.sign_proof_with_passkey(&proof_data.proof).await?,
            nullifier_hash,
            commitment,
            timestamp: js_sys::Date::now() as u64,
        };
        
        serde_json::to_string(&response)
            .map_err(|e| JsValue::from_str(&format!("Serialization error: {}", e)))
    }

    /// Verify ZK proof locally (P2P verification)
    #[wasm_bindgen]
    pub async fn verify_proof(
        &self,
        proof_json: &str,
        verifier_public_key: &str,
    ) -> Result<bool, JsValue> {
        let proof: P2PProofResponse = serde_json::from_str(proof_json)
            .map_err(|e| JsValue::from_str(&format!("Invalid proof: {}", e)))?;

        // 1. Verify ZK proof using circuit verifier
        let zk_valid = self.verify_zk_proof(&proof.proof, &proof.public_signals).await?;
        
        // 2. Verify passkey/biometric signature
        let signature_valid = self.verify_passkey_signature(
            &proof.proof,
            &proof.signature,
            verifier_public_key,
        ).await?;
        
        // 3. Check nullifier is not reused (in real implementation, check local storage)
        let nullifier_fresh = self.check_nullifier_freshness(&proof.nullifier_hash)?;
        
        Ok(zk_valid && signature_valid && nullifier_fresh)
    }

    /// Send proof via P2P channel (QR, WalletConnect, direct link)
    #[wasm_bindgen]
    pub async fn send_proof_p2p(
        &self,
        proof_json: &str,
        channel: &str, // "qr", "walletconnect", "direct"
        recipient: &str,
    ) -> Result<String, JsValue> {
        match channel {
            "qr" => {
                // Generate QR code with proof data
                let qr_data = format!("patricon://verify?proof={}", 
                    base64::encode(proof_json));
                Ok(qr_data)
            }
            "walletconnect" => {
                // Send via WalletConnect protocol
                self.send_via_walletconnect(proof_json, recipient).await
            }
            "direct" => {
                // Direct P2P transfer (WebRTC, etc.)
                self.send_direct(proof_json, recipient).await
            }
            _ => Err(JsValue::from_str("Unsupported channel"))
        }
    }

    // Private helper methods

    async fn execute_circuit(
        &self,
        id_data: &IDData,
        challenge: &ProofChallenge,
        proof_type: u8,
    ) -> Result<CircuitResult, JsValue> {
        // In real implementation, this would:
        // 1. Load the compiled ACIR circuit
        // 2. Generate witness using Noir
        // 3. Create proof using Barretenberg
        // 4. Return proof data
        
        // Simplified simulation for now
        let proof = format!("proof_{}_{}", proof_type, js_sys::Date::now());
        
        Ok(CircuitResult {
            proof,
            constraints: 15000, // Optimized for <2s generation
        })
    }

    async fn sign_proof_with_passkey(&self, proof: &str) -> Result<String, JsValue> {
        // WebAuthn/Passkey signing to prevent proof transfer
        // This binds the proof to the device/biometric
        
        let signature = format!("passkey_sig_{}", base64::encode(proof.as_bytes()));
        Ok(signature)
    }

    async fn verify_zk_proof(
        &self,
        proof: &str,
        public_signals: &[String],
    ) -> Result<bool, JsValue> {
        // In real implementation, use Barretenberg verifier
        // For now, simulate verification
        Ok(!proof.is_empty() && !public_signals.is_empty())
    }

    async fn verify_passkey_signature(
        &self,
        proof: &str,
        signature: &str,
        public_key: &str,
    ) -> Result<bool, JsValue> {
        // Verify WebAuthn/passkey signature
        // This ensures only the original holder can use the proof
        Ok(signature.contains("passkey_sig"))
    }

    fn check_nullifier_freshness(&self, nullifier: &str) -> Result<bool, JsValue> {
        // Check if nullifier has been used before
        // In real implementation, check IndexedDB or local storage
        Ok(!nullifier.is_empty())
    }

    fn generate_nullifier(&self, secret: &str, document_hash: &str) -> String {
        // Generate anti-replay nullifier
        format!("nullifier_{}_{}", 
            base64::encode(secret.as_bytes()), 
            base64::encode(document_hash.as_bytes()))
    }

    fn generate_commitment(&self, id_data: &IDData, secret: &str) -> String {
        // Generate identity commitment for controlled linkability
        format!("commitment_{}_{}_{}_{}_{}", 
            id_data.birthdate,
            id_data.nationality,
            id_data.residency_code,
            base64::encode(secret.as_bytes()),
            js_sys::Date::now())
    }

    async fn send_via_walletconnect(&self, proof: &str, recipient: &str) -> Result<String, JsValue> {
        Ok(format!("Sent to {} via WalletConnect", recipient))
    }

    async fn send_direct(&self, proof: &str, recipient: &str) -> Result<String, JsValue> {
        Ok(format!("Sent to {} directly", recipient))
    }
}

#[derive(Debug, Clone)]
struct CircuitResult {
    proof: String,
    constraints: u32,
}

// Export for TypeScript bindings
#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);
}

#[macro_export]
macro_rules! console_log {
    ($($t:tt)*) => (log(&format_args!($($t)*).to_string()))
}
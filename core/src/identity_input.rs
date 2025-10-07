use chrono::{NaiveDate, Utc};
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use thiserror::Error;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ManualIdentityData {
    // Basic Identity
    pub full_name: String,
    pub date_of_birth: NaiveDate,
    pub gender: Gender,
    pub nationality: String,

    // Address Information
    pub address_line_1: String,
    pub address_line_2: Option<String>,
    pub city: String,
    pub state_province: String,
    pub postal_code: String,
    pub country: String,

    // Identity Document Numbers (user-provided)
    pub national_id_number: Option<String>,
    pub passport_number: Option<String>,
    pub driver_license_number: Option<String>,

    // Additional Information
    pub phone_number: Option<String>,
    pub email: Option<String>,

    // Metadata
    pub input_timestamp: u64,
    pub user_wallet_address: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum Gender {
    Male,
    Female,
    Other(String),
    PreferNotToSay,
}

impl Gender {
    pub fn to_string(&self) -> String {
        match self {
            Gender::Male => "Male".to_string(),
            Gender::Female => "Female".to_string(),
            Gender::Other(s) => s.clone(),
            Gender::PreferNotToSay => "PreferNotToSay".to_string(),
        }
    }

    pub fn from_string(s: &str) -> Self {
        match s {
            "Male" => Gender::Male,
            "Female" => Gender::Female,
            "PreferNotToSay" => Gender::PreferNotToSay,
            _ => Gender::Other(s.to_string()),
        }
    }
}

#[derive(Debug, Error)]
pub enum ValidationError {
    #[error("Validation failed with issues: {0:?}")]
    ValidationFailed(Vec<String>),
    #[error("Date parsing error: {0}")]
    DateParseError(String),
    #[error("Invalid input: {0}")]
    InvalidInput(String),
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ValidationResult {
    Valid,
    Invalid(Vec<String>),
}

impl ValidationResult {
    pub fn is_valid(&self) -> bool {
        matches!(self, ValidationResult::Valid)
    }

    pub fn get_errors(&self) -> Vec<String> {
        match self {
            ValidationResult::Valid => vec![],
            ValidationResult::Invalid(errors) => errors.clone(),
        }
    }
}

pub struct IdentityInputValidator;

impl IdentityInputValidator {
    /// Validate all identity input fields
    pub fn validate_input(data: &ManualIdentityData) -> Result<ValidationResult, ValidationError> {
        let mut issues = Vec::new();

        // Basic validation rules
        if data.full_name.trim().is_empty() {
            issues.push("Full name is required".to_string());
        }

        if data.full_name.trim().len() < 2 {
            issues.push("Full name must be at least 2 characters".to_string());
        }

        // Date of birth validation
        let today = Utc::now().date_naive();
        if data.date_of_birth > today {
            issues.push("Birth date cannot be in the future".to_string());
        }

        // Age validation
        let age_years = (today - data.date_of_birth).num_days() / 365;
        if age_years < 13 {
            issues.push("Age must be at least 13 years".to_string());
        }
        if age_years > 120 {
            issues.push("Age cannot exceed 120 years".to_string());
        }

        // Address validation
        if data.city.trim().is_empty() {
            issues.push("City is required".to_string());
        }

        if data.country.trim().is_empty() {
            issues.push("Country is required".to_string());
        }

        if data.address_line_1.trim().is_empty() {
            issues.push("Address line 1 is required".to_string());
        }

        // Postal code format validation
        if !Self::validate_postal_code(&data.postal_code, &data.country) {
            issues.push(format!(
                "Invalid postal code format for country: {}",
                data.country
            ));
        }

        // Wallet address validation
        if !Self::validate_wallet_address(&data.user_wallet_address) {
            issues.push("Invalid Ethereum wallet address".to_string());
        }

        // Email validation (if provided)
        if let Some(email) = &data.email {
            if !email.trim().is_empty() && !Self::validate_email(email) {
                issues.push("Invalid email format".to_string());
            }
        }

        // Phone number validation (if provided)
        if let Some(phone) = &data.phone_number {
            if !phone.trim().is_empty() && !Self::validate_phone(phone) {
                issues.push("Invalid phone number format".to_string());
            }
        }

        if issues.is_empty() {
            Ok(ValidationResult::Valid)
        } else {
            Ok(ValidationResult::Invalid(issues))
        }
    }

    /// Validate postal code format based on country
    fn validate_postal_code(postal_code: &str, country: &str) -> bool {
        let trimmed = postal_code.trim();
        if trimmed.is_empty() {
            return false;
        }

        match country.to_uppercase().as_str() {
            "INDIA" => {
                trimmed.len() == 6 && trimmed.chars().all(|c| c.is_ascii_digit())
            }
            "USA" | "UNITED STATES" => {
                (trimmed.len() == 5 || trimmed.len() == 10)
                    && trimmed.chars().filter(|c| c.is_ascii_digit()).count() >= 5
            }
            "CANADA" => {
                trimmed.len() == 6
                    && trimmed
                        .chars()
                        .enumerate()
                        .all(|(i, c)| (i % 2 == 0 && c.is_alphabetic()) || c.is_ascii_digit())
            }
            "UNITED KINGDOM" | "UK" | "GB" => {
                trimmed.len() >= 5 && trimmed.len() <= 8
            }
            "GERMANY" | "FRANCE" | "ITALY" | "SPAIN" => {
                trimmed.len() == 5 && trimmed.chars().all(|c| c.is_ascii_digit())
            }
            _ => !trimmed.is_empty(), // Basic non-empty check for other countries
        }
    }

    /// Validate Ethereum wallet address format
    fn validate_wallet_address(address: &str) -> bool {
        if !address.starts_with("0x") {
            return false;
        }
        if address.len() != 42 {
            return false;
        }
        address[2..]
            .chars()
            .all(|c| c.is_ascii_hexdigit())
    }

    /// Validate email format
    fn validate_email(email: &str) -> bool {
        let email = email.trim();
        email.contains('@')
            && email.split('@').count() == 2
            && email.split('@').nth(1).unwrap().contains('.')
    }

    /// Validate phone number format (basic)
    fn validate_phone(phone: &str) -> bool {
        let digits: String = phone.chars().filter(|c| c.is_ascii_digit()).collect();
        digits.len() >= 10 && digits.len() <= 15
    }

    /// Generate cryptographic identity commitment from identity data
    pub fn generate_identity_commitment(data: &ManualIdentityData) -> String {
        let mut hasher = Sha256::new();

        // Hash critical identity fields
        hasher.update(data.full_name.to_lowercase().trim().as_bytes());
        hasher.update(data.date_of_birth.format("%Y%m%d").to_string().as_bytes());
        hasher.update(data.gender.to_string().as_bytes());
        hasher.update(data.nationality.to_lowercase().trim().as_bytes());
        hasher.update(data.country.to_lowercase().trim().as_bytes());
        hasher.update(data.city.to_lowercase().trim().as_bytes());
        hasher.update(data.postal_code.trim().as_bytes());
        hasher.update(data.user_wallet_address.to_lowercase().as_bytes());
        hasher.update(data.input_timestamp.to_string().as_bytes());

        let result = hasher.finalize();
        format!("0x{}", hex::encode(result))
    }

    /// Generate field-specific hashes for ZK circuit inputs
    pub fn generate_field_hashes(data: &ManualIdentityData) -> FieldHashes {
        let mut name_hasher = Sha256::new();
        name_hasher.update(data.full_name.to_lowercase().trim().as_bytes());
        let name_hash = hex::encode(name_hasher.finalize());

        let mut nationality_hasher = Sha256::new();
        nationality_hasher.update(data.nationality.to_lowercase().trim().as_bytes());
        let nationality_hash = hex::encode(nationality_hasher.finalize());

        let mut country_hasher = Sha256::new();
        country_hasher.update(data.country.to_lowercase().trim().as_bytes());
        let country_hash = hex::encode(country_hasher.finalize());

        let mut address_hasher = Sha256::new();
        address_hasher.update(data.address_line_1.to_lowercase().trim().as_bytes());
        address_hasher.update(data.city.to_lowercase().trim().as_bytes());
        address_hasher.update(data.postal_code.trim().as_bytes());
        let address_hash = hex::encode(address_hasher.finalize());

        FieldHashes {
            name_hash,
            nationality_hash,
            country_hash,
            address_hash,
        }
    }

    /// Calculate age in days from date of birth
    pub fn calculate_age_days(date_of_birth: NaiveDate) -> i64 {
        let today = Utc::now().date_naive();
        (today - date_of_birth).num_days()
    }

    /// Extract country code (ISO 3166-1 alpha-2)
    pub fn get_country_code(country: &str) -> u32 {
        match country.to_uppercase().as_str() {
            "INDIA" | "IN" => 356,
            "UNITED STATES" | "USA" | "US" => 840,
            "UNITED KINGDOM" | "UK" | "GB" => 826,
            "CANADA" | "CA" => 124,
            "GERMANY" | "DE" => 276,
            "FRANCE" | "FR" => 250,
            "ITALY" | "IT" => 380,
            "SPAIN" | "ES" => 724,
            "JAPAN" | "JP" => 392,
            "CHINA" | "CN" => 156,
            "AUSTRALIA" | "AU" => 36,
            "BRAZIL" | "BR" => 76,
            _ => 0, // Unknown country
        }
    }

    /// Extract postal code region (first 3 digits/chars)
    pub fn get_postal_region(postal_code: &str) -> u32 {
        let region_str: String = postal_code
            .chars()
            .filter(|c| c.is_ascii_digit())
            .take(3)
            .collect();

        region_str.parse::<u32>().unwrap_or(0)
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FieldHashes {
    pub name_hash: String,
    pub nationality_hash: String,
    pub country_hash: String,
    pub address_hash: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CircuitInputs {
    // Private inputs (hashed)
    pub name_hash: String,
    pub birth_date: u32, // YYYYMMDD format
    pub nationality_hash: String,
    pub country_hash: String,
    pub address_hash: String,

    // Plaintext data for verification
    pub age_in_days: i64,
    pub country_code: u32,
    pub postal_code_region: u32,

    // User and commitment data
    pub wallet_address: String,
    pub input_timestamp: u64,
    pub identity_commitment: String,
}

impl CircuitInputs {
    /// Generate circuit inputs from manual identity data
    pub fn from_identity_data(data: &ManualIdentityData) -> Self {
        let field_hashes = IdentityInputValidator::generate_field_hashes(data);
        let age_in_days = IdentityInputValidator::calculate_age_days(data.date_of_birth);
        let country_code = IdentityInputValidator::get_country_code(&data.country);
        let postal_code_region = IdentityInputValidator::get_postal_region(&data.postal_code);
        let identity_commitment = IdentityInputValidator::generate_identity_commitment(data);

        let birth_date = data
            .date_of_birth
            .format("%Y%m%d")
            .to_string()
            .parse::<u32>()
            .unwrap_or(0);

        CircuitInputs {
            name_hash: field_hashes.name_hash,
            birth_date,
            nationality_hash: field_hashes.nationality_hash,
            country_hash: field_hashes.country_hash,
            address_hash: field_hashes.address_hash,
            age_in_days,
            country_code,
            postal_code_region,
            wallet_address: data.user_wallet_address.clone(),
            input_timestamp: data.input_timestamp,
            identity_commitment,
        }
    }

    /// Export as JSON for Noir circuit
    pub fn to_noir_json(&self) -> String {
        serde_json::to_string_pretty(self).unwrap_or_default()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_validate_valid_identity() {
        let data = ManualIdentityData {
            full_name: "John Doe".to_string(),
            date_of_birth: NaiveDate::from_ymd_opt(1990, 1, 1).unwrap(),
            gender: Gender::Male,
            nationality: "American".to_string(),
            address_line_1: "123 Main St".to_string(),
            address_line_2: None,
            city: "New York".to_string(),
            state_province: "NY".to_string(),
            postal_code: "10001".to_string(),
            country: "USA".to_string(),
            national_id_number: None,
            passport_number: None,
            driver_license_number: None,
            phone_number: Some("+1234567890".to_string()),
            email: Some("john@example.com".to_string()),
            input_timestamp: 1699000000,
            user_wallet_address: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb".to_string(),
        };

        let result = IdentityInputValidator::validate_input(&data).unwrap();
        assert!(result.is_valid());
    }

    #[test]
    fn test_validate_invalid_age() {
        let data = ManualIdentityData {
            full_name: "Child User".to_string(),
            date_of_birth: Utc::now().date_naive(),
            gender: Gender::PreferNotToSay,
            nationality: "Indian".to_string(),
            address_line_1: "123 Street".to_string(),
            address_line_2: None,
            city: "Mumbai".to_string(),
            state_province: "Maharashtra".to_string(),
            postal_code: "400001".to_string(),
            country: "India".to_string(),
            national_id_number: None,
            passport_number: None,
            driver_license_number: None,
            phone_number: None,
            email: None,
            input_timestamp: 1699000000,
            user_wallet_address: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb".to_string(),
        };

        let result = IdentityInputValidator::validate_input(&data).unwrap();
        assert!(!result.is_valid());
    }

    #[test]
    fn test_postal_code_validation() {
        assert!(IdentityInputValidator::validate_postal_code("400001", "India"));
        assert!(IdentityInputValidator::validate_postal_code("10001", "USA"));
        assert!(IdentityInputValidator::validate_postal_code("M5H2N2", "Canada"));
        assert!(!IdentityInputValidator::validate_postal_code("123", "India"));
    }

    #[test]
    fn test_wallet_address_validation() {
        assert!(IdentityInputValidator::validate_wallet_address(
            "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
        ));
        assert!(!IdentityInputValidator::validate_wallet_address("742d35Cc6634C0532925a3b844Bc9e7595f0bEb"));
        assert!(!IdentityInputValidator::validate_wallet_address("0xinvalid"));
    }

    #[test]
    fn test_identity_commitment_generation() {
        let data = ManualIdentityData {
            full_name: "Test User".to_string(),
            date_of_birth: NaiveDate::from_ymd_opt(1995, 5, 15).unwrap(),
            gender: Gender::Female,
            nationality: "Canadian".to_string(),
            address_line_1: "456 Elm St".to_string(),
            address_line_2: None,
            city: "Toronto".to_string(),
            state_province: "ON".to_string(),
            postal_code: "M5H2N2".to_string(),
            country: "Canada".to_string(),
            national_id_number: None,
            passport_number: None,
            driver_license_number: None,
            phone_number: None,
            email: None,
            input_timestamp: 1699000000,
            user_wallet_address: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb".to_string(),
        };

        let commitment = IdentityInputValidator::generate_identity_commitment(&data);
        assert!(commitment.starts_with("0x"));
        assert_eq!(commitment.len(), 66); // 0x + 64 hex chars
    }

    #[test]
    fn test_circuit_inputs_generation() {
        let data = ManualIdentityData {
            full_name: "Circuit Test".to_string(),
            date_of_birth: NaiveDate::from_ymd_opt(2000, 1, 1).unwrap(),
            gender: Gender::Male,
            nationality: "Indian".to_string(),
            address_line_1: "789 Test St".to_string(),
            address_line_2: None,
            city: "Bangalore".to_string(),
            state_province: "Karnataka".to_string(),
            postal_code: "560001".to_string(),
            country: "India".to_string(),
            national_id_number: Some("123456789012".to_string()),
            passport_number: None,
            driver_license_number: None,
            phone_number: None,
            email: None,
            input_timestamp: 1699000000,
            user_wallet_address: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb".to_string(),
        };

        let inputs = CircuitInputs::from_identity_data(&data);
        assert_eq!(inputs.country_code, 356); // India
        assert!(inputs.age_in_days > 0);
        assert_eq!(inputs.postal_code_region, 560);
    }
}

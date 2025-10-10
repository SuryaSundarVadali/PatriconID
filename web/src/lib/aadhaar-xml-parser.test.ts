/**
 * Test utility to demonstrate Aadhaar XML parsing
 * This shows how the parser extracts data from the example XML
 */

import { parseAadhaarZip, AadhaarData } from './aadhaar-xml-parser';

/**
 * Example data structure that should be extracted from the provided XML:
 * 
 * Reference ID: 230820251009031352091
 * 
 * Personal Info (Poi):
 * - Name: Venkata Surya Sundar Vadali
 * - DOB: 09-09-2004
 * - Gender: M
 * 
 * Address (Poa):
 * - Care of: C/O: Vadali Srivani
 * - House: B-Block,G3,Sree Hemadurga Towers
 * - Street: Miyapur
 * - Landmark: Behind Sitara Grand Hotel
 * - Locality: Miyapur
 * - VTC: Miyapur
 * - Sub-district: Serilingampally
 * - District: K.v. Rangareddy
 * - State: Telangana
 * - Country: India
 * - Pincode: 500049
 * - Post Office: Miyapur
 * 
 * The XML also contains:
 * - Digital Signature (RSA-SHA1)
 * - X509 Certificate
 * - Photo (base64 encoded JPEG)
 * - Encrypted/hashed attributes (e, m values in Poi)
 */

export const EXPECTED_AADHAAR_DATA: Partial<AadhaarData> = {
  name: "Venkata Surya Sundar Vadali",
  date_of_birth: "09-09-2004",
  gender: "M",
  address: {
    careof: "C/O: Vadali Srivani",
    house: "B-Block,G3,Sree Hemadurga Towers",
    street: "Miyapur",
    landmark: "Behind Sitara Grand Hotel",
    loc: "Miyapur",
    vtc: "Miyapur",
    subdist: "Serilingampally",
    district: "K.v. Rangareddy",
    state: "Telangana",
    country: "India",
    pincode: "500049",
    po: "Miyapur",
    full_address: "C/O: Vadali Srivani, B-Block,G3,Sree Hemadurga Towers, Miyapur, Behind Sitara Grand Hotel, Miyapur, Miyapur, Serilingampally, K.v. Rangareddy, Telangana, 500049"
  },
  reference_id: "230820251009031352091",
};

/**
 * The XML contains encrypted/hashed values:
 * - 'e' attribute in Poi: Email hash (SHA-256)
 * - 'm' attribute in Poi: Mobile hash (SHA-256)
 * 
 * These are one-way hashes and cannot be decrypted.
 * They are used for verification purposes only.
 */
export const ENCRYPTED_ATTRIBUTES = {
  email_hash: "c0df672713e765e358704ff3e7640eda3f3255367b5fdd3345edac53b6c7fdf4",
  mobile_hash: "663ca1021bb462f84aa2880cd4ab7cfbb1c34bdf524e3811be93aa87dccb631c"
};

/**
 * Certificate Details from the XML:
 * 
 * Issuer: 
 * - Organization: Gujarat Narmada Valley Fertilizers and Chemicals Limited
 * - Department: Certifying Authority
 * - Location: Bodakdev, S G Road, Ahmedabad, Gujarat
 * 
 * Subject:
 * - CN: DS UNIQUE IDENTIFICATION AUTHORITY OF INDIA 05
 * - Organization: UNIQUE IDENTIFICATION AUTHORITY OF INDIA
 * - Location: BEHIND KALI MANDIR, AADHAAR HQ BANGLA SAHIB ROAD, Delhi
 * 
 * Certificate Valid From: 26 Feb 2021 to 27 Feb 2024
 * Signature Algorithm: RSA-SHA1 (note: SHA1 is deprecated, newer certificates use SHA256)
 */
export const CERTIFICATE_INFO = {
  subject: "DS UNIQUE IDENTIFICATION AUTHORITY OF INDIA 05",
  issuer: "(n)Code Solutions CA 2014",
  valid_from: "2021-02-26",
  valid_to: "2024-02-27",
  signature_algorithm: "RSA-SHA1",
  key_usage: ["Digital Signature", "Document Signing"],
};

/**
 * Important Security Notes:
 * 
 * 1. UIDAI Signature Verification:
 *    - The XML contains a digital signature that must be verified
 *    - Use the X509 certificate embedded in the XML
 *    - Verify the signature using RSA with SHA-1 or SHA-256
 *    - Check certificate validity period
 *    - Validate certificate chain back to UIDAI root CA
 * 
 * 2. Share Code:
 *    - The ZIP file is password-protected with the 4-digit share code
 *    - Share code is NOT stored in the XML
 *    - User must provide the correct share code to decrypt the ZIP
 * 
 * 3. Privacy:
 *    - Email and mobile are one-way hashed (SHA-256)
 *    - Full Aadhaar number is NOT present in the XML
 *    - Only last 4 digits or masked number may be available
 *    - Photo is base64 encoded but NOT encrypted
 * 
 * 4. Production Implementation:
 *    - Use Web Crypto API for signature verification
 *    - Implement proper certificate chain validation
 *    - Check certificate revocation status (CRL/OCSP)
 *    - Validate against UIDAI's public root certificates
 *    - Ensure all crypto operations happen client-side
 */

/**
 * Example usage of the parser:
 * 
 * ```typescript
 * const file = ... // File object from input
 * const shareCode = "1234"; // 4-digit code
 * 
 * try {
 *   const parsed = await parseAadhaarZip(file, shareCode);
 *   
 *   console.log('Name:', parsed.data.name);
 *   console.log('DOB:', parsed.data.date_of_birth);
 *   console.log('Address:', parsed.data.address.full_address);
 *   console.log('Has Signature:', parsed.hasSignature);
 *   
 *   if (parsed.hasSignature) {
 *     const isValid = await verifyUidaiSignature(
 *       parsed.rawXML,
 *       parsed.signatureValue
 *     );
 *     console.log('Signature Valid:', isValid);
 *   }
 * } catch (error) {
 *   console.error('Failed to parse:', error);
 * }
 * ```
 */

export function printExpectedData() {
  console.log('=== Expected Aadhaar Data Structure ===');
  console.log(JSON.stringify(EXPECTED_AADHAAR_DATA, null, 2));
  console.log('\n=== Encrypted Attributes ===');
  console.log(JSON.stringify(ENCRYPTED_ATTRIBUTES, null, 2));
  console.log('\n=== Certificate Info ===');
  console.log(JSON.stringify(CERTIFICATE_INFO, null, 2));
}

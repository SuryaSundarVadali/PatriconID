# Aadhaar XML Verification

This module provides client-side parsing and verification of Aadhaar Offline e-KYC XML files.

## Features

✅ **Client-Side Processing**: All parsing happens in the browser, no server upload required
✅ **ZIP File Support**: Handles password-protected ZIP files with 4-digit share code
✅ **XML Parsing**: Extracts all personal information, address, and metadata
✅ **Signature Detection**: Identifies UIDAI digital signatures in the XML
✅ **Privacy-First**: Photo and sensitive data handled securely

## File Structure

```
lib/
├── aadhaar-xml-parser.ts       # Main parser implementation
└── aadhaar-xml-parser.test.ts  # Test utilities and expected data
```

## Usage

### Basic Usage

```typescript
import { parseAadhaarZip, validateShareCode, verifyUidaiSignature } from './lib/aadhaar-xml-parser';

// In your component
const handleFileUpload = async (file: File, shareCode: string) => {
  try {
    // Validate share code format
    if (!validateShareCode(shareCode)) {
      throw new Error('Share code must be 4 digits');
    }

    // Parse the ZIP file
    const parsed = await parseAadhaarZip(file, shareCode);

    // Access extracted data
    console.log('Name:', parsed.data.name);
    console.log('DOB:', parsed.data.date_of_birth);
    console.log('Address:', parsed.data.address.full_address);

    // Check signature
    if (parsed.hasSignature) {
      const isValid = await verifyUidaiSignature(
        parsed.rawXML,
        parsed.signatureValue
      );
      console.log('Signature valid:', isValid);
    }
  } catch (error) {
    console.error('Parsing failed:', error);
  }
};
```

## Data Structure

### AadhaarData Interface

```typescript
interface AadhaarData {
  name: string;                    // Full name
  date_of_birth: string;           // Format: DD-MM-YYYY
  gender: string;                  // M/F/O
  address: {
    careof?: string;               // C/O information
    house?: string;                // House/building details
    street?: string;               // Street name
    landmark?: string;             // Nearby landmark
    loc?: string;                  // Locality
    vtc: string;                   // Village/Town/City
    subdist?: string;              // Sub-district
    district: string;              // District
    state: string;                 // State
    country?: string;              // Country (usually India)
    pincode: string;               // 6-digit PIN code
    po?: string;                   // Post office
    full_address?: string;         // Concatenated full address
  };
  reference_id: string;            // Unique reference ID
  generated_date: string;          // When the XML was generated
  photo?: string;                  // Base64 encoded photo (JPEG)
  aadhaar_last_4_digits?: string;  // Last 4 digits of Aadhaar
}
```

## Aadhaar XML Format

### Structure Overview

```xml
<?xml version="1.0" encoding="UTF-8"?>
<OfflinePaperlessKyc referenceId="...">
  <UidData>
    <!-- Personal Information (Proof of Identity) -->
    <Poi name="..." dob="..." gender="..." 
         e="email_hash" m="mobile_hash"/>
    
    <!-- Address (Proof of Address) -->
    <Poa careof="..." house="..." street="..." 
         vtc="..." dist="..." state="..." pc="..."/>
    
    <!-- Photo (Base64 encoded JPEG) -->
    <Pht>/9j/4AAQSkZJRg...</Pht>
  </UidData>
  
  <!-- Digital Signature -->
  <Signature xmlns="http://www.w3.org/2000/09/xmldsig#">
    <SignedInfo>...</SignedInfo>
    <SignatureValue>...</SignatureValue>
    <KeyInfo>
      <X509Data>
        <X509Certificate>...</X509Certificate>
      </X509Data>
    </KeyInfo>
  </Signature>
</OfflinePaperlessKyc>
```

### Key Elements

- **`referenceId`**: Unique identifier for this e-KYC document
- **`Poi`**: Personal information with name, DOB, gender
- **`Poa`**: Complete address broken down into components
- **`Pht`**: Base64 encoded photograph (JPEG format)
- **`Signature`**: UIDAI digital signature for verification

### Encrypted Attributes

The XML contains one-way hashed values (SHA-256):
- **`e` attribute**: Email address hash
- **`m` attribute**: Mobile number hash

These cannot be decrypted and are used only for verification purposes.

## Security Considerations

### 1. Signature Verification

**Current Implementation**: Basic signature presence check
**Production Required**:
- Use Web Crypto API to verify RSA signature
- Validate X509 certificate chain
- Check certificate validity period
- Verify against UIDAI root CA certificates
- Implement certificate revocation checking (CRL/OCSP)

```typescript
// Production signature verification (TODO)
async function verifySignatureProduction(xmlContent: string): Promise<boolean> {
  // 1. Extract signature value and certificate
  // 2. Parse X509 certificate
  // 3. Extract public key
  // 4. Canonicalize XML (C14N)
  // 5. Verify signature using Web Crypto API
  // 6. Validate certificate chain
  // 7. Check certificate validity dates
  // 8. Verify against UIDAI root certificates
  return true; // if all checks pass
}
```

### 2. ZIP File Decryption

The ZIP file is password-protected with a 4-digit share code. The user must provide this code to decrypt and extract the XML file.

### 3. Privacy Protection

**Data Handling**:
- ✅ All processing happens client-side
- ✅ No data sent to external servers
- ✅ Photo remains in browser memory only
- ✅ Email and mobile are pre-hashed
- ✅ Full Aadhaar number is never present

**Best Practices**:
- Clear sensitive data from memory after use
- Don't log personal information
- Use secure contexts (HTTPS) for production
- Implement proper error handling

## Certificate Information

### UIDAI Certificates

**Issuer**: (n)Code Solutions CA 2014 or other licensed CAs
**Subject**: DS UNIQUE IDENTIFICATION AUTHORITY OF INDIA XX

**Signature Algorithms**:
- Older: RSA-SHA1 (deprecated)
- Current: RSA-SHA256 (recommended)

**Key Usage**:
- Digital Signature
- Document Signing
- Form Signing

### Certificate Validation

```typescript
// Steps for production certificate validation
1. Extract X509 certificate from XML <X509Certificate>
2. Parse certificate using crypto library
3. Verify:
   - Certificate validity period (not expired)
   - Signature by trusted CA
   - Key usage allows document signing
   - Certificate not revoked (CRL/OCSP check)
4. Build certificate chain to UIDAI root CA
5. Verify entire chain
```

## Error Handling

Common errors and solutions:

### "No XML file found in ZIP"
- ZIP file is corrupted
- Wrong file type uploaded
- ZIP doesn't contain an XML file

### "Invalid Aadhaar XML: UidData element not found"
- XML structure is incorrect
- File is not a valid Aadhaar XML
- XML is corrupted

### "Failed to parse Aadhaar ZIP"
- Incorrect share code
- ZIP file is password-protected differently
- File corruption during download

## Testing

The example XML provided contains:
- **Name**: Venkata Surya Sundar Vadali
- **DOB**: 09-09-2004
- **Gender**: Male
- **Address**: Miyapur, K.v. Rangareddy, Telangana - 500049
- **Reference**: 230820251009031352091

Use this data to verify the parser is working correctly.

## Roadmap

### Phase 1: Basic Parsing ✅
- [x] ZIP file extraction
- [x] XML parsing
- [x] Data extraction
- [x] Basic validation

### Phase 2: Signature Verification (TODO)
- [ ] Implement Web Crypto API signature verification
- [ ] X509 certificate parsing
- [ ] Certificate chain validation
- [ ] CRL/OCSP checking

### Phase 3: Zero-Knowledge Proofs (TODO)
- [ ] Generate ZK proofs from verified data
- [ ] Selective disclosure (prove age without DOB)
- [ ] On-chain proof verification
- [ ] Integration with blockchain

## References

- [UIDAI Official Website](https://uidai.gov.in/)
- [Aadhaar Paperless Offline e-KYC](https://uidai.gov.in/en/ecosystem/authentication-devices-documents/qr-code-reader.html)
- [XML Digital Signature Standard](https://www.w3.org/TR/xmldsig-core/)
- [Web Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API)

## License

This implementation is part of PatriconID and follows the same license.

## Support

For issues or questions:
- GitHub: [PatriconID Repository](https://github.com/SuryaSundarVadali/PatriconID)
- Documentation: See main project README

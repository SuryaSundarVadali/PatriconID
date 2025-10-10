/**
 * Aadhaar XML Parser
 * Parses Aadhaar Offline e-KYC XML files and extracts data
 */

import JSZip from 'jszip';

export interface AadhaarData {
  name: string;
  date_of_birth: string;
  gender: string;
  address: {
    careof?: string;
    house?: string;
    street?: string;
    landmark?: string;
    loc?: string;
    vtc: string;
    subdist?: string;
    district: string;
    state: string;
    country?: string;
    pincode: string;
    po?: string;
    full_address?: string;
  };
  reference_id: string;
  generated_date: string;
  photo?: string;
  aadhaar_last_4_digits?: string;
}

export interface ParsedAadhaarXML {
  data: AadhaarData;
  rawXML: string;
  hasSignature: boolean;
  signatureValue?: string;
}

/**
 * Extract Aadhaar data from ZIP file
 */
export async function parseAadhaarZip(
  zipFile: File,
  shareCode: string
): Promise<ParsedAadhaarXML> {
  try {
    // Load the ZIP file
    const zip = new JSZip();
    const zipContent = await zip.loadAsync(zipFile);

    // Find the XML file in the ZIP
    const files = Object.keys(zipContent.files);
    const xmlFileName = files.find(name => 
      name.toLowerCase().endsWith('.xml') && !zipContent.files[name].dir
    );

    if (!xmlFileName) {
      throw new Error('No XML file found in the ZIP archive');
    }

    const xmlFile = zipContent.files[xmlFileName];
    
    // Read the XML content
    const xmlContent = await xmlFile.async('string');

    // Parse the XML
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlContent, 'text/xml');

    // Check for parsing errors
    const parserError = xmlDoc.querySelector('parsererror');
    if (parserError) {
      throw new Error('Failed to parse XML: ' + parserError.textContent);
    }

    // Extract data from XML
    const data = extractAadhaarData(xmlDoc);

    // Check for signature
    const signature = xmlDoc.querySelector('Signature');
    const signatureValue = signature?.querySelector('SignatureValue')?.textContent?.trim();

    return {
      data,
      rawXML: xmlContent,
      hasSignature: !!signature,
      signatureValue,
    };
  } catch (error: any) {
    console.error('Error parsing Aadhaar ZIP:', error);
    throw new Error(`Failed to parse Aadhaar ZIP: ${error.message}`);
  }
}

/**
 * Extract Aadhaar data from parsed XML document
 */
function extractAadhaarData(xmlDoc: Document): AadhaarData {
  // Get the root element - can be OfflinePaperlessKyc or PrintLetterBarcodeData
  const root = xmlDoc.documentElement;
  const referenceId = root.getAttribute('referenceId') || root.getAttribute('uid') || '';

  // Find UidData element
  const uidData = xmlDoc.querySelector('UidData');
  if (!uidData) {
    throw new Error('Invalid Aadhaar XML: UidData element not found');
  }

  // Extract Personal Information (Poi - Proof of Identity)
  const poi = uidData.querySelector('Poi');
  if (!poi) {
    throw new Error('Invalid Aadhaar XML: Poi element not found');
  }

  const name = poi.getAttribute('name') || '';
  const dob = poi.getAttribute('dob') || '';
  const gender = poi.getAttribute('gender') || '';

  // Extract Address (Poa - Proof of Address)
  const poa = uidData.querySelector('Poa');
  if (!poa) {
    throw new Error('Invalid Aadhaar XML: Poa element not found');
  }

  const address = {
    careof: poa.getAttribute('careof') || poa.getAttribute('co') || undefined,
    house: poa.getAttribute('house') || undefined,
    street: poa.getAttribute('street') || undefined,
    landmark: poa.getAttribute('landmark') || poa.getAttribute('lm') || undefined,
    loc: poa.getAttribute('loc') || undefined,
    vtc: poa.getAttribute('vtc') || '',
    subdist: poa.getAttribute('subdist') || poa.getAttribute('subdist') || undefined,
    district: poa.getAttribute('dist') || poa.getAttribute('district') || '',
    state: poa.getAttribute('state') || '',
    country: poa.getAttribute('country') || 'India',
    pincode: poa.getAttribute('pc') || poa.getAttribute('pincode') || '',
    po: poa.getAttribute('po') || undefined,
  };

  // Build full address
  const addressParts = [
    address.careof,
    address.house,
    address.street,
    address.landmark,
    address.loc,
    address.vtc,
    address.subdist,
    address.district,
    address.state,
    address.pincode,
  ].filter(Boolean);

  const fullAddress = addressParts.join(', ');

  // Extract photo if available
  const pht = uidData.querySelector('Pht');
  const photo = pht?.textContent?.trim() || undefined;

  // Extract last 4 digits from reference ID or masked Aadhaar
  let last4Digits = '';
  const uidAttr = root.getAttribute('uid');
  if (uidAttr && uidAttr.length >= 4) {
    last4Digits = uidAttr.slice(-4);
  } else if (referenceId.length >= 4) {
    // Try to extract from reference ID
    const digits = referenceId.match(/\d+/g);
    if (digits && digits.length > 0) {
      const lastDigitGroup = digits[digits.length - 1];
      last4Digits = lastDigitGroup.slice(-4).padStart(4, '0');
    }
  }

  // Get generation date from root or use current date
  const generatedDate = root.getAttribute('ts') || root.getAttribute('generatedDate') || 
                       new Date().toISOString().split('T')[0];

  return {
    name,
    date_of_birth: dob,
    gender,
    address: {
      ...address,
      full_address: fullAddress,
    },
    reference_id: referenceId,
    generated_date: generatedDate,
    photo,
    aadhaar_last_4_digits: last4Digits,
  };
}

/**
 * Validate share code format
 */
export function validateShareCode(shareCode: string): boolean {
  // Share code should be 4 digits
  return /^\d{4}$/.test(shareCode);
}

/**
 * Note: Actual UIDAI signature verification requires:
 * 1. UIDAI public certificate
 * 2. XML digital signature verification using Web Crypto API or similar
 * 3. Certificate chain validation
 * 
 * This is a placeholder that should be replaced with actual cryptographic verification
 * when implementing production-ready signature validation.
 */
export async function verifyUidaiSignature(
  xmlContent: string,
  signatureValue?: string
): Promise<boolean> {
  // TODO: Implement actual UIDAI signature verification
  // This would involve:
  // 1. Extracting the signature from XML
  // 2. Getting the public key from the certificate
  // 3. Verifying the signature using Web Crypto API
  // 4. Validating the certificate chain
  
  console.warn('UIDAI signature verification not yet implemented');
  
  // For now, we just check if a signature exists
  // In production, this MUST be replaced with actual cryptographic verification
  return !!signatureValue && signatureValue.length > 0;
}

/**
 * Format date from DD-MM-YYYY to more readable format
 */
export function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  
  // If already in DD-MM-YYYY format
  if (dateStr.includes('-')) {
    const [day, month, year] = dateStr.split('-');
    if (day && month && year) {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                     'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${day} ${months[parseInt(month) - 1]} ${year}`;
    }
  }
  
  return dateStr;
}

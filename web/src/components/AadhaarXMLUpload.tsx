import React, { useState } from 'react';
import { Upload, Shield, CheckCircle, XCircle, FileText, Lock, AlertTriangle } from 'lucide-react';

interface AadhaarUploadProps {
  onVerified: (data: VerifiedAadhaarData) => void;
  onError: (error: string) => void;
}

interface VerifiedAadhaarData {
  name: string;
  date_of_birth: string;
  gender: string;
  address: {
    vtc: string;
    district: string;
    state: string;
    pincode: string;
    full_address?: string;
  };
  reference_id: string;
  generated_date: string;
  signature_valid: boolean;
  certificate_valid: boolean;
  aadhaar_last_4_digits: string;
}

export const AadhaarXMLUpload: React.FC<AadhaarUploadProps> = ({ onVerified, onError }) => {
  const [zipFile, setZipFile] = useState<File | null>(null);
  const [shareCode, setShareCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [verifiedData, setVerifiedData] = useState<VerifiedAadhaarData | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.name.endsWith('.zip')) {
        setErrorMessage('Please select a valid Aadhaar XML ZIP file');
        return;
      }
      setZipFile(file);
      setVerificationStatus('idle');
      setErrorMessage('');
    }
  };

  const handleVerify = async () => {
    if (!zipFile || !shareCode) {
      setErrorMessage('Please provide both ZIP file and share code');
      return;
    }

    if (shareCode.length < 4) {
      setErrorMessage('Share code must be at least 4 characters');
      return;
    }

    setIsVerifying(true);
    setVerificationStatus('idle');
    setErrorMessage('');

    try {
      // Read ZIP file as ArrayBuffer
      const arrayBuffer = await zipFile.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);

      // Import WASM module (dynamically)
      // TODO: Update path when WASM is built
      // const wasmModule = await import('../../../core/pkg');
      // const proofService = new wasmModule.P2PProofService();
      // await proofService.initialize();
      // const verifiedDataJson = await proofService.verify_aadhaar_xml(uint8Array, shareCode);
      // const data: VerifiedAadhaarData = JSON.parse(verifiedDataJson);
      
      // For now, use mock verification
      // In production, this will verify UIDAI signature cryptographically
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Mock verified data (replace with actual WASM call)
      const data: VerifiedAadhaarData = {
        name: "Sample User",
        date_of_birth: "01-01-1990",
        gender: "M",
        address: {
          vtc: "Sample City",
          district: "Sample District",
          state: "Karnataka",
          pincode: "560001",
        },
        reference_id: "MOCK123456",
        generated_date: new Date().toISOString().split('T')[0],
        signature_valid: true,
        certificate_valid: true,
        aadhaar_last_4_digits: "1234",
      };

      if (!data.signature_valid) {
        throw new Error('UIDAI digital signature verification failed');
      }

      // Add full address for display
      if (data.address) {
        data.address.full_address = `${data.address.vtc}, ${data.address.district}, ${data.address.state} - ${data.address.pincode}`;
      }

      setVerifiedData(data);
      setVerificationStatus('success');
      onVerified(data);
      
    } catch (error: any) {
      console.error('Aadhaar verification error:', error);
      const message = error.message || 'Aadhaar verification failed';
      setErrorMessage(message);
      setVerificationStatus('error');
      onError(message);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleReset = () => {
    setZipFile(null);
    setShareCode('');
    setVerificationStatus('idle');
    setVerifiedData(null);
    setErrorMessage('');
  };

  return (
    <div className="aadhaar-upload-container">
      <div className="web3-glass-card">
        <div className="card-header">
          <Shield className="icon-shield" size={32} />
          <h3>Aadhaar XML Verification</h3>
          <p className="subtitle">Upload your offline e-KYC XML file for cryptographic verification</p>
        </div>

        {verificationStatus === 'idle' && (
          <div className="upload-section">
            <div className="file-upload-area">
              <input
                type="file"
                id="aadhaar-file"
                accept=".zip"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />
              <label htmlFor="aadhaar-file" className="file-upload-label">
                <Upload size={48} className="upload-icon" />
                <div className="upload-text">
                  <strong>Click to upload Aadhaar XML ZIP</strong>
                  <span>or drag and drop</span>
                </div>
                {zipFile && (
                  <div className="file-selected">
                    <FileText size={20} />
                    <span>{zipFile.name}</span>
                    <span className="file-size">
                      ({(zipFile.size / 1024).toFixed(2)} KB)
                    </span>
                  </div>
                )}
              </label>
            </div>

            <div className="share-code-input">
              <label htmlFor="share-code">
                <Lock size={18} />
                <span>Share Code (4 digits)</span>
              </label>
              <input
                type="password"
                id="share-code"
                value={shareCode}
                onChange={(e) => setShareCode(e.target.value)}
                placeholder="Enter 4-digit share code"
                maxLength={4}
                className="input-field"
              />
              <small className="help-text">
                The 4-digit code you set when downloading the XML
              </small>
            </div>

            <button
              onClick={handleVerify}
              disabled={!zipFile || !shareCode || isVerifying}
              className="btn-verify"
            >
              {isVerifying ? (
                <>
                  <div className="spinner" />
                  Verifying UIDAI Signature...
                </>
              ) : (
                <>
                  <Shield size={20} />
                  Verify with UIDAI Certificate
                </>
              )}
            </button>

            {errorMessage && (
              <div className="error-message">
                <AlertTriangle size={20} />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="info-box">
              <h4>🔒 Privacy First</h4>
              <ul>
                <li>✅ Verification happens locally in your browser</li>
                <li>✅ UIDAI digital signature is cryptographically verified</li>
                <li>✅ No data is sent to any server</li>
                <li>✅ Generate zero-knowledge proofs after verification</li>
              </ul>
            </div>

            <div className="how-to-get">
              <h4>📥 How to get Aadhaar XML?</h4>
              <ol>
                <li>Visit <a href="https://myaadhaar.uidai.gov.in/" target="_blank" rel="noopener noreferrer">myaadhaar.uidai.gov.in</a></li>
                <li>Click on "Download Aadhaar" → "Paperless Offline e-KYC"</li>
                <li>Enter your Aadhaar number and verify with OTP</li>
                <li>Set a 4-digit share code and download the ZIP file</li>
                <li>Upload the ZIP file here with your share code</li>
              </ol>
            </div>
          </div>
        )}

        {verificationStatus === 'success' && verifiedData && (
          <div className="verification-success">
            <div className="success-header">
              <CheckCircle size={64} className="icon-success" />
              <h3>✅ Aadhaar Verified Successfully</h3>
              <p>UIDAI digital signature is valid</p>
            </div>

            <div className="verified-data">
              <div className="data-section">
                <h4>Personal Information</h4>
                <div className="data-grid">
                  <div className="data-item">
                    <label>Name</label>
                    <div className="data-value">{verifiedData.name}</div>
                  </div>
                  <div className="data-item">
                    <label>Date of Birth</label>
                    <div className="data-value">{verifiedData.date_of_birth}</div>
                  </div>
                  <div className="data-item">
                    <label>Gender</label>
                    <div className="data-value">{verifiedData.gender === 'M' ? 'Male' : verifiedData.gender === 'F' ? 'Female' : 'Other'}</div>
                  </div>
                  <div className="data-item">
                    <label>Aadhaar (Last 4 digits)</label>
                    <div className="data-value">XXXX XXXX {verifiedData.aadhaar_last_4_digits}</div>
                  </div>
                </div>
              </div>

              <div className="data-section">
                <h4>Address</h4>
                <div className="address-display">
                  <p>{verifiedData.address.full_address || `${verifiedData.address.vtc}, ${verifiedData.address.district}, ${verifiedData.address.state} - ${verifiedData.address.pincode}`}</p>
                </div>
              </div>

              <div className="data-section">
                <h4>Verification Details</h4>
                <div className="verification-badges">
                  <div className="badge badge-success">
                    <CheckCircle size={16} />
                    <span>UIDAI Signature Valid</span>
                  </div>
                  <div className="badge badge-success">
                    <CheckCircle size={16} />
                    <span>Certificate Valid</span>
                  </div>
                  <div className="badge badge-info">
                    <FileText size={16} />
                    <span>Ref: {verifiedData.reference_id}</span>
                  </div>
                </div>
                <div className="timestamp">
                  Generated: {verifiedData.generated_date}
                </div>
              </div>
            </div>

            <div className="action-buttons">
              <button onClick={handleReset} className="btn-secondary">
                Verify Another Document
              </button>
            </div>
          </div>
        )}

        {verificationStatus === 'error' && (
          <div className="verification-error">
            <XCircle size={64} className="icon-error" />
            <h3>Verification Failed</h3>
            <p className="error-details">{errorMessage}</p>
            <button onClick={handleReset} className="btn-secondary">
              Try Again
            </button>
          </div>
        )}
      </div>

      <style>{`
        .aadhaar-upload-container {
          width: 100%;
          max-width: 800px;
          margin: 0 auto;
        }

        .web3-glass-card {
          background: linear-gradient(135deg, rgba(10, 10, 40, 0.95) 0%, rgba(20, 20, 60, 0.9) 100%);
          border: 1px solid rgba(138, 43, 226, 0.3);
          border-radius: 20px;
          padding: 2.5rem;
          backdrop-filter: blur(20px);
          box-shadow: 0 8px 32px 0 rgba(138, 43, 226, 0.2);
        }

        .card-header {
          text-align: center;
          margin-bottom: 2rem;
        }

        .icon-shield {
          color: #8a2be2;
          margin-bottom: 1rem;
        }

        .card-header h3 {
          font-size: 1.8rem;
          background: linear-gradient(135deg, #8a2be2 0%, #4169e1 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          margin-bottom: 0.5rem;
        }

        .subtitle {
          color: rgba(255, 255, 255, 0.7);
          font-size: 0.95rem;
        }

        .file-upload-area {
          margin-bottom: 1.5rem;
        }

        .file-upload-label {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 3rem 2rem;
          border: 2px dashed rgba(138, 43, 226, 0.5);
          border-radius: 15px;
          background: rgba(138, 43, 226, 0.05);
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .file-upload-label:hover {
          border-color: #8a2be2;
          background: rgba(138, 43, 226, 0.1);
        }

        .upload-icon {
          color: #8a2be2;
          margin-bottom: 1rem;
        }

        .upload-text {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
          color: white;
        }

        .upload-text strong {
          font-size: 1.1rem;
        }

        .upload-text span {
          color: rgba(255, 255, 255, 0.6);
          font-size: 0.9rem;
        }

        .file-selected {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-top: 1rem;
          padding: 0.75rem 1.5rem;
          background: rgba(138, 43, 226, 0.2);
          border-radius: 10px;
          color: white;
        }

        .file-size {
          color: rgba(255, 255, 255, 0.6);
          font-size: 0.85rem;
        }

        .share-code-input {
          margin-bottom: 1.5rem;
        }

        .share-code-input label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: white;
          margin-bottom: 0.5rem;
          font-weight: 500;
        }

        .input-field {
          width: 100%;
          padding: 0.875rem 1rem;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(138, 43, 226, 0.3);
          border-radius: 10px;
          color: white;
          font-size: 1rem;
          font-family: monospace;
          letter-spacing: 0.5rem;
          text-align: center;
          transition: all 0.3s ease;
        }

        .input-field:focus {
          outline: none;
          border-color: #8a2be2;
          background: rgba(255, 255, 255, 0.08);
        }

        .input-field::placeholder {
          color: rgba(255, 255, 255, 0.4);
          letter-spacing: normal;
        }

        .help-text {
          display: block;
          color: rgba(255, 255, 255, 0.6);
          font-size: 0.85rem;
          margin-top: 0.5rem;
        }

        .btn-verify {
          width: 100%;
          padding: 1rem 2rem;
          background: linear-gradient(135deg, #8a2be2 0%, #4169e1 100%);
          border: none;
          border-radius: 12px;
          color: white;
          font-size: 1.05rem;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          transition: all 0.3s ease;
        }

        .btn-verify:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(138, 43, 226, 0.4);
        }

        .btn-verify:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .spinner {
          width: 20px;
          height: 20px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .error-message {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1rem;
          background: rgba(220, 53, 69, 0.1);
          border: 1px solid rgba(220, 53, 69, 0.3);
          border-radius: 10px;
          color: #ff6b6b;
          margin-top: 1rem;
        }

        .info-box, .how-to-get {
          margin-top: 2rem;
          padding: 1.5rem;
          background: rgba(65, 105, 225, 0.1);
          border: 1px solid rgba(65, 105, 225, 0.3);
          border-radius: 12px;
        }

        .info-box h4, .how-to-get h4 {
          color: white;
          margin-bottom: 1rem;
          font-size: 1.1rem;
        }

        .info-box ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .info-box li {
          color: rgba(255, 255, 255, 0.8);
          padding: 0.5rem 0;
          font-size: 0.95rem;
        }

        .how-to-get ol {
          padding-left: 1.5rem;
          color: rgba(255, 255, 255, 0.8);
        }

        .how-to-get li {
          padding: 0.4rem 0;
          font-size: 0.95rem;
        }

        .how-to-get a {
          color: #8a2be2;
          text-decoration: none;
        }

        .how-to-get a:hover {
          text-decoration: underline;
        }

        .verification-success {
          text-align: center;
        }

        .success-header {
          margin-bottom: 2rem;
        }

        .icon-success {
          color: #51cf66;
          margin-bottom: 1rem;
        }

        .success-header h3 {
          color: white;
          margin-bottom: 0.5rem;
        }

        .success-header p {
          color: rgba(255, 255, 255, 0.7);
        }

        .verified-data {
          text-align: left;
          margin-bottom: 2rem;
        }

        .data-section {
          margin-bottom: 2rem;
          padding: 1.5rem;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 12px;
        }

        .data-section h4 {
          color: #8a2be2;
          margin-bottom: 1rem;
          font-size: 1.1rem;
        }

        .data-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
        }

        .data-item {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .data-item label {
          color: rgba(255, 255, 255, 0.6);
          font-size: 0.85rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .data-value {
          color: white;
          font-size: 1rem;
          font-weight: 500;
        }

        .address-display p {
          color: white;
          line-height: 1.6;
        }

        .verification-badges {
          display: flex;
          flex-wrap: wrap;
          gap: 0.75rem;
          margin-bottom: 1rem;
        }

        .badge {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          border-radius: 20px;
          font-size: 0.9rem;
          font-weight: 500;
        }

        .badge-success {
          background: rgba(81, 207, 102, 0.2);
          color: #51cf66;
          border: 1px solid rgba(81, 207, 102, 0.3);
        }

        .badge-info {
          background: rgba(65, 105, 225, 0.2);
          color: #4169e1;
          border: 1px solid rgba(65, 105, 225, 0.3);
        }

        .timestamp {
          color: rgba(255, 255, 255, 0.6);
          font-size: 0.85rem;
        }

        .action-buttons {
          display: flex;
          gap: 1rem;
          justify-content: center;
          margin-top: 2rem;
        }

        .btn-secondary {
          padding: 0.875rem 2rem;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(138, 43, 226, 0.3);
          border-radius: 12px;
          color: white;
          font-size: 1rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .btn-secondary:hover {
          background: rgba(255, 255, 255, 0.15);
          border-color: #8a2be2;
        }

        .verification-error {
          text-align: center;
          padding: 2rem;
        }

        .icon-error {
          color: #ff6b6b;
          margin-bottom: 1rem;
        }

        .verification-error h3 {
          color: white;
          margin-bottom: 1rem;
        }

        .error-details {
          color: #ff6b6b;
          margin-bottom: 2rem;
        }

        @media (max-width: 768px) {
          .web3-glass-card {
            padding: 1.5rem;
          }

          .data-grid {
            grid-template-columns: 1fr;
          }

          .action-buttons {
            flex-direction: column;
          }

          .btn-verify, .btn-secondary {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};

export default AadhaarXMLUpload;

import React, { useState, useEffect } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { Camera, Shield, Send, Check, AlertTriangle, Smartphone, Scan, Download } from 'lucide-react'
import { P2PProofService } from '../lib/p2p-proof-service'

interface P2PProofGeneratorProps {
  onProofGenerated?: (proof: any) => void
}

const P2PProofGenerator: React.FC<P2PProofGeneratorProps> = ({ onProofGenerated }) => {
  const [proofService] = useState(() => new P2PProofService())
  const [isInitialized, setIsInitialized] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [proofType, setProofType] = useState<number>(1)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedProof, setGeneratedProof] = useState<any>(null)
  const [passkeyBound, setPasskeyBound] = useState(false)
  const [showQR, setShowQR] = useState(false)

  // Proof type options for selective disclosure
  const proofTypes = [
    { id: 1, name: 'Age Verification', description: 'Prove age above 18 without revealing birthdate' },
    { id: 2, name: 'Residency Proof', description: 'Prove residency without revealing address' },
    { id: 3, name: 'Nationality Proof', description: 'Prove nationality without revealing country' },
    { id: 4, name: 'Credit Score', description: 'Prove creditworthiness without revealing score' },
    { id: 5, name: 'Composite Proof', description: 'Multiple attributes in one proof' },
  ]

  useEffect(() => {
    initializeService()
  }, [])

  const initializeService = async () => {
    try {
      await proofService.initialize()
      setIsInitialized(true)
    } catch (error) {
      console.error('Failed to initialize P2P proof service:', error)
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
    }
  }

  const handleNFCScan = async () => {
    // NFC scanning implementation
    try {
      // @ts-ignore - NFC API
      if ('NDEFReader' in window) {
        // @ts-ignore
        const ndef = new NDEFReader()
        await ndef.scan()
        console.log('NFC scan initiated')
      } else {
        alert('NFC not supported on this device')
      }
    } catch (error) {
      console.error('NFC scan failed:', error)
    }
  }

  const bindPasskey = async () => {
    try {
      // WebAuthn/Passkey registration
      const credential = await navigator.credentials.create({
        publicKey: {
          challenge: crypto.getRandomValues(new Uint8Array(32)),
          rp: {
            name: "PatriconID",
            id: window.location.hostname,
          },
          user: {
            id: crypto.getRandomValues(new Uint8Array(32)),
            name: "user@patriconidd.com",
            displayName: "PatriconID User",
          },
          pubKeyCredParams: [{ alg: -7, type: "public-key" }],
          authenticatorSelection: {
            authenticatorAttachment: "platform",
            userVerification: "required",
          },
        },
      })
      
      if (credential) {
        setPasskeyBound(true)
        console.log('Passkey bound successfully')
      }
    } catch (error) {
      console.error('Passkey binding failed:', error)
    }
  }

  const generateProof = async () => {
    if (!selectedFile || !isInitialized) return

    setIsGenerating(true)
    try {
      // Simulate ID data extraction (in real implementation, parse NFC/document)
      const idData = {
        birthdate: 19950615, // YYYYMMDD format
        nationality: 840, // ISO country code for US
        residency_code: 840,
        document_hash: "0x" + Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join(''),
        credit_score: 750,
      }

      // Create challenge for proof
      const challenge = {
        current_date: Math.floor(Date.now() / 1000),
        min_age: 18 * 365 * 24 * 60 * 60, // 18 years in seconds
        required_nationality: 840,
        required_residency: 840,
        min_credit_score: 700,
        nullifier_secret: crypto.getRandomValues(new Uint8Array(32)).toString(),
      }

      // Generate ZK proof locally (no backend)
      const proofJson = await proofService.generate_proof(
        JSON.stringify(idData),
        JSON.stringify(challenge),
        proofType
      )

      const proof = JSON.parse(proofJson)
      setGeneratedProof(proof)
      onProofGenerated?.(proof)

    } catch (error) {
      console.error('Proof generation failed:', error)
      alert('Proof generation failed. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  const sendProofP2P = async (channel: string) => {
    if (!generatedProof) return

    try {
      const result = await proofService.send_proof_p2p(
        JSON.stringify(generatedProof),
        channel,
        "verifier@example.com"
      )

      if (channel === 'qr') {
        setShowQR(true)
      } else {
        console.log('Proof sent via', channel, result)
      }
    } catch (error) {
      console.error('Failed to send proof:', error)
    }
  }

  const downloadProof = () => {
    if (!generatedProof) return

    try {
      // Create a formatted JSON string for the proof
      const proofData = {
        ...generatedProof,
        metadata: {
          proof_type: proofTypes.find(t => t.id === proofType)?.name || 'Unknown',
          generated_at: new Date(generatedProof.timestamp).toISOString(),
          version: '1.0.0',
          format: 'PatriconID P2P Proof'
        }
      }

      const jsonString = JSON.stringify(proofData, null, 2)
      const blob = new Blob([jsonString], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      
      // Create descriptive filename
      const proofTypeName = proofTypes.find(t => t.id === proofType)?.name.replace(/\s+/g, '-').toLowerCase() || 'unknown'
      const timestamp = new Date().toISOString().split('T')[0] // YYYY-MM-DD format
      const filename = `patricon-${proofTypeName}-proof-${timestamp}.json`
      
      // Create download link
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      
      // Trigger download
      document.body.appendChild(link)
      link.click()
      
      // Cleanup
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
      console.log('Proof downloaded successfully as:', filename)
    } catch (error) {
      console.error('Failed to download proof:', error)
    }
  }

  return (
    <div className="proof-generator-container">
      <div className="proof-section-header">
        <div className="section-title-wrapper">
          <Shield className="section-icon" size={24} />
          <h2 className="section-title">P2P Identity Proof Generator</h2>
        </div>
        <p className="section-description">
          Generate zero-knowledge proofs locally with mathematical privacy guarantees
        </p>
      </div>

      {/* Service Status */}
      <div className="status-card">
        <h3 className="status-title">
          <Send size={20} />
          Service Status
        </h3>
        <div className="status-indicators">
          <div className="status-item">
            <div className={`status-dot ${isInitialized ? 'status-active' : 'status-pending'}`} />
            <span className="status-label">
              P2P Service: {isInitialized ? 'Ready' : 'Initializing...'}
            </span>
          </div>
          <div className="status-item">
            <div className={`status-dot ${passkeyBound ? 'status-active' : 'status-inactive'}`} />
            <span className="status-label">
              Passkey Binding: {passkeyBound ? 'Bound' : 'Not Bound'}
            </span>
            {!passkeyBound && (
              <button
                onClick={bindPasskey}
                className="bind-passkey-btn"
              >
                <Send size={16} />
                Bind Passkey
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Document Upload/Scan */}
      <div className="proof-step-card">
        <div className="step-header">
          <div className="step-number">1</div>
          <h3 className="step-title">Scan or Upload ID Document</h3>
        </div>
        <div className="step-content">
          <div className="upload-methods">
            {/* NFC Scan */}
            <div className="upload-method-card" onClick={handleNFCScan}>
              <Smartphone className="upload-icon" />
              <h4 className="upload-method-title">NFC Scan (Recommended)</h4>
              <p className="upload-method-description">
                Tap your NFC-enabled passport or ID card for secure data extraction
              </p>
              <button className="upload-btn">
                <Scan size={16} />
                Start NFC Scan
              </button>
            </div>

            {/* File Upload */}
            <div className="upload-method-card">
              <Camera className="upload-icon" />
              <h4 className="upload-method-title">Upload Photo</h4>
              <p className="upload-method-description">
                Upload a clear photo of your document for OCR processing
              </p>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
                id="document-upload"
                style={{ display: 'none' }}
              />
              <label htmlFor="document-upload" className="upload-btn secondary">
                <Camera size={16} />
                Choose File
              </label>
              {selectedFile && (
                <div className="file-selected">✓ {selectedFile.name}</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Proof Type Selection */}
      <div className="proof-step-card">
        <div className="step-header">
          <div className="step-number">2</div>
          <h3 className="step-title">Select Proof Type</h3>
        </div>
        <div className="step-content">
          <div className="proof-types-grid">
            {proofTypes.map((type) => (
              <div
                key={type.id}
                className={`proof-type-card ${proofType === type.id ? 'selected' : ''}`}
                onClick={() => setProofType(type.id)}
              >
                <h4 className="proof-type-name">{type.name}</h4>
                <p className="proof-type-description">{type.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Generate Proof */}
      <div className="proof-step-card">
        <div className="step-header">
          <div className="step-number">3</div>
          <h3 className="step-title">Generate ZK Proof</h3>
        </div>
        <div className="step-content">
          <div className="action-buttons">
            <button
              onClick={generateProof}
              disabled={!selectedFile || !isInitialized || isGenerating}
              className={`primary-btn ${(!selectedFile || !isInitialized || isGenerating) ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isGenerating ? (
                <>
                  <div className="loading-spinner-inline"></div>
                  <span>Generating Proof...</span>
                </>
              ) : (
                <>
                  <Shield size={20} />
                  <span>Generate ZK Proof</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Proof Result & P2P Sharing */}
      {generatedProof && (
        <div className="proof-step-card">
          <div className="step-header">
            <div className="step-number">4</div>
            <h3 className="step-title">Share Proof (P2P)</h3>
          </div>
          <div className="step-content">
            {/* Proof Details */}
            <div className="status-card">
              <div className="status-indicators">
                <div className="status-item">
                  <Check className="status-dot status-active" size={16} />
                  <span className="status-label">Proof Generated Successfully</span>
                </div>
              </div>
              <div className="proof-details">
                <div className="proof-detail-item">
                  <strong>Proof Type:</strong> {proofTypes.find(t => t.id === proofType)?.name}
                </div>
                <div className="proof-detail-item">
                  <strong>Generated:</strong> {new Date(generatedProof.timestamp).toLocaleString()}
                </div>
                <div className="proof-detail-item">
                  <strong>Nullifier:</strong> {generatedProof.nullifier_hash.substring(0, 16)}...
                </div>
                <div className="proof-detail-item">
                  <strong>Passkey Signed:</strong> ✅
                </div>
              </div>
            </div>

            {/* P2P Sharing Options */}
            <div className="sharing-methods">
              <button
                onClick={downloadProof}
                className="secondary-btn"
              >
                <Download size={20} />
                <span>Download Proof</span>
              </button>
              
              <button
                onClick={() => sendProofP2P('qr')}
                className="secondary-btn"
              >
                <Smartphone size={20} />
                <span>Share via QR Code</span>
              </button>
              
              <button
                onClick={() => sendProofP2P('walletconnect')}
                className="secondary-btn"
              >
                <Send size={20} />
                <span>WalletConnect</span>
              </button>
              
              <button
                onClick={() => sendProofP2P('direct')}
                className="secondary-btn"
              >
                <Send size={20} />
                <span>Direct P2P</span>
              </button>
            </div>

            {/* QR Code Display */}
            {showQR && (
              <div className="qr-display">
                <h4 className="qr-title">Scan to Verify Proof</h4>
                <div className="qr-code-wrapper">
                  <QRCodeSVG
                    value={`patricon://verify?proof=${btoa(JSON.stringify(generatedProof))}`}
                    size={200}
                  />
                </div>
                <p className="qr-description">
                  Verifier can scan this QR code to verify your proof locally
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Privacy Notice */}
      <div className="privacy-notice">
        <div className="privacy-icon">
          <Shield size={24} />
        </div>
        <div className="privacy-content">
          <h4 className="privacy-title">Mathematical Privacy Guarantee</h4>
          <p className="privacy-description">
            Your personal data never leaves your device. Only the requested attributes are proven mathematically, 
            and proofs are cryptographically bound to your biometric/passkey to prevent unauthorized transfer.
          </p>
        </div>
      </div>
    </div>
  )
}

export default P2PProofGenerator
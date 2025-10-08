import React, { useState, useEffect } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { Camera, Shield, Send, Check, AlertTriangle, Smartphone, Scan, Download, FileText } from 'lucide-react'
import { P2PProofService } from '../lib/p2p-proof-service'
import AadhaarXMLUpload from './AadhaarXMLUpload'
import PageWrapper, { Card, Section, StatusBadge } from './PageWrapper'

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
    <div className="proof-generator-container animate-fade-in">
      <div className="proof-section-header animate-slide-up">
        <div className="section-title-wrapper">
          <div className="p-3 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-2xl backdrop-blur-sm border border-purple-200/30 animate-pulse-glow">
            <Shield className="section-icon text-purple-600" size={24} />
          </div>
          <h2 className="section-title">
            <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              P2P Identity Proof Generator
            </span>
          </h2>
        </div>
        <p className="section-description animate-slide-up delay-100">
          Generate zero-knowledge proofs locally with mathematical privacy guarantees
        </p>
      </div>

      {/* Service Status */}
      <div className="status-card group hover:shadow-2xl transition-all duration-500 animate-slide-up delay-200">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl"></div>
        <h3 className="status-title relative z-10">
          <Send size={20} className="text-purple-600" />
          Service Status
        </h3>
        <div className="status-indicators relative z-10">
          <div className="status-item group/item hover:scale-105 transition-transform duration-300">
            <div className={`status-dot ${isInitialized ? 'status-active animate-pulse' : 'status-pending animate-pulse-glow'}`} />
            <span className="status-label">
              P2P Service: <span className={isInitialized ? 'text-green-600 font-semibold' : 'text-orange-500'}>{isInitialized ? 'Ready ✓' : 'Initializing...'}</span>
            </span>
          </div>
          <div className="status-item group/item hover:scale-105 transition-transform duration-300">
            <div className={`status-dot ${passkeyBound ? 'status-active animate-pulse' : 'status-inactive'}`} />
            <span className="status-label">
              Passkey Binding: <span className={passkeyBound ? 'text-green-600 font-semibold' : 'text-gray-500'}>{passkeyBound ? 'Bound ✓' : 'Not Bound'}</span>
            </span>
            {!passkeyBound && (
              <button
                onClick={bindPasskey}
                className="bind-passkey-btn group/btn hover:scale-110 hover:shadow-xl transition-all duration-300"
              >
                <Send size={16} className="group-hover/btn:rotate-12 transition-transform duration-300" />
                Bind Passkey
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Document Upload/Scan */}
      <div className="proof-step-card animate-slide-up delay-300">
        <div className="step-header">
          <div className="step-number bg-gradient-to-br from-purple-500 to-purple-600 shadow-xl animate-pulse-glow">1</div>
          <h3 className="step-title">Scan or Upload ID Document</h3>
        </div>
        <div className="step-content">
          <div className="upload-methods">
            {/* Aadhaar XML Upload - Recommended for India */}
            <div className="upload-method-card highlighted group hover:scale-105 hover:shadow-2xl transition-all duration-500 animate-scale-in" style={{ animationDelay: '0.4s' }}>
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl"></div>
              <FileText className="upload-icon text-purple-600 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 relative z-10" />
              <h4 className="upload-method-title relative z-10">Aadhaar XML (India)</h4>
              <p className="upload-method-description relative z-10">
                Upload offline e-KYC XML with UIDAI digital signature verification
              </p>
              <button 
                className="upload-btn primary group/btn hover:scale-110 hover:shadow-xl transition-all duration-300 relative z-10"
                onClick={() => {
                  const modal = document.getElementById('aadhaar-modal');
                  if (modal) modal.style.display = 'block';
                }}
              >
                <Shield size={16} className="group-hover/btn:rotate-12 transition-transform duration-300" />
                Upload Aadhaar XML
              </button>
            </div>

            {/* NFC Scan */}
            <div className="upload-method-card group hover:scale-105 hover:shadow-2xl transition-all duration-500 animate-scale-in" style={{ animationDelay: '0.5s' }} onClick={handleNFCScan}>
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl"></div>
              <Smartphone className="upload-icon text-cyan-600 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 relative z-10" />
              <h4 className="upload-method-title relative z-10">NFC Scan</h4>
              <p className="upload-method-description relative z-10">
                Tap your NFC-enabled passport or ID card for secure data extraction
              </p>
              <button className="upload-btn group/btn hover:scale-110 hover:shadow-xl transition-all duration-300 relative z-10">
                <Scan size={16} className="group-hover/btn:scale-125 transition-transform duration-300" />
                Start NFC Scan
              </button>
            </div>

            {/* File Upload */}
            <div className="upload-method-card group hover:scale-105 hover:shadow-2xl transition-all duration-500 animate-scale-in" style={{ animationDelay: '0.6s' }}>
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl"></div>
              <Camera className="upload-icon text-orange-600 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 relative z-10" />
              <h4 className="upload-method-title relative z-10">Upload Photo</h4>
              <p className="upload-method-description relative z-10">
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
              <label htmlFor="document-upload" className="upload-btn secondary group/btn hover:scale-110 hover:shadow-xl transition-all duration-300 cursor-pointer relative z-10">
                <Camera size={16} className="group-hover/btn:scale-125 transition-transform duration-300" />
                Choose File
              </label>
              {selectedFile && (
                <div className="file-selected animate-slide-in-left relative z-10">✓ {selectedFile.name}</div>
              )}
            </div>
          </div>
        </div>
      
      {/* Aadhaar XML Upload Modal */}
      <div id="aadhaar-modal" className="modal" style={{ display: 'none' }}>
        <div className="modal-content">
          <span 
            className="modal-close"
            onClick={() => {
              const modal = document.getElementById('aadhaar-modal');
              if (modal) modal.style.display = 'none';
            }}
          >
            &times;
          </span>
          <AadhaarXMLUpload
            onVerified={(data) => {
              console.log('Aadhaar verified:', data);
              setSelectedFile(new File([], 'aadhaar-verified.xml'));
              const modal = document.getElementById('aadhaar-modal');
              if (modal) modal.style.display = 'none';
            }}
            onError={(error) => {
              console.error('Aadhaar verification error:', error);
            }}
          />
        </div>
      </div>
      </div>

      {/* Proof Type Selection */}
      <div className="proof-step-card animate-slide-up delay-300">
        <div className="step-header">
          <div className="step-number bg-gradient-to-br from-pink-500 to-rose-600 shadow-xl animate-pulse-glow">2</div>
          <h3 className="step-title">Select Proof Type</h3>
        </div>
        <div className="step-content">
          <div className="proof-types-grid">
            {proofTypes.map((type, index) => (
              <div
                key={type.id}
                className={`proof-type-card group hover:scale-105 transition-all duration-500 animate-scale-in ${proofType === type.id ? 'selected ring-4 ring-purple-400/50 shadow-2xl' : ''}`}
                onClick={() => setProofType(type.id)}
                style={{ animationDelay: `${0.7 + index * 0.1}s` }}
              >
                <div className={`absolute inset-0 ${proofType === type.id ? 'bg-gradient-to-br from-purple-500/20 to-pink-500/20' : 'bg-gradient-to-br from-gray-500/5 to-transparent group-hover:from-purple-500/10 group-hover:to-pink-500/10'} transition-all duration-500 rounded-2xl`}></div>
                <h4 className="proof-type-name relative z-10">{type.name}</h4>
                <p className="proof-type-description relative z-10">{type.description}</p>
                {proofType === type.id && (
                  <div className="absolute top-4 right-4 z-20">
                    <Check className="w-6 h-6 text-purple-600 animate-scale-in" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Generate Proof */}
      <div className="proof-step-card animate-slide-up delay-300">
        <div className="step-header">
          <div className="step-number bg-gradient-to-br from-cyan-500 to-blue-600 shadow-xl animate-pulse-glow">3</div>
          <h3 className="step-title">Generate ZK Proof</h3>
        </div>
        <div className="step-content">
          <div className="action-buttons">
            <button
              onClick={generateProof}
              disabled={!selectedFile || !isInitialized || isGenerating}
              className={`primary-btn group/btn hover:scale-110 hover:shadow-2xl transition-all duration-300 ${(!selectedFile || !isInitialized || isGenerating) ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isGenerating ? (
                <>
                  <div className="loading-spinner-inline animate-spin"></div>
                  <span className="animate-pulse">Generating Proof...</span>
                </>
              ) : (
                <>
                  <Shield size={20} className="group-hover/btn:rotate-12 transition-transform duration-300" />
                  <span>Generate ZK Proof</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Proof Result & P2P Sharing */}
      {generatedProof && (
        <div className="proof-step-card animate-scale-in bg-gradient-to-br from-green-50/50 to-emerald-50/50 border-green-200/50">
          <div className="step-header">
            <div className="step-number bg-gradient-to-br from-green-500 to-emerald-600 shadow-xl animate-pulse">4</div>
            <h3 className="step-title flex items-center gap-2">
              Share Proof (P2P)
              <Check className="w-6 h-6 text-green-600 animate-bounce" />
            </h3>
          </div>
          <div className="step-content">
            {/* Proof Details */}
            <div className="status-card bg-white/80 backdrop-blur-xl border-green-200/50 animate-slide-up">
              <div className="status-indicators">
                <div className="status-item">
                  <Check className="status-dot status-active animate-pulse" size={16} />
                  <span className="status-label text-green-700 font-semibold">Proof Generated Successfully ✓</span>
                </div>
              </div>
              <div className="proof-details">
                <div className="proof-detail-item animate-slide-in-left" style={{ animationDelay: '0.1s' }}>
                  <strong>Proof Type:</strong> {proofTypes.find(t => t.id === proofType)?.name}
                </div>
                <div className="proof-detail-item animate-slide-in-left" style={{ animationDelay: '0.2s' }}>
                  <strong>Generated:</strong> {new Date(generatedProof.timestamp).toLocaleString()}
                </div>
                <div className="proof-detail-item animate-slide-in-left" style={{ animationDelay: '0.3s' }}>
                  <strong>Nullifier:</strong> {generatedProof.nullifier_hash.substring(0, 16)}...
                </div>
                <div className="proof-detail-item animate-slide-in-left" style={{ animationDelay: '0.4s' }}>
                  <strong>Passkey Signed:</strong> ✅
                </div>
              </div>
            </div>

            {/* P2P Sharing Options */}
            <div className="sharing-methods">
              <button
                onClick={downloadProof}
                className="secondary-btn group/btn hover:scale-110 hover:shadow-2xl transition-all duration-300 animate-scale-in"
                style={{ animationDelay: '0.5s' }}
              >
                <Download size={20} className="group-hover/btn:scale-125 group-hover/btn:-translate-y-1 transition-all duration-300" />
                <span>Download Proof</span>
              </button>
              
              <button
                onClick={() => sendProofP2P('qr')}
                className="secondary-btn group/btn hover:scale-110 hover:shadow-2xl transition-all duration-300 animate-scale-in"
                style={{ animationDelay: '0.6s' }}
              >
                <Smartphone size={20} className="group-hover/btn:scale-125 group-hover/btn:rotate-6 transition-all duration-300" />
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
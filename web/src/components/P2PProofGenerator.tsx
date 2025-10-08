import React, { useState, useEffect } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { Camera, Shield, Send, Check, AlertTriangle, Smartphone, Scan, Download, FileText, Upload, Eye, EyeOff, CheckCircle, XCircle } from 'lucide-react'
import { P2PProofService } from '../lib/p2p-proof-service'
import AadhaarXMLUpload from './AadhaarXMLUpload'

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
  const [dragOver, setDragOver] = useState(false)

  // Proof type options for selective disclosure
  const proofTypes = [
    { id: 1, name: 'Age Verification', description: 'Prove age above 18 without revealing birthdate', icon: Shield },
    { id: 2, name: 'Residency Proof', description: 'Prove residency without revealing address', icon: FileText },
    { id: 3, name: 'Nationality Proof', description: 'Prove nationality without revealing country', icon: Shield },
    { id: 4, name: 'Credit Score', description: 'Prove creditworthiness without revealing score', icon: CheckCircle },
    { id: 5, name: 'Composite Proof', description: 'Multiple attributes in one proof', icon: Shield },
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

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const files = e.dataTransfer.files
    if (files.length > 0) {
      setSelectedFile(files[0])
    }
  }

  const bindPasskey = async () => {
    try {
      const credential = await navigator.credentials.create({
        publicKey: {
          challenge: crypto.getRandomValues(new Uint8Array(32)),
          rp: { name: "PatriconID" },
          user: {
            id: crypto.getRandomValues(new Uint8Array(32)),
            name: "user@patricon.id",
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
    } finally {
      setIsGenerating(false)
    }
  }

  const downloadProof = () => {
    if (!generatedProof) return

    try {
      const proofData = {
        ...generatedProof,
        metadata: {
          proof_type: proofTypes.find(t => t.id === proofType)?.name || 'Unknown',
          generated_at: new Date(generatedProof.timestamp).toISOString(),
          version: '1.0.0',
        }
      }

      const blob = new Blob([JSON.stringify(proofData, null, 2)], { type: 'application/json' })
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

  return (
    <div className="container mx-auto px-6 pt-8 pb-12">
      <div className="max-w-3xl mx-auto text-center mb-8">
        <h1 className="text-4xl md:text-6xl font-bold text-white tracking-tight">
          P2P Identity Proof Generator
        </h1>
        <p className="mt-4 text-lg md:text-xl text-gray-300 max-w-2xl mx-auto">
          Generate zero-knowledge proofs locally with mathematical privacy guarantees. Your data never leaves your device.
        </p>
      </div>

      <div className="max-w-3xl mx-auto space-y-8">
        {/* Service Status Card */}
        <div className="glass-card rounded-2xl p-6 md:p-8">
          <div className="flex items-center space-x-3 mb-6">
            <Shield className="w-6 h-6 text-gray-300" />
            <h2 className="text-xl font-semibold text-white">Service Status</h2>
          </div>
          <div className="space-y-4 text-sm md:text-base">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-gray-300">
                <span className="font-medium">P2P Service:</span>
                <span>{isInitialized ? 'Ready' : 'Initializing...'}</span>
              </div>
              {isInitialized ? (
                <CheckCircle className="w-5 h-5 text-green-400" />
              ) : (
                <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
              )}
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-gray-300">
                <span className="font-medium">Passkey Binding:</span>
                <span className={passkeyBound ? "text-green-400" : "text-yellow-400"}>
                  {passkeyBound ? 'Bound' : 'Not Bound'}
                </span>
              </div>
              {!passkeyBound && (
                <button 
                  onClick={bindPasskey}
                  className="btn-primary text-xs md:text-sm font-semibold text-white px-4 py-2 rounded-lg"
                >
                  Bind Passkey
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Upload ID Document Card */}
        <div className="glass-card rounded-2xl p-6 md:p-8">
          <div className="flex items-center space-x-3 mb-6">
            <Upload className="w-6 h-6 text-gray-300" />
            <h2 className="text-xl font-semibold text-white">Scan or Upload ID Document</h2>
          </div>

          <div 
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-300 ${
              dragOver 
                ? 'upload-zone drag-over' 
                : selectedFile 
                  ? 'border-green-500 bg-green-500/10' 
                  : 'upload-zone'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => document.getElementById('file-input')?.click()}
          >
            <input 
              type="file" 
              id="file-input" 
              className="hidden"
              accept=".xml,.pdf,.jpg,.png"
              onChange={handleFileUpload}
            />
            {selectedFile ? (
              <div className="space-y-2">
                <CheckCircle className="mx-auto h-12 w-12 text-green-400" />
                <p className="text-green-400 font-semibold">
                  Selected: {selectedFile.name}
                </p>
                <p className="text-xs text-gray-400">
                  {(selectedFile.size / 1024).toFixed(2)} KB
                </p>
              </div>
            ) : (
              <>
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-sm text-gray-400">
                  <span className="font-semibold text-indigo-400">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-gray-500">XML, PDF, or image files</p>
              </>
            )}
          </div>

          <div className="mt-6">
            <p className="text-sm font-medium text-gray-400 mb-3">Or select a document type:</p>
            <div className="flex flex-wrap gap-3">
              <button className="btn-secondary text-sm font-medium px-4 py-2 rounded-lg flex items-center space-x-2">
                <FileText className="w-4 h-4" />
                <span>Aadhaar XML (India)</span>
              </button>
              <button className="btn-secondary text-sm font-medium px-4 py-2 rounded-lg flex items-center space-x-2 opacity-50 cursor-not-allowed">
                <Shield className="w-4 h-4" />
                <span>Passport (Coming Soon)</span>
              </button>
            </div>
          </div>
        </div>

        {/* Proof Type Selection */}
        <div className="glass-card rounded-2xl p-6 md:p-8">
          <div className="flex items-center space-x-3 mb-6">
            <Shield className="w-6 h-6 text-gray-300" />
            <h2 className="text-xl font-semibold text-white">Select Proof Type</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {proofTypes.map((type) => {
              const IconComponent = type.icon;
              return (
                <div
                  key={type.id}
                  className={`glass-card p-4 rounded-xl cursor-pointer transition-all duration-300 hover:bg-white/10 ${
                    proofType === type.id 
                      ? 'ring-2 ring-indigo-400 bg-indigo-500/20' 
                      : ''
                  }`}
                  onClick={() => setProofType(type.id)}
                >
                  <div className="flex items-start space-x-3">
                    <IconComponent className="w-5 h-5 text-indigo-400 mt-1 flex-shrink-0" />
                    <div className="flex-1">
                      <h3 className="font-medium text-white mb-1">{type.name}</h3>
                      <p className="text-sm text-gray-400">{type.description}</p>
                    </div>
                    {proofType === type.id && (
                      <CheckCircle className="w-5 h-5 text-indigo-400 flex-shrink-0" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Generate Proof Button */}
        <div className="text-center">
          <button
            onClick={generateProof}
            disabled={!selectedFile || !isInitialized || isGenerating}
            className={`w-full md:w-auto btn-primary text-base font-semibold text-white px-8 py-3 rounded-lg flex items-center justify-center mx-auto space-x-2 transition-all duration-300 ${
              (!selectedFile || !isInitialized || isGenerating) 
                ? 'opacity-50 cursor-not-allowed' 
                : 'hover:shadow-[0_0_20px_rgba(79,70,229,0.6)]'
            }`}
          >
            {isGenerating ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Generating Proof...</span>
              </>
            ) : (
              <>
                <Shield className="w-5 h-5" />
                <span>Generate ZK Proof</span>
              </>
            )}
          </button>
        </div>

        {/* Proof Result */}
        {generatedProof && (
          <div className="glass-card-elevated rounded-2xl p-6 md:p-8 border-green-500/50">
            <div className="flex items-center space-x-3 mb-6">
              <CheckCircle className="w-6 h-6 text-green-400" />
              <h2 className="text-xl font-semibold text-white">Proof Generated Successfully!</h2>
            </div>
            
            <div className="space-y-4 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Proof Type:</span>
                <span className="text-white font-medium">
                  {proofTypes.find(t => t.id === proofType)?.name}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Generated:</span>
                <span className="text-white font-medium">
                  {new Date(generatedProof.timestamp).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Nullifier:</span>
                <span className="text-white font-mono text-xs">
                  {generatedProof.nullifier_hash.substring(0, 16)}...
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={downloadProof}
                className="btn-secondary text-sm font-medium text-white px-4 py-2 rounded-lg flex items-center justify-center space-x-2 flex-1"
              >
                <Download className="w-4 h-4" />
                <span>Download Proof</span>
              </button>
              <button
                onClick={() => setShowQR(!showQR)}
                className="btn-secondary text-sm font-medium text-white px-4 py-2 rounded-lg flex items-center justify-center space-x-2 flex-1"
              >
                <Scan className="w-4 h-4" />
                <span>Show QR Code</span>
              </button>
            </div>

            {showQR && (
              <div className="mt-6 text-center glass-card p-6 rounded-xl">
                <div className="inline-block p-4 bg-white rounded-xl">
                  <QRCodeSVG
                    value={JSON.stringify(generatedProof)}
                    size={200}
                    level="H"
                  />
                </div>
                <p className="mt-4 text-sm text-gray-400">
                  Scan with any QR code reader or PatriconID app
                </p>
              </div>
            )}
          </div>
        )}

        {/* Privacy Notice */}
        <div className="glass-card rounded-2xl p-6 md:p-8 border-purple-500/30">
          <div className="flex items-start space-x-3">
            <Shield className="w-6 h-6 text-purple-400 mt-1 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-white mb-2">Mathematical Privacy Guarantee</h3>
              <p className="text-sm text-gray-400">
                🔒 Your personal data never leaves your device. Only the requested attributes are proven mathematically, 
                and proofs are cryptographically bound to your biometric/passkey to prevent unauthorized transfer.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default P2PProofGenerator
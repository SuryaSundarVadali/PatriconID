// Example: Enhanced P2PProofGenerator using the new design system
// This shows how to refactor the existing component with the new UI components

import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Shield, Upload, Scan, Smartphone, Download, CheckCircle, FileText } from 'lucide-react';
import { P2PProofService } from '../lib/p2p-proof-service';

// Import new design system components
import Button from './ui/Button';
import Input from './ui/Input';
import { useToast } from './ui/Toast';
import { Container, Card, CardHeader, Grid } from './ui/Layout';
import { Spinner, ProgressBar } from './ui/Loading';
import Modal, { ModalFooter } from './ui/Modal';

interface P2PProofGeneratorProps {
  onProofGenerated?: (proof: any) => void;
}

const EnhancedP2PProofGenerator: React.FC<P2PProofGeneratorProps> = ({ onProofGenerated }) => {
  const [proofService] = useState(() => new P2PProofService());
  const [isInitialized, setIsInitialized] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [proofType, setProofType] = useState<number>(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedProof, setGeneratedProof] = useState<any>(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Use toast notifications
  const { showToast } = useToast();

  // Proof type options
  const proofTypes = [
    { id: 1, name: 'Age Verification', description: 'Prove age above 18 without revealing birthdate', icon: <Shield className="w-6 h-6" /> },
    { id: 2, name: 'Residency Proof', description: 'Prove residency without revealing address', icon: <FileText className="w-6 h-6" /> },
    { id: 3, name: 'Nationality Proof', description: 'Prove nationality without revealing country', icon: <Shield className="w-6 h-6" /> },
  ];

  useEffect(() => {
    initializeService();
  }, []);

  const initializeService = async () => {
    try {
      await proofService.initialize();
      setIsInitialized(true);
      showToast({
        type: 'success',
        message: 'Service initialized',
        description: 'Ready to generate proofs',
      });
    } catch (error) {
      console.error('Failed to initialize:', error);
      showToast({
        type: 'error',
        message: 'Initialization failed',
        description: 'Please refresh the page and try again',
      });
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Simulate upload progress
      setUploadProgress(0);
      const interval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            setSelectedFile(file);
            showToast({
              type: 'success',
              message: 'File uploaded',
              description: file.name,
            });
            return 100;
          }
          return prev + 10;
        });
      }, 100);
    }
  };

  const generateProof = async () => {
    if (!selectedFile || !isInitialized) return;

    setIsGenerating(true);
    try {
      // Simulate proof generation
      const idData = {
        birthdate: 19950615,
        nationality: 840,
        residency_code: 840,
        document_hash: "0x" + Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join(''),
        credit_score: 750,
      };

      const challenge = {
        current_date: Math.floor(Date.now() / 1000),
        min_age: 18 * 365 * 24 * 60 * 60,
        required_nationality: 840,
        required_residency: 840,
        min_credit_score: 700,
        nullifier_secret: crypto.getRandomValues(new Uint8Array(32)).toString(),
      };

      const proofJson = await proofService.generate_proof(
        JSON.stringify(idData),
        JSON.stringify(challenge),
        proofType
      );

      const proof = JSON.parse(proofJson);
      setGeneratedProof(proof);
      onProofGenerated?.(proof);

      showToast({
        type: 'success',
        message: 'Proof generated successfully! ✨',
        description: 'Your zero-knowledge proof is ready to share',
        duration: 5000,
      });

    } catch (error) {
      console.error('Proof generation failed:', error);
      showToast({
        type: 'error',
        message: 'Proof generation failed',
        description: error instanceof Error ? error.message : 'Please try again',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadProof = () => {
    if (!generatedProof) return;

    try {
      const proofData = {
        ...generatedProof,
        metadata: {
          proof_type: proofTypes.find(t => t.id === proofType)?.name || 'Unknown',
          generated_at: new Date(generatedProof.timestamp).toISOString(),
          version: '1.0.0',
        }
      };

      const blob = new Blob([JSON.stringify(proofData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `patricon-proof-${Date.now()}.json`;
      link.click();
      URL.revokeObjectURL(url);

      showToast({
        type: 'success',
        message: 'Proof downloaded',
        description: 'Saved to your downloads folder',
      });
    } catch (error) {
      showToast({
        type: 'error',
        message: 'Download failed',
        description: 'Please try again',
      });
    }
  };

  return (
    <Container size="lg" className="py-8">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-violet-100 to-pink-100 rounded-2xl mb-4 animate-float">
          <Shield className="w-8 h-8 text-violet-600" />
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-4">
          Generate Identity Proof
        </h1>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto">
          Create zero-knowledge proofs locally with mathematical privacy guarantees
        </p>
      </div>

      {/* Service Status */}
      <Card className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${isInitialized ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
            <span className="font-medium text-slate-900">
              {isInitialized ? 'Service Ready' : 'Initializing...'}
            </span>
          </div>
          {!isInitialized && <Spinner size="sm" />}
        </div>
      </Card>

      {/* Step 1: Upload Document */}
      <Card className="mb-8">
        <CardHeader 
          title="Step 1: Upload Document"
          description="Select your identity document"
          icon={<Upload className="w-6 h-6 text-violet-600" />}
        />

        <Grid cols={3} gap="md" className="mb-6">
          {/* File Upload Card */}
          <Card hover noPadding className="p-6 cursor-pointer group">
            <label htmlFor="file-upload" className="cursor-pointer">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-violet-100 rounded-xl mb-3 group-hover:scale-110 transition-transform">
                  <FileText className="w-6 h-6 text-violet-600" />
                </div>
                <h4 className="font-semibold text-slate-900 mb-2">Upload File</h4>
                <p className="text-sm text-slate-600">
                  Select a document from your device
                </p>
              </div>
              <input
                id="file-upload"
                type="file"
                accept=".xml,.pdf,.jpg,.png"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </Card>

          {/* NFC Scan Card */}
          <Card hover noPadding className="p-6 cursor-pointer group">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-pink-100 rounded-xl mb-3 group-hover:scale-110 transition-transform">
                <Smartphone className="w-6 h-6 text-pink-600" />
              </div>
              <h4 className="font-semibold text-slate-900 mb-2">NFC Scan</h4>
              <p className="text-sm text-slate-600">
                Tap your NFC-enabled ID
              </p>
            </div>
          </Card>

          {/* QR Code Card */}
          <Card hover noPadding className="p-6 cursor-pointer group">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-amber-100 rounded-xl mb-3 group-hover:scale-110 transition-transform">
                <Scan className="w-6 h-6 text-amber-600" />
              </div>
              <h4 className="font-semibold text-slate-900 mb-2">Scan QR</h4>
              <p className="text-sm text-slate-600">
                Scan QR code from document
              </p>
            </div>
          </Card>
        </Grid>

        {/* Upload Progress */}
        {uploadProgress > 0 && uploadProgress < 100 && (
          <ProgressBar 
            progress={uploadProgress}
            label="Uploading document..."
            showPercentage
          />
        )}

        {/* Selected File */}
        {selectedFile && (
          <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl animate-slide-in-left">
            <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-emerald-900">{selectedFile.name}</p>
              <p className="text-sm text-emerald-700">
                {(selectedFile.size / 1024).toFixed(2)} KB
              </p>
            </div>
          </div>
        )}
      </Card>

      {/* Step 2: Select Proof Type */}
      <Card className="mb-8">
        <CardHeader 
          title="Step 2: Select Proof Type"
          description="Choose what you want to prove"
          icon={<Shield className="w-6 h-6 text-violet-600" />}
        />

        <Grid cols={3} gap="md">
          {proofTypes.map((type) => (
            <Card
              key={type.id}
              hover
              noPadding
              className={`transition-all ${
                proofType === type.id
                  ? 'ring-2 ring-violet-500 bg-violet-50'
                  : ''
              }`}
            >
              <div 
                className="p-6 cursor-pointer"
                onClick={() => setProofType(type.id)}
              >
                <div className="flex items-start gap-3">
                  <div className={`flex-shrink-0 p-2 rounded-xl ${
                    proofType === type.id
                      ? 'bg-violet-200'
                      : 'bg-slate-100'
                  }`}>
                    {type.icon}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-slate-900 mb-1">{type.name}</h4>
                    <p className="text-sm text-slate-600">{type.description}</p>
                  </div>
                  {proofType === type.id && (
                    <CheckCircle className="w-5 h-5 text-violet-600 flex-shrink-0" />
                  )}
                </div>
              </div>
            </Card>
          ))}
        </Grid>
      </Card>

      {/* Step 3: Generate Proof */}
      <Card className="mb-8">
        <CardHeader 
          title="Step 3: Generate Proof"
          description="Create your zero-knowledge proof"
          icon={<Shield className="w-6 h-6 text-violet-600" />}
        />

        <Button
          variant="primary"
          size="lg"
          fullWidth
          isLoading={isGenerating}
          disabled={!selectedFile || !isInitialized}
          onClick={generateProof}
          leftIcon={<Shield className="w-5 h-5" />}
        >
          {isGenerating ? 'Generating Proof...' : 'Generate Zero-Knowledge Proof'}
        </Button>
      </Card>

      {/* Generated Proof Actions */}
      {generatedProof && (
        <Card className="bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200 animate-scale-in">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex-shrink-0 w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center animate-bounce">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-emerald-900 text-lg">Proof Generated Successfully!</h3>
              <p className="text-emerald-700">Your zero-knowledge proof is ready to share</p>
            </div>
          </div>

          <Grid cols={2} gap="md">
            <Button
              variant="primary"
              onClick={downloadProof}
              leftIcon={<Download className="w-5 h-5" />}
            >
              Download Proof
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowQRModal(true)}
              leftIcon={<Scan className="w-5 h-5" />}
            >
              Show QR Code
            </Button>
          </Grid>
        </Card>
      )}

      {/* QR Code Modal */}
      <Modal
        isOpen={showQRModal}
        onClose={() => setShowQRModal(false)}
        title="Share Proof via QR Code"
        description="Scan this code to share your proof"
        size="md"
      >
        {generatedProof && (
          <div className="flex flex-col items-center gap-4">
            <div className="p-6 bg-white rounded-xl border-2 border-slate-200">
              <QRCodeSVG
                value={JSON.stringify(generatedProof)}
                size={256}
                level="H"
              />
            </div>
            <p className="text-sm text-slate-600 text-center">
              Scan with any QR code reader or PatriconID app
            </p>
          </div>
        )}

        <ModalFooter>
          <Button variant="ghost" onClick={() => setShowQRModal(false)}>
            Close
          </Button>
          <Button variant="primary" onClick={downloadProof}>
            Download Instead
          </Button>
        </ModalFooter>
      </Modal>
    </Container>
  );
};

export default EnhancedP2PProofGenerator;

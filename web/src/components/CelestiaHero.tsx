import React from "react";
import { Shield, Lock, Zap, CheckCircle } from "lucide-react";

export default function CelestiaHero() {
  return (
    <div className="w-full">
      {/* Hero Section */}
      <div className="flex flex-col justify-center items-center text-center px-6 py-20 max-w-5xl mx-auto">
        <h1 className="font-extrabold text-4xl sm:text-5xl md:text-6xl lg:text-7xl leading-tight text-black mb-6 animate-fade-in">
          The first modular<br />blockchain network
        </h1>
        <p className="font-normal text-base sm:text-lg md:text-xl text-black/70 max-w-3xl mx-auto mb-8 animate-fade-in delay-100">
          PatriconID is a privacy-first decentralized identity verification platform that makes it easy for anyone to securely prove their identity without revealing personal data.
        </p>
      </div>

      {/* Features Cards */}
      <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-8 shadow-lg border border-black/5 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
            <Shield className="w-7 h-7 text-white" />
          </div>
          <h3 className="text-xl font-bold text-black mb-3">Zero-Knowledge Proofs</h3>
          <p className="text-black/70 text-sm leading-relaxed">
            Prove your identity attributes without revealing the underlying personal data. Mathematical privacy guarantees.
          </p>
        </div>

        <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-8 shadow-lg border border-black/5 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <div className="w-14 h-14 bg-gradient-to-br from-pink-500 to-rose-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
            <Lock className="w-7 h-7 text-white" />
          </div>
          <h3 className="text-xl font-bold text-black mb-3">Blockchain Verified</h3>
          <p className="text-black/70 text-sm leading-relaxed">
            Verify proofs on-chain using smart contracts. Public verification with complete privacy preservation.
          </p>
        </div>

        <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-8 shadow-lg border border-black/5 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <div className="w-14 h-14 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
            <Zap className="w-7 h-7 text-white" />
          </div>
          <h3 className="text-xl font-bold text-black mb-3">P2P Architecture</h3>
          <p className="text-black/70 text-sm leading-relaxed">
            Direct peer-to-peer proof sharing. No central authority. Complete user control over data.
          </p>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="max-w-4xl mx-auto px-6 mb-16">
        <h2 className="text-3xl md:text-4xl font-bold text-black text-center mb-12">How It Works</h2>
        <div className="space-y-6">
          <div className="bg-white/95 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-black/5 flex items-start gap-4">
            <div className="w-10 h-10 bg-purple-500 rounded-xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0 shadow-md">
              1
            </div>
            <div>
              <h4 className="font-bold text-black mb-2">Upload Your Document</h4>
              <p className="text-black/70 text-sm">Upload your Aadhaar XML or scan NFC-enabled ID. All processing happens locally in your browser.</p>
            </div>
          </div>

          <div className="bg-white/95 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-black/5 flex items-start gap-4">
            <div className="w-10 h-10 bg-pink-500 rounded-xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0 shadow-md">
              2
            </div>
            <div>
              <h4 className="font-bold text-black mb-2">Generate Zero-Knowledge Proof</h4>
              <p className="text-black/70 text-sm">Create cryptographic proofs for age, residency, or nationality without revealing the actual data.</p>
            </div>
          </div>

          <div className="bg-white/95 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-black/5 flex items-start gap-4">
            <div className="w-10 h-10 bg-cyan-500 rounded-xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0 shadow-md">
              3
            </div>
            <div>
              <h4 className="font-bold text-black mb-2">Share & Verify</h4>
              <p className="text-black/70 text-sm">Share proofs via QR code or verify them on-chain. Anyone can verify without seeing your personal information.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

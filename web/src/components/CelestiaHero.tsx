import React from "react";
import { Shield, Lock, Zap, CheckCircle } from "lucide-react";

export default function CelestiaHero() {
  return (
    <div className="w-full relative overflow-hidden">
      {/* Hero Section */}
      <div className="relative flex flex-col justify-center items-center text-center px-4 sm:px-6 lg:px-8 py-16 sm:py-24 lg:py-32 max-w-7xl mx-auto">
        {/* Badge */}
        <div className="inline-block mb-8 animate-slide-up">
          <div className="glass-card px-6 py-3 text-indigo-400 rounded-full text-sm sm:text-base font-semibold hover:scale-105 transition-transform duration-300">
            <span className="inline-flex items-center gap-2">
              <span className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse"></span>
              Privacy-First Identity Verification
            </span>
          </div>
        </div>
        
        {/* Main Headline */}
        <h1 className="font-black text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl leading-[1.1] mb-6 sm:mb-8 animate-slide-up tracking-tight text-white" style={{ animationDelay: '0.1s' }}>
          <span className="block mb-2 sm:mb-3">P2P Identity Proof</span>
          <span className="block bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 font-extrabold">
            Generator
          </span>
        </h1>
        
        {/* Subheadline */}
        <p className="font-normal text-base sm:text-lg md:text-xl lg:text-2xl text-gray-300 max-w-4xl mx-auto mb-12 sm:mb-16 animate-slide-up leading-relaxed px-4" style={{ animationDelay: '0.2s' }}>
          Generate zero-knowledge proofs locally with mathematical privacy guarantees. Your data never leaves your device.
        </p>
        
        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 w-full sm:w-auto px-4 sm:px-0 animate-slide-up" style={{ animationDelay: '0.3s' }}>
          <button className="group relative px-8 sm:px-10 py-4 sm:py-5 bg-black text-white rounded-2xl font-bold text-base sm:text-lg shadow-2xl hover:shadow-3xl hover:scale-105 transition-all duration-300 overflow-hidden">
            <span className="relative z-10 flex items-center justify-center gap-2">
              Launch App
              <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </span>
          </button>
          <button className="px-8 sm:px-10 py-4 sm:py-5 bg-white/80 backdrop-blur-xl text-black rounded-2xl font-bold text-base sm:text-lg shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 border border-black/10 hover:bg-white/90">
            Explore
          </button>
        </div>
      </div>

      {/* Features Cards - Improved Design */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-20 sm:mb-32">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {/* Feature 1 */}
          <div className="group relative bg-white/90 backdrop-blur-2xl rounded-3xl p-6 sm:p-8 border border-purple-100/50 hover:border-purple-200 transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 animate-slide-up" style={{ animationDelay: '0.4s' }}>
            <div className="absolute inset-0 bg-gradient-to-br from-purple-50/50 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-black mb-4">Zero-Knowledge Proofs</h3>
              <p className="text-black/60 text-sm sm:text-base leading-relaxed">
                Prove your identity attributes without revealing the underlying personal data. Mathematical privacy guarantees.
              </p>
            </div>
          </div>

          {/* Feature 2 */}
          <div className="group relative bg-white/90 backdrop-blur-2xl rounded-3xl p-6 sm:p-8 border border-pink-100/50 hover:border-pink-200 transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 animate-slide-up" style={{ animationDelay: '0.5s' }}>
            <div className="absolute inset-0 bg-gradient-to-br from-pink-50/50 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative">
              <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-rose-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                <Lock className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-black mb-4">Blockchain Verified</h3>
              <p className="text-black/60 text-sm sm:text-base leading-relaxed">
                Verify proofs on-chain using smart contracts. Public verification with complete privacy preservation.
              </p>
            </div>
          </div>

          {/* Feature 3 */}
          <div className="group relative bg-white/90 backdrop-blur-2xl rounded-3xl p-6 sm:p-8 border border-cyan-100/50 hover:border-cyan-200 transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 animate-slide-up" style={{ animationDelay: '0.6s' }}>
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-50/50 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative">
              <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-black mb-4">P2P Architecture</h3>
              <p className="text-black/60 text-sm sm:text-base leading-relaxed">
                Direct peer-to-peer proof sharing. No central authority. Complete user control over data.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works Section - Beautiful redesign */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mb-20 sm:mb-32">
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-black mb-4">How It Works</h2>
          <p className="text-lg text-black/60 max-w-2xl mx-auto">Three simple steps to secure, private identity verification</p>
        </div>
        
        <div className="space-y-6 sm:space-y-8">
          {/* Step 1 */}
          <div className="group relative bg-white/80 backdrop-blur-2xl rounded-3xl p-6 sm:p-8 border border-purple-100/50 hover:border-purple-200 transition-all duration-500 hover:shadow-2xl animate-slide-in-left" style={{ animationDelay: '0.7s' }}>
            <div className="flex flex-col sm:flex-row items-start gap-6">
              <div className="flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center text-white font-black text-2xl sm:text-3xl shadow-xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                1
              </div>
              <div className="flex-1">
                <h4 className="text-xl sm:text-2xl font-bold text-black mb-3">Upload Your Document</h4>
                <p className="text-black/60 text-base sm:text-lg leading-relaxed">
                  Upload your Aadhaar XML or scan NFC-enabled ID. All processing happens locally in your browser.
                </p>
              </div>
            </div>
          </div>

          {/* Step 2 */}
          <div className="group relative bg-white/80 backdrop-blur-2xl rounded-3xl p-6 sm:p-8 border border-pink-100/50 hover:border-pink-200 transition-all duration-500 hover:shadow-2xl animate-slide-in-left" style={{ animationDelay: '0.8s' }}>
            <div className="flex flex-col sm:flex-row items-start gap-6">
              <div className="flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-pink-500 to-rose-600 rounded-2xl flex items-center justify-center text-white font-black text-2xl sm:text-3xl shadow-xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                2
              </div>
              <div className="flex-1">
                <h4 className="text-xl sm:text-2xl font-bold text-black mb-3">Generate Zero-Knowledge Proof</h4>
                <p className="text-black/60 text-base sm:text-lg leading-relaxed">
                  Create cryptographic proofs for age, residency, or nationality without revealing the actual data.
                </p>
              </div>
            </div>
          </div>

          {/* Step 3 */}
          <div className="group relative bg-white/80 backdrop-blur-2xl rounded-3xl p-6 sm:p-8 border border-cyan-100/50 hover:border-cyan-200 transition-all duration-500 hover:shadow-2xl animate-slide-in-left" style={{ animationDelay: '0.9s' }}>
            <div className="flex flex-col sm:flex-row items-start gap-6">
              <div className="flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center text-white font-black text-2xl sm:text-3xl shadow-xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                3
              </div>
              <div className="flex-1">
                <h4 className="text-xl sm:text-2xl font-bold text-black mb-3">Share & Verify</h4>
                <p className="text-black/60 text-base sm:text-lg leading-relaxed">
                  Share proofs via QR code or verify them on-chain. Anyone can verify without seeing your personal information.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

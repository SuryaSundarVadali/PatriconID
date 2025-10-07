import React, { useState } from 'react';
import CelestiaHero from './components/CelestiaHero';
import P2PProofGenerator from './components/P2PProofGenerator';
import P2PProofVerifier from './components/P2PProofVerifier';
import Web3ProofDashboard from './components/Web3ProofDashboard';
import { Shield, Home } from 'lucide-react';

type Page = 'home' | 'generate' | 'verify' | 'web3';

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('home');

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#b794f6] via-[#e5a4ff] to-[#ffd6a5] font-inter relative overflow-hidden">
      {/* Animated background gradient overlays */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute left-1/4 top-0 w-[900px] h-[900px] bg-gradient-radial from-[#b794f6]/40 via-[#e5a4ff]/30 to-transparent blur-3xl opacity-60 animate-gradient-move" />
        <div className="absolute right-0 top-1/2 w-[700px] h-[700px] bg-gradient-radial from-[#ffd6a5]/40 via-[#ffe4b5]/30 to-transparent blur-3xl opacity-50 animate-gradient-move2" />
      </div>

      {/* Navbar */}
      <nav className="fixed top-0 left-0 w-full flex items-center justify-between px-8 py-4 z-50 bg-white/80 backdrop-blur-xl border-b border-black/5 shadow-sm">
        <button 
          onClick={() => setCurrentPage('home')}
          className="flex items-center gap-2 hover:opacity-70 transition-opacity"
        >
          <Shield className="w-6 h-6 text-black" />
          <span className="font-bold text-lg tracking-wide text-black">PATRICONID</span>
        </button>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setCurrentPage('generate')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
              currentPage === 'generate' 
                ? 'bg-black text-white' 
                : 'text-black hover:bg-black/5'
            }`}
          >
            Generate
          </button>
          <button 
            onClick={() => setCurrentPage('verify')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
              currentPage === 'verify' 
                ? 'bg-black text-white' 
                : 'text-black hover:bg-black/5'
            }`}
          >
            Verify
          </button>
          <button 
            onClick={() => setCurrentPage('web3')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
              currentPage === 'web3' 
                ? 'bg-black text-white' 
                : 'text-black hover:bg-black/5'
            }`}
          >
            Dashboard
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative z-10 flex flex-col items-center px-6 pt-24 pb-20 min-h-screen">
        {currentPage === 'home' ? (
          <>
            <CelestiaHero />
            <div className="flex flex-col sm:flex-row gap-4 mt-8">
              <button
                onClick={() => setCurrentPage('generate')}
                className="px-8 py-3 bg-black text-white font-semibold rounded-xl hover:bg-gray-800 transition-all duration-200 shadow-lg"
              >
                Launch App
              </button>
              <button 
                onClick={() => setCurrentPage('web3')}
                className="px-8 py-3 bg-white text-black font-semibold rounded-xl hover:bg-gray-50 transition-all duration-200 shadow-lg border border-black/10"
              >
                Explore
              </button>
            </div>
          </>
        ) : (
          <div className="w-full">
            {/* Back Home Button */}
            <div className="max-w-6xl mx-auto px-6 mb-6">
              <button
                onClick={() => setCurrentPage('home')}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-white text-black font-medium rounded-xl hover:bg-gray-50 transition-all duration-200 shadow-lg border border-black/5"
              >
                <Home className="w-4 h-4" />
                <span>Home</span>
              </button>
            </div>

            {/* Page Content */}
            <div className="w-full">
              {currentPage === 'generate' && <P2PProofGenerator />}
              {currentPage === 'verify' && <P2PProofVerifier />}
              {currentPage === 'web3' && <Web3ProofDashboard />}
            </div>
          </div>
        )}
      </main>
      {/* Footer */}
      <footer className="relative z-10 py-12 bg-black text-white mt-auto">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Shield className="w-6 h-6" />
                <span className="text-xl font-bold">PATRICONID</span>
              </div>
              <p className="text-gray-400 text-sm">Privacy-first decentralized identity verification with zero-knowledge proofs</p>
            </div>
            <div>
              <h4 className="font-bold mb-4 text-sm">Resources</h4>
              <div className="space-y-2 text-sm">
                <a href="#" className="block text-gray-400 hover:text-white transition-colors">Documentation</a>
                <a href="#" className="block text-gray-400 hover:text-white transition-colors">GitHub</a>
                <a href="#" className="block text-gray-400 hover:text-white transition-colors">Whitepaper</a>
              </div>
            </div>
            <div>
              <h4 className="font-bold mb-4 text-sm">Privacy</h4>
              <p className="text-gray-400 text-sm">🔒 100% local processing. Zero data collection. Mathematical privacy guarantees.</p>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-6 text-center">
            <p className="text-gray-500 text-sm">Built with ❤️ for the decentralized web</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
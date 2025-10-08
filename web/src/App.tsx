import React, { useState } from 'react';
import CelestiaHero from './components/CelestiaHero';
import P2PProofGenerator from './components/P2PProofGenerator';
import P2PProofVerifier from './components/P2PProofVerifier';
import Web3ProofDashboard from './components/Web3ProofDashboard';
import { Shield, Home, Menu, X } from 'lucide-react';

type Page = 'home' | 'generate' | 'verify' | 'web3';

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handlePageChange = (page: Page) => {
    setCurrentPage(page);
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-900 font-inter relative overflow-x-hidden">
      {/* Dark glassmorphism background */}
      <div className="fixed top-0 left-0 right-0 bottom-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 opacity-30 blur-[100px] z-0"></div>

      {/* Navbar */}
      <nav className="fixed top-0 left-0 w-full flex items-center justify-between px-6 py-4 z-50">
        <div className="glass-card rounded-xl flex items-center justify-between p-3 w-full max-w-6xl mx-auto">
          <button 
            onClick={() => handlePageChange('home')}
            className="flex items-center gap-2 hover:opacity-70 transition-opacity"
          >
            <Shield className="w-8 h-8 text-indigo-400" />
            <span className="font-bold text-xl tracking-wide text-white">PatriconID</span>
          </button>
          
          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-2">
            <button 
              onClick={() => handlePageChange('generate')}
              className={`btn-secondary text-sm font-medium px-4 py-2 rounded-lg transition-all duration-200 ${
                currentPage === 'generate' 
                  ? 'btn-primary text-white' 
                  : 'text-white hover:bg-white/20'
              }`}
            >
              Generate
            </button>
            <button 
              onClick={() => handlePageChange('verify')}
              className={`btn-secondary text-sm font-medium px-4 py-2 rounded-lg transition-all duration-200 ${
                currentPage === 'verify' 
                  ? 'btn-primary text-white' 
                  : 'text-white hover:bg-white/20'
              }`}
            >
              Verify
            </button>
            <button 
              onClick={() => handlePageChange('web3')}
              className={`btn-secondary text-sm font-medium px-4 py-2 rounded-lg transition-all duration-200 ${
                currentPage === 'web3' 
                  ? 'btn-primary text-white' 
                  : 'text-white hover:bg-white/20'
              }`}
            >
              Dashboard
            </button>
          </div>
          
          {/* Mobile Menu Button */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-md text-gray-300 hover:text-white hover:bg-white/10 focus:outline-none transition-all"
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="absolute top-full left-6 right-6 mt-2 glass-card rounded-lg p-2 md:hidden">
            <button 
              onClick={() => handlePageChange('generate')}
              className={`block w-full text-left text-sm px-4 py-2 rounded-md transition-colors ${
                currentPage === 'generate' 
                  ? 'text-indigo-400 bg-white/10' 
                  : 'text-white hover:bg-white/10'
              }`}
            >
              Generate
            </button>
            <button 
              onClick={() => handlePageChange('verify')}
              className={`block w-full text-left text-sm px-4 py-2 rounded-md transition-colors ${
                currentPage === 'verify' 
                  ? 'text-indigo-400 bg-white/10' 
                  : 'text-white hover:bg-white/10'
              }`}
            >
              Verify
            </button>
            <button 
              onClick={() => handlePageChange('web3')}
              className={`block w-full text-left text-sm px-4 py-2 rounded-md transition-colors ${
                currentPage === 'web3' 
                  ? 'text-indigo-400 bg-white/10' 
                  : 'text-white hover:bg-white/10'
              }`}
            >
              Dashboard
            </button>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main className="relative z-10 flex flex-col items-center px-6 pt-32 pb-20 min-h-screen text-gray-200">
        {currentPage === 'home' ? (
          <>
            <CelestiaHero />
            <div className="flex flex-col sm:flex-row gap-4 mt-8">
              <button
                onClick={() => setCurrentPage('generate')}
                className="btn-primary px-8 py-3 text-white font-semibold rounded-xl hover:shadow-[0_0_15px_rgba(79,70,229,0.6)] transition-all duration-200"
              >
                Launch App
              </button>
              <button 
                onClick={() => setCurrentPage('web3')}
                className="btn-secondary px-8 py-3 text-white font-semibold rounded-xl hover:bg-white/20 transition-all duration-200"
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
                onClick={() => handlePageChange('home')}
                className="inline-flex items-center gap-2 px-6 py-2.5 btn-secondary text-white font-medium rounded-xl hover:bg-white/20 transition-all duration-200"
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
      <footer className="relative z-10 py-12 bg-black/50 backdrop-blur-sm text-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Shield className="w-6 h-6 text-indigo-400" />
                <span className="text-xl font-bold text-white">PatriconID</span>
              </div>
              <p className="text-gray-400 text-sm">Privacy-first decentralized identity verification with zero-knowledge proofs</p>
            </div>
            <div>
              <h4 className="font-bold mb-4 text-sm text-white">Resources</h4>
              <div className="space-y-2 text-sm">
                <a href="#" className="block text-gray-400 hover:text-white transition-colors">Documentation</a>
                <a href="https://github.com/SuryaSundarVadali/PatriconID" target="_blank" className="block text-gray-400 hover:text-white transition-colors">GitHub</a>
                <a href="#" className="block text-gray-400 hover:text-white transition-colors">Whitepaper</a>
              </div>
            </div>
            <div>
              <h4 className="font-bold mb-4 text-sm text-white">Privacy</h4>
              <p className="text-gray-400 text-sm">🔒 100% local processing. Zero data collection. Mathematical privacy guarantees.</p>
            </div>
          </div>
          <div className="border-t border-gray-700 pt-6 text-center">
            <p className="text-gray-500 text-sm">&copy; 2024 PatriconID. All Rights Reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
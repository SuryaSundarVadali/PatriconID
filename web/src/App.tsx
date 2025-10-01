import React, { useState, useEffect } from 'react'
import P2PProofGenerator from './components/P2PProofGenerator'
import P2PProofVerifier from './components/P2PProofVerifier'
import { Shield, Users, Lock, Zap, Globe, ArrowRight, CheckCircle } from 'lucide-react'
import './App.css'

function App() {
  const [activeTab, setActiveTab] = useState<'generate' | 'verify'>('generate')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simulate loading time for WASM initialization
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 2000)

    return () => clearTimeout(timer)
  }, [])

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-content">
          <Shield size={64} className="loading-icon" />
          <h1>PatriconID</h1>
          <div className="loading-spinner"></div>
          <p>Initializing P2P Identity Verification...</p>
          <div style={{ marginTop: '2rem', fontSize: '0.9rem', opacity: 0.7 }}>
            Loading Zero-Knowledge Protocols...
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <div className="logo">
            <Shield size={32} />
            <h1>PatriconID</h1>
          </div>
          <p className="tagline">P2P Decentralized Identity Verification</p>
        </div>
      </header>

      <main className="app-main">
        <div className="hero-section">
          <h2>Privacy-First Identity Verification</h2>
          <p>Generate and verify identity proofs without revealing personal data using zero-knowledge technology. Built for the decentralized web.</p>
          
          <div className="features">
            <div className="feature">
              <Users size={20} />
              <span>P2P Native</span>
            </div>
            <div className="feature">
              <Lock size={20} />
              <span>Zero-Knowledge</span>
            </div>
            <div className="feature">
              <Zap size={20} />
              <span>Client-Only</span>
            </div>
            <div className="feature">
              <Globe size={20} />
              <span>Decentralized</span>
            </div>
          </div>

          <div className="stats-section">
            <div className="stat-item">
              <div className="stat-number">100%</div>
              <div className="stat-label">Private</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">0</div>
              <div className="stat-label">Servers</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">∞</div>
              <div className="stat-label">Scalable</div>
            </div>
          </div>

          <div className="security-badges">
            <div className="security-badge">
              <CheckCircle size={16} />
              <span>Mathematical Privacy</span>
            </div>
            <div className="security-badge">
              <CheckCircle size={16} />
              <span>No Data Collection</span>
            </div>
            <div className="security-badge">
              <CheckCircle size={16} />
              <span>Open Source</span>
            </div>
          </div>
        </div>

        <div className="tabs">
          <button
            className={`tab ${activeTab === 'generate' ? 'active' : ''}`}
            onClick={() => setActiveTab('generate')}
          >
            <span>Generate Proof</span>
            <ArrowRight size={16} style={{ opacity: activeTab === 'generate' ? 1 : 0 }} />
          </button>
          <button
            className={`tab ${activeTab === 'verify' ? 'active' : ''}`}
            onClick={() => setActiveTab('verify')}
          >
            <span>Verify Proof</span>
            <ArrowRight size={16} style={{ opacity: activeTab === 'verify' ? 1 : 0 }} />
          </button>
        </div>

        <div className="tab-content">
          {activeTab === 'generate' ? (
            <P2PProofGenerator />
          ) : (
            <P2PProofVerifier />
          )}
        </div>
      </main>

      <footer className="app-footer">
        <div className="footer-content">
          <div className="footer-links">
            <a href="https://noir-lang.org" target="_blank" rel="noopener noreferrer">Noir ZK</a>
            <a href="https://ethereum.org" target="_blank" rel="noopener noreferrer">Ethereum</a>
            <a href="https://reactjs.org" target="_blank" rel="noopener noreferrer">React</a>
            <a href="https://github.com/patriconid" target="_blank" rel="noopener noreferrer">GitHub</a>
          </div>
          
          <div className="privacy-note">
            🔒 All cryptographic operations happen locally in your browser. No personal data is ever transmitted or stored on external servers.
          </div>
          
          <div className="footer-bottom">
            <p>Built with ❤️ for the decentralized web</p>
            <p className="version">v1.0.0 • P2P Native • Privacy-First</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App
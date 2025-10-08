import React, { useState } from 'react';
import { Shield, Zap, CheckCircle, Users } from 'lucide-react';
import P2PProofGenerator from './P2PProofGenerator';
import P2PProofVerifier from './P2PProofVerifier';
import { Web3ProofIntegration, useWeb3Identity } from './Web3ProofIntegration';
import type { Web3ProofData, ContractVerificationResult } from '../lib/types';

interface ProofWithMetadata {
  id: string;
  type: number;
  proof: string;
  publicSignals: string[];
  nullifierHash: string;
  commitment: string;
  signature: string;
  timestamp: number;
  verified?: boolean;
  onChainResult?: ContractVerificationResult;
}

export function Web3ProofDashboard() {
  const [isWeb3Connected, setIsWeb3Connected] = useState(false);
  const [activeTab, setActiveTab] = useState<'generate' | 'verify' | 'web3'>('generate');
  const [proofs, setProofs] = useState<ProofWithMetadata[]>([]);
  const { verifyProofOnChain } = useWeb3Identity();

  const handleProofGenerated = (proof: any) => {
    const newProof: ProofWithMetadata = {
      id: `proof_${Date.now()}`,
      type: proof.proofType || 1,
      proof: proof.proof,
      publicSignals: proof.public_signals || [],
      nullifierHash: proof.nullifier_hash || '',
      commitment: proof.commitment || '',
      signature: proof.signature || '',
      timestamp: proof.timestamp || Date.now()
    };
    
    setProofs(prev => [newProof, ...prev]);
  };

  const handleVerificationComplete = (result: ContractVerificationResult) => {
    console.log('Verification completed:', result);
    // Update the latest proof with verification result
    setProofs(prev => prev.map((proof, index) => 
      index === 0 ? { ...proof, verified: result.isValid, onChainResult: result } : proof
    ));
  };

  const verifyProofOnBlockchain = async (proof: ProofWithMetadata) => {
    if (!isWeb3Connected) {
      alert('Please connect your Web3 wallet first');
      return;
    }

    try {
      const web3ProofData: Web3ProofData = {
        proof: proof.proof,
        publicInputs: proof.publicSignals,
        passkeySignature: proof.signature,
        proofType: proof.type,
        nullifierHash: proof.nullifierHash,
        commitment: proof.commitment
      };

      const result = await verifyProofOnChain(web3ProofData);
      
      // Update proof with result
      setProofs(prev => prev.map(p => 
        p.id === proof.id 
          ? { ...p, verified: result.isValid, onChainResult: result }
          : p
      ));

      if (result.isValid) {
        alert('Proof verified successfully on blockchain!');
      } else {
        alert(`Verification failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Verification error:', error);
      alert(`Verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <div className="container mx-auto px-6 pt-8 pb-12">
      <div className="max-w-6xl mx-auto text-center mb-8">
        <h1 className="text-4xl md:text-6xl font-bold text-white tracking-tight">
          Web3 Identity Dashboard
        </h1>
        <p className="mt-4 text-lg md:text-xl text-gray-300 max-w-3xl mx-auto">
          Generate cryptographic identity proofs and verify them on-chain using smart contracts. 
          Your privacy is mathematically guaranteed through zero-knowledge technology.
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="flex justify-center mb-12">
        <div className="glass-card rounded-2xl p-2 inline-flex">
          <button
            onClick={() => setActiveTab('generate')}
            className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 flex items-center space-x-2 ${
              activeTab === 'generate'
                ? 'btn-primary text-white'
                : 'text-gray-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>Generate Proof</span>
          </button>
          <button
            onClick={() => setActiveTab('verify')}
            className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 flex items-center space-x-2 ${
              activeTab === 'verify'
                ? 'btn-primary text-white'
                : 'text-gray-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <CheckCircle className="w-4 h-4" />
            <span>Verify Proof</span>
          </button>
          <button
            onClick={() => setActiveTab('web3')}
            className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 flex items-center space-x-2 ${
              activeTab === 'web3'
                ? 'btn-primary text-white'
                : 'text-gray-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <Zap className="w-4 h-4" />
            <span>Web3 Wallet</span>
            {isWeb3Connected && (
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="xl:col-span-2">
          {activeTab === 'generate' && (
            <div className="space-y-8">
              <P2PProofGenerator onProofGenerated={handleProofGenerated} />
              
              {/* Recent Proofs */}
              {proofs.length > 0 && (
                <div className="glass-card rounded-2xl p-6 md:p-8">
                  <h3 className="text-2xl font-bold text-white mb-6">
                    Generated Proofs
                  </h3>
                  <div className="space-y-4">
                    {proofs.slice(0, 3).map((proof, index) => (
                      <div
                        key={proof.id}
                        className="glass-card p-6 rounded-xl hover:bg-white/10 transition-all duration-300"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <Shield className="w-5 h-5 text-indigo-400" />
                            <span className="text-white font-semibold">
                              Proof Type {proof.type}
                            </span>
                            {proof.verified !== undefined && (
                              <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${
                                proof.verified 
                                  ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                                  : 'bg-red-500/20 text-red-400 border border-red-500/30'
                              }`}>
                                <CheckCircle className="w-3 h-3" />
                                <span>{proof.verified ? 'Verified On-Chain' : 'Verification Failed'}</span>
                              </div>
                            )}
                          </div>
                          <button
                            onClick={() => verifyProofOnBlockchain(proof)}
                            disabled={!isWeb3Connected}
                            className="btn-primary text-sm px-4 py-2 rounded-lg flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Zap className="w-4 h-4" />
                            <span>Verify On-Chain</span>
                          </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div className="glass-card p-3 rounded-lg">
                            <span className="text-gray-400 block mb-1">Nullifier Hash</span>
                            <span className="text-white font-mono text-xs">{proof.nullifierHash.slice(0, 20)}...</span>
                          </div>
                          <div className="glass-card p-3 rounded-lg">
                            <span className="text-gray-400 block mb-1">Generated</span>
                            <span className="text-white">{new Date(proof.timestamp).toLocaleString()}</span>
                          </div>
                          {proof.onChainResult?.transactionHash && (
                            <div className="md:col-span-2 glass-card p-3 rounded-lg">
                              <span className="text-gray-400 block mb-1">Transaction Hash</span>
                              <span className="text-white font-mono text-xs">{proof.onChainResult.transactionHash.slice(0, 30)}...</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'verify' && (
            <P2PProofVerifier />
          )}

          {activeTab === 'web3' && (
            <div className="space-y-8">
              <div className="glass-card rounded-2xl p-6 md:p-8">
                <h2 className="text-3xl font-bold text-white mb-4">
                  Web3 Integration
                </h2>
                <p className="text-gray-300 mb-8 text-lg">
                  Connect your Web3 wallet to verify proofs on the blockchain using our deployed smart contract.
                  Experience the power of decentralized identity verification.
                </p>
                
                {/* Connection Status */}
                <div className={`glass-card p-6 rounded-2xl mb-8 ${
                  isWeb3Connected 
                    ? 'border-green-500/30' 
                    : 'border-yellow-500/30'
                }`}>
                  <div className="flex items-center space-x-4">
                    <div className={`w-4 h-4 rounded-full animate-pulse ${
                      isWeb3Connected ? 'bg-green-400' : 'bg-yellow-400'
                    }`}></div>
                    <div>
                      <h4 className={`font-semibold text-lg ${
                        isWeb3Connected ? 'text-green-400' : 'text-yellow-400'
                      }`}>
                        {isWeb3Connected 
                          ? 'Web3 Wallet Connected' 
                          : 'Connect Your Web3 Wallet'
                        }
                      </h4>
                      <p className="text-gray-400">
                        {isWeb3Connected 
                          ? 'Ready for on-chain verification and blockchain interactions' 
                          : 'Connect your wallet to enable blockchain verification features'
                        }
                      </p>
                    </div>
                  </div>
                </div>

                {/* Features Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[
                    {
                      icon: <Shield className="w-6 h-6" />,
                      title: "On-Chain Verification",
                      description: "Verify proofs directly on Ethereum blockchain with immutable records"
                    },
                    {
                      icon: <CheckCircle className="w-6 h-6" />,
                      title: "Immutable Records",
                      description: "All verification results are permanently stored on the blockchain"
                    },
                    {
                      icon: <Zap className="w-6 h-6" />,
                      title: "Nullifier Protection",
                      description: "Prevent double-spending with cryptographic nullifier tracking"
                    },
                    {
                      icon: <Users className="w-6 h-6" />,
                      title: "Gas Optimized",
                      description: "Smart contract verification uses minimal gas for cost efficiency"
                    }
                  ].map((feature, index) => (
                    <div key={index} className="glass-card p-6 rounded-xl hover:bg-white/10 transition-all duration-300">
                      <div className="flex items-start space-x-4">
                        <div className="p-2 bg-indigo-500/20 rounded-lg text-indigo-400">
                          {feature.icon}
                        </div>
                        <div>
                          <h5 className="text-white font-semibold mb-2">{feature.title}</h5>
                          <p className="text-gray-400 text-sm">{feature.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="xl:col-span-1">
          <div className="sticky top-8 space-y-6">
            <Web3ProofIntegration
              onConnectionChange={setIsWeb3Connected}
              onVerificationComplete={handleVerificationComplete}
            />

            {/* Quick Start Guide */}
            <div className="glass-card rounded-2xl p-6">
              <h4 className="text-lg font-bold text-white mb-4">
                Quick Start Guide
              </h4>
              <div className="space-y-4">
                {[
                  {
                    step: "1",
                    title: "Connect Wallet",
                    description: "Connect your MetaMask wallet to enable blockchain features"
                  },
                  {
                    step: "2", 
                    title: "Generate Proof",
                    description: "Create a zero-knowledge identity proof with your data"
                  },
                  {
                    step: "3",
                    title: "Verify On-Chain",
                    description: "Submit your proof to the blockchain for verification"
                  }
                ].map((item, index) => (
                  <div key={index} className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 btn-primary text-white rounded-full flex items-center justify-center text-sm font-bold">
                        {item.step}
                      </div>
                    </div>
                    <div className="min-w-0">
                      <h5 className="text-white font-medium mb-1">{item.title}</h5>
                      <p className="text-gray-400 text-sm">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Stats Card */}
            <div className="glass-card rounded-2xl p-6">
              <h4 className="text-lg font-bold text-white mb-4">
                Network Status
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-white mb-1">100%</div>
                  <div className="text-gray-400 text-xs">Private</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white mb-1">0ms</div>
                  <div className="text-gray-400 text-xs">Latency</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white mb-1">∞</div>
                  <div className="text-gray-400 text-xs">Scalable</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400 mb-1">Live</div>
                  <div className="text-gray-400 text-xs">Network</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Web3ProofDashboard;
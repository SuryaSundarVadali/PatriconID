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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-blue-900/30 relative overflow-hidden">
      {/* Cosmic background elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-64 h-64 bg-gradient-to-br from-purple-600/20 to-blue-600/20 rounded-full blur-3xl"></div>
        <div className="absolute top-40 right-20 w-48 h-48 bg-gradient-to-br from-indigo-600/20 to-purple-600/20 rounded-full blur-2xl"></div>
        <div className="absolute bottom-20 left-1/4 w-32 h-32 bg-gradient-to-br from-blue-600/20 to-teal-600/20 rounded-full blur-xl"></div>
        <div className="absolute bottom-40 right-1/3 w-24 h-24 bg-gradient-to-br from-purple-600/20 to-pink-600/20 rounded-full blur-lg"></div>
      </div>
      
      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12 animate-fade-in">
          <div className="flex items-center justify-center gap-4 mb-6 animate-slide-up">
            <div className="p-4 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-2xl backdrop-blur-sm border border-white/10 animate-pulse-glow">
              <Shield className="h-12 w-12 text-purple-300 animate-float" />
            </div>
            <div className="text-left">
              <h1 className="text-5xl font-bold bg-gradient-to-r from-white via-purple-200 to-blue-200 bg-clip-text text-transparent mb-2 animate-slide-in-left">
                Web3 Identity
              </h1>
              <p className="text-xl text-purple-300/80 animate-slide-in-left delay-100">Blockchain-verified zero-knowledge proofs</p>
            </div>
          </div>
          <p className="text-lg text-purple-200/70 max-w-4xl mx-auto leading-relaxed animate-slide-up delay-200">
            Generate cryptographic identity proofs and verify them on-chain using smart contracts. 
            Your privacy is mathematically guaranteed through zero-knowledge technology.
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex justify-center mb-12 animate-scale-in delay-300">
          <div className="bg-black/20 backdrop-blur-xl border border-white/10 rounded-2xl p-2 inline-flex shadow-2xl hover:shadow-purple-500/20 transition-all duration-500">
            <button
              onClick={() => setActiveTab('generate')}
              className={`px-8 py-4 rounded-xl font-semibold transition-all duration-300 flex items-center gap-3 hover:scale-105 ${
                activeTab === 'generate'
                  ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-xl transform scale-105'
                  : 'text-purple-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <div className={`p-1 rounded-lg transition-all duration-300 ${
                activeTab === 'generate' ? 'bg-white/20 animate-pulse-glow' : 'bg-purple-500/20'
              }`}>
                <Shield className={`h-4 w-4 ${activeTab === 'generate' ? 'animate-pulse' : ''}`} />
              </div>
              Generate Proof
            </button>
            <button
              onClick={() => setActiveTab('verify')}
              className={`px-8 py-4 rounded-xl font-semibold transition-all duration-300 flex items-center gap-3 hover:scale-105 ${
                activeTab === 'verify'
                  ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-xl transform scale-105'
                  : 'text-purple-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <div className={`p-1 rounded-lg transition-all duration-300 ${
                activeTab === 'verify' ? 'bg-white/20 animate-pulse-glow' : 'bg-blue-500/20'
              }`}>
                <CheckCircle className={`h-4 w-4 ${activeTab === 'verify' ? 'animate-pulse' : ''}`} />
              </div>
              Verify Proof
            </button>
            <button
              onClick={() => setActiveTab('web3')}
              className={`px-8 py-4 rounded-xl font-semibold transition-all duration-300 flex items-center gap-3 hover:scale-105 ${
                activeTab === 'web3'
                  ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-xl transform scale-105'
                  : 'text-purple-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <div className={`p-1 rounded-lg transition-all duration-300 ${
                activeTab === 'web3' ? 'bg-white/20 animate-pulse-glow' : 'bg-indigo-500/20'
              }`}>
                <Zap className={`h-4 w-4 ${activeTab === 'web3' ? 'animate-pulse' : ''}`} />
              </div>
              Web3 Wallet
              {isWeb3Connected && (
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-lg shadow-green-400/50"></div>
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
                  <div className="relative overflow-hidden bg-gradient-to-br from-purple-900/20 via-blue-900/20 to-indigo-900/30 backdrop-blur-xl border border-white/10 rounded-2xl p-8 animate-slide-up delay-300 hover:shadow-2xl hover:shadow-purple-500/20 transition-all duration-500">
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-blue-500/5"></div>
                    <div className="relative z-10">
                      <h3 className="text-2xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent mb-6 animate-slide-in-left">
                        Generated Proofs
                      </h3>
                      <div className="space-y-4">
                        {proofs.slice(0, 3).map((proof, index) => (
                          <div
                            key={proof.id}
                            className="relative overflow-hidden bg-gradient-to-r from-gray-900/50 to-slate-900/50 backdrop-blur-sm border border-white/10 rounded-xl p-6 group hover:border-purple-400/30 hover:scale-[1.02] hover:shadow-2xl transition-all duration-300 animate-scale-in"
                            style={{ animationDelay: `${0.4 + index * 0.1}s` }}
                          >
                            <div className="absolute inset-0 bg-gradient-to-r from-purple-600/5 to-blue-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                            <div className="relative z-10">
                              <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                  <div className="p-2 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-lg">
                                    <Shield className="h-5 w-5 text-purple-300" />
                                  </div>
                                  <div>
                                    <span className="text-white font-semibold">
                                      Proof Type {proof.type}
                                    </span>
                                    {proof.verified !== undefined && (
                                      <div className={`inline-flex items-center gap-2 ml-3 px-3 py-1 rounded-full text-xs font-medium ${
                                        proof.verified 
                                          ? 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-300 border border-green-400/30' 
                                          : 'bg-gradient-to-r from-red-500/20 to-pink-500/20 text-red-300 border border-red-400/30'
                                      }`}>
                                        <CheckCircle className="h-3 w-3" />
                                        {proof.verified ? 'Verified On-Chain' : 'Verification Failed'}
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <button
                                  onClick={() => verifyProofOnBlockchain(proof)}
                                  disabled={!isWeb3Connected}
                                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium rounded-lg transition-all duration-300 transform hover:scale-110 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center gap-2 group/btn"
                                >
                                  <Zap className="h-4 w-4 group-hover/btn:scale-125 group-hover/btn:rotate-12 transition-all duration-300" />
                                  Verify On-Chain
                                </button>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                <div className="bg-black/20 backdrop-blur-sm border border-white/10 rounded-lg p-3">
                                  <span className="text-purple-300/80 block mb-1">Nullifier Hash</span>
                                  <span className="text-white font-mono text-xs">{proof.nullifierHash.slice(0, 20)}...</span>
                                </div>
                                <div className="bg-black/20 backdrop-blur-sm border border-white/10 rounded-lg p-3">
                                  <span className="text-purple-300/80 block mb-1">Generated</span>
                                  <span className="text-white">{new Date(proof.timestamp).toLocaleString()}</span>
                                </div>
                                {proof.onChainResult?.transactionHash && (
                                  <div className="md:col-span-2 bg-black/20 backdrop-blur-sm border border-white/10 rounded-lg p-3">
                                    <span className="text-purple-300/80 block mb-1">Transaction Hash</span>
                                    <span className="text-white font-mono text-xs">{proof.onChainResult.transactionHash.slice(0, 30)}...</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
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
                <div className="relative overflow-hidden bg-gradient-to-br from-purple-900/20 via-blue-900/20 to-indigo-900/30 backdrop-blur-xl border border-white/10 rounded-2xl p-8 animate-fade-in hover:shadow-2xl hover:shadow-purple-500/20 transition-all duration-500">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-blue-500/5"></div>
                  <div className="relative z-10">
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent mb-4 animate-slide-up">
                      Web3 Integration
                    </h2>
                    <p className="text-purple-200/80 mb-8 text-lg leading-relaxed animate-slide-up delay-100">
                      Connect your Web3 wallet to verify proofs on the blockchain using our deployed smart contract.
                      Experience the power of decentralized identity verification.
                    </p>
                    
                    {/* Connection Status Banner */}
                    <div className={`relative overflow-hidden backdrop-blur-sm border rounded-2xl p-6 mb-8 transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl animate-scale-in delay-200 ${
                      isWeb3Connected 
                        ? 'bg-gradient-to-r from-green-900/40 to-emerald-900/40 border-green-500/30 hover:shadow-green-500/20' 
                        : 'bg-gradient-to-r from-yellow-900/40 to-orange-900/40 border-yellow-500/30 hover:shadow-yellow-500/20'
                    }`}>
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-full transition-all duration-300 hover:scale-110 ${
                          isWeb3Connected 
                            ? 'bg-gradient-to-br from-green-500/20 to-emerald-500/20' 
                            : 'bg-gradient-to-br from-yellow-500/20 to-orange-500/20'
                        }`}>
                          <div className={`w-4 h-4 rounded-full animate-pulse ${
                            isWeb3Connected ? 'bg-green-400 shadow-lg shadow-green-400/50' : 'bg-yellow-400 shadow-lg shadow-yellow-400/50'
                          }`}></div>
                        </div>
                        <div>
                          <h4 className={`font-semibold text-lg ${
                            isWeb3Connected ? 'text-green-300' : 'text-yellow-300'
                          }`}>
                            {isWeb3Connected 
                              ? 'Web3 Wallet Connected' 
                              : 'Connect Your Web3 Wallet'
                            }
                          </h4>
                          <p className={`${
                            isWeb3Connected ? 'text-green-400/80' : 'text-yellow-400/80'
                          }`}>
                            {isWeb3Connected 
                              ? 'Ready for on-chain verification and blockchain interactions' 
                              : 'Connect your wallet to enable blockchain verification features'
                            }
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Features List */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {[
                        {
                          icon: <Shield className="h-6 w-6" />,
                          title: "On-Chain Verification",
                          description: "Verify proofs directly on Ethereum blockchain with immutable records"
                        },
                        {
                          icon: <CheckCircle className="h-6 w-6" />,
                          title: "Immutable Records",
                          description: "All verification results are permanently stored on the blockchain"
                        },
                        {
                          icon: <Zap className="h-6 w-6" />,
                          title: "Nullifier Protection",
                          description: "Prevent double-spending with cryptographic nullifier tracking"
                        },
                        {
                          icon: <Users className="h-6 w-6" />,
                          title: "Gas Optimized",
                          description: "Smart contract verification uses minimal gas for cost efficiency"
                        }
                      ].map((feature, index) => (
                        <div key={index} className="bg-gradient-to-r from-gray-900/50 to-slate-900/50 backdrop-blur-sm border border-white/10 rounded-xl p-6 group hover:border-purple-400/30 hover:scale-105 hover:shadow-2xl transition-all duration-500 animate-scale-in" style={{ animationDelay: `${0.3 + index * 0.1}s` }}>
                          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-xl"></div>
                          <div className="flex items-start gap-4 relative z-10">
                            <div className="p-2 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                              <div className="text-purple-300">
                                {feature.icon}
                              </div>
                            </div>
                            <div>
                              <h5 className="text-white font-semibold mb-2">{feature.title}</h5>
                              <p className="text-purple-200/70 text-sm leading-relaxed">{feature.description}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar - Web3 Integration */}
          <div className="xl:col-span-1">
            <div className="sticky top-8 space-y-6">
              <Web3ProofIntegration
                onConnectionChange={setIsWeb3Connected}
                onVerificationComplete={handleVerificationComplete}
              />

              {/* Quick Start Guide */}
              <div className="relative overflow-hidden bg-gradient-to-br from-gray-900/40 via-slate-900/40 to-gray-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-blue-500/5"></div>
                <div className="relative z-10">
                  <h4 className="text-lg font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent mb-4">
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
                      <div key={index} className="flex items-start gap-4 group">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold group-hover:scale-110 transition-transform duration-300">
                            {item.step}
                          </div>
                        </div>
                        <div className="min-w-0">
                          <h5 className="text-white font-medium mb-1">{item.title}</h5>
                          <p className="text-purple-200/70 text-sm leading-relaxed">{item.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Stats Card */}
              <div className="relative overflow-hidden bg-gradient-to-br from-indigo-900/40 via-purple-900/40 to-blue-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-purple-500/5"></div>
                <div className="relative z-10">
                  <h4 className="text-lg font-bold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent mb-4">
                    Network Status
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-white mb-1">100%</div>
                      <div className="text-purple-300/80 text-xs">Private</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-white mb-1">0ms</div>
                      <div className="text-purple-300/80 text-xs">Latency</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-white mb-1">∞</div>
                      <div className="text-purple-300/80 text-xs">Scalable</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-400 mb-1">Live</div>
                      <div className="text-purple-300/80 text-xs">Network</div>
                    </div>
                  </div>
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
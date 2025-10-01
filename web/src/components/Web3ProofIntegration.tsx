import React, { useState, useEffect, useCallback } from 'react';
import { Wallet, CheckCircle, XCircle, Loader2, AlertTriangle, ExternalLink, Globe } from 'lucide-react';
import { Web3IdentityService } from '../lib/web3-identity-service';
import { PROOF_TYPES, NETWORKS } from '../lib/contracts';
import type { Web3ProofData, ContractVerificationResult, NetworkInfo, WalletInfo } from '../lib/types';

interface Web3ProofIntegrationProps {
  onConnectionChange?: (connected: boolean) => void;
  onVerificationComplete?: (result: ContractVerificationResult) => void;
}

interface ConnectionState {
  isConnected: boolean;
  isConnecting: boolean;
  walletInfo?: WalletInfo;
  networkInfo?: NetworkInfo;
  error?: string;
}

export function Web3ProofIntegration({ 
  onConnectionChange,
  onVerificationComplete 
}: Web3ProofIntegrationProps) {
  const [web3Service] = useState(() => new Web3IdentityService());
  const [connectionState, setConnectionState] = useState<ConnectionState>({
    isConnected: false,
    isConnecting: false
  });
  const [verificationStatus, setVerificationStatus] = useState<{
    isVerifying: boolean;
    lastResult?: ContractVerificationResult;
  }>({ isVerifying: false });

  // Check if wallet is already connected on component mount
  useEffect(() => {
    checkWalletConnection();
  }, []);

  // Notify parent of connection changes
  useEffect(() => {
    onConnectionChange?.(connectionState.isConnected);
  }, [connectionState.isConnected, onConnectionChange]);

  const checkWalletConnection = async () => {
    try {
      const isConnected = await web3Service.isWalletConnected();
      if (isConnected) {
        const walletInfo = await web3Service.getWalletInfo();
        const networkInfo = await web3Service.getNetworkInfo();
        
        setConnectionState({
          isConnected: true,
          isConnecting: false,
          walletInfo,
          networkInfo
        });
      }
    } catch (error) {
      console.warn('Failed to check wallet connection:', error);
    }
  };

  const connectWallet = async () => {
    setConnectionState(prev => ({ ...prev, isConnecting: true, error: undefined }));

    try {
      const result = await web3Service.connectWallet();
      
      if (result.success) {
        const walletInfo = await web3Service.getWalletInfo();
        const networkInfo = await web3Service.getNetworkInfo();
        
        setConnectionState({
          isConnected: true,
          isConnecting: false,
          walletInfo,
          networkInfo
        });
      } else {
        setConnectionState({
          isConnected: false,
          isConnecting: false,
          error: result.error || 'Failed to connect wallet'
        });
      }
    } catch (error) {
      setConnectionState({
        isConnected: false,
        isConnecting: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    }
  };

  const disconnectWallet = async () => {
    try {
      await web3Service.disconnectWallet();
      setConnectionState({
        isConnected: false,
        isConnecting: false
      });
    } catch (error) {
      console.error('Failed to disconnect wallet:', error);
    }
  };

  const verifyProofOnChain = useCallback(async (proofData: Web3ProofData) => {
    if (!connectionState.isConnected) {
      throw new Error('Wallet not connected');
    }

    setVerificationStatus({ isVerifying: true });

    try {
      const result = await web3Service.verifyProofOnChain(proofData);
      
      setVerificationStatus({
        isVerifying: false,
        lastResult: result
      });

      onVerificationComplete?.(result);
      return result;
    } catch (error) {
      const errorResult: ContractVerificationResult = {
        isValid: false,
        error: error instanceof Error ? error.message : 'Verification failed'
      };

      setVerificationStatus({
        isVerifying: false,
        lastResult: errorResult
      });

      onVerificationComplete?.(errorResult);
      throw error;
    }
  }, [connectionState.isConnected, web3Service, onVerificationComplete]);

  const getNetworkDisplayName = (chainId?: number) => {
    if (!chainId) return 'Unknown Network';
    const network = Object.values(NETWORKS).find(n => n.chainId === chainId);
    return network?.name || `Chain ${chainId}`;
  };

  const isCorrectNetwork = () => {
    return connectionState.networkInfo?.chainId === 31337; // Local development
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatBalance = (balance: bigint) => {
    const ethBalance = Number(balance) / 10**18;
    return ethBalance.toFixed(4);
  };

  return (
    <div className="w-full max-w-lg mx-auto space-y-6">
      {/* Connection Status Card */}
      <div className="relative overflow-hidden bg-gradient-to-br from-purple-900/20 via-blue-900/20 to-indigo-900/30 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl">
        {/* Cosmic background effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 via-transparent to-blue-600/10 opacity-50"></div>
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-full blur-xl transform translate-x-16 -translate-y-16"></div>
        
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-xl backdrop-blur-sm border border-white/10">
                <Wallet className="h-6 w-6 text-purple-300" />
              </div>
              <div>
                <h3 className="text-xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
                  Web3 Wallet
                </h3>
                <p className="text-sm text-purple-300/80">Connect to verify on-chain</p>
              </div>
            </div>
            
            {connectionState.isConnected ? (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-full border border-green-400/30">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-green-300 text-sm font-medium">Connected</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-gray-500/20 to-slate-500/20 rounded-full border border-gray-400/30">
                <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                <span className="text-gray-300 text-sm font-medium">Disconnected</span>
              </div>
            )}
          </div>

          {/* Connection Button */}
          {!connectionState.isConnected ? (
            <button
              onClick={connectWallet}
              disabled={connectionState.isConnecting}
              className="w-full relative overflow-hidden bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 hover:from-purple-700 hover:via-blue-700 hover:to-indigo-700 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10 flex items-center justify-center gap-3">
                {connectionState.isConnecting ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Connecting Wallet...</span>
                  </>
                ) : (
                  <>
                    <Wallet className="h-5 w-5" />
                    <span>Connect Web3 Wallet</span>
                  </>
                )}
              </div>
            </button>
          ) : (
            <div className="space-y-4">
              {/* Wallet Info */}
              {connectionState.walletInfo && (
                <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 backdrop-blur-sm border border-white/10 rounded-xl p-4">
                  <h4 className="text-purple-200 font-medium mb-3 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    Wallet Connected
                  </h4>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-purple-300/80">Address:</span>
                      <span className="text-white font-mono text-xs bg-black/20 px-2 py-1 rounded-lg">
                        {formatAddress(connectionState.walletInfo.address)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-purple-300/80">Balance:</span>
                      <span className="text-white font-semibold">
                        {formatBalance(connectionState.walletInfo.balance)} ETH
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Network Info */}
              {connectionState.networkInfo && (
                <div className="bg-gradient-to-r from-indigo-900/30 to-purple-900/30 backdrop-blur-sm border border-white/10 rounded-xl p-4">
                  <h4 className="text-purple-200 font-medium mb-3 flex items-center gap-2">
                    <Globe className="h-4 w-4 text-blue-400" />
                    Network Status
                  </h4>
                  <div className="flex justify-between items-center">
                    <span className="text-purple-300/80">Network:</span>
                    <div className="flex items-center gap-2">
                      <span className="text-white font-medium">
                        {getNetworkDisplayName(connectionState.networkInfo.chainId)}
                      </span>
                      {!isCorrectNetwork() && (
                        <div className="p-1 bg-yellow-500/20 rounded-full">
                          <AlertTriangle className="h-3 w-3 text-yellow-400" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Network Warning */}
              {!isCorrectNetwork() && (
                <div className="bg-gradient-to-r from-yellow-900/40 to-orange-900/40 backdrop-blur-sm border border-yellow-500/30 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <div className="p-1 bg-yellow-500/20 rounded-full mt-0.5">
                      <AlertTriangle className="h-4 w-4 text-yellow-400" />
                    </div>
                    <div>
                      <h5 className="text-yellow-300 font-medium mb-1">Wrong Network</h5>
                      <p className="text-yellow-200/80 text-sm">
                        Please switch to <span className="font-semibold">Local Network (Anvil)</span> to verify proofs on-chain.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Disconnect Button */}
              <button
                onClick={disconnectWallet}
                className="w-full bg-gradient-to-r from-gray-700/50 to-gray-600/50 hover:from-gray-600/60 hover:to-gray-500/60 text-gray-200 hover:text-white font-medium py-3 px-4 rounded-xl border border-white/10 transition-all duration-200 backdrop-blur-sm"
              >
                Disconnect Wallet
              </button>
            </div>
          )}

          {/* Connection Error */}
          {connectionState.error && (
            <div className="bg-gradient-to-r from-red-900/40 to-pink-900/40 backdrop-blur-sm border border-red-500/30 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <div className="p-1 bg-red-500/20 rounded-full mt-0.5">
                  <XCircle className="h-4 w-4 text-red-400" />
                </div>
                <div>
                  <h5 className="text-red-300 font-medium mb-1">Connection Error</h5>
                  <p className="text-red-200/80 text-sm">{connectionState.error}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Verification Status */}
      {verificationStatus.isVerifying && (
        <div className="relative overflow-hidden bg-gradient-to-br from-blue-900/20 via-indigo-900/20 to-purple-900/30 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10"></div>
          <div className="relative z-10 flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full">
              <Loader2 className="h-6 w-6 text-blue-400 animate-spin" />
            </div>
            <div>
              <h4 className="text-white font-semibold mb-1">Verifying on Blockchain</h4>
              <p className="text-blue-300/80 text-sm">Please confirm the transaction in your wallet...</p>
            </div>
          </div>
        </div>
      )}

      {/* Last Verification Result */}
      {verificationStatus.lastResult && !verificationStatus.isVerifying && (
        <div className={`relative overflow-hidden backdrop-blur-xl border border-white/10 rounded-2xl p-6 ${
          verificationStatus.lastResult.isValid
            ? 'bg-gradient-to-br from-green-900/20 via-emerald-900/20 to-teal-900/30'
            : 'bg-gradient-to-br from-red-900/20 via-pink-900/20 to-rose-900/30'
        }`}>
          <div className={`absolute inset-0 ${
            verificationStatus.lastResult.isValid
              ? 'bg-gradient-to-r from-green-500/10 to-emerald-500/10'
              : 'bg-gradient-to-r from-red-500/10 to-pink-500/10'
          }`}></div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-4">
              <div className={`p-3 rounded-full ${
                verificationStatus.lastResult.isValid
                  ? 'bg-gradient-to-br from-green-500/20 to-emerald-500/20'
                  : 'bg-gradient-to-br from-red-500/20 to-pink-500/20'
              }`}>
                {verificationStatus.lastResult.isValid ? (
                  <CheckCircle className="h-6 w-6 text-green-400" />
                ) : (
                  <XCircle className="h-6 w-6 text-red-400" />
                )}
              </div>
              <div>
                <h4 className={`font-bold text-lg ${
                  verificationStatus.lastResult.isValid ? 'text-green-300' : 'text-red-300'
                }`}>
                  {verificationStatus.lastResult.isValid ? 'Verification Successful!' : 'Verification Failed'}
                </h4>
                <p className={`text-sm ${
                  verificationStatus.lastResult.isValid ? 'text-green-400/80' : 'text-red-400/80'
                }`}>
                  {verificationStatus.lastResult.isValid 
                    ? 'Your proof has been verified on-chain' 
                    : 'The verification could not be completed'
                  }
                </p>
              </div>
            </div>

            {verificationStatus.lastResult.transactionHash && (
              <div className="bg-black/20 backdrop-blur-sm border border-white/10 rounded-xl p-4">
                <h5 className="text-white font-medium mb-2">Transaction Details</h5>
                <a
                  href={`http://localhost:8545/tx/${verificationStatus.lastResult.transactionHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-purple-300 hover:text-purple-200 transition-colors group"
                >
                  <span className="font-mono text-sm bg-purple-500/10 px-2 py-1 rounded">
                    {verificationStatus.lastResult.transactionHash.slice(0, 20)}...
                  </span>
                  <ExternalLink className="h-4 w-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </a>
              </div>
            )}

            {verificationStatus.lastResult.error && (
              <div className="bg-black/20 backdrop-blur-sm border border-red-500/20 rounded-xl p-4">
                <h5 className="text-red-300 font-medium mb-1">Error Details</h5>
                <p className="text-red-200/80 text-sm">{verificationStatus.lastResult.error}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Contract Info */}
      {connectionState.isConnected && isCorrectNetwork() && (
        <div className="relative overflow-hidden bg-gradient-to-br from-gray-900/40 via-slate-900/40 to-gray-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-4">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-blue-500/5"></div>
          <div className="relative z-10">
            <h5 className="text-purple-200 font-medium mb-3 flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              Smart Contract
            </h5>
            <div className="space-y-2 text-xs text-purple-300/80">
              <div className="flex justify-between items-center">
                <span>Contract:</span>
                <span className="font-mono bg-black/20 px-2 py-1 rounded text-purple-200">
                  {web3Service.getContractAddress().slice(0, 10)}...{web3Service.getContractAddress().slice(-8)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>Network:</span>
                <span className="text-green-400 font-medium">Local Development</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Hook for using Web3 service in other components
export function useWeb3Identity() {
  const [service] = useState(() => new Web3IdentityService());
  
  return {
    service,
    verifyProofOnChain: service.verifyProofOnChain.bind(service),
    batchVerifyProofs: service.batchVerifyProofs.bind(service),
    connectWallet: service.connectWallet.bind(service),
    isWalletConnected: service.isWalletConnected.bind(service),
    getWalletInfo: service.getWalletInfo.bind(service),
    getNetworkInfo: service.getNetworkInfo.bind(service),
    getUserProofStatus: service.getUserProofStatus.bind(service)
  };
}
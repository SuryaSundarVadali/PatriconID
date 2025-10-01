# P2P Identity Registry - Deployment Guide

This repository contains the smart contract deployment scripts for the PatriconID P2P Identity Registry system.

## Overview

The P2P Identity Registry is an upgradeable smart contract that enables on-chain verification of zero-knowledge identity proofs for DeFi and payment integrations. It uses the UUPS (Universal Upgradeable Proxy Standard) pattern for upgradeability.

## Contract Architecture

- **Implementation Contract**: `P2PIdentityRegistry.sol` - Contains the logic
- **Proxy Contract**: `ERC1967Proxy` - Delegates calls to implementation
- **Main Address**: Users interact with the proxy address

## Prerequisites

1. **Install Foundry**:
   ```bash
   curl -L https://foundry.paradigm.xyz | bash
   foundryup
   ```

2. **Install Dependencies**:
   ```bash
   cd contracts
   make install
   # or
   forge install
   ```

3. **Set Environment Variables**:
   ```bash
   export PRIVATE_KEY="0x..."           # Your deployer private key
   export INFURA_API_KEY="..."          # For mainnet/testnet RPCs
   export ETHERSCAN_API_KEY="..."       # For contract verification
   ```

## Quick Start

### 1. Local Development

```bash
# Start local Anvil node
make start-anvil

# Deploy to local network
make deploy-local
```

### 2. Testnet Deployment (Sepolia)

```bash
# Deploy to Sepolia
make deploy-sepolia

# The proxy address will be your main contract address
```

### 3. Mainnet Deployment

```bash
# Deploy to Ethereum mainnet (use with caution!)
make deploy-mainnet
```

## Deployment Process

The deployment script performs the following steps:

1. **Deploy Implementation**: Deploys the `P2PIdentityRegistry` implementation contract
2. **Deploy Proxy**: Deploys `ERC1967Proxy` pointing to the implementation
3. **Initialize**: Calls `initialize()` on the proxy with the owner address
4. **Configure Verifiers**: (Optional) Sets up ZK verifier contracts for different proof types
5. **Set Merkle Root**: (Optional) Sets initial Merkle root for commitment verification

## Post-Deployment Configuration

### Configure ZK Verifiers

After deploying ZK verifier contracts for each proof type:

```bash
export REGISTRY_PROXY="0x..."  # Your deployed proxy address
make configure-verifiers
```

Or manually:

```bash
forge script script/DeployP2PIdentityRegistry.s.sol:ManageP2PIdentityRegistry \
  --sig "setVerifiers(address,address[])" \
  $REGISTRY_PROXY \
  "[0xVerifier1,0xVerifier2,0xVerifier3,0xVerifier4,0xVerifier5]" \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY \
  --broadcast
```

### Update Merkle Root

```bash
export REGISTRY_PROXY="0x..."
export MERKLE_ROOT="0x..."
make update-merkle-root
```

### Emergency Functions

```bash
# Pause the registry
make pause-registry

# Unpause the registry
make unpause-registry
```

## Contract Addresses

### Mainnet
- Implementation: `TBD`
- Proxy (Main): `TBD`

### Sepolia Testnet
- Implementation: `TBD`
- Proxy (Main): `TBD`

## Verification

Verify deployed contracts on Etherscan:

```bash
export REGISTRY_PROXY="0x..."
make verify-deployment
```

## Gas Optimization Features

The contract includes several gas optimization features:

1. **Custom Errors**: More efficient than require statements
2. **Packed Structs**: Multiple values in single storage slots
3. **Batch Operations**: Process multiple proofs in one transaction
4. **Selective Storage**: Only store essential data on-chain

## Proof Types

The registry supports 5 types of zero-knowledge proofs:

1. **Age Verification** (Type 1): Prove age without revealing birthdate
2. **Residency Proof** (Type 2): Prove residency without revealing address
3. **Nationality Proof** (Type 3): Prove nationality without revealing country
4. **Credit Score** (Type 4): Prove creditworthiness without revealing score
5. **Composite Proof** (Type 5): Multiple attributes in one proof

## Security Features

- **Non-transferable**: Proofs are bound to specific users via passkey signatures
- **Replay Protection**: Nullifiers prevent proof reuse
- **Privacy-preserving**: Only verification results stored, not personal data
- **Upgradeable**: Can be upgraded to fix issues or add features
- **Pausable**: Can be paused in emergencies

## Integration Examples

### Verify a P2P Proof

```solidity
// Call from your DeFi contract
bool isValid = registry.verifyP2PProof(
    proof,
    publicInputs,
    passkeySignature,
    proofType,
    nullifierHash,
    commitment
);
```

### Batch Verification

```solidity
// Verify multiple proofs at once
bool[] memory results = registry.batchVerifyProofs(
    proofs,
    publicInputs,
    passkeySignatures,
    proofTypes,
    nullifierHashes,
    commitments
);
```

## Development Commands

```bash
# Build contracts
make build

# Run tests
make test

# Deploy locally
make deploy-local

# Get help
make help
```

## Troubleshooting

### Common Issues

1. **"Verifier not set"**: Deploy and configure ZK verifier contracts first
2. **"Nullifier already used"**: Each proof can only be used once
3. **"Invalid proof type"**: Use proof types 1-5 only
4. **Gas estimation failed**: Increase gas limit or check proof validity

### Getting Help

- Check the [contracts documentation](../docs/)
- Review test files in `/test` directory
- Open an issue on GitHub

## License

MIT License - see [LICENSE](../LICENSE) file for details.
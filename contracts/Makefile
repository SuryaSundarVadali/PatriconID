# P2P Identity Registry Deployment Makefile

# Default network (can be overridden)
NETWORK ?= anvil
RPC_URL ?= http://localhost:8545

# Private key for deployment (use environment variable)
PRIVATE_KEY ?= $(DEPLOYER_PRIVATE_KEY)

# Contract addresses (will be set after deployment)
REGISTRY_PROXY ?= ""

.PHONY: help install build test deploy verify configure clean

help: ## Show this help message
	@echo "P2P Identity Registry Deployment Commands:"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'

install: ## Install dependencies
	@echo "Installing Foundry dependencies..."
	forge install

build: ## Build contracts
	@echo "Building contracts..."
	forge build

test: ## Run tests
	@echo "Running tests..."
	forge test -vv

deploy: ## Deploy P2P Identity Registry to specified network
	@echo "Deploying to $(NETWORK)..."
	@if [ -z "$(PRIVATE_KEY)" ]; then \
		echo "Error: PRIVATE_KEY environment variable not set"; \
		exit 1; \
	fi
	forge script script/DeployP2PIdentityRegistry.s.sol:DeployP2PIdentityRegistry \
		--rpc-url $(RPC_URL) \
		--private-key $(PRIVATE_KEY) \
		--broadcast \
		--verify \
		-vvvv

deploy-local: ## Deploy to local Anvil network
	@echo "Deploying to local Anvil..."
	forge script script/DeployP2PIdentityRegistry.s.sol:DeployP2PIdentityRegistry \
		--rpc-url http://localhost:8545 \
		--private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 \
		--broadcast \
		-vvvv

deploy-sepolia: ## Deploy to Sepolia testnet
	@echo "Deploying to Sepolia..."
	@if [ -z "$(PRIVATE_KEY)" ]; then \
		echo "Error: PRIVATE_KEY environment variable not set"; \
		exit 1; \
	fi
	forge script script/DeployP2PIdentityRegistry.s.sol:DeployP2PIdentityRegistry \
		--rpc-url https://sepolia.infura.io/v3/$(INFURA_API_KEY) \
		--private-key $(PRIVATE_KEY) \
		--broadcast \
		--verify \
		--etherscan-api-key $(ETHERSCAN_API_KEY) \
		-vvvv

deploy-mainnet: ## Deploy to Ethereum mainnet (use with caution!)
	@echo "⚠️  DEPLOYING TO MAINNET ⚠️"
	@echo "This will deploy to Ethereum mainnet. Are you sure? [y/N]"
	@read -r confirm && [ "$$confirm" = "y" ] || exit 1
	@if [ -z "$(PRIVATE_KEY)" ]; then \
		echo "Error: PRIVATE_KEY environment variable not set"; \
		exit 1; \
	fi
	forge script script/DeployP2PIdentityRegistry.s.sol:DeployP2PIdentityRegistry \
		--rpc-url https://mainnet.infura.io/v3/$(INFURA_API_KEY) \
		--private-key $(PRIVATE_KEY) \
		--broadcast \
		--verify \
		--etherscan-api-key $(ETHERSCAN_API_KEY) \
		-vvvv

configure-verifiers: ## Configure verifier contracts (requires REGISTRY_PROXY)
	@echo "Configuring verifiers for registry at $(REGISTRY_PROXY)..."
	@if [ -z "$(REGISTRY_PROXY)" ]; then \
		echo "Error: REGISTRY_PROXY environment variable not set"; \
		exit 1; \
	fi
	@if [ -z "$(PRIVATE_KEY)" ]; then \
		echo "Error: PRIVATE_KEY environment variable not set"; \
		exit 1; \
	fi
	forge script script/DeployP2PIdentityRegistry.s.sol:ManageP2PIdentityRegistry \
		--sig "setVerifiers(address,address[])" \
		$(REGISTRY_PROXY) \
		"[]" \
		--rpc-url $(RPC_URL) \
		--private-key $(PRIVATE_KEY) \
		--broadcast

update-merkle-root: ## Update Merkle root (requires REGISTRY_PROXY and MERKLE_ROOT)
	@echo "Updating Merkle root for registry at $(REGISTRY_PROXY)..."
	@if [ -z "$(REGISTRY_PROXY)" ]; then \
		echo "Error: REGISTRY_PROXY environment variable not set"; \
		exit 1; \
	fi
	@if [ -z "$(MERKLE_ROOT)" ]; then \
		echo "Error: MERKLE_ROOT environment variable not set"; \
		exit 1; \
	fi
	@if [ -z "$(PRIVATE_KEY)" ]; then \
		echo "Error: PRIVATE_KEY environment variable not set"; \
		exit 1; \
	fi
	forge script script/DeployP2PIdentityRegistry.s.sol:ManageP2PIdentityRegistry \
		--sig "updateMerkleRoot(address,bytes32)" \
		$(REGISTRY_PROXY) \
		$(MERKLE_ROOT) \
		--rpc-url $(RPC_URL) \
		--private-key $(PRIVATE_KEY) \
		--broadcast

pause-registry: ## Pause the registry (emergency function)
	@echo "Pausing registry at $(REGISTRY_PROXY)..."
	@if [ -z "$(REGISTRY_PROXY)" ]; then \
		echo "Error: REGISTRY_PROXY environment variable not set"; \
		exit 1; \
	fi
	forge script script/DeployP2PIdentityRegistry.s.sol:ManageP2PIdentityRegistry \
		--sig "pauseRegistry(address)" \
		$(REGISTRY_PROXY) \
		--rpc-url $(RPC_URL) \
		--private-key $(PRIVATE_KEY) \
		--broadcast

unpause-registry: ## Unpause the registry
	@echo "Unpausing registry at $(REGISTRY_PROXY)..."
	@if [ -z "$(REGISTRY_PROXY)" ]; then \
		echo "Error: REGISTRY_PROXY environment variable not set"; \
		exit 1; \
	fi
	forge script script/DeployP2PIdentityRegistry.s.sol:ManageP2PIdentityRegistry \
		--sig "unpauseRegistry(address)" \
		$(REGISTRY_PROXY) \
		--rpc-url $(RPC_URL) \
		--private-key $(PRIVATE_KEY) \
		--broadcast

verify-deployment: ## Verify contract on Etherscan
	@echo "Verifying contract deployment..."
	@if [ -z "$(REGISTRY_PROXY)" ]; then \
		echo "Error: REGISTRY_PROXY environment variable not set"; \
		exit 1; \
	fi
	forge verify-contract $(REGISTRY_PROXY) P2PIdentityRegistry \
		--etherscan-api-key $(ETHERSCAN_API_KEY) \
		--chain-id $(shell cast chain-id --rpc-url $(RPC_URL))

clean: ## Clean build artifacts
	@echo "Cleaning build artifacts..."
	forge clean

# Development helpers
start-anvil: ## Start local Anvil node
	@echo "Starting Anvil local node..."
	anvil --host 0.0.0.0 --port 8545

get-deployer-address: ## Get deployer address from private key
	@echo "Deployer address:"
	@cast wallet address $(PRIVATE_KEY)

get-registry-owner: ## Get current owner of the registry
	@if [ -z "$(REGISTRY_PROXY)" ]; then \
		echo "Error: REGISTRY_PROXY environment variable not set"; \
		exit 1; \
	fi
	@echo "Registry owner:"
	@cast call $(REGISTRY_PROXY) "owner()" --rpc-url $(RPC_URL)

# Usage examples
example-deploy: ## Show example deployment commands
	@echo "Example deployment commands:"
	@echo ""
	@echo "1. Deploy to local Anvil:"
	@echo "   make deploy-local"
	@echo ""
	@echo "2. Deploy to Sepolia:"
	@echo "   export PRIVATE_KEY=0x..."
	@echo "   export INFURA_API_KEY=..."
	@echo "   export ETHERSCAN_API_KEY=..."
	@echo "   make deploy-sepolia"
	@echo ""
	@echo "3. Configure verifiers:"
	@echo "   export REGISTRY_PROXY=0x..."
	@echo "   make configure-verifiers"
	@echo ""
	@echo "4. Update Merkle root:"
	@echo "   export REGISTRY_PROXY=0x..."
	@echo "   export MERKLE_ROOT=0x..."
	@echo "   make update-merkle-root"
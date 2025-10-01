// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Script, console} from "forge-std/Script.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import {P2PIdentityRegistry} from "../src/P2PIdentityRegistry.sol";

/**
 * @title DeployP2PIdentityRegistry
 * @dev Deployment script for P2PIdentityRegistry using UUPS upgradeable pattern
 * @notice This script deploys both implementation and proxy contracts
 */
contract DeployP2PIdentityRegistry is Script {
    
    // Deployment configuration
    struct DeploymentConfig {
        address owner;
        address[] verifierContracts; // Array of verifier contract addresses (for proof types 1-5)
        bytes32 initialMerkleRoot;
    }

    // Events for tracking deployment
    event ImplementationDeployed(address implementation);
    event ProxyDeployed(address proxy);
    event RegistryInitialized(address owner);
    event VerifiersConfigured(address[] verifiers);

    function run() external {
        // Load deployment configuration
        DeploymentConfig memory config = getDeploymentConfig();
        
        // Start broadcasting transactions
        vm.startBroadcast();
        
        // Deploy the implementation contract
        P2PIdentityRegistry implementation = new P2PIdentityRegistry();
        console.log("Implementation deployed at:", address(implementation));
        emit ImplementationDeployed(address(implementation));
        
        // Prepare initialization data
        bytes memory initData = abi.encodeWithSelector(
            P2PIdentityRegistry.initialize.selector,
            config.owner
        );
        
        // Deploy the proxy contract
        ERC1967Proxy proxy = new ERC1967Proxy(
            address(implementation),
            initData
        );
        console.log("Proxy deployed at:", address(proxy));
        emit ProxyDeployed(address(proxy));
        
        // Create registry instance pointing to proxy
        P2PIdentityRegistry registry = P2PIdentityRegistry(address(proxy));
        console.log("Registry initialized with owner:", config.owner);
        emit RegistryInitialized(config.owner);
        
        // Configure verifier contracts if provided
        if (config.verifierContracts.length > 0) {
            configureVerifiers(registry, config.verifierContracts);
        }
        
        // Set initial Merkle root if provided
        if (config.initialMerkleRoot != bytes32(0)) {
            registry.updateMerkleRoot(config.initialMerkleRoot);
            console.log("Initial Merkle root set:", vm.toString(config.initialMerkleRoot));
        }
        
        vm.stopBroadcast();
        
        // Display deployment summary
        displayDeploymentSummary(address(implementation), address(proxy), config);
    }
    
    /**
     * @dev Configure verifier contracts for different proof types
     */
    function configureVerifiers(
        P2PIdentityRegistry registry,
        address[] memory verifiers
    ) internal {
        console.log("Configuring verifier contracts...");
        
        for (uint8 i = 0; i < verifiers.length && i < 5; i++) {
            if (verifiers[i] != address(0)) {
                uint8 proofType = i + 1; // Proof types are 1-indexed
                registry.setVerifierContract(proofType, verifiers[i]);
                console.log("Verifier for proof type", proofType, "set to:", verifiers[i]);
            }
        }
        
        emit VerifiersConfigured(verifiers);
    }
    
    /**
     * @dev Get deployment configuration based on network
     */
    function getDeploymentConfig() internal view returns (DeploymentConfig memory) {
        uint256 chainId = block.chainid;
        
        if (chainId == 1) {
            // Mainnet configuration
            return DeploymentConfig({
                owner: 0x1234567890123456789012345678901234567890, // Replace with actual owner
                verifierContracts: new address[](0), // Will be set after ZK verifiers are deployed
                initialMerkleRoot: bytes32(0) // Will be set after first batch of commitments
            });
        } else if (chainId == 11155111) {
            // Sepolia testnet configuration
            return DeploymentConfig({
                owner: msg.sender, // Use deployer as owner for testnet
                verifierContracts: new address[](0),
                initialMerkleRoot: bytes32(0)
            });
        } else if (chainId == 31337) {
            // Local development configuration
            return DeploymentConfig({
                owner: msg.sender,
                verifierContracts: new address[](0),
                initialMerkleRoot: bytes32(0)
            });
        } else {
            // Default configuration for other networks
            return DeploymentConfig({
                owner: msg.sender,
                verifierContracts: new address[](0),
                initialMerkleRoot: bytes32(0)
            });
        }
    }
    
    /**
     * @dev Display comprehensive deployment summary
     */
    function displayDeploymentSummary(
        address implementation,
        address proxy,
        DeploymentConfig memory config
    ) internal view {
        console.log("\n=== P2P Identity Registry Deployment Summary ===");
        console.log("Chain ID:", block.chainid);
        console.log("Block Number:", block.number);
        console.log("Timestamp:", block.timestamp);
        console.log("Deployer:", msg.sender);
        console.log("");
        console.log("Implementation Contract:", implementation);
        console.log("Proxy Contract (Main Address):", proxy);
        console.log("Registry Owner:", config.owner);
        console.log("");
        
        if (config.verifierContracts.length > 0) {
            console.log("Configured Verifiers:");
            for (uint8 i = 0; i < config.verifierContracts.length; i++) {
                if (config.verifierContracts[i] != address(0)) {
                    console.log("  Proof Type", i + 1, ":", config.verifierContracts[i]);
                }
            }
        } else {
            console.log("No verifiers configured (can be set later)");
        }
        
        console.log("");
        console.log("Next Steps:");
        console.log("1. Deploy ZK verifier contracts for each proof type");
        console.log("2. Call setVerifierContract() for each proof type");
        console.log("3. Set initial Merkle root with updateMerkleRoot()");
        console.log("4. Test with verifyP2PProof() function");
        console.log("=====================================");
    }
}

/**
 * @title ManageP2PIdentityRegistry
 * @dev Management script for post-deployment configuration
 */
contract ManageP2PIdentityRegistry is Script {
    
    /**
     * @dev Set verifier contracts after deployment
     */
    function setVerifiers(
        address registryProxy,
        address[] memory verifiers
    ) external {
        require(verifiers.length <= 5, "Too many verifiers");
        
        vm.startBroadcast();
        
        P2PIdentityRegistry registry = P2PIdentityRegistry(registryProxy);
        
        for (uint8 i = 0; i < verifiers.length; i++) {
            if (verifiers[i] != address(0)) {
                uint8 proofType = i + 1;
                registry.setVerifierContract(proofType, verifiers[i]);
                console.log("Set verifier for proof type", proofType, ":", verifiers[i]);
            }
        }
        
        vm.stopBroadcast();
    }
    
    /**
     * @dev Update Merkle root
     */
    function updateMerkleRoot(
        address registryProxy,
        bytes32 newRoot
    ) external {
        vm.startBroadcast();
        
        P2PIdentityRegistry registry = P2PIdentityRegistry(registryProxy);
        registry.updateMerkleRoot(newRoot);
        
        console.log("Updated Merkle root to:", vm.toString(newRoot));
        
        vm.stopBroadcast();
    }
    
    /**
     * @dev Pause the registry
     */
    function pauseRegistry(address registryProxy) external {
        vm.startBroadcast();
        
        P2PIdentityRegistry registry = P2PIdentityRegistry(registryProxy);
        registry.pause();
        
        console.log("Registry paused");
        
        vm.stopBroadcast();
    }
    
    /**
     * @dev Unpause the registry
     */
    function unpauseRegistry(address registryProxy) external {
        vm.startBroadcast();
        
        P2PIdentityRegistry registry = P2PIdentityRegistry(registryProxy);
        registry.unpause();
        
        console.log("Registry unpaused");
        
        vm.stopBroadcast();
    }
}
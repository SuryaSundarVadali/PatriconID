// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "../src/IdentityProofFactory.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

contract DeployIdentityProofFactory is Script {
    
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Deploy implementation contract
        IdentityProofFactory implementation = new IdentityProofFactory();
        console.log("Implementation deployed at:", address(implementation));
        
        // Encode initializer call
        bytes memory initData = abi.encodeWithSelector(
            IdentityProofFactory.initialize.selector
        );
        
        // Deploy proxy
        ERC1967Proxy proxy = new ERC1967Proxy(
            address(implementation),
            initData
        );
        console.log("Proxy deployed at:", address(proxy));
        
        // Get proxied contract instance
        IdentityProofFactory factory = IdentityProofFactory(address(proxy));
        console.log("Factory initialized successfully");
        
        // Log initial configuration
        (uint256 totalProofs, uint256 totalStake, uint256 balance) = factory.getStatistics();
        console.log("Initial statistics:");
        console.log("  Total Proofs:", totalProofs);
        console.log("  Total Stake:", totalStake);
        console.log("  Balance:", balance);
        
        vm.stopBroadcast();
        
        // Save deployment info
        string memory deploymentInfo = string(abi.encodePacked(
            "{\n",
            '  "implementation": "', vm.toString(address(implementation)), '",\n',
            '  "proxy": "', vm.toString(address(proxy)), '",\n',
            '  "deployer": "', vm.toString(vm.addr(deployerPrivateKey)), '"\n',
            "}"
        ));
        
        vm.writeFile("./deployment-info.json", deploymentInfo);
        console.log("\nDeployment info saved to deployment-info.json");
    }
}

// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <0.9.0;

import "forge-std/Script.sol";
import "../contracts/PlundrixWorkshop.sol";

contract UpgradeWorkshop is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address proxyAddress = vm.envAddress("WORKSHOP_PROXY_ADDRESS");

        vm.startBroadcast(deployerPrivateKey);
        PlundrixWorkshop implementation = new PlundrixWorkshop();
        PlundrixWorkshop(proxyAddress).upgradeTo(address(implementation));
        vm.stopBroadcast();

        console.log("=== Plundrix Workshop Upgraded ===");
        console.log("Proxy:              ", proxyAddress);
        console.log("New implementation: ", address(implementation));
    }
}


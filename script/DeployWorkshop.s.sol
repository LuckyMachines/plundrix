// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <0.9.0;

import "forge-std/Script.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import "../contracts/PlundrixGame.sol";
import "../contracts/PlundrixWorkshop.sol";

contract DeployWorkshop is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address gameAddress = vm.envAddress("PLUNDRIX_ADDRESS");
        address deployer = vm.addr(deployerPrivateKey);
        address defaultAdmin = vm.envOr("DEFAULT_ADMIN_ADDRESS", deployer);
        address upgrader = vm.envOr("UPGRADER_ADDRESS", defaultAdmin);

        vm.startBroadcast(deployerPrivateKey);
        PlundrixWorkshop implementation = new PlundrixWorkshop();
        ERC1967Proxy proxy = new ERC1967Proxy(
            address(implementation),
            abi.encodeCall(
                PlundrixWorkshop.initialize,
                (gameAddress, defaultAdmin, upgrader)
            )
        );
        PlundrixGame(gameAddress).configureWorkshop(address(proxy));
        vm.stopBroadcast();

        console.log("=== Plundrix Workshop Deployed ===");
        console.log("Game:               ", gameAddress);
        console.log("Workshop proxy:     ", address(proxy));
        console.log("Workshop impl:      ", address(implementation));
        console.log("VITE_WORKSHOP_ADDRESS=%s", address(proxy));
    }
}


// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <0.9.0;

import "forge-std/Script.sol";
import "../contracts/PlundrixGame.sol";

contract UpgradePlundrix is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envOr(
            "PRIVATE_KEY",
            uint256(
                0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
            )
        );
        address proxyAddress = vm.envAddress("PROXY_ADDRESS");

        vm.startBroadcast(deployerPrivateKey);

        PlundrixGame newImplementation = new PlundrixGame();
        PlundrixGame proxy = PlundrixGame(proxyAddress);
        proxy.upgradeTo(address(newImplementation));

        vm.stopBroadcast();

        console.log("=== Plundrix Upgraded ===");
        console.log("Proxy:              ", proxyAddress);
        console.log("New implementation: ", address(newImplementation));
        console.log("");
        console.log("No data migration needed (GameMode.FREE == 0 matches uninitialized storage)");
    }
}

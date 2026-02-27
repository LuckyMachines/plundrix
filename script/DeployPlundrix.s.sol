// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <0.9.0;

import "forge-std/Script.sol";
import "../contracts/PlundrixGame.sol";

contract DeployPlundrix is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envOr(
            "PRIVATE_KEY",
            uint256(
                0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
            )
        );
        address deployer = vm.addr(deployerPrivateKey);

        vm.startBroadcast(deployerPrivateKey);

        PlundrixGame game = new PlundrixGame(deployer);

        // deployer already has DEFAULT_ADMIN_ROLE and GAME_MASTER_ROLE
        // from the constructor

        vm.stopBroadcast();

        console.log("=== Plundrix Deployed ===");
        console.log("Deployer:      ", deployer);
        console.log("PlundrixGame:  ", address(game));
        console.log("");
        console.log("Update your .env:");
        console.log("  VITE_CONTRACT_ADDRESS=%s", address(game));
    }
}

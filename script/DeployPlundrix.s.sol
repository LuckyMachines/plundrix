// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <0.9.0;

import "forge-std/Script.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
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
        address defaultAdmin = vm.envOr("DEFAULT_ADMIN_ADDRESS", deployer);
        address gameMaster = vm.envOr("GAME_MASTER_ADDRESS", defaultAdmin);
        address pauser = vm.envOr("PAUSER_ADDRESS", defaultAdmin);
        address upgrader = vm.envOr("UPGRADER_ADDRESS", defaultAdmin);
        address autoResolver = vm.envOr("AUTO_RESOLVER_ADDRESS", defaultAdmin);
        address randomizer = vm.envOr("RANDOMIZER_ADDRESS", defaultAdmin);
        bool startPaused = vm.envOr("START_PAUSED", false);
        bool autoResolveEnabled = vm.envOr("AUTO_RESOLVE_ENABLED", false);
        uint256 autoResolveDelay = vm.envOr(
            "AUTO_RESOLVE_DELAY",
            uint256(5 minutes)
        );
        bool requireExternalEntropy = vm.envOr(
            "REQUIRE_EXTERNAL_ENTROPY",
            false
        );

        vm.startBroadcast(deployerPrivateKey);

        PlundrixGame implementation = new PlundrixGame();
        ERC1967Proxy proxy = new ERC1967Proxy(
            address(implementation),
            abi.encodeCall(
                PlundrixGame.initialize,
                (
                    PlundrixGame.LaunchConfiguration({
                        defaultAdmin: defaultAdmin,
                        gameMaster: gameMaster,
                        pauser: pauser,
                        upgrader: upgrader,
                        autoResolver: autoResolver,
                        randomizer: randomizer,
                        startPaused: startPaused
                    })
                )
            )
        );
        PlundrixGame game = PlundrixGame(address(proxy));

        if (autoResolveEnabled || requireExternalEntropy) {
            game.configureAutomation(
                autoResolveEnabled,
                autoResolveDelay,
                requireExternalEntropy
            );
        }

        vm.stopBroadcast();

        console.log("=== Plundrix Deployed ===");
        console.log("Deployer:      ", deployer);
        console.log("Implementation:", address(implementation));
        console.log("PlundrixGame:  ", address(game));
        console.log("Default admin: ", defaultAdmin);
        console.log("Game master:   ", gameMaster);
        console.log("Pauser:        ", pauser);
        console.log("Upgrader:      ", upgrader);
        console.log("Auto resolver: ", autoResolver);
        console.log("Randomizer:    ", randomizer);
        console.log("Start paused:  ", startPaused);
        console.log("Auto resolve:  ", autoResolveEnabled);
        console.log("Require entropy:", requireExternalEntropy);
        console.log("");
        console.log("Update your .env:");
        console.log("  VITE_CONTRACT_ADDRESS=%s", address(game));
    }
}

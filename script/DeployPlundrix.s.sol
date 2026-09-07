// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <0.9.0;

import "forge-std/Script.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import "../contracts/PlundrixGame.sol";
import "../contracts/PlundrixWorkshop.sol";

contract DeployPlundrix is Script {
    struct DeployConfig {
        address defaultAdmin;
        address gameMaster;
        address pauser;
        address upgrader;
        address autoResolver;
        address randomizer;
        bool startPaused;
        bool autoResolveEnabled;
        uint256 autoResolveDelay;
        bool requireExternalEntropy;
    }

    function run() external {
        uint256 deployerPrivateKey = vm.envOr(
            "PRIVATE_KEY",
            uint256(
                0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
            )
        );
        address deployer = vm.addr(deployerPrivateKey);
        DeployConfig memory config = _readConfig(deployer);

        vm.startBroadcast(deployerPrivateKey);

        (address implementationAddress, address gameAddress) = _deployGame(
            config
        );
        PlundrixGame game = PlundrixGame(gameAddress);

        (
            address workshopImplementation,
            address workshopAddress
        ) = _deployWorkshop(
                address(game),
                config.defaultAdmin,
                config.upgrader
        );

        if (game.hasRole(game.GAME_MASTER_ROLE(), deployer)) {
            game.configureWorkshop(workshopAddress);
        }

        if (config.autoResolveEnabled || config.requireExternalEntropy) {
            game.configureAutomation(
                config.autoResolveEnabled,
                config.autoResolveDelay,
                config.requireExternalEntropy
            );
        }

        vm.stopBroadcast();

        console.log("=== Plundrix Deployed ===");
        console.log("Deployer:      ", deployer);
        console.log("Implementation:", implementationAddress);
        console.log("PlundrixGame:  ", address(game));
        console.log("Workshop impl:", workshopImplementation);
        console.log("Workshop proxy:", workshopAddress);
        console.log("Default admin: ", config.defaultAdmin);
        console.log("Game master:   ", config.gameMaster);
        console.log("Pauser:        ", config.pauser);
        console.log("Upgrader:      ", config.upgrader);
        console.log("Auto resolver: ", config.autoResolver);
        console.log("Randomizer:    ", config.randomizer);
        console.log("Start paused:  ", config.startPaused);
        console.log("Auto resolve:  ", config.autoResolveEnabled);
        console.log("Require entropy:", config.requireExternalEntropy);
        console.log("");
        console.log("Update your .env:");
        console.log("  VITE_CONTRACT_ADDRESS=%s", address(game));
        console.log("  VITE_WORKSHOP_ADDRESS=%s", workshopAddress);
        if (!game.hasRole(game.GAME_MASTER_ROLE(), deployer)) {
            console.log("Game master must call configureWorkshop(workshop proxy)");
        }
    }

    function _readConfig(
        address deployer
    ) internal view returns (DeployConfig memory config) {
        config.defaultAdmin = vm.envOr("DEFAULT_ADMIN_ADDRESS", deployer);
        config.gameMaster = vm.envOr(
            "GAME_MASTER_ADDRESS",
            config.defaultAdmin
        );
        config.pauser = vm.envOr("PAUSER_ADDRESS", config.defaultAdmin);
        config.upgrader = vm.envOr("UPGRADER_ADDRESS", config.defaultAdmin);
        config.autoResolver = vm.envOr(
            "AUTO_RESOLVER_ADDRESS",
            config.defaultAdmin
        );
        config.randomizer = vm.envOr(
            "RANDOMIZER_ADDRESS",
            config.defaultAdmin
        );
        config.startPaused = vm.envOr("START_PAUSED", false);
        config.autoResolveEnabled = vm.envOr("AUTO_RESOLVE_ENABLED", false);
        config.autoResolveDelay = vm.envOr(
            "AUTO_RESOLVE_DELAY",
            uint256(5 minutes)
        );
        config.requireExternalEntropy = vm.envOr(
            "REQUIRE_EXTERNAL_ENTROPY",
            false
        );
    }

    function _deployGame(
        DeployConfig memory config
    ) internal returns (address implementationAddress, address proxyAddress) {
        PlundrixGame implementation = new PlundrixGame();
        ERC1967Proxy proxy = new ERC1967Proxy(
            address(implementation),
            abi.encodeCall(
                PlundrixGame.initialize,
                (
                    PlundrixGame.LaunchConfiguration({
                        defaultAdmin: config.defaultAdmin,
                        gameMaster: config.gameMaster,
                        pauser: config.pauser,
                        upgrader: config.upgrader,
                        autoResolver: config.autoResolver,
                        randomizer: config.randomizer,
                        startPaused: config.startPaused
                    })
                )
            )
        );
        return (address(implementation), address(proxy));
    }

    function _deployWorkshop(
        address gameAddress,
        address defaultAdmin,
        address upgrader
    ) internal returns (address implementationAddress, address proxyAddress) {
        PlundrixWorkshop implementation = new PlundrixWorkshop();
        ERC1967Proxy proxy = new ERC1967Proxy(
            address(implementation),
            abi.encodeCall(
                PlundrixWorkshop.initialize,
                (gameAddress, defaultAdmin, upgrader)
            )
        );
        return (address(implementation), address(proxy));
    }
}

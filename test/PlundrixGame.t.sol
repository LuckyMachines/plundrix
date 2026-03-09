// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.17;

import "forge-std/Test.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import "../contracts/PlundrixGame.sol";

contract PlundrixGameV2 is PlundrixGame {
    function version() external pure returns (uint256) {
        return 2;
    }
}

contract PlundrixGameTest is Test {
    PlundrixGame internal game;
    PlundrixGame internal implementation;

    address internal admin = address(0xA11CE);
    address internal gameMaster = address(0xABCD1);
    address internal pauser = address(0xABCD2);
    address internal upgrader = address(0xABCD3);
    address internal autoResolver = address(0xABCD4);
    address internal randomizer = address(0xABCD5);
    address internal player1 = address(0xB0B);
    address internal player2 = address(0xCAFE);

    bytes32 internal constant ACTION_OUTCOME_SIG =
        keccak256(
            "ActionOutcome(uint256,uint256,address,uint8,bool,uint8,uint256,uint256,bool,address,uint256)"
        );
    bytes32 internal constant ROUND_AUTO_RESOLVED_SIG =
        keccak256("RoundAutoResolved(uint256,uint256,address,uint256)");

    function setUp() external {
        implementation = new PlundrixGame();
        ERC1967Proxy proxy = new ERC1967Proxy(
            address(implementation),
            abi.encodeCall(
                PlundrixGame.initialize,
                (
                    PlundrixGame.LaunchConfiguration({
                        defaultAdmin: admin,
                        gameMaster: gameMaster,
                        pauser: pauser,
                        upgrader: upgrader,
                        autoResolver: autoResolver,
                        randomizer: randomizer,
                        startPaused: false
                    })
                )
            )
        );
        game = PlundrixGame(address(proxy));
    }

    function _createActiveTwoPlayerGame() internal returns (uint256 gameId) {
        vm.prank(gameMaster);
        gameId = game.createGame();

        vm.prank(player1);
        game.registerPlayer(gameId);

        vm.prank(player2);
        game.registerPlayer(gameId);

        vm.prank(player1);
        game.startGame(gameId);
    }

    function _decodeOutcome(
        bytes memory data
    ) internal pure returns (uint8 action, bool success, uint8 reason) {
        (action, success, reason, , , , , ) = abi.decode(
            data,
            (uint8, bool, uint8, uint256, uint256, bool, address, uint256)
        );
    }

    function test_resolveRound_emitsNoSubmissionActionOutcome() external {
        uint256 gameId = _createActiveTwoPlayerGame();

        vm.prank(player1);
        game.submitAction(gameId, PlundrixGame.Action.PICK, address(0));

        vm.warp(block.timestamp + game.ROUND_TIMEOUT() + 1);
        vm.recordLogs();

        game.resolveRound(gameId);

        Vm.Log[] memory logs = vm.getRecordedLogs();
        uint256 outcomes;
        bool sawNoSubmissionReason;

        for (uint256 i = 0; i < logs.length; i++) {
            if (logs[i].topics.length == 0 || logs[i].topics[0] != ACTION_OUTCOME_SIG) {
                continue;
            }

            outcomes++;
            address actingPlayer = address(uint160(uint256(logs[i].topics[3])));
            (uint8 action, bool success, uint8 reason) = _decodeOutcome(
                logs[i].data
            );

            if (actingPlayer == player2) {
                assertEq(action, uint8(PlundrixGame.Action.NONE));
                assertFalse(success);
                assertEq(reason, uint8(PlundrixGame.OutcomeReason.NO_SUBMISSION));
                sawNoSubmissionReason = true;
            }
        }

        assertEq(outcomes, 2, "two players should produce two action outcomes");
        assertTrue(sawNoSubmissionReason, "missing no-submission outcome");
    }

    function test_entropyRequiredMode_blocksUntilEntropyProvided() external {
        uint256 gameId = _createActiveTwoPlayerGame();
        uint256 timeout = game.ROUND_TIMEOUT();

        vm.prank(gameMaster);
        game.configureAutomation(false, timeout, true);

        vm.prank(player1);
        game.submitAction(gameId, PlundrixGame.Action.PICK, address(0));
        vm.prank(player2);
        game.submitAction(gameId, PlundrixGame.Action.SEARCH, address(0));

        vm.expectRevert(bytes("Entropy not ready"));
        game.resolveRound(gameId);

        vm.prank(randomizer);
        game.provideRoundEntropy(gameId, 1, 777);

        game.resolveRound(gameId);
        (, uint256 currentRound, , , ) = game.getGameInfo(gameId);
        assertEq(currentRound, 2);
    }

    function test_autoResolver_canBatchResolveTimedOutGames() external {
        uint256 gameId = _createActiveTwoPlayerGame();
        uint256 timeout = game.ROUND_TIMEOUT();

        vm.prank(gameMaster);
        game.configureAutomation(true, timeout, false);

        vm.prank(player1);
        game.submitAction(gameId, PlundrixGame.Action.PICK, address(0));

        vm.warp(block.timestamp + timeout + 1);
        assertTrue(game.canAutoResolve(gameId));

        uint256[] memory ids = new uint256[](1);
        ids[0] = gameId;

        vm.recordLogs();
        vm.prank(autoResolver);
        uint256 resolved = game.resolveTimedOutGames(ids);
        assertEq(resolved, 1);

        Vm.Log[] memory logs = vm.getRecordedLogs();
        bool sawAutoResolvedEvent;
        for (uint256 i = 0; i < logs.length; i++) {
            if (logs[i].topics.length > 0 && logs[i].topics[0] == ROUND_AUTO_RESOLVED_SIG) {
                sawAutoResolvedEvent = true;
                break;
            }
        }
        assertTrue(sawAutoResolvedEvent, "round auto-resolved event missing");
    }

    function test_pause_blocksGameplayMutations() external {
        vm.prank(pauser);
        game.pause();

        vm.expectRevert(bytes("Pausable: paused"));
        game.createGame();

        vm.prank(pauser);
        game.unpause();

        uint256 gameId = game.createGame();
        assertEq(gameId, 1);
    }

    function test_configureAutomation_allowedWhilePaused() external {
        vm.prank(pauser);
        game.pause();

        uint256 timeout = game.ROUND_TIMEOUT();

        vm.prank(gameMaster);
        game.configureAutomation(true, timeout, true);

        (bool autoResolveEnabled, uint256 autoResolveDelay, bool requireExternalEntropy) =
            game.getAutomationSettings();

        assertTrue(autoResolveEnabled);
        assertEq(autoResolveDelay, timeout);
        assertTrue(requireExternalEntropy);
    }

    function test_fee_defaultsToDisabledAtTwoPercent() external view {
        (bool feeEnabled, uint256 feeBps, address feeRecipient) = game
            .getFeeSettings();

        assertFalse(feeEnabled);
        assertEq(feeBps, 200);
        assertEq(feeRecipient, admin);
    }

    function test_configureFee_allowedWhilePaused() external {
        vm.prank(pauser);
        game.pause();

        vm.prank(gameMaster);
        game.configureFee(true, admin);

        (bool feeEnabled, uint256 feeBps, address feeRecipient) = game
            .getFeeSettings();

        assertTrue(feeEnabled);
        assertEq(feeBps, 200);
        assertEq(feeRecipient, admin);
    }

    function test_onlyUpgraderCanUpgradeProxy() external {
        PlundrixGameV2 upgradedImplementation = new PlundrixGameV2();

        vm.prank(player1);
        vm.expectRevert();
        game.upgradeTo(address(upgradedImplementation));

        vm.prank(upgrader);
        game.upgradeTo(address(upgradedImplementation));

        uint256 version = PlundrixGameV2(address(game)).version();
        assertEq(version, 2);
    }

    function test_implementationCannotBeInitialized() external {
        vm.expectRevert(bytes("Initializable: contract is already initialized"));
        implementation.initialize(
            PlundrixGame.LaunchConfiguration({
                defaultAdmin: admin,
                gameMaster: gameMaster,
                pauser: pauser,
                upgrader: upgrader,
                autoResolver: autoResolver,
                randomizer: randomizer,
                startPaused: false
            })
        );
    }
}

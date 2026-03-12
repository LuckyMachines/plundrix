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

    function test_resolveRound_emitsDefaultPickForAfkPlayer() external {
        uint256 gameId = _createActiveTwoPlayerGame();

        vm.prank(player1);
        game.submitAction(gameId, PlundrixGame.Action.PICK, address(0));

        vm.warp(block.timestamp + game.ROUND_TIMEOUT() + 1);
        vm.recordLogs();

        game.resolveRound(gameId);

        Vm.Log[] memory logs = vm.getRecordedLogs();
        uint256 outcomes;
        bool sawDefaultPick;

        for (uint256 i = 0; i < logs.length; i++) {
            if (logs[i].topics.length == 0 || logs[i].topics[0] != ACTION_OUTCOME_SIG) {
                continue;
            }

            outcomes++;
            address actingPlayer = address(uint160(uint256(logs[i].topics[3])));
            (uint8 action, , ) = _decodeOutcome(
                logs[i].data
            );

            if (actingPlayer == player2) {
                // AFK player now gets default PICK instead of NO_SUBMISSION
                assertEq(action, uint8(PlundrixGame.Action.PICK));
                sawDefaultPick = true;
            }
        }

        assertEq(outcomes, 2, "two players should produce two action outcomes");
        assertTrue(sawDefaultPick, "missing default PICK outcome for AFK player");
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

    // --- Stakes & Default Move Tests ---

    function test_createStakesGame_setsMode() external {
        vm.prank(gameMaster);
        game.configureFee(true, admin);

        vm.prank(player1);
        uint256 gameId = game.createGame(PlundrixGame.GameMode.STAKES, 0.01 ether);

        (PlundrixGame.GameMode mode, uint256 entryFee, uint256 pot) = game.getGameMode(gameId);
        assertEq(uint8(mode), uint8(PlundrixGame.GameMode.STAKES));
        assertEq(entryFee, 0.01 ether);
        assertEq(pot, 0);
    }

    function test_createStakes_requiresFeeEnabled() external {
        vm.expectRevert(bytes("Fee system not enabled"));
        game.createGame(PlundrixGame.GameMode.STAKES, 0.01 ether);
    }

    function test_registerPlayer_stakesCollectsFee() external {
        vm.prank(gameMaster);
        game.configureFee(true, admin);

        vm.prank(player1);
        uint256 gameId = game.createGame(PlundrixGame.GameMode.STAKES, 0.01 ether);

        vm.deal(player1, 1 ether);
        vm.prank(player1);
        game.registerPlayer{value: 0.01 ether}(gameId);

        (, , uint256 pot) = game.getGameMode(gameId);
        assertEq(pot, 0.01 ether);
    }

    function test_registerPlayer_stakesRejectsWrongValue() external {
        vm.prank(gameMaster);
        game.configureFee(true, admin);

        vm.prank(player1);
        uint256 gameId = game.createGame(PlundrixGame.GameMode.STAKES, 0.01 ether);

        vm.deal(player1, 1 ether);
        vm.prank(player1);
        vm.expectRevert(bytes("Incorrect entry fee"));
        game.registerPlayer{value: 0.005 ether}(gameId);
    }

    function test_registerPlayer_freeRejectsEth() external {
        vm.prank(player1);
        uint256 gameId = game.createGame();

        vm.deal(player2, 1 ether);
        vm.prank(player2);
        vm.expectRevert(bytes("Free game does not accept ETH"));
        game.registerPlayer{value: 0.01 ether}(gameId);
    }

    function test_stakesGame_winnerGetsPrize() external {
        vm.prank(gameMaster);
        game.configureFee(true, admin);

        vm.prank(player1);
        uint256 gameId = game.createGame(PlundrixGame.GameMode.STAKES, 0.01 ether);

        vm.deal(player1, 1 ether);
        vm.prank(player1);
        game.registerPlayer{value: 0.01 ether}(gameId);

        vm.deal(player2, 1 ether);
        vm.prank(player2);
        game.registerPlayer{value: 0.01 ether}(gameId);

        vm.prank(player1);
        game.startGame(gameId);

        // Play until winner
        uint256 gameState = 1;
        uint256 round = 0;
        while (gameState == 1 && round < 100) {
            vm.prank(player1);
            game.submitAction(gameId, PlundrixGame.Action.PICK, address(0));
            vm.prank(player2);
            game.submitAction(gameId, PlundrixGame.Action.PICK, address(0));
            game.resolveRound(gameId);
            round++;
            (PlundrixGame.GameState state, , , , ) = game.getGameInfo(gameId);
            gameState = uint256(state);
        }

        assertEq(gameState, 2); // COMPLETE
        (, , , , address winner) = game.getGameInfo(gameId);

        uint256 totalPot = 0.02 ether;
        uint256 expectedFee = (totalPot * 200) / 10_000; // 2%
        uint256 expectedPrize = totalPot - expectedFee;

        assertEq(game.withdrawableBalance(winner), expectedPrize);
    }

    function test_stakesGame_feeRecipientGetsFee() external {
        vm.prank(gameMaster);
        game.configureFee(true, admin);

        vm.prank(player1);
        uint256 gameId = game.createGame(PlundrixGame.GameMode.STAKES, 0.01 ether);

        vm.deal(player1, 1 ether);
        vm.prank(player1);
        game.registerPlayer{value: 0.01 ether}(gameId);

        vm.deal(player2, 1 ether);
        vm.prank(player2);
        game.registerPlayer{value: 0.01 ether}(gameId);

        vm.prank(player1);
        game.startGame(gameId);

        uint256 gameState = 1;
        uint256 round = 0;
        while (gameState == 1 && round < 100) {
            vm.prank(player1);
            game.submitAction(gameId, PlundrixGame.Action.PICK, address(0));
            vm.prank(player2);
            game.submitAction(gameId, PlundrixGame.Action.PICK, address(0));
            game.resolveRound(gameId);
            round++;
            (PlundrixGame.GameState state, , , , ) = game.getGameInfo(gameId);
            gameState = uint256(state);
        }

        uint256 totalPot = 0.02 ether;
        uint256 expectedFee = (totalPot * 200) / 10_000;
        assertEq(game.withdrawableBalance(admin), expectedFee);
    }

    function test_withdraw_sendsEth() external {
        vm.prank(gameMaster);
        game.configureFee(true, admin);

        vm.prank(player1);
        uint256 gameId = game.createGame(PlundrixGame.GameMode.STAKES, 0.01 ether);

        vm.deal(player1, 1 ether);
        vm.prank(player1);
        game.registerPlayer{value: 0.01 ether}(gameId);

        vm.deal(player2, 1 ether);
        vm.prank(player2);
        game.registerPlayer{value: 0.01 ether}(gameId);

        vm.prank(player1);
        game.startGame(gameId);

        uint256 gameState = 1;
        uint256 round = 0;
        while (gameState == 1 && round < 100) {
            vm.prank(player1);
            game.submitAction(gameId, PlundrixGame.Action.PICK, address(0));
            vm.prank(player2);
            game.submitAction(gameId, PlundrixGame.Action.PICK, address(0));
            game.resolveRound(gameId);
            round++;
            (PlundrixGame.GameState state, , , , ) = game.getGameInfo(gameId);
            gameState = uint256(state);
        }

        (, , , , address winner) = game.getGameInfo(gameId);
        uint256 balance = game.withdrawableBalance(winner);
        assertTrue(balance > 0);

        uint256 ethBefore = winner.balance;
        vm.prank(winner);
        game.withdraw();
        assertEq(winner.balance, ethBefore + balance);
        assertEq(game.withdrawableBalance(winner), 0);
    }

    function test_withdraw_revertsEmpty() external {
        vm.prank(player1);
        vm.expectRevert(bytes("Nothing to withdraw"));
        game.withdraw();
    }

    function test_defaultMove_picksOnTimeout() external {
        uint256 gameId = _createActiveTwoPlayerGame();

        // Only player1 submits
        vm.prank(player1);
        game.submitAction(gameId, PlundrixGame.Action.PICK, address(0));

        vm.warp(block.timestamp + game.ROUND_TIMEOUT() + 1);
        vm.recordLogs();
        game.resolveRound(gameId);

        Vm.Log[] memory logs = vm.getRecordedLogs();
        bytes32 defaultActionSig = keccak256("DefaultActionAssigned(uint256,uint256,address,uint8,uint256)");
        bool sawDefault = false;
        for (uint256 i = 0; i < logs.length; i++) {
            if (logs[i].topics.length > 0 && logs[i].topics[0] == defaultActionSig) {
                sawDefault = true;
                break;
            }
        }
        assertTrue(sawDefault, "DefaultActionAssigned event missing");

        // Player2 should have gotten a PICK outcome, not NO_SUBMISSION
        bool sawPickForPlayer2 = false;
        for (uint256 i = 0; i < logs.length; i++) {
            if (logs[i].topics.length == 0 || logs[i].topics[0] != ACTION_OUTCOME_SIG) continue;
            address actingPlayer = address(uint160(uint256(logs[i].topics[3])));
            if (actingPlayer == player2) {
                (uint8 action, , ) = _decodeOutcome(logs[i].data);
                assertEq(action, uint8(PlundrixGame.Action.PICK), "AFK player should get PICK action");
                sawPickForPlayer2 = true;
            }
        }
        assertTrue(sawPickForPlayer2, "missing PICK outcome for AFK player");
    }

    function test_defaultMove_emitsEvent() external {
        uint256 gameId = _createActiveTwoPlayerGame();

        // Neither player submits
        vm.warp(block.timestamp + game.ROUND_TIMEOUT() + 1);
        vm.recordLogs();
        game.resolveRound(gameId);

        Vm.Log[] memory logs = vm.getRecordedLogs();
        bytes32 defaultActionSig = keccak256("DefaultActionAssigned(uint256,uint256,address,uint8,uint256)");
        uint256 defaultCount = 0;
        for (uint256 i = 0; i < logs.length; i++) {
            if (logs[i].topics.length > 0 && logs[i].topics[0] == defaultActionSig) {
                defaultCount++;
            }
        }
        assertEq(defaultCount, 2, "both AFK players should get DefaultActionAssigned");
    }

    function test_defaultMove_notWhenAllSubmitted() external {
        uint256 gameId = _createActiveTwoPlayerGame();

        vm.prank(player1);
        game.submitAction(gameId, PlundrixGame.Action.PICK, address(0));
        vm.prank(player2);
        game.submitAction(gameId, PlundrixGame.Action.SEARCH, address(0));

        vm.recordLogs();
        game.resolveRound(gameId);

        Vm.Log[] memory logs = vm.getRecordedLogs();
        bytes32 defaultActionSig = keccak256("DefaultActionAssigned(uint256,uint256,address,uint8,uint256)");
        for (uint256 i = 0; i < logs.length; i++) {
            if (logs[i].topics.length > 0 && logs[i].topics[0] == defaultActionSig) {
                revert("DefaultActionAssigned should not fire when all submitted");
            }
        }
    }

    function test_freeGame_backwardCompatible() external {
        vm.prank(player1);
        uint256 gameId = game.createGame();

        (PlundrixGame.GameMode mode, uint256 entryFee, uint256 pot) = game.getGameMode(gameId);
        assertEq(uint8(mode), uint8(PlundrixGame.GameMode.FREE));
        assertEq(entryFee, 0);
        assertEq(pot, 0);
    }

    function test_upgradePreservesStorage() external {
        // Create a game with V1
        vm.prank(player1);
        uint256 gameId = game.createGame();
        vm.prank(player1);
        game.registerPlayer(gameId);

        // Upgrade to V2
        PlundrixGameV2 v2Impl = new PlundrixGameV2();
        vm.prank(upgrader);
        game.upgradeTo(address(v2Impl));

        // Existing data intact
        (PlundrixGame.GameState state, , uint256 playerCount, , ) = game.getGameInfo(gameId);
        assertEq(uint8(state), uint8(PlundrixGame.GameState.OPEN));
        assertEq(playerCount, 1);

        // GameMode defaults to FREE (0) for pre-upgrade games
        (PlundrixGame.GameMode mode, , ) = game.getGameMode(gameId);
        assertEq(uint8(mode), uint8(PlundrixGame.GameMode.FREE));
    }
}

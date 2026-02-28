// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.17;

import "forge-std/Test.sol";
import "../contracts/PlundrixGame.sol";

contract PlundrixGameTest is Test {
    PlundrixGame internal game;

    address internal admin = address(0xA11CE);
    address internal player1 = address(0xB0B);
    address internal player2 = address(0xCAFE);

    bytes32 internal constant ACTION_OUTCOME_SIG =
        keccak256(
            "ActionOutcome(uint256,uint256,address,uint8,bool,uint8,uint256,uint256,bool,address,uint256)"
        );
    bytes32 internal constant ROUND_AUTO_RESOLVED_SIG =
        keccak256("RoundAutoResolved(uint256,uint256,address,uint256)");

    function setUp() external {
        vm.prank(admin);
        game = new PlundrixGame(admin);
    }

    function _createActiveTwoPlayerGame() internal returns (uint256 gameId) {
        vm.prank(admin);
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

        vm.prank(admin);
        game.configureAutomation(false, timeout, true);

        vm.prank(player1);
        game.submitAction(gameId, PlundrixGame.Action.PICK, address(0));
        vm.prank(player2);
        game.submitAction(gameId, PlundrixGame.Action.SEARCH, address(0));

        vm.expectRevert(bytes("Entropy not ready"));
        game.resolveRound(gameId);

        vm.prank(admin);
        game.provideRoundEntropy(gameId, 1, 777);

        game.resolveRound(gameId);
        (, uint256 currentRound, , , ) = game.getGameInfo(gameId);
        assertEq(currentRound, 2);
    }

    function test_autoResolver_canBatchResolveTimedOutGames() external {
        uint256 gameId = _createActiveTwoPlayerGame();
        uint256 timeout = game.ROUND_TIMEOUT();

        vm.prank(admin);
        game.configureAutomation(true, timeout, false);

        vm.prank(player1);
        game.submitAction(gameId, PlundrixGame.Action.PICK, address(0));

        vm.warp(block.timestamp + timeout + 1);
        assertTrue(game.canAutoResolve(gameId));

        uint256[] memory ids = new uint256[](1);
        ids[0] = gameId;

        vm.recordLogs();
        vm.prank(admin);
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
}

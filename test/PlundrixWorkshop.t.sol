// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.17;

import "forge-std/Test.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import "../contracts/PlundrixGame.sol";
import "../contracts/PlundrixWorkshop.sol";

contract PlundrixWorkshopGameHarness is PlundrixGame {
    function setPlayerState(
        uint256 gameID,
        uint256 playerIndex,
        uint256 locksCracked,
        uint256 tools,
        bool stunned
    ) external {
        _players[gameID][playerIndex].locksCracked = locksCracked;
        _players[gameID][playerIndex].tools = tools;
        _players[gameID][playerIndex].stunned = stunned;
    }

    function resolveSearchForTest(
        uint256 gameID,
        uint256 playerIndex,
        uint256 roll
    ) external returns (bool success, OutcomeReason reason) {
        return _resolveSearch(gameID, _players[gameID][playerIndex], roll);
    }
}

contract PlundrixWorkshopV2 is PlundrixWorkshop {
    function version() external pure returns (uint256) {
        return 2;
    }
}

contract PlundrixWorkshopTest is Test {
    PlundrixGame internal game;
    PlundrixWorkshop internal workshop;

    address internal admin = address(0xA11CE);
    address internal gameMaster = address(0xABCD1);
    address internal pauser = address(0xABCD2);
    address internal upgrader = address(0xABCD3);
    address internal autoResolver = address(0xABCD4);
    address internal randomizer = address(0xABCD5);
    address internal player1 = address(0xB0B);
    address internal player2 = address(0xCAFE);

    function setUp() external {
        PlundrixGame gameImplementation = new PlundrixWorkshopGameHarness();
        ERC1967Proxy gameProxy = new ERC1967Proxy(
            address(gameImplementation),
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
        game = PlundrixGame(address(gameProxy));

        PlundrixWorkshop workshopImplementation = new PlundrixWorkshop();
        ERC1967Proxy workshopProxy = new ERC1967Proxy(
            address(workshopImplementation),
            abi.encodeCall(
                PlundrixWorkshop.initialize,
                (address(game), admin, upgrader)
            )
        );
        workshop = PlundrixWorkshop(address(workshopProxy));

        vm.prank(gameMaster);
        game.configureWorkshop(address(workshop));
    }

    function _createActiveGame() internal returns (uint256 gameID) {
        vm.prank(gameMaster);
        gameID = game.createGame();
        vm.prank(player1);
        game.registerPlayer(gameID);
        vm.prank(player2);
        game.registerPlayer(gameID);
        vm.prank(player1);
        game.startGame(gameID);
    }

    function _awardManyMatches(address operator) internal {
        for (uint256 gameID = 1; gameID <= 24; gameID++) {
            vm.prank(address(game));
            workshop.settleMatch(gameID, gameID + 3, operator, true, gameID * 7919);
        }
    }

    function _craftEquipAndStart(
        address operator,
        uint256 blueprintID
    ) internal returns (uint256 gameID) {
        _awardManyMatches(operator);
        vm.prank(operator);
        workshop.craftBlueprint(blueprintID);
        vm.prank(operator);
        workshop.equipBlueprint(blueprintID);
        gameID = _createActiveGame();
    }

    function test_catalogConstantsAndBoundaryDecoding() external view {
        assertEq(workshop.BLUEPRINT_COUNT(), 1_200);
        assertEq(workshop.CHASSIS_COUNT(), 10);
        assertEq(workshop.FINISH_COUNT(), 10);
        assertEq(workshop.CALIBRATION_COUNT(), 12);
        assertEq(workshop.MATERIAL_COUNT(), 6);

        (uint8 firstChassis, uint8 firstFinish, uint8 firstCalibration) = workshop.decodeBlueprint(1);
        assertEq(firstChassis, 0);
        assertEq(firstFinish, 0);
        assertEq(firstCalibration, 0);

        (uint8 lastChassis, uint8 lastFinish, uint8 lastCalibration) = workshop.decodeBlueprint(1_200);
        assertEq(lastChassis, 9);
        assertEq(lastFinish, 9);
        assertEq(lastCalibration, 11);
    }

    function test_recipeMatchesFrontendCatalogGrammar() external view {
        uint256[6] memory first = workshop.getBlueprintRecipe(1);
        assertEq(first[0], 5);
        assertEq(first[3], 1);

        uint256[6] memory firewall = workshop.getBlueprintRecipe(241);
        assertEq(firewall[0], 6);
        assertEq(firewall[2], 7);
        assertEq(firewall[3], 2);

        uint256[6] memory last = workshop.getBlueprintRecipe(1_200);
        assertEq(last[0], 5);
        assertEq(last[2], 4);
    }

    function test_starterBlueprintsAreOwnedAndCanBeEquipped() external {
        assertTrue(workshop.ownsBlueprint(player1, 1));
        assertTrue(workshop.ownsBlueprint(player1, 121));
        assertTrue(workshop.ownsBlueprint(player1, 241));

        vm.prank(player1);
        workshop.equipBlueprint(121);
        (uint256 equipped, uint256 crafted, ) = workshop.getWorkshopState(player1);
        assertEq(equipped, 121);
        assertEq(crafted, 0);
    }

    function test_matchRewardsFundCraftingAndCannotBeClaimedTwice() external {
        _awardManyMatches(player1);
        (, , uint256[6] memory beforeCraft) = workshop.getWorkshopState(player1);
        uint256 totalBefore;
        for (uint256 i = 0; i < 6; i++) totalBefore += beforeCraft[i];
        assertEq(totalBefore, 24 * 8);

        vm.prank(player1);
        workshop.craftBlueprint(2);
        assertTrue(workshop.ownsBlueprint(player1, 2));
        (, uint256 crafted, ) = workshop.getWorkshopState(player1);
        uint256[] memory craftedBlueprints = workshop.getCraftedBlueprints(
            player1
        );
        assertEq(crafted, 1);
        assertEq(craftedBlueprints.length, 1);
        assertEq(craftedBlueprints[0], 2);

        vm.prank(player1);
        vm.expectRevert(bytes("Already crafted"));
        workshop.craftBlueprint(2);

        vm.prank(address(game));
        vm.expectRevert(bytes("Match already settled"));
        workshop.settleMatch(1, 4, player1, true, 7919);
    }

    function test_customBlueprintCanBeReclaimedForRoundedHalfRecipe() external {
        _awardManyMatches(player1);
        uint256[6] memory recipe = workshop.getBlueprintRecipe(2);
        vm.prank(player1);
        workshop.craftBlueprint(2);
        vm.prank(player1);
        workshop.equipBlueprint(2);
        (, , uint256[6] memory beforeReclaim) = workshop.getWorkshopState(player1);

        vm.prank(player1);
        uint256[6] memory refunds = workshop.reclaimBlueprint(2);

        (uint256 equipped, uint256 crafted, uint256[6] memory afterReclaim) = workshop.getWorkshopState(player1);
        assertEq(equipped, 0);
        assertEq(crafted, 0);
        assertFalse(workshop.ownsBlueprint(player1, 2));
        for (uint256 material = 0; material < 6; material++) {
            assertEq(refunds[material], (recipe[material] + 1) / 2);
            assertEq(afterReclaim[material], beforeReclaim[material] + refunds[material]);
        }
    }

    function test_onlyGameCanLockConsumeOrSettle() external {
        vm.startPrank(player1);
        vm.expectRevert(bytes("Only Plundrix game"));
        workshop.lockLoadout(1, player1);
        vm.expectRevert(bytes("Only Plundrix game"));
        workshop.consumeGadget(1, player1, 1, 1);
        vm.expectRevert(bytes("Only Plundrix game"));
        workshop.settleMatch(1, 1, player1, true, 1);
        vm.stopPrank();
    }

    function test_gameRejectsWorkshopLinkedToAnotherGame() external {
        PlundrixWorkshop implementation = new PlundrixWorkshop();
        ERC1967Proxy proxy = new ERC1967Proxy(
            address(implementation),
            abi.encodeCall(
                PlundrixWorkshop.initialize,
                (player1, admin, upgrader)
            )
        );
        vm.prank(gameMaster);
        vm.expectRevert(PlundrixGame.InvalidWorkshop.selector);
        game.configureWorkshop(address(proxy));
    }

    function test_onlyUpgraderCanUpgradeAndStateIsPreserved() external {
        _awardManyMatches(player1);
        vm.prank(player1);
        workshop.craftBlueprint(2);
        vm.prank(player1);
        workshop.equipBlueprint(2);

        PlundrixWorkshopV2 nextImplementation = new PlundrixWorkshopV2();
        vm.prank(player1);
        vm.expectRevert();
        workshop.upgradeTo(address(nextImplementation));

        vm.prank(upgrader);
        workshop.upgradeTo(address(nextImplementation));
        PlundrixWorkshopV2 upgraded = PlundrixWorkshopV2(address(workshop));
        assertEq(upgraded.version(), 2);
        assertTrue(upgraded.ownsBlueprint(player1, 2));
        (uint256 equipped, uint256 crafted, ) = upgraded.getWorkshopState(
            player1
        );
        assertEq(equipped, 2);
        assertEq(crafted, 1);
    }

    function test_gameLocksAndConsumesPrecisionLoadout() external {
        vm.prank(player1);
        workshop.equipBlueprint(1);
        uint256 gameID = _createActiveGame();

        (uint256 blueprintID, bool ready) = workshop.getGameLoadout(gameID, player1);
        assertEq(blueprintID, 1);
        assertTrue(ready);

        vm.prank(player1);
        game.submitAction(gameID, PlundrixGame.Action.PICK, address(0));
        vm.prank(player2);
        game.submitAction(gameID, PlundrixGame.Action.SEARCH, address(0));
        game.resolveRound(gameID);

        (, ready) = workshop.getGameLoadout(gameID, player1);
        assertFalse(ready);
    }

    function test_torqueDriverWaitsForAPickWithATool() external {
        _awardManyMatches(player1);
        vm.prank(player1);
        workshop.craftBlueprint(361);
        vm.prank(player1);
        workshop.equipBlueprint(361);
        uint256 gameID = _createActiveGame();

        vm.prank(player1);
        game.submitAction(gameID, PlundrixGame.Action.PICK, address(0));
        vm.prank(player2);
        game.submitAction(gameID, PlundrixGame.Action.SEARCH, address(0));
        game.resolveRound(gameID);

        (, bool ready) = workshop.getGameLoadout(gameID, player1);
        assertTrue(ready);
    }

    function test_quicksetClampConsumesOnOpeningPick() external {
        _awardManyMatches(player1);
        vm.prank(player1);
        workshop.craftBlueprint(841);
        vm.prank(player1);
        workshop.equipBlueprint(841);
        uint256 gameID = _createActiveGame();

        vm.prank(player1);
        game.submitAction(gameID, PlundrixGame.Action.PICK, address(0));
        vm.prank(player2);
        game.submitAction(gameID, PlundrixGame.Action.SEARCH, address(0));
        game.resolveRound(gameID);

        (, bool ready) = workshop.getGameLoadout(gameID, player1);
        assertFalse(ready);
    }

    function test_echoCoilWaitsUntilRoundThree() external {
        _awardManyMatches(player1);
        vm.prank(player1);
        workshop.craftBlueprint(481);
        vm.prank(player1);
        workshop.equipBlueprint(481);
        uint256 gameID = _createActiveGame();

        for (uint256 round = 1; round <= 3; round++) {
            vm.prank(player1);
            game.submitAction(gameID, PlundrixGame.Action.SEARCH, address(0));
            vm.prank(player2);
            game.submitAction(gameID, PlundrixGame.Action.SEARCH, address(0));
            game.resolveRound(gameID);
            (, bool ready) = workshop.getGameLoadout(gameID, player1);
            assertEq(ready, round < 3);
        }
    }

    function test_cacheSiphonCanFindTwoTools() external {
        uint256 gameID = _craftEquipAndStart(player1, 961);

        (bool success, ) = PlundrixWorkshopGameHarness(address(game))
            .resolveSearchForTest(gameID, 1, 0);

        (, uint256 tools, , , ) = game.getPlayerState(gameID, player1);
        (, bool ready) = workshop.getGameLoadout(gameID, player1);
        assertTrue(success);
        assertEq(tools, 2);
        assertFalse(ready);
    }

    function test_routeCompassSearchesThroughStunAtFullStrength() external {
        uint256 gameID = _craftEquipAndStart(player1, 1_081);
        PlundrixWorkshopGameHarness(address(game)).setPlayerState(
            gameID,
            1,
            0,
            0,
            true
        );

        (bool success, ) = PlundrixWorkshopGameHarness(address(game))
            .resolveSearchForTest(gameID, 1, 50);

        (, uint256 tools, , , ) = game.getPlayerState(gameID, player1);
        (, bool ready) = workshop.getGameLoadout(gameID, player1);
        assertTrue(success);
        assertEq(tools, 1);
        assertFalse(ready);
    }

    function test_decoyRelayStripsAnAttackerTool() external {
        uint256 gameID = _craftEquipAndStart(player2, 601);
        PlundrixWorkshopGameHarness(address(game)).setPlayerState(
            gameID,
            1,
            0,
            2,
            false
        );

        vm.prank(player1);
        game.submitAction(gameID, PlundrixGame.Action.SABOTAGE, player2);
        vm.prank(player2);
        game.submitAction(gameID, PlundrixGame.Action.PICK, address(0));
        game.resolveRound(gameID);

        (, uint256 attackerTools, , , ) = game.getPlayerState(gameID, player1);
        (, , bool targetStunned, , ) = game.getPlayerState(gameID, player2);
        (, bool ready) = workshop.getGameLoadout(gameID, player2);
        assertEq(attackerTools, 1);
        assertFalse(targetStunned);
        assertFalse(ready);
    }

    function test_counterweightGrantsAComebackTool() external {
        uint256 gameID = _craftEquipAndStart(player2, 721);
        PlundrixWorkshopGameHarness(address(game)).setPlayerState(
            gameID,
            1,
            2,
            0,
            false
        );

        vm.prank(player1);
        game.submitAction(gameID, PlundrixGame.Action.SABOTAGE, player2);
        vm.prank(player2);
        game.submitAction(gameID, PlundrixGame.Action.PICK, address(0));
        game.resolveRound(gameID);

        (, uint256 targetTools, bool targetStunned, , ) = game.getPlayerState(
            gameID,
            player2
        );
        (, bool ready) = workshop.getGameLoadout(gameID, player2);
        assertEq(targetTools, 1);
        assertFalse(targetStunned);
        assertFalse(ready);
    }

    function test_scannerIsConsumedByFirstSearch() external {
        vm.prank(player1);
        workshop.equipBlueprint(121);
        uint256 gameID = _createActiveGame();

        vm.prank(player1);
        game.submitAction(gameID, PlundrixGame.Action.SEARCH, address(0));
        vm.prank(player2);
        game.submitAction(gameID, PlundrixGame.Action.PICK, address(0));
        game.resolveRound(gameID);

        (, bool ready) = workshop.getGameLoadout(gameID, player1);
        assertFalse(ready);
    }

    function test_stunnedPickDoesNotWastePrecisionKit() external {
        vm.prank(player1);
        workshop.equipBlueprint(1);
        uint256 gameID = _createActiveGame();

        vm.prank(player1);
        game.submitAction(gameID, PlundrixGame.Action.SEARCH, address(0));
        vm.prank(player2);
        game.submitAction(gameID, PlundrixGame.Action.SABOTAGE, player1);
        game.resolveRound(gameID);

        vm.prank(player1);
        game.submitAction(gameID, PlundrixGame.Action.PICK, address(0));
        vm.prank(player2);
        game.submitAction(gameID, PlundrixGame.Action.SEARCH, address(0));
        game.resolveRound(gameID);

        (, bool ready) = workshop.getGameLoadout(gameID, player1);
        assertTrue(ready);
    }

    function test_firewallBlocksFirstSabotage() external {
        vm.prank(player2);
        workshop.equipBlueprint(241);
        uint256 gameID = _createActiveGame();

        vm.prank(player1);
        game.submitAction(gameID, PlundrixGame.Action.SABOTAGE, player2);
        vm.prank(player2);
        game.submitAction(gameID, PlundrixGame.Action.PICK, address(0));
        game.resolveRound(gameID);

        (, , bool stunned, , ) = game.getPlayerState(gameID, player2);
        (, bool ready) = workshop.getGameLoadout(gameID, player2);
        assertFalse(stunned);
        assertFalse(ready);
    }

    function test_completedGameAwardsWinnerAndOpponentSalvage() external {
        uint256 gameID = _createActiveGame();
        for (uint256 round = 0; round < 100; round++) {
            (PlundrixGame.GameState state, , , , ) = game.getGameInfo(gameID);
            if (state == PlundrixGame.GameState.COMPLETE) break;
            vm.prank(player1);
            game.submitAction(gameID, PlundrixGame.Action.PICK, address(0));
            vm.prank(player2);
            game.submitAction(gameID, PlundrixGame.Action.PICK, address(0));
            game.resolveRound(gameID);
        }

        (, , , , address winner) = game.getGameInfo(gameID);
        assertTrue(winner == player1 || winner == player2);
        (, , uint256[6] memory player1Balances) = workshop.getWorkshopState(player1);
        (, , uint256[6] memory player2Balances) = workshop.getWorkshopState(player2);
        uint256 player1Total;
        uint256 player2Total;
        for (uint256 i = 0; i < 6; i++) {
            player1Total += player1Balances[i];
            player2Total += player2Balances[i];
        }
        assertEq(player1Total, winner == player1 ? 8 : 5);
        assertEq(player2Total, winner == player2 ? 8 : 5);
        assertTrue(workshop.matchSettled(gameID, player1));
        assertTrue(workshop.matchSettled(gameID, player2));
    }
}

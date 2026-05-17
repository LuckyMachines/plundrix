// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <0.9.0;

import "forge-std/Script.sol";
import "../contracts/PlundrixGame.sol";

/**
 * @title ConfigureTestnet
 * @notice Enable fees on Plundrix for Sepolia testnet sponsored play.
 *         Sets 2% fee, fee recipient = admin.
 *         After running: create STAKES games with 0.001 ETH entry fee,
 *         or use FREE mode for zero-cost play.
 */
contract ConfigureTestnet is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address plundrixAddress = vm.envOr(
            "PLUNDRIX_ADDRESS",
            address(0x1FF715D46470B4024D88A12838e08A60855f0AE2)
        );
        address feeRecipient = vm.envOr(
            "FEE_RECIPIENT",
            vm.addr(deployerPrivateKey)
        );

        vm.startBroadcast(deployerPrivateKey);

        PlundrixGame game = PlundrixGame(plundrixAddress);

        // Enable the 2% fee system (FEE_BPS is already 200 = 2%)
        game.configureFee(true, feeRecipient);

        vm.stopBroadcast();

        console.log("=== Plundrix Testnet Config ===");
        console.log("PlundrixGame:   ", plundrixAddress);
        console.log("Fee enabled:     true");
        console.log("Fee BPS:         200 (2%)");
        console.log("Fee recipient:  ", feeRecipient);
        console.log("");
        console.log("=== Usage ===");
        console.log("FREE mode:   createGame() - no entry fee, unlimited games");
        console.log("STAKES mode: createGame(1, 1000000000000000) - 0.001 ETH entry");
        console.log("  Players call registerPlayer(gameID) with 0.001 ETH");
        console.log("  Winner gets pot minus 2% fee");
    }
}

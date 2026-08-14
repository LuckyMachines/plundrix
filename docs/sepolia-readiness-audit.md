# Sepolia Readiness Audit

Date: 2026-08-13

Scope: read-only chain and public-source verification, followed by an explicitly approved, guarded FREE create-to-victory journey using two HSM-backed players. No deployments or role changes were made.

## Live state

- chain ID: `11155111`
- proxy: `0x1FF715D46470B4024D88A12838e08A60855f0AE2`
- proxy type: EIP-1967 / UUPS
- proxy explorer status: verified
- implementation slot: `0x26aDc1216BDa368a74d786148DcAB9baCA74dd7F`
- implementation creator: documented KMS deployer `0xf0F917ccBB18A73DEE95e9911ae0CcF97d683F79`
- implementation creation transaction: `0x1166f85389241370c41f01e20c91bb310c4c23d7fe1ff02a04e446a6ad82185e`
- implementation creation time: 2026-03-12 18:40:24 UTC
- implementation source: exact creation/runtime match published through Sourcify, with public source records mirrored by Blockscout and Routescan
- paused: no
- total games: `1`
- automation: enabled, 300-second delay, external entropy required
- fee test configuration: enabled, 200 basis points, KMS deployer recipient
- game constants: 300-second round, five locks, four-player maximum

## Frontend proof

Run `npm run verify:sepolia:read` from `app/` to:

1. build the production frontend with the live proxy and a public Sepolia read RPC;
2. launch the static server without a visible Windows console;
3. verify the game-first homepage and the real live operation list or empty state;
4. fail on console, page, or resource errors;
5. capture `app/reports/visual-audit/a-plus/sepolia-readonly-desktop.png`;
6. stop the preview server without sending a chain transaction.

The gate passed on 2026-08-13.

## Provenance proof

The implementation runtime exactly matches commit `28e3194e4196bfc780aaace1b4dec9820bf51551`, compiled with Solidity `0.8.17+commit.8df45f5f`, optimizer enabled, and 200 runs. The initial raw comparison differed only in five compiler-declared 32-byte immutable ranges from OpenZeppelin UUPS. Every range contains the deployed implementation's own address, `0x26ad...dd7f`. After normalizing those ranges, the complete runtime matches, including its Solidity metadata suffix.

Run `npm run verify:sepolia:provenance` from the repository root after `npm run build` to repeat the RPC, artifact, and Blockscout comparison. The gate fails on a runtime-length difference, unexpected immutable value, remaining byte difference, missing public source, or compiler/optimizer mismatch.

Sourcify verification job `fc4431fc-57d4-4bdf-a3c5-c66198b5ff99` completed at 2026-08-14 02:01:49 UTC with exact creation and runtime matches. [Blockscout](https://eth-sepolia.blockscout.com/address/0x26aDc1216BDa368a74d786148DcAB9baCA74dd7F?tab=contract) and [Routescan](https://routescan.io/address/0x26aDc1216BDa368a74d786148DcAB9baCA74dd7F?chainid=11155111) both report `PlundrixGame`, Solidity `0.8.17`, optimizer enabled, and 200 runs as verified. The repository previously documented `0x6748...224f`, which is not the proxy's current implementation slot.

## Funded journey gate

Run `npm run verify:sepolia:funded` for a read-only preflight. It verifies the live proxy, pause state, automation settings, both HSM player addresses, operator roles, balances, and the available reserve without signing or broadcasting a transaction.

The write path requires `PLUNDRIX_ALLOW_SEPOLIA_WRITES=true`. It funds only the dedicated `plundrix-deployer` opponent to a 0.006 Sepolia ETH target when needed, refuses non-FREE games, preserves at least 0.02 Sepolia ETH in the operator after a conservative gas ceiling, caps play at 18 rounds by default, requires external drand entropy, checks every receipt, and records transaction hashes and final state in `reports/sepolia-funded/latest.json`.

The 2026-08-13 preflight passed with 0.049700153630424371 Sepolia ETH in the operator, zero games, and all required roles. After GCP authentication was refreshed and writes were explicitly approved, the gate created FREE operation `1`, registered both HSM players, supplied external drand entropy, resolved every round onchain, and completed in round 9.

The winner was `0xC7c627eC982988679D5D15E8ff9579fc0f0AB42f` with five locks and three tools. The operator finished with one lock and three tools. The final resolve transaction was `0x7ee3c28b28e39af787da866edebe01b1f8a86faaef19074f68b96c3442296a38`. Final balances were 0.040525380451171337 Sepolia ETH for the operator and 0.005739355917798580 Sepolia ETH for the opponent.

Two interrupted attempts exposed harness reliability issues without compromising the reserve: outcome-dependent resolution gas could exceed a pre-mine estimate, and refreshing a GCP access token for every KMS signature made the long journey vulnerable to CLI timeouts. The KMS transaction helper now applies a configurable 1.5x gas estimate buffer and caches the access token for 45 minutes. The journey can resume an existing active operation, skips already-submitted actions and entropy, and still verifies every receipt.

`reports/sepolia-funded/latest.json` records the successful resumed segment (rounds 6-9), its transaction receipts, final state, and balances. Earlier lifecycle transactions and rounds remain independently inspectable onchain; the JSON does not claim to duplicate that complete history.

## Funded production UI proof

Run `npm run verify:sepolia:funded-ui` from `app/` to build the production frontend against the live proxy, inject the winning address as a read-only browser wallet, and render `/game/1`. The gate asserts `Vault Breached`, `You Win`, and `Operation #1`; checks desktop and mobile for browser/resource failures, serious or critical Axe findings, and mobile overflow; then captures:

- `app/reports/visual-audit/a-plus/sepolia-funded-game-over-desktop.png`
- `app/reports/visual-audit/a-plus/sepolia-funded-game-over-mobile.png`

The gate passed on 2026-08-13 against the completed live operation.

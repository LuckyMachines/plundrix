# Sepolia Readiness Audit

Date: 2026-08-13

Scope: read-only verification. No transactions, deployments, role changes, or funds were used.

## Live state

- chain ID: `11155111`
- proxy: `0x1FF715D46470B4024D88A12838e08A60855f0AE2`
- proxy type: EIP-1967 / UUPS
- proxy explorer status: verified
- implementation slot: `0x26aDc1216BDa368a74d786148DcAB9baCA74dd7F`
- implementation creator: documented KMS deployer `0xf0F917ccBB18A73DEE95e9911ae0CcF97d683F79`
- implementation creation transaction: `0x1166f85389241370c41f01e20c91bb310c4c23d7fe1ff02a04e446a6ad82185e`
- implementation creation time: 2026-03-12 18:40:24 UTC
- paused: no
- total games: `0`
- automation: enabled, 300-second delay, external entropy required
- fee test configuration: enabled, 200 basis points, KMS deployer recipient
- game constants: 300-second round, five locks, four-player maximum

## Frontend proof

Run `npm run verify:sepolia:read` from `app/` to:

1. build the production frontend with the live proxy and a public Sepolia read RPC;
2. launch the static server without a visible Windows console;
3. verify the game-first homepage and real zero-operation state;
4. fail on console, page, or resource errors;
5. capture `app/reports/visual-audit/a-plus/sepolia-readonly-desktop.png`;
6. stop the preview server without sending a chain transaction.

The gate passed on 2026-08-13.

## Provenance blocker

Blockscout does not currently verify the implementation source. Its runtime is the same length as the locally compiled implementation, but both the full runtime hash and executable-bytecode hash differ from this checkout. The repository previously documented `0x6748...224f`, which is not the proxy's current implementation slot.

Do not treat a new funded Sepolia write test as current-release validation until one of these is complete:

- recover the exact March 12 source/compiler settings and verify `0x26ad...dd7f` on the explorer; or
- review, deploy, and verify an explicitly approved implementation upgrade from the current source.

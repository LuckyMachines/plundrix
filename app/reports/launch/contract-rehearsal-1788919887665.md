# Plundrix Contract Launch Rehearsal

Generated: 2026-09-09T02:11:27.664Z
Mode: contract-rehearsal
Status: blocked

## Checks
- PASS foundry config exists: foundry.toml
- PASS mainnet runbook exists: docs/mainnet-runbook.md
- PASS ABI exists: PlundrixGame ABI
- BLOCKED contract address supplied: VITE_CONTRACT_ADDRESS
- PASS chain id supplied: VITE_CHAIN_ID
- PASS start paused configured: PLUNDRIX_START_PAUSED=true
- PASS fee disabled configured: PLUNDRIX_FEE_DISABLED=true
- BLOCKED deploy env confirmed: ops/launch-readiness.json confirmations.deployEnvConfirmed

## Next Command
Fill release confirmations, then run npm run launch:rehearse-contracts -- --include-pause.

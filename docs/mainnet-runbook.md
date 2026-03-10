# Plundrix Mainnet Runbook

This runbook assumes:

- proxy deployment
- separated launch roles
- external entropy required
- autoloop worker enabled
- Google Cloud KMS signer for operations

## Why Prize Size Changes Risk

This repo is currently planned as a free-play mainnet beta. There are no cash prizes in the launch plan.

The reason prize size still matters conceptually is that higher-value games increase the incentive to manipulate anything that can influence outcomes.

For Plundrix, the main risk is randomness. In a free-play game, weak entropy is mostly a fairness and reputation issue. In a paid game, it becomes a stronger attack incentive for:

- transaction ordering
- block producer influence
- compromised entropy workers
- leaked operator keys

That is why mainnet launch should still require external entropy even for free-play beta.

## Required Environment

Contract deployment:

```bash
CHAIN=mainnet
RPC_URL=https://...
GCP_PROJECT=racerverse-custody
GCP_KMS_LOCATION=us-east1
GCP_KMS_KEYRING=ethereum-keys
GCP_KMS_KEY=autoloop-deployer

DEFAULT_ADMIN_ADDRESS=0x...
GAME_MASTER_ADDRESS=0x...
PAUSER_ADDRESS=0x...
UPGRADER_ADDRESS=0x...
AUTO_RESOLVER_ADDRESS=0x...
RANDOMIZER_ADDRESS=0x...

START_PAUSED=true
AUTO_RESOLVE_ENABLED=true
AUTO_RESOLVE_DELAY=300
REQUIRE_EXTERNAL_ENTROPY=true
# Fee exists in the contract but should stay off for free-play mainnet beta
# configure after deploy if needed:
# FEE_ENABLED=false
# FEE_RECIPIENT=0x...
```

Worker:

```bash
CHAIN=mainnet
RPC_URL=https://...
CONTRACT_ADDRESS=0x...
GCP_PROJECT=racerverse-custody
GCP_KMS_LOCATION=us-east1
GCP_KMS_KEYRING=ethereum-keys
GCP_KMS_KEY=autoloop-deployer
POLL_MS=15000
ENTROPY_SOURCE_URL=https://api.drand.sh/public/latest
```

## Wallets

Current KMS-backed addresses:

- `autoloop-deployer`: `0xf0F917ccBB18A73DEE95e9911ae0CcF97d683F79`
- `mint-signer`: `0x1d5DDB1431C0D15E5E211b0C5810177d38E4A971`

Current deployer balance target:

- `autoloop-deployer` funded to `0.025 ETH`

Useful commands:

```bash
npm run kms:address
npm run kms:fund
```

## Deployment

1. Build fresh artifacts.

```bash
forge build
node scripts/sync-abi.mjs
```

2. Deploy implementation + proxy with KMS signer.

```bash
npm run deploy:kms
```

3. Verify post-deploy state.

- proxy address is the app-facing address
- contract starts paused
- `getAutomationSettings()` returns external entropy required
- `getFeeSettings()` shows disabled for mainnet launch
- configured role holders match the launch plan

4. Update app env/config.

- set `VITE_CONTRACT_ADDRESS` to the proxy address
- set `VITE_RPC_URL` to your production read RPC
- confirm the marketing site still frames launch as free-play beta and links to live Terms and Privacy pages

5. Start the worker.

```bash
npm run autoloop:start
```

6. Unpause only after:

- UI points at the proxy
- worker is live
- entropy source is healthy
- test transactions succeeded on the production chain
- fee remains disabled unless you intentionally change launch policy

## Upgrades

1. Build the new implementation.
2. Deploy the new implementation.
3. Call `upgradeTo` from the configured `UPGRADER_ROLE` address.
4. Run smoke tests against the same proxy address.
5. Keep the worker paused or stopped during sensitive migrations if behavior changed.

## Emergency Response

If gameplay or entropy looks wrong:

1. `pause()`
2. stop the autoloop worker
3. inspect current round state and entropy submissions
4. deploy patched implementation if needed
5. `upgradeTo`
6. validate
7. `unpause()`

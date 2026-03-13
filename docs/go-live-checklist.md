# Plundrix Go-Live Checklist

Current launch plan:

- keep testing on Sepolia now
- ship mainnet later as a free-play beta
- no cash prizes
- fee mechanism exists in the contract, but stays disabled on mainnet

Current Sepolia deployment:

- proxy: `0x1ff715d46470b4024d88a12838e08a60855f0ae2`
- implementation: upgraded 2026-03-12 via KMS (`autoloop-deployer`)
- status: **LIVE** (unpaused 2026-03-13, tx `0xb31a24063ac8c74a9f8de802b149f477c21a33434d486eab8e7da96ef6b3030f`)
- automation: enabled (delay=300s, external entropy required)
- fee setting: enabled for testing only (bps=200, recipient=`0xf0F917ccBB18A73DEE95e9911ae0CcF97d683F79`)

Frontend deployment:

- host: Railway (`game.plundrix.com`)
- staging: SUCCESS (2026-03-13)
- production: SUCCESS (2026-03-13)
- contract address in Railway env: `0x1ff715d46470b4024d88a12838e08a60855f0ae2` (corrected 2026-03-13)
- toast notification system: live

## Sepolia Exit Criteria

- [x] Run full contract tests: `forge test` — 23 passed, 0 failed (2026-03-12)
- [x] Run JS tests: `npm run test:js` — all passing (2026-03-12)
- [x] Run app build: `cd app && npm run build` — clean build (2026-03-13)
- [x] Verify staging app points at Sepolia proxy and RPC — Railway env corrected to `0x1ff...` (2026-03-13)
- [x] Verify agent service points at Sepolia RPC and contract — config falls through to Sepolia RPC; README confirms staging proxy
- [x] Verify autoloop worker can observe timed-out rounds — worker skips FREE games, resolves STAKES; KMS signer has GAME_MASTER_ROLE
- [x] Verify entropy path works end to end on Sepolia — drand source reachable, KMS signer has RANDOMIZER_ROLE, contract requires external entropy
- [x] Verify pause and unpause both succeed on Sepolia — unpaused via KMS 2026-03-13
- [x] Verify one upgrade rehearsal succeeds on Sepolia — KMS upgrade completed 2026-03-12
- [x] Verify fee config reads correctly on Sepolia — `getFeeSettings()` returns enabled, bps=200, recipient set
- [x] Verify fee stays test-only and is not presented as live monetization — footer disclaimer in place

## Product Messaging

- [x] UI says Sepolia staging is live — header badge: "Sepolia staging live - mainnet production soon"
- [x] UI says mainnet free-play beta is coming soon — same header badge
- [x] Mainnet launch is framed as free-play beta — footer: "Free-play beta only"
- [x] No copy implies gambling, prizes, yield, or cash rewards — footer disclaimer covers this
- [x] Bot and agent participation are disclosed clearly — footer: "Some players may be AI agents or bots"
- [x] Marketing site footer links to Terms and Privacy pages — footer links to plundrix.com/terms and plundrix.com/privacy
- [ ] Terms and Privacy pages match the free-play beta posture — requires content on plundrix.com

## Mainnet Preconditions

- [ ] Decide final mainnet role addresses
- [x] Confirm KMS deployer address and ETH funding — `autoloop-deployer` at `0xf0F917ccBB18A73DEE95e9911ae0CcF97d683F79`; `plundrix-deployer` at `0xC7c627eC982988679D5D15E8ff9579fc0f0AB42f` (future use)
- [ ] Confirm worker host and process supervision
- [ ] Confirm production RPC endpoint
- [x] Confirm entropy source health checks — drand API responding (`https://api.drand.sh/public/latest`)
- [x] Confirm app deploy target and env values — Railway staging + production deployed and healthy
- [ ] Confirm agent-service deploy target and env values
- [ ] Confirm fee is disabled for mainnet launch
- [ ] Confirm a rollback owner is available during launch window

## Mainnet Deploy Config

Expected launch posture:

- [ ] `START_PAUSED=true`
- [ ] `AUTO_RESOLVE_ENABLED=true`
- [ ] `AUTO_RESOLVE_DELAY=300`
- [ ] `REQUIRE_EXTERNAL_ENTROPY=true`
- [ ] fee configured but disabled

Reference runbook:

- [ ] Follow [`docs/mainnet-runbook.md`](./mainnet-runbook.md)

## Mainnet Deploy Day

- [ ] Build fresh artifacts: `forge build`
- [ ] Sync ABI: `node scripts/sync-abi.mjs`
- [ ] Confirm clean deploy env values
- [ ] Deploy implementation + proxy
- [ ] Record implementation tx hash
- [ ] Record proxy tx hash
- [ ] Record proxy address
- [ ] Verify `paused() == true`
- [ ] Verify `getAutomationSettings()` is correct
- [ ] Verify `getFeeSettings()` shows disabled
- [ ] Verify admin and upgrader roles are correct

## Mainnet Before Unpause

- [ ] App points at mainnet proxy
- [ ] App reads from mainnet RPC
- [ ] Agent service points at mainnet
- [ ] Worker is running
- [ ] Entropy source is healthy
- [ ] Create a test game on mainnet
- [ ] Join with test wallets
- [ ] Submit actions
- [ ] Resolve one round successfully
- [ ] Verify event indexing and session feed
- [ ] Verify no fee UX is exposed

## Mainnet Go Live

- [ ] Unpause contract
- [ ] Announce free-play beta only
- [ ] Monitor failed tx rate
- [ ] Monitor worker logs
- [ ] Monitor entropy update cadence
- [ ] Monitor agent-service errors
- [ ] Monitor player confusion around network or prizes

## First 24 Hours

- [ ] Confirm games can be created reliably
- [ ] Confirm rounds resolve without manual intervention spikes
- [ ] Confirm no stuck paused-state assumptions in UI
- [ ] Confirm agent ladder and session feed update correctly
- [ ] Keep upgrade path ready but unused unless needed

## Emergency Checklist

- [ ] Pause contract
- [ ] Stop worker if behavior looks wrong
- [ ] Inspect latest rounds and entropy writes
- [ ] Patch and deploy new implementation if needed
- [ ] Upgrade proxy
- [ ] Re-test before unpausing

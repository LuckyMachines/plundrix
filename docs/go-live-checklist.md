# Plundrix Go-Live Checklist

Current launch plan:

- keep testing on Sepolia now
- ship mainnet later as a free-play beta
- no cash prizes
- fee mechanism exists in the contract, but stays disabled on mainnet

Current Sepolia deployment:

- proxy: `0x1ff715d46470b4024d88a12838e08a60855f0ae2`
- implementation: `0x26adc1216bda368a74d786148dcab9baca74dd7f`, deployed 2026-03-12 via KMS (`autoloop-deployer`)
- status: **LIVE** (unpaused 2026-03-13, tx `0xb31a24063ac8c74a9f8de802b149f477c21a33434d486eab8e7da96ef6b3030f`)
- automation: enabled (delay=300s, external entropy required)
- fee setting: enabled for testing only (bps=200, recipient=`0xf0F917ccBB18A73DEE95e9911ae0CcF97d683F79`)
- provenance: runtime matches commit `28e3194` after normalizing the five compiler-declared UUPS immutable ranges; source is verified on Blockscout and Routescan
- funded journey: FREE operation `1` completed in nine rounds with two HSM-backed players; final resolve `0x7ee3c28b28e39af787da866edebe01b1f8a86faaef19074f68b96c3442296a38`; desktop/mobile production UI proof passed

Frontend deployment:

- host: self-hosted Coolify on Hetzner (`game.plundrix.com`)
- staging: SUCCESS (2026-03-13)
- production: SUCCESS (2026-03-13)
- contract address in Coolify build environment: `0x1ff715d46470b4024d88a12838e08a60855f0ae2`
- toast notification system: live
- mobile UI overhaul: shipped (2026-03-14)
- self-hosted fonts on Cloudflare R2: shipped (2026-03-14)
- network switch banner for mainnet visitors: shipped (2026-03-16)

MCP server (`mcp-server/`):

- 5 free read tools (status, list games, snapshot, history, total)
- 4 paid write tools via x402 sidecar (create, register, submit, resolve)
- ExactEvmScheme on Base Sepolia, USDC payments ($0.04–$0.10/op)
- relay signer model (private key or KMS)
- status: **BUILT**, not deployed
- dynamic pricing (ETH/USD anchor model): designed, not implemented

## Sepolia Exit Criteria

- [x] Run full contract tests: `forge test` — 23 passed, 0 failed (2026-03-12)
- [x] Run JS tests: `npm run test:js` — all passing (2026-03-12)
- [x] Run app build: `cd app && npm run build` — clean build (2026-03-13)
- [x] Verify staging app points at Sepolia proxy and RPC - deployment environment corrected to `0x1ff...` (2026-03-13)
- [x] Verify agent service points at Sepolia RPC and contract — config falls through to Sepolia RPC; README confirms staging proxy
- [x] Verify autoloop worker can observe timed-out rounds — worker skips FREE games, resolves STAKES; KMS signer has GAME_MASTER_ROLE
- [x] Verify entropy path works end to end on Sepolia — drand source reachable, KMS signer has RANDOMIZER_ROLE, contract requires external entropy
- [x] Verify pause and unpause both succeed on Sepolia — unpaused via KMS 2026-03-13
- [x] Verify one upgrade rehearsal succeeds on Sepolia — KMS upgrade completed 2026-03-12
- [x] Verify fee config reads correctly on Sepolia — `getFeeSettings()` returns enabled, bps=200, recipient set
- [x] Verify fee stays test-only and is not presented as live monetization — footer disclaimer in place
- [x] Complete a guarded FREE create-to-victory journey on Sepolia with two HSM-backed players - operation `1`, nine rounds (2026-08-13)
- [x] Render the live final state through the production frontend at desktop and mobile widths with accessibility and overflow checks (2026-08-13)

## Product Messaging

- [x] UI says Sepolia staging is live — header badge: "Sepolia staging live - mainnet production soon"
- [x] UI says mainnet free-play beta is coming soon — same header badge
- [x] Mainnet launch is framed as free-play beta — footer: "Free-play beta only"
- [x] No copy implies gambling, prizes, yield, or cash rewards — footer disclaimer covers this
- [x] Bot and agent participation are disclosed clearly — footer: "Some players may be AI agents or bots"
- [x] Marketing site footer links to Terms and Privacy pages — footer links to plundrix.com/terms and plundrix.com/privacy
- [x] Terms and Privacy pages match the free-play beta posture — /terms and /privacy routes added to game app (2026-03-13)

## App Polish

- [x] Mobile hamburger nav with full-screen slide-out menu (2026-03-14)
- [x] 44px minimum touch targets on all interactive elements (2026-03-14)
- [x] viewport-fit=cover + safe area padding for notched devices (2026-03-14)
- [x] Full-width toasts on mobile with vertical slide animation (2026-03-14)
- [x] Horizontal scroll on tables to prevent layout blowout (2026-03-14)
- [x] Tighter letter-spacing below 640px (2026-03-14)
- [x] Collapsible homepage sections (leaderboards/sessions) (2026-03-14)
- [x] Skeleton loading states (2026-03-14)
- [x] Responsive SVG visualizations (2026-03-14)
- [x] Intermediate md: breakpoints on VaultBench and leaderboard grids (2026-03-14)
- [x] PWA manifest + SVG favicon (2026-03-14)
- [x] color-scheme: dark meta tag (2026-03-14)
- [x] Self-hosted fonts on Cloudflare R2 — no Google Fonts runtime dependency (2026-03-14)
- [x] Network switch banner prompts mainnet visitors to switch to Sepolia (2026-03-16)

## Mainnet Preconditions

- [ ] Decide final mainnet role addresses
- [x] Confirm KMS deployer address and ETH funding — `autoloop-deployer` at `0xf0F917ccBB18A73DEE95e9911ae0CcF97d683F79`; `plundrix-deployer` at `0xC7c627eC982988679D5D15E8ff9579fc0f0AB42f` (future use)
- [ ] Confirm worker host and process supervision
- [ ] Confirm production RPC endpoint
- [x] Confirm entropy source health checks — drand API responding (`https://api.drand.sh/public/latest`)
- [ ] Confirm Coolify uses the root Dockerfile, tracks `main`, and has automatic deployment enabled
- [ ] Confirm the combined Coolify service has agent-service contract and RPC values
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

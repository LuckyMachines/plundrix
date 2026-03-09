# Plundrix Go-Live Checklist

Current launch plan:

- keep testing on Sepolia now
- ship mainnet later as a free-play beta
- no cash prizes
- fee mechanism exists in the contract, but stays disabled on mainnet

Current Sepolia deployment:

- proxy: `0x1ff715d46470b4024d88a12838e08a60855f0ae2`
- implementation: `0x6748415bce63c0fbf1e50ceb2128bfeac977224f`
- status: paused
- automation: enabled
- external entropy: required
- Sepolia fee setting: enabled for testing only

## Sepolia Exit Criteria

- [ ] Run full contract tests: `forge test`
- [ ] Run JS tests: `npm run test:js`
- [ ] Run app build: `cd app && npm run build`
- [ ] Verify staging app points at Sepolia proxy
- [ ] Verify agent service points at Sepolia RPC and contract
- [ ] Verify autoloop worker can observe timed-out rounds
- [ ] Verify entropy path works end to end on Sepolia
- [ ] Verify pause and unpause both succeed on Sepolia
- [ ] Verify one upgrade rehearsal succeeds on Sepolia
- [ ] Verify fee config reads correctly on Sepolia
- [ ] Verify fee stays test-only and is not presented as live monetization

## Product Messaging

- [ ] UI says Sepolia staging is live
- [ ] UI says mainnet production is coming soon
- [ ] Mainnet launch is framed as free-play beta
- [ ] No copy implies gambling, prizes, yield, or cash rewards
- [ ] Bot and agent participation are disclosed clearly

## Mainnet Preconditions

- [ ] Decide final mainnet role addresses
- [ ] Confirm KMS deployer address and ETH funding
- [ ] Confirm worker host and process supervision
- [ ] Confirm production RPC endpoint
- [ ] Confirm entropy source health checks
- [ ] Confirm app deploy target and env values
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


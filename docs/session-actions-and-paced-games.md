# Session actions and paced games

Status: implemented and feature-flagged for a future contract upgrade. The verified Sepolia v0.8 deployment is unchanged.

## Session-action security model

1. A registered player generates an ephemeral key inside the browser.
2. The player authorizes that public address with one wallet transaction for one game.
3. Each action is signed locally using EIP-712 and includes the game, player, action, target, nonce, and two-minute deadline.
4. The optional relay simulates the exact signed call, pays gas, submits it, and waits for a successful receipt.
5. The contract rejects changed actions, expired signatures, reused nonces, unauthorized keys, and duplicate round submissions.
6. The player can revoke the key onchain. The browser stores the private key only in session storage and never sends it to the relay.

The relay is disabled unless both `AGENT_ENABLE_SESSION_RELAY=true` and a valid `AGENT_SESSION_RELAY_PRIVATE_KEY` are configured. The frontend path is disabled unless `VITE_ENABLE_SESSION_KEYS=true` and `VITE_SESSION_RELAY_URL` are configured.

## Paced games

`createGameWithPace` creates a free game with a timeout from 30 seconds through one day. Existing games and `createGame()` retain the five-minute timeout. The frontend offers 45-second Live, 90-second Tactical, and five-minute Async choices only when `VITE_ENABLE_NEXT_RULES=true`.

## Deployment gate

- Run the full test portfolio and a storage-layout comparison.
- Deploy the new implementation to Sepolia without changing the proxy.
- Verify source and runtime publicly.
- Rehearse pause, upgrade, rollback, session authorization, expiry, replay rejection, and revocation.
- Configure a funded relay with a strict balance monitor and request rate limits.
- Enable `VITE_ENABLE_NEXT_RULES` first, then `VITE_ENABLE_SESSION_KEYS` after relay proof.
- Run a separately named balance tournament before treating the candidate rules as final.

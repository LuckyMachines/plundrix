# Plundrix Product Quality Implementation Checklist

## 1. First user journey and positioning

- [x] Replace the insider-facing Operations Console hero with a game-first value proposition.
- [x] Put player count, objective, three choices, simultaneous resolution, and beta posture in the first viewport.
- [x] Add a no-wallet interactive turn decision before contract setup.
- [x] Simplify public navigation around Play, Practice, Replays, Ladder, and Compare.
- [x] Verify browser-wallet create, join, start, submit, resolve, and finish capabilities against a configured local chain.

## 2. Visual identity and proof

- [x] Generate original text-free vault key art through Azure GPT Image 2.
- [x] Integrate an optimized WebP derivative while retaining the PNG social image.
- [x] Add replay-story proof cards and direct replay links.
- [x] Capture desktop and mobile baseline/final evidence.
- [x] Generate and curate replay posters for comeback, sabotage, and close-finish matches.
- [x] Extend the vault art family into the homepage replay proof and replay gallery while preserving live HTML copy and accessible image descriptions.

## 3. Product truth and trust

- [x] Hide Stakes creation unless `VITE_ENABLE_STAKES=true` is explicitly configured.
- [x] Align Terms and legal notes with the current free-play posture and probabilistic mechanics.
- [x] Update Privacy to disclose the active self-hosted Plausible analytics script.
- [x] Replace public missing-environment language with a useful practice fallback.
- [ ] Obtain jurisdiction-specific legal review before enabling or marketing any paid mode.

## 4. Reliability, security, and accessibility

- [x] Verify the production frontend build.
- [x] Verify agent-service, Solidity, fun-system, replay, and telemetry suites.
- [x] Apply safe same-major dependency updates and nonbreaking audit fixes.
- [x] Increase secondary text contrast and preserve reduced-motion/readability controls.
- [x] Close the former Wagmi 2 transitive advisory exception after migration and verification.
- [x] Migrate and test Wagmi 3, removing the remaining production advisories and 426 net packages.
- [x] Add Playwright interaction, visual, and automated accessibility gates.
- [x] Make the full JS contract suite start its required local chain instead of silently skipping every case.

## 5. Evidence still requiring people or live configuration

- [ ] Import at least four facilitated first-match playtests.
- [x] Capture configured lobby, active match, resolution, and game-over states at desktop and mobile sizes.
- [x] Build and verify the marketing site against read-only live Sepolia state with no browser/runtime errors.
- [x] Reconcile the live implementation runtime to exact source and compiler settings with a repeatable provenance gate.
- [x] Publish the reconciled implementation source through Sourcify and confirm public records on Blockscout and Routescan.
- [x] Add a guarded, FREE-only, reserve-protected, bounded Sepolia create-to-victory gate using two HSM-backed players.
- [x] Refresh non-interactive GCP authentication and complete the funded gate; retain its transaction report.
- [x] Capture the completed live Sepolia winner state at desktop and mobile sizes with accessibility, overflow, and browser-error gates.
- [ ] Validate homepage claims and CTA comprehension with first-time players.
- [x] Re-grade after live-state e2e evidence is attached.

## 6. v0.9 selected gameplay and retention pass

- [x] Add player-authorized EIP-712 session actions with nonce, expiry, revocation, and an optional gas relay.
- [x] Replace player-order victory selection with an entropy-backed simultaneous-breach tiebreak.
- [x] Prevent consecutive-round stun locks while preserving a decisive Sabotage action.
- [x] Tune Leader Hunter to convert one-tool and match-point positions sooner.
- [x] Add instant agent-filled Blitz, Classic, and Tactical matches with no wallet requirement.
- [x] Add configurable 30-second-to-one-day round pacing for the next contract deployment.
- [x] Add a first-operation guide and explicit Pick, Search, and Sabotage consequence previews.
- [x] Add one-use Precision Kit, Signal Scanner, and Firewall loadouts to Tactical instant play.
- [x] Add instant rematch, result sharing, deterministic challenge links, and operation sharing.
- [x] Add local operator identity, XP, levels, streaks, and persistent instant-play records.
- [x] Make live sessions explicitly spectatable and shareable from the session feed.
- [x] Add opt-in background-tab round notifications without exposing analytics.
- [x] Produce and integrate a 32-second trailer from real gameplay captures and existing Plundrix art.
- [x] Keep next-contract session and pacing features disabled until the upgraded implementation and relay are deployed.
- [ ] Deploy and publicly verify the upgraded implementation on Sepolia.
- [ ] Configure and fund the bounded session-action relay, then enable the two frontend feature flags.
- [ ] Validate the new Leader Hunter and anti-stun-lock rules in a separately versioned tournament run.

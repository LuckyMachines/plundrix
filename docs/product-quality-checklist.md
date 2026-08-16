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

## 7. v0.10 marketing-site conversion pass

- [x] Distinguish instant no-wallet play from the live Sepolia multiplayer beta in the first viewport.
- [x] Replace the secondary practice CTA with a direct 32-second gameplay-trailer path.
- [x] Embed the real-capture trailer on the homepage with reduced-motion-aware autoplay behavior.
- [x] Replace vague hero statistics with concrete locks, choices, player-count, and signup facts.
- [x] Add direct answers for wallet, onchain, cost, and labeled-agent questions.
- [x] Add public-contract, free-beta, labeled-agent, and funded-operation trust proof without testimonials or analytics disclosure.
- [x] Add the trailer to desktop and mobile navigation and improve the disconnected footer state.
- [x] Remove internal operator tools from the public sitemap and disallow them in robots.txt.
- [x] Strengthen canonical, Open Graph, manifest, structured-data, and stale-route metadata handling.
- [x] Verify the production build, zero-vulnerability production audit, valid SEO files, and full browser/accessibility portfolio.

## 8. v0.11 SEO and AI-search discovery pass

- [x] Add `/play` and `/trailer` to the route metadata source used by production static generation.
- [x] Exclude snapshots and internal operator tools from generated production sitemaps.
- [x] Serve clean route-specific HTML instead of the generic SPA shell for public URLs.
- [x] Add synchronized canonical, robots, Open Graph, Twitter, and JSON-LD tags to every generated public route.
- [x] Add `WebSite`, `Organization`, `VideoGame`, visible FAQ, and `VideoObject` structured data where supported by page content.
- [x] Add factual `llms.txt` and `llms-full.txt` references without testimonials or analytics disclosure.
- [x] Explicitly permit major AI-search crawlers while preserving internal-route exclusions.
- [x] Add internal and player-specific `X-Robots-Tag` noindex responses.
- [x] Create and validate dedicated 1200x630 home, Instant Play, and trailer social cards.
- [x] Art-direct three text-free social scene masters through Azure GPT Image 2 and apply exact copy in the deterministic renderer.
- [x] Add route-specific social images and complete image dimensions, types, alt text, secure URLs, and video tags.
- [x] Serve the trailer with `video/mp4`, byte ranges, and correct caching behavior.
- [x] Add a repeatable SEO build test covering generated files and production HTTP behavior.
- [x] Replace the unconfigured leaderboard's internal service error with a tested player-facing fallback and stop disabled polling.

## 9. v0.12 cross-domain journey reconciliation

- [x] Assign acquisition, rules, previews, and trust to `plundrix.com`.
- [x] Replace the game marketing homepage with a player hub for Instant Play and live Sepolia.
- [x] Keep the live operation browser and create-operation workflow directly on the player hub.
- [x] Permanently redirect the retired marketing `/play` page to the game player hub.
- [x] Remove the retired route from the marketing sitemap and distinguish Player Hub from Instant Play in AI references.
- [x] Collapse duplicate marketing footer links into Player Hub, Instant Play, and Ladder.
- [x] Replace internal evidence and claim-validation language with player-facing trailer copy.
- [x] Verify both builds, both production audits, SEO, accessibility, mobile navigation, and browser-wallet operation creation.
- [ ] Validate the two-mode choice with first-time players after production deployment.

## 10. v0.13 domain specialization

- [x] Remove simulated play controls and duplicate round demonstrations from the marketing homepage.
- [x] Reduce the marketing homepage from 19 to 7 major sections.
- [x] Make marketing explain the fantasy, rules, proof, trust, and FAQs while the game domain owns playable decisions.
- [x] Replace the marketing network selector with one Player Hub conversion path.
- [x] Update marketing navigation, structured data, FAQ copy, and AI references to match the domain split.
- [x] Verify the marketing build, production audit, anchors, CTAs, and desktop/mobile overflow.
- [ ] Validate domain-role comprehension with first-time visitors.

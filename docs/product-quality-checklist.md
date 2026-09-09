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
- [x] Deploy and publicly verify the upgraded implementation on Sepolia - implementation `0x50a5...06c5`, exact Sourcify match, Blockscout and Routescan verified, operation `117` completed.
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

## 11. v0.14 cross-domain visual expansion

- [x] Generate a dedicated marketing hero through Azure GPT Image 2 and reject the first inaccurate lock-count composition.
- [x] Generate a distinct breached-vault conversion scene for the marketing close.
- [x] Generate separate Instant Play and live-table scenes with mode-specific visual storytelling.
- [x] Preserve source PNGs and deliver optimized 120-194 KB WebP derivatives.
- [x] Keep real product screenshots as proof and generated scenes as decorative atmosphere.
- [x] Capture desktop and mobile marketing, Player Hub, and Instant Play states.
- [x] Verify builds, targeted interactions, image delivery, browser errors, serious/critical accessibility, and horizontal overflow.
- [x] Preserve before/after comparisons, relative depth evidence, perspective calibration, prompts, and acceptance results.
- [ ] Validate faster mode recognition with first-time visitors.

## 12. v0.15 full product experience pass

- [x] Replace the operation browser's per-card RPC fan-out with one capped, batched catalog request and stop polling completed cards.
- [x] Separate live tables from a collapsed recent archive and provide a useful instant-play empty state.
- [x] Reduce the public navigation to Hub, Play now, Trailer, Replays, and Results; gate internal tools behind an explicit development flag.
- [x] Add route-level scroll restoration, a visible not-found page, HTTP 404 responses, and noindex headers for unknown and internal routes.
- [x] Add production CSP, HSTS, clickjacking, MIME-sniffing, referrer, and permissions protections to the game server.
- [x] Make the Field Manual and create-operation overlays keyboard-modal, focus-trapped, Escape-dismissable, and focus-restoring.
- [x] Add a persisted global sound preference, make the trailer user-initiated, and strengthen reduced-motion/readability behavior.
- [x] Improve Instant Play with rival personalities, rank feedback, staged reveals, audio cues, a visual vault, mobile horizontal rivals, a sticky commit action, and score challenges.
- [x] Tune agent decision policy to avoid protected sabotage targets and prolonged stall loops.
- [x] Raise the deterministic fun smoke score from 81/B to 93/A, with every scenario at 83 or above.
- [x] Repair replay artwork matching, simplify gallery filters, hide advanced import/export and director controls, and reject invalid replay IDs.
- [x] Stop classifying unregistered addresses as humans and label incomplete historical metrics and estimated completion times honestly.
- [x] Add privacy-safe product event instrumentation without wallet addresses, seeds, names, or free-form text.
- [x] Send every primary marketing CTA directly to Instant Play, preserve live Sepolia as a clear secondary path, and remove the nonfunctional network choice.
- [x] Link the exact deployed contract, enlarge screenshot proof, distinguish site/game legal links, and add the public source repository.
- [x] Add waitlist consent copy, email autofill semantics, a status live region, segment retention, and a honeypot field.
- [x] Make marketing reveal effects progressive enhancement and correct inaccurate no-backend structured-data claims.
- [x] Upgrade the marketing dependency set, build both sites, pass production audits, and rerun product, agent, replay, fun, telemetry, cohesion, and SEO checks.
- [ ] Observe at least four first-time players completing Instant Play and the marketing-to-game handoff.
- [ ] Confirm post-deployment analytics funnels, production headers, social previews, and indexed routes without publishing private player data.
- [ ] Have counsel review the final public legal copy before enabling paid play or prizes.

## 13. v0.16 design-system implementation pass

- [x] Eliminate active Instant Play mobile overflow and keep the commit action fixed above the safe area.
- [x] Persist and restore active Instant Play operations; add an explicit exit action.
- [x] Put live-game action controls before supporting stage detail on mobile and keep the first Pick action in the opening viewport.
- [x] Scope replay keyboard shortcuts to the focused viewer instead of intercepting unrelated controls.
- [x] Add success and failure feedback for replay, session, result, challenge, import, and wallet actions.
- [x] Add an application error boundary, keyboard skip link, reduced-motion-aware resolution timing, 44px controls, and a 12px microcopy floor.
- [x] Add honest Sessions and Profile fallbacks when the competition service is not configured, plus linked Results navigation and scoring disclosure.
- [x] Normalize player-facing nouns around operation, player, and operator persona; document practice/live rule differences.
- [x] Add reviewer, version, per-section priority and notes, import, reset, filtered index, and container-responsive previews to the design system.
- [x] Make wide internal tools self-contained and keyboard-scrollable without mobile page overflow.
- [x] Correct the Design Control Tower human-gap metric when a hypothesis explicitly awaits human playtesting.
- [x] Route-split wallet and query infrastructure away from no-wallet pages and omit production source maps.
- [x] Add regression coverage for mobile Instant Play persistence/containment, replay shortcut scope, service fallbacks, live first-viewport action placement, and internal-tool overflow.
- [x] Pass the final production build, SEO delivery checks, and all 30 active Playwright journeys; keep visual-evidence capture explicitly opt-in.
- [ ] Observe four first-time players and attach qualitative evidence to the review ledger.
- [ ] Validate production funnels and delivery after deployment.

## 14. v0.17 modular art pipeline

- [x] Define one versioned art-direction contract for product truth, palette, materials, lighting, shape language, and joy.
- [x] Split reusable vault, station, action, accent, outcome, and composition parts from asset-specific briefs.
- [x] Define family recipes for atmosphere, mode art, replay stories, social sources, and transparent parts.
- [x] Move archival scene masters out of the public delivery tree.
- [x] Compile consistent Markdown and JSON prompt packs from the shared manifest.
- [x] Build optimized WebP/JPEG derivatives and exact social typography from one command path.
- [x] Validate paths, dimensions, byte budgets, provenance, source availability, and delivery availability.
- [x] Record a hash-based art inventory and expose pipeline state in the living Design System.
- [x] Create generation-ready briefs for a lock module, Pick tool, Search kit, and sabotage cable.
- [x] Flag the former Instant Play master after the stricter five-lock truth check failed, then retain it in the retired archive.
- [x] Regenerate and accept Instant Play with four empty workstations and exactly five deterministically composited lock modules.
- [x] Generate, alpha-extract, crop-test, and accept the four transparent part masters through Azure FLUX.2-pro.

## 15. v0.18 signature workshop and inventory depth

- [x] Reframe the inventory around 10 gameplay-distinct chassis and 1,200 stable configurations.
- [x] Preserve all existing configuration IDs, serials, recipes, ownership, and starter compatibility.
- [x] Replace the flat 1,200-card wall with chassis selection, a live builder, and grouped collection progress.
- [x] Give finish and calibration layers visible material patterns, color, glyphs, and module identities.
- [x] Remove unsupported stat bars and distinguish gameplay effects from appearance-only choices.
- [x] Author 30 memorable named builds with unique lore and guarantee 1,200 unique display names.
- [x] Add favorite, two-build comparison, direct lookup, missing-material guidance, and reclaim/refund flows.
- [x] Implement the 10 signature rules in both practice logic and upgrade-compatible smart contracts.
- [x] Make Tactical play use the equipped signature build instead of a redundant protocol picker.
- [x] Rebuild the contact sheet as a compact configuration atlas with 16 shared images and 1,200 review cells.
- [x] Validate the catalog, production build, 52 Solidity tests, 83 JavaScript tests, connected browser behavior, accessibility, and responsive overflow.
- [x] Capture and inspect desktop, mobile, builder, design-system, atlas, and before/after visual evidence.
- [ ] Balance the 10 signature strengths with observed competitive play and telemetry.
- [x] Increase production game-contract runtime headroom from 15 bytes to 666 bytes by moving roster orchestration into the Workshop and using a size-oriented optimizer profile.

## 16. v0.19 mischievous retention loop

- [x] Add a three-stage Vault Run with branching bargains, escalating vault conditions, persistence, and a final score.
- [x] Give all 10 gadgets unmistakable activation copy, color, motion, and audio cues.
- [x] Persist rival grudges, wins, losses, thefts, and contextual taunts across local operations.
- [x] Add chassis mastery, cosmetic titles, inscriptions, and usage progress to the Workshop.
- [x] Add push-your-luck bargains that trade safety, tools, salvage, heat, and score.
- [x] Add a deterministic weekly vault with shareable challenge URLs and a service-backed score board with local fallback.
- [x] Capture privacy-safe gadget, bargain, run-stage, rivalry, and completion telemetry.
- [x] Add a structured first-time-player observation recorder without inventing participant evidence.
- [x] Add pure-logic, service, browser, accessibility, responsive, build, and visual evidence coverage.

## 17. v0.20 Sepolia workshop deployment

- [x] Upgrade the Sepolia game proxy through the HSM-backed KMS signer.
- [x] Deploy and initialize the workshop implementation and ERC-1967 proxy.
- [x] Link game and workshop proxies in both directions.
- [x] Verify successful receipts, implementation slots, code, roles, catalog counts, and preserved game settings.
- [x] Record the deployment addresses, transactions, checks, and frontend handoff.
- [ ] Publish the new implementation sources on a public verifier.
- [ ] Run a guarded post-upgrade FREE operation with an equipped workshop gadget.

# Plundrix Product Quality Report Cards

This file tracks versioned quality snapshots under an external product bar.

## v0.1.0 - Baseline

Date: 2026-08-13

Overall grade: **C+**

| Area | Grade | Evidence and A gap |
|---|---:|---|
| First user journey | C- | The homepage led with "Operations Console," a missing-contract error, loading skeletons, and wallet terminology. A new visitor could not see the game before setup friction. |
| Core product clarity | C | Pick, Search, and Sabotage existed in copy, but the vault fantasy and simultaneous-choice tension were not demonstrated. |
| Gameplay systems | B+ | Contract, simulator, replay, agent, balance, telemetry, and mutation systems are unusually deep. Real human playtest evidence and a frictionless playable first session are still missing. |
| Visual hierarchy | C- | The first viewport treated service status and internal navigation as the product. The vault and action stage were absent. |
| Art direction | D+ | A coherent dark industrial token system existed, but there was no signature product art or marketing imagery. |
| Trust / proof | C | Replay tooling existed but was not visible on the homepage. Legal, privacy, and product-mode copy contradicted the code and analytics configuration. |
| Technical reliability | B | Production build, Solidity tests, and agent tests pass after install. The full JS suite requires a local chain and reported all 75 cases skipped when it was absent. |
| Accessibility / responsive | B | Touch targets, reduced motion, readability mode, and mobile layouts existed. Secondary contrast was weak and the mobile first journey was extremely long. |
| Discovery / SEO | B | Comparison pages, sitemap, metadata, and structured content existed. The homepage lacked a specific title, game schema, and social image. |
| Documentation / tracking | B+ | Documentation is extensive and operationally mature, but several old plans marked already-shipped areas as pending and product/legal posture had drifted. |

## v0.2.0 - Product and marketing pass

Date: 2026-08-13

Overall grade: **B+**

| Area | Grade | Evidence and A gap |
|---|---:|---|
| First user journey | B+ | The first viewport now explains the fantasy, players, actions, CTA, and beta status. A no-wallet decision demo precedes chain setup. A requires a verified fresh-wallet e2e path on the live configuration. |
| Core product clarity | A- | The five-lock objective, three choices, simultaneous resolution, table pressure, and replay loop are now explicit and interactive. |
| Gameplay systems | B+ | Existing systems remain intact and verified. A still requires imported human playtests and live-session evidence. |
| Visual hierarchy | A- | The vault is the hero, actions form the second beat, the turn demo is the primary proof, and operations are intentionally downstream. |
| Art direction | B+ | Original GPT Image 2 vault art, warmer contrast, simplified navigation, and consistent industrial materials create a recognizable identity. A requires a small coherent in-game/replay asset family, not one hero alone. |
| Trust / proof | B+ | Replay stories are visible, agent disclosure remains, Stakes UI is opt-in, mechanics claims now acknowledge variable resolution, and Privacy now discloses Plausible. A requires real curated replay captures and external playtest quotes or data. |
| Technical reliability | B | Build and targeted suites pass. Same-major dependency updates reduced production audit findings from 37 to 23, but 2 high and 21 moderate transitive findings remain behind the Wagmi 3 migration boundary. |
| Accessibility / responsive | B+ | Secondary contrast is stronger, controls remain keyboard/touch accessible, the turn demo uses pressed state and live result text, and desktop/mobile captures retain hierarchy. Formal automated accessibility testing is still absent. |
| Discovery / SEO | A- | Homepage metadata, VideoGame JSON-LD, canonical data, Open Graph/Twitter image, and a 130 KB WebP hero are now present. |
| Documentation / tracking | B+ | Product posture is aligned across the public UI, Terms, Privacy, and legal notes. Historical implementation trackers still need archival/version cleanup. |

## A bar, stricter

To earn an A from this snapshot:

- A fresh visitor can complete a practice match and a configured live operation through automated desktop and mobile e2e tests.
- At least four facilitated first-match sessions are imported, with observable comprehension and drop-off evidence.
- The homepage uses curated, captured replay proof rather than only generated replay summaries.
- A coherent art family extends the vault identity into replay posters, empty states, and key in-game moments without reducing UI readability.
- Automated accessibility checks pass for the homepage, navigation, practice flow, and active match at mobile and desktop viewports.
- The remaining production dependency advisories are removed through a tested Wagmi 3 migration or documented as accepted, unreachable transitive risk.
- A live-config screenshot pass proves loading, empty, connected, lobby, active match, resolution, and error states.

## v0.3.0 - Automated product-quality gate

Date: 2026-08-13

Overall grade: **A-**

| Area | Grade | Evidence and remaining gap |
|---|---:|---|
| First user journey | A- | A no-wallet practice match completes in-browser, and an automated browser wallet joins a real local-chain lobby, starts the operation, commits a turn, and resolves a round. A requires the same gate through victory on desktop and mobile. |
| Core product clarity | A- | The game-first homepage, interactive decision demo, practice path, and configured lobby/active states now form a tested product loop. |
| Gameplay systems | A- | 23 Solidity, 75 contract-integration, 8 agent-service, and 13 browser scenarios pass. Human first-match comprehension evidence remains the important non-automatable gap. |
| Visual hierarchy | A- | Desktop/mobile marketing captures and configured lobby/active-match captures establish the hierarchy in real states. The active-state review also exposed and removed disconnected `NaN` readouts. |
| Art direction | B+ | The signature GPT Image 2 vault hero is strong and optimized. A still requires a curated replay-poster and match-result asset family; the image-generation capability was unavailable during this follow-up pass. |
| Trust / proof | A- | The browser gate uses a deployed contract and real transactions rather than mocked UI state. Stakes remain opt-in and network guidance now treats configured Foundry correctly. |
| Technical reliability | A- | Production build and all core suites pass. The local-chain browser harness is deterministic and hidden-window safe, and fonts are bundled locally instead of failing CORS at runtime. Production advisories fell from 23 to 8 moderate-only findings; no high or critical findings remain. |
| Accessibility / responsive | A | Axe serious/critical checks pass on the homepage, configured lobby, and active match; mobile navigation and active-match layouts are exercised; invalid ARIA, form labeling, and danger-color contrast defects were fixed. |
| Discovery / SEO | A- | The prior metadata, schema, comparison, sitemap, and social-image improvements remain verified by the production build. |
| Documentation / tracking | A- | The implementation checklist and dependency risk register now distinguish automated evidence from work that still needs players, production configuration, or a major Wagmi migration. |

## A+ bar from v0.3.0

- Complete create, join, submit, resolve, and victory flows through desktop and mobile browser-wallet automation.
- Import at least four facilitated first-match playtests and act on observed comprehension or drop-off failures.
- Add curated replay posters and configured resolution/game-over captures that extend the vault art family.
- Migrate to Wagmi 3 and retest, removing the remaining UUID advisory chain without compatibility overrides.
- Validate the same journey against the deployed Sepolia configuration with a fresh funded test wallet.

## v0.4.0 - Victory, art family, and security closure

Date: 2026-08-13

Overall grade: **A**

| Area | Grade | Evidence and remaining gap |
|---|---:|---|
| First user journey | A | A browser wallet joins, starts, submits, resolves, breaches the fifth lock, and reaches the final briefing on a fresh local contract fixture. Practice remains wallet-free. Browser-created operation coverage and Sepolia validation remain. |
| Core product clarity | A | The five-lock objective, simultaneous three-choice round, playable practice path, and replay proof now connect the marketing promise to the tested product loop. |
| Gameplay systems | A- | Contract-backed completion is automated and the full core test portfolio remains the release gate. Four facilitated first-match sessions are still required to validate comprehension and delight with humans. |
| Visual hierarchy | A | The game-first homepage, replay art cards, configured lobby/active states, and desktop/mobile final briefing have reviewed evidence captures. |
| Art direction | A | Three original GPT Image 2 replay scenes extend the brass, tungsten, blueprint-blue, and sabotage-red vault identity. Optimized 144-184 KB WebP derivatives serve the UI while archival PNGs remain available. |
| Trust / proof | A | Replay proof links to inspectable deterministic matches, the browser gate uses real contract writes, and console, page, resource, accessibility, and mobile-overflow defects fail the suite. |
| Technical reliability | A+ | Wagmi 3.7.6 removes 426 net packages and all production audit findings. The build drops from about 22 seconds/5,386 modules to 6.6 seconds/1,856 modules, and all 14 active browser scenarios pass post-migration. |
| Accessibility / responsive | A | Serious/critical Axe checks cover marketing, lobby, active play, and the final briefing. The operator report is keyboard-scrollable, the network control is named, and the connected mobile header no longer clips. |
| Discovery / SEO | A- | Metadata, VideoGame schema, sitemap, comparison pages, and social imagery remain production-build verified. External search-performance evidence is not yet available. |
| Documentation / tracking | A | The implementation checklist, visual evidence, report card, and dependency register now match the shipped system and distinguish automated proof from human/live-network work. |

## Remaining A+ evidence

- Automate browser-created operations instead of beginning the join journey from a seeded lobby.
- Import at least four facilitated first-match playtests and act on comprehension or drop-off findings.
- Validate the full journey against deployed Sepolia with a fresh funded test wallet.
- Capture the dedicated animated resolution sequence at desktop and mobile widths.

## v0.5.0 - Created operations and live-read readiness

Date: 2026-08-13

Overall grade: **A** (automated product bar: **A+**)

| Area | Grade | Evidence and remaining gap |
|---|---:|---|
| First user journey | A+ | One continuous browser scenario now creates an operation from the homepage, adds a real second chain account, joins, starts, submits both players, resolves, breaches lock five, and reaches the final briefing. |
| Gameplay feedback | A+ | Resolution results are decoded from the confirmed transaction receipt, survive event-watcher timing gaps, remain visible until explicitly dismissed, and render cleanly at desktop and mobile widths. |
| Live configuration | A | The read-only gate proves the live proxy state, and a second repeatable gate matches the implementation runtime to the deployment-day source after normalizing compiler-declared UUPS immutables. Explorer publication and an approved funded write remain. |
| Technical reliability | A+ | The continuous create-to-victory and resolution gates sit inside a 16-scenario fresh-chain portfolio; the static server now returns correct WebP and font MIME types. |
| Documentation / tracking | A+ | README and launch records use the actual implementation slot, exact source revision, compiler settings, and repeatable runtime proof instead of stale deployment data. |

## Remaining strict A+ evidence

- Publish the reconciled source for `0x26ad...dd7f` on a public explorer.
- Import at least four facilitated first-match playtests and act on observed comprehension or drop-off failures.
- Perform a funded Sepolia write journey only after the recovered deployment is explicitly approved for new transactions.

## v0.6.0 - Public implementation verification

Date: 2026-08-13

Overall grade: **A** (automated product and provenance bar: **A+**)

| Area | Grade | Evidence and remaining gap |
|---|---:|---|
| Live configuration | A+ | Sourcify reports exact creation and runtime matches, while Blockscout and Routescan independently publish the complete source, contract name, compiler, EVM target, and optimizer settings. The repeatable provenance gate now fails if either bytecode or public explorer proof drifts. |
| Technical reliability | A+ | Live-read, runtime-provenance, source-publication, local-chain victory, accessibility, build, audit, and unit/integration gates cover the automated release surface without a funded chain write. |
| Trust / proof | A+ | Players and reviewers can inspect the implementation source publicly and reproduce the match from the checked-in artifact rather than relying on a repository claim. |
| Documentation / tracking | A+ | README, launch checklist, readiness audit, implementation checklist, and PR evidence now link the deployed address to exact public verification records. |

## Remaining strict A+ release evidence

- Import at least four facilitated first-match playtests and act on observed comprehension or drop-off failures.
- Run a funded Sepolia create-to-victory journey after the recovered deployment is explicitly approved for new transactions.

## v0.7.0 - Guarded funded-journey gate

Date: 2026-08-13

Overall grade: **A** (automated local, read-only live, and provenance bar: **A+**)

| Area | Grade | Evidence and remaining gap |
|---|---:|---|
| Live configuration | A | A read-only preflight now verifies both HSM players, balances, operator roles, pause state, external entropy, and the zero-game baseline. The write path is explicitly guarded, FREE-only, reserve-protected, receipt-checked, and round-bounded. It has not completed because GCP token refresh timed out before signing. |
| Operational safety | A+ | The gate cannot silently spend: writes require an exact environment opt-in, the operator retains at least 0.02 ETH, opponent funding is capped to a target, games must have zero entry fee, and evidence contains no private keys. Gcloud children are hidden, directly supervised, and time-bounded on Windows. |
| Technical reliability | A+ | A failed credential refresh exits before broadcast and leaves balances and `totalGames` unchanged. The default command is a repeatable read-only health check. |
| Documentation / tracking | A+ | The run command, safeguards, successful preflight, precise authentication blocker, and expected report location are recorded without treating an attempted write as completed evidence. |

## Remaining strict A+ release evidence

- Refresh non-interactive GCP CLI authentication and complete the guarded funded Sepolia journey.
- Import at least four facilitated first-match playtests and act on observed comprehension or drop-off failures.

## v0.8.0 - Funded live-chain and production UI proof

Date: 2026-08-13

Overall grade: **A+** for the automated product, provenance, and live-network bar

| Area | Grade | Evidence and remaining gap |
|---|---:|---|
| Live configuration | A+ | Guarded FREE operation `1` completed through victory in nine rounds using two HSM-backed players and external drand entropy. The final state and transaction receipts are retained without exposing keys. |
| Operational safety | A+ | Explicit write opt-in, FREE-only enforcement, opponent funding target, operator reserve, bounded rounds, receipt checks, configurable gas buffer, and resumable execution constrain both spend and recovery behavior. |
| Technical reliability | A+ | The live run exposed outcome-dependent gas estimation and repeated credential-refresh latency; buffered gas estimation, token caching, and idempotent resume handling closed both harness failures before the operation completed. |
| UI and accessibility | A+ | The production build rendered the real Sepolia winner state at desktop and mobile widths, with serious/critical Axe, overflow, console, page, and resource-error gates passing. |
| Trust and evidence | A+ | Public source verification, reproducible runtime provenance, onchain operation `1`, a receipt-backed JSON report, and final-state captures connect the marketing promise to an inspectable live result. |
| Human validation | A- | The automated release surface is complete. Four facilitated first-match sessions and CTA-comprehension observations are still required before claiming equivalent human-evidence coverage. |

## Remaining human evidence

- Import at least four facilitated first-match playtests and act on observed comprehension or drop-off failures.
- Validate homepage claims and primary CTA comprehension with first-time players.

## v0.9.0 - Fairness, instant play, and retention candidate

Date: 2026-08-15

Overall grade: **A+ candidate** for the local automated product bar; live Sepolia remains on the verified v0.8 implementation until an explicit upgrade.

| Area | Grade | Evidence and remaining gap |
|---|---:|---|
| Rules fairness | A | Simultaneous breaches use an entropy-backed tiebreak instead of player order, and consecutive-round stun locking is rejected with an explicit outcome. A separately versioned live tournament must validate the balance effect. |
| First session | A+ | `/play` starts a named four-operator match immediately, offers three pacing modes, teaches the loop in context, and requires no wallet. Browser interaction and serious/critical Axe checks pass. |
| Tactical clarity | A+ | Pick and Search odds, Sabotage impact, target protection, gadget status, resolution outcomes, and the first-operation checklist stay visible at decision time. |
| Strategic depth | A | Tactical play adds three one-use gadget identities without expanding the three-action contract surface. The gadgets remain an instant-play experiment rather than deployed onchain rules. |
| Continuation and retention | A | Instant rematch, challenge links, result sharing, XP, levels, streaks, named identity, spectating links, and opt-in background-tab alerts create a coherent next-session loop. Server-backed cross-device identity is not part of this pass. |
| Wallet friction | A candidate | The contract accepts revocable, expiring EIP-712 session actions and the optional relay verifies and submits them. The current Sepolia proxy does not expose this path until an approved upgrade and funded relay deployment. |
| Marketing proof | A+ | A 32-second, 1 MB trailer uses real lobby, match, resolution, and funded Sepolia finish captures plus existing Plundrix art. It contains no testimonials, invented stories, or analytics disclosure. |
| Technical reliability | A+ | 32 Solidity, 78 integration/simulator, 8 agent-service, 5 tournament-policy, production-build, zero-production-audit, and browser/accessibility gates pass. |

## Next stricter A+ bar

- Rehearse the UUPS upgrade locally, verify storage layout compatibility, and publish the new implementation source before enabling next-rule flags.
- Run a separately versioned balance batch against the cooldown and Leader Hunter candidate.
- Prove session authorization, silent signed action, relay receipt, revocation, expiry, and replay rejection in browser automation.
- Keep testimonials, player stories, and analytics results private or absent until genuine source material and explicit publication approval exist.

## v0.10.0 - Marketing-site conversion pass

Date: 2026-08-16

Overall grade: **A+ for the automated marketing-site bar**; human testimonials and analytics results remain deliberately absent.

| Area | Grade | Evidence and remaining gap |
|---|---:|---|
| First-viewport positioning | A+ | The hero now separates instant no-wallet play from live Sepolia multiplayer, states the five-lock and three-choice loop, and gives a concrete primary path against three labeled agents. |
| Gameplay proof | A+ | The 32-second real-capture trailer is visible directly after the hero, respects reduced-motion preferences, and links to a chapter guide. Replay stories and the funded Sepolia finish remain inspectable without invented player narratives. |
| Conversion path | A+ | Play, Trailer, and live-table paths are explicit in the hero, navigation, FAQ close, and operations section. Vague replayability statistics were replaced with concrete product facts. |
| Trust and objections | A+ | Wallet, onchain, cost, and bot questions receive direct answers. Free-beta limits, labeled agents, public source, and funded-operation proof are stated without testimonials or published analytics. |
| SEO and sharing | A | Canonical and social metadata, image alt metadata, manifest copy, VideoGame structured data, and stale-route cleanup are stronger. Internal operator tools were removed from the public sitemap and disallowed from crawling. Production deployment remains the final indexing check. |
| Accessibility and reliability | A+ | Reduced-motion behavior, keyboard-native disclosures, runtime-error gates, serious/critical Axe checks, responsive navigation, production build, valid SEO files, and all 19 active browser scenarios pass. Production dependency audit reports zero vulnerabilities. |

## Next stricter marketing bar

- Deploy the pass and verify production canonical, social-card, sitemap, robots, video-range, and explorer-link responses.
- Keep testimonials, quotes, stories, and analytics results absent unless genuine material and explicit publication approval become available.
- Treat first-time-player comprehension as private product research rather than a public marketing claim.

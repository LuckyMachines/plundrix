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
| Live configuration | A- | A repeatable read-only gate builds against the live Sepolia proxy, reads the real zero-game state, captures it, and reports no browser/runtime errors. Live writes are not current-release evidence because implementation provenance is unresolved. |
| Technical reliability | A+ | The continuous create-to-victory and resolution gates sit inside a 16-scenario fresh-chain portfolio; the static server now returns correct WebP and font MIME types. |
| Documentation / tracking | A | README and launch records now use the actual implementation slot and explicitly record the source-verification blocker instead of repeating stale deployment data. |

## Remaining strict A+ evidence

- Reconcile the March 12 implementation source with `0x26ad...dd7f` and verify it on the explorer; its executable bytecode does not match this checkout.
- Import at least four facilitated first-match playtests and act on observed comprehension or drop-off failures.
- Perform a funded Sepolia write journey only after the deployed implementation is verified and explicitly approved for new transactions.

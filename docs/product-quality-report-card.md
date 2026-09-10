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

## v0.11.0 - SEO and AI-search discovery pass

Date: 2026-08-16

Overall grade: **A+ for the automated discovery and sharing bar**; external indexing remains a post-deployment observation.

| Area | Grade | Evidence and remaining gap |
|---|---:|---|
| Static crawlability | A+ | Every public route receives clean route-specific HTML, a single canonical and robots directive, synchronized sitemap coverage, and internal-route exclusions. |
| AI-search readiness | A | Factual `llms.txt` and `llms-full.txt` references, explicit major AI-search crawler rules, and page-grounded schema make the product easier to retrieve and cite. Search-engine ingestion cannot be guaranteed before deployment. |
| Social sharing | A+ | Three original Azure GPT Image 2 scene masters give Home, Instant Play, and Trailer distinct 1200x630 cards; deterministic typography preserves exact copy. Route-specific Open Graph and Twitter metadata includes dimensions, MIME types, secure URLs, and descriptive alt text. |
| Structured data | A+ | `WebSite`, `Organization`, `VideoGame`, visible `FAQPage`, `WebPage`, and `VideoObject` graphs reflect content that is actually present, without stale or duplicate client-navigation schema. |
| Media delivery | A+ | The production server returns correct image and video types, immutable asset caching, MP4 byte ranges, clean-route HTML, and response-level noindex protection for internal and player-specific paths. |
| Trust and privacy | A+ | Discovery files distinguish source, deployed contract, verified implementation, and beta limitations without testimonials, invented stories, or analytics results. |
| Verification | A+ | The production build, dedicated HTTP/metadata SEO gate, zero-vulnerability production audit, 8 agent-service tests, and 21 active browser, wallet, accessibility, route, and graceful-degradation scenarios pass. Chain-backed browser tests are isolated from execution order. |

## Next stricter discovery bar

- Deploy and verify the canonical host's HTML, sitemap, robots, LLM references, cards, and trailer range responses.
- Run rich-result and social-card debuggers against production URLs after caches can reach the new assets.
- Submit the sitemap through already-owned webmaster consoles only when separately authorized; do not publish private analytics.

## v0.12.0 - Cross-domain player journey

Date: 2026-08-16

Overall grade: **A** for cross-domain information architecture

| Area | Grade | Evidence and remaining gap |
|---|---:|---|
| Domain roles | A | `plundrix.com` now owns positioning, rules, previews, and trust; `game.plundrix.com` owns choosing and entering a playable mode. The former marketing `/play` page no longer competes with the game. |
| First decision | A+ | The game opens with one explicit choice: instant no-wallet play or a live Sepolia table. The live operation browser and creation controls remain on the same page. |
| Conversion path | A | Marketing play links converge on the game player hub, while Instant Play remains a named secondary destination. Production click-through still needs post-deploy verification. |
| Copy voice | A | Player-facing pages describe choices, rivals, locks, and table pressure. Internal evidence language and disclaimers about invented claims were removed from the trailer journey. |
| Discovery / SEO | A | The retired marketing `/play` URL redirects permanently, is absent from the marketing sitemap, and AI references identify the player hub and Instant Play separately. |
| Technical reliability | A+ | Both production builds and audits pass, the SEO gate passes, player-hub accessibility and mobile navigation pass, and browser-wallet operation creation still passes from the new hub. |

Snapshot notes:

- Before this pass, both domains presented acquisition-style landing pages and the marketing site maintained a third, thin `/play` bridge.
- The game root is now an operational player hub rather than a second marketing homepage.
- Human first-click comprehension remains the only meaningful evidence gap.

## A bar, stricter

- A production visitor can move from any primary marketing CTA to the player hub without encountering another pitch page.
- The player hub makes Instant Play and live Sepolia mutually understandable within the first viewport.
- Automated checks continue to prove no-wallet play, live operation creation, accessibility, SEO, and both canonical domains.
- First-time-player observation confirms that people understand the two play modes without explanation.

## v0.13.0 - Domain specialization

Date: 2026-08-16

Overall grade: **A+ for automated cross-domain information architecture**

| Area | Grade | Evidence and remaining gap |
|---|---:|---|
| Marketing focus | A+ | `plundrix.com` is now a seven-section explanation of the fantasy, rules, product visuals, reasons to play, trust, and wallet questions. Eleven product-tour sections, including three simulated play surfaces, no longer compete with the game. |
| Player-hub focus | A+ | `game.plundrix.com` remains the only surface that asks visitors to choose Instant Play or live Sepolia, then exposes the real operation browser and creation controls. |
| Cross-domain conversion | A+ | Marketing uses one `Enter Player Hub` action and a direct trailer link. The network selector was removed from marketing so mode and network decisions happen where they can be acted on. |
| Content differentiation | A+ | Marketing explains why and how Plundrix works; the game domain starts play and hosts operational utilities. AI-readable references and structured data use the same split. |
| Responsive reliability | A+ | The marketing production build and zero-vulnerability audit pass. Desktop and mobile browser checks find seven major sections, no missing anchors, no horizontal overflow, and no marketing network toggle. |

## A bar, stricter

- First-time visitors can correctly describe the job of each domain after one visit.
- Search engines consistently treat `plundrix.com` as the canonical overview and `game.plundrix.com` as the playable application.
- Future marketing additions must provide acquisition, explanation, or trust value rather than recreate interactive game controls.

## v0.14.0 - Cross-domain visual expansion

Date: 2026-08-16

Overall grade: **A+ for automated visual identity and delivery**

| Area | Grade | Evidence and remaining gap |
|---|---:|---|
| Marketing art direction | A+ | Two dedicated Azure GPT Image 2 scenes now establish the vault chamber in the hero and a breached corridor at conversion, replacing the generic SVG atmosphere without pretending to be gameplay. |
| Game art direction | A+ | Instant Play depicts one operator facing three mechanical rivals; live play depicts four connected stations and five vault locks. Both remain subordinate to real controls and status. |
| Brand cohesion | A+ | Blackened steel, oxidized brass, warm vault light, restrained teal circuitry, and sabotage red now span marketing, Player Hub, Instant Play, replay art, and social cards. |
| Product truth | A+ | Real screenshots remain the marketing proof layer. Generated scenes are decorative, text-free, and never labeled as captures or player evidence. |
| Responsive and accessible delivery | A+ | Four 1.5-3.2 MB archival PNGs produce 120-194 KB WebP delivery assets. Six desktop/mobile browser states have no runtime errors, serious/critical Axe findings, or horizontal overflow. |
| Visual evidence | A+ | Original-resolution comparisons, relative depth maps, a perspective fit, clean guide, final captures, prompts, and an acceptance checklist are checked in. |

## A bar, stricter

- Observe first-time visitors to confirm that the two Player Hub scenes improve mode recognition without slowing the first click.
- Keep generated atmosphere visually distinct from literal gameplay proof in every future campaign and store listing.
- Extend the same material language only where a new surface has a distinct narrative job; avoid decorative asset proliferation.

## v0.15.0 - Full game and site experience pass

Date: 2026-09-06

Overall grade: **A-** (up from the audit baseline of **B-**)

| Area | Grade | Evidence and remaining gap |
|---|---:|---|
| First session and joy | A- | Instant Play now starts without wallet chrome, teaches the first decision in context, gives rivals readable personalities, stages the reveal with visual and optional audio feedback, and ends with rank and score-challenge continuation. Four observed first-time sessions remain the strict A evidence. |
| Gameplay and balance | A | Agent policy now respects sabotage protection, stops low-value zero-lock attacks, and changes strategy before stalls become dominant. The deterministic smoke grade improved from 81/B to 93/A; all four scenarios score 83 or higher. |
| Information architecture | A | Public navigation centers Hub, Play now, Trailer, Replays, and Results. Internal design, simulation, mutation, launch, and operations tools require development mode or an explicit production flag. Unknown routes show a useful 404 instead of silently rendering the shell. |
| Live-operation performance | A- | The homepage now requests one capped 24-game catalog instead of mounting the full 116-game history with per-card reads. Only live tables are expanded, six completed tables are optional, and completed cards stop polling. A production RUM comparison remains outstanding. |
| Replay experience | A- | Gallery artwork is correctly associated, filters use player language, technical import/export tools are collapsed, director tools are secondary, and invalid IDs no longer open an unrelated replay. A curated usability session is still needed to validate the ideal information density. |
| Accessibility and responsive UX | A | Modal focus trapping and restoration, Escape dismissal, 44px targets, pressed-state semantics, persistent readability/motion/sound controls, a non-autoplay trailer, mobile rival scrolling, and a sticky primary action address the observed barriers. The existing automated browser/accessibility portfolio remains the regression gate. |
| Trust, privacy, and data truth | A- | Unregistered identities are labeled Unverified rather than Human; unavailable event-derived statistics and estimated finish times are disclosed; analytics exclude addresses, seeds, names, and free text; privacy copy reflects collection. Historical completeness still depends on upstream event availability. |
| Marketing conversion | A | Primary CTAs now land directly in no-wallet play, live Sepolia is an explicit secondary choice, screenshot proof is expandable, the exact deployed contract is linked, legal scopes are named, and waitlist consent and anti-spam handling are clearer. Genuine testimonials remain deliberately absent. |
| Reliability and security | A | Both production builds pass, both production dependency audits report zero vulnerabilities, and agent, replay, fun, telemetry, cohesion, and SEO checks pass. The game server returns real 404/noindex responses and supplies CSP, HSTS, frame, MIME, referrer, and permissions headers. |
| Measurement and learning | B+ | Privacy-safe route, play, round, completion, share, wallet, and live-create events now exist. Production funnel baselines and four first-time-player observations are not yet available, so this area cannot honestly receive an A. |

### What changed from the B- audit

- The slowest and noisiest surface was redesigned around current playable tables instead of rendering every historical game.
- The no-wallet game now has stronger pacing, personality, feedback, mobile ergonomics, and a reason to replay or challenge someone.
- Player-facing surfaces no longer expose internal product-development tools or silently accept invalid URLs.
- Replay, session, identity, timestamp, and analytics language now distinguish verified facts from unavailable data.
- Marketing now converts directly into play and removes choices that looked functional but did not create value.

### Remaining evidence before a strict A

- Observe at least four first-time players and act on confusion, abandonment, or delight signals.
- Compare production catalog latency, first-action completion, match completion, and challenge-share rates after deployment.
- Verify production headers, canonical routes, social previews, and explorer links at the deployed domains.
- Complete legal review before any paid mode or prize language is enabled.

## v0.16.0 - Design-system remediation pass

Date: 2026-09-06

Overall grade: **A** for the implemented and automated product bar; human and post-deployment evidence remain open.

| Area | Grade | Evidence and remaining gap |
|---|---:|---|
| Core decision UX | A | Instant and live actions now precede supporting detail at small widths, the Instant commit control stays reachable above the safe area, and active local operations survive reload. |
| Responsive system | A | The former 511px Instant overflow and wide internal-tool page leaks are closed. Design-system previews respond to their own container width, and mobile live play exposes Pick inside the first viewport. |
| Accessibility and recovery | A | A skip link, global 44px control floor, 12px microcopy floor, reduced-motion resolution timing, focusable scroll regions, scoped replay shortcuts, and an application error boundary close the observed critical gaps. |
| Feedback and trust | A | Copy, save, share, import, wallet, session, profile, and ladder states now confirm outcomes or explain unavailable services. Practice-only rules are explicitly distinguished from the current live contract. |
| Design governance | A | The 14-section system now stores reviewer, version, status, priority, section notes, and global notes; reviews can be filtered, imported, exported, or reset. The index is compact at desktop widths. |
| Language coherence | A | Player-facing terminology consistently uses operation for a match, player for participation, and operator only for an identity or persona. Action controls lead with Pick, Search, and Sabotage. |
| Frontend delivery | A | Wallet and query providers load only on routes that need them, no-wallet pages no longer preload the former 323 KB web3 vendor bundle, and production source maps are omitted. |
| Automated verification | A | The final production build and SEO delivery check pass; Playwright reports 30 passed with only the opt-in visual-evidence capture skipped. The game, agent, Solidity, replay, fun, telemetry, design, and cohesion suites also pass. |
| Human evidence | B+ | The product is materially easier to test and annotate, but four observed first-time sessions and production funnel baselines are still required for a strict evidence-complete A+. |

### Remaining evidence before A+

- Observe at least four first-time players through setup, first action, resolution, and replay/rematch.
- Validate deployed route performance and the play/share funnels using privacy-safe aggregate analytics.
- Complete legal review before enabling paid play or prizes.

## v0.17.0 - Modular art pipeline

Date: 2026-09-06

Overall grade: **A for the production system and current asset truth; human response evidence remains open.**

| Area | Grade | Evidence and remaining gap |
|---|---:|---|
| Art direction | A | One executable contract now governs product truths, palette, materials, lighting, shape language, constraints, and six joy principles. |
| Modularity | A | Asset recipes compose five family grammars with reusable vault, table, action, accent, and outcome parts instead of copying monolithic prompts. |
| Production reliability | A | One command path compiles prompts, builds responsive derivatives and social typography, validates dimensions and byte budgets, and records SHA-256 provenance. |
| Delivery hygiene | A | Six multi-megabyte scene masters moved out of `public/`; only optimized WebP/JPEG derivatives enter production. |
| Reviewability | A | The Design System exposes accepted, revision-needed, and reusable-part counts, family rules, joy targets, source paths, and the accepted part kit. |
| Current art accuracy | A | All thirteen assets are accepted. The new Instant Play master combines a text-free four-station scene with exactly five deterministic lock-module instances; four reusable FLUX.2-pro parts retain real alpha and source provenance. |

### Next art evidence

- Test the four accepted transparent parts in future action-state compositions and animation passes.
- Observe thumbnail recognition and emotional response with first-time players before expanding the asset family.

## v0.18.0 - Signature workshop and inventory depth

Date: 2026-09-06

Overall grade: **A for the implemented workshop system; competitive balance evidence remains open.**

| Area | Grade | Evidence and remaining gap |
|---|---:|---|
| Catalog truth | A+ | The product now says exactly what exists: 10 gameplay-distinct gadgets and 1,200 stable finish/calibration configurations. Unsupported power statistics are gone, while every existing ID and serial remains stable. |
| Gameplay identity | A | All 10 chassis have deterministic, conditional effects in both the local engine and smart contracts. Their numerical strengths still need observed competitive-play balance evidence. |
| Visual modularity | A | One accepted chassis master combines with 10 material treatments, 12 calibration glyphs, and rarity details at runtime. This creates visible identity without manufacturing 1,200 near-duplicate raster files. |
| Workshop UX | A+ | A chassis-first browser, live builder, explicit gameplay/appearance split, 30 authored builds, favorites, comparison, lookup, recipe deficits, and grouped collection progress replace the repetitive card wall. |
| Economy and reversibility | A | Players see missing materials before assembly and can reclaim non-starter blueprints for half of each recipe, rounded up. Economy tuning remains a live balance task. |
| Contract integrity | A | Ownership, starters, IDs, and storage compatibility are preserved; 52 Solidity tests and connected browser deployment pass. Moving roster orchestration into the Workshop and using a size-oriented optimizer profile leave 666 bytes of EIP-170 runtime headroom. |
| Accessibility and responsive quality | A | Serious/critical Axe checks pass, controls retain accessible names and targets, and explicit body-width assertions pass at desktop and mobile sizes. |
| Reviewability | A+ | The living Design System, compact 1,200-cell configuration atlas, six current-state captures, and a before/after comparison make the whole inventory inspectable without repetition. |

### Stricter A+ bar

- Observe competitive sessions across all 10 signatures and tune strengths from real pick, win, and consumption rates.
- Preserve at least 500 bytes of production game-contract runtime headroom as future rules evolve.
- Validate authored-build recognition, crafting comprehension, and reclaim confidence with first-time players.

## v0.19.0 - Mischievous retention loop

Date: 2026-09-06

Overall grade: **A for the implemented and automated retention loop; real-player and durable public-season evidence remain open.**

| Area | Grade | Evidence and remaining gap |
|---|---:|---|
| Repeatable game loop | A+ | Vault Run carries one equipped gadget through three escalating vaults with two lives, route choices, stage scoring, carried tools, run persistence, and a distinct final briefing. |
| Decisions and mischief | A | Three route bargains and three round gambits expose exact costs and payoffs across odds, tools, locks, heat, score, and salvage. Observed balance data is still required before tuning can be called final. |
| Signature feedback | A | All ten chassis now emit explicit activation events with distinct imagery, copy, color, motion, audio, haptics, and reduced-motion behavior. |
| Rival continuity | A | Rook, Mara, and Vesper persist encounters, wins, losses, sabotage, theft, grudges, and deterministic contextual taunts across local operations. Human response to the personalities remains unmeasured. |
| Workshop progression | A | Chassis mastery adds XP, four titles, a visible maker mark, progress, activations, wins, and run counts without altering hidden match odds. |
| Weekly competition | A- | The ISO-week seed, modifiers, share URL, validated score endpoint, rate limit, sorted board, and local fallback work. The service-backed beta board is process-memory durable and self-reported, not yet database-backed or cryptographically verified. |
| Evidence and telemetry | A | Privacy-safe aggregate gadget/run telemetry and a local anonymous first-run observation recorder are implemented. No participant outcomes are invented; real observations remain at zero until sessions occur. |
| Technical reliability | A+ | 92 JavaScript integration tests, 12 agent-service tests, 52 Solidity tests, 5 tournament tests, the production build, SEO/cohesion gates, and 35 active browser journeys pass. Five visual captures and a side-by-side reference comparison were inspected. |

### Stricter A+ bar

- Observe at least four first-time players through setup, first action, gadget recognition, result comprehension, and replay intent using the new recorder.
- Gather enough privacy-safe samples to evaluate all ten gadget activation and win rates plus every bargain's selection and outcome rate.
- Replace the session-memory weekly board with durable storage and signed or server-replayed score verification before presenting it as a competitive season.

## v0.20.0 - Sepolia game and workshop deployment

Date: 2026-09-06

Overall grade: **A for deployment integrity; public source publication and a post-upgrade live match remain open evidence.**

| Area | Grade | Evidence and remaining gap |
|---|---:|---|
| Game upgrade | A+ | The KMS-authorized UUPS upgrade succeeded and the EIP-1967 implementation slot independently resolves to `0x238345d04cb4b6f2d46ba0218d32b6a086be1963`. |
| Workshop deployment | A+ | A dedicated implementation and ERC-1967 proxy were deployed, initialized, and linked to the game. Both contracts independently return the other proxy address. |
| Catalog truth | A+ | Live reads return 1,200 blueprints and 10 gameplay chassis, matching the tested product catalog. |
| State preservation | A+ | The game remains unpaused with automation enabled, a 300-second delay, external entropy required, and the existing 200 bps Sepolia-only fee configuration unchanged. |
| Operational control | A+ | The HSM-backed KMS signer retains the game and workshop upgrader roles; all five deployment receipts succeeded. |
| Public provenance | B+ | Addresses, transactions, proxy slots, code sizes, role reads, and configuration are recorded. Public source publication for the two new implementations is pending because no explorer API credential is configured in this environment. |

### Remaining deployment evidence

- Publish both new implementation sources through Sourcify or a supported explorer verifier.
- Run one guarded FREE operation through the upgraded proxy with an equipped workshop gadget.
- Set `VITE_WORKSHOP_ADDRESS` in each deployed frontend environment before enabling connected workshop actions.

## v0.21.0 - Whole-loop consequence and comeback pass

Date: 2026-09-07

Overall grade: **A- for the implemented loop ecosystem; durable season storage, deployed next-rules configuration, and observed human evidence remain open.**

| Area | Grade | Evidence and remaining gap |
|---|---:|---|
| Core table balance | A | A 10,000-game fresh-table run completed every game with 24.6%-25.4% seat win rates, 9.20 average rounds, and 2.1% runaways. Visible table pressure adds +6 Pick points per lock behind and creates a two-lock breach for deep or late-table trailers. |
| Comeback counterplay | A | The 10,000-game asymmetric lab moved the starting leader from the 69% baseline to 42.6%; two trailing seats reached 36.9% and 18.6%, and runaways fell from 40% to 18.2%. The intentionally extreme zero-lock seat remains a low-probability recovery at 1.9%. |
| Match consequence | A+ | Every completed Instant operation now saves its exact action transcript, links directly to replay, awards action-directed salvage, advances identity and rivalry state, and offers rematch, Career, Replay, and Workshop continuations. |
| Career and economy | A | `/career` unifies local identity, rank, win rate, rivals, runs, collection, mastery, replays, and four next objectives. Fresh inventory is reduced from near-catalog abundance to a deliberate starter allowance while all 1,200 configurations remain previewable. |
| Vault Run variety | A+ | Six persistent contraband choices, three explicit Heat states, route consequences, bounded round-two vendettas, revenge score objectives, run history, and personal bests make stages mechanically cumulative. |
| Weekly integrity | A- | Six rotating modifiers and exact deterministic replay proofs replace trusted score claims. The service rebuilds every stage and verifies identity, rules, loadouts, routes, contraband progression, outcomes, rounds, and score. Storage remains process-memory beta until a production database binding exists. |
| Live beta honesty | A- | One capability rail reports core contract, Workshop, paced-rule, table-pressure, and one-confirmation relay readiness from runtime configuration. Lobby invitations and waiting guidance close the social handoff. The current public environment must still configure the Workshop, pressure rules, and session relay before those capabilities can say ready. |
| Technical reliability | A | 12 agent-service tests, 54 Solidity tests, 98 JavaScript tests, 5 tournament tests, production build, SEO checks, exact-replay tests, inventory tests, and 37 active Chromium journeys pass. Production game runtime is 24,194 bytes, leaving 382 bytes below EIP-170. |

### Remaining A+ evidence

- Bind the weekly board to durable production storage and retain the exact-replay verifier at the write boundary.
- Deploy and verify the next-rules game implementation on Sepolia, configure the Workshop address in the frontend, and enable the session relay only after a funded end-to-end rehearsal.
- Observe first-time and returning players through the new Career, contraband, pressure, and reward explanations before making another balance change.

## v0.22.0 - Solo continuous-improvement loop

Date: 2026-09-07

Overall grade: **A for process design; F for real evidence coverage until the first current sessions and production baseline are recorded.**

| Area | Grade | Evidence and remaining gap |
|---|---:|---|
| Solo sustainability | A | One active-experiment limit, a 30-minute weekly review, one generated briefing, and one next action replace parallel backlogs and dashboard maintenance. |
| Evidence integrity | A | T0 opinion, T1 simulation, T2 automated proof, T3 observed-human evidence, and T4 production behavior are explicit. T3 and T4 are rejected without affirmative provenance. |
| Decision memory | A | One versioned ledger connects hypotheses, metrics, guardrails, evidence, build/ruleset attribution, and ship/iterate/revert/stop decisions. |
| Player measurement | B | Nine activation, comprehension, retention, reliability, and release metrics now have targets and minimum samples. Current evidence coverage is deliberately 0/9 rather than inferred from simulations. |
| Behavioral instrumentation | A- | Product events carry schema, release, ruleset, experiment, variant, cohort, and bounded latency context without sending identity, wallet, seed, or free text. A real production baseline remains uncollected. |
| Human observation | A- | The recorder now captures result comprehension, observed joy, returning-player status, timestamps, and explicit facilitator confirmation. Four current first-time sessions remain the next required action. |
| Automated enforcement | A | Ledger validation, evidence rules, stale-review detection, WIP enforcement, product verification, release verification, tests, and a pull-request workflow are wired into repeatable commands. |

### Stricter A+ bar

- Complete four confirmed first-time observations and decide the active comprehension experiment.
- Import at least 30 production Instant starts/completions and 50 anonymous return samples.
- Demonstrate one full ledger cycle ending in a recorded ship, iterate, revert, or stop decision.
- Review the metric set after four weeks and remove any measure that did not change a decision.

## v0.23.0 - Solo UI evidence loop

Date: 2026-09-08

Overall grade: **A for automated UI governance; observed usability remains ungraded until current player sessions exist.**

| Area | Grade | Evidence and remaining gap |
|---|---:|---|
| Canonical coverage | A | Twelve bounded player-facing states cover setup, active decisions, resolution, final briefing, Vault Run, Workshop, Career, replay, and local-chain lobby/play at desktop and mobile widths. |
| Visual regression | A | Twenty-four deterministic Playwright references use a strict 0.2% default diff limit, controlled rendering, explicit masks, and reason-gated approval history. |
| Reviewability | A+ | One command creates approved-left/current-right comparisons, an original-resolution contact sheet, HTML, Markdown, JSON, and per-render diagnostic evidence. |
| Accessibility and geometry | A | Every canonical render passes serious/critical Axe checks, page overflow, visible-image loading, and focused action/player-container clipping checks. |
| Responsive live play | A | Action controls and opponent summaries now respond to their actual container width; the desktop clipping found by the first review pass is fixed and regression-tested. |
| Design-system maintainability | A- | Canonical color, typography, spacing, radius, and motion tokens now have one module and a governance test. The remaining large stylesheet should be split only when a real feature touches a coherent component family. |
| Solo governance | A | The matrix is capped at 12 surfaces, links to the one-active-experiment ledger, supports targeted runs, and has a path-filtered Windows CI gate with retained evidence artifacts. |
| Observed usability | N/A | Rendering evidence cannot establish comprehension, joy, or return intent. Four newcomer sessions and two returning-player sessions remain intentionally open. |

### Stricter A+ bar

- Complete four confirmed newcomer observations across setup, first action, resolution, and continuation.
- Complete two returning-player observations after seven days.
- Use those findings to make and record one ship, iterate, revert, or stop decision for the active experiment.
- Retire any canonical surface or metric that has not changed a decision after four review cycles.

## v0.24.0 - Decision-first game interface

Date: 2026-09-08

Overall grade: **A for the implemented interface and automated evidence; human usability and joy remain ungraded.**

| Area | Grade | Evidence and remaining gap |
|---|---:|---|
| Mobile decision hierarchy | A | Instant and Vault Run compress status, rivals, and action choices so the current decision and commitment control appear in the first mobile viewport. |
| Outcome comprehension | A | A causal resolution surface now names the result, actor, action, and consequence before presenting the next decision; final briefing no longer competes with stale round chrome. |
| Connected play | A | Lobby readiness is written as a short launch sequence, with visible wallet actions both before joining and when a disconnected player reaches an action. |
| Content priority | A | Career leads with objectives, Replays leads with visual stories, and route choices use distinct imagery plus an explicit mobile comparison cue. |
| Continuation design | A | The final briefing establishes one primary rematch, one secondary replay, and a compact overflow for lower-priority destinations. |
| Visual character | A- | Brighter, more distinct art treatment and tighter copy improve recognition and energy. Emotional response still requires observed players. |
| Regression reliability | A+ | All 24 canonical desktop/mobile renders pass visual, Axe, overflow, image, and clipping gates. The full release suite passes 11/11 with zero failed or flaky checks. |
| Observed usability | N/A | No comprehension, joy, or return claims are inferred from automated evidence. Four newcomers and two seven-day return sessions remain open. |

### Stricter A+ bar

- Observe four newcomers through setup, first action, resolution, and continuation.
- Observe two players returning after seven days.
- Establish production play, completion, replay, and error baselines with privacy-safe aggregate telemetry.
- Use those findings to record a ship, iterate, revert, or stop decision for the active experiment.

## v0.25.0 - Semantic layout and typography

Date: 2026-09-08

Overall grade: **A for the maintainable layout/type system and automated evidence; observed readability remains open.**

| Area | Grade | Evidence and remaining gap |
|---|---:|---|
| Typography foundation | A | Seven semantic roles now govern family, size, weight, leading, tracking, casing, and measure. Barlow provides readable prose while the established condensed display and mono interface voices remain distinct. |
| Layout composition | A | Page, stack, cluster, auto-grid, rail, and decision primitives centralize recurring composition without introducing another UI framework. |
| Responsive resilience | A | Container-aware decision layouts and a dedicated 320/390-readable/768/1440 stress matrix cover long labels, dense values, narrow cards, and overflow behavior. |
| Source consistency | A+ | A repository check rejects arbitrary pixel type sizes, arbitrary tracking or leading, un-tokenized CSS tracking, and type below the 12px floor. The migration leaves zero source violations. |
| Runtime verification | A+ | Font loading, contracted-text overflow, prose measure, accessibility, page overflow, image loading, and component clipping are exercised alongside visual screenshots. |
| Solo operability | A | The existing design-system route and review command gained these capabilities; no parallel SaaS, catalog, or review workflow was added. |
| Visual evidence | A | 24/24 canonical journey renders and 4/4 type/layout stress renders pass after original-resolution inspection and reasoned approval. |
| Observed readability | N/A | Automated evidence cannot prove scanning speed or comprehension. Four newcomer sessions and two returning-player sessions remain open. |

### Stricter A+ bar

- Confirm that four newcomers identify the primary action and explain the outcome without facilitation.
- Validate readable mode with at least one player who regularly uses enlarged text.
- Check two returning players after seven days for navigation and terminology recall.
- Remove or merge any semantic role or primitive that does not reduce real maintenance work after four review cycles.

## v0.26.0 - Authored caper interface system

Date: 2026-09-08

Overall grade: **A for implemented art direction and automated production evidence; human joy and comprehension remain ungraded.**

| Area | Grade | Evidence and remaining gap |
|---|---:|---|
| Art-direction coherence | A | The approved synthesis is translated into a blueprint work surface, information plane, control plane, and dramatic overlay. The result preserves the central vault, mid-plane dossiers, near action cards, and restrained paper/brass language without becoming a fixed raster skin. |
| Gameplay truth | A+ | Pick, Search, Sabotage, simultaneous reveal, probabilities, locks, tools, targets, and real continuation actions remain authoritative. Generated concept labels that implied nonexistent rules were excluded. |
| Interaction states | A | Whole action plates expose stable ready, hover, focus, pressed, selected, committed, disabled, and unavailable behavior. Text tabs, tool silhouettes, geometry, and patterns supplement color. |
| Responsive hierarchy | A | Desktop keeps vault, rivals, three actions, and commit in one viewport. Mobile keeps the vault and rival carousel near the top, exposes supporting intel in a dismissible drawer, and pins selected action, commit, and auto-play in the thumb zone. |
| Design-system maintainability | A+ | Three reusable gameplay components, four surface tokens, shared live-game layers, and a 16-section living design system make the direction inspectable and extensible by one maintainer. No new production raster skin was added. |
| Accessibility and resilience | A | Grayscale and protanopia/deuteranopia/tritanopia evidence preserves meaning; keyboard drawer dismissal, reduced motion, 12px minimum type, visible focus, target sizing, overflow, image, clipping, and serious/critical Axe checks pass. |
| Visual evidence | A+ | Original-resolution reference/product comparison, relative-depth maps, color-vision contact sheet, written acceptance checklist, and reasoned visual approvals make the implementation auditable. All 28 canonical and type/layout renders pass. |
| Release reliability | A+ | The complete improvement release reports 11/11 checks passing with zero failures and zero flakes, including contracts, agent, integration, tournament, production build, and browser journeys. |
| Observed delight | N/A | The visual and technical system is ready to test, but no claim about joy, comprehension, or return intent is inferred without observed players. |

### Stricter A+ bar

- Observe four newcomers identify the primary action and explain the result without facilitation.
- Include at least one player who regularly uses enlarged text.
- Record whether action identity, rival recognition, delight, and desire for another run improve.
- Use those observations to make one documented ship, iterate, revert, or stop decision.

## v0.27.0 - Full improvement harness audit

Date: 2026-09-08

Overall grade: **A for local product and improvement-system reliability; Sepolia provenance and real-player evidence remain explicit blockers to a broader release claim.**

| Area | Grade | Evidence and remaining gap |
|---|---:|---|
| Harness reliability | A+ | All 15 focused system suites passed. The canonical release harness passed 11/11 checks, including production build, contract/agent/integration/tournament tests, and browser journeys. |
| UI and responsive coverage | A+ | The complete visual review passed 28/28 desktop, mobile, narrow, readable, tablet, and desktop-stress cases. The Sepolia read-only verifier is now self-contained and passed against the live testnet feed. |
| Art and inventory systems | A+ | The art manifest validates 34 accepted assets with zero revisions queued, and the inventory generator verifies 1,200 unique blueprints across 10 chassis, 10 finishes, 12 calibrations, and 6 materials. |
| Game feel and replay | A | The fun harness scored 94/100 (A), and the directed replay scored 100 with five lead changes. Automated evidence is strong; observed delight remains unmeasured. |
| Archetype balance | B+ | A 64-game balanced-cast run found 84/100 fairness with every archetype passing and no detected risks. The focused 256-game Tool Hoarder matrix scored 81/100 with no blockers. Leader Hunter and Reckless Picker still produce weaker fun/story scores than Tool Hoarder. |
| Rule exploration | B+ | The normal-budget beam search found a promising 90.83 candidate, but it changes four rule constants and remains simulation-only. The stricter promotion matrix remains HOLD, and the comeback mutation remains REJECT. No candidate was silently applied. |
| Improvement governance | A+ | Design Control Tower reports 95/100 (A+) with 19 recorded decisions. Launch Copilot is GO for internal playtest at 93/100 after its default ghost sample was raised from 3 to 16 games to avoid unstable false blockers. |
| Sepolia operations | B | Read-only product verification and funded preflight pass. The testnet has 116 games, all required operator roles, sufficient balances, automation enabled, and external entropy required. Current compiled runtime is 24,194 bytes while the then-deployed runtime is 23,910 bytes, so provenance correctly fails until the intended implementation is redeployed. |
| Live and human evidence | F | The evidence ledger has only 1/9 qualified metrics. Live Ops is orange at 61/100 because current newcomer observations, production funnel/error baselines, durable live data, and broader release confirmations are absent. |

### Stricter A bar

- Run four observed newcomer sessions and record first-action, goal, result, delight, and replay-intent evidence.
- Collect the minimum production beta samples for completion, errors, and return behavior before making retention claims.
- Resolve the Sepolia source/deployment mismatch and rerun the provenance guard before calling the deployed contract current.
- Keep the 90.83 balance candidate in simulation until it passes the promotion matrix and an observed playtest; keep the rejected comeback mutation out of deployed rules.
- Complete mainnet configuration, operator, rollback, deployment, and rehearsal confirmations only when a mainnet launch is intentionally scheduled.

## v0.28.0 - Verified Sepolia table-pressure upgrade

Date: 2026-09-08

Overall grade: **A+ for Sepolia deployment integrity and automated proof; observed human outcomes remain the next evidence frontier.**

| Area | Grade | Evidence and remaining gap |
|---|---:|---|
| Upgrade safety | A+ | A guarded KMS flow checked chain ID, proxy code, EIP-1967 slot, UUPS UUID, upgrader role, code-size ceiling, gas reserve, transaction simulation, receipt status, post-upgrade slot, and preserved state. Production upgrades now require a separate explicit opt-in. |
| Source provenance | A+ | Commit `7147d03` anchors the contract and deployment tooling. Sourcify reports an exact match for implementation `0x50a562176eef29aa45722edabaebfe27bcc906c5`; Blockscout and Routescan both publish the verified source. |
| State preservation | A+ | Total games, pause state, automation settings, external-entropy requirement, workshop linkage, and fee configuration remained identical across the proxy upgrade. The prior implementation is recorded as the rollback target. |
| Live behavior | A+ | Guarded FREE operation `117` completed in eight rounds with two HSM-backed players and external entropy. The trailing player moved from 0 to 2 locks on round 8, directly exercising the deployed table-pressure breach. |
| Player-facing read path | A+ | The production build and self-contained Sepolia browser check passed after the upgrade and operation. The proxy address remained unchanged, so deployed clients require no contract-address migration. |
| Runtime headroom | B+ | The implementation is valid at 24,194 bytes but has only 382 bytes of EIP-170 margin. Future onchain features should move to the workshop, a new module, or a deliberate size-reduction pass. |
| Human evidence | F | Automated deployment proof cannot establish whether table pressure feels fair, legible, or delightful. Four observed newcomer sessions and current production telemetry remain required. |

### Stricter A+ bar

- Observe four newcomers and record whether the two-lock pressure breach is noticed and understood.
- Collect production completion, error, replay-intent, and return baselines with the existing privacy-safe telemetry.
- Keep the previous implementation address and upgrade transaction evidence available for rollback.
- Require a size-reduction plan before adding more logic to the game implementation.

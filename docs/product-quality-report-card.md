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

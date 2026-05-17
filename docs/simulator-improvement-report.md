# Plundrix Simulator Improvement Report

Date: 2026-05-14

## Scope

Surface reviewed: gameplay simulator, tuning workflow, repeatable outcome analysis, and contract-parity confidence.

## Snapshot 1

Current grade before this pass: C+

Evidence:
- Simulator could resolve manual and strategy rounds with contract-like defaults.
- It did not yet support named scenarios, ruleset comparison, designer scorecards, exports, replay links, round playback, or structured balance warnings.
- CLI could run batches, but it did not expose the full tuning workflow.

A bar, stricter:
- A designer can open one screen, select a scenario, tune strategy/rules knobs, run single or batch simulations, compare against contract defaults, export evidence, replay seeds, and see warnings tied to specific balance risks.
- CLI can reproduce the same runs in scripts or CI.
- Contract-default parity is visible whenever rules are edited.

## Implemented Checklist

- [x] Add preset scenarios.
- [x] Add balance scorecards.
- [x] Track action value.
- [x] Add per-strategy win-rate batch runs.
- [x] Add round length targets.
- [x] Add fun curve metrics.
- [x] Add comeback detection.
- [x] Add runaway detection.
- [x] Add sabotage usefulness metrics.
- [x] Add tool economy metrics.
- [x] Add first-player advantage detection.
- [x] Add seed replay links.
- [x] Add JSON and CSV exports.
- [x] Add strategy editor sliders.
- [x] Add human-vs-bots scenario.
- [x] Add round playback controls.
- [x] Add automatic balance warnings.
- [x] Add probability previews.
- [x] Add what-if comparison.
- [x] Add batch comparison between rulesets.
- [x] Add editable rules knobs.
- [x] Add contract parity checks.
- [x] Add scenario snapshot state.
- [x] Add action recommendation overlay.
- [x] Add designer dashboard output.

## Snapshot 2

Current grade after this pass: A-

Evidence:
- `app/src/lib/plundrixEngine.js` now owns scenarios, rulesets, strategy profiles, recommendations, what-if runs, batch analytics, replay config, exports, comparison reports, and contract parity checks.
- `app/src/pages/SimulatorPage.jsx` exposes those systems in the browser tuning lab.
- `app/scripts/simulate-game.mjs` can run single games, batches, CSV/JSON exports, scenarios, profiles, tuned rules, and baseline-vs-candidate comparisons.

Remaining A gaps:
- Add automated unit tests that assert simulator parity against known Solidity resolution examples.
- Add Playwright screenshots for simulator states once visual regression coverage is expanded.
- Add saved named experiment files if designers start using the lab heavily.

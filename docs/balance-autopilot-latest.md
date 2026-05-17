# Balance Autopilot Latest Snapshot

Date: 2026-05-14

Status: implemented and smoke-tested.

Current capabilities:
- Shared autopilot module for CLI, worker, and browser UI.
- Random, hill, beam, and grid search modes.
- Smoke, fast, normal, and deep budgets.
- Multi-scenario weighted scoring with seat rotation.
- Objective presets for default balance, faster games, comeback, low sabotage waste, minimal changes, and high tension.
- Candidate rerank and validation passes.
- Candidate deduplication, IDs, readiness labels, implementation cost, risk explanations, Solidity patch suggestions, clustering, Pareto frontier, and minimal viable patch selection.
- Seed discovery for exciting and broken seeds.
- Browser worker integration with progress, cancellation, saved experiments, import/export, notes, pins, replay links, and apply-to-lab.
- CLI JSON, CSV, Markdown, report file, and seed discovery outputs.

Verification targets:
- `npm run test:autopilot`
- `npm run simulate:auto-balance -- --budget smoke --quiet`
- `npm run build`

Deployment note:
Simulator tuning does not alter the deployed contract. Any hard tuning candidate must be promoted through contract upgrade or redeploy review.

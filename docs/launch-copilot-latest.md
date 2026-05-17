# Plundrix Launch Copilot

Generated: 2026-05-17

Launch Copilot is the gate-by-gate release command center for Plundrix. It combines simulator proof, balance proof, replay proof, Oracle health, docs, CI, route health, environment readiness, decision logs, and rollback planning into one repeatable launch packet.

## Default Command

```bash
npm run launch:copilot -- --target internal-playtest --markdown
```

## Full Local Candidate Check

```bash
npm run launch:copilot -- --target launch-candidate --server-url http://localhost:5173 --markdown
```

## Verification

```bash
npm run test:launch
npm run launch:copilot -- --target internal-playtest --markdown
```

Latest internal-playtest result:

- Decision: go.
- Score: 93/100.
- Blockers: 0.
- Warnings: 0.
- Unknowns: 0.
- Embedded Design Control Tower proof: 95/100 with 0 human validation gaps and 0 launch proof gaps.
- Design grade source: `npm run design:tower -- --snapshot --markdown --seed seventh-pass-a-plus-launch-aligned`.

## Outputs

- Markdown launch packet
- JSON packet
- Full JSON plan
- CSV check table
- Markdown risk register
- rollback packet
- Oracle bridge status
- local dashboard decision log

## Resource Profile

The default path is deliberately light. Heavier simulator sampling, production builds, route checks, media capture, and command execution are opt-in.

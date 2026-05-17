# Live Ops Oracle Latest Snapshot

Date: 2026-05-14

Status: implemented and smoke-test ready.

Current capabilities:
- Shared Oracle module that orchestrates simulator, Balance Autopilot, Replay Director, docs, release readiness, operations, and live-data stubs.
- Lightweight default generation with explicit heavy mode.
- Source freshness, checklist parsing, release readiness scoring, docs status, operations status, marketing proof status, and live data readiness.
- Ranked recommendations with impact, effort, confidence, urgency, owners, commands, files, due dates, and evidence.
- Risk and opportunity detection.
- Action plan lanes: now, next, later.
- Daily brief, JSON, recommendation CSV, release notes, and marketing bundle exports.
- CLI: `npm run ops:oracle`.
- Browser dashboard: `/ops`.
- Local snapshots, trend stub, operator notes, and decision log.

Verification targets:
- `npm run test:oracle`
- `npm run ops:oracle -- --markdown`
- `npm run build`

Resource note:
Oracle defaults are intentionally small. Use `--heavy` only when you want deeper local analysis.

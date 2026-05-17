# Replay Director Latest Snapshot

Date: 2026-05-14

Status: implemented and smoke-test ready.

Current capabilities:
- Shared replay module for simulator, CLI, gallery, and capture scripts.
- Replay generation from seed, simulation state, batch result, and Autopilot report.
- Timeline conversion with before/after snapshots.
- Highlight detection, dramatic scoring, beat extraction, titles, subtitles, and summaries.
- Share URL encoding and parsing.
- Replay viewer with keyboard controls, playback, cinematic mode, analysis mode, and exports.
- Replay gallery with filters, save-to-library, import/export library JSON, and marketing proof metadata.
- Paired baseline/tuned replay comparison.
- JSON, Markdown, CSV, gallery, and capture-plan exports.
- Capture script with desktop, mobile, social-square, and social-vertical presets.
- Replay Director score added to Autopilot reports.

Verification targets:
- `npm run test:replay`
- `npm run replay:direct -- --seed replay-smoke --scenario comeback-test`
- `npm run build`

Resource note:
Deep replay capture and media generation are intentionally separate from smoke checks. Use small batches locally and run capture only when a local Vite server is already available.

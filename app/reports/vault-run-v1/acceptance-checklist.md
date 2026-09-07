# Vault Run v1 Acceptance Checklist

Date: 2026-09-06

## Player experience

- [x] Present one clear setup promise, two start modes, the equipped gadget, and all three vaults.
- [x] Make every pre-stage route reveal its exact upside and cost before commitment.
- [x] Keep lives, heat, score, progress, rivals, action odds, and the commit action visible during play.
- [x] Offer safe play plus explicit push-your-luck gambits for Pick and Search.
- [x] Persist an active run locally and produce a distinct completed or failed final briefing.
- [x] Carry salvage, mastery, rival history, and privacy-safe aggregate balance data into the wider product loop.

## Weekly and service integrity

- [x] Derive one deterministic challenge from the ISO week.
- [x] Validate alias, run ID, score, rounds, current challenge, completion state, and duplicate submissions.
- [x] Label the beta leaderboard as self-reported and service-session durable.
- [x] Fall back to a device-local board when the agent service is unavailable.

## Responsive and accessible quality

- [x] Pass serious and critical Axe checks on the active run.
- [x] Keep the active run free of horizontal page overflow at 390px.
- [x] Use native buttons, visible pressed states, minimum touch targets, live status messaging, reduced-motion handling, and optional audio.

## Visual evidence

- [x] Capture setup, route, active desktop, and active mobile states.
- [x] Compare the setup against the accepted Instant Play reference.
- [x] Inspect current captures at readable resolution.

Evidence:

- `actual/setup-desktop.png`
- `actual/route-desktop.png`
- `actual/active-desktop.png`
- `actual/signature-desktop.png`
- `actual/active-mobile.png`
- `comparisons/instant-reference-vs-vault-run.png`

Depth and perspective evidence are not applicable to this flat interface pass. The established cinematic vault background remains the depth layer; gameplay information is intentionally rendered on orthographic UI surfaces.

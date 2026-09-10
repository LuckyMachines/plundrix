# Visual Iteration Pass 3 - Truthful Gameplay Centerpiece

Reference: `../../11-recommended-synthesis-final.png`

Actual: `app/reports/ui-review/latest/actual/instant-active-desktop.png`

Comparison: `reference-vs-implemented.png`

Depth evidence: `depth/reference-vs-actual-depth.png`

## Largest gaps addressed

1. The decorative route map implied spatial choices that Instant Play does not contain. Replaced it with a live lock-race board driven by real player progress and the actual Pick, Search, and Sabotage actions.
2. Important decisions sat below the mobile fold. Added a compact action selector with exact odds or target inside the first-view centerpiece and connected it to the existing action state.
3. Several labels presented flavor as mechanics. Replaced synthetic heat, fictional crew readiness, and speculative loot with leading lock progress, actual rival strategies, tools, targets, and action consequences.

## Acceptance checklist

- [x] Reference and implementation inspected side by side at original resolution.
- [x] The center remains the dominant recessed planning plane.
- [x] Every prominent center-board signal is derived from live match state.
- [x] All five tumblers visibly reflect real cracked-lock progress.
- [x] Pick, Search, and Sabotage can be selected directly in the centerpiece.
- [x] Exact odds or target are visible before commitment.
- [x] Rival lock, tool, lead, and stunned states remain legible.
- [x] Mobile exposes the decision controls in the first viewport.
- [x] Post-reveal mobile keeps the result and next decision visible together.
- [x] No horizontal overflow, clipped controls, unloaded images, undersized text, or serious accessibility violations.
- [x] Relative-depth evidence regenerated with `depth-anything/Depth-Anything-V2-Small-hf`.
- [x] Perspective calibration remains not applicable for the straight-on near-orthographic UI camera.

## Intentional differences

- The implementation uses a lock-race schematic rather than the reference's floor plan because Instant Play has no room-navigation mechanic.
- Detailed action cards remain below the centerpiece while quick action controls appear inside it, supporting fast mobile play without removing deeper explanations.
- The interface uses less grime than the concept so live odds and state remain readable.

# Visual Iteration Pass 2

Reference: `../../11-recommended-synthesis-final.png`

Actual: `app/reports/ui-review/latest/actual/instant-active-desktop.png`

Comparison: `reference-vs-implemented.png`

Depth evidence: `depth/reference-vs-actual-depth.png`

## Largest gaps addressed

1. The center route field was too empty. Added architectural rooms, service lines, a stronger blueprint surface, and clearer route grounding around the vault.
2. Threat was visually subordinate. Added a compact live dial while retaining the exact percentage and segmented bar.
3. Empty inventory and action cards felt flat. Added numbered recessed slots, hardware details, bevels, signal lamps, and stronger contact shadows.

## Acceptance checklist

- [x] Reference and implementation inspected side by side at original resolution.
- [x] Center remains the dominant recessed planning plane.
- [x] Left status and right paper file remain raised, distinct information planes.
- [x] Pick, Search, Sabotage, and Confirm Move remain fully visible in the desktop decision viewport.
- [x] Mobile keeps the vault, lock state, tools, and persistent command in the first viewport.
- [x] Empty tool capacity is truthful and visually intentional.
- [x] Threat is encoded by label, percentage, bar, color, and dial rather than color alone.
- [x] No horizontal overflow, clipped controls, unloaded images, undersized text, or serious accessibility violations.
- [x] Relative-depth evidence regenerated with `depth-anything/Depth-Anything-V2-Small-hf`.
- [x] Perspective calibration remains not applicable for the straight-on near-orthographic UI camera.

## Intentional differences

- The implementation uses less grime and fewer loose props than the concept so controls and live values stay legible.
- Empty inventory slots remain empty rather than displaying decorative tools the player does not own.
- The global site header stays quieter than the in-game workbench to preserve navigation consistency across the product.

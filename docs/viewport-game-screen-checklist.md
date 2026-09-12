# Active game viewport and marketing capture checklist

Reference evidence: `app/reports/ui-review/latest/actual/instant-active-desktop.png`

## Active operation

- [x] At 1366x768, Pick, Search, Sabotage, and Commit are fully visible without scrolling.
- [x] At 1366x768, the active vault state, rival state, inventory, and selected-action consequence remain legible.
- [x] At 390x844, the selected action and commit controls remain reachable in the fixed command bar.
- [x] The document has no horizontal overflow at 1366x768 or 390x844.
- [x] Round resolution does not push the next decision below the laptop viewport.
- [x] Keyboard focus, accessible names, reduced motion, and 44px mobile targets remain intact.

## Marketing captures

- [x] Every gameplay image shown on plundrix.com is captured from the current playable game rather than the legacy snapshot page.
- [x] Captures use deterministic routes, seeds, viewport sizes, reduced motion, and loaded fonts.
- [x] The hero shows the current action console; supporting cards show current play, replay, and workshop surfaces.
- [x] Screenshot crops preserve meaningful UI text and do not imply unavailable mainnet functionality.
- [x] Desktop and mobile captures load without distortion, clipping, or missing assets.

## Verification record

- [x] Inspect before/after comparison at original resolution.
- [x] Run the focused laptop viewport regression.
- [x] Run the canonical UI review capture for desktop, laptop, and mobile active play.
- [x] Run game build and marketing discovery/build checks.

# Plundrix Art Expansion v2 Acceptance Record

Date: 2026-09-06

## Reference and scope

- Prior Instant Play desktop: `reference/instant-setup-desktop.png`
- Prior onchain final briefing: `reference/game-over-desktop.png`
- Reviewed states: Tactical setup, first active round, completed Instant match, desktop at 1440x1000 and mobile at 390x844.
- Primary goals: make tools and rivals recognizable before reading, strengthen the completion payoff, and keep every generated prop faithful to game rules.

## Findings converted to work

- [x] Give Precision Kit, Signal Scanner, and Firewall distinct silhouettes at selection time.
- [x] Give Rook, Mara, and Vesper stable mechanical identity devices in the player rail.
- [x] Reuse the existing Pick, Search, and Sabotage parts in the decision cards.
- [x] Add a quiet, earned vault-opening scene behind final-result copy.
- [x] Create a reusable completion prop with exactly five latches.
- [x] Preserve the five-lock and four-station product truth in Instant setup art.
- [x] Keep all generated lettering, fake UI, people, coins, weapons, and unsupported spectacle out of accepted assets.
- [x] Preserve button labels, visible status text, contrast overlays, responsive containment, and decorative-image semantics.

## Generation review

- Eight candidates were accepted as source masters: one victory scene and seven transparent parts.
- Seven candidates were rejected across earlier attempts for pseudo-text, a weapon-like silhouette, or an incorrect latch/bolt count.
- The final five-latch seal uses pentagonal geometry so the gameplay quantity is structural rather than decorative.
- Rejected candidates remain quarantined and are excluded from builds; prompt and hash records remain under `../art-pipeline/candidates/`.

## Render review

- Setup: gadget choice now has a visual recognition layer without displacing labels or effect copy.
- Active play: rival identity is visible in the horizontally scrollable player rail; action imagery reinforces Pick, Search, and Sabotage while the numerical odds remain primary.
- Completion: the new warm breach light produces a clear relief beat while a dark left field keeps result copy readable.
- Mobile: setup stacks cleanly, action art remains legible, final copy stays clear over the image, and no document-level horizontal overflow was detected.
- Relative depth evidence preserves the intended order: interface plane, foreground bench, three middle-distance stations, then rear vault wall.
- Perspective evidence confirms a centered one-point camera hypothesis at `(0.49951, 0.53646)` normalized with `2.331 px` RMS line residual and a horizontal horizon.

## Evidence

- Before/after: `comparisons/instant-setup-before-after.png`
- Final captures: `actual/instant-setup-desktop.png`, `actual/instant-setup-mobile.png`, `actual/instant-active-desktop.png`, `actual/instant-active-mobile.png`, `actual/instant-complete-desktop.png`, `actual/instant-complete-mobile.png`, `actual/design-system-assets-desktop.png`
- Relative depth comparison: `depth/reference-vs-actual-depth.png`
- Relative depth model: `depth-anything/Depth-Anything-V2-Small-hf`; warm/bright is relatively near and cool/dark is relatively far, not metric distance.
- Perspective overlay: `depth/instant-scene-perspective-overlay.png`
- Clean guide and fit record: `depth/instant-scene-perspective-guide.png`, `depth/instant-scene-perspective.json`
- Generation decisions: `../art-pipeline/generation-decisions.md`

## Verification

- [x] `npm run art:all`
- [x] `npm run build`
- [x] `npm run test:art`
- [x] `npm run test:seo`
- [x] Targeted Instant Play desktop/mobile and Design System browser tests
- [x] Deterministic art-evidence capture test
- [ ] Refresh the onchain final-briefing screenshot after the local-chain victory fixture is stable; its direct capture attempt reverted during fixture resolution. The component build and shared victory artwork are verified, but this screenshot gate remains honestly open.

## Intentional differences

- The revised Instant setup is taller because Tactical mode now exposes three concrete gadget choices and their effects before starting.
- The old cinematic art's six lock-like modules were not retained; the revised room shows the canonical five-lock rack and four empty stations.
- Agent identity stays mechanical and explicitly labeled rather than inventing human characters.

# Plundrix Visual Expansion Acceptance Record

Date: 2026-08-16

## Reference packet

- Identity anchor: `public/images/plundrix-vault-hero.png`
- Material anchor: `public/images/replay-sabotage.png`
- Baseline marketing captures: `baseline/marketing-desktop.png`, `baseline/marketing-mobile.png`
- Baseline player-hub captures: `baseline/game-desktop.png`, `baseline/game-mobile.png`

## Pass 1 targets

- [x] Marketing hero uses original Plundrix artwork with a clear vault subject and legible centered copy.
- [x] Marketing close uses a second distinct scene instead of repeating the hero.
- [x] Player Hub gives Instant Play and live Sepolia distinct visual identities without obscuring their controls.
- [x] Generated artwork contains no text, logo, watermark, fake UI, coins, or treasure.
- [x] Real product screenshots remain the marketing site's gameplay proof.
- [x] Brass, blackened steel, restrained teal, and sabotage red remain coherent across both domains.
- [x] Desktop and mobile preserve hierarchy, crop quality, focus visibility, and zero horizontal overflow.
- [x] New raster assets have optimized WebP delivery derivatives and explicit accessible treatment.
- [x] Production builds, interaction checks, and serious/critical accessibility checks pass.

## Pass record

### Pass 1

- The initial marketing hero had six repeated lock modules, contradicting the five-lock objective.
- The hero was rejected and replaced with a single uninterrupted vault face and four grounded operator stations.
- The marketing close, Instant Play, and live-table scenes passed direct inspection without text, fake UI, or watermarks.

### Pass 2

- Marketing moved from a faint generic SVG to a dedicated 2048x1152 vault chamber with controlled centered contrast.
- The marketing close now provides a second visual beat without duplicating the hero composition.
- Player Hub mode cards now communicate solo-versus-three and four-station live play before a visitor reads the labels.
- Instant Play uses its dedicated training-vault scene while retaining live HTML controls and operator data.

## Verification

- [x] Inspect comparisons at original resolution.
- [x] Inspect desktop and mobile final captures.
- [x] Preserve relative depth evidence and generation prompts.
- [x] Record remaining intentional differences.

## Evidence

- Comparisons: `comparisons/marketing-desktop-before-after.png`, `comparisons/game-desktop-before-after.png`, `comparisons/game-mobile-before-after.png`
- Final states: `final/marketing-desktop.png`, `final/marketing-mobile.png`, `final/marketing-close-desktop.png`, `final/game-desktop.png`, `final/game-mobile.png`, `final/instant-desktop.png`, `final/instant-mobile.png`
- Relative depth model: `depth-anything/Depth-Anything-V2-Small-hf`
- Depth comparison: `depth/reference-vs-marketing-hero-depth.png`; warm is relatively near and cool is relatively far, not metric distance.
- Perspective overlay: `depth/marketing-hero-v2-perspective-overlay.png`
- Vanishing point: `(0.50000, 0.33301)` normalized; horizontal horizon through the fitted point; `5.325 px` RMS line residual.
- Source segments and fit record: `depth/marketing-hero-v2-perspective.json`
- Clean text-free guide: `depth/marketing-hero-v2-perspective-guide.png`
- Prompt and asset record: `prompts.md`

## Remaining intentional differences

- Product screenshots remain literal interface proof; generated art is never presented as a screenshot.
- Player Hub artwork is deliberately subdued beneath live copy and controls.
- The local comparison has an empty operation browser while the production baseline may contain active Sepolia operations.

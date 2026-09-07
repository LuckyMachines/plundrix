# Workshop visual acceptance

Date: 2026-09-06

Reference intent: preserve the established Instant Play hierarchy, typography, warm/cool palette, restrained industrial surfaces, and clear primary action. This is a product-language comparison, not a pixel-match exercise.

## Evidence

- `actual/workshop-desktop-fold.png` - desktop entry state at 1440 x 1000
- `actual/workshop-desktop.png` - complete desktop page
- `actual/workshop-blueprints-desktop.png` - filter and first 24 blueprint states
- `actual/workshop-mobile-fold.png` - mobile entry state at 390 x 844
- `actual/workshop-mobile.png` - complete mobile page
- `actual/design-system-inventory.png` - living system specimen
- `comparisons/instant-play-vs-workshop.png` - established product language beside the workshop

Depth and perspective maps are not applicable to this review. The evidence compares code-rendered interface planes, not a shared physical scene or camera. Individual raster components were separately reviewed at original resolution before promotion, with real alpha and silhouette checks enforced by the art pipeline.

## Acceptance

- [x] The first desktop viewport explains the collection, shows the equipped build, exposes both main actions, and previews all six resources.
- [x] The mobile first viewport preserves the promise and primary action without horizontal overflow.
- [x] The catalog contains exactly 1,200 stable, unique combinations.
- [x] The first 24 results rotate through all ten chassis instead of hiding variety behind one chassis family.
- [x] Search, chassis, finish, rarity, ownership, and craftable filters are keyboard-labeled.
- [x] Only 24 blueprint cards render initially; progressive loading avoids a 1,200-node wall.
- [x] Recipe affordability, owned state, equipped state, rarity, serial, and protocol are visible without opening a detail view.
- [x] Crafting consumes local salvage and equipping persists to Tactical Instant Play.
- [x] Every visual variant maps to one of three existing practice protocols; decorative stats do not imply hidden match math.
- [x] Every completed Instant Play match pays deterministic salvage once, with a larger win quantity.
- [x] Serious and critical automated accessibility findings are clear.
- [x] Desktop and 390px browser interaction tests pass without runtime errors or horizontal overflow.
- [x] The living Design System includes material, card, ownership, craftable, locked, and equipped specimens.

## Intentional boundaries

- Collection state is local to the device. Account sync and live-chain ownership are not implied.
- The catalog reuses ten learnable chassis masters instead of downloading 1,200 nearly redundant raster images.
- Pressure, Signal, and Guard are comparison flavor until a future balance pass explicitly promotes them into tested rules.


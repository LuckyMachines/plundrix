# Workshop v2 Acceptance Checklist

Date: 2026-09-06

## Product truth

- [x] Present 10 signature gadgets rather than claiming 1,200 independent inventions.
- [x] Preserve all 1,200 stable configuration IDs and serials.
- [x] Give every chassis a distinct live and practice-mode rule.
- [x] Label finish, calibration, and rarity as appearance and identity layers.
- [x] Remove unsupported cosmetic stat bars.

## Player experience

- [x] Replace the flat catalog with a chassis-first family browser and live builder.
- [x] Show the configured finish, material pattern, calibration glyph, and rarity treatment in the preview.
- [x] Add 30 authored builds, direct lookup, family progress, favorites, and two-build comparison.
- [x] Show held and missing recipe materials before assembly.
- [x] Support craft, equip, favorite, compare, and reclaim/refund flows.
- [x] Use the equipped signature in Tactical play instead of asking for a redundant protocol choice.

## System integrity

- [x] Implement all 10 signature effects in the local engine and smart contracts.
- [x] Keep existing IDs, protocol families, starter ownership, and storage compatibility.
- [x] Refund half of a reclaimed custom blueprint's recipe, rounded up.
- [x] Keep the production game contract within the EIP-170 runtime-size ceiling.
- [x] Pass 52 Solidity tests, 83 JavaScript tests, the production build, the inventory validator, and connected browser tests.
- [x] Pass serious/critical accessibility checks and desktop/mobile horizontal-overflow checks.

## Visual evidence

- [x] Capture desktop fold, full desktop, focused builder, mobile fold, full mobile, and Design System inventory views.
- [x] Compare the previous flat catalog with the new signature-workshop first viewport.
- [x] Inspect final captures at original resolution.

Evidence:

- `actual/workshop-desktop-fold.png`
- `actual/workshop-desktop.png`
- `actual/workshop-builder-desktop.png`
- `actual/workshop-mobile-fold.png`
- `actual/workshop-mobile.png`
- `actual/design-system-inventory.png`
- `comparisons/workshop-fold-before-after.png`

Depth and perspective evidence are not applicable to this flat interface pass. New visual variation is rendered deterministically from accepted chassis masters, material treatments, and calibration glyphs rather than generated as 1,200 near-duplicate raster files.

# Plundrix UI Improvement System

Plundrix uses a small, deterministic visual evidence loop designed for one maintainer. It extends the living `/design-system` page rather than adding Storybook, Chromatic, or another parallel source of truth.

## The loop

1. Pick one UI hypothesis from the improvement ledger.
2. Run the canonical UI matrix before editing.
3. Inspect the contact sheet and the relevant approved-left/current-right comparisons.
4. Write the three largest observable gaps in composition, hierarchy, geometry, typography/data, state behavior, responsive quality, or accessibility.
5. Make one coherent change at the shared-token or shared-component level when possible.
6. Run the targeted surface, then the complete matrix.
7. Approve a new baseline only when the difference is intentional and documented.
8. Use `/playtest` for claims about comprehension, delight, or intent.

The latest dated critique is recorded in `docs/ui-review-2026-09-08.md`. Canonical color, type, spacing, radius, motion, measure, and layout tokens live in `app/src/styles/tokens.css`. Semantic type roles live in `app/src/styles/typography.css`; reusable layout rules and React primitives live in `app/src/styles/layout.css` and `app/src/components/layout/LayoutPrimitives.jsx`.

## Commands

PowerShell:

```powershell
npm run ui:review
npm run ui:review -- --surface instant-active
npm run ui:approve -- --reason "Make the active decision visually dominant"
npm run test:ui-system
npm --prefix app run style:check
```

Run commands from the repository root. `ui:review` builds the deterministic local-chain fixture through the existing Playwright server, captures the matrix, compares it with approved baselines, checks accessibility, overflow, and images, then writes:

- `app/reports/ui-review/latest/contact-sheet.png`
- `app/reports/ui-review/latest/type-layout-contact-sheet.png`
- `app/reports/ui-review/latest/index.html`
- `app/reports/ui-review/latest/report.md`
- `app/reports/ui-review/latest/report.json`
- `app/reports/ui-review/latest/comparisons/*.png`

## Canonical scope

The source of truth is `app/ui-review/manifest.json`. It is intentionally capped at 10-14 surfaces so review does not become a second product. The current matrix covers 14 player-facing surfaces. Thirteen render at desktop and mobile widths; the mobile navigation is intentionally mobile-only. The separate stress matrix brings the complete visual contract to 31 renders.

Each surface declares:

- route and deterministic fixture;
- priority;
- readiness condition;
- comparison threshold;
- related experiment IDs;
- three concrete review questions.

The separate type/layout stress contract in `app/ui-review/type-layout.json` exercises 320px narrow mobile, 390px readable mode, 768px tablet, and 1440px desktop without expanding the canonical journey list. It uses deliberately long labels, dense values, constrained cards, and a horizontal action rail.

## Layout and typography contract

- Use the semantic roles `type-hero`, `type-page`, `type-section`, `type-card`, `type-body`, `type-interface`, and `type-label` before inventing a new type treatment.
- Use Barlow Condensed for display hierarchy, Barlow for prose, and JetBrains Mono for controls, status, and proof.
- Keep prose within `measure-copy`, compact explanations within `measure-compact`, and wide editorial copy within `measure-wide`.
- Compose with `PageShell`, `Stack`, `Cluster`, `AutoGrid`, `Rail`, and `DecisionLayout`; let reusable modules respond to their container.
- `npm --prefix app run style:check` rejects arbitrary pixel type sizes, arbitrary tracking/leading, text below the 12px floor, and un-tokenized CSS tracking.
- `npm --prefix app run test:preferences` verifies schema defaults, legacy migration, type/range normalization, malformed-storage recovery, and portable imports.
- The browser matrix verifies bundled font loading, contracted-text overflow, prose measure, Axe findings, page overflow, image loading, and key component clipping.

## Menu and preference contract

- Define preferences in `app/src/data/preferences.js`; do not add isolated local-storage toggles to components.
- Use the shared settings dialog, menu, switch, slider, select, and shortcut primitives for preference work.
- Every visible preference must change real application behavior and remain safe when storage or a browser capability is unavailable.
- Changes save locally, migrate older keys, synchronize across tabs, and can be exported or reset without identity data.
- The mobile menu and settings dialog must trap focus, close with Escape, restore focus, prevent background scrolling, and avoid horizontal overflow.
- Claims about discoverability require anonymous observed sessions. Record settings task, time, completion, and persistence comprehension in `/playtest`.

Add a surface only when it represents a materially different player job or state. Do not add screenshots for cosmetic variants that shared component specimens already cover.

## Baseline policy

Approved screenshots live in `app/tests/e2e/__screenshots__/`. Ordinary review never changes them. `ui:approve` requires `--reason`, and successful approvals append an immutable record to `app/ui-review/approvals.ndjson`.

Never approve merely to make a failing test green. First inspect the comparison at original resolution and decide whether the difference is intentional, a regression, or fixture instability.

## Review order

Review large relationships before detail:

1. composition and primary masses;
2. hierarchy and focal point;
3. geometry, spacing, cropping, and target alignment;
4. typography and live-data density;
5. state stability;
6. responsive hierarchy;
7. accessibility;
8. decorative detail.

Perspective and depth analysis are required only when iterating a spatial illustration or scene reference. They are not useful for ordinary component-layout regression checks.

## Solo cadence

- During implementation: run one targeted surface.
- Before merging UI work: run the complete matrix.
- During the normal browser release gate: the same visual assertions run through `npm run improve:release`.
- Weekly: inspect one contact sheet for no more than 20 minutes.
- Monthly: review whether a surface or metric changed a decision; remove it if it did not.
- Per release: observe four newcomers and two returning players when available. Do not delay safe automated fixes while waiting for recruitment.

## Evidence boundaries

Visual comparison, Axe, overflow, and image checks are T2 automated evidence. They can prove rendering and interaction geometry. They cannot prove that a player understood the goal, enjoyed the moment, or wants to return. Those claims require T3 confirmed observations through `/playtest`; production conversion and retention require T4 aggregate production measurements.

# UI Improvement Acceptance Checklist

This is the strict acceptance bar for the canonical Plundrix UI matrix. The generated report at `app/reports/ui-review/latest/report.md` records the current automated result.

## Deterministic evidence

- [x] All 12 canonical surfaces render from named, repeatable fixtures.
- [x] Desktop 1440 x 1000 and mobile 390 x 844 captures exist for every surface.
- [x] Motion, caret, viewport, locale, color scheme, and device scale are controlled.
- [x] Approved reference and current render use the same state, viewport, crop, and mask.
- [x] Every approved baseline has a written reason in `approvals.ndjson`.

## Objective gates

- [x] All 24 visual comparisons remain within their declared threshold.
- [x] No canonical state has horizontal overflow.
- [x] Action docks and action cards do not clip their contents.
- [x] Every visible image loads successfully.
- [x] No canonical state has a serious or critical Axe finding.
- [x] The contact sheet and HTML report are generated even when a comparison fails.

## Human review

- [x] Inspect composition and primary focal point before component details.
- [x] Inspect hierarchy, geometry, typography, state behavior, responsive quality, and accessibility.
- [x] Record the three largest gaps before changing code.
- [x] Keep exactly one UI/product experiment active in the improvement ledger.
- [x] Do not claim comprehension or joy improved until observed-human evidence exists.

## Completion rule

A visual change is complete only when the targeted state passes its automated comparison, the full matrix has no unexpected regression, the contact sheet has been inspected, and any behavioral claim has evidence at the tier required by the improvement ledger.

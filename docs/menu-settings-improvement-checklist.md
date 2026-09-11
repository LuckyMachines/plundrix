# Menu, Settings, and Preferences Improvement Checklist

Date: 2026-09-10

Baseline grade: **B-**

The prior interface had three useful persisted accessibility booleans and one separate notification toggle. It did not have a shared schema, storage migrations, recovery, a settings surface, portable preferences, menu focus containment, or dedicated visual coverage.

## P0 - One source of truth

- [x] Define every player preference in one typed metadata registry.
- [x] Migrate readability, motion, sound, and background-alert legacy keys.
- [x] Validate ranges and options before values enter application state.
- [x] Recover from malformed or future-incompatible local records.
- [x] Synchronize preference changes across browser tabs.

## P1 - Player-facing control center

- [x] Replace three persistent header toggles with one focused Settings entry point.
- [x] Group controls into Display, Feedback, Gameplay, and Privacy.
- [x] Add search, automatic saving, defaults, import, and portable JSON export.
- [x] Add reusable dialog, menu, switch, slider, select, and shortcut primitives.
- [x] Make the mobile category rail scroll independently without viewport overflow.
- [x] Keep settings available by pointer, touch, and the `Ctrl+.` keyboard shortcut.

## P2 - Preferences with real effects

- [x] Wire readable text, high contrast, and compact density to root-level UI modes.
- [x] Wire reduced motion to the existing animation contract.
- [x] Apply the master volume to interface and signature gadget cues.
- [x] Let players independently disable sound and supported haptics.
- [x] Let players opt out of active-match recovery and anonymous analytics.
- [x] Unify live background alerts with the preference system and browser permission state.

## P3 - Menu and dialog resilience

- [x] Trap focus in the settings dialog and mobile navigation.
- [x] Close with Escape and restore focus to the invoking control.
- [x] Preserve body scroll state while an overlay is open.
- [x] Give Settings and the Field Manual equally explicit mobile labels.
- [x] Use a fully opaque mobile navigation plane so underlying content cannot compete.

## P4 - Evidence and maintenance

- [x] Add preference migration, normalization, corruption, and import/export tests.
- [x] Add browser checks for persistence, keyboard behavior, accessibility modes, and damaged storage.
- [x] Add desktop/mobile Settings and mobile-menu states to the canonical visual matrix.
- [x] Extend the anonymous observation recorder with settings discovery, completion, persistence, and timing fields.
- [ ] Observe five people attempting one assigned preference task without prompting.

## Re-grade

Automated system grade: **A**

The stricter A bar is met for architecture, interaction, responsive behavior, accessibility mechanics, and regression coverage. Human discoverability remains ungraded until five observed sessions are recorded through `/playtest`; no synthetic evidence should fill that gap.

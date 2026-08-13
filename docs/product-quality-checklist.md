# Plundrix Product Quality Implementation Checklist

## 1. First user journey and positioning

- [x] Replace the insider-facing Operations Console hero with a game-first value proposition.
- [x] Put player count, objective, three choices, simultaneous resolution, and beta posture in the first viewport.
- [x] Add a no-wallet interactive turn decision before contract setup.
- [x] Simplify public navigation around Play, Practice, Replays, Ladder, and Compare.
- [ ] Verify fresh-wallet create, join, start, submit, resolve, and finish flows against a configured local chain.

## 2. Visual identity and proof

- [x] Generate original text-free vault key art through Azure GPT Image 2.
- [x] Integrate an optimized WebP derivative while retaining the PNG social image.
- [x] Add replay-story proof cards and direct replay links.
- [x] Capture desktop and mobile baseline/final evidence.
- [ ] Generate and curate real replay posters for comeback, sabotage, and close-finish matches.
- [ ] Extend the art family into selected replay and game-result states after live-state captures establish the needed compositions.

## 3. Product truth and trust

- [x] Hide Stakes creation unless `VITE_ENABLE_STAKES=true` is explicitly configured.
- [x] Align Terms and legal notes with the current free-play posture and probabilistic mechanics.
- [x] Update Privacy to disclose the active self-hosted Plausible analytics script.
- [x] Replace public missing-environment language with a useful practice fallback.
- [ ] Obtain jurisdiction-specific legal review before enabling or marketing any paid mode.

## 4. Reliability, security, and accessibility

- [x] Verify the production frontend build.
- [x] Verify agent-service, Solidity, fun-system, replay, and telemetry suites.
- [x] Apply safe same-major dependency updates and nonbreaking audit fixes.
- [x] Increase secondary text contrast and preserve reduced-motion/readability controls.
- [ ] Migrate and test Wagmi 3 to clear remaining transitive advisories, or record a formal risk exception.
- [ ] Add Playwright interaction, visual, and automated accessibility gates.
- [ ] Make the full JS contract suite start its required local chain instead of silently skipping every case.

## 5. Evidence still requiring people or live configuration

- [ ] Import at least four facilitated first-match playtests.
- [ ] Capture configured lobby, active match, resolution, and game-over states at desktop and mobile sizes.
- [ ] Validate homepage claims and CTA comprehension with first-time players.
- [ ] Re-grade after human evidence and live-state e2e are attached.

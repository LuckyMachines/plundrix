# Plundrix Solo Improvement System

Plundrix uses one small closed loop instead of asking one creator to maintain several competing backlogs:

```text
observe -> diagnose -> hypothesize -> test -> ship -> measure -> decide -> remember
```

The canonical ledger is `app/improvement/ledger.json`. The generated one-page briefing is `app/reports/improvement/latest.md`. Existing simulation, replay, ghost, playtest, design, and launch tools remain evidence producers; the ledger is the shared decision record.

## Solo operating rules

1. Keep exactly one experiment active or measuring.
2. Spend no more than 30 minutes on the weekly review.
3. Prefer the smallest change that can falsify the active hypothesis.
4. Do not add features while an observable first-session blocker is active.
5. Record a decision: ship, iterate, revert, or stop.
6. Archive stale recommendations instead of carrying an infinite backlog.

## Evidence tiers

| Tier | Meaning | May prove |
| --- | --- | --- |
| T0 | Opinion | What may be worth investigating |
| T1 | Simulation | Mechanical possibility and balance risk |
| T2 | Automated product proof | Build, browser, accessibility, contract, and regression behavior |
| T3 | Observed human evidence | Comprehension, delight, confusion, and intent |
| T4 | Aggregate production behavior | Conversion, completion, return, reliability, and adoption |

T3 evidence is rejected unless a facilitator explicitly confirms every observation. T4 evidence is rejected unless it is explicitly marked as production data. A lower tier cannot close a higher-tier requirement.

## One-command rhythm

Run from PowerShell at the repository root:

```powershell
npm run improve
```

This validates the ledger, checks evidence quality and staleness, enforces the one-item work-in-progress limit, ranks the queue, and writes the current briefing.

Before a normal merge:

```powershell
npm run improve:verify
```

Before a release candidate:

```powershell
npm run improve:release
```

The release command adds contract, service, integration, tournament, and browser checks to the normal product gates. Background child processes are launched without visible Windows consoles.

## The weekly 30-minute review

1. Open `app/reports/improvement/latest.md`.
2. Read only **Do this next**, failed checks, and evidence debt.
3. Run or observe the smallest test that answers the active question.
4. Record the measurement and evidence.
5. Decide the experiment.
6. Activate one next experiment.

Do not spend the review generating more proposals. The system intentionally limits active work to one experiment.

## Recording evidence

The internal `/playtest` recorder stores anonymous observations locally. A real facilitator must check "I personally observed this player session" before saving. Export the JSON, then import it from `app/`:

```powershell
npm run improve -- --import-observations .\path\to\plundrix-first-run-observations.json --human-verified
```

Record an aggregate production metric without copying identifiers or free text:

```powershell
npm run improve -- --measure first-operation-completion --value 72 --sample-size 40 --tier T4 --source plausible-production --summary "Started-to-completed operation rate" --production
```

For a weekly bulk export, save this aggregate-only shape and import it with `npm run improve -- --import-metrics .\path\to\metrics.json --production`:

```json
{
  "evidenceTier": "T4",
  "production": true,
  "source": "plausible-production",
  "capturedAt": "2026-09-14T18:00:00.000Z",
  "buildSha": "abc1234",
  "rulesetId": "sepolia-v2",
  "metrics": [
    { "id": "first-operation-completion", "value": 72, "sampleSize": 40 },
    { "id": "client-error-rate", "value": 1.2, "sampleSize": 240 }
  ]
}
```

Attach supporting proof to an experiment:

```powershell
npm run improve -- --record-evidence first-run-comprehension --tier T3 --source facilitated-playtest --summary "Four first-time sessions completed" --sample-size 4 --human-verified
```

Close the loop:

```powershell
npm run improve -- --decide first-run-comprehension --outcome iterate --reason "Three players understood the goal; result causality needs clearer copy"
npm run improve -- --activate production-funnel-baseline
```

Add a new experiment only when the current one is decided or paused:

```powershell
npm run improve -- --add shorter-result-copy --title "Shorten result explanation" --hypothesis "Shorter cause-first copy improves result comprehension" --metric cause-comprehension --tier T3
```

Archive unattended backlog ideas after their 30-day evidence window with `npm run improve -- --archive-stale`.

## Product scorecard

The beta north star is the percentage of observed players who voluntarily want another run or replay. The ledger keeps nine deliberately small measures:

- first action completed unaided;
- time to first meaningful action;
- goal comprehension;
- result-cause comprehension;
- first-operation completion;
- replay or continuation intent;
- seven-day return;
- production client error rate;
- automated release-gate pass rate.

The scorecard reports missing and insufficient evidence honestly. Zero observations remain zero evidence; simulations do not silently become players.

## Analytics contract

Public product events include an event-schema version, release ID, ruleset ID, and optional URL-assigned experiment and variant. The app records only bounded aggregate properties. It does not send wallet addresses, player names, seeds, free text, or cross-site identifiers.

Set these values in each deployment:

```text
VITE_RELEASE_ID=<git-sha-or-release>
VITE_RULESET_ID=<deployed-ruleset>
```

Experiment links may use `?experiment=<id>&variant=<name>`. Keep variants deterministic for a campaign and document them in the ledger.

## Definition of done

An improvement is done only when:

- its hypothesis and target existed before evaluation;
- required evidence tier and sample size are satisfied;
- guardrails did not regress;
- the exact build and ruleset are attributable;
- a ship, iterate, revert, or stop decision is recorded;
- the next active experiment is explicit.

# Dependency Risk Register

## 2026-08-13 frontend production audit

Status: closed.

- Plundrix migrated from Wagmi 2.19.5 to Wagmi 3.7.6.
- `npm audit --omit=dev` reports 0 vulnerabilities.
- The migration removed the vulnerable optional UUID dependency chain and 426 net packages.
- The production build now transforms 1,856 modules in approximately 6.6 seconds, down from 5,386 modules in approximately 22 seconds on the same workstation.
- All 14 active browser product scenarios pass after migration, including injected-wallet connection, join, start, submit, resolve, and vault-breach transactions.

No temporary audit exception remains. Retain the normal production audit and browser-wallet journeys as release gates.

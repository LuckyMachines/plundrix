# Dependency Risk Register

## 2026-08-13 frontend production audit

Status: temporary acceptance pending the Wagmi 3 migration.

- `npm audit --omit=dev` reports 8 moderate findings, 0 high, and 0 critical.
- The remaining advisory source is `uuid <11.1.1` inside optional wallet connector dependency trees pulled by Wagmi 2.
- Plundrix configures only the injected connector. It does not call UUID v3, v5, or v6 with caller-provided buffers, which is the vulnerable operation described by the advisory.
- Package overrides pin `axios >=1.18.0` and `ws >=8.21.0`, removing the prior high-severity denial-of-service and memory-disclosure advisory chains without a Wagmi major upgrade.
- Production build, 13 browser product scenarios, 75 JavaScript contract-integration tests, 23 Solidity tests, and 8 agent-service tests pass with the overrides.

Required closure: migrate to Wagmi 3, retest wallet connection and all write flows, then remove this exception when `npm audit --omit=dev` confirms the UUID chain is gone.

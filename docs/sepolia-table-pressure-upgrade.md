# Sepolia Table-Pressure Upgrade

Deployment date: 2026-09-08 PDT / 2026-09-09 UTC

Network: Ethereum Sepolia (`11155111`)

Source commit: `7147d03675509c3c4bff6d24c8e97e7e23d980e8`

Signer: HSM-backed GCP KMS address `0xf0F917ccBB18A73DEE95e9911ae0CcF97d683F79`

## Live contracts

| Contract | Address |
|---|---|
| Game proxy | [`0x1FF715D46470B4024D88A12838e08A60855f0AE2`](https://sepolia.etherscan.io/address/0x1FF715D46470B4024D88A12838e08A60855f0AE2) |
| Current game implementation | [`0x50a562176EEf29aa45722eDabaEbfE27BCC906c5`](https://eth-sepolia.blockscout.com/address/0x50a562176eef29aa45722edabaebfe27bcc906c5?tab=contract) |
| Rollback game implementation | [`0x238345D04Cb4B6F2D46ba0218D32b6A086BE1963`](https://sepolia.etherscan.io/address/0x238345D04Cb4B6F2D46ba0218D32b6A086BE1963) |
| Workshop proxy | [`0x74CAbD34B2E29A914025CeB598DF4e3652C418F5`](https://sepolia.etherscan.io/address/0x74CAbD34B2E29A914025CeB598DF4e3652C418F5) |

The game proxy address did not change.

## Successful transactions

| Operation | Transaction | Block |
|---|---|---:|
| Deploy implementation | [`0x554392ec552ee01bb8969661a5436ce613c7d038a12bfcf83cfcb3cf900e2951`](https://sepolia.etherscan.io/tx/0x554392ec552ee01bb8969661a5436ce613c7d038a12bfcf83cfcb3cf900e2951) | 11665686 |
| Upgrade proxy | [`0xa39edb10936837ff1312ce3345ac4b460b3aad4d158301feff6753ac59c2de24`](https://sepolia.etherscan.io/tx/0xa39edb10936837ff1312ce3345ac4b460b3aad4d158301feff6753ac59c2de24) | 11665687 |

Both receipts succeeded. The guarded upgrader independently checked the EIP-1967 slot, UUPS UUID, runtime length, signer role, chain ID, gas reserve, and state before and after the upgrade.

## Preserved state

- Total games before upgrade: `116`
- Paused: `false`
- Automation: enabled, 300-second delay, external entropy required
- Workshop: `0x74CAbD34B2E29A914025CeB598DF4e3652C418F5`
- Sepolia test fee: enabled, 200 bps
- Runtime size: 24,194 bytes, 382 bytes below EIP-170

## Public provenance

- Sourcify job: [`8a2a0e43-f913-465a-8d6b-b9db3ff42f85`](https://sourcify.dev/server/v2/verify/8a2a0e43-f913-465a-8d6b-b9db3ff42f85), exact match
- [Blockscout verified source](https://eth-sepolia.blockscout.com/address/0x50a562176eef29aa45722edabaebfe27bcc906c5?tab=contract), full match
- [Routescan verified source](https://routescan.io/address/0x50a562176eef29aa45722edabaebfe27bcc906c5?chainid=11155111)
- Compiler: Solidity `0.8.17+commit.8df45f5f`
- Optimizer: enabled, 1 run
- Normalized runtime SHA-256: `1c25914e90c515627216a824c782a8de16362794acea78c3ee5fbbd12d07b47b`

`npm run verify:sepolia:provenance` resolves the implementation from the proxy slot and passed against the public records.

## Post-upgrade behavioral proof

Guarded FREE operation `117` completed in eight rounds with two HSM-backed players and external drand entropy.

- Winner: `0xf0F917ccBB18A73DEE95e9911ae0CcF97d683F79`
- Final state: operator 5 locks, opponent 2 locks
- Table-pressure proof: the opponent moved from 0 locks after round 7 to 2 locks after round 8
- Final resolve: [`0x7e21f95b227f7fa7c08ad62eb3b760d1d1c0797e52ebf1d6199a9d8662b5f2c5`](https://sepolia.etherscan.io/tx/0x7e21f95b227f7fa7c08ad62eb3b760d1d1c0797e52ebf1d6199a9d8662b5f2c5)
- Receipt evidence: [`reports/sepolia-funded/latest.json`](../reports/sepolia-funded/latest.json)
- Upgrade evidence: [`reports/sepolia-upgrade/latest.json`](../reports/sepolia-upgrade/latest.json)

The production frontend build and self-contained Sepolia read-only browser check passed after the operation.

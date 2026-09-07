# Sepolia Game Upgrade and Workshop Deployment

Deployment date: 2026-09-06 PDT / 2026-09-07 UTC

Network: Ethereum Sepolia (`11155111`)

Signer: HSM-backed GCP KMS address `0xf0F917ccBB18A73DEE95e9911ae0CcF97d683F79`

## Live contracts

| Contract | Address |
|---|---|
| Game proxy | [`0x1FF715D46470B4024D88A12838e08A60855f0AE2`](https://sepolia.etherscan.io/address/0x1FF715D46470B4024D88A12838e08A60855f0AE2) |
| Game implementation | [`0x238345D04Cb4B6F2D46ba0218D32b6A086BE1963`](https://sepolia.etherscan.io/address/0x238345D04Cb4B6F2D46ba0218D32b6A086BE1963) |
| Workshop proxy | [`0x74CAbD34B2E29A914025CeB598DF4e3652C418F5`](https://sepolia.etherscan.io/address/0x74CAbD34B2E29A914025CeB598DF4e3652C418F5) |
| Workshop implementation | [`0x4DF49b5d262b78416DDe598f3A4DF2103a3260cd`](https://sepolia.etherscan.io/address/0x4DF49b5d262b78416DDe598f3A4DF2103a3260cd) |

## Successful transactions

| Operation | Transaction | Block |
|---|---|---:|
| Deploy game implementation | [`0x4b359fd362f4f8e045e1ffb405534988badfb0a1e9992883f3ffe2ae8988d669`](https://sepolia.etherscan.io/tx/0x4b359fd362f4f8e045e1ffb405534988badfb0a1e9992883f3ffe2ae8988d669) | 11652294 |
| Upgrade game proxy | [`0xeeb7244fad2a25a6d7bf682804b784c7f21d811d0a11637df7a8ae69395f7743`](https://sepolia.etherscan.io/tx/0xeeb7244fad2a25a6d7bf682804b784c7f21d811d0a11637df7a8ae69395f7743) | 11652295 |
| Deploy workshop implementation | [`0xfad17445c29c985b6a3b40b47626f6bbeda4d502beb07e8242714ac21dac38a3`](https://sepolia.etherscan.io/tx/0xfad17445c29c985b6a3b40b47626f6bbeda4d502beb07e8242714ac21dac38a3) | 11652297 |
| Deploy and initialize workshop proxy | [`0x040844ce968f6ce3978a8ad1d7ba83f8b54e61791881e46c809cc74ca8fe28c4`](https://sepolia.etherscan.io/tx/0x040844ce968f6ce3978a8ad1d7ba83f8b54e61791881e46c809cc74ca8fe28c4) | 11652298 |
| Configure workshop on game | [`0x1a1979e8748079885045a5085df0a45f7114cd57a89a4a6cc4a3f4a8e51d6a96`](https://sepolia.etherscan.io/tx/0x1a1979e8748079885045a5085df0a45f7114cd57a89a4a6cc4a3f4a8e51d6a96) | 11652299 |

Every receipt returned status `0x1`. The final configuration was independently read at block 11652302.

## Post-deployment checks

- Game EIP-1967 implementation slot: `0x238345d04cb4b6f2d46ba0218d32b6a086be1963`
- Workshop EIP-1967 implementation slot: `0x4df49b5d262b78416dde598f3a4df2103a3260cd`
- `game.workshop()`: `0x74CAbD34B2E29A914025CeB598DF4e3652C418F5`
- `workshop.game()`: `0x1FF715D46470B4024D88A12838e08A60855f0AE2`
- `workshop.BLUEPRINT_COUNT()`: `1200`
- `workshop.CHASSIS_COUNT()`: `10`
- KMS signer has `UPGRADER_ROLE` on both proxies: yes
- Game paused: no
- Automation: enabled, 300-second delay, external entropy required
- Sepolia test fee: enabled, 200 bps, KMS signer recipient
- Runtime code sizes: game proxy 699 bytes, game implementation 23,910 bytes, workshop proxy 697 bytes, workshop implementation 14,092 bytes
- Remaining signer balance after deployment: `2.427638427777584823` Sepolia ETH

## Reproduction

The upgrade used `node ops/upgrade-kms.mjs`. The workshop bootstrap used `npm run deploy:workshop:kms`, which is guarded to Sepolia and Base Sepolia, checks `GAME_MASTER_ROLE`, refuses to overwrite an existing workshop, verifies every receipt, and verifies both contract links.

## Follow-up

- Publicly verify the current game and workshop implementation source when a supported explorer credential or verifier route is available.
- Set `VITE_WORKSHOP_ADDRESS=0x74CAbD34B2E29A914025CeB598DF4e3652C418F5` in deployed frontend environments before enabling connected workshop actions.
- Run a guarded FREE end-to-end operation with an equipped gadget as the post-upgrade behavioral proof.

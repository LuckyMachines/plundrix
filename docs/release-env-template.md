# Release Environment Template

Use this template before promoting Plundrix beyond internal playtest. Values that are unknown must remain blank and should block launch-candidate or mainnet-ready gates.

## Required Values

- Target gate:
- Launch window:
- Release owner:
- Rollback owner:
- Contract proxy address:
- Chain id:
- RPC URL:
- Agent-service URL:
- Worker host:
- Operator wallet:
- Fee disabled for mainnet launch:
- Entropy source:
- Frontend host:
- Deployment target:

## Confirmation Checklist

- Final mainnet role addresses confirmed.
- Worker host and process supervision confirmed.
- Production RPC endpoint confirmed.
- Agent-service deploy target and env values confirmed.
- Fee disabled for mainnet launch confirmed.
- Rollback owner available during launch window.
- Clean deploy env values confirmed.
- Frontend mainnet proxy and RPC config confirmed.

## Machine-Readable Source

Record confirmations in `ops/launch-readiness.json`. Launch Copilot reads that file and reports exact missing fields.

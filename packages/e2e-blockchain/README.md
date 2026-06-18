# @decentralchain/e2e-blockchain

Enterprise-grade end-to-end tests for all DecentralChain transaction types against a real node.

## Prerequisites

- Node.js >= 24
- pnpm >= 9
- Docker (for running the private node locally)

## Setup

### 1. Start the private node

```bash
docker compose -f packages/e2e-blockchain/docker-compose.yml up -d
# Wait for the node to be healthy (polls /blocks/height every 5 s)
docker compose -f packages/e2e-blockchain/docker-compose.yml ps
```

### 2. Configure environment variables

Copy `.env.example` at the repo root to `.env` and set the relevant variables:

| Variable              | Default                                    | Description                          |
| --------------------- | ------------------------------------------ | ------------------------------------ |
| `DCC_TEST_NODE_URL`   | `http://localhost:6869`                    | Node REST URL (no trailing slash)    |
| `DCC_TEST_CHAIN_ID`   | `R`                                        | Chain ID character                   |
| `DCC_TEST_MINER_SEED` | `dcc private node seed with dcc tokens`    | Rich seed with DCC tokens            |
| `DCC_TEST_DS_URL`     | `https://testnet-data-service.decentralchain.io` | Data-service base URL          |

The setup file (`src/setup/env.ts`) automatically loads `.env` from the repo root, so no extra setup is required for local development with the private node.

## Running tests

```bash
# Run all E2E tests (single-threaded, sequential)
pnpm --filter @decentralchain/e2e-blockchain test

# Or via Nx
pnpm nx run @decentralchain/e2e-blockchain:test

# Watch mode
pnpm --filter @decentralchain/e2e-blockchain test:watch

# With coverage
pnpm --filter @decentralchain/e2e-blockchain test:coverage
```

## Test suites

| File                          | Transaction type(s)       | What it covers                                      |
| ----------------------------- | ------------------------- | --------------------------------------------------- |
| `transfer.spec.ts`            | Type 4 — Transfer         | Broadcast, confirm, balance check, data-service     |
| `mass-transfer.spec.ts`       | Type 11 — MassTransfer    | 5 recipients, all balances, data-service            |
| `asset-lifecycle.spec.ts`     | Types 3/5/6 — Issue/Reissue/Burn | Full asset lifecycle + data-service          |
| `leasing.spec.ts`             | Types 8/9 — Lease/Cancel  | Lease creation and cancellation + data-service      |
| `alias.spec.ts`               | Type 10 — Alias           | Create alias, resolve via data-service              |
| `data.spec.ts`                | Type 12 — Data            | All 4 field types, node read-back, data-service     |
| `set-script.spec.ts`          | Type 13 — SetScript       | Remove script (null), data-service confirmation     |
| `sponsorship.spec.ts`         | Type 14 — Sponsorship     | Enable sponsorship on issued asset                  |
| `pipeline.spec.ts`            | Types 4/11 (pipeline)     | End-to-end latency: node confirm → data-service     |

## Architecture

```
src/
  setup/
    env.ts          ← loads dotenv, exports NODE_URL, CHAIN_ID, MASTER_SEED, API_BASE, DS_URL
  helpers/
    accounts.ts     ← deriveAccount, randomTestAccount, fundAccount
    wait.ts         ← waitForTx (plain fetch poller, fallback to SDK's nodeInteraction)
  transactions/
    *.spec.ts       ← one file per transaction type
```

All spec files import directly from the SDK:

```typescript
import { address, randomSeed } from '@decentralchain/ts-lib-crypto';
import { transfer, massTransfer, ... } from '@decentralchain/transactions';
import { broadcast, waitForTx } from '@decentralchain/transactions';
```

## Stopping the node

```bash
docker compose -f packages/e2e-blockchain/docker-compose.yml down
```

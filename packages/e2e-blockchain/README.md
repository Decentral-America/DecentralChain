# @decentralchain/e2e-blockchain

Enterprise-grade end-to-end tests for all DecentralChain transaction types against a live network (the public testnet by default).

## Prerequisites

- Node.js >= 24, pnpm (version from the root `packageManager` field)
- Network access to the public DecentralChain testnet

## Setup

The suite runs against a live network — by default the public testnet, the same target the
`admin-e2e` workflow in the infra repository uses.

```bash
cp packages/e2e-blockchain/.env.testnet packages/e2e-blockchain/.env
pnpm --filter "@decentralchain/e2e-blockchain..." build
```

| Variable | Default | Description |
| --- | --- | --- |
| `DCC_TEST_NODE_URL` | `https://testnet-node.decentralchain.io` | Node REST URL (no trailing slash) |
| `DCC_TEST_CHAIN_ID` | `!` | Chain id character |
| `DCC_TEST_MINER_SEED` | — (required) | Funded account that pays for test transactions |
| `DCC_TEST_DS_URL` | `https://testnet-data-service.decentralchain.io` | Data-service base URL |
| `DCC_TEST_MATCHER_URL` | `https://testnet-matcher.decentralchain.io` | Matcher URL |
| `DCC_TEST_WS_URL` | `wss://testnet-ws.decentralchain.io/ws` | websocket-api URL |
| `DCC_TEST_GRPC_UPDATES_URL` | empty (gRPC tests skipped) | Blockchain-updates gRPC, e.g. `http://127.0.0.1:6881` via an SSH tunnel |
| `DCC_TEST_API_KEY` | empty | Node API key, only for nodes without an edge-injected key |

To run against a different network, override every URL and the chain id together.

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

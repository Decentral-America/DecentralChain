<p align="center">
  <a href="https://decentralchain.io">
    <img src="https://avatars.githubusercontent.com/u/75630395?s=200" alt="DecentralChain" width="80" />
  </a>
</p>

<h3 align="center">@decentralchain/money-like-to-node</h3>

<p align="center">
  Converts human-readable money-like objects to DecentralChain blockchain node API format.
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@decentralchain/money-like-to-node"><img src="https://img.shields.io/npm/v/@decentralchain/money-like-to-node?color=blue" alt="npm" /></a>
  <a href="./LICENSE"><img src="https://img.shields.io/npm/l/@decentralchain/money-like-to-node" alt="license" /></a>
  <a href="https://bundlephobia.com/package/@decentralchain/money-like-to-node"><img src="https://img.shields.io/bundlephobia/minzip/@decentralchain/money-like-to-node" alt="bundle size" /></a>
  <a href="./package.json"><img src="https://img.shields.io/node/v/@decentralchain/money-like-to-node" alt="node" /></a>
</p>

---

## Overview

This library transforms GUI-friendly transaction data (using Money objects, BigNumber instances, and money-like `{ coins, assetId }` structures) into the raw string-based format expected by the DecentralChain node API. It supports all 17 transaction types plus exchange orders.

**Part of the [DecentralChain](https://docs.decentralchain.io) SDK.**

## Installation

```bash
npm install @decentralchain/money-like-to-node
```

> Requires **Node.js >= 24** and an ESM environment (`"type": "module"`).

## Quick Start

```typescript
import { toNode } from '@decentralchain/money-like-to-node';

// Convert a GUI transfer transaction to node format
const nodeTransaction = toNode({
  type: 4, // TRANSFER
  version: 1,
  senderPublicKey: 'EM1XUpKdct1eE2mgmdvr4VA4raXMKvYKumCbnArtcQ9c',
  timestamp: Date.now(),
  fee: { coins: '1000000', assetId: 'DCC' },
  amount: { coins: '100000', assetId: 'DCC' },
  recipient: 'address...',
});
```

## API Reference

### `toNode(item)`

Converts a single GUI transaction entity or exchange order into the node API format.

- **Parameters**: `item` — A `TDCCGuiEntity` (transaction) or `IDCCGuiExchangeOrder` (order)
- **Returns**: The transaction/order in node format with all monetary values as strings

Supported transaction types:
| Type | Name | Type ID |
|------|------------------|---------|
| 3 | Issue | `TYPES.ISSUE` |
| 4 | Transfer | `TYPES.TRANSFER` |
| 5 | Reissue | `TYPES.REISSUE` |
| 6 | Burn | `TYPES.BURN` |
| 7 | Exchange | `TYPES.EXCHANGE` |
| 8 | Lease | `TYPES.LEASE` |
| 9 | Cancel Lease | `TYPES.CANCEL_LEASE` |
| 10 | Alias | `TYPES.ALIAS` |
| 11 | Mass Transfer | `TYPES.MASS_TRANSFER` |
| 12 | Data | `TYPES.DATA` |
| 13 | Set Script | `TYPES.SET_SCRIPT` |
| 14 | Sponsorship | `TYPES.SPONSORSHIP` |
| 15 | Set Asset Script | `TYPES.SET_ASSET_SCRIPT` |
| 16 | Invoke Script | `TYPES.INVOKE_SCRIPT` |
| 17 | Update Asset Info| `TYPES.UPDATE_ASSET_INFO` |

### `convert(tx, factory)`

Generic converter that applies a factory function to transform monetary values within any transaction type.

- **Parameters**:
  - `tx` — A typed transaction or exchange order
  - `factory` — A function `(value: FROM) => TO` applied to all monetary fields
- **Returns**: The transaction with all monetary fields transformed

### Individual converters

Each transaction type also has a standalone converter exported from `converters`:

```typescript
import { convert } from '@decentralchain/money-like-to-node';
```

## Development

### Prerequisites

- Node.js >= 24
- npm >= 10

### Setup

```bash
git clone https://github.com/Decentral-America/money-like-to-node.git
cd money-like-to-node
npm install
```

### Scripts

| Command                 | Description                          |
| ----------------------- | ------------------------------------ |
| `npm run build`         | Build distribution files via tsup    |
| `npm test`              | Run tests with Vitest                |
| `npm run test:watch`    | Tests in watch mode                  |
| `npm run test:coverage` | Tests with V8 coverage               |
| `npm run typecheck`     | TypeScript type checking             |
| `npm run lint`          | Biome lint |
| `npm run format`        | Format with Biome                 |
| `npm run validate`      | Full CI validation pipeline          |
| `npm run bulletproof`   | Format + lint fix + typecheck + test |

### Quality Gates

All of the following must pass before merge:

- Biome formatting check
- Biome with TypeScript strict rules
- TypeScript type checking (`tsc --noEmit`)
- Vitest tests with 90%+ coverage
- publint package validation
- attw type export validation
- size-limit bundle budget (10 kB)

## Related packages

| Package | Description |
| --- | --- |
| [`@decentralchain/ts-types`](https://www.npmjs.com/package/@decentralchain/ts-types) | Core TypeScript type definitions |
| [`@decentralchain/data-entities`](https://www.npmjs.com/package/@decentralchain/data-entities) | Asset, Money, and OrderPrice models |
| [`@decentralchain/signature-adapter`](https://www.npmjs.com/package/@decentralchain/signature-adapter) | Multi-provider signing adapter |
| [`@decentralchain/transactions`](https://www.npmjs.com/package/@decentralchain/transactions) | Transaction builders and signers |

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md).

## Security

To report a vulnerability, see [SECURITY.md](./SECURITY.md).

## License

[MIT](./LICENSE) — Copyright (c) [DecentralChain](https://decentralchain.io)

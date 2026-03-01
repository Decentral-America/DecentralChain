# @decentralchain/money-like-to-node

[![CI](https://github.com/Decentral-America/money-like-to-node/actions/workflows/ci.yml/badge.svg)](https://github.com/Decentral-America/money-like-to-node/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/@decentralchain/money-like-to-node)](https://www.npmjs.com/package/@decentralchain/money-like-to-node)
[![license](https://img.shields.io/npm/l/@decentralchain/money-like-to-node)](./LICENSE)
[![Node.js](https://img.shields.io/node/v/@decentralchain/money-like-to-node)](./package.json)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)

Converts human-readable money-like objects to DecentralChain blockchain node API format.

This library transforms GUI-friendly transaction data (using Money objects, BigNumber instances, and
money-like `{ coins, assetId }` structures) into the raw string-based format expected by the
DecentralChain node API. It supports all 17 transaction types plus exchange orders.

## Requirements

- **Node.js** >= 22
- **npm** >= 10

## Installation

```bash
npm install @decentralchain/money-like-to-node
```

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

- Node.js >= 22 (24 recommended)
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
| `npm run lint`          | ESLint                               |
| `npm run format`        | Format with Prettier                 |
| `npm run validate`      | Full CI validation pipeline          |
| `npm run bulletproof`   | Format + lint fix + typecheck + test |

### Quality Gates

All of the following must pass before merge:

- Prettier formatting check
- ESLint with TypeScript strict rules
- TypeScript type checking (`tsc --noEmit`)
- Vitest tests with 90%+ coverage
- publint package validation
- attw type export validation
- size-limit bundle budget (10 kB)

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md).

## Security

See [SECURITY.md](./SECURITY.md).

## Code of Conduct

See [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md).

## Changelog

See [CHANGELOG.md](./CHANGELOG.md).

## License

[MIT](./LICENSE)

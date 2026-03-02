# @decentralchain/node-api-js

[![CI](https://github.com/Decentral-America/node-api-js/actions/workflows/ci.yml/badge.svg)](https://github.com/Decentral-America/node-api-js/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/@decentralchain/node-api-js)](https://www.npmjs.com/package/@decentralchain/node-api-js)
[![license](https://img.shields.io/npm/l/@decentralchain/node-api-js)](./LICENSE)
[![Node.js](https://img.shields.io/node/v/@decentralchain/node-api-js)](./package.json)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)

TypeScript/JavaScript HTTP client for the DecentralChain node REST API.

Provides a fully typed, ergonomic wrapper around every endpoint of a DecentralChain node. Includes utilities for address watching, transaction broadcasting with confirmations, block tools, and asset conversion helpers.

## Requirements

- **Node.js** >= 24
- **npm** >= 10

## Installation

```bash
npm install @decentralchain/node-api-js
```

## Quick Start

```typescript
import { create } from '@decentralchain/node-api-js';

const api = create('https://nodes.decentralchain.io');

// Get current block height
const { height } = await api.blocks.fetchHeight();
console.log('Height:', height);

// Get account balance
const balance = await api.addresses.fetchBalance('3L...');
console.log('Balance:', balance.balance);

// Get block headers
const lastBlock = await api.blocks.fetchHeadersLast();
console.log('Last block:', lastBlock.id);

// Broadcast a signed transaction
const result = await api.transactions.broadcast(signedTx);
console.log('TX ID:', result.id);
```

## API Reference

The `create(nodeUrl)` function returns an object with namespaced methods for every node API endpoint:

| Namespace          | Description                            |
| ------------------ | -------------------------------------- |
| `api.activation`   | Feature activation status              |
| `api.addresses`    | Address info, balances, data entries   |
| `api.alias`        | Alias lookup by address or name        |
| `api.assets`       | Asset details, distributions, balances |
| `api.blocks`       | Block headers, height, sequences       |
| `api.consensus`    | Consensus algo, generating balance     |
| `api.debug`        | State changes, debug endpoints         |
| `api.eth`          | Ethereum compatibility endpoints       |
| `api.leasing`      | Active leases, lease info              |
| `api.node`         | Node status, version                   |
| `api.peers`        | Connected, all, blacklisted peers      |
| `api.rewards`      | Block rewards                          |
| `api.transactions` | Broadcast, info, status, unconfirmed   |
| `api.utils`        | Hashing, seed generation, compile      |

### Tools

Available under `api.tools`:

| Tool                                 | Description                             |
| ------------------------------------ | --------------------------------------- |
| `api.tools.transactions.wait()`      | Wait for transaction confirmation       |
| `api.tools.transactions.broadcast()` | Broadcast with retries and chaining     |
| `api.tools.blocks.getNetworkByte()`  | Get network byte from node              |
| `api.tools.blocks.getNetworkCode()`  | Get network code character              |
| `api.tools.addresses.watch()`        | Watch address for incoming transactions |

### Standalone Utilities

```typescript
import {
  dccAddress2eth,
  ethAddress2dcc,
  dccAsset2Eth,
  ethTxId2dcc,
} from '@decentralchain/node-api-js';
```

| Function         | Description                             |
| ---------------- | --------------------------------------- |
| `dccAddress2eth` | Convert DCC address to Ethereum format  |
| `ethAddress2dcc` | Convert Ethereum address to DCC format  |
| `dccAsset2Eth`   | Convert DCC asset ID to Ethereum format |
| `ethTxId2dcc`    | Convert Ethereum TX ID to DCC format    |

## Development

### Prerequisites

- Node.js >= 24 (see `.node-version`)
- npm >= 10

### Setup

```bash
git clone https://github.com/Decentral-America/node-api-js.git
cd node-api-js
npm install
```

### Scripts

| Command                    | Description                           |
| -------------------------- | ------------------------------------- |
| `npm run build`            | Build distribution files (tsup)       |
| `npm test`                 | Run unit tests (Vitest)               |
| `npm run test:integration` | Run integration tests (requires node) |
| `npm run test:watch`       | Tests in watch mode                   |
| `npm run test:coverage`    | Tests with V8 coverage                |
| `npm run typecheck`        | TypeScript type checking              |
| `npm run lint`             | ESLint                                |
| `npm run format`           | Format with Prettier                  |
| `npm run validate`         | Full CI validation pipeline           |
| `npm run bulletproof`      | Format + lint fix + typecheck + test  |

### Quality Gates

```bash
npm run format:check    # No formatting issues
npm run lint            # No lint errors
npm run typecheck       # No type errors
npm test                # All tests pass
npm run build           # Clean build
npm run check:publint   # Package structure valid
npm run check:exports   # Type exports valid
npm run check:size      # Within size budget
```

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

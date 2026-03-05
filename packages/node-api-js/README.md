<p align="center">
  <a href="https://decentralchain.io">
    <img src="https://avatars.githubusercontent.com/u/75630395?s=200" alt="DecentralChain" width="80" />
  </a>
</p>

<h3 align="center">@decentralchain/node-api-js</h3>

<p align="center">
  TypeScript/JavaScript HTTP client for the DecentralChain node REST API.
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@decentralchain/node-api-js"><img src="https://img.shields.io/npm/v/@decentralchain/node-api-js?color=blue" alt="npm" /></a>
  <a href="./LICENSE"><img src="https://img.shields.io/npm/l/@decentralchain/node-api-js" alt="license" /></a>
  <a href="https://bundlephobia.com/package/@decentralchain/node-api-js"><img src="https://img.shields.io/bundlephobia/minzip/@decentralchain/node-api-js" alt="bundle size" /></a>
  <a href="./package.json"><img src="https://img.shields.io/node/v/@decentralchain/node-api-js" alt="node" /></a>
</p>

---

## Overview

Provides a fully typed, ergonomic wrapper around every endpoint of a DecentralChain node. Includes utilities for address watching, transaction broadcasting with confirmations, block tools, and asset conversion helpers.

**Part of the [DecentralChain](https://docs.decentralchain.io) SDK.**

## Installation

```bash
npm install @decentralchain/node-api-js
```

> Requires **Node.js >= 24** and an ESM environment (`"type": "module"`).

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

## Related packages

| Package | Description |
| --- | --- |
| [`@decentralchain/ts-types`](https://www.npmjs.com/package/@decentralchain/ts-types) | Core TypeScript type definitions |
| [`@decentralchain/transactions`](https://www.npmjs.com/package/@decentralchain/transactions) | Transaction builders and signers |
| [`@decentralchain/signer`](https://www.npmjs.com/package/@decentralchain/signer) | Transaction signing orchestrator |
| [`@decentralchain/data-service-client-js`](https://www.npmjs.com/package/@decentralchain/data-service-client-js) | Data service API client |

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md).

## Security

To report a vulnerability, see [SECURITY.md](./SECURITY.md).

## License

[MIT](./LICENSE) — Copyright (c) [DecentralChain](https://decentralchain.io)

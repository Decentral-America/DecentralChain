<p align="center">
  <a href="https://decentralchain.io">
    <img src="https://avatars.githubusercontent.com/u/75630395?s=200" alt="DecentralChain" width="80" />
  </a>
</p>

<h3 align="center">@decentralchain/cubensis-connect-provider</h3>

<p align="center">
  CubensisConnect browser wallet provider for DCC Signer.
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@decentralchain/cubensis-connect-provider"><img src="https://img.shields.io/npm/v/@decentralchain/cubensis-connect-provider?color=blue" alt="npm" /></a>
  <a href="./LICENSE"><img src="https://img.shields.io/npm/l/@decentralchain/cubensis-connect-provider" alt="license" /></a>
  <a href="https://bundlephobia.com/package/@decentralchain/cubensis-connect-provider"><img src="https://img.shields.io/bundlephobia/minzip/@decentralchain/cubensis-connect-provider" alt="bundle size" /></a>
  <a href="./package.json"><img src="https://img.shields.io/node/v/@decentralchain/cubensis-connect-provider" alt="node" /></a>
</p>

---

## Overview

Implements the [Signer](https://github.com/Decentral-America/signer) `Provider` interface, bridging transaction signing, authentication, and message signing through the CubensisConnect browser extension. Users interact with their wallet seamlessly while dApps use a clean, type-safe API.

**Part of the [DecentralChain](https://docs.decentralchain.io) SDK.**

## Requirements

- **Node.js** >= 24 (LTS)
- **CubensisConnect** browser extension installed (for end users)
- **@decentralchain/signer** ^1.0.0 (peer dependency)

## Installation

```bash
npm install @decentralchain/cubensis-connect-provider @decentralchain/signer
```

## Quick Start

```typescript
import { Signer } from '@decentralchain/signer';
import { ProviderCubensis } from '@decentralchain/cubensis-connect-provider';

// Initialize Signer with a DecentralChain node
const signer = new Signer({
  NODE_URL: 'https://mainnet-node.decentralchain.io',
});

// Set CubensisConnect as the signing provider
signer.setProvider(new ProviderCubensis());

// Authenticate
const user = await signer.login();
console.log('Logged in:', user.address);

// Sign a transfer
const [signedTx] = await signer
  .transfer({
    recipient: '3N...',
    amount: 100000000,
  })
  .sign();
```

## API Reference

### `ProviderCubensis`

Implements `Provider` from `@decentralchain/signer`.

#### Constructor

```typescript
new ProviderCubensis();
```

Creates a new provider instance with random auth data.

#### Methods

| Method                 | Description                                         |
| ---------------------- | --------------------------------------------------- |
| `connect(options)`     | Connects to the CubensisConnect browser extension   |
| `login()`              | Authenticates via the wallet and returns `UserData` |
| `logout()`             | Clears the current user session                     |
| `sign(txs)`            | Signs one or more transactions                      |
| `signMessage(data)`    | Signs an arbitrary message                          |
| `signTypedData(data)`  | Signs structured typed data                         |
| `on(event, handler)`   | Registers an auth event listener                    |
| `once(event, handler)` | Registers a one-time auth event listener            |
| `off(event, handler)`  | Removes an auth event listener                      |

### Re-exports

| Export             | Description                               |
| ------------------ | ----------------------------------------- |
| `TRANSACTION_TYPE` | Transaction type numeric constants        |
| `TransactionType`  | Union type of all transaction type values |
| `TransactionMap`   | Type mapping transaction numbers to names |

## Development

### Prerequisites

- **Node.js** >= 24 (LTS — see `.node-version`)
- **npm** >= 10 (latest LTS recommended)

### Setup

```bash
git clone https://github.com/Decentral-America/cubensis-connect-provider.git
cd cubensis-connect-provider
npm install
```

### Scripts

| Command                     | Description                                  |
| --------------------------- | -------------------------------------------- |
| `npm run build`             | Build distribution files (ESM-only via tsdown) |
| `npm test`                  | Run tests with Vitest                        |
| `npm run test:watch`        | Tests in watch mode                          |
| `npm run test:coverage`     | Tests with V8 coverage                       |
| `npm run typecheck`         | TypeScript type checking                     |
| `npm run lint`              | Biome lint |
| `npm run lint:fix`          | Biome lint with auto-fix                         |
| `npm run format`            | Format with Biome                         |
| `npm run validate`          | Full CI validation pipeline                  |
| `npm run bulletproof`       | Format + lint fix + typecheck + test         |
| `npm run bulletproof:check` | CI-safe: check format + lint + tc + test     |

### Quality Gates

All of the following must pass before merge:

- Formatting (`biome format`)
- Linting (`biome check`)
- Type checking (`tsc --noEmit`)
- Tests with 90%+ coverage
- Clean build
- Package validation (`publint`, `attw`)
- Bundle size budget (15 kB)

## Related packages

| Package                                                                                                          | Description                          |
| ---------------------------------------------------------------------------------------------------------------- | ------------------------------------ |
| [`@decentralchain/signer`](https://www.npmjs.com/package/@decentralchain/signer)                                 | Transaction signing orchestrator     |
| [`@decentralchain/cubensis-connect-types`](https://www.npmjs.com/package/@decentralchain/cubensis-connect-types) | CubensisConnect type definitions     |
| [`@decentralchain/transactions`](https://www.npmjs.com/package/@decentralchain/transactions)                     | Transaction builders and signers     |
| [`@decentralchain/marshall`](https://www.npmjs.com/package/@decentralchain/marshall)                             | Binary serialization/deserialization |

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md).

## Security

To report a vulnerability, see [SECURITY.md](./SECURITY.md).

## License

[MIT](./LICENSE) — Copyright (c) [DecentralChain](https://decentralchain.io)

# @decentralchain/cubensis-connect-provider

[![CI](https://github.com/Decentral-America/cubensis-connect-provider/actions/workflows/ci.yml/badge.svg)](https://github.com/Decentral-America/cubensis-connect-provider/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/@decentralchain/cubensis-connect-provider)](https://www.npmjs.com/package/@decentralchain/cubensis-connect-provider)
[![license](https://img.shields.io/npm/l/@decentralchain/cubensis-connect-provider)](./LICENSE)
[![Node.js](https://img.shields.io/node/v/@decentralchain/cubensis-connect-provider)](./package.json)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)

CubensisConnect browser wallet provider for DCC Signer.

Implements the [Signer](https://github.com/Decentral-America/signer) `Provider` interface, bridging transaction signing, authentication, and message signing through the CubensisConnect browser extension. Users interact with their wallet seamlessly while dApps use a clean, type-safe API.

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
| `npm run build`             | Build distribution files (ESM-only via tsup) |
| `npm test`                  | Run tests with Vitest                        |
| `npm run test:watch`        | Tests in watch mode                          |
| `npm run test:coverage`     | Tests with V8 coverage                       |
| `npm run typecheck`         | TypeScript type checking                     |
| `npm run lint`              | ESLint                                       |
| `npm run lint:fix`          | ESLint with auto-fix                         |
| `npm run format`            | Format with Prettier                         |
| `npm run validate`          | Full CI validation pipeline                  |
| `npm run bulletproof`       | Format + lint fix + typecheck + test         |
| `npm run bulletproof:check` | CI-safe: check format + lint + tc + test     |

### Quality Gates

All of the following must pass before merge:

- Formatting (`prettier --check`)
- Linting (`eslint`)
- Type checking (`tsc --noEmit`)
- Tests with 90%+ coverage
- Clean build
- Package validation (`publint`, `attw`)
- Bundle size budget (15 kB)

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for development workflow, commit conventions, and PR checklist.

## Security

See [SECURITY.md](./SECURITY.md) for vulnerability reporting guidelines.

## Code of Conduct

See [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md).

## Changelog

See [CHANGELOG.md](./CHANGELOG.md) for release history.

## License

[MIT](./LICENSE) © DecentralChain

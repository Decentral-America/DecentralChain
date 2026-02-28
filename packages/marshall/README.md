# @decentralchain/marshall

[![CI](https://github.com/Decentral-America/marshall/actions/workflows/ci.yml/badge.svg)](https://github.com/Decentral-America/marshall/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/@decentralchain/marshall)](https://www.npmjs.com/package/@decentralchain/marshall)
[![license](https://img.shields.io/npm/l/@decentralchain/marshall)](./LICENSE)
[![Node.js](https://img.shields.io/node/v/@decentralchain/marshall)](./package.json)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)

Serialize and parse DecentralChain blockchain data structures.

Marshall provides binary serialization/deserialization and JSON conversion for DecentralChain transactions and orders. It handles 64-bit LONG values safely and supports custom big-number converters for libraries like `long` or `bignumber.js`.

## Requirements

- **Node.js** >= 22 (24 recommended)
- **npm** >= 11

## Installation

```bash
npm install @decentralchain/marshall
```

## Quick Start

```typescript
import { binary, json } from '@decentralchain/marshall';

const tx = {
  type: 10,
  version: 2,
  fee: 100000,
  senderPublicKey: '7GGPvAPV3Gmxo4eswmBRLb6bXXEhAovPinfcwVkA2LJh',
  timestamp: 1542539421565,
  id: '1bVuFdMbDAk6dhcQFfJFxpDjmm8DdFnnKesQ3wpxj7P',
  proofs: [
    '5cW1Ej6wFRK1XpMm3daCWjiSXaKGYfL7bmspZjzATXrNYjRVxZJQVJsDU7ZVcxNXcKJ39fhjxv3rSu4ovPT3Fau8',
  ],
  alias: 'MyTestAlias',
};

// Binary converter
const bytes = binary.serializeTx(tx);
const txb = binary.parseTx(bytes);

// JSON converter
const jsonString = json.stringifyTx(tx);
const txj = json.parseTx(jsonString);
```

## API Reference

### Binary

- `binary.serializeTx(tx)` — Serialize a transaction to binary bytes
- `binary.parseTx(bytes, toLongConverter?)` — Parse binary bytes back to a transaction object
- `binary.serializeOrder(order)` — Serialize a DEX order to binary bytes
- `binary.parseOrder(bytes, toLongConverter?)` — Parse binary bytes back to an order object

### JSON

- `json.stringifyTx(tx, fromLongConverter?)` — Convert a transaction to a JSON string (safe for large numbers)
- `json.parseTx(str, toLongConverter?)` — Parse a JSON string to a transaction object
- `json.stringifyOrder(order, fromLongConverter?)` — Convert an order to a JSON string
- `json.parseOrder(str, toLongConverter?)` — Parse a JSON string to an order object

### Advanced: Custom LONG Converters

Marshall represents blockchain LONG values (64-bit integers) as strings by default. You can provide custom converters:

```typescript
import { binary, json } from '@decentralchain/marshall';
import Long from 'long';

// Parse with Long.js instances
const tx = binary.parseTx(bytes, Long.fromString);

// Parse JSON with Long.js instances
const txFromJson = json.parseTx(jsonString, Long.fromString);
```

## Development

### Prerequisites

- **Node.js** >= 22 (24 recommended — see `.node-version`)
- **npm** >= 11

### Setup

```bash
git clone https://github.com/Decentral-America/marshall.git
cd marshall
npm install
```

### Scripts

| Command                     | Description                              |
| --------------------------- | ---------------------------------------- |
| `npm run build`             | Build distribution files (ESM + CJS)     |
| `npm test`                  | Run tests with Vitest                    |
| `npm run test:watch`        | Tests in watch mode                      |
| `npm run test:coverage`     | Tests with V8 coverage                   |
| `npm run typecheck`         | TypeScript type checking                 |
| `npm run lint`              | ESLint                                   |
| `npm run lint:fix`          | ESLint with auto-fix                     |
| `npm run format`            | Format with Prettier                     |
| `npm run validate`          | Full CI validation pipeline              |
| `npm run bulletproof`       | Format + lint fix + typecheck + test     |
| `npm run bulletproof:check` | CI-safe: check format + lint + tc + test |

### Quality Gates

```bash
npm run format:check    # No formatting issues
npm run lint            # No lint errors
npm run typecheck       # No type errors
npm run test            # All tests pass
npm run build           # Clean build
npm run check:publint   # Package structure valid
npm run check:exports   # Type exports valid
npm run check:size      # Within size budget
```

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for development guidelines.

## Security

Please report security vulnerabilities responsibly. See [SECURITY.md](./SECURITY.md).

## Code of Conduct

See [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md).

## Changelog

See [CHANGELOG.md](./CHANGELOG.md).

## License

[MIT](./LICENSE) — Copyright (c) 2026-present DecentralChain

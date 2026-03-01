# @decentralchain/data-entities

[![CI](https://github.com/Decentral-America/data-entities/actions/workflows/ci.yml/badge.svg)](https://github.com/Decentral-America/data-entities/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/@decentralchain/data-entities)](https://www.npmjs.com/package/@decentralchain/data-entities)
[![license](https://img.shields.io/npm/l/@decentralchain/data-entities)](./LICENSE)
[![Node.js](https://img.shields.io/node/v/@decentralchain/data-entities)](./package.json)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)

Domain model classes for DecentralChain blockchain entities.

Provides type-safe, immutable data classes for working with Assets, Money, OrderPrices, AssetPairs, and Candles in the DecentralChain ecosystem. All numeric values use BigNumber for arbitrary-precision arithmetic.

## Requirements

- **Node.js** >= 22
- **npm** >= 10

## Installation

```bash
npm install @decentralchain/data-entities
```

## Quick Start

```ts
import { Asset, Money, AssetPair, OrderPrice } from '@decentralchain/data-entities';

// Create an asset
const dcc = new Asset({
  id: 'DCC',
  name: 'DecentralChain',
  precision: 8,
  description: 'Native token',
  height: 1,
  timestamp: new Date(),
  sender: '3P...',
  quantity: 100000000,
  reissuable: false,
});

// Work with money
const amount = Money.fromTokens(1.5, dcc);
console.log(amount.toTokens()); // "1.50000000"
console.log(amount.toCoins()); // "150000000"

// Arithmetic (returns new instances)
const doubled = amount.add(amount);
console.log(doubled.toTokens()); // "3.00000000"
```

## API Reference

### `Asset`

Represents a blockchain asset with metadata and quantity information.

| Method               | Returns      | Description                    |
| -------------------- | ------------ | ------------------------------ |
| `toJSON()`           | `IAssetJSON` | Serialize to plain object      |
| `toString()`         | `string`     | Returns the asset ID           |
| `Asset.isAsset(obj)` | `boolean`    | Type guard for Asset instances |

### `Money`

Represents a monetary amount tied to a specific Asset.

| Method                           | Returns     | Description                        |
| -------------------------------- | ----------- | ---------------------------------- |
| `getCoins()`                     | `BigNumber` | Coin amount (cloned)               |
| `getTokens()`                    | `BigNumber` | Token amount (cloned)              |
| `toCoins()`                      | `string`    | Coin amount as string              |
| `toTokens()`                     | `string`    | Token amount as fixed-point string |
| `toFormat(precision?)`           | `string`    | Formatted token amount             |
| `add(money)` / `plus(money)`     | `Money`     | Addition                           |
| `sub(money)` / `minus(money)`    | `Money`     | Subtraction                        |
| `times(money)`                   | `Money`     | Multiplication                     |
| `div(money)`                     | `Money`     | Division                           |
| `eq(money)`                      | `boolean`   | Equality check                     |
| `lt(money)` / `gt(money)`        | `boolean`   | Comparison                         |
| `Money.fromTokens(count, asset)` | `Money`     | Create from token amount           |
| `Money.fromCoins(count, asset)`  | `Money`     | Create from coin amount            |

### `OrderPrice`

Represents an order price in a trading pair (matcher-scale).

### `AssetPair`

Represents a trading pair of two assets.

### `Candle`

Represents candlestick chart data (OHLCV).

### `config`

Global configuration namespace for customizing entity remapping.

```ts
import { config } from '@decentralchain/data-entities';

config.set('remapAsset', (asset) => ({ ...asset, name: asset.name.toUpperCase() }));
```

## Development

### Prerequisites

- **Node.js** >= 22 (24 recommended — see `.node-version`)
- **npm** >= 10

### Setup

```bash
git clone https://github.com/Decentral-America/data-entities.git
cd data-entities
npm install
```

### Scripts

| Command                     | Description                              |
| --------------------------- | ---------------------------------------- |
| `npm run build`             | Build distribution files (tsup)          |
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

All of the following must pass before merge:

- `npm run format:check` — No formatting issues
- `npm run lint` — No lint errors
- `npm run typecheck` — No type errors
- `npm test` — All tests pass
- `npm run build` — Clean build
- `npm run check:publint` — Package structure valid
- `npm run check:exports` — Type exports valid
- `npm run check:size` — Within 10 kB budget

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for development workflow and guidelines.

## Security

See [SECURITY.md](./SECURITY.md) for vulnerability reporting.

## Code of Conduct

See [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md).

## Changelog

See [CHANGELOG.md](./CHANGELOG.md).

## License

[MIT](./LICENSE) © DecentralChain

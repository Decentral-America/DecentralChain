<p align="center">
  <a href="https://decentralchain.io">
    <img src="https://avatars.githubusercontent.com/u/75630395?s=200" alt="DecentralChain" width="80" />
  </a>
</p>

<h3 align="center">@decentralchain/data-entities</h3>

<p align="center">
  Domain model classes for DecentralChain blockchain entities.
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@decentralchain/data-entities"><img src="https://img.shields.io/npm/v/@decentralchain/data-entities?color=blue" alt="npm" /></a>
  <a href="./LICENSE"><img src="https://img.shields.io/npm/l/@decentralchain/data-entities" alt="license" /></a>
  <a href="https://bundlephobia.com/package/@decentralchain/data-entities"><img src="https://img.shields.io/bundlephobia/minzip/@decentralchain/data-entities" alt="bundle size" /></a>
  <a href="./package.json"><img src="https://img.shields.io/node/v/@decentralchain/data-entities" alt="node" /></a>
</p>

---

## Overview

Provides type-safe, immutable data classes for working with Assets, Money, OrderPrices, AssetPairs, and Candles in the DecentralChain ecosystem. All numeric values use BigNumber for arbitrary-precision arithmetic.

**Part of the [DecentralChain](https://docs.decentralchain.io) SDK.**

## Installation

```bash
npm install @decentralchain/data-entities
```

> Requires **Node.js >= 24** and an ESM environment (`"type": "module"`).

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

- **Node.js** >= 24 (see `.node-version`)
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
| `npm run lint`              | ESLint with auto-fix                     |
| `npm run lint:check`        | ESLint (check only)                      |
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

## Related packages

| Package                                                                                                          | Description                         |
| ---------------------------------------------------------------------------------------------------------------- | ----------------------------------- |
| [`@decentralchain/bignumber`](https://www.npmjs.com/package/@decentralchain/bignumber)                           | Arbitrary-precision arithmetic      |
| [`@decentralchain/ts-types`](https://www.npmjs.com/package/@decentralchain/ts-types)                             | Core TypeScript type definitions    |
| [`@decentralchain/money-like-to-node`](https://www.npmjs.com/package/@decentralchain/money-like-to-node)         | Money-like to node format converter |
| [`@decentralchain/signature-adapter`](https://www.npmjs.com/package/@decentralchain/signature-adapter)           | Multi-provider signing adapter      |
| [`@decentralchain/data-service-client-js`](https://www.npmjs.com/package/@decentralchain/data-service-client-js) | Data service API client             |

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md).

## Security

To report a vulnerability, see [SECURITY.md](./SECURITY.md).

## License

[MIT](./LICENSE) — Copyright (c) [DecentralChain](https://decentralchain.io)

# @decentralchain/assets-pairs-order

[![CI](https://github.com/Decentral-America/assets-pairs-order/actions/workflows/ci.yml/badge.svg)](https://github.com/Decentral-America/assets-pairs-order/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/@decentralchain/assets-pairs-order)](https://www.npmjs.com/package/@decentralchain/assets-pairs-order)
[![license](https://img.shields.io/npm/l/@decentralchain/assets-pairs-order)](./LICENSE)
[![Node.js](https://img.shields.io/node/v/@decentralchain/assets-pairs-order)](./package.json)
[![bundle size](https://img.shields.io/bundlephobia/minzip/@decentralchain/assets-pairs-order)](https://bundlephobia.com/package/@decentralchain/assets-pairs-order)

Utility for determining the correct ordering of asset pairs on the DecentralChain DEX.

When trading Asset A for Asset B, the DEX needs to decide which is the **amount asset** and which is the **price asset**. This library resolves that ordering based on a configurable priority list, ensuring every client displays trading pairs consistently.

## Requirements

- Node.js >= 20
- ESM environment (`"type": "module"` in your package.json, or `.mjs` files)

## Installation

```bash
npm install @decentralchain/assets-pairs-order
```

## Quick Start

```javascript
import { createOrderPair, MAINNET_DATA } from '@decentralchain/assets-pairs-order';

// Create an ordering function from the mainnet priority list
const orderPair = createOrderPair(MAINNET_DATA);

// Returns [amountAsset, priceAsset]
const [amountAsset, priceAsset] = orderPair(
  'Ft8X1v1LTa1ABafufpaCWyVj8KkaxUWE6xBhW6sNFJck', // USD
  'DCC',
);
// → ['DCC', 'Ft8X1v1LTa1ABafufpaCWyVj8KkaxUWE6xBhW6sNFJck']
```

### Custom priority list

```javascript
import { createOrderPair } from '@decentralchain/assets-pairs-order';

const orderPair = createOrderPair(['assetId_LOW', 'assetId_MID', 'assetId_HIGH']);

// Higher-index assets become the price asset
const [amount, price] = orderPair('assetId_HIGH', 'assetId_LOW');
// → ['assetId_HIGH', 'assetId_LOW']
```

### Fully curried call

```javascript
import { createOrderPair, MAINNET_DATA } from '@decentralchain/assets-pairs-order';

// Pass all three arguments at once
const pair = createOrderPair(MAINNET_DATA, 'assetA', 'assetB');
```

## API

### `createOrderPair(data)`

Creates an ordering function from a priority list. Supports currying.

| Parameter | Type                | Description                                                               |
| --------- | ------------------- | ------------------------------------------------------------------------- |
| `data`    | `readonly string[]` | Array of asset IDs ordered by priority (highest priority = highest index) |

**Returns** — `(assetId1: string, assetId2: string) => [amountAsset, priceAsset]`

**Throws** — `TypeError` if `data` is not an array, or if asset IDs are not strings.

#### Ordering rules

1. **Both assets in the list** — the one with the higher index becomes the price asset
2. **One asset in the list** — the listed asset becomes the price asset
3. **Neither asset in the list** — ordered deterministically by Base58 byte comparison

### Pre-configured data

| Export           | Description                                                       |
| ---------------- | ----------------------------------------------------------------- |
| `MAINNET_DATA`   | Priority list for DecentralChain mainnet (includes USD, EUR, DCC) |
| `TESTNET_DATA`   | Priority list for DecentralChain testnet                          |
| `ARBITRARY_DATA` | Additional asset ordering data                                    |

All data exports are frozen (`Object.freeze`) and immutable at runtime.

### TypeScript

Full type definitions are included. Key types:

```typescript
type TPair = readonly [amountAsset: string, priceAsset: string];
type TOrderPair = (a: string, b: string) => TPair;

interface CreateOrderPair {
  (predefinedList: readonly string[]): TOrderPair;
  (predefinedList: readonly string[], a: string, b: string): TPair;
}
```

## Browser

A pre-built IIFE bundle (with source map) is available at `dist/browser.js` (generated via `npm run build:browser`).

```html
<script src="path/to/browser.js"></script>
<script>
  const orderPair = OrderPairs.createOrderPair(OrderPairs.MAINNET_DATA);
  const [amount, price] = orderPair(assetId1, assetId2);
</script>
```

## Development

### Prerequisites

- Node.js >= 20 (see `.nvmrc`)
- npm >= 10

### Setup

```bash
git clone https://github.com/Decentral-America/assets-pairs-order.git
cd assets-pairs-order
nvm use          # uses .nvmrc
npm install      # husky hooks auto-install via prepare
```

### Scripts

| Script                      | Description                                     |
| --------------------------- | ----------------------------------------------- |
| `npm test`                  | Run tests with Vitest                           |
| `npm run test:coverage`     | Run tests with V8 coverage (90% threshold)      |
| `npm run lint`              | Lint with ESLint                                |
| `npm run lint:fix`          | Auto-fix lint issues                            |
| `npm run format`            | Format with Prettier                            |
| `npm run format:check`      | Check formatting                                |
| `npm run typecheck`         | TypeScript type checking                        |
| `npm run bulletproof`       | Format + lint fix + typecheck + test            |
| `npm run bulletproof:check` | CI-safe: format check + lint + typecheck + test |
| `npm run build:browser`     | Build IIFE browser bundle with source maps      |

### Quality Gates

- **Pre-commit hook** (via Husky + lint-staged): auto-formats and lints staged files, runs typecheck and tests
- **CI pipeline** (GitHub Actions): runs lint, typecheck, tests across Node 20/22/24, builds browser bundle
- **Coverage thresholds**: 90% branches, functions, lines, and statements enforced

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

## Security

See [SECURITY.md](./SECURITY.md) for our security policy and how to report vulnerabilities.

## Code of Conduct

See [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md).

## Changelog

See [CHANGELOG.md](./CHANGELOG.md) for version history.

## License

[MIT](./LICENSE)

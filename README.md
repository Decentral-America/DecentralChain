# @decentralchain/assets-pairs-order

[![CI](https://github.com/Decentral-America/assets-pairs-order/actions/workflows/ci.yml/badge.svg)](https://github.com/Decentral-America/assets-pairs-order/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/@decentralchain/assets-pairs-order)](https://www.npmjs.com/package/@decentralchain/assets-pairs-order)
[![license](https://img.shields.io/npm/l/@decentralchain/assets-pairs-order)](./LICENSE)

Utility for determining the correct ordering of asset pairs on the DecentralChain DEX.

When trading Asset A for Asset B, the DEX needs to decide which is the **amount asset** and which is the **price asset**. This library resolves that ordering based on a configurable priority list, ensuring every client displays trading pairs consistently.

## Requirements

- Node.js >= 20
- ESM environment (`"type": "module"` in your package.json, or `.mjs` files)

## Installation

```bash
npm install @decentralchain/assets-pairs-order
```

## Usage

```javascript
import { createOrderPair, MAINNET_DATA } from '@decentralchain/assets-pairs-order';

// Create an ordering function from the mainnet priority list
const orderPair = createOrderPair(MAINNET_DATA);

// Returns [amountAsset, priceAsset]
const [amountAsset, priceAsset] = orderPair(
  'Ft8X1v1LTa1ABafufpaCWyVj8KkaxUWE6xBhW6sNFJck',  // USD
  'DCC'
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

| Parameter | Type | Description |
|-----------|------|-------------|
| `data` | `string[]` | Array of asset IDs ordered by priority (highest priority = highest index) |

**Returns** — `(assetId1: string, assetId2: string) => [amountAsset, priceAsset]`

#### Ordering rules

1. **Both assets in the list** — the one with the higher index becomes the price asset
2. **One asset in the list** — the listed asset becomes the price asset
3. **Neither asset in the list** — ordered deterministically by Base58 byte comparison

### Pre-configured data

| Export | Description |
|--------|-------------|
| `MAINNET_DATA` | Priority list for DecentralChain mainnet (includes USD, EUR, DCC) |
| `TESTNET_DATA` | Priority list for DecentralChain testnet |
| `ARBITRARY_DATA` | Additional asset ordering data |

## Browser

A pre-built IIFE bundle is available at `dist/browser.js` (generated via `npm run build:browser`).

```html
<script src="path/to/browser.js"></script>
<script>
  const orderPair = OrderPairs.createOrderPair(OrderPairs.MAINNET_DATA);
  const [amount, price] = orderPair(assetId1, assetId2);
</script>
```

## Development

```bash
# Install dependencies
npm install

# Run tests
npm test

# Lint
npm run lint

# Format
npm run format

# Full check (format + lint + test)
npm run bulletproof:check

# Build browser bundle
npm run build:browser
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feat/my-feature`)
3. Make your changes
4. Run `npm run bulletproof` to format, lint, and test
5. Commit your changes (`git commit -m 'feat: add my feature'`)
6. Push to your branch (`git push origin feat/my-feature`)
7. Open a Pull Request

## License

[MIT](./LICENSE)

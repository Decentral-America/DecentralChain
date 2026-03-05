<p align="center">
  <a href="https://decentralchain.io">
    <img src="https://avatars.githubusercontent.com/u/75630395?s=200" alt="DecentralChain" width="80" />
  </a>
</p>

<h3 align="center">@decentralchain/assets-pairs-order</h3>

<p align="center">
  Deterministic asset-pair ordering for the DecentralChain decentralized exchange.
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@decentralchain/assets-pairs-order"><img src="https://img.shields.io/npm/v/@decentralchain/assets-pairs-order?color=blue" alt="npm" /></a>
  <a href="./LICENSE"><img src="https://img.shields.io/npm/l/@decentralchain/assets-pairs-order" alt="license" /></a>
  <a href="https://bundlephobia.com/package/@decentralchain/assets-pairs-order"><img src="https://img.shields.io/bundlephobia/minzip/@decentralchain/assets-pairs-order" alt="bundle size" /></a>
  <a href="./package.json"><img src="https://img.shields.io/node/v/@decentralchain/assets-pairs-order" alt="node" /></a>
</p>

---

## Overview

When trading on the [DecentralChain DEX](https://docs.decentralchain.io/en/master/02_decentralchain/06_order.html), every asset pair must be presented as **(amount asset, price asset)**. Which asset takes which role is determined by a well-known priority list maintained by the network.

`@decentralchain/assets-pairs-order` resolves that ordering deterministically so that every client, API, and UI displays the same trading pair in the same direction.

**Part of the [DecentralChain](https://docs.decentralchain.io) SDK.**

## Installation

```bash
npm install @decentralchain/assets-pairs-order
```

> Requires **Node.js >= 24** and an ESM environment (`"type": "module"`).

## Quick start

```ts
import { createOrderPair, MAINNET_DATA } from "@decentralchain/assets-pairs-order";

const orderPair = createOrderPair(MAINNET_DATA);

const [amountAsset, priceAsset] = orderPair(
  "Ft8X1v1LTa1ABafufpaCWyVj8KkaxUWE6xBhW6sNFJck", // USD-N
  "DCC",
);
// → ["DCC", "Ft8X1v1LTa1ABafufpaCWyVj8KkaxUWE6xBhW6sNFJck"]
```

### Custom priority list

```ts
import { createOrderPair } from "@decentralchain/assets-pairs-order";

const orderPair = createOrderPair(["assetId_LOW", "assetId_MID", "assetId_HIGH"]);
const [amount, price] = orderPair("assetId_HIGH", "assetId_LOW");
```

### Fully curried

```ts
import { createOrderPair, MAINNET_DATA } from "@decentralchain/assets-pairs-order";

const pair = createOrderPair(MAINNET_DATA, "assetA", "assetB");
```

## API reference

### `createOrderPair(priorityList)`

Creates an ordering function. Supports full currying.

| Parameter      | Type                | Description                                                  |
| -------------- | ------------------- | ------------------------------------------------------------ |
| `priorityList` | `readonly string[]` | Asset IDs ordered by priority (highest index = highest rank) |

**Returns** `(assetId1: string, assetId2: string) => [amountAsset, priceAsset]`

**Throws** `TypeError` if arguments are not the expected types.

#### Ordering rules

| Scenario                      | Rule                                                         |
| ----------------------------- | ------------------------------------------------------------ |
| Both assets in the list       | Higher-index asset becomes the **price** asset               |
| One asset in the list         | The listed asset becomes the **price** asset                 |
| Neither asset in the list     | Determined by lexicographic Base58 byte comparison            |

### Pre-configured priority lists

| Export           | Network                       |
| ---------------- | ----------------------------- |
| `MAINNET_DATA`   | DecentralChain Mainnet        |
| `TESTNET_DATA`   | DecentralChain Testnet        |
| `ARBITRARY_DATA` | Supplementary ordering data   |

All exports are frozen and immutable at runtime.

### TypeScript

Full type declarations ship with the package:

```ts
type TPair = readonly [amountAsset: string, priceAsset: string];
type TOrderPair = (a: string, b: string) => TPair;

interface CreateOrderPair {
  (priorityList: readonly string[]): TOrderPair;
  (priorityList: readonly string[], a: string, b: string): TPair;
}
```

## Browser

An IIFE bundle is included for direct `<script>` usage:

```html
<script src="dist/index.global.js"></script>
<script>
  const orderPair = OrderPairs.createOrderPair(OrderPairs.MAINNET_DATA);
  const [amount, price] = orderPair(assetId1, assetId2);
</script>
```

## Related packages

| Package                                                                                                     | Description                         |
| ----------------------------------------------------------------------------------------------------------- | ----------------------------------- |
| [`@decentralchain/ts-types`](https://www.npmjs.com/package/@decentralchain/ts-types)                        | Core TypeScript type definitions    |
| [`@decentralchain/bignumber`](https://www.npmjs.com/package/@decentralchain/bignumber)                      | Arbitrary-precision arithmetic      |
| [`@decentralchain/data-entities`](https://www.npmjs.com/package/@decentralchain/data-entities)              | Asset, Money, and OrderPrice models |
| [`@decentralchain/transactions`](https://www.npmjs.com/package/@decentralchain/transactions)                | Transaction builders and signers    |
| [`@decentralchain/node-api-js`](https://www.npmjs.com/package/@decentralchain/node-api-js)                  | Node REST API client                |

## Development

```bash
git clone https://github.com/Decentral-America/assets-pairs-order.git
cd assets-pairs-order
npm install
```

| Script                      | Description                                  |
| --------------------------- | -------------------------------------------- |
| `npm test`                  | Run tests (Vitest)                           |
| `npm run test:coverage`     | Coverage report (90 % threshold)              |
| `npm run build`             | Build ESM + IIFE bundles                     |
| `npm run typecheck`         | TypeScript type checking                     |
| `npm run lint`              | Lint with ESLint                             |
| `npm run format`            | Format with Prettier                         |
| `npm run bulletproof`       | Format → lint → build → typecheck → test     |

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md).

## Security

To report a vulnerability, see [SECURITY.md](./SECURITY.md).

## License

[MIT](./LICENSE) — Copyright (c) [DecentralChain](https://decentralchain.io)

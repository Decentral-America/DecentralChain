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
  <a href="https://github.com/Decentral-America/assets-pairs-order/actions/workflows/ci.yml"><img src="https://github.com/Decentral-America/assets-pairs-order/actions/workflows/ci.yml/badge.svg" alt="CI" /></a>
  <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-strict-blue?logo=typescript&logoColor=white" alt="TypeScript" /></a>
  <a href="https://github.com/Decentral-America/assets-pairs-order/pulls"><img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg" alt="PRs Welcome" /></a>
</p>

---

## Overview

When trading on the [DecentralChain DEX](https://docs.decentralchain.io/en/master/02_decentralchain/06_order.html), every asset pair must be presented as **(amount asset, price asset)**. Which asset takes which role is determined by a well-known priority list maintained by the network.

`@decentralchain/assets-pairs-order` resolves that ordering deterministically so that every client, API, and UI displays the same trading pair in the same direction.

**Part of the [DecentralChain](https://docs.decentralchain.io) SDK.**

## Why This Package?

On a centralized exchange, the platform decides which asset is quoted against which. On a **decentralized exchange (DEX)** like DecentralChain's, there is no central authority — yet every participant must agree on a canonical representation of each trading pair. Without a shared ordering rule:

- **Order books fragment** — one node may list `BTC/DCC` while another lists `DCC/BTC`, splitting liquidity.
- **Price display diverges** — the "price" a user sees depends on which side of the pair their client chose.
- **Smart contracts break** — the DecentralChain matcher expects a single, deterministic pair direction for every order.

`@decentralchain/assets-pairs-order` solves this by encoding the network's priority list and a deterministic fallback algorithm into a lightweight, zero-configuration utility. Import it, call one function, and every trading pair resolves to the same canonical direction — guaranteed.

## How It Works with DecentralChain

The DecentralChain blockchain features a built-in decentralized exchange (DEX) that allows users to trade any issued asset against any other asset directly on-chain. The DEX relies on an **order matcher** that pairs buy and sell orders.

For the matcher to function correctly, all orders for the same pair of assets must agree on which asset is the **amount asset** (the asset being bought/sold) and which is the **price asset** (the asset used to denominate the price). This canonical ordering is critical for:

1. **Order matching** — The DecentralChain matcher groups orders by pair. If two clients submit the same pair in opposite directions, those orders cannot be matched.
2. **Price aggregation** — Charting tools, APIs, and UIs aggregate prices. A consistent pair direction ensures that historical price data is coherent.
3. **Cross-client compatibility** — Wallets, trading bots, dApps, and block explorers all need to display the same pair in the same way.

### The Priority Algorithm

```
┌─────────────────────────────────────────────────────┐
│           createOrderPair(priorityList)              │
│                                                     │
│  Input: assetA, assetB                              │
│                                                     │
│  ┌───────────────────────────────────────────────┐  │
│  │ Are both assets in the priority list?         │  │
│  │   YES → higher-index = price asset            │  │
│  │         lower-index  = amount asset           │  │
│  └──────────────────┬────────────────────────────┘  │
│                     │ NO                             │
│  ┌──────────────────▼────────────────────────────┐  │
│  │ Is exactly one asset in the priority list?    │  │
│  │   YES → listed asset   = price asset          │  │
│  │         unlisted asset = amount asset          │  │
│  └──────────────────┬────────────────────────────┘  │
│                     │ NO                             │
│  ┌──────────────────▼────────────────────────────┐  │
│  │ Neither asset in list                         │  │
│  │   → Compare Base58-decoded bytes              │  │
│  │     lexicographically to determine order      │  │
│  └───────────────────────────────────────────────┘  │
│                                                     │
│  Output: [amountAsset, priceAsset]                  │
└─────────────────────────────────────────────────────┘
```

The fallback byte comparison ensures that even assets not present in the priority list always resolve to the same canonical order, regardless of which client performs the computation.

### Network Data

This package ships with built-in priority lists for DecentralChain's official networks:

| Network      | Export           | Description                                                     |
| ------------ | ---------------- | --------------------------------------------------------------- |
| **Mainnet**  | `MAINNET_DATA`   | Production network asset priorities (DCC, USD-N, EUR, etc.)     |
| **Testnet**  | `TESTNET_DATA`   | Test network asset priorities for development and staging        |
| **Arbitrary**| `ARBITRARY_DATA` | Supplementary ordering data for additional asset coverage        |

These lists are compiled from the official DecentralChain network configuration, frozen at runtime with `Object.freeze()`, and updated with each package release to reflect any network governance changes.

## Use Cases

| Scenario | How This Package Helps |
| --- | --- |
| **Building a DEX UI** | Ensures every trading pair renders in the correct direction, matching the order book. |
| **Trading bot development** | Submit orders with the correct amount/price asset assignment so the matcher accepts them. |
| **Portfolio tracking** | Normalize pair directions when aggregating trades from multiple sources. |
| **Block explorer** | Display exchange transactions with consistent, human-readable pair labels. |
| **dApp integration** | Any smart contract or Ride script interacting with the DEX matcher needs deterministic pair ordering. |

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

## DecentralChain Ecosystem

This package is part of the official **DecentralChain SDK** — a suite of open-source libraries for building applications on the DecentralChain blockchain. Use it alongside these companion packages to build full-featured DEX integrations:

| Package                                                                                                     | Description                         |
| ----------------------------------------------------------------------------------------------------------- | ----------------------------------- |
| [`@decentralchain/ts-types`](https://www.npmjs.com/package/@decentralchain/ts-types)                        | Core TypeScript type definitions    |
| [`@decentralchain/bignumber`](https://www.npmjs.com/package/@decentralchain/bignumber)                      | Arbitrary-precision arithmetic      |
| [`@decentralchain/data-entities`](https://www.npmjs.com/package/@decentralchain/data-entities)              | Asset, Money, and OrderPrice models |
| [`@decentralchain/transactions`](https://www.npmjs.com/package/@decentralchain/transactions)                | Transaction builders and signers    |
| [`@decentralchain/node-api-js`](https://www.npmjs.com/package/@decentralchain/node-api-js)                  | Node REST API client                |

> **Tip:** Combine `@decentralchain/assets-pairs-order` with `@decentralchain/transactions` and `@decentralchain/node-api-js` for a complete DEX trading pipeline — from order construction to submission to the matcher.

## FAQ

<details>
<summary><strong>Why can't I just sort the two asset IDs alphabetically?</strong></summary>

The DecentralChain DEX uses a specific priority list defined by network governance, not alphabetical order. Well-known assets like DCC, USD-N, and EUR have fixed roles. Only when *neither* asset appears in the priority list does the algorithm fall back to a deterministic byte comparison. Using alphabetical sorting would produce incorrect pair directions for any asset that appears in the priority list.
</details>

<details>
<summary><strong>What happens if the priority list changes?</strong></summary>

Priority lists are updated with each package release. Simply update to the latest version to get the newest network data. If you need real-time updates, you can also provide your own priority list fetched from the DecentralChain node API.
</details>

<details>
<summary><strong>Can I use this in a browser?</strong></summary>

Yes. The package ships with an IIFE bundle (`dist/index.global.js`) for direct `<script>` tag usage. See the [Browser](#browser) section above.
</details>

<details>
<summary><strong>Does this package make network requests?</strong></summary>

No. This package is entirely offline. It ships with static priority lists compiled from the DecentralChain network configuration. There are no network calls, no side effects, and no runtime dependencies beyond a Base58 decoder.
</details>

<details>
<summary><strong>Is the ordering guaranteed to be the same across all platforms?</strong></summary>

Yes. The algorithm is fully deterministic. Given the same priority list and the same two asset IDs, every environment — Node.js, browser, or edge runtime — will produce the identical result.
</details>

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
| `npm run lint`              | Lint with Biome                             |
| `npm run format`            | Format with Biome                         |
| `npm run bulletproof`       | Format → lint → build → typecheck → test     |

### Project Structure

```
assets-pairs-order/
├── src/
│   ├── index.ts          # Public API — createOrderPair, type exports, network data
│   ├── utils.ts          # Internal byte-comparison utility
│   ├── mainnet.json      # Mainnet asset priority list
│   ├── testnet.json      # Testnet asset priority list
│   ├── arbitrary.json    # Supplementary asset data
│   └── __tests__/        # Vitest test suite
├── dist/                 # Built output (ESM + IIFE)
├── tsdown.config.ts        # Build configuration
├── vitest.config.ts      # Test configuration
├── biome.json            # Linting & formatting rules
└── package.json
```

## Contributing

We welcome contributions from the community! Whether it's a bug fix, new feature, documentation improvement, or test enhancement — every contribution helps strengthen the DecentralChain ecosystem.

See [CONTRIBUTING.md](./CONTRIBUTING.md) for detailed guidelines, branch naming conventions, and the pull request process.

## Security

Security is a top priority for the DecentralChain SDK. If you discover a vulnerability, please follow responsible disclosure practices.

To report a vulnerability, see [SECURITY.md](./SECURITY.md).

## License

[MIT](./LICENSE) — Copyright (c) [DecentralChain](https://decentralchain.io)

---

<p align="center">
  Built with ❤️ by the <a href="https://github.com/Decentral-America">DecentralChain</a> community
</p>

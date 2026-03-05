<p align="center">
  <a href="https://decentralchain.io">
    <img src="https://avatars.githubusercontent.com/u/75630395?s=200" alt="DecentralChain" width="80" />
  </a>
</p>

<h3 align="center">@decentralchain/data-service-client-js</h3>

<p align="center">
  Data service client for the DecentralChain blockchain.
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@decentralchain/data-service-client-js"><img src="https://img.shields.io/npm/v/@decentralchain/data-service-client-js?color=blue" alt="npm" /></a>
  <a href="./LICENSE"><img src="https://img.shields.io/npm/l/@decentralchain/data-service-client-js" alt="license" /></a>
  <a href="https://bundlephobia.com/package/@decentralchain/data-service-client-js"><img src="https://img.shields.io/bundlephobia/minzip/@decentralchain/data-service-client-js" alt="bundle size" /></a>
  <a href="./package.json"><img src="https://img.shields.io/node/v/@decentralchain/data-service-client-js" alt="node" /></a>
</p>

---

## Overview

A TypeScript client library for interacting with the DecentralChain data service API. Provides typed methods for querying assets, pairs, candles, aliases, and transactions with built-in pagination, request batching, and input validation.

**Part of the [DecentralChain](https://docs.decentralchain.io) SDK.**

## Installation

```bash
npm install @decentralchain/data-service-client-js
```

> Requires **Node.js >= 24** and an ESM environment (`"type": "module"`).

## Quick Start

```typescript
import DataServiceClient from '@decentralchain/data-service-client-js';

const client = new DataServiceClient({
  rootUrl: 'https://api.decentralchain.io/v0',
});

// Fetch assets
const { data: assets } = await client.getAssets(
  '4CYRBpSmNKqmw1PoKFoZADv5FaciyJcusqrHyPrAQ4Ca',
  'AENTt5heWujAzcw7PmGXi1ekRc7CAmNm87Q1xZMYXGLa',
);

// Fetch candles
const { data: candles } = await client.getCandles('AMOUNT_ASSET_ID', 'PRICE_ASSET_ID', {
  timeStart: '2024-01-01',
  timeEnd: '2024-12-31',
  interval: '1d',
  matcher: 'MATCHER_ADDRESS',
});

// Fetch exchange transactions with pagination
const result = await client.getExchangeTxs({ limit: 10, sort: 'desc' });
console.log(result.data);
if (result.fetchMore) {
  const next = await result.fetchMore(10);
  console.log(next.data);
}
```

## API Reference

### `new DataServiceClient(options)`

Creates a new client instance.

| Option      | Type       | Required | Description                      |
| ----------- | ---------- | -------- | -------------------------------- |
| `rootUrl`   | `string`   | Yes      | Base URL of the data service API |
| `fetch`     | `Function` | No       | Custom fetch implementation      |
| `parse`     | `Function` | No       | Custom JSON parser               |
| `transform` | `Function` | No       | Custom response transformer      |

### Methods

| Method                              | Description                       |
| ----------------------------------- | --------------------------------- |
| `getAssets(...ids)`                 | Fetch assets by ID(s)             |
| `getAssetsByTicker(t)`              | Fetch assets by ticker symbol     |
| `getCandles(a, p, opts)`            | Fetch OHLCV candles for a pair    |
| `getPairs(matcher)`                 | Returns a function to fetch pairs |
| `getExchangeTxs(opts?)`             | Fetch exchange transactions       |
| `getTransferTxs(opts?)`             | Fetch transfer transactions       |
| `getMassTransferTxs(opts?)`         | Fetch mass transfer transactions  |
| `aliases.getById(id)`               | Fetch alias by ID                 |
| `aliases.getByIdList(ids)`          | Fetch multiple aliases by IDs     |
| `aliases.getByAddress(addr, opts?)` | Fetch aliases by address          |

All methods return `Promise<{ data: T; fetchMore?: (count: number) => Promise }>`.

### Assets

```typescript
await client.getAssets('DCC'); // One asset
await client.getAssets('DCC', '8LQW8f7P5d5PZM7GtZEBgaqRPGSzS3DfPuiXrURJ4AJS'); // Multiple
await client.getAssetsByTicker('DCC'); // By ticker
await client.getAssetsByTicker('*'); // All assets
```

### Pairs

```typescript
const getPairs = client.getPairs('MATCHER_ADDRESS');
await getPairs([assetPairA, assetPairB]);
```

### Exchange Transactions

```typescript
await client.getExchangeTxs('txId'); // By ID
await client.getExchangeTxs({ sender: '...', limit: 10, sort: 'desc' }); // With filters
await client.getExchangeTxs(); // Default (top 100)
```

### Candles

```typescript
await client.getCandles('DCC', '8LQW8f7P5d5PZM7GtZEBgaqRPGSzS3DfPuiXrURJ4AJS', {
  timeStart: '2024-01-01',
  timeEnd: '2024-12-31',
  interval: '1d',
  matcher: 'MATCHER_ADDRESS',
});
```

### Aliases

```typescript
await client.aliases.getById('@myalias');
await client.aliases.getByIdList(['@alias1', '@alias2']);
await client.aliases.getByAddress('3P5uMgn1xvrm7g3sbUVAGLtetkNUa1AHn2M');
```

### Pagination

```typescript
const result = await client.getExchangeTxs({ limit: 1, sort: 'asc' });
if (result.fetchMore) {
  const next = await result.fetchMore(2);
}
```

### Custom Options

```typescript
const client = new DataServiceClient({
  rootUrl: 'https://api.decentralchain.io/v0',
  fetch: (url, options) => window.fetch(url, options).then((res) => res.text()),
  parse: (text) => JSON.parse(text),
  transform: ({ __type, data }) => data,
});
```

The pipeline is: **fetch** → **parse** → **transform**

- `fetch` must return a `string`
- `parse` converts the string to a JavaScript object
- `transform` processes the parsed response

## Development

### Prerequisites

- Node.js >= 24 (LTS)
- npm >= 10

### Setup

```bash
git clone https://github.com/Decentral-America/data-service-client-js.git
cd data-service-client-js
npm install
```

### Scripts

| Command                 | Description                          |
| ----------------------- | ------------------------------------ |
| `npm run build`         | Build distribution files (tsup)      |
| `npm test`              | Run tests with Vitest                |
| `npm run test:watch`    | Tests in watch mode                  |
| `npm run test:coverage` | Tests with V8 coverage               |
| `npm run typecheck`     | TypeScript type checking             |
| `npm run lint`          | ESLint (type-aware)                  |
| `npm run lint:fix`      | ESLint with auto-fix                 |
| `npm run format`        | Format with Prettier                 |
| `npm run validate`      | Full CI validation pipeline          |
| `npm run bulletproof`   | Format + lint fix + typecheck + test |

### Quality Gates

Pre-commit hooks run `lint-staged` + `typecheck` automatically.

The validate pipeline checks:

- Formatting (Prettier)
- Linting (ESLint with type-aware rules)
- Type checking (TypeScript strict mode)
- Tests with coverage thresholds (90%+)
- Build (tsup ESM output)
- Package validation (publint + attw)
- Bundle size limits (size-limit)

## Related packages

| Package | Description |
| --- | --- |
| [`@decentralchain/bignumber`](https://www.npmjs.com/package/@decentralchain/bignumber) | Arbitrary-precision arithmetic |
| [`@decentralchain/data-entities`](https://www.npmjs.com/package/@decentralchain/data-entities) | Asset, Money, and OrderPrice models |
| [`@decentralchain/ts-types`](https://www.npmjs.com/package/@decentralchain/ts-types) | Core TypeScript type definitions |
| [`@decentralchain/node-api-js`](https://www.npmjs.com/package/@decentralchain/node-api-js) | Node REST API client |

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md).

## Security

To report a vulnerability, see [SECURITY.md](./SECURITY.md).

## License

[MIT](./LICENSE) — Copyright (c) [DecentralChain](https://decentralchain.io)

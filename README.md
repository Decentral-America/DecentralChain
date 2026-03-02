# @decentralchain/data-service-client-js

[![CI](https://github.com/Decentral-America/data-service-client-js/actions/workflows/ci.yml/badge.svg)](https://github.com/Decentral-America/data-service-client-js/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/@decentralchain/data-service-client-js)](https://www.npmjs.com/package/@decentralchain/data-service-client-js)
[![license](https://img.shields.io/npm/l/@decentralchain/data-service-client-js)](./LICENSE)
[![Node.js](https://img.shields.io/node/v/@decentralchain/data-service-client-js)](./package.json)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)

Data service client for the DecentralChain blockchain.

A TypeScript client library for interacting with the DecentralChain data service API. Provides typed methods for querying assets, pairs, candles, aliases, and transactions with built-in pagination, request batching, and input validation.

## Requirements

- **Node.js** >= 22 (24 recommended)
- **npm** >= 10

## Installation

```bash
npm install @decentralchain/data-service-client-js
```

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

- Node.js >= 22 (see `.node-version` for recommended version)
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

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for development guidelines.

## Security

See [SECURITY.md](./SECURITY.md) for reporting vulnerabilities.

## Code of Conduct

See [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md).

## Changelog

See [CHANGELOG.md](./CHANGELOG.md) for release history.

## License

[MIT](./LICENSE) © DecentralChain

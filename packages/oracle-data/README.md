<p align="center">
  <a href="https://decentralchain.io">
    <img src="https://avatars.githubusercontent.com/u/75630395?s=200" alt="DecentralChain" width="80" />
  </a>
</p>

<h3 align="center">@decentralchain/oracle-data</h3>

<p align="center">
  Oracle data parsing and encoding utilities for the DecentralChain blockchain.
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@decentralchain/oracle-data"><img src="https://img.shields.io/npm/v/@decentralchain/oracle-data?color=blue" alt="npm" /></a>
  <a href="./LICENSE"><img src="https://img.shields.io/npm/l/@decentralchain/oracle-data" alt="license" /></a>
  <a href="https://bundlephobia.com/package/@decentralchain/oracle-data"><img src="https://img.shields.io/bundlephobia/minzip/@decentralchain/oracle-data" alt="bundle size" /></a>
  <a href="./package.json"><img src="https://img.shields.io/node/v/@decentralchain/oracle-data" alt="node" /></a>
</p>

---

## Overview

Provides structured access to on-chain oracle data entries — defining how oracle key-value data is encoded, decoded, and validated. Parse data transaction fields into typed provider and asset objects, convert them back to fields, and compute diffs between data states.

**Part of the [DecentralChain](https://docs.decentralchain.io) SDK.**

## Installation

```bash
npm install @decentralchain/oracle-data
```

> Requires **Node.js >= 24** and an ESM environment (`"type": "module"`).

## Quick Start

```typescript
import {
  getProviderData,
  getProviderAssets,
  getFieldsFromData,
  getFieldsFromAsset,
  getDifferenceByData,
  getDifferenceByFields,
  getFields,
} from '@decentralchain/oracle-data';

// Parse oracle provider data from on-chain data transaction fields
const providerResult = getProviderData(dataTxFields);
if (providerResult.status === 'ok') {
  console.log(providerResult.content.name);
}

// Parse oracle asset data
const assets = getProviderAssets(dataTxFields);

// Convert provider data back to data transaction fields
const fields = getFieldsFromData(providerResult.content);

// Convert asset data back to fields
const assetFields = getFieldsFromAsset(asset);

// Get the diff between two provider data objects
const diff = getDifferenceByData(oldProvider, newProvider);

// Get the diff between two sets of raw fields
const fieldDiff = getDifferenceByFields(oldFields, newFields);

// Auto-detect provider vs asset and convert to fields
const autoFields = getFields(dataOrAsset);
```

## API Reference

### Parsing

- **`getProviderData(dataTxFields)`** — Parse oracle provider data from an array of data transaction fields. Returns `TResponse<IProviderData>`.
- **`getProviderAssets(dataTxFields)`** — Parse oracle asset data from an array of data transaction fields. Returns `TResponse<TProviderAsset>[]`.

### Serialization

- **`getFieldsFromData(data)`** — Convert provider data back to data transaction fields.
- **`getFieldsFromAsset(data)`** — Convert asset data back to data transaction fields.
- **`getFields(data)`** — Auto-detect type and convert to data transaction fields.

### Diffing

- **`getDifferenceByData(previous, next)`** — Compute diff between two data objects of the same type.
- **`getDifferenceByFields(previous, next)`** — Compute diff between two arrays of data transaction fields.

### Types

- `IProviderData` — Oracle provider metadata (name, link, email, version, description).
- `IProviderAsset` / `TProviderAsset` — Oracle asset data (id, status, ticker, logo, etc.).
- `TDataTxField` — A single data transaction field (string, integer, boolean, or binary).
- `TResponse<T>` — Success or error response wrapper.
- `STATUS_LIST` — Asset verification status enum.
- `DATA_ENTRY_TYPES` — Data entry type identifiers.

## Development

### Prerequisites

- **Node.js** >= 24 (see `.node-version`)
- **npm** >= 11 (latest stable recommended)

### Setup

```bash
git clone https://github.com/Decentral-America/oracle-data.git
cd oracle-data
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
| `npm run lint`              | Biome lint |
| `npm run lint:fix`          | Biome lint with auto-fix                     |
| `npm run format`            | Format with Biome                     |
| `npm run format:check`      | Check formatting                         |
| `npm run check:publint`     | Validate package structure               |
| `npm run check:exports`     | Validate type exports                    |
| `npm run check:size`        | Check bundle size budget                 |
| `npm run validate`          | Full CI validation pipeline              |
| `npm run bulletproof`       | Format + lint fix + typecheck + test     |
| `npm run bulletproof:check` | CI-safe: check format + lint + tc + test |

### Quality Gates

All PRs must pass:

- Zero lint errors (`npm run lint`)
- Zero type errors (`npm run typecheck`)
- All tests passing with 90%+ coverage
- Bundle size within budget (`npm run check:size`)
- Valid package exports (`npm run check:publint && npm run check:exports`)

## Related packages

| Package | Description |
| --- | --- |
| [`@decentralchain/ts-types`](https://www.npmjs.com/package/@decentralchain/ts-types) | Core TypeScript type definitions |
| [`@decentralchain/data-entities`](https://www.npmjs.com/package/@decentralchain/data-entities) | Asset, Money, and OrderPrice models |
| [`@decentralchain/node-api-js`](https://www.npmjs.com/package/@decentralchain/node-api-js) | Node REST API client |
| [`@decentralchain/transactions`](https://www.npmjs.com/package/@decentralchain/transactions) | Transaction builders and signers |

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md).

## Security

To report a vulnerability, see [SECURITY.md](./SECURITY.md).

## License

[MIT](./LICENSE) — Copyright (c) [DecentralChain](https://decentralchain.io)

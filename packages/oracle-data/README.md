# @decentralchain/oracle-data

[![CI](https://github.com/Decentral-America/oracle-data/actions/workflows/ci.yml/badge.svg)](https://github.com/Decentral-America/oracle-data/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/@decentralchain/oracle-data)](https://www.npmjs.com/package/@decentralchain/oracle-data)
[![license](https://img.shields.io/npm/l/@decentralchain/oracle-data)](./LICENSE)
[![Node.js](https://img.shields.io/node/v/@decentralchain/oracle-data)](./package.json)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)

Oracle data parsing and encoding utilities for the DecentralChain blockchain.

Provides structured access to on-chain oracle data entries — defining how oracle key-value data is encoded, decoded, and validated. Parse data transaction fields into typed provider and asset objects, convert them back to fields, and compute diffs between data states.

## Requirements

- **Node.js** >= 22
- **npm** >= 10

## Installation

```bash
npm install @decentralchain/oracle-data
```

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

- **Node.js** >= 22 (24 recommended — see `.node-version`)
- **npm** >= 10 (latest LTS recommended)

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
| `npm run lint`              | ESLint                                   |
| `npm run lint:fix`          | ESLint with auto-fix                     |
| `npm run format`            | Format with Prettier                     |
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

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for development workflow and guidelines.

## Security

See [SECURITY.md](./SECURITY.md) for vulnerability reporting.

## Code of Conduct

See [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md).

## Changelog

See [CHANGELOG.md](./CHANGELOG.md).

## License

[MIT](./LICENSE) — Copyright (c) 2026-present DecentralChain

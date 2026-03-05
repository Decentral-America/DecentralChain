# @decentralchain/oracle-data

[![CI](https://github.com/Decentral-America/oracle-data/actions/workflows/ci.yml/badge.svg)](https://github.com/Decentral-America/oracle-data/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/@decentralchain/oracle-data)](https://www.npmjs.com/package/@decentralchain/oracle-data)
[![license](https://img.shields.io/npm/l/@decentralchain/oracle-data)](./LICENSE)
[![Node.js](https://img.shields.io/node/v/@decentralchain/oracle-data)](./package.json)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)
[![ESM](https://img.shields.io/badge/module-ESM-brightgreen.svg)](https://nodejs.org/api/esm.html)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](./CONTRIBUTING.md)

**The official TypeScript SDK for parsing, encoding, and validating oracle data on the [DecentralChain](https://decentralchain.io) blockchain.**

Provides structured access to on-chain oracle data entries — defining how oracle key-value data is encoded, decoded, and validated. Parse data transaction fields into typed provider and asset objects, convert them back to fields, and compute diffs between data states.

---

## Table of Contents

- [Overview](#overview)
- [How Oracles Work on DecentralChain](#how-oracles-work-on-decentralchain)
- [Architecture](#architecture)
- [Key Concepts](#key-concepts)
- [Requirements](#requirements)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [API Reference](#api-reference)
- [Use Cases](#use-cases)
- [Development](#development)
- [Contributing](#contributing)
- [Security](#security)
- [Code of Conduct](#code-of-conduct)
- [Changelog](#changelog)
- [License](#license)

---

## Overview

`@decentralchain/oracle-data` is a core library in the DecentralChain ecosystem that bridges the gap between raw on-chain data transactions and strongly-typed application data. It is designed for developers building wallets, explorers, DeFi protocols, and any application that needs to consume or produce oracle data on the DecentralChain blockchain.

On DecentralChain, **oracles** are trusted data providers that write structured key-value pairs into the blockchain via [Data Transactions](https://docs.decentralchain.io). These entries can represent anything from asset verification statuses and token metadata to provider identity information. This library standardizes how that data is read, written, and compared — ensuring consistency across the ecosystem.

### Why This Library?

- **Type Safety** — Full TypeScript coverage with strict mode, so you catch data errors at compile time rather than at runtime.
- **Bidirectional** — Parse raw on-chain fields into structured objects _and_ serialize structured objects back into blockchain-ready fields.
- **Diffing** — Compute minimal changesets between data states, enabling efficient update transactions.
- **Validation** — Built-in schema validation for provider data, asset records, and field structure.
- **Zero Dependencies** — Ships with no runtime dependencies, keeping your bundle lean and your supply chain secure.
- **ESM-First** — Modern ES Module package with full tree-shaking support.

---

## How Oracles Work on DecentralChain

Oracles on the DecentralChain blockchain serve as **trusted data bridges** that bring off-chain information on-chain in a verifiable and standardized format. Here is how the data flow works:

```
┌──────────────────────┐      Data Transaction       ┌────────────────────┐
│   Oracle Provider    │  ───────────────────────►    │  DecentralChain    │
│  (Off-chain source)  │   key-value pairs written    │    Blockchain      │
└──────────────────────┘   to provider's account      └────────────────────┘
                                                              │
                                                              ▼
                                                     ┌────────────────────┐
                                                     │  dApps / Wallets / │
                                                     │     Explorers      │
                                                     └────────────────────┘
```

1. **Oracle Providers** register themselves on-chain by writing identity metadata (name, link, email, description, version) to their account's data storage using standardized key patterns.
2. **Asset Records** are written by providers to attach verification status, ticker symbols, logos, and descriptions to specific asset IDs on the blockchain.
3. **Consumers** (wallets, explorers, DeFi protocols) read these entries via the blockchain's REST API and use this library to decode them into typed objects.

### Data Transaction Fields

Every piece of oracle data is stored as a **Data Transaction field** — a key-value entry with one of four types:

| Type      | Description                       | Example Key                 | Example Value  |
| --------- | --------------------------------- | --------------------------- | -------------- |
| `string`  | Text data (names, URLs, emails)   | `data_provider_name`        | `"MyOracle"`   |
| `integer` | Numeric data (statuses, versions) | `status_<ASSET_ID>`         | `2`            |
| `boolean` | True/false flags                  | _(reserved for future use)_ | `true`         |
| `binary`  | Base64-encoded binary data        | _(reserved for future use)_ | `"base64:..."` |

This library handles the encoding and decoding of these fields according to the DecentralChain oracle protocol specification.

---

## Architecture

The library is organized into focused, single-responsibility modules:

```
@decentralchain/oracle-data
├── constants    — Enums, patterns, and validation helpers (STATUS_LIST, DATA_ENTRY_TYPES, etc.)
├── interface    — TypeScript type definitions for all data structures
├── schemas      — Mapping schemas that define how typed objects ↔ data transaction fields
├── parse        — Parsing logic: raw fields → typed IProviderData / TProviderAsset
├── response     — Response wrappers (success/error) with structured error reporting
├── utils        — Hashing, diffing, and type-guard utilities
└── index        — Public API surface: getProviderData, getProviderAssets, getFields, getDifference*
```

All public APIs are exported from the package root. Internal modules are not exposed, ensuring a stable and minimal API surface.

---

## Key Concepts

### Provider Data (`IProviderData`)

Represents the identity and metadata of an oracle provider registered on DecentralChain:

| Field         | Type                     | Description                                   |
| ------------- | ------------------------ | --------------------------------------------- |
| `name`        | `string`                 | Human-readable name of the oracle provider    |
| `link`        | `string`                 | URL to the provider's website or profile      |
| `email`       | `string`                 | Contact email address                         |
| `version`     | `DATA_PROVIDER_VERSIONS` | Protocol version (currently `BETA`)           |
| `description` | `Record<string, string>` | Localized descriptions keyed by language code |

### Asset Data (`TProviderAsset`)

Represents an asset record published by an oracle provider:

| Field         | Type                     | Description                                                                      |
| ------------- | ------------------------ | -------------------------------------------------------------------------------- |
| `id`          | `string`                 | DecentralChain asset ID (Base58-encoded)                                         |
| `status`      | `STATUS_LIST`            | Verification status (`VERIFIED`, `DETAILED`, `NOT_VERIFY`, `SUSPICIOUS`, `SCAM`) |
| `ticker`      | `string`                 | Trading ticker symbol                                                            |
| `link`        | `string`                 | URL with more information about the asset                                        |
| `email`       | `string`                 | Contact email for the asset                                                      |
| `logo`        | `string`                 | URL to the asset's logo image                                                    |
| `version`     | `DATA_PROVIDER_VERSIONS` | Protocol version                                                                 |
| `description` | `Record<string, string>` | Localized descriptions keyed by language code                                    |

### Verification Statuses

Oracle providers assign verification statuses to assets to signal trust levels:

| Status       | Value | Meaning                                             |
| ------------ | ----- | --------------------------------------------------- |
| `VERIFIED`   | `2`   | Fully verified by the oracle provider               |
| `DETAILED`   | `1`   | Detailed information provided, partial verification |
| `NOT_VERIFY` | `0`   | No verification performed                           |
| `SUSPICIOUS` | `-1`  | Flagged as suspicious by the provider               |
| `SCAM`       | `-2`  | Confirmed scam / malicious asset                    |

## Requirements

- **Node.js** >= 24
- **npm** >= 11

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

### Error Handling

All parsing functions return a `TResponse<T>` discriminated union, making it straightforward to handle both success and error cases:

```typescript
const result = getProviderData(fields);

if (result.status === 'ok') {
  // result.content is fully typed as IProviderData
  console.log(result.content.name);
} else {
  // result.status === 'error'
  // result.content is Partial<IProviderData> with whatever could be parsed
  // result.errors contains structured error details
  for (const err of result.errors) {
    console.error(`Field "${err.path}": ${err.error.message}`);
  }
}
```

---

## Use Cases

### Wallet Integration

Display verified asset information and provider trust scores inside cryptocurrency wallets. Parse on-chain oracle data to show users which assets are verified, suspicious, or flagged as scams.

```typescript
import { getProviderAssets } from '@decentralchain/oracle-data';

// Fetch data transaction fields from the DecentralChain REST API
// e.g., GET /addresses/data/{oracleAddress}
const assets = getProviderAssets(fieldsFromBlockchain);

for (const result of assets) {
  if (result.status === 'ok') {
    const asset = result.content;
    if (asset.status === 2) {
      console.log(`✅ ${asset.ticker} is verified`);
    } else if (asset.status < 0) {
      console.warn(`⚠️ ${asset.ticker} is flagged (status: ${asset.status})`);
    }
  }
}
```

### Blockchain Explorer

Render oracle provider profiles and asset verification badges in block explorer UIs.

### DeFi Protocols

Integrate oracle verification data into smart contract front-ends to help users assess token legitimacy before trading.

### Oracle Provider Tools

Build admin dashboards for oracle providers to manage their on-chain data. Use the serialization and diffing APIs to compute minimal update transactions:

```typescript
import { getDifferenceByData, getProviderData } from '@decentralchain/oracle-data';

// Parse current on-chain state
const current = getProviderData(currentFields);
// Parse desired new state
const updated = getProviderData(updatedFields);

if (current.status === 'ok' && updated.status === 'ok') {
  // Compute only the fields that changed
  const diff = getDifferenceByData(current.content, updated.content);
  // Submit diff as a new Data Transaction — minimal on-chain cost
}
```

---

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

We welcome contributions from the community! Whether it's a bug fix, new feature, documentation improvement, or test coverage — every contribution matters.

See [CONTRIBUTING.md](./CONTRIBUTING.md) for development workflow, commit conventions, and guidelines.

## Security

If you discover a security vulnerability, please report it responsibly. **Do not open a public issue.**

See [SECURITY.md](./SECURITY.md) for our vulnerability disclosure policy and contact details.

## Code of Conduct

This project follows the [Contributor Covenant](https://www.contributor-covenant.org/) Code of Conduct. By participating, you are expected to uphold this code.

See [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md).

## Changelog

All notable changes to this project are documented in the changelog following the [Keep a Changelog](https://keepachangelog.com/) format.

See [CHANGELOG.md](./CHANGELOG.md).

## Related Packages

This library is part of the **DecentralChain JavaScript/TypeScript SDK ecosystem**. Other packages you may find useful:

| Package                                                                           | Description                                       |
| --------------------------------------------------------------------------------- | ------------------------------------------------- |
| [`@decentralchain/oracle-data`](https://github.com/Decentral-America/oracle-data) | Oracle data parsing and encoding _(this package)_ |

> More packages from the DecentralChain ecosystem can be found in the [Decentral-America](https://github.com/Decentral-America) GitHub organization.

## License

[MIT](./LICENSE) — Copyright (c) 2026-present DecentralChain

Released under the MIT License. Free for commercial and personal use.

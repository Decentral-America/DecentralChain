# @decentralchain/cubensis-connect-types

[![CI](https://github.com/Decentral-America/cubensis-connect-types/actions/workflows/ci.yml/badge.svg)](https://github.com/Decentral-America/cubensis-connect-types/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/@decentralchain/cubensis-connect-types)](https://www.npmjs.com/package/@decentralchain/cubensis-connect-types)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

> TypeScript type definitions for the **CubensisConnect** browser-extension API.

## Installation

```bash
npm install --save-dev @decentralchain/cubensis-connect-types
```

## Usage

### Module imports (recommended)

```typescript
import type {
  ICubensisConnectApi,
  IAuthData,
  TSignTransactionData,
  TMoney,
} from '@decentralchain/cubensis-connect-types';
```

### Global augmentation

The package automatically augments the global `Window` interface, so
`window.CubensisConnect` is typed without extra configuration:

```typescript
// No import needed — Window is augmented globally
const api = window.CubensisConnect;
const state = await api.publicState();
```

## API Reference

### Core

| Type                  | Description                                    |
| --------------------- | ---------------------------------------------- |
| `ICubensisConnectApi` | Full API surface exposed by the extension      |
| `TCubensisConnectApi` | _(deprecated)_ Alias for `ICubensisConnectApi` |

### Authentication

| Type            | Description                   |
| --------------- | ----------------------------- |
| `IAuthData`     | Payload passed to `auth()`    |
| `IAuthResponse` | Response returned by `auth()` |

### State

| Type                   | Description                                     |
| ---------------------- | ----------------------------------------------- |
| `IPublicStateResponse` | Full public-state snapshot from `publicState()` |
| `TPublicStateAccount`  | User account info within public state           |

### Transactions

| Type                          | Description                                         |
| ----------------------------- | --------------------------------------------------- |
| `TSignTransactionData`        | Union of all 15 transaction types                   |
| `TSignTransactionPackageData` | Array type for batch signing (up to 7 transactions) |
| `TSignRequestData`            | Sign-request data (type 1001 or 1004)               |
| `TTypedData`                  | Typed-data entry (boolean, integer, string, binary) |

### Transaction Types

| Type                      | Tx ID |
| ------------------------- | ----- |
| `TIssueTxData`            | 3     |
| `TTransferTxData`         | 4     |
| `TReissueTxData`          | 5     |
| `TBurnTxData`             | 6     |
| `TLeaseTxData`            | 8     |
| `TLeaseCancelTxData`      | 9     |
| `TCreateAliasTxData`      | 10    |
| `TMassTransferTxData`     | 11    |
| `TDataTxData`             | 12    |
| `TSetScriptTxData`        | 13    |
| `TSponsoredFeeTxData`     | 14    |
| `TSetAssetScriptTxData`   | 15    |
| `TScriptInvocationTxData` | 16    |
| `TUpdateAssetInfoTxData`  | 17    |
| `TInvokeExpressionTxData` | 18    |

### Orders

| Type                   | Description             |
| ---------------------- | ----------------------- |
| `TSignOrderData`       | DEX order signing data  |
| `TSignCancelOrderData` | Order cancellation data |
| `ISignOrderDataBody`   | Order body fields       |

### Custom Data

| Type                        | Description                     |
| --------------------------- | ------------------------------- |
| `ISignCustomDataParamsV1`   | Custom data signing params (v1) |
| `ISignCustomDataParamsV2`   | Custom data signing params (v2) |
| `ISignCustomDataResponseV1` | Custom data response (v1)       |
| `ISignCustomDataResponseV2` | Custom data response (v2)       |

### Common

| Type        | Description                                         |
| ----------- | --------------------------------------------------- |
| `TMoney`    | `IMoneyTokens \| IMoneyCoins \| IMoneyAmount` union |
| `TCallArgs` | Invoke-script call argument                         |
| `ISignData` | Generic wrapper mapping tx type code to body        |

## Scripts

| Script                      | Purpose                                                |
| --------------------------- | ------------------------------------------------------ |
| `npm run build`             | Compile with tsup (ESM + .d.ts)                        |
| `npm run typecheck`         | `tsc --noEmit` strict type check                       |
| `npm run lint`              | ESLint check (no auto-fix)                             |
| `npm run lint:fix`          | ESLint with auto-fix                                   |
| `npm run format`            | Prettier auto-format                                   |
| `npm run format:check`      | Prettier check (no writes)                             |
| `npm run test`              | Vitest type-level tests                                |
| `npm run test:watch`        | Tests in watch mode                                    |
| `npm run test:coverage`     | Tests with V8 coverage                                 |
| `npm run bulletproof`       | Format + lint fix + typecheck + test                   |
| `npm run bulletproof:check` | CI-safe: check format + lint + tc + test               |
| `npm run validate`          | Full CI pipeline (all checks + build + publish checks) |

## Requirements

- **Node.js** ≥ 24 (LTS)
- **npm** ≥ 11

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

## Security

See [SECURITY.md](./SECURITY.md) for reporting vulnerabilities.

## License

[MIT](./LICENSE) © 2026-present DecentralChain

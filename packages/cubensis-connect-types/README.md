<p align="center">
  <a href="https://decentralchain.io">
    <img src="https://avatars.githubusercontent.com/u/75630395?s=200" alt="DecentralChain" width="80" />
  </a>
</p>

<h3 align="center">@decentralchain/cubensis-connect-types</h3>

<p align="center">
  TypeScript type definitions for the CubensisConnect browser-extension API.
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@decentralchain/cubensis-connect-types"><img src="https://img.shields.io/npm/v/@decentralchain/cubensis-connect-types?color=blue" alt="npm" /></a>
  <a href="./LICENSE"><img src="https://img.shields.io/npm/l/@decentralchain/cubensis-connect-types" alt="license" /></a>
  <a href="https://bundlephobia.com/package/@decentralchain/cubensis-connect-types"><img src="https://img.shields.io/bundlephobia/minzip/@decentralchain/cubensis-connect-types" alt="bundle size" /></a>
  <a href="./package.json"><img src="https://img.shields.io/node/v/@decentralchain/cubensis-connect-types" alt="node" /></a>
</p>

---

## Overview

Zero-dependency, type-only package providing strict TypeScript types for the CubensisConnect browser extension API surface — authentication, state, all 15 transaction types, orders, custom data signing, and global Window augmentation.

**Part of the [DecentralChain](https://docs.decentralchain.io) SDK.**

## Installation

```bash
npm install --save-dev @decentralchain/cubensis-connect-types
```

> Requires **Node.js ≥ 24** (LTS).

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
| `npm run lint`              | Biome lint check (no auto-fix)                             |
| `npm run lint:fix`          | Biome lint with auto-fix                                   |
| `npm run format`            | Biome auto-format                                   |
| `npm run format:check`      | Biome format check (no writes)                             |
| `npm run test`              | Vitest type-level tests                                |
| `npm run test:watch`        | Tests in watch mode                                    |
| `npm run test:coverage`     | Tests with V8 coverage                                 |
| `npm run bulletproof`       | Format + lint fix + typecheck + test                   |
| `npm run bulletproof:check` | CI-safe: check format + lint + tc + test               |
| `npm run validate`          | Full CI pipeline (all checks + build + publish checks) |

## Related packages

| Package                                                                                                                | Description                      |
| ---------------------------------------------------------------------------------------------------------------------- | -------------------------------- |
| [`@decentralchain/cubensis-connect-provider`](https://www.npmjs.com/package/@decentralchain/cubensis-connect-provider) | CubensisConnect wallet provider  |
| [`@decentralchain/signer`](https://www.npmjs.com/package/@decentralchain/signer)                                       | Transaction signing orchestrator |
| [`@decentralchain/ts-types`](https://www.npmjs.com/package/@decentralchain/ts-types)                                   | Core TypeScript type definitions |

## Requirements

- **Node.js** ≥ 24 (LTS)
- **npm** ≥ 11

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md).

## Security

To report a vulnerability, see [SECURITY.md](./SECURITY.md).

## License

[MIT](./LICENSE) — Copyright (c) [DecentralChain](https://decentralchain.io)

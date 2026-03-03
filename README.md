# @decentralchain/cubensisconnect-types

[![CI](https://github.com/Decentral-America/cubensis-connect-types/actions/workflows/ci.yml/badge.svg)](https://github.com/Decentral-America/cubensis-connect-types/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/@decentralchain/cubensisconnect-types)](https://www.npmjs.com/package/@decentralchain/cubensisconnect-types)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

> TypeScript type definitions for the **CubensisConnect** browser-extension API.

## Installation

```bash
npm install --save-dev @decentralchain/cubensisconnect-types
```

## Usage

### Module imports (recommended)

```typescript
import type {
  ICubensisConnectApi,
  IAuthData,
  ISignTransactionResponse,
  TMoney,
} from '@decentralchain/cubensisconnect-types';
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

| Type                       | Description                                         |
| -------------------------- | --------------------------------------------------- |
| `TSignTransactionData`     | Union of all 15 transaction types                   |
| `ISignTransactionResponse` | Response from `signTransaction()`                   |
| `TSignRequestData`         | Union of sign-request transaction types             |
| `TTypedData`               | Typed-data entry (boolean, integer, string, binary) |

### Transaction Types

| Type                      | Tx ID |
| ------------------------- | ----- |
| `ISignIssueData`          | 3     |
| `ISignTransferData`       | 4     |
| `ISignReissueData`        | 5     |
| `ISignBurnData`           | 6     |
| `ISignLeaseData`          | 8     |
| `ISignCancelLeaseData`    | 9     |
| `ISignAliasData`          | 10    |
| `ISignMassTransferData`   | 11    |
| `ISignDataData`           | 12    |
| `ISignSetScriptData`      | 13    |
| `ISignSponsorshipData`    | 14    |
| `ISignSetAssetScriptData` | 15    |
| `ISignInvokeScriptData`   | 16    |

### Orders

| Type                 | Description                 |
| -------------------- | --------------------------- |
| `ISignOrderData`     | DEX order parameters        |
| `ISignOrderResponse` | Response from order signing |

### Custom Data

| Type                        | Description                     |
| --------------------------- | ------------------------------- |
| `ISignCustomDataParamsV1`   | Custom data signing params (v1) |
| `ISignCustomDataParamsV2`   | Custom data signing params (v2) |
| `ISignCustomDataResponseV1` | Custom data response (v1)       |
| `ISignCustomDataResponseV2` | Custom data response (v2)       |

### Common

| Type        | Description                       |
| ----------- | --------------------------------- |
| `TMoney`    | `string \| number` — asset amount |
| `TCallArgs` | Invoke-script call argument       |

## Scripts

| Script              | Purpose                               |
| ------------------- | ------------------------------------- |
| `npm run build`     | Compile with tsup (ESM + CJS + .d.ts) |
| `npm run typecheck` | `tsc --noEmit` strict type check      |
| `npm run lint`      | ESLint with type-aware rules          |
| `npm run format`    | Prettier format check                 |
| `npm run test`      | Vitest type-level tests               |
| `npm run validate`  | Full CI pipeline (all checks)         |

## Requirements

- **Node.js** ≥ 22 (recommended: 24)
- **npm** ≥ 11

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

## Security

See [SECURITY.md](./SECURITY.md) for reporting vulnerabilities.

## License

[MIT](./LICENSE) © 2026-present DecentralChain

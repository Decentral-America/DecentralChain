<p align="center">
  <a href="https://decentralchain.io">
    <img src="https://avatars.githubusercontent.com/u/75630395?s=200" alt="DecentralChain" width="80" />
  </a>
</p>

<h3 align="center">@decentralchain/ts-types</h3>

<p align="center">
  Shared TypeScript type definitions for the DecentralChain SDK.
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@decentralchain/ts-types"><img src="https://img.shields.io/npm/v/@decentralchain/ts-types?color=blue" alt="npm" /></a>
  <a href="./LICENSE"><img src="https://img.shields.io/npm/l/@decentralchain/ts-types" alt="license" /></a>
  <a href="https://bundlephobia.com/package/@decentralchain/ts-types"><img src="https://img.shields.io/bundlephobia/minzip/@decentralchain/ts-types" alt="bundle size" /></a>
  <a href="./package.json"><img src="https://img.shields.io/node/v/@decentralchain/ts-types" alt="node" /></a>
</p>

---

## Overview

Canonical TypeScript type definitions for the **DecentralChain SDK**. Provides strict, zero-dependency types for all 18 transaction types, exchange orders, data entries, invoke script calls, state changes, and blockchain primitives.

**Part of the [DecentralChain](https://docs.decentralchain.io) SDK.**

## Installation

```bash
npm install @decentralchain/ts-types
```

## Quick Start

```typescript
import { TRANSACTION_TYPE, DATA_FIELD_TYPE } from '@decentralchain/ts-types';

import type {
  Transaction,
  TransferTransaction,
  DataTransaction,
  DataTransactionEntry,
  Long,
} from '@decentralchain/ts-types';
```

## Exported Constants

### `TRANSACTION_TYPE`

| Key                 | Value |
| ------------------- | ----- |
| `GENESIS`           | 1     |
| `PAYMENT`           | 2     |
| `ISSUE`             | 3     |
| `TRANSFER`          | 4     |
| `REISSUE`           | 5     |
| `BURN`              | 6     |
| `EXCHANGE`          | 7     |
| `LEASE`             | 8     |
| `CANCEL_LEASE`      | 9     |
| `ALIAS`             | 10    |
| `MASS_TRANSFER`     | 11    |
| `DATA`              | 12    |
| `SET_SCRIPT`        | 13    |
| `SPONSORSHIP`       | 14    |
| `SET_ASSET_SCRIPT`  | 15    |
| `INVOKE_SCRIPT`     | 16    |
| `UPDATE_ASSET_INFO` | 17    |
| `ETHEREUM`          | 18    |

### `DATA_FIELD_TYPE`

| Key       | Value     |
| --------- | --------- |
| `INTEGER` | `integer` |
| `BOOLEAN` | `boolean` |
| `STRING`  | `string`  |
| `BINARY`  | `binary`  |

## Exported Types

### Transaction Types

Each transaction type has:

- **Base type**: `TransferTransaction<LONG>` — the unsigned transaction
- **Versioned types**: `TransferTransactionV1<LONG>`, `V2`, `V3`
- **From-node type**: `TransferTransactionFromNode<LONG>` — signed + API fields
- **Version map**: `TransferTransactionMap<LONG>` — maps version → type

Full list: `Genesis`, `Payment`, `Issue`, `Transfer`, `Reissue`, `Burn`,
`Exchange`, `Lease`, `CancelLease`, `Alias`, `MassTransfer`, `Data`,
`SetScript`, `Sponsorship`, `SetAssetScript`, `InvokeScript`,
`UpdateAssetInfo`, `Ethereum`.

### Aggregate Types

- `Transaction<LONG>` — union of all transaction types
- `TransactionMap<LONG>` — maps type ID → transaction type
- `TransactionVersionsMap<LONG>` — maps type ID → version map
- `TransactionFromNode<LONG>` — union of all from-node types
- `SignedTransaction<TX>` — adds `signature` or `proofs` based on version

### Primitives

- `Long` — `string | number`
- `Base64Script`, `Base58Bytes`, `Base64String` — string aliases
- `Proofs` — `Array<string>`
- `AssetDecimals` — `0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8`

### Data Entries

- `DataTransactionEntry<LONG>` — union of integer, string, binary, boolean, delete
- `DataTransactionEntryInteger<LONG>`, `...String`, `...Binary`, `...Boolean`
- `DataTransactionDeleteRequest`

### Exchange Orders

- `ExchangeTransactionOrder<LONG>` — union of V1–V4
- `ExchangeTransactionOrderV1` through `V4`
- `SignedIExchangeTransactionOrder<ORDER>`
- `ExchangeTransactionOrderByTx<TX>`

### Invoke Script

- `InvokeScriptCall<LONG>`, `InvokeScriptPayment<LONG>`
- `InvokeScriptCallArgument<LONG>` — union of all call argument types

### State Changes

- `TStateChanges` — full state change tree (data, transfers, issues, etc.)

### Mixins

- `WithId`, `WithApplicationStatus`, `WithApiMixin`, `WithVersion`

## Chain IDs

| Network | Byte | Char |
| ------- | ---- | ---- |
| Mainnet | 76   | L    |
| Testnet | 84   | T    |

## Development

```bash
npm install
npm run bulletproof        # format → lint → typecheck → test
npm run validate           # full quality gate (audit, build, publint, attw, size-limit)
```

## Related packages

| Package                                                                                                  | Description                          |
| -------------------------------------------------------------------------------------------------------- | ------------------------------------ |
| [`@decentralchain/transactions`](https://www.npmjs.com/package/@decentralchain/transactions)             | Transaction builders and signers     |
| [`@decentralchain/marshall`](https://www.npmjs.com/package/@decentralchain/marshall)                     | Binary serialization/deserialization |
| [`@decentralchain/data-entities`](https://www.npmjs.com/package/@decentralchain/data-entities)           | Asset, Money, and OrderPrice models  |
| [`@decentralchain/node-api-js`](https://www.npmjs.com/package/@decentralchain/node-api-js)               | Node REST API client                 |
| [`@decentralchain/money-like-to-node`](https://www.npmjs.com/package/@decentralchain/money-like-to-node) | Money-like to node format converter  |

## Security

See [SECURITY.md](./SECURITY.md) for vulnerability reporting.

This package has **zero production dependencies** and executes no runtime code beyond
compile-time constant definitions. Attack surface is limited to supply-chain integrity,
which is mitigated by npm provenance signing.

## License

[MIT](./LICENSE) — Copyright (c) [DecentralChain](https://decentralchain.io)

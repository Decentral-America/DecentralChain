# @decentralchain/ts-types

<p align="center">
  <strong>Canonical TypeScript type definitions for the DecentralChain blockchain platform.</strong>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@decentralchain/ts-types"><img src="https://img.shields.io/npm/v/@decentralchain/ts-types" alt="npm version" /></a>
  <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-5.9%2B-blue" alt="TypeScript 5.9+" /></a>
  <a href="./LICENSE"><img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License: MIT" /></a>
  <a href="https://nodejs.org/"><img src="https://img.shields.io/badge/Node.js-%E2%89%A5%2022-green" alt="Node.js ≥ 22" /></a>
  <a href="https://www.npmjs.com/package/@decentralchain/ts-types"><img src="https://img.shields.io/badge/dependencies-0-brightgreen" alt="Zero Dependencies" /></a>
  <a href="https://www.npmjs.com/package/@decentralchain/ts-types"><img src="https://img.shields.io/badge/bundle%20size-%3C%2010%20kB-blue" alt="Bundle Size < 10 kB" /></a>
  <a href="https://github.com/Decentral-America/ts-types/issues"><img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg" alt="PRs Welcome" /></a>
</p>

---

**`@decentralchain/ts-types`** provides strict, zero-dependency TypeScript types for the entire **DecentralChain** blockchain protocol — covering all 18 transaction types, exchange orders, data entries, invoke script calls, state changes, and core blockchain primitives. It serves as the **single source of truth** for type definitions across the DecentralChain SDK ecosystem.

---

## Table of Contents

- [Why @decentralchain/ts-types?](#why-decentralchaints-types)
- [How It Works with DecentralChain](#how-it-works-with-decentralchain)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Usage Examples](#usage-examples)
- [Architecture](#architecture)
- [Exported Constants](#exported-constants)
- [Exported Types](#exported-types)
- [Chain IDs](#chain-ids)
- [Ecosystem Integration](#ecosystem-integration)
- [Compatibility](#compatibility)
- [Development](#development)
- [Contributing](#contributing)
- [Security](#security)
- [License](#license)

---

## Why @decentralchain/ts-types?

| Feature                         | Detail                                                                                                                                                                       |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 🔒 **Type Safety**              | Strict types for all 18 DecentralChain transaction types with full version coverage — catch errors at compile time, not in production.                                       |
| 📦 **Zero Dependencies**        | No runtime dependencies. No transitive supply-chain risk. Just types and compile-time constants.                                                                             |
| 🪶 **Lightweight**              | Under 10 kB bundled. Adds virtually zero overhead to your project.                                                                                                           |
| 🔗 **Single Source of Truth**   | The canonical type definitions shared by all `@decentralchain/*` SDK packages.                                                                                               |
| 🧩 **Generic `LONG` Parameter** | Flexible numeric handling — use `string`, `number`, or a BigInt wrapper depending on your application's precision needs.                                                     |
| ✅ **Enterprise-Grade Quality** | Maximally strict TypeScript config, 90%+ test coverage, `publint` + `@arethetypeswrong/cli` validation, size-limit enforcement, and npm provenance signing on every release. |
| 🌐 **ESM-First**                | Modern ECMAScript Module output with full `package.json` `exports` field support.                                                                                            |

---

## How It Works with DecentralChain

DecentralChain is a high-performance blockchain platform designed for decentralized applications (dApps), digital asset management, and smart contract execution. The platform supports a rich set of on-chain operations — from simple token transfers to complex smart contract invocations and decentralized exchange orders.

**`@decentralchain/ts-types`** is the **foundational type layer** of the DecentralChain TypeScript SDK. It defines the exact shape of every data structure that flows between your application and the DecentralChain blockchain:

```
┌─────────────────────────────────────────────────────────────┐
│                    Your Application                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   @decentralchain/ts-types    ◄── You are here             │
│   (Type definitions & constants)                            │
│                                                             │
│   @decentralchain/ts-lib-crypto                             │
│   (Cryptographic operations)                                │
│                                                             │
│   @decentralchain/transactions                              │
│   (Transaction building & signing)                          │
│                                                             │
│   @decentralchain/node-api-js                               │
│   (Node REST API client)                                    │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│              DecentralChain Blockchain Network               │
│        Mainnet (L) · Testnet (T) · Custom networks          │
└─────────────────────────────────────────────────────────────┘
```

### What this package provides

- **Transaction type definitions** — Typed structures for all 18 transaction types (Genesis, Transfer, InvokeScript, Exchange, etc.), including per-version variants and node API response shapes.
- **Data entry types** — Typed representations of key-value data stored on-chain (integer, boolean, string, binary, and delete operations).
- **Exchange order types** — Full order book types (V1–V4) for the DecentralChain decentralized exchange (DEX).
- **Invoke script types** — Typed function calls and payment arguments for dApp smart contract invocations.
- **State change types** — Complete state change trees returned by the node after smart contract execution.
- **Blockchain primitives** — Base58/Base64 encoded strings, proofs arrays, asset decimals, and the flexible `Long` type for handling large numeric values.

### How the SDK packages work together

1. **`@decentralchain/ts-types`** defines _what_ a transaction looks like (structure, fields, versions).
2. **`@decentralchain/transactions`** uses these types to _build and sign_ transactions client-side.
3. **`@decentralchain/ts-lib-crypto`** provides the cryptographic primitives (key pairs, signatures, hashing) needed for signing.
4. **`@decentralchain/node-api-js`** sends the signed transactions to a DecentralChain node and returns typed responses using `FromNode` variants defined in this package.

By sharing a single set of canonical types, the entire SDK ensures **end-to-end type safety** — from transaction construction in your IDE to the JSON response returned by the blockchain node.

---

## Installation

```bash
npm install @decentralchain/ts-types
```

> **Note:** This is a types-and-constants package. It has **zero production dependencies** and adds minimal footprint to your `node_modules`.

---

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

---

## Usage Examples

### Building a Transfer Transaction

```typescript
import { TRANSACTION_TYPE } from '@decentralchain/ts-types';
import type { TransferTransaction, Long } from '@decentralchain/ts-types';

// Define a transfer transaction with compile-time type checking
const transfer: TransferTransaction<Long> = {
  type: TRANSACTION_TYPE.TRANSFER,
  version: 3,
  senderPublicKey: '7GGPvAPV3Gmxo4eswmBRLb6bXXEhAFPkCrKJiVrr3NTv',
  recipient: '3N3Cn2pYtqzj7N9pviSesNe8KG9Cmb718Y1',
  amount: 100_000_000, // 1 DCC (8 decimals)
  assetId: null, // native DCC token
  feeAssetId: null,
  fee: 100_000,
  attachment: '',
  timestamp: Date.now(),
};
```

### Working with Data Entries

```typescript
import { DATA_FIELD_TYPE } from '@decentralchain/ts-types';
import type {
  DataTransactionEntry,
  DataTransactionEntryInteger,
  DataTransactionEntryString,
} from '@decentralchain/ts-types';

// Type-safe data entries for on-chain key-value storage
const entries: DataTransactionEntry<number>[] = [
  { type: DATA_FIELD_TYPE.INTEGER, key: 'score', value: 42 },
  { type: DATA_FIELD_TYPE.STRING, key: 'name', value: 'Alice' },
  { type: DATA_FIELD_TYPE.BOOLEAN, key: 'active', value: true },
];
```

### Typing Node API Responses

```typescript
import type { TransferTransactionFromNode, Long } from '@decentralchain/ts-types';

// The FromNode types match the exact shape returned by the DecentralChain REST API
async function getTransaction(
  nodeUrl: string,
  txId: string,
): Promise<TransferTransactionFromNode<Long>> {
  const res = await fetch(`${nodeUrl}/transactions/info/${txId}`);
  return res.json() as Promise<TransferTransactionFromNode<Long>>;
}
```

### Type-Safe Transaction Routing

```typescript
import { TRANSACTION_TYPE } from '@decentralchain/ts-types';
import type { TransactionFromNode, Long } from '@decentralchain/ts-types';

function handleTransaction(tx: TransactionFromNode<Long>) {
  switch (tx.type) {
    case TRANSACTION_TYPE.TRANSFER:
      console.log(`Transfer of ${tx.amount} to ${tx.recipient}`);
      break;
    case TRANSACTION_TYPE.DATA:
      console.log(`Data tx with ${tx.data.length} entries`);
      break;
    case TRANSACTION_TYPE.INVOKE_SCRIPT:
      console.log(`Invoke on dApp ${tx.dApp}`);
      break;
    // TypeScript narrows the type in each branch automatically
  }
}
```

---

## Architecture

The package is organised into three focused modules, re-exported through a single barrel entry point:

```
src/
├── index.ts            Barrel entry — re-exports everything
├── constants.ts        Runtime constants (transaction type IDs, data field types)
├── parts.ts            Primitives, exchange orders, state changes, mixins
└── transactions.ts     All 18 transaction types with versioned & from-node variants
```

| Module            | Exports                                                                      | Purpose                                                                                   |
| ----------------- | ---------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `constants.ts`    | `TRANSACTION_TYPE`, `DATA_FIELD_TYPE`, individual type constants             | Compile-time constant values used for discriminated unions and transaction identification |
| `parts.ts`        | `Long`, `Proofs`, `Base58Bytes`, exchange order types, state changes, mixins | Shared primitives and utility types consumed by transaction definitions                   |
| `transactions.ts` | Per-transaction types, aggregate unions, version maps, from-node types       | Complete transaction type hierarchy for all 18 DecentralChain operations                  |

> **Design principle:** The generic `LONG` parameter threads through every type that contains a numeric amount or fee. This lets consumers choose their numeric representation — `number` for simplicity, `string` for JSON-safe precision, or a custom BigInt wrapper for arithmetic — without sacrificing type safety.

---

## Exported Constants

### `TRANSACTION_TYPE`

| Key                 | Value | Description                                  |
| ------------------- | ----- | -------------------------------------------- |
| `GENESIS`           | 1     | Network bootstrap transaction                |
| `PAYMENT`           | 2     | Simple payment (legacy)                      |
| `ISSUE`             | 3     | Create a new token / asset                   |
| `TRANSFER`          | 4     | Transfer tokens between accounts             |
| `REISSUE`           | 5     | Increase token supply                        |
| `BURN`              | 6     | Permanently destroy tokens                   |
| `EXCHANGE`          | 7     | DEX order matching                           |
| `LEASE`             | 8     | Lease DCC for staking                        |
| `CANCEL_LEASE`      | 9     | Cancel an active lease                       |
| `ALIAS`             | 10    | Create a human-readable address alias        |
| `MASS_TRANSFER`     | 11    | Batch transfer to multiple recipients        |
| `DATA`              | 12    | Store key-value data on-chain                |
| `SET_SCRIPT`        | 13    | Deploy / remove an account script            |
| `SPONSORSHIP`       | 14    | Sponsor transaction fees with a custom token |
| `SET_ASSET_SCRIPT`  | 15    | Set a script on an issued asset              |
| `INVOKE_SCRIPT`     | 16    | Call a dApp smart contract function          |
| `UPDATE_ASSET_INFO` | 17    | Update token name or description             |
| `ETHEREUM`          | 18    | Ethereum-compatible transaction              |

### `DATA_FIELD_TYPE`

| Key       | Value     | Description                                   |
| --------- | --------- | --------------------------------------------- |
| `INTEGER` | `integer` | 64-bit signed integer                         |
| `BOOLEAN` | `boolean` | Boolean flag                                  |
| `STRING`  | `string`  | UTF-8 string (max 32,767 bytes)               |
| `BINARY`  | `binary`  | Base64-encoded binary data (max 32,767 bytes) |

---

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

---

## Chain IDs

DecentralChain uses a single-byte chain ID to distinguish between networks, preventing accidental cross-network transaction replay.

| Network | Byte | Char | Description                                          |
| ------- | ---- | ---- | ---------------------------------------------------- |
| Mainnet | 76   | L    | Production network for real assets and transactions  |
| Testnet | 84   | T    | Testing environment with free tokens for development |

---

## Ecosystem Integration

`@decentralchain/ts-types` is designed to integrate seamlessly with the broader DecentralChain SDK ecosystem:

| Package                                                                               | Role                           | Depends on ts-types |
| ------------------------------------------------------------------------------------- | ------------------------------ | ------------------- |
| [`@decentralchain/ts-types`](https://github.com/Decentral-America/ts-types)           | Type definitions & constants   | —                   |
| [`@decentralchain/transactions`](https://github.com/Decentral-America/transactions)   | Transaction building & signing | ✅                  |
| [`@decentralchain/ts-lib-crypto`](https://github.com/Decentral-America/ts-lib-crypto) | Cryptographic operations       | ✅                  |
| [`@decentralchain/node-api-js`](https://github.com/Decentral-America/node-api-js)     | Node REST API client           | ✅                  |

> **Tip:** If you are building a dApp or backend service that interacts with DecentralChain, install `@decentralchain/transactions` — it re-exports all types from this package and adds transaction construction and signing utilities.

---

## Compatibility

| Requirement       | Minimum Version                  |
| ----------------- | -------------------------------- |
| **TypeScript**    | 5.9+                             |
| **Node.js**       | 22+                              |
| **Module System** | ESM (`"type": "module"`)         |
| **Bundle Format** | `.mjs` with `.d.ts` declarations |

This package ships as **ESM-only** with full `package.json` `exports` field support. It is compatible with all modern bundlers (Vite, esbuild, Rollup, webpack 5+) and runtimes (Node.js, Deno, Bun).

---

## Development

```bash
npm install
npm run bulletproof        # format → lint → typecheck → test
npm run validate           # full quality gate (audit, build, publint, attw, size-limit)
```

### Available Scripts

| Script                  | Description                                                                   |
| ----------------------- | ----------------------------------------------------------------------------- |
| `npm run build`         | Build the package with tsup (ESM output)                                      |
| `npm run typecheck`     | Run the TypeScript compiler in check-only mode                                |
| `npm run lint`          | Lint and auto-fix with ESLint (strict + type-checked rules)                   |
| `npm run format`        | Format with Prettier                                                          |
| `npm test`              | Run the test suite with Vitest                                                |
| `npm run test:coverage` | Run tests with coverage reporting (90% threshold)                             |
| `npm run bulletproof`   | Full quality pipeline: format → lint → typecheck → test                       |
| `npm run validate`      | Release-grade gate: audit → bulletproof → build → publint → attw → size-limit |

---

## Contributing

We welcome contributions from the community! Please read our [Contributing Guide](./CONTRIBUTING.md) for details on the development workflow, coding standards, and pull request process.

See also:

- [Code of Conduct](./CODE_OF_CONDUCT.md)
- [Security Policy](./SECURITY.md)
- [Changelog](./CHANGELOG.md)

---

## Security

See [SECURITY.md](./SECURITY.md) for vulnerability reporting.

This package has **zero production dependencies** and executes no runtime code beyond
compile-time constant definitions. Attack surface is limited to supply-chain integrity,
which is mitigated by npm provenance signing.

---

## License

[MIT](./LICENSE) — Copyright © 2025 DecentralChain

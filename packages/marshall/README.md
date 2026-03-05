<p align="center">
  <a href="https://decentralchain.io">
    <img src="https://avatars.githubusercontent.com/u/75630395?s=200" alt="DecentralChain" width="80" />
  </a>
</p>

<h3 align="center">@decentralchain/marshall</h3>

<p align="center">
  Serialize and parse DecentralChain blockchain data structures.
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@decentralchain/marshall"><img src="https://img.shields.io/npm/v/@decentralchain/marshall?color=blue" alt="npm" /></a>
  <a href="./LICENSE"><img src="https://img.shields.io/npm/l/@decentralchain/marshall" alt="license" /></a>
  <a href="https://bundlephobia.com/package/@decentralchain/marshall"><img src="https://img.shields.io/bundlephobia/minzip/@decentralchain/marshall" alt="bundle size" /></a>
  <a href="./package.json"><img src="https://img.shields.io/node/v/@decentralchain/marshall" alt="node" /></a>
</p>

---

## Overview

Marshall provides binary serialization/deserialization and JSON conversion for DecentralChain transactions and orders. It handles 64-bit LONG values safely and supports custom big-number converters for libraries like `long` or `bignumber.js`.

**Part of the [DecentralChain](https://docs.decentralchain.io) SDK.**

### Why Marshall?

When working with the DecentralChain blockchain, every transaction must be serialized into a precise binary format before it can be signed and broadcast to the network. JavaScript's native `number` type cannot safely represent the 64-bit integers used throughout the protocol (timestamps, amounts, fees). Marshall solves both problems:

- **Schema-driven serialization** — Each transaction type and version has a declarative schema that defines its binary layout, ensuring byte-perfect encoding that DecentralChain nodes accept.
- **Safe 64-bit integer handling** — LONG fields are represented as strings by default, with pluggable converters for libraries like [`long`](https://www.npmjs.com/package/long) or [`bignumber.js`](https://www.npmjs.com/package/bignumber.js).
- **Round-trip fidelity** — `serialize → parse` and `stringify → parse` preserve all field values exactly, including proofs, scripts, and nested structures.

### Key Features

| Feature                           | Description                                                                                                           |
| --------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| 🔄 **Binary Serialization**       | Convert transactions and orders to/from the compact binary format used by DecentralChain nodes                        |
| 📋 **JSON Marshalling**           | Safe JSON stringify/parse with big-number-aware encoding to prevent precision loss                                    |
| 🔐 **All Transaction Types**      | Full support for all 16 DecentralChain transaction types (see [Supported Transactions](#supported-transaction-types)) |
| 📦 **DEX Order Support**          | Serialize and parse decentralized exchange orders (v1, v2, v3)                                                        |
| 🧩 **Pluggable LONG Handling**    | Provide your own converter for 64-bit values — works with `Long.js`, `BigNumber.js`, or any custom implementation     |
| 🏗️ **Schema-Driven Architecture** | Declarative schemas make the library easy to extend and audit                                                         |
| 🪶 **Lightweight**                | < 11 kB minified + gzipped — no heavy dependencies                                                                    |
| 🔒 **Type-Safe**                  | Written in strict TypeScript with full type definitions exported                                                      |
| 📦 **Pure ESM**                   | Modern ES module package with tree-shaking support                                                                    |

---

## Table of Contents

- [Overview](#overview)
- [Requirements](#requirements)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Usage Examples](#usage-examples)
- [Supported Transaction Types](#supported-transaction-types)
- [Architecture](#architecture)
- [API Reference](#api-reference)
- [Development](#development)
- [Contributing](#contributing)
- [Security](#security)
- [License](#license)

---

## Requirements

- **Node.js** >= 24
- **npm** >= 11

## Installation

```bash
npm install @decentralchain/marshall
```

## Quick Start

```typescript
import { binary, json } from '@decentralchain/marshall';

const tx = {
  type: 10,
  version: 2,
  fee: 100000,
  senderPublicKey: '7GGPvAPV3Gmxo4eswmBRLb6bXXEhAovPinfcwVkA2LJh',
  timestamp: 1542539421565,
  id: '1bVuFdMbDAk6dhcQFfJFxpDjmm8DdFnnKesQ3wpxj7P',
  proofs: [
    '5cW1Ej6wFRK1XpMm3daCWjiSXaKGYfL7bmspZjzATXrNYjRVxZJQVJsDU7ZVcxNXcKJ39fhjxv3rSu4ovPT3Fau8',
  ],
  alias: 'MyTestAlias',
};

// Binary converter
const bytes = binary.serializeTx(tx);
const txb = binary.parseTx(bytes);

// JSON converter
const jsonString = json.stringifyTx(tx);
const txj = json.parseTx(jsonString);
```

---

## Usage Examples

### Serializing a Transfer Transaction

```typescript
import { binary } from '@decentralchain/marshall';

const transferTx = {
  type: 4,
  version: 2,
  senderPublicKey: '7GGPvAPV3Gmxo4eswmBRLb6bXXEhAovPinfcwVkA2LJh',
  assetId: null,
  feeAssetId: null,
  timestamp: 1640000000000,
  amount: 1000000000, // 10.00000000 DCC (amount × 10^8)
  fee: 100000,
  recipient: '3N9Q2sdkRod544ax1R3bDhYBN3LjCeQi6pw',
  attachment: '',
};

// Serialize to binary for signing and broadcasting
const bytes = binary.serializeTx(transferTx);

// Parse binary back to a transaction object
const parsed = binary.parseTx(bytes);
```

### Working with DEX Orders

```typescript
import { binary, json } from '@decentralchain/marshall';

const order = {
  version: 3,
  senderPublicKey: '7GGPvAPV3Gmxo4eswmBRLb6bXXEhAovPinfcwVkA2LJh',
  matcherPublicKey: '8QUAqtTckM5B8gvcuP7mMswat9SjKUuafJMusEoSn1Gy',
  assetPair: {
    amountAsset: '8LQW8f7P5d5PZM7GtZEBgaqRPGSzS3DfPuiXrURJ4AJS',
    priceAsset: null, // DCC
  },
  orderType: 'buy',
  price: 100000000,
  amount: 50000000,
  timestamp: 1640000000000,
  expiration: 1640086400000,
  matcherFee: 300000,
  matcherFeeAssetId: null,
};

// Serialize order for signing
const orderBytes = binary.serializeOrder(order);

// JSON round-trip
const orderJson = json.stringifyOrder(order);
const parsedOrder = json.parseOrder(orderJson);
```

### Safe JSON Handling for Large Numbers

DecentralChain uses 64-bit integers for amounts, fees, and timestamps. Standard `JSON.parse` loses precision for values larger than `Number.MAX_SAFE_INTEGER`. Marshall's JSON methods handle this safely:

```typescript
import { json } from '@decentralchain/marshall';

// Large values are preserved as strings to avoid precision loss
const txJson = json.stringifyTx(tx);
const parsed = json.parseTx(txJson);
// parsed.timestamp is a string: "1542539421565"
```

### Using Custom LONG Converters

Marshall represents blockchain LONG values (64-bit integers) as strings by default. You can provide custom converters:

```typescript
import { binary, json } from '@decentralchain/marshall';
import Long from 'long';

// Parse with Long.js instances
const tx = binary.parseTx(bytes, Long.fromString);

// Parse JSON with Long.js instances
const txFromJson = json.parseTx(jsonString, Long.fromString);
```

### Converting LONG Fields in Existing Objects

```typescript
import { convertTxLongFields } from '@decentralchain/marshall';
import Long from 'long';

// Convert all LONG fields in a parsed transaction from strings to Long instances
const converted = convertTxLongFields(parsedTx, Long.fromString);
```

---

## Supported Transaction Types

Marshall supports all DecentralChain transaction types. Each type has versioned schemas that define its exact binary layout:

| Type ID | Transaction          | Versions | Description                                                                  |
| ------- | -------------------- | -------- | ---------------------------------------------------------------------------- |
| 1       | **Genesis**          | —        | Initial token distribution at chain launch                                   |
| 2       | **Payment**          | —        | Legacy payment (superseded by Transfer)                                      |
| 3       | **Issue**            | v2       | Create a new token on the DecentralChain network                             |
| 4       | **Transfer**         | v2       | Transfer tokens (DCC or custom assets) between accounts                      |
| 5       | **Reissue**          | v2       | Increase the supply of an existing token                                     |
| 6       | **Burn**             | v2       | Permanently destroy tokens, reducing supply                                  |
| 7       | **Exchange**         | v1, v2   | DEX order matching — executes trades between buy/sell orders                 |
| 8       | **Lease**            | v2       | Lease DCC to a node operator for staking rewards                             |
| 9       | **Cancel Lease**     | v2       | Cancel an active lease                                                       |
| 10      | **Alias**            | v2       | Create a human-readable alias for an account address                         |
| 11      | **Mass Transfer**    | v1       | Transfer tokens to multiple recipients in a single transaction               |
| 12      | **Data**             | v1       | Store key-value data on the blockchain (integers, booleans, strings, binary) |
| 13      | **Set Script**       | v1       | Deploy or remove a RIDE smart contract on an account                         |
| 14      | **Sponsorship**      | v1       | Enable fee sponsorship — pay transaction fees in a custom token              |
| 15      | **Set Asset Script** | v1       | Attach or update a script on an issued asset                                 |
| 16      | **Invoke Script**    | v1       | Call a function on a dApp smart contract with optional payments              |

### DEX Order Versions

| Version | Features                                                           |
| ------- | ------------------------------------------------------------------ |
| **v1**  | Base order format with asset pair, price, amount, and expiration   |
| **v2**  | Adds explicit version byte and proof-based authentication          |
| **v3**  | Adds `matcherFeeAssetId` — pay matcher fees in any supported token |

---

## Architecture

Marshall uses a **schema-driven architecture** where each transaction type and version is described by a declarative schema. This design makes the serialization logic auditable, extensible, and consistent.

```
┌─────────────────────────────────────────────────────────┐
│                    @decentralchain/marshall              │
├─────────────────────────────────────────────────────────┤
│                                                         │
│   ┌──────────┐     ┌──────────────┐     ┌──────────┐   │
│   │  binary   │     │   schemas    │     │   json   │   │
│   │          │     │              │     │          │   │
│   │ serialize │◄───►│  Transaction │◄───►│ stringify│   │
│   │ parse    │     │  & Order     │     │ parse    │   │
│   └────┬─────┘     │  Definitions │     └────┬─────┘   │
│        │           └──────────────┘          │         │
│        ▼                                     ▼         │
│   ┌──────────────────────────────────────────────┐     │
│   │            Primitive Encoders/Decoders        │     │
│   │  BYTE · SHORT · INT · LONG · STRING          │     │
│   │  BASE58 · BASE64 · ADDRESS · SCRIPT          │     │
│   └──────────────────────────────────────────────┘     │
│                                                         │
│   ┌──────────────────────────────────────────────┐     │
│   │            Utilities                          │     │
│   │  base58 · concat · parseJsonBigNumber         │     │
│   └──────────────────────────────────────────────┘     │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**How it works with DecentralChain:**

1. **Your application** constructs a transaction object (e.g., a transfer with recipient, amount, and fee).
2. **Marshall serializes** the transaction into the exact binary format specified by the DecentralChain protocol, using the appropriate schema for the transaction type and version.
3. **Your application signs** the binary bytes using the sender's private key (typically via [`@decentralchain/ts-lib-crypto`](https://github.com/Decentral-America/ts-lib-crypto) or a similar library).
4. **The signed transaction** is broadcast to a DecentralChain node via its REST API.
5. When **reading from the blockchain**, Marshall parses binary data or JSON responses back into JavaScript objects, safely handling all 64-bit integer fields.

---

## API Reference

### Binary

- `binary.serializeTx(tx)` — Serialize a transaction to binary bytes
- `binary.parseTx(bytes, toLongConverter?)` — Parse binary bytes back to a transaction object
- `binary.serializeOrder(order)` — Serialize a DEX order to binary bytes
- `binary.parseOrder(bytes, toLongConverter?)` — Parse binary bytes back to an order object

### JSON

- `json.stringifyTx(tx, fromLongConverter?)` — Convert a transaction to a JSON string (safe for large numbers)
- `json.parseTx(str, toLongConverter?)` — Parse a JSON string to a transaction object
- `json.stringifyOrder(order, fromLongConverter?)` — Convert an order to a JSON string
- `json.parseOrder(str, toLongConverter?)` — Parse a JSON string to an order object

### Low-Level API

For advanced use cases, Marshall also exports the building blocks used internally:

- **`schemas`** — Transaction and order schema definitions (useful for introspection or building custom serializers)
- **`serializePrimitives`** — Individual encoders: `BYTE`, `SHORT`, `INT`, `LONG`, `STRING`, `BASE58_STRING`, `BASE64_STRING`, `BOOL`, `SCRIPT`, `ADDRESS_OR_ALIAS`
- **`parsePrimitives`** — Individual decoders matching each primitive encoder
- **`convertLongFields(obj, schema, converter)`** — Recursively convert all LONG fields in a parsed object
- **`convertTxLongFields(tx, converter)`** — Convert LONG fields in a transaction using its schema

---

## Development

### Prerequisites

- **Node.js** >= 24 (see `.node-version`)
- **npm** >= 11

### Setup

```bash
git clone https://github.com/Decentral-America/marshall.git
cd marshall
npm install
```

### Scripts

| Command                     | Description                              |
| --------------------------- | ---------------------------------------- |
| `npm run build`             | Build distribution files (ESM)           |
| `npm test`                  | Run tests with Vitest                    |
| `npm run test:watch`        | Tests in watch mode                      |
| `npm run test:coverage`     | Tests with V8 coverage                   |
| `npm run typecheck`         | TypeScript type checking                 |
| `npm run lint`              | ESLint                                   |
| `npm run lint:fix`          | ESLint with auto-fix                     |
| `npm run format`            | Format with Prettier                     |
| `npm run validate`          | Full CI validation pipeline              |
| `npm run bulletproof`       | Format + lint fix + typecheck + test     |
| `npm run bulletproof:check` | CI-safe: check format + lint + tc + test |

### Quality Gates

All of the following checks must pass for a contribution to be accepted:

```bash
npm run format:check    # No formatting issues
npm run lint            # No lint errors
npm run typecheck       # No type errors
npm run test            # All tests pass
npm run build           # Clean build
npm run check:publint   # Package structure valid
npm run check:exports   # Type exports valid
npm run check:size      # Within size budget (< 11 kB)
```

---

## Related packages

| Package | Description |
| --- | --- |
| [`@decentralchain/ts-types`](https://www.npmjs.com/package/@decentralchain/ts-types) | Core TypeScript type definitions |
| [`@decentralchain/transactions`](https://www.npmjs.com/package/@decentralchain/transactions) | Transaction builders and signers |
| [`@decentralchain/protobuf-serialization`](https://www.npmjs.com/package/@decentralchain/protobuf-serialization) | Protocol Buffers serialization |
| [`@decentralchain/node-api-js`](https://www.npmjs.com/package/@decentralchain/node-api-js) | Node REST API client |
| [`@decentralchain/bignumber`](https://www.npmjs.com/package/@decentralchain/bignumber) | Arbitrary-precision arithmetic |

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md).

## Security

To report a vulnerability, see [SECURITY.md](./SECURITY.md).

## License

[MIT](./LICENSE) — Copyright (c) [DecentralChain](https://decentralchain.io)

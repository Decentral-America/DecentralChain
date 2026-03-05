<div align="center">

# @decentralchain/signer

**Transaction Signing Orchestrator for the DecentralChain Blockchain**

[![npm version](https://img.shields.io/npm/v/@decentralchain/signer?color=0366d6&label=npm)](https://www.npmjs.com/package/@decentralchain/signer)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D24-339933?logo=node.js&logoColor=white)](https://nodejs.org/)

Connect any provider to sign and broadcast transactions on the [DecentralChain](https://decentralchain.io) network — without ever exposing user seeds or private keys.

---

</div>

## Why @decentralchain/signer?

Building decentralized applications on DecentralChain requires a secure, reliable way to create, sign, and broadcast blockchain transactions. `@decentralchain/signer` is the official transaction orchestration layer that bridges your dApp with the DecentralChain network, providing:

- **🔐 Zero-Knowledge Signing** — Your application never touches private keys. All cryptographic operations are delegated to an isolated Provider, keeping user credentials safe.
- **🔌 Provider-Agnostic Architecture** — Swap signing backends (browser extensions, hardware wallets, custodial services, seed-based signers) without changing a single line of application code.
- **✅ Built-in Validation** — Every transaction is validated against DecentralChain protocol rules before it reaches the Provider, catching errors early and reducing failed broadcasts.
- **📡 Integrated Broadcasting** — Sign-then-broadcast or sign-and-broadcast in a single fluent call, with optional confirmation tracking.
- **🔗 Fluent Pipeline API** — Chain multiple transactions together and sign or broadcast them as a batch with an intuitive, type-safe API.
- **🛡️ Enterprise-Grade Error Handling** — Structured error codes with detailed diagnostics make debugging straightforward in production environments.

## Features

| Feature | Description |
|:--------|:------------|
| **Full Transaction Support** | All 14 DecentralChain transaction types (transfer, invoke, issue, lease, data, and more) |
| **Type-Safe** | Written in TypeScript with complete type definitions for every transaction and response |
| **Fluent API** | Chainable methods — `.transfer(...).sign()` or `.transfer(...).broadcast()` |
| **Batch Operations** | Sign and broadcast multiple transactions in a single call |
| **Event System** | Subscribe to `login` / `logout` events for reactive UI updates |
| **Confirmation Tracking** | Wait for a specific number of block confirmations before resolving |
| **Message & Order Signing** | Sign arbitrary messages, typed data, and DEX orders |
| **Configurable Logging** | Three log levels (`verbose`, `production`, `error`) for development and production |
| **Lightweight** | Zero heavy dependencies — built on the official DecentralChain SDK packages |

## Table of Contents

- [Why @decentralchain/signer?](#why-decentralchainsigner)
- [Features](#features)
- [Overview](#overview)
- [How It Works with DecentralChain](#how-it-works-with-decentralchain)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Constructor](#constructor)
- [Methods](#methods)
  - [User Info](#user-info)
  - [Create Transactions](#create-transactions)
  - [Broadcast & Utilities](#broadcast--utilities)
- [Provider Interface](#provider-interface)
- [Security Model](#security-model)
- [Error Codes](#error-codes)
- [DecentralChain Ecosystem](#decentralchain-ecosystem)
- [Contributing](#contributing)
- [Support](#support)
- [License](#license)

## Overview

`@decentralchain/signer` is a TypeScript library that orchestrates transaction signing on behalf of users. It delegates the actual signing to an external **Provider** — a separate package that securely stores the user's private key or seed phrase.

Your application and Signer itself never have access to the user's private data. The Provider authenticates the user and generates digital signatures. Signer validates transaction arguments, manages the provider lifecycle, and broadcasts signed transactions to the blockchain.

### Architecture

```
┌───────────────┐      ┌───────────────┐      ┌──────────────────┐
│  Your dApp    │─────▶│    Signer     │─────▶│    Provider      │
│               │      │  (validates,  │      │  (signs tx with  │
│               │      │   broadcasts) │      │   user's key)    │
└───────────────┘      └───────────────┘      └──────────────────┘
                              │
                              ▼
                   ┌──────────────────┐
                   │  DecentralChain  │
                   │   Node / API     │
                   └──────────────────┘
```

### Restrictions

Signer supports all transaction types except Update Asset Info.

## How It Works with DecentralChain

DecentralChain is a high-performance blockchain platform designed for decentralized applications, digital assets, and smart contracts. `@decentralchain/signer` acts as the critical middleware between your application and the DecentralChain network:

1. **Node Connection** — When you instantiate Signer with a `NODE_URL` (e.g. `https://nodes.decentralchain.io`), it connects to a DecentralChain node and automatically detects the network byte (Mainnet, Testnet, or custom network).

2. **Provider Authentication** — The connected Provider handles user authentication. The user's private key never leaves the Provider boundary. Signer receives only the user's **public key** and **address**.

3. **Transaction Lifecycle** — When your dApp calls a transaction method (e.g. `signer.transfer(...)`), the following happens:
   - Signer **validates** the transaction parameters against DecentralChain protocol rules
   - Signer forwards the validated transaction to the **Provider** for signing
   - The Provider returns the **signed transaction** (with cryptographic proofs)
   - Signer **broadcasts** the signed transaction to the DecentralChain node via the Node REST API
   - Optionally, Signer **waits** for the transaction to be confirmed on-chain

4. **Balance & Asset Queries** — Signer queries the DecentralChain Node API to retrieve DCC balances, asset information, sponsorship data, and other on-chain state.

5. **Network Compatibility** — Signer works with any DecentralChain-compatible network. Point `NODE_URL` to a Mainnet node, Testnet node, or your own private network node.

```
  Your dApp                  Signer                    Provider              DecentralChain Node
     │                         │                          │                         │
     │  transfer({...})        │                          │                         │
     │────────────────────────▶│                          │                         │
     │                         │  validate params         │                         │
     │                         │─────────┐                │                         │
     │                         │◀────────┘                │                         │
     │                         │                          │                         │
     │                         │  sign(tx)                │                         │
     │                         │─────────────────────────▶│                         │
     │                         │                          │  sign with private key  │
     │                         │                          │─────────┐               │
     │                         │                          │◀────────┘               │
     │                         │  signedTx (with proofs)  │                         │
     │                         │◀─────────────────────────│                         │
     │                         │                          │                         │
     │                         │  POST /transactions/broadcast                     │
     │                         │──────────────────────────────────────────────────▶│
     │                         │                                   tx result       │
     │                         │◀──────────────────────────────────────────────────│
     │  result                 │                          │                         │
     │◀────────────────────────│                          │                         │
```

## Installation

```bash
npm install @decentralchain/signer
```

## Quick Start

```ts
import Signer from '@decentralchain/signer';

// 1. Create a Signer instance pointing to a DecentralChain node
const signer = new Signer({
  NODE_URL: 'https://nodes.decentralchain.io',
});

// 2. Connect a provider (e.g. a seed-based provider for development)
const provider = new SomeProvider('your seed phrase');
await signer.setProvider(provider);

// 3. Log in
const user = await signer.login();
console.log(user.address, user.publicKey);

// 4. Create, sign, and broadcast a transfer
const [tx] = await signer
  .transfer({
    recipient: '3N...',
    amount: 100000000, // 1 DCC (8 decimals)
  })
  .broadcast();
```

## Constructor

```ts
new Signer(options?: Partial<SignerOptions>)
```

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `NODE_URL` | `string` | `'https://nodes.decentralchain.io'` | URL of the DecentralChain node to connect to. The network byte is derived automatically. |
| `LOG_LEVEL` | `'verbose' \| 'production' \| 'error'` | `'production'` | Logging verbosity. `production` logs warnings and errors only. |

## Methods

### User Info

#### `login()`

Authenticates the user via the connected provider. Returns address and public key.

```ts
const user: UserData = await signer.login();
// { address: '3N...', publicKey: '...' }
```

#### `logout()`

Logs the user out and clears session data.

```ts
await signer.logout();
```

#### `getBalance()`

Returns the user's DCC and asset balances. Requires prior login.

```ts
const balances: Balance[] = await signer.getBalance();
```

Each `Balance` object contains:

| Field | Type | Description |
|-------|------|-------------|
| `assetId` | `string` | Asset ID (`'DCC'` for native token) |
| `assetName` | `string` | Human-readable asset name |
| `decimals` | `number` | Decimal places |
| `amount` | `string` | Raw amount in minimum indivisible units |
| `tokens` | `number` | Human-readable amount (`amount / 10^decimals`) |
| `isMyAsset` | `boolean` | Whether the logged-in user issued this asset |
| `isSmart` | `boolean` | Whether the asset has a script attached |
| `sponsorship` | `number \| null` | Sponsorship fee rate, if applicable |

#### `getSponsoredBalances()`

Returns only balances eligible for fee sponsorship.

```ts
const sponsored: Balance[] = await signer.getSponsoredBalances();
```

### Create Transactions

All transaction methods return a **pipeline API** that supports fluent chaining:

```ts
signer
  .issue({ name: 'Token', decimals: 2, quantity: 1000000, description: 'My token' })
  .transfer({ recipient: '3N...', amount: 500 })
  .sign();       // → Promise<SignedTx<...>>
  // or
  .broadcast();  // → Promise<BroadcastedTx<...>>
```

#### Common Fields

All transaction methods accept these optional fields:

| Field | Type | Description |
|-------|------|-------------|
| `fee` | `number \| string` | Transaction fee in minimum units. Uses default if omitted. |
| `senderPublicKey` | `string` | Override sender (for multisig scenarios). |
| `timestamp` | `number` | Custom timestamp. |
| `proofs` | `string[]` | Pre-existing proofs to include. |
| `version` | `number` | Transaction version (1, 2, or 3). |

#### Transaction Methods

| Method | Type ID | Description |
|--------|---------|-------------|
| `alias(data)` | 10 | Create an alias for an address |
| `burn(data)` | 6 | Burn tokens |
| `cancelLease(data)` | 9 | Cancel an active lease |
| `data(data)` | 12 | Write data to the account's data storage |
| `exchange(data)` | 7 | Exchange order (DEX) |
| `invoke(data)` | 16 | Invoke a dApp script function |
| `issue(data)` | 3 | Issue a new token |
| `lease(data)` | 8 | Lease DCC to another address |
| `massTransfer(data)` | 11 | Transfer to multiple recipients |
| `reissue(data)` | 5 | Reissue additional tokens |
| `setAssetScript(data)` | 15 | Set or update an asset's script |
| `setScript(data)` | 13 | Set or update the account script |
| `sponsorship(data)` | 14 | Set sponsorship for an asset |
| `transfer(data)` | 4 | Transfer tokens to a recipient |

#### `alias(data)`

```ts
const tx = await signer.alias({ alias: 'myalias' }).broadcast();
```

| Field | Required | Type | Description |
|-------|----------|------|-------------|
| `alias` | Yes | `string` | Alias name (4–30 chars, `[-.0-9@_a-z]`) |

#### `burn(data)`

```ts
const tx = await signer.burn({ assetId: '...', amount: 100 }).broadcast();
```

| Field | Required | Type | Description |
|-------|----------|------|-------------|
| `assetId` | Yes | `string` | ID of the asset to burn |
| `amount` | Yes | `number \| string` | Amount to burn |

#### `cancelLease(data)`

```ts
const tx = await signer.cancelLease({ leaseId: '...' }).broadcast();
```

| Field | Required | Type | Description |
|-------|----------|------|-------------|
| `leaseId` | Yes | `string` | ID of the active lease to cancel |

#### `data(data)`

```ts
const tx = await signer
  .data({
    data: [
      { key: 'name', type: 'string', value: 'Alice' },
      { key: 'age', type: 'integer', value: 30 },
    ],
  })
  .broadcast();
```

| Field | Required | Type | Description |
|-------|----------|------|-------------|
| `data` | Yes | `Array<DataEntry>` | Key-value pairs (`string`, `integer`, `boolean`, `binary`) |

#### `exchange(data)`

```ts
const tx = await signer
  .exchange({
    order1: { /* buy order */ },
    order2: { /* sell order */ },
    amount: 1000,
    price: 500,
    buyMatcherFee: 300000,
    sellMatcherFee: 300000,
  })
  .broadcast();
```

#### `invoke(data)`

```ts
const tx = await signer
  .invoke({
    dApp: '3N...',
    call: {
      function: 'deposit',
      args: [{ type: 'integer', value: 100 }],
    },
    payment: [{ assetId: 'DCC', amount: 100000000 }],
  })
  .broadcast();
```

| Field | Required | Type | Description |
|-------|----------|------|-------------|
| `dApp` | Yes | `string` | dApp address or alias |
| `call` | No | `{ function: string, args: Array }` | Function name and arguments |
| `payment` | No | `Array<{ assetId: string, amount: number }>` | Attached payments |
| `feeAssetId` | No | `string` | Asset ID for fee payment (if sponsored) |

#### `issue(data)`

```ts
const tx = await signer
  .issue({
    name: 'MyToken',
    description: 'A test token',
    quantity: 1000000,
    decimals: 2,
    reissuable: true,
  })
  .broadcast();
```

| Field | Required | Type | Description |
|-------|----------|------|-------------|
| `name` | Yes | `string` | Token name (4–16 chars) |
| `description` | No | `string` | Description (max 1000 chars) |
| `quantity` | Yes | `number \| string` | Total supply in minimum units |
| `decimals` | Yes | `number` | Decimal places (0–8) |
| `reissuable` | No | `boolean` | Allow reissuing |
| `script` | No | `string` | Base64-encoded smart asset script (`base64:...`) |

#### `lease(data)`

```ts
const tx = await signer.lease({ recipient: '3N...', amount: 100000000 }).broadcast();
```

| Field | Required | Type | Description |
|-------|----------|------|-------------|
| `recipient` | Yes | `string` | Recipient address or alias |
| `amount` | Yes | `number \| string` | Amount to lease |

#### `massTransfer(data)`

```ts
const tx = await signer
  .massTransfer({
    transfers: [
      { recipient: '3N...', amount: 100 },
      { recipient: '3M...', amount: 200 },
    ],
    assetId: null, // DCC
  })
  .broadcast();
```

| Field | Required | Type | Description |
|-------|----------|------|-------------|
| `transfers` | Yes | `Array<{ recipient: string, amount: number }>` | Transfer list |
| `assetId` | No | `string \| null` | Asset ID (`null` for DCC) |
| `attachment` | No | `string` | Arbitrary attachment data |

#### `reissue(data)`

```ts
const tx = await signer.reissue({ assetId: '...', quantity: 5000, reissuable: true }).broadcast();
```

| Field | Required | Type | Description |
|-------|----------|------|-------------|
| `assetId` | Yes | `string` | Asset ID to reissue |
| `quantity` | Yes | `number \| string` | Additional quantity |
| `reissuable` | Yes | `boolean` | Keep reissuable after this operation |

#### `setAssetScript(data)`

```ts
const tx = await signer.setAssetScript({ assetId: '...', script: 'base64:...' }).broadcast();
```

| Field | Required | Type | Description |
|-------|----------|------|-------------|
| `assetId` | Yes | `string` | Asset ID |
| `script` | Yes | `string` | Base64-encoded script |

#### `setScript(data)`

```ts
const tx = await signer.setScript({ script: 'base64:...' }).broadcast();
```

| Field | Required | Type | Description |
|-------|----------|------|-------------|
| `script` | Yes | `string` | Base64-encoded account script |

#### `sponsorship(data)`

```ts
const tx = await signer
  .sponsorship({ assetId: '...', minSponsoredAssetFee: 100 })
  .broadcast();
```

| Field | Required | Type | Description |
|-------|----------|------|-------------|
| `assetId` | Yes | `string` | Asset ID |
| `minSponsoredAssetFee` | Yes | `number \| null` | Minimum fee in asset units (`null` to cancel) |

#### `transfer(data)`

```ts
const tx = await signer
  .transfer({ recipient: '3N...', amount: 100000000 })
  .broadcast();
```

| Field | Required | Type | Description |
|-------|----------|------|-------------|
| `recipient` | Yes | `string` | Recipient address or alias |
| `amount` | Yes | `number \| string` | Amount in minimum units |
| `assetId` | No | `string \| null` | Asset ID (`null` or omit for DCC) |
| `feeAssetId` | No | `string \| null` | Asset for fee payment |
| `attachment` | No | `string` | Arbitrary attachment |

#### `batch(txs)`

Sign multiple transactions as a batch.

```ts
const result = await signer
  .batch([
    { type: 4, recipient: '3N...', amount: 100 },
    { type: 4, recipient: '3M...', amount: 200 },
  ])
  .broadcast();
```

### Broadcast & Utilities

#### `broadcast(signedTx, options?)`

Broadcast a previously signed transaction.

```ts
const signed = await signer.transfer({ recipient: '3N...', amount: 100 }).sign();
const result = await signer.broadcast(signed);
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `chain` | `boolean` | `false` | Send sequentially, waiting for each to enter the blockchain |
| `confirmations` | `number` | `-1` | Number of confirmations to wait for (`-1` = don't wait) |

#### `getNetworkByte()`

Returns the network byte for the configured node.

```ts
const byte: number = await signer.getNetworkByte();
```

#### `setProvider(provider)`

Connect a signing provider. Must be called before any signing operation.

```ts
await signer.setProvider(provider);
```

#### `waitTxConfirm(tx, confirmations)`

Wait for a transaction to reach the specified confirmation depth.

```ts
const confirmed = await signer.waitTxConfirm(tx, 1);
```

#### Event Methods

Subscribe to provider authentication events:

```ts
signer.on('login', (userData) => { /* ... */ });
signer.once('logout', () => { /* ... */ });
signer.off('login', handler);
```

#### `signMessage(message)`

Sign an arbitrary message via the provider.

```ts
const signature: string = await signer.signMessage('Hello DecentralChain');
```

#### `signOrder(order)`

Sign a DEX order.

```ts
const signedOrder = await signer.signOrder(orderData);
```

#### `signTypedData(data)`

Sign typed data.

```ts
const signature: string = await signer.signTypedData([
  { type: 'string', key: 'name', value: 'Alice' },
]);
```

## Provider Interface

A Provider must implement the following interface:

```ts
interface Provider {
  user: UserData | null;
  isSignAndBroadcastByProvider?: boolean;

  on(event: 'login', handler: (data: UserData) => void): Provider;
  on(event: 'logout', handler: () => void): Provider;
  once(event: 'login', handler: (data: UserData) => void): Provider;
  once(event: 'logout', handler: () => void): Provider;
  off(event: 'login', handler: (data: UserData) => void): Provider;
  off(event: 'logout', handler: () => void): Provider;

  connect(options: { NODE_URL: string; NETWORK_BYTE: number }): Promise<void>;
  login(): Promise<UserData>;
  logout(): Promise<void>;
  signMessage(data: string | number): Promise<string>;
  signTypedData(data: TypedData[]): Promise<string>;
  signOrder(data: TOrderArgs): Promise<TSignedOrder>;
  sign<T extends SignerTx>(toSign: T[] | T): Promise<SignedTx<T>>;
}
```

> **Security note**: Providers should be implemented using an `iframe` to isolate user credentials from the host application.

## Security Model

Security is foundational to `@decentralchain/signer`. The library enforces a strict separation of concerns that ensures user credentials are never exposed to your application:

| Layer | Responsibility | Has Access to Private Keys? |
|:------|:---------------|:----------------------------|
| **Your dApp** | Business logic, UI | ❌ No |
| **Signer** | Validation, broadcasting, lifecycle management | ❌ No |
| **Provider** | Key storage, signing, authentication | ✅ Yes (isolated) |

### Key Security Principles

1. **Credential Isolation** — Private keys and seed phrases live exclusively inside the Provider. Signer communicates with the Provider through a well-defined interface, never requesting raw key material.

2. **iframe Sandboxing** — Providers are recommended to run inside an `iframe` with a separate origin, leveraging the browser's same-origin policy as an additional security boundary.

3. **Input Validation** — Every transaction parameter is validated before being forwarded to the Provider, preventing malformed transactions from reaching the signing layer.

4. **Structured Errors** — All errors include a numeric code and type classification, making it straightforward to build secure error-handling logic without leaking internal details to end users.

5. **No Secret Logging** — Signer's logging system is designed to never output private keys, seeds, or other sensitive data, even at the `verbose` log level.

## Error Codes

| Error Class | Code | Type | Description |
|:---|:---|:---|:---|
| `SignerOptionsError` | 1000 | validation | Invalid signer constructor options |
| `SignerNetworkByteError` | 1001 | network | Failed to fetch network byte from node |
| `SignerAuthError` | 1002 | authorization | Method requires login |
| `SignerProviderConnectError` | 1003 | network | Provider failed to connect to node |
| `SignerEnsureProviderError` | 1004 | provider | No provider set — call `setProvider()` first |
| `SignerProviderInterfaceError` | 1005 | validation | Provider missing required methods |
| `SignerProviderInternalError` | 1006 | provider | Internal provider error (not a Signer bug) |
| `SignerApiArgumentsError` | 1007 | validation | Invalid transaction arguments |
| `SignerNetworkError` | 1008 | network | Network request failed |
| `SignerProviderSignIsNotSupport` | 1009 | validation | Provider only supports broadcast, not sign |

All errors extend `SignerError` which includes `code`, `type`, and a detailed message. See [SignerError.ts](src/SignerError.ts) for full definitions.

## DecentralChain Ecosystem

`@decentralchain/signer` is part of the official DecentralChain SDK. It works seamlessly with the following packages:

| Package | Description |
|:--------|:------------|
| [`@decentralchain/ts-types`](https://github.com/Decentral-America/ts-types) | TypeScript type definitions for the DecentralChain protocol |
| [`@decentralchain/ts-lib-crypto`](https://github.com/Decentral-America/ts-lib-crypto) | Cryptographic primitives (hashing, signing, key derivation) |
| [`@decentralchain/node-api-js`](https://github.com/Decentral-America/node-api-js) | Node REST API client for querying on-chain data |
| [`@decentralchain/transactions`](https://github.com/Decentral-America/transactions) | Low-level transaction building and serialization |

### Dependency Graph

```
@decentralchain/signer
├── @decentralchain/node-api-js   ← Node REST API communication
├── @decentralchain/ts-lib-crypto ← Address derivation & verification
└── @decentralchain/ts-types      ← Shared protocol type definitions
```

## Contributing

We welcome contributions from the community! Here's how to get started:

```bash
# Clone the repository
git clone https://github.com/Decentral-America/signer.git
cd signer

# Install dependencies
npm install

# Run the full quality suite (format, lint, typecheck, test)
npm run bulletproof

# Or run individual checks
npm run format:check   # Verify code formatting
npm run lint:check     # Run ESLint
npm run typecheck      # TypeScript type checking
npm run test           # Run tests with Vitest
npm run test:coverage  # Run tests with coverage report
```

Before submitting a pull request, please ensure that `npm run bulletproof:check` passes with no errors.

## Support

- **Bug Reports** — [Open an issue](https://github.com/Decentral-America/signer/issues) on GitHub
- **Source Code** — [github.com/Decentral-America/signer](https://github.com/Decentral-America/signer)
- **Changelog** — See [CHANGELOG.md](./CHANGELOG.md) for version history

## License

[MIT](./LICENSE) — Copyright (c) 2025-present DecentralChain

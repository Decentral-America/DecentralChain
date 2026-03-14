<p align="center">
  <a href="https://decentralchain.io">
    <img src="https://avatars.githubusercontent.com/u/75630395?s=200" alt="DecentralChain" width="80" />
  </a>
</p>

<h3 align="center">@decentralchain/signer</h3>

<p align="center">
  Transaction signing orchestrator for the DecentralChain blockchain.
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@decentralchain/signer"><img src="https://img.shields.io/npm/v/@decentralchain/signer?color=blue" alt="npm" /></a>
  <a href="./LICENSE"><img src="https://img.shields.io/npm/l/@decentralchain/signer" alt="license" /></a>
  <a href="https://bundlephobia.com/package/@decentralchain/signer"><img src="https://img.shields.io/bundlephobia/minzip/@decentralchain/signer" alt="bundle size" /></a>
  <a href="./package.json"><img src="https://img.shields.io/node/v/@decentralchain/signer" alt="node" /></a>
</p>

---

## Overview

`@decentralchain/signer` is a TypeScript library that orchestrates transaction signing on behalf of users. It delegates the actual signing to an external **Provider** — a separate package that securely stores the user's private key or seed phrase.

Your application and Signer itself never have access to the user's private data. The Provider authenticates the user and generates digital signatures. Signer validates transaction arguments, manages the provider lifecycle, and broadcasts signed transactions to the blockchain.

Connect any provider to sign and broadcast transactions without exposing user seeds or private keys.

**Part of the [DecentralChain](https://docs.decentralchain.io) SDK.**

### Architecture

```
┌───────────────┐      ┌───────────────┐      ┌──────────────────┐
│  Your dApp    │─────▶│    Signer     │─────▶│    Provider      │
│               │      │  (validates,  │      │  (signs tx with  │
│               │      │   broadcasts) │      │   user's key)    │
└───────────────┘      └───────────────┘      └──────────────────┘
```

### Restrictions

Signer supports all transaction types except Update Asset Info.

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

## Related packages

| Package | Description |
| --- | --- |
| [`@decentralchain/cubensis-connect-provider`](https://www.npmjs.com/package/@decentralchain/cubensis-connect-provider) | CubensisConnect wallet provider |
| [`@decentralchain/transactions`](https://www.npmjs.com/package/@decentralchain/transactions) | Transaction builders and signers |
| [`@decentralchain/node-api-js`](https://www.npmjs.com/package/@decentralchain/node-api-js) | Node REST API client |
| [`@decentralchain/ts-lib-crypto`](https://www.npmjs.com/package/@decentralchain/ts-lib-crypto) | Cryptographic primitives |
| [`@decentralchain/signature-adapter`](https://www.npmjs.com/package/@decentralchain/signature-adapter) | Multi-provider signing adapter |

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md).

## Security

To report a vulnerability, see [SECURITY.md](./SECURITY.md).

## License

[MIT](./LICENSE) — Copyright (c) [DecentralChain](https://decentralchain.io)

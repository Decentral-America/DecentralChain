<p align="center">
  <a href="https://decentralchain.io">
    <img src="https://avatars.githubusercontent.com/u/75630395?s=200" alt="DecentralChain" width="80" />
  </a>
</p>

<h3 align="center">@decentralchain/transactions</h3>

<p align="center">
  Build and sign transactions for the DecentralChain blockchain.
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@decentralchain/transactions"><img src="https://img.shields.io/npm/v/@decentralchain/transactions?color=blue" alt="npm" /></a>
  <a href="./LICENSE"><img src="https://img.shields.io/npm/l/@decentralchain/transactions" alt="license" /></a>
  <a href="https://bundlephobia.com/package/@decentralchain/transactions"><img src="https://img.shields.io/bundlephobia/minzip/@decentralchain/transactions" alt="bundle size" /></a>
  <a href="./package.json"><img src="https://img.shields.io/node/v/@decentralchain/transactions" alt="node" /></a>
</p>

---

## Overview

Transaction builder, signer, and broadcaster for the DecentralChain blockchain. Provides builder functions for all transaction types, cryptographic signing with seed phrases or private keys, and broadcasting to DecentralChain nodes.

- **ESM-only** package
- **TypeScript-first** — ships declaration files
- **Tree-shakeable** — zero side effects

**Part of the [DecentralChain](https://docs.decentralchain.io) SDK.**

## Installation

```bash
npm install @decentralchain/transactions
```

> Requires **Node.js >= 24** and an ESM environment (`"type": "module"`).

## Quick Start

```typescript
import { transfer, broadcast } from '@decentralchain/transactions';

const seed = 'your twelve word seed phrase here';

const tx = transfer(
  {
    recipient: '3L...',
    amount: 100000000, // 1 DCC (8 decimals)
    chainId: 'L', // DCC mainnet
  },
  seed,
);

const result = await broadcast(tx, 'https://nodes.decentralchain.io');
```

## Transaction Types

- `transfer()` — Send DCC or tokens
- `issue()` — Create a new token
- `reissue()` — Reissue additional tokens
- `burn()` — Burn tokens
- `lease()` — Lease DCC
- `cancelLease()` — Cancel a lease
- `massTransfer()` — Send to multiple recipients
- `data()` — Write data to account data storage
- `setScript()` — Set account script (smart account)
- `setAssetScript()` — Set asset script (smart asset)
- `invokeScript()` — Call a dApp function
- `exchange()` — DEX exchange order

## Usage Examples

### Transfer

```typescript
import { transfer, broadcast } from '@decentralchain/transactions';

const seed = 'your seed phrase';

const signedTx = transfer(
  {
    amount: 1,
    recipient: '3LkWnGsqMKem4WPr4N5JKgVGsGqWd6eFHxo',
  },
  seed,
);

await broadcast(signedTx, 'https://nodes.decentralchain.io');
```

### Issue Token

```typescript
import { issue, broadcast } from '@decentralchain/transactions';

const seed = 'your seed phrase';

const signedTx = issue(
  {
    name: 'MyToken',
    description: 'A test token on DecentralChain',
    quantity: 1000000,
    decimals: 2,
    reissuable: true,
    chainId: 'L',
  },
  seed,
);

await broadcast(signedTx, 'https://nodes.decentralchain.io');
```

### Data Transaction

```typescript
import { data, broadcast } from '@decentralchain/transactions';

const seed = 'your seed phrase';

const signedTx = data(
  {
    data: [
      { key: 'integerVal', type: 'integer', value: 1 },
      { key: 'booleanVal', type: 'boolean', value: true },
      { key: 'stringVal', type: 'string', value: 'hello' },
    ],
    chainId: 'L',
  },
  seed,
);

await broadcast(signedTx, 'https://nodes.decentralchain.io');
```

## Node Interaction

```typescript
import { nodeInteraction } from '@decentralchain/transactions';

const nodeUrl = 'https://nodes.decentralchain.io';

// Get account balance
const balance = await nodeInteraction.balance('3L...address', nodeUrl);

// Get account data
const accountData = await nodeInteraction.accountData('3L...address', nodeUrl);

// Wait for transaction confirmation
await nodeInteraction.waitForTx(txId, { apiBase: nodeUrl });
```

## Signing

Transactions can be signed using:

- **Seed phrase**: `transfer({ ... }, 'your seed phrase')`
- **Private key**: `transfer({ ... }, { privateKey: 'base58EncodedPrivateKey' })`
- **No signing** (for multi-sig): `transfer({ ... })` — creates unsigned transaction

## Chain IDs

| Network | Byte | Char |
| ------- | ---- | ---- |
| Mainnet | 76   | L    |
| Testnet | 84   | T    |

## Dependencies

- `@decentralchain/ts-lib-crypto` — cryptographic operations
- `@decentralchain/ts-types` — shared type definitions
- `@decentralchain/node-api-js` — node REST API client
- `@decentralchain/protobuf-serialization` — protobuf encoding
- `@decentralchain/marshall` — binary serialization

## API Reference

### Transaction builders

Each builder accepts transaction parameters and an optional seed/private key for signing:

```typescript
function transfer(paramsOrTx: ITransferParams, seed?: TSeedTypes): TransferTransaction;
function issue(paramsOrTx: IIssueParams, seed?: TSeedTypes): IssueTransaction;
function reissue(paramsOrTx: IReissueParams, seed?: TSeedTypes): ReissueTransaction;
function burn(paramsOrTx: IBurnParams, seed?: TSeedTypes): BurnTransaction;
function lease(paramsOrTx: ILeaseParams, seed?: TSeedTypes): LeaseTransaction;
function cancelLease(paramsOrTx: ICancelLeaseParams, seed?: TSeedTypes): CancelLeaseTransaction;
function massTransfer(paramsOrTx: IMassTransferParams, seed?: TSeedTypes): MassTransferTransaction;
function data(paramsOrTx: IDataParams, seed?: TSeedTypes): DataTransaction;
function setScript(paramsOrTx: ISetScriptParams, seed?: TSeedTypes): SetScriptTransaction;
function setAssetScript(
  paramsOrTx: ISetAssetScriptParams,
  seed?: TSeedTypes,
): SetAssetScriptTransaction;
function invokeScript(paramsOrTx: IInvokeScriptParams, seed?: TSeedTypes): InvokeScriptTransaction;
function exchange(paramsOrTx: IExchangeParams, seed?: TSeedTypes): ExchangeTransaction;
```

### Broadcasting

```typescript
function broadcast(tx: SignedTransaction, nodeUrl: string): Promise<any>;
```

### Waiting for confirmation

```typescript
function waitForTx(txId: string, options: { apiBase: string; timeout?: number }): Promise<any>;
```

## Scripts

| Command                | Purpose                              |
| ---------------------- | ------------------------------------ |
| `npm run build`        | Build ESM bundle via tsup            |
| `npm test`             | Run tests via Vitest                 |
| `npm run test:watch`   | Run tests in watch mode              |
| `npm run typecheck`    | Type-check with `tsc --noEmit`       |
| `npm run lint`         | Lint via Biome        |
| `npm run lint:fix`     | Auto-fix lint issues                 |
| `npm run format`       | Format via Biome                  |
| `npm run format:check` | Check formatting                     |
| `npm run validate`     | Full quality gate (CI-equivalent)    |
| `npm run bulletproof`  | Format + lint:fix + typecheck + test |

## Related packages

| Package | Description |
| --- | --- |
| [`@decentralchain/ts-lib-crypto`](https://www.npmjs.com/package/@decentralchain/ts-lib-crypto) | Cryptographic primitives |
| [`@decentralchain/ts-types`](https://www.npmjs.com/package/@decentralchain/ts-types) | Core TypeScript type definitions |
| [`@decentralchain/marshall`](https://www.npmjs.com/package/@decentralchain/marshall) | Binary serialization/deserialization |
| [`@decentralchain/node-api-js`](https://www.npmjs.com/package/@decentralchain/node-api-js) | Node REST API client |
| [`@decentralchain/protobuf-serialization`](https://www.npmjs.com/package/@decentralchain/protobuf-serialization) | Protocol Buffers serialization |

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## Security

To report a vulnerability, see [SECURITY.md](./SECURITY.md).

## License

[MIT](LICENSE) — Copyright (c) [DecentralChain](https://decentralchain.io)

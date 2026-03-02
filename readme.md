# @decentralchain/signature-adapter

[![CI](https://github.com/Decentral-America/dcc-signature-adapter/actions/workflows/ci.yml/badge.svg)](https://github.com/Decentral-America/dcc-signature-adapter/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/@decentralchain/signature-adapter)](https://www.npmjs.com/package/@decentralchain/signature-adapter)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D24-brightgreen)](https://nodejs.org/)

Multi-provider transaction signing adapter for the DecentralChain blockchain.

Provides a unified interface for signing transactions across multiple key-management backends: seed phrases, private keys, Cubensis Connect (browser extension), Ledger hardware wallets, and Tresor hardware wallets.

## Requirements

| Dependency | Version |
| ---------- | ------- |
| Node.js    | >= 24   |
| npm        | >= 10   |

## Installation

```bash
npm install @decentralchain/signature-adapter
```

## Quick Start

```typescript
import { SeedAdapter, SIGN_TYPE } from '@decentralchain/signature-adapter';
import { Money, Asset } from '@decentralchain/data-entities';

const asset = new Asset({
  ticker: 'DCC',
  id: 'DCC',
  name: 'DCC',
  precision: 8,
  description: '',
  height: 0,
  timestamp: new Date('2016-04-11T21:00:00.000Z'),
  sender: '',
  quantity: 10000000000000000,
  reissuable: false,
});

const transferTransactionData = {
  recipient: 'some address or alias',
  amount: Money.fromTokens(1, asset),
  attachment: 'Some attachment text less 140 bytes',
  fee: Money.fromTokens(0.001, asset),
};

const adapter = new SeedAdapter('some seed phrase with 15 or more chars');
const signable = adapter.makeSignable({
  type: SIGN_TYPE.TRANSFER,
  data: transferTransactionData,
});

signable.getDataForApi().then((data) =>
  fetch('node-url', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
);
```

## Adapters

| Adapter                  | Type                          | Description                  |
| ------------------------ | ----------------------------- | ---------------------------- |
| `SeedAdapter`            | `AdapterType.Seed`            | Signs with a seed phrase     |
| `PrivateKeyAdapter`      | `AdapterType.PrivateKey`      | Signs with a raw private key |
| `CubensisConnectAdapter` | `AdapterType.CubensisConnect` | Browser extension signing    |
| `LedgerAdapter`          | `AdapterType.Ledger`          | Ledger hardware wallet       |
| `TresorAdapter`          | `AdapterType.Tresor`          | Tresor hardware wallet       |

### SeedAdapter

Accepts either a seed phrase or an object containing information about the seed phrase.

Object structure:

- `encryptedSeed` {string} — seed phrase encoded with passwords
- `password` {string} — password that is encrypted seed phrase
- `encryptionRounds` {number} — encryption complexity

_Minimum seed phrase length is 15 characters._

```typescript
import { SeedAdapter } from '@decentralchain/signature-adapter';

const adapter = new SeedAdapter('some seed phrase more 15 chars');
```

### LedgerAdapter

Accepts an object containing address and wallet ID in Ledger.

- `publicKey` {string} — public key for the address
- `address` {string} — address
- `id` {number} — wallet ID in Ledger

```typescript
import { LedgerAdapter } from '@decentralchain/signature-adapter';

LedgerAdapter.getUserList().then(([userData]) => new LedgerAdapter(userData));
```

### Network Configuration

```typescript
import { Adapter } from '@decentralchain/signature-adapter';

Adapter.initOptions({ networkCode: 'L'.charCodeAt(0) });
```

## Common Adapter API

All adapters implement a shared interface:

- `isAvailable(): Promise<void>` — Returns promise which errors if the adapter is unavailable
- `getPublicKey(): Promise<string>` — Returns a public key
- `getAddress(): Promise<string>` — Returns an address
- `getPrivateKey(): Promise<string>` — Returns a private key or an error
- `signRequest(bytes: Uint8Array): Promise<string>` — Signs any data except transactions/orders
- `signTransaction(bytes: Uint8Array): Promise<string>` — Signs transactions
- `signOrder(bytes: Uint8Array): Promise<string>` — Signs orders
- `signData(bytes: Uint8Array): Promise<string>` — Signs any data
- `getSeed(): Promise<string>` — Returns the seed phrase or an error
- `makeSignable(signData): Signable` — Creates a Signable instance (see [interfaces](src/prepareTx/interfaces.ts))

## Signable

- `getTxData(): object` — Returns a copy of the data transferred for signature
- `getSignData(): Promise<object>` — Returns data for signing
- `addProof(proof: string): Signable` — Adds a signature to the proof list
- `getId(): Promise<string>` — Returns hash of all data used for signature
- `sign(): Promise<Signable>` — Initiates signing and returns promise
- `getSignature(): Promise<string>` — Returns promise with signature
- `getBytes(): Promise<Uint8Array>` — Returns bytes for signing
- `getMyProofs(): Promise<Array<string>>` — Returns signatures for this adapter's public key
- `hasMySignature(): Promise<boolean>` — Checks for "own" signature presence
- `addMyProof(): Promise<string>` — Adds own signature if not present
- `getDataForApi(): Promise<object>` — Returns node-ready data with signatures

## Utilities

```typescript
import {
  getAvailableList,
  getAdapterByType,
  isValidAddress,
  AdapterType,
} from '@decentralchain/signature-adapter';

// Get all available adapter classes
const adapters = await getAvailableList();

// Get adapter class by type
const AdapterClass = getAdapterByType(AdapterType.Seed);

// Validate a blockchain address
const valid = isValidAddress('3P...');
```

## Chain IDs

| Network | Byte | Char |
| ------- | ---- | ---- |
| Mainnet | 76   | L    |
| Testnet | 84   | T    |

## Package Outputs

| Format | Entry           | Types             |
| ------ | --------------- | ----------------- |
| ESM    | `dist/index.js` | `dist/index.d.ts` |

## Development

```bash
git clone https://github.com/Decentral-America/dcc-signature-adapter.git
cd dcc-signature-adapter
npm install
```

### Scripts

| Command                 | Description                          |
| ----------------------- | ------------------------------------ |
| `npm run build`         | Build with tsup (ESM)                |
| `npm test`              | Run tests with Vitest                |
| `npm run test:watch`    | Tests in watch mode                  |
| `npm run test:coverage` | Tests with V8 coverage               |
| `npm run typecheck`     | TypeScript type checking             |
| `npm run lint`          | ESLint                               |
| `npm run lint:fix`      | ESLint with auto-fix                 |
| `npm run format`        | Format with Prettier                 |
| `npm run format:check`  | Check formatting                     |
| `npm run validate`      | Full CI validation pipeline          |
| `npm run bulletproof`   | Format + lint fix + typecheck + test |
| `npm run check:publint` | Validate package.json exports        |
| `npm run check:exports` | Verify export map resolution         |
| `npm run check:size`    | Bundle size check                    |

### Quality Gates

- **TypeScript** strict mode with all flags enabled
- **ESLint** type-aware rules (strict + stylistic)
- **Prettier** consistent formatting
- **Vitest** with V8 coverage thresholds
- **publint** + **attw** package validation
- **size-limit** bundle size enforcement
- **Husky** pre-commit hooks

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md).

## Security

See [SECURITY.md](./SECURITY.md).

## License

[MIT](./LICENSE) © DecentralChain

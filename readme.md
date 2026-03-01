# @decentralchain/signature-adapter

Unified signing abstraction layer for the DecentralChain wallet.

Provides a common interface for signing transactions using different methods:

- **SeedAdapter** — Sign with a seed phrase
- **LedgerAdapter** — Sign on a Ledger Nano S/X hardware wallet
- **PrivateKeyAdapter** — Sign with a raw private key
- **CubensisConnectAdapter** — Sign via the CubensisConnect browser extension
- **CustomAdapter** — Custom signing implementation

## Installation

```bash
$ npm install --save @decentralchain/signature-adapter
```

## Usage

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

Adapters are used to sign data. Available types:

### SeedAdapter

Accepts either a seed phrase or an object containing information about the seed phrase.

Object structure:

- `encryptedSeed` {string} — seed phrase encoded with passwords
- `password` {string} — password that is encrypted seed phrase
- `encryptionRounds` {number} — encryption complexity

For changing the network byte:

```typescript
import { Adapter } from '@decentralchain/signature-adapter';

Adapter.initOptions({ networkCode: 'L'.charCodeAt(0) });
```

_If you use seed phrase to create SeedAdapter note that the minimum length of a phrase is 15 characters._

Example:

```typescript
import { SeedAdapter } from '@decentralchain/signature-adapter';

const adapter = new SeedAdapter('some seed phrase more 15 chars');
```

### LedgerAdapter

Accepts an object containing address and wallet ID in Ledger.

Object structure:

- `publicKey` {string} — public key for the address
- `address` {string} — address
- `id` {number} — wallet ID in Ledger

To get objects for creating an instance use the static method `getUserList`:

```typescript
import { LedgerAdapter } from '@decentralchain/signature-adapter';

LedgerAdapter.getUserList().then(([userData]) => new LedgerAdapter(userData));
```

## Common methods for all adapters

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

## Chain IDs

| Network | Byte | Char |
| ------- | ---- | ---- |
| Mainnet | 76   | L    |
| Testnet | 84   | T    |

## Dependencies

- `@decentralchain/bignumber`
- `@decentralchain/ts-types`
- `@decentralchain/data-entities`
- `@decentralchain/ledger`
- `@decentralchain/money-like-to-node`
- `@decentralchain/waves-transactions`

## License

MIT

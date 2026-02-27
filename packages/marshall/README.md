# @decentralchain/marshall

Marshall can serialize and parse DecentralChain blockchain data structures.

### Includes:

- Serialization primitives
- Parsing primitives
- Binary to JS converters
- JS to binary converters
- JSON to JS converters
- JS to JSON converters

### Installation

```bash
npm install @decentralchain/marshall
```

### Usage

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

### API

#### Binary

- `binary.serializeTx(tx)` — Serialize a transaction to binary bytes
- `binary.parseTx(bytes, toLongConverter?)` — Parse binary bytes back to a transaction object
- `binary.serializeOrder(order)` — Serialize a DEX order to binary bytes
- `binary.parseOrder(bytes, toLongConverter?)` — Parse binary bytes back to an order object

#### JSON

- `json.stringifyTx(tx, fromLongConverter?)` — Convert a transaction to a JSON string (safe for large numbers)
- `json.parseTx(str, toLongConverter?)` — Parse a JSON string to a transaction object
- `json.stringifyOrder(order, fromLongConverter?)` — Convert an order to a JSON string
- `json.parseOrder(str, toLongConverter?)` — Parse a JSON string to an order object

### License

MIT
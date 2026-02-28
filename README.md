# @decentralchain/node-api-js

TypeScript/JavaScript HTTP client for the DecentralChain node REST API.

## Installation

```bash
npm install @decentralchain/node-api-js
```

## Usage

```typescript
import { create } from '@decentralchain/node-api-js';

const api = create('https://nodes.decentralchain.io');

// Get current block height
const height = await api.blocks.fetchHeight();

// Get account balance
const balance = await api.addresses.fetchBalance('3L...');

// Broadcast a signed transaction
const result = await api.transactions.broadcast(signedTx);
```

## License

MIT


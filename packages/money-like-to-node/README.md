# @decentralchain/money-like-to-node

[![CI](https://github.com/33imattei33/money-like-to-node/actions/workflows/ci.yml/badge.svg)](https://github.com/33imattei33/money-like-to-node/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

Converts human-readable money objects to the format expected by the DecentralChain blockchain node API.

## Installation

```bash
npm install @decentralchain/money-like-to-node
```

## Usage

```typescript
import { moneyLikeToNode } from '@decentralchain/money-like-to-node';

const nodeFormat = moneyLikeToNode({
  asset: { id: '', precision: 8 },
  amount: '1.5',
});

// Result: { assetId: '', amount: 150000000 }
```

## What does it do?

This is a small utility that converts human-friendly money representations into the raw format that blockchain nodes expect:

- **Decimal precision** — converting "1.5 DCC" (8 decimals) to `150000000` raw units
- **Asset ID mapping** — converting named assets to their on-chain IDs
- **Null/empty handling** — the native asset (DCC) has an empty string or null as its ID

## Migration Notice

This package was migrated from `@waves/money-like-to-node` to `@decentralchain/money-like-to-node` as part of the DecentralChain ecosystem migration. All Waves references have been replaced with DecentralChain equivalents.

## License

MIT

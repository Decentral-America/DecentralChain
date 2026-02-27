# @decentralchain/bignumber

Arbitrary-precision BigNumber wrapper for the DecentralChain SDK.

Provides safe arithmetic for blockchain token amounts that exceed JavaScript's native number precision.

## Installation

```bash
npm install @decentralchain/bignumber
```

## Usage

```typescript
import { BigNumber } from '@decentralchain/bignumber';

const amount = new BigNumber('100000000');
const fee = new BigNumber('100000');

const total = amount.add(fee);

console.log(total.toString()); // '100100000'
```

## API

### `new BigNumber(value)`

Creates a new BigNumber instance from a string, number, or another BigNumber.

### Instance Methods

`.add(other)` — Addition
`.sub(other)` — Subtraction
`.mul(other)` — Multiplication
`.div(other)` — Division
`.mod(other)` — Modulo
`.eq(other)` — Equality check
`.lt(other)` — Less than
`.gt(other)` — Greater than
`.lte(other)` — Less than or equal
`.gte(other)` — Greater than or equal
`.isNaN()` — Check if NaN
`.isFinite()` — Check if finite
`.toString()` — Convert to string
`.toFixed(dp?)` — Fixed-point string representation
`.toNumber()` — Convert to JavaScript number (may lose precision!)

## License

MIT

<p align="center">
  <a href="https://decentralchain.io">
    <img src="https://avatars.githubusercontent.com/u/75630395?s=200" alt="DecentralChain" width="80" />
  </a>
</p>

<h3 align="center">@decentralchain/bignumber</h3>

<p align="center">
  Arbitrary-precision arithmetic for the DecentralChain blockchain ecosystem.
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@decentralchain/bignumber"><img src="https://img.shields.io/npm/v/@decentralchain/bignumber?color=blue" alt="npm" /></a>
  <a href="./LICENSE"><img src="https://img.shields.io/npm/l/@decentralchain/bignumber" alt="license" /></a>
  <a href="https://bundlephobia.com/package/@decentralchain/bignumber"><img src="https://img.shields.io/bundlephobia/minzip/@decentralchain/bignumber" alt="bundle size" /></a>
  <a href="./package.json"><img src="https://img.shields.io/node/v/@decentralchain/bignumber" alt="node" /></a>
</p>

---

## Overview

**Part of the [DecentralChain](https://docs.decentralchain.io) SDK.**

`@decentralchain/bignumber` is the official arbitrary-precision number library for the DecentralChain SDK. It provides **safe, precise arithmetic** for blockchain token amounts, transaction fees, and financial computations that exceed JavaScript's native `Number.MAX_SAFE_INTEGER` (2⁵³ − 1) limit.

Built on top of the battle-tested [bignumber.js](https://github.com/MikeMcl/bignumber.js/) engine, this library wraps it with a clean, chainable, immutable API specifically designed for blockchain and decentralized finance (DeFi) use cases — including binary serialization for on-chain transaction encoding.

## Installation

```bash
npm install @decentralchain/bignumber
```

## Quick Start

```typescript
import { BigNumber } from '@decentralchain/bignumber';

const amount = new BigNumber('100000000');
const fee = new BigNumber('100000');

const total = amount.add(fee);
console.log(total.toString()); // '100100000'

// Safe comparison without floating-point issues
console.log(amount.gt(fee)); // true
console.log(total.eq('100100000')); // true

// Byte serialization for blockchain transactions
const bytes = amount.toBytes(); // Uint8Array(8)
const restored = BigNumber.fromBytes(bytes);
console.log(restored.eq(amount)); // true
```

## DecentralChain Integration

This library is a foundational component of the **DecentralChain SDK** and is used across the ecosystem wherever precise numeric handling is required.

### Role in the SDK

The DecentralChain blockchain uses **8 decimal places** of precision for token amounts. All on-chain values are represented as integers (e.g., 1 DC = `100000000` smallest units). `@decentralchain/bignumber` is purpose-built for this model:

```typescript
import { BigNumber } from '@decentralchain/bignumber';

// Convert a human-readable amount to the on-chain integer representation
const DECIMALS = 8;
const humanAmount = '1.5'; // 1.5 DC
const onChainAmount = new BigNumber(humanAmount)
  .mul(new BigNumber(10).pow(DECIMALS));

console.log(onChainAmount.toString()); // '150000000'
```

### Transaction Building

When constructing DecentralChain transactions, amounts and fees must be serialized as **signed 64-bit big-endian byte arrays** for inclusion in the binary transaction body. The `toBytes()` and `fromBytes()` methods handle this encoding directly:

```typescript
import { BigNumber } from '@decentralchain/bignumber';

// Serialize a transaction amount for the wire format
const amount = new BigNumber('1000000000'); // 10 DC
const amountBytes = amount.toBytes(); // Uint8Array(8) — ready for transaction body

// Deserialize bytes received from the blockchain
const decoded = BigNumber.fromBytes(amountBytes);
console.log(decoded.toString()); // '1000000000'
```

### Common Blockchain Operations

```typescript
import { BigNumber } from '@decentralchain/bignumber';

// Fee calculation with safe arithmetic
const baseFee = new BigNumber('100000');
const extraFee = new BigNumber('400000');
const totalFee = baseFee.add(extraFee); // '500000'

// Balance validation before transfer
const balance = new BigNumber('50000000000');
const transferAmount = new BigNumber('10000000000');
if (balance.gte(transferAmount.add(totalFee))) {
  console.log('Sufficient balance for transfer');
}

// Aggregate multiple token amounts
const amounts = ['100000000', '250000000', '75000000'];
const total = BigNumber.sum(...amounts); // '425000000'

// Validate that a value fits in a signed 64-bit integer (required by protocol)
const value = new BigNumber('9223372036854775807');
console.log(value.isInSignedRange()); // true — safe for on-chain use
```

### Architecture

```
┌─────────────────────────────────────────────────────┐
│                 Your Application                     │
├─────────────────────────────────────────────────────┤
│              DecentralChain SDK                      │
│  ┌──────────┐  ┌──────────┐  ┌───────────────────┐  │
│  │  Crypto  │  │   Core   │  │  @decentralchain/ │  │
│  │  module  │  │  module  │  │    bignumber       │  │
│  └──────────┘  └──────────┘  └───────────────────┘  │
├─────────────────────────────────────────────────────┤
│          DecentralChain Blockchain Network           │
└─────────────────────────────────────────────────────┘
```

`@decentralchain/bignumber` sits at the **data layer** of the SDK, ensuring that every numeric value flowing between your application and the blockchain is handled with full precision and correct binary encoding.

## API Reference

### Constructor

#### `new BigNumber(value)`

Creates a new BigNumber instance.

| Parameter | Type                            | Description       |
| --------- | ------------------------------- | ----------------- |
| `value`   | `string \| number \| BigNumber` | The numeric value |

```typescript
new BigNumber('9223372036854775807');
new BigNumber(42);
new BigNumber(existingBigNumber);
```

---

### Arithmetic Methods

All arithmetic methods return a **new** `BigNumber` instance (immutable).

| Method    | Signature                        | Description             |
| --------- | -------------------------------- | ----------------------- |
| `add`     | `(other) → BigNumber`            | Addition                |
| `sub`     | `(other) → BigNumber`            | Subtraction             |
| `mul`     | `(other) → BigNumber`            | Multiplication          |
| `div`     | `(other) → BigNumber`            | Division                |
| `mod`     | `(other) → BigNumber`            | Modulo                  |
| `pow`     | `(exp) → BigNumber`              | Exponentiation          |
| `sqrt`    | `() → BigNumber`                 | Square root             |
| `abs`     | `() → BigNumber`                 | Absolute value          |
| `roundTo` | `(decimals?, mode?) → BigNumber` | Round to decimal places |
| `clone`   | `() → BigNumber`                 | Deep copy               |

```typescript
const a = new BigNumber('1000000000000000000');
const b = new BigNumber('2');

a.add(b); // 1000000000000000002
a.mul(b); // 2000000000000000000
a.pow(2); // 1000000000000000000000000000000000000
a.roundTo(2, BigNumber.ROUND_MODE.ROUND_HALF_UP);
```

---

### Comparison Methods

| Method | Signature           | Description           |
| ------ | ------------------- | --------------------- |
| `eq`   | `(other) → boolean` | Equal to              |
| `lt`   | `(other) → boolean` | Less than             |
| `gt`   | `(other) → boolean` | Greater than          |
| `lte`  | `(other) → boolean` | Less than or equal    |
| `gte`  | `(other) → boolean` | Greater than or equal |

---

### Inspection Methods

| Method              | Signature             | Description                  |
| ------------------- | --------------------- | ---------------------------- |
| `isNaN`             | `() → boolean`        | Check if NaN                 |
| `isFinite`          | `() → boolean`        | Check if finite              |
| `isZero`            | `() → boolean`        | Check if zero                |
| `isPositive`        | `() → boolean`        | Check if positive            |
| `isNegative`        | `() → boolean`        | Check if negative            |
| `isInt`             | `() → boolean`        | Check if integer             |
| `isEven`            | `() → boolean`        | Check if even                |
| `isOdd`             | `() → boolean`        | Check if odd                 |
| `isInSignedRange`   | `() → boolean`        | Within signed 64-bit range   |
| `isInUnsignedRange` | `() → boolean`        | Within unsigned 64-bit range |
| `getDecimalsCount`  | `() → number \| null` | Number of decimal places     |

---

### Conversion Methods

| Method     | Signature                     | Description                                 |
| ---------- | ----------------------------- | ------------------------------------------- |
| `toString` | `(base?) → string`            | String representation (optional base)       |
| `toFixed`  | `(dp?, mode?) → string`       | Fixed-point string                          |
| `toFormat` | `(dp?, mode?, fmt?) → string` | Formatted string with separators            |
| `toNumber` | `() → number`                 | JavaScript number (**may lose precision!**) |
| `toJSON`   | `() → string`                 | JSON serialization                          |
| `valueOf`  | `() → string`                 | Primitive value                             |

```typescript
const n = new BigNumber('1000000.123');
n.toString(); // '1000000.123'
n.toString(16); // hex representation
n.toFixed(2); // '1000000.12'
n.toFormat(); // '1,000,000.123'
```

---

### Byte Serialization

For blockchain wire format encoding/decoding.

#### `toBytes(options?)`

| Option     | Type      | Default | Description                      |
| ---------- | --------- | ------- | -------------------------------- |
| `isSigned` | `boolean` | `true`  | Two's complement signed encoding |
| `isLong`   | `boolean` | `true`  | Fixed 8-byte output              |

#### `BigNumber.fromBytes(bytes, options?)`

Inverse of `toBytes`. Same options.

```typescript
const value = new BigNumber('9223372036854775807'); // Long.MAX_VALUE
const bytes = value.toBytes(); // Uint8Array [127, 255, 255, 255, 255, 255, 255, 255]
BigNumber.fromBytes(bytes).eq(value); // true
```

---

### Static Methods

| Method                  | Signature                 | Description                   |
| ----------------------- | ------------------------- | ----------------------------- |
| `BigNumber.max`         | `(...values) → BigNumber` | Maximum of values             |
| `BigNumber.min`         | `(...values) → BigNumber` | Minimum of values             |
| `BigNumber.sum`         | `(...values) → BigNumber` | Sum of values                 |
| `BigNumber.toBigNumber` | `(value) → BigNumber`     | Convert value(s) to BigNumber |
| `BigNumber.isBigNumber` | `(value) → boolean`       | Type guard                    |

---

### Static Constants

| Constant                       | Value                  | Description             |
| ------------------------------ | ---------------------- | ----------------------- |
| `BigNumber.MIN_VALUE`          | `-9223372036854775808` | Signed 64-bit minimum   |
| `BigNumber.MAX_VALUE`          | `9223372036854775807`  | Signed 64-bit maximum   |
| `BigNumber.MIN_UNSIGNED_VALUE` | `0`                    | Unsigned 64-bit minimum |
| `BigNumber.MAX_UNSIGNED_VALUE` | `18446744073709551615` | Unsigned 64-bit maximum |

---

### Configuration

```typescript
// Change number formatting globally
BigNumber.config.set({
  FORMAT: {
    groupSeparator: ' ',
    decimalSeparator: ',',
  },
});

new BigNumber('1000000.5').toFormat(); // '1 000 000,5'
```

### Rounding Modes

Available via `BigNumber.ROUND_MODE`:

| Mode               | Description                                 |
| ------------------ | ------------------------------------------- |
| `ROUND_UP`         | Away from zero                              |
| `ROUND_DOWN`       | Towards zero                                |
| `ROUND_CEIL`       | Towards +Infinity                           |
| `ROUND_FLOOR`      | Towards -Infinity                           |
| `ROUND_HALF_UP`    | To nearest, 0.5 away from zero              |
| `ROUND_HALF_DOWN`  | To nearest, 0.5 towards zero                |
| `ROUND_HALF_EVEN`  | To nearest, 0.5 to even (banker's rounding) |
| `ROUND_HALF_CEIL`  | To nearest, 0.5 towards +Infinity           |
| `ROUND_HALF_FLOOR` | To nearest, 0.5 towards -Infinity           |

## Development

### Prerequisites

- **Node.js** >= 24 (see `.node-version`)
- **npm** >= 11

### Setup

```bash
git clone https://github.com/Decentral-America/bignumber.git
cd bignumber
npm install
```

### Scripts

| Command                     | Description                              |
| --------------------------- | ---------------------------------------- |
| `npm run build`             | Build distribution files                 |
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

This project enforces strict quality standards to ensure reliability for production blockchain applications:

- **Coverage**: 90%+ threshold for branches, functions, lines, and statements
- **Bundle size**: Enforced via [size-limit](https://github.com/ai/size-limit) to keep the library lightweight
- **Type exports**: Validated with [publint](https://publint.dev/) and [@arethetypeswrong/cli](https://github.com/arethetypeswrong/arethetypeswrong.github.io) to ensure correct type resolution across all module systems
- **Formatting**: Prettier enforced on commit via Husky + lint-staged
- **CI Pipeline**: Automated testing on every push and pull request via GitHub Actions

### Technology Stack

| Category | Technology |
| --- | --- |
| Language | TypeScript 5.9 (strict mode) |
| Runtime | Node.js >= 24 |
| Module Format | Pure ESM |
| Build Tool | [tsup](https://tsup.egoist.dev/) |
| Test Framework | [Vitest](https://vitest.dev/) |
| Linter | [ESLint](https://eslint.org/) (flat config) |
| Formatter | [Prettier](https://prettier.io/) |
| CI/CD | GitHub Actions |

## Related Packages

| Package | Description |
| --- | --- |
| [@decentralchain/ts-types](https://www.npmjs.com/package/@decentralchain/ts-types) | Core TypeScript type definitions |
| [@decentralchain/marshall](https://www.npmjs.com/package/@decentralchain/marshall) | Binary serialization for blockchain data |
| [@decentralchain/ts-lib-crypto](https://www.npmjs.com/package/@decentralchain/ts-lib-crypto) | Cryptographic primitives |
| [@decentralchain/transactions](https://www.npmjs.com/package/@decentralchain/transactions) | Transaction builder |

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup and guidelines.

## Security

See [SECURITY.md](SECURITY.md) for the security policy and reporting instructions.

## License

[MIT](LICENSE) — [DecentralChain](https://decentralchain.io)

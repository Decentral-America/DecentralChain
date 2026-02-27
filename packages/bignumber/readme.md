# @decentralchain/bignumber

[![CI](https://github.com/Decentral-America/bignumber/actions/workflows/ci.yml/badge.svg)](https://github.com/Decentral-America/bignumber/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/@decentralchain/bignumber.svg)](https://www.npmjs.com/package/@decentralchain/bignumber)
[![npm downloads](https://img.shields.io/npm/dm/@decentralchain/bignumber.svg)](https://www.npmjs.com/package/@decentralchain/bignumber)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D22-green.svg)](https://nodejs.org/)

Arbitrary-precision BigNumber wrapper for the DecentralChain SDK.

Provides **safe arithmetic** for blockchain token amounts that exceed JavaScript's native number precision. Built on top of [bignumber.js](https://github.com/MikeMcl/bignumber.js/) with a clean, chainable API designed for blockchain use cases.

## Features

- Arbitrary-precision integer and decimal arithmetic
- Byte serialization for blockchain wire format (signed/unsigned, long/variable-length)
- Immutable — all operations return new instances
- Full TypeScript support with strict types
- ESM, CJS, and UMD builds
- Zero configuration — works in Node.js and browsers

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

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup and guidelines.

## Security

See [SECURITY.md](SECURITY.md) for the security policy and responsible disclosure.

## License

[MIT](LICENSE) © DecentralChain

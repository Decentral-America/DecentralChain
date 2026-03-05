# @decentralchain/parse-json-bignumber

<div align="center">

**Precision-safe JSON parsing for the DecentralChain blockchain ecosystem.**

[![CI](https://github.com/Decentral-America/parse-json-bignumber/actions/workflows/ci.yml/badge.svg)](https://github.com/Decentral-America/parse-json-bignumber/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/@decentralchain/parse-json-bignumber)](https://www.npmjs.com/package/@decentralchain/parse-json-bignumber)
[![license](https://img.shields.io/npm/l/@decentralchain/parse-json-bignumber)](./LICENSE)
[![Node.js](https://img.shields.io/node/v/@decentralchain/parse-json-bignumber)](./package.json)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)
[![Bundle Size](https://img.shields.io/badge/bundle_size-~1.5_kB-brightgreen.svg)](#quality-gates)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](./CONTRIBUTING.md)

</div>

---

Safe JSON parser that preserves precision for large numbers.

Standard `JSON.parse()` silently corrupts large integers (numbers larger than `Number.MAX_SAFE_INTEGER`). This library provides custom `JSON.parse()` and `JSON.stringify()` that handle BigNumber values safely. Used by the DecentralChain SDK to prevent precision loss when parsing blockchain transaction data.

## Why This Library?

Blockchain platforms like **DecentralChain** routinely work with numeric values that exceed JavaScript's safe integer limit (`2⁵³ − 1`, or `9,007,199,254,740,991`). These values appear throughout the ecosystem:

| Blockchain Concept       | Example Value                         | Risk with Native `JSON.parse()`         |
| ------------------------ | ------------------------------------- | --------------------------------------- |
| **Transaction amounts**  | `9999999999999999` (atomic units)     | Silently rounded to `10000000000000000` |
| **Asset quantities**     | `99999999999999999999` (total supply) | Precision destroyed, funds miscounted   |
| **Timestamps (nanosec)** | `1709251200000000000`                 | Truncated, wrong date computed          |
| **Order IDs / Nonces**   | `18446744073709551615` (uint64 max)   | Collision risk, transaction failures    |

A single bit of lost precision in a financial transaction can mean **lost funds, failed settlements, or security vulnerabilities**. This library eliminates that risk entirely by detecting numbers that exceed 15 significant digits and preserving them as strings or custom BigNumber types — without modifying any other JSON behavior.

## Key Features

- 🔒 **Precision-safe** — Numbers exceeding 15 significant digits are never silently corrupted
- 🔗 **DecentralChain-native** — Purpose-built for the DecentralChain SDK and blockchain tooling
- 🎛️ **Pluggable** — Bring your own BigNumber library (`bignumber.js`, `decimal.js`, `BigInt`, etc.)
- 📐 **Drop-in compatible** — API mirrors native `JSON.parse()` and `JSON.stringify()` signatures
- 🛡️ **Strict mode** — Optional duplicate-key detection for rigorous JSON validation
- 🪶 **Lightweight** — ~1.5 kB bundled, zero runtime dependencies
- 🔄 **Circular reference detection** — Throws clear errors instead of infinite loops
- 📦 **Pure ESM** — Modern module format with full TypeScript type definitions
- 🧱 **RFC 8259 compliant** — Rejects leading zeros, unescaped control characters, and malformed input

## How It Works

The library implements a custom recursive-descent JSON parser (based on Douglas Crockford's JSON2) with BigNumber-safe extensions. Here's the processing pipeline:

```
JSON string input
    │
    ▼
┌──────────────────────────┐
│  Recursive-Descent Parse │  ← RFC 8259 compliant tokenizer
│  (strings, bools, nulls) │
└──────────┬───────────────┘
           │
     ┌─────▼──────┐
     │  Number?    │
     └─────┬──────┘
           │
    ┌──────▼───────────────────┐
    │  Count significant digits │
    │  & check safe-integer     │
    └──────┬───────────────────┘
           │
     ┌─────▼──────────────┐     ┌──────────────────────┐
     │  ≤ 15 digits AND   │ YES │  Return native JS     │
     │  safe integer?      ├────►│  number               │
     └─────┬──────────────┘     └──────────────────────┘
           │ NO
     ┌─────▼──────────────┐     ┌──────────────────────┐
     │  Custom parse()     │ YES │  Return T (BigNumber, │
     │  provided?          ├────►│  BigInt, Decimal, …)  │
     └─────┬──────────────┘     └──────────────────────┘
           │ NO
     ┌─────▼──────────────┐
     │  Return as string   │  ← Precision preserved
     └────────────────────┘
```

During **stringification**, the reverse happens: values matched by `isInstance` are serialized via the custom `stringify` callback, producing unquoted numeric literals in the output JSON — exactly what blockchain APIs expect.

## DecentralChain Ecosystem Integration

This library is a foundational component of the **DecentralChain JavaScript/TypeScript SDK stack**. It ensures that every layer of the stack — from raw node API responses to high-level transaction builders — handles numeric precision correctly.

### Where It Fits

```
┌─────────────────────────────────────────────────┐
│              Your DApp / Application             │
├─────────────────────────────────────────────────┤
│         DecentralChain SDK (high-level)          │
│      Transactions · Accounts · Assets · DEX      │
├─────────────────────────────────────────────────┤
│          API Client / HTTP Transport             │
│    ┌───────────────────────────────────────┐     │
│    │  @decentralchain/parse-json-bignumber │     │  ◄── THIS LIBRARY
│    │  Safe parse/stringify for all JSON I/O │     │
│    └───────────────────────────────────────┘     │
├─────────────────────────────────────────────────┤
│         DecentralChain Node REST API             │
│       Blocks · Transactions · State · UTXs       │
└─────────────────────────────────────────────────┘
```

### Typical Blockchain Usage

```typescript
import create from '@decentralchain/parse-json-bignumber';

// Initialize the precision-safe JSON handler
const { parse, stringify } = create();

// Parsing a DecentralChain transfer transaction response
const tx = parse(`{
  "type": 4,
  "id": "9Q7T8XbhRfNNjmCwRPe7PKZDQ3k6vMkZfwFghLmAjBx",
  "sender": "3PAWwWa6GbwcJaFzwqXQN5KQm3H8EFGxtJg",
  "senderPublicKey": "8LbAU5BS…truncated…TRJo2PE",
  "fee": 100000,
  "feeAssetId": null,
  "timestamp": 1709251200000,
  "amount": 9999999999999999,
  "recipient": "3PBSduYkK7GQxVFWkKWMq98c6LjA5Fy8zhm"
}`);

// tx.amount === "9999999999999999" (string — precision preserved!)
// tx.fee === 100000                (number — within safe range)
// tx.timestamp === 1709251200000   (number — within safe range)

// Serialize back for broadcasting — large numbers emit as unquoted literals
const json = stringify(tx);
// '{"type":4,…,"amount":9999999999999999,…}'
//                       ^^^^^^^^^^^^^^^^ no quotes, no precision loss
```

## Requirements

- **Node.js** >= 24

## Installation

```bash
npm install @decentralchain/parse-json-bignumber
```

## Quick Start

```typescript
import create from '@decentralchain/parse-json-bignumber';

// Default mode — large numbers become strings
const { parse, stringify } = create();

const data = parse('{"amount": 9999999999999999}');
// => { amount: "9999999999999999" }

const json = stringify(data);
// => '{"amount":"9999999999999999"}'
```

### Custom BigNumber Support

```typescript
import create from '@decentralchain/parse-json-bignumber';
import BigNumber from 'bignumber.js';

const { parse, stringify } = create({
  strict: false,
  parse: (long) => new BigNumber(long),
  stringify: (long) => long.toFixed(),
  isInstance: (some): some is BigNumber =>
    some != null && (some instanceof BigNumber || BigNumber.isBigNumber(some)),
});

const data = parse('{"amount": 99999999999999999999999999}');
// data.amount is a BigNumber instance

const json = stringify(data);
// => '{"amount":99999999999999999999999999}'
```

### Using Native BigInt

```typescript
import create from '@decentralchain/parse-json-bignumber';

const { parse, stringify } = create({
  parse: (value) => BigInt(value),
  stringify: (value) => value.toString(),
  isInstance: (value): value is bigint => typeof value === 'bigint',
});

const data = parse('{"balance": 18446744073709551615}');
// data.balance === 18446744073709551615n (BigInt)
```

### Strict Mode — Duplicate Key Detection

```typescript
import create from '@decentralchain/parse-json-bignumber';

const { parse } = create({ strict: true });

// Throws SyntaxError: Duplicate key "amount"
parse('{"amount": 100, "amount": 200}');
```

## API Reference

### `create<T>(options?): { parse, stringify }`

Factory function that returns a matched pair of `parse` and `stringify` functions.

#### Options

| Option       | Type                             | Description                                                    |
| ------------ | -------------------------------- | -------------------------------------------------------------- |
| `strict`     | `boolean`                        | Throw on duplicate object keys (default: `false`)              |
| `parse`      | `(value: string) => T`           | Convert a numeric string to `T` (called for every JSON number) |
| `stringify`  | `(value: T) => string`           | Convert a `T` value back to its numeric string representation  |
| `isInstance` | `(value: unknown) => value is T` | Type guard — returns `true` when `value` is an instance of `T` |

#### `parse(source: string, reviver?): unknown`

Parse a JSON string. Numbers with more than 15 digits are returned as strings (default mode) or converted via the `parse` option.

#### `stringify(value: unknown, replacer?, space?): string`

Stringify a value to JSON. Values identified by `isInstance` are serialized using the `stringify` option.

### Named Exports

```typescript
import create, { type IOptions, type JsonHandler } from '@decentralchain/parse-json-bignumber';
```

## Development

### Prerequisites

- **Node.js** >= 24 (see `.node-version`)
- **npm** >= 10

### Setup

```bash
git clone https://github.com/Decentral-America/parse-json-bignumber.git
cd parse-json-bignumber
npm install
```

### Scripts

| Command                     | Description                              |
| --------------------------- | ---------------------------------------- |
| `npm run build`             | Build distribution files (tsup)          |
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

All of the following must pass before merge:

- `npm run format:check` — No formatting issues
- `npm run lint` — No lint errors
- `npm run typecheck` — No type errors
- `npm test` — All 97 tests pass
- `npm run build` — Clean build
- `npm run check:publint` — Package structure valid
- `npm run check:exports` — Type exports valid
- `npm run check:size` — Within 10 kB budget (currently ~1.5 kB)

## Comparison with Alternatives

| Feature                       | This Library | Native `JSON.parse` | `json-bigint` | `lossless-json` |
| ----------------------------- | :----------: | :-----------------: | :-----------: | :-------------: |
| Preserves large integers      |      ✅      |         ❌          |      ✅       |       ✅        |
| Custom BigNumber type support |      ✅      |         ❌          |  ⚠️ Limited   |       ❌        |
| Drop-in API compatibility     |      ✅      |          —          |      ✅       |       ❌        |
| Strict duplicate-key mode     |      ✅      |         ❌          |      ❌       |       ❌        |
| Circular reference detection  |      ✅      |         ❌          |      ❌       |       ❌        |
| Zero dependencies             |      ✅      |         ✅          |      ❌       |       ✅        |
| Pure ESM with TypeScript      |      ✅      |          —          |      ❌       |       ✅        |
| RFC 8259 strict compliance    |      ✅      |     ⚠️ Lenient      |  ⚠️ Lenient   |       ✅        |

## Frequently Asked Questions

<details>
<summary><strong>Why not just use <code>BigInt</code> natively?</strong></summary>

`BigInt` only handles integers. Blockchain APIs can also return large decimal values (e.g., price feeds, exchange rates). This library works with any number format and lets you plug in the BigNumber type that fits your use case.

</details>

<details>
<summary><strong>Does this library modify the global <code>JSON</code> object?</strong></summary>

No. The `create()` factory returns an isolated `{ parse, stringify }` pair. The global `JSON` object is never touched.

</details>

<details>
<summary><strong>Is this library safe for server-side use?</strong></summary>

Yes. The parser uses `Object.create(null)` for parsed objects (preventing prototype pollution), enforces a maximum nesting depth of 512 to prevent stack overflows, and rejects unescaped control characters per RFC 8259.

</details>

<details>
<summary><strong>What happens to numbers that are within the safe range?</strong></summary>

Numbers with 15 or fewer significant digits that fall within `Number.MAX_SAFE_INTEGER` are returned as native JavaScript `number` values — identical to `JSON.parse()` behavior. Only large numbers receive special treatment.

</details>

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for development guidelines. We welcome contributions from the community — whether it's bug reports, feature requests, documentation improvements, or code contributions.

## Security

See [SECURITY.md](./SECURITY.md) for vulnerability reporting. If you discover a security vulnerability, please report it responsibly.

## Code of Conduct

See [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md).

## Changelog

See [CHANGELOG.md](./CHANGELOG.md) for release history.

## License

[MIT](./LICENSE) © DecentralChain

---

<div align="center">

**Built with ❤️ by the [DecentralChain](https://github.com/Decentral-America) team**

_Powering precision-safe blockchain applications_

</div>

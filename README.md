# @decentralchain/parse-json-bignumber

[![CI](https://github.com/Decentral-America/parse-json-bignumber/actions/workflows/ci.yml/badge.svg)](https://github.com/Decentral-America/parse-json-bignumber/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/@decentralchain/parse-json-bignumber)](https://www.npmjs.com/package/@decentralchain/parse-json-bignumber)
[![license](https://img.shields.io/npm/l/@decentralchain/parse-json-bignumber)](./LICENSE)
[![Node.js](https://img.shields.io/node/v/@decentralchain/parse-json-bignumber)](./package.json)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)

Safe JSON parser that preserves precision for large numbers.

Standard `JSON.parse()` silently corrupts large integers (numbers larger than `Number.MAX_SAFE_INTEGER`). This library provides custom `JSON.parse()` and `JSON.stringify()` that handle BigNumber values safely. Used by the DecentralChain SDK to prevent precision loss when parsing blockchain transaction data.

## Requirements

- **Node.js** >= 22

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

- **Node.js** >= 22 (24 recommended — see `.node-version`)
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

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for development guidelines.

## Security

See [SECURITY.md](./SECURITY.md) for vulnerability reporting.

## Code of Conduct

See [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md).

## Changelog

See [CHANGELOG.md](./CHANGELOG.md) for release history.

## License

[MIT](./LICENSE) © DecentralChain

<p align="center">
  <a href="https://decentralchain.io">
    <img src="https://avatars.githubusercontent.com/u/75630395?s=200" alt="DecentralChain" width="80" />
  </a>
</p>

<h3 align="center">@decentralchain/ride-js</h3>

<p align="center">
  JS compiler for Ride – the smart-contract language for DecentralChain
</p>

<p align="center">
  <a href="https://github.com/Decentral-America/ride-js/actions/workflows/ci.yml"><img src="https://github.com/Decentral-America/ride-js/actions/workflows/ci.yml/badge.svg" alt="CI" /></a>
  <a href="https://www.npmjs.com/package/@decentralchain/ride-js"><img src="https://img.shields.io/npm/v/@decentralchain/ride-js?color=blue" alt="npm" /></a>
  <a href="./LICENSE"><img src="https://img.shields.io/npm/l/@decentralchain/ride-js" alt="license" /></a>
  <a href="./package.json"><img src="https://img.shields.io/node/v/@decentralchain/ride-js" alt="node" /></a>
  <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-5.9-blue.svg" alt="TypeScript" /></a>
  <a href="https://bundlephobia.com/package/@decentralchain/ride-js"><img src="https://img.shields.io/bundlephobia/minzip/@decentralchain/ride-js" alt="bundle size" /></a>
</p>

---

## Overview

JavaScript wrapper around the [Ride](https://docs.decentralchain.io/en/master/03_ride-language/index.html) smart-contract compiler for the DecentralChain blockchain. Provides compile, decompile, REPL, and script-info utilities for Ride v1–v6 contracts.

**Part of the [DecentralChain](https://docs.decentralchain.io) SDK.**

## Installation

```bash
npm install @decentralchain/ride-js
```

> Requires **Node.js >= 24** and an ESM environment (`"type": "module"`).

## Quick Start

```javascript
import { compile, decompile, contractLimits } from '@decentralchain/ride-js';

// Compile a Ride script
const result = compile('{-# STDLIB_VERSION 6 #-}\ntrue');
console.log(result); // { result: { bytes: '...', ast: {...}, ... } }

// Decompile a base64-encoded script
const source = await decompile(
  'AAIFAAAAAAAAAAIIAhIAAAAAAAAAAAEAAAABaQEAAAAEY2FsbAAAAAAJAQAAAAV0aHJvdwAAAAAAAAAA',
);
console.log(source);

// Get contract limits for a given stdlib version
const limits = contractLimits(6);
console.log(limits);
```

## API Reference

### `compile(code, estimator?)`

Compile Ride source code to binary.

| Parameter   | Type     | Description                         |
| ----------- | -------- | ----------------------------------- |
| `code`      | `string` | Ride source code                    |
| `estimator` | `number` | Estimator version (default: latest) |

Returns a compilation result object with `result.bytes` (base64 binary) or `error` message.

### `decompile(base64Script)`

Decompile a base64-encoded compiled script back to Ride source code.

| Parameter      | Type     | Description                    |
| -------------- | -------- | ------------------------------ |
| `base64Script` | `string` | Base64-encoded compiled script |

Returns `Promise<string>` — the decompiled Ride source code.

### `repl(options?)`

Create an interactive REPL session for evaluating Ride expressions.

### `contractLimits(stdlibVersion)`

Get the compilation limits for a given standard library version.

### `scriptInfo(base64Script)`

Get metadata about a compiled script (version, type, public keys, etc.).

### `getTypes(stdlibVersion, isTokenContext?)`

Get available types for a given stdlib version.

### `getFunctionsDoc(stdlibVersion, isTokenContext?)`

Get function documentation for a given stdlib version.

### `getVarsDoc(stdlibVersion, isTokenContext?)`

Get variable documentation for a given stdlib version.

### `flattenCompilationResult(result)`

Flatten a nested compilation result into a flat structure.

### `parseAndCompile(code, estimator?)`

Parse and compile with additional AST information.

## Related Packages

| Package                                                                                        | Description                                 |
| ---------------------------------------------------------------------------------------------- | ------------------------------------------- |
| [`@decentralchain/transactions`](https://www.npmjs.com/package/@decentralchain/transactions)   | Transaction building, signing, broadcasting |
| [`@decentralchain/ts-lib-crypto`](https://www.npmjs.com/package/@decentralchain/ts-lib-crypto) | Cryptographic primitives                    |
| [`@decentralchain/ts-types`](https://www.npmjs.com/package/@decentralchain/ts-types)           | Core TypeScript type definitions            |
| [`@decentralchain/node-api-js`](https://www.npmjs.com/package/@decentralchain/node-api-js)     | Node REST API client                        |

## Development

```bash
git clone https://github.com/Decentral-America/ride-js.git
cd ride-js
npm install
```

| Script                      | Description                      |
| --------------------------- | -------------------------------- |
| `npm test`                  | Run tests (Vitest)               |
| `npm run test:coverage`     | Coverage report                  |
| `npm run build`             | Build ESM bundle                 |
| `npm run typecheck`         | TypeScript type checking         |
| `npm run lint`              | Lint with auto-fix               |
| `npm run lint:check`        | Lint (check only, no fix)        |
| `npm run format`            | Format with Biome             |
| `npm run bulletproof`       | Format → lint → typecheck → test |
| `npm run bulletproof:check` | CI-safe check (no auto-fix)      |
| `npm run validate`          | Full CI validation pipeline      |

### Known Exceptions

This package retains `@waves/ride-lang`, `@waves/ride-repl`, and `@waves/ts-lib-crypto` as runtime dependencies. These are the Scala.js-compiled Ride compiler binaries — no `@decentralchain` equivalents exist because the Ride language implementation is identical between Waves and DecentralChain. This is a documented acceptable exception per the DCC SDK migration policy.

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md).

## Security

To report a vulnerability, see [SECURITY.md](./SECURITY.md).

## License

[MIT](./LICENSE) — Copyright (c) [DecentralChain](https://decentralchain.io)

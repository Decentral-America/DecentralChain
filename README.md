# @decentralchain/ts-lib-crypto

[![CI](https://github.com/Decentral-America/ts-lib-crypto/actions/workflows/ci.yml/badge.svg)](https://github.com/Decentral-America/ts-lib-crypto/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/@decentralchain/ts-lib-crypto)](https://www.npmjs.com/package/@decentralchain/ts-lib-crypto)
[![license](https://img.shields.io/npm/l/@decentralchain/ts-lib-crypto)](./LICENSE)
[![Node.js](https://img.shields.io/node/v/@decentralchain/ts-lib-crypto)](./package.json)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)
[![Bundle Size](https://img.shields.io/bundlephobia/minzip/@decentralchain/ts-lib-crypto)](https://bundlephobia.com/package/@decentralchain/ts-lib-crypto)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](./CONTRIBUTING.md)

> **The official TypeScript cryptographic toolkit for the [DecentralChain](https://decentralchain.io) blockchain platform.**
>
> Key generation · Digital signatures · Hashing · Encoding · Encryption — everything you need to build secure DecentralChain applications.

---

## Overview

**@decentralchain/ts-lib-crypto** is the foundational cryptographic library that powers the DecentralChain blockchain ecosystem. It provides a comprehensive, type-safe API for all cryptographic operations required when interacting with the DecentralChain protocol — from generating wallets and signing transactions to verifying on-chain data and encrypting peer-to-peer messages.

The DecentralChain protocol uses well-established cryptographic primitives including **Curve25519** (Ed25519/X25519), **Blake2b**, **Keccak-256**, **SHA-256**, **AES**, **RSA**, and **BLS12-381**. This library provides all algorithm implementations and protocol utilities (address derivation, seed management, signature verification) needed by DecentralChain applications.

### How It Works with DecentralChain

DecentralChain is a high-performance blockchain platform designed for decentralized applications. Every interaction with the network — creating accounts, sending transactions, issuing tokens, executing smart contracts — requires cryptographic operations. This library serves as the **protocol-level cryptographic layer** that sits between your application logic and the DecentralChain network:

```
┌─────────────────────────────────┐
│      Your Application / dApp    │
├─────────────────────────────────┤
│   @decentralchain/ts-lib-crypto │  ◄── This library
│   (keys, signatures, hashing)   │
├─────────────────────────────────┤
│     DecentralChain Protocol     │
│   (transactions, blocks, state) │
├─────────────────────────────────┤
│     DecentralChain Network      │
│      (nodes, consensus)         │
└─────────────────────────────────┘
```

**Wallet creation** uses `keyPair()` and `address()` to derive Curve25519 key pairs and protocol-compliant addresses from mnemonic seeds. **Transaction signing** uses `signBytes()` to produce Ed25519 signatures that nodes validate before accepting transactions into blocks. **Address verification** uses `verifyAddress()` to confirm checksum integrity and chain ID correctness (mainnet `L` vs testnet `T`). **Data integrity** is ensured through `blake2b()` and `keccak()` — the same hash functions used internally by the DecentralChain protocol for block hashing and state verification.

### ✨ Key Features

- **🔐 Complete Protocol Coverage** — Every cryptographic primitive used by the DecentralChain protocol, in a single package
- **📦 Multiple Output Formats** — Get results as Base58 strings (default) or raw `Uint8Array` bytes
- **🏗️ Flexible API Styles** — Direct imports, factory functions, or embedded-seed patterns to match your architecture
- **🌐 Universal Runtime** — Works in Node.js (≥ 24) and modern browsers via the UMD bundle
- **🔒 Auditable Dependencies** — Built on the battle-tested [@noble](https://github.com/paulmillr/noble-curves) cryptographic library family (curves, hashes, ciphers)
- **📐 Strict TypeScript** — Full type safety with strict mode enabled, exported type definitions, and zero `any` types
- **🪶 Lightweight** — Tree-shakeable ESM build with a bundle size budget enforced via [size-limit](https://github.com/ai/size-limit)
- **✅ Thoroughly Tested** — Comprehensive test suite with coverage thresholds enforced in CI

---

## 📋 Table of Contents

- [Overview](#overview)
- [Requirements](#requirements)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Import Styles](#import-styles)
- [API Reference](#api-reference)
- [Use Cases](#use-cases)
- [Architecture & Design](#architecture--design)
- [Platform Compatibility](#platform-compatibility)
- [Browser](#browser)
- [Development](#development)
- [Ecosystem](#ecosystem)
- [Contributing](#contributing)
- [Security](#security)
- [License](#license)

---

## Requirements

- **Node.js** >= 24
- **npm** >= 10

## 📥 Installation

```bash
npm install @decentralchain/ts-lib-crypto
```

## 🚀 Quick Start

```ts
import {
  address,
  keyPair,
  signBytes,
  verifySignature,
  randomSeed,
} from '@decentralchain/ts-lib-crypto';

// Generate a random seed phrase
const seed = randomSeed();

// Derive keys and address
const keys = keyPair(seed);
const addr = address(seed);

// Sign and verify
const message = Uint8Array.from([1, 2, 3, 4]);
const signature = signBytes(seed, message);
const isValid = verifySignature(keys.publicKey, message, signature);
console.log({ addr, isValid }); // { addr: '3P...', isValid: true }
```

## 🔄 Import Styles

This library offers multiple import styles to fit different application architectures and preferences.

### Direct imports (Base58 output by default)

```ts
import { address, publicKey, signBytes } from '@decentralchain/ts-lib-crypto';

const addr = address('my secret seed'); // Base58 string
```

### Bytes output

```ts
import { address, publicKey } from '@decentralchain/ts-lib-crypto/bytes';

const addr = address('my secret seed'); // Uint8Array
```

### Factory function

```ts
import { crypto } from '@decentralchain/ts-lib-crypto';

const { address, keyPair } = crypto({ output: 'Bytes' });
```

### Embedded seed

```ts
import { crypto } from '@decentralchain/ts-lib-crypto';

const { address, signBytes } = crypto({ output: 'Base58', seed: 'my secret seed' });
const addr = address(); // No seed needed — it's embedded
```

## 📖 API Reference

### Seed Generation

| Function                          | Description                                       |
| --------------------------------- | ------------------------------------------------- |
| `randomSeed(wordsCount?: number)` | Generate random mnemonic seed (default: 15 words) |
| `seedWordsList`                   | BIP-39 compatible word list (2048 words)          |

### Keys and Address

| Function                                | Description                                  |
| --------------------------------------- | -------------------------------------------- |
| `keyPair(seed)`                         | Derive `{ publicKey, privateKey }` from seed |
| `publicKey(seed \| privateKey)`         | Derive public key                            |
| `privateKey(seed)`                      | Derive private key                           |
| `address(seed \| publicKey, chainId?)`  | Derive address (default chain: mainnet)      |
| `buildAddress(publicKeyBytes, chainId)` | Build address from raw public key bytes      |
| `seedWithNonce(seed, nonce)`            | Create a nonce-seeded pair                   |

### Signatures

| Function                                       | Description                        |
| ---------------------------------------------- | ---------------------------------- |
| `signBytes(seed \| privateKey, bytes)`         | Sign bytes with Curve25519         |
| `verifySignature(publicKey, bytes, signature)` | Verify a signature                 |
| `verifyPublicKey(publicKey)`                   | Check public key validity (length) |
| `verifyAddress(address, options?)`             | Verify address checksum and chain  |

### Hashing

| Function         | Description      |
| ---------------- | ---------------- |
| `blake2b(input)` | Blake2b-256 hash |
| `keccak(input)`  | Keccak-256 hash  |
| `sha256(input)`  | SHA-256 hash     |

### Random

| Function              | Description                          |
| --------------------- | ------------------------------------ |
| `randomBytes(size)`   | Generate random bytes                |
| `random(count, type)` | Generate random data in typed format |

### Base Encoding / Decoding

| Function                                      | Description     |
| --------------------------------------------- | --------------- |
| `base58Encode(input)` / `base58Decode(input)` | Base58 encoding |
| `base64Encode(input)` / `base64Decode(input)` | Base64 encoding |
| `base16Encode(input)` / `base16Decode(input)` | Hex encoding    |

### String / Bytes Conversion

| Function                          | Description                            |
| --------------------------------- | -------------------------------------- |
| `stringToBytes(str, encoding?)`   | Convert string to bytes (UTF-8 or raw) |
| `bytesToString(bytes, encoding?)` | Convert bytes to string                |

### Messaging

| Function                                         | Description                     |
| ------------------------------------------------ | ------------------------------- |
| `sharedKey(privateKeyFrom, publicKeyTo, prefix)` | Diffie-Hellman shared key       |
| `messageEncrypt(sharedKey, message)`             | Encrypt message with shared key |
| `messageDecrypt(sharedKey, encryptedMessage)`    | Decrypt message                 |

### Encryption

| Function                                    | Description                                 |
| ------------------------------------------- | ------------------------------------------- |
| `aesEncrypt(data, key, mode?, iv?)`         | AES encryption (CBC, CTR, ECB, etc.)        |
| `aesDecrypt(data, key, mode?, iv?)`         | AES decryption                              |
| `encryptSeed(seed, password, rounds?)`      | Encrypt seed with password (OpenSSL format) |
| `decryptSeed(encrypted, password, rounds?)` | Decrypt seed                                |

### RSA

| Function                                            | Description                   |
| --------------------------------------------------- | ----------------------------- |
| `rsaKeyPair(bits?, e?)`                             | Generate RSA key pair (async) |
| `rsaKeyPairSync(bits?, e?)`                         | Generate RSA key pair (sync)  |
| `rsaSign(privateKey, message, digest?)`             | RSA PKCS#1 v1.5 sign          |
| `rsaVerify(publicKey, message, signature, digest?)` | RSA verify                    |

### BLS12-381

| Function                                   | Description                     |
| ------------------------------------------ | ------------------------------- |
| `blsKeyPair(seed)`                         | Generate BLS key pair from seed |
| `blsPublicKey(secretKey)`                  | Derive BLS public key           |
| `blsSign(secretKey, message)`              | BLS signature                   |
| `blsVerify(publicKey, message, signature)` | BLS verification                |

### Utilities

| Function                     | Description                |
| ---------------------------- | -------------------------- |
| `concat(...binaries)`        | Concatenate binary inputs  |
| `split(binary, ...sizes)`    | Split binary into parts    |
| `ChainId.toNumber(chainId)`  | Convert chain ID to number |
| `ChainId.isMainnet(chainId)` | Check if mainnet           |
| `ChainId.isTestnet(chainId)` | Check if testnet           |

### Constants

| Constant             | Value    |
| -------------------- | -------- |
| `PUBLIC_KEY_LENGTH`  | 32       |
| `PRIVATE_KEY_LENGTH` | 32       |
| `SIGNATURE_LENGTH`   | 64       |
| `ADDRESS_LENGTH`     | 26       |
| `MAIN_NET_CHAIN_ID`  | 76 (`L`) |
| `TEST_NET_CHAIN_ID`  | 84 (`T`) |

---

## 💡 Use Cases

This library is essential for a wide range of DecentralChain development scenarios:

### Wallet & Account Management
Generate mnemonic seed phrases, derive key pairs, and compute blockchain addresses. Use `randomSeed()` for new wallets, `keyPair()` for key derivation, and `address()` for protocol-compliant address generation.

### Transaction Signing
Every transaction submitted to the DecentralChain network requires a valid Ed25519 signature. Use `signBytes()` to sign serialized transaction bytes with a seed or private key, and `verifySignature()` on the receiving end to validate authenticity.

### On-Chain Data Verification
Verify the integrity of addresses with `verifyAddress()`, validate public keys with `verifyPublicKey()`, and verify Merkle proofs with `merkleVerify()` for data accountability.

### Encrypted Messaging
Establish secure peer-to-peer communication channels using Diffie-Hellman key exchange (`sharedKey()`) combined with AES encryption (`messageEncrypt()` / `messageDecrypt()`).

### Token & Asset Operations
When building custom tokens, NFTs, or decentralized exchanges on DecentralChain, this library provides the signing and hashing primitives needed to construct and authorize asset issuance, transfer, and exchange transactions.

### Smart Contract (dApp) Interaction
Invoke DecentralChain smart contracts by signing InvokeScript transactions. Use the hashing functions (`blake2b`, `keccak`, `sha256`) for data that must match on-chain computation results.

---

## 🏛️ Architecture & Design

### Design Principles

- **Protocol Fidelity** — Every function mirrors the exact cryptographic operations performed by DecentralChain nodes, ensuring byte-level compatibility with the network
- **Zero Side Effects** — All operations are pure functions that return new values; no global state is mutated
- **Output Flexibility** — The factory-based architecture (`crypto()`) allows choosing between Base58-encoded strings and raw byte arrays at initialization time, avoiding repeated encoding/decoding overhead
- **Minimal Dependencies** — Cryptographic primitives are provided by the [@noble](https://github.com/paulmillr/noble-curves) family of libraries — audited, constant-time, and free of native bindings

### Cryptographic Primitives

| Primitive | Algorithm | Usage in DecentralChain |
| --- | --- | --- |
| Key Generation | Curve25519 (Ed25519) | Wallet key pairs, transaction signing |
| Hashing | Blake2b-256 | Fast hashing for address derivation, block hashing |
| Hashing | Keccak-256 | Second-pass hashing in address derivation |
| Hashing | SHA-256 | General-purpose hashing, seed encryption |
| Symmetric Encryption | AES (CBC/CTR/ECB) | Seed encryption, message encryption |
| Asymmetric Encryption | RSA (PKCS#1 v1.5) | Optional RSA signing/verification |
| Pairing-Based | BLS12-381 | Aggregated signature schemes |
| Key Exchange | X25519 (Diffie-Hellman) | Shared secret for encrypted messaging |

### Module Structure

```
src/
├── index.ts              # Main entry — Base58 output by default
├── bytes.ts              # Alternative entry — Uint8Array output
├── rsa.ts                # RSA operations (separate entry point)
├── crypto/               # Core cryptographic implementations
│   ├── crypto.ts         #   Factory function & output formatting
│   ├── address-keys-seed.ts  #   Key derivation & address building
│   ├── sign.ts           #   Ed25519 signing
│   ├── verification.ts   #   Signature & address verification
│   ├── hashing.ts        #   Blake2b, Keccak, SHA-256
│   ├── encryption.ts     #   AES & seed encryption
│   ├── bls.ts            #   BLS12-381 operations
│   └── ...               #   Additional modules
├── extensions/           # Protocol helpers (ChainId, Seed)
├── conversions/          # Encoding (Base58, Base64, Base16)
└── libs/                 # Low-level utility functions
```

---

## 🖥️ Platform Compatibility

| Platform | Support | Entry Point |
| --- | --- | --- |
| **Node.js** ≥ 24 | ✅ Full support | `@decentralchain/ts-lib-crypto` (ESM) |
| **Modern Browsers** | ✅ Full support | UMD bundle (`dist/index.umd.min.js`) |
| **Deno** | ⚠️ Experimental | ESM import via npm specifier |
| **Bun** | ⚠️ Experimental | ESM import |

> **Note:** The library uses `node:crypto` for RSA operations. The main entry point and bytes entry point do not depend on Node.js built-ins and work in any JavaScript runtime.

---

## 🌐 Browser

A UMD bundle is built at `dist/index.umd.min.js` exposing `DCCCrypto` globally:

```html
<script src="https://unpkg.com/@decentralchain/ts-lib-crypto/dist/index.umd.min.js"></script>
<script>
  const { address, randomSeed } = DCCCrypto;
  console.log(address(randomSeed()));
</script>
```

## 🛠️ Development

### Prerequisites

- Node.js >= 24
- npm >= 10

### Setup

```bash
git clone https://github.com/Decentral-America/ts-lib-crypto.git
cd ts-lib-crypto
npm install
```

### Scripts

| Command                 | Description                          |
| ----------------------- | ------------------------------------ |
| `npm run build`         | Build ESM + CJS + UMD via tsup       |
| `npm test`              | Run tests                            |
| `npm run test:watch`    | Tests in watch mode                  |
| `npm run test:coverage` | Tests with V8 coverage               |
| `npm run typecheck`     | TypeScript type checking             |
| `npm run lint`          | ESLint                               |
| `npm run format`        | Format with Prettier                 |
| `npm run validate`      | Full CI validation pipeline          |
| `npm run bulletproof`   | Format + lint fix + typecheck + test |

### Quality Gates

All PRs must pass the following automated checks to ensure production-grade quality:

```bash
npm run format:check    # No formatting issues
npm run lint            # No lint errors
npm run typecheck       # No type errors
npm run test            # All tests pass
npm run build           # Clean build
npm run check:publint   # Package structure valid
npm run check:exports   # Type exports valid
npm run check:size      # Within size budget
```

## 🤝 Contributing

We welcome contributions from the community! Whether it's bug fixes, new features, documentation improvements, or test coverage — every contribution matters.

See [CONTRIBUTING.md](./CONTRIBUTING.md) for development guidelines.

## 🔒 Security

The security of this library is critical — it handles private keys, seed phrases, and cryptographic operations that protect real assets on the DecentralChain network.

See [SECURITY.md](./SECURITY.md) for vulnerability reporting.

## 📜 Code of Conduct

See [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md).

## 📋 Changelog

See [CHANGELOG.md](./CHANGELOG.md) for release history.

---

## 🌍 Ecosystem

This library is part of the broader DecentralChain developer toolkit:

| Package | Description |
| --- | --- |
| **@decentralchain/ts-lib-crypto** | Cryptographic primitives (this library) |
| **[@decentralchain/ts-types](https://github.com/Decentral-America/ts-types)** | TypeScript type definitions for DecentralChain protocol |
| **[@decentralchain/dcc-proto-serialization](https://github.com/Decentral-America/dcc-proto-serialization)** | Protobuf serialization for DecentralChain transactions |

> Visit the [Decentral-America GitHub organization](https://github.com/Decentral-America) to explore all official packages and tools.

---

## 📄 License

[MIT](./LICENSE) — Copyright (c) 2026-present DecentralChain

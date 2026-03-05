<p align="center">
  <a href="https://decentralchain.io">
    <img src="https://avatars.githubusercontent.com/u/75630395?s=200" alt="DecentralChain" width="80" />
  </a>
</p>

<h3 align="center">@decentralchain/ts-lib-crypto</h3>

<p align="center">
  Cryptographic library for the DecentralChain blockchain — key generation, signing, hashing, encoding.
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@decentralchain/ts-lib-crypto"><img src="https://img.shields.io/npm/v/@decentralchain/ts-lib-crypto?color=blue" alt="npm" /></a>
  <a href="./LICENSE"><img src="https://img.shields.io/npm/l/@decentralchain/ts-lib-crypto" alt="license" /></a>
  <a href="https://bundlephobia.com/package/@decentralchain/ts-lib-crypto"><img src="https://img.shields.io/bundlephobia/minzip/@decentralchain/ts-lib-crypto" alt="bundle size" /></a>
  <a href="./package.json"><img src="https://img.shields.io/node/v/@decentralchain/ts-lib-crypto" alt="node" /></a>
</p>

---

## Overview

The DecentralChain protocol uses well-established cryptographic primitives including Curve25519 (Ed25519/X25519), Blake2b, Keccak-256, SHA-256, AES, RSA, and BLS12-381. This library provides all algorithm implementations and protocol utilities (address derivation, seed management, signature verification) needed by DecentralChain applications.

**Part of the [DecentralChain](https://docs.decentralchain.io) SDK.**

## Installation

```bash
npm install @decentralchain/ts-lib-crypto
```

> Requires **Node.js >= 24** and an ESM environment (`"type": "module"`).

## Quick Start

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

## Import Styles

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

## API Reference

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

## Browser

A UMD bundle is built at `dist/index.umd.min.js` exposing `DCCCrypto` globally:

```html
<script src="https://unpkg.com/@decentralchain/ts-lib-crypto/dist/index.umd.min.js"></script>
<script>
  const { address, randomSeed } = DCCCrypto;
  console.log(address(randomSeed()));
</script>
```

## Development

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

All PRs must pass:

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

## Related packages

| Package | Description |
| --- | --- |
| [`@decentralchain/transactions`](https://www.npmjs.com/package/@decentralchain/transactions) | Transaction builders and signers |
| [`@decentralchain/signer`](https://www.npmjs.com/package/@decentralchain/signer) | Transaction signing orchestrator |
| [`@decentralchain/ts-types`](https://www.npmjs.com/package/@decentralchain/ts-types) | Core TypeScript type definitions |
| [`@decentralchain/signature-adapter`](https://www.npmjs.com/package/@decentralchain/signature-adapter) | Multi-provider signing adapter |

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md).

## Security

To report a vulnerability, see [SECURITY.md](./SECURITY.md).

## License

[MIT](./LICENSE) — Copyright (c) [DecentralChain](https://decentralchain.io)

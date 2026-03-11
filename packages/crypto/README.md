# @decentralchain/crypto

Cryptographic functions for the DecentralChain blockchain — key generation, signing, hashing, encryption, and encoding built on Rust/WASM and WebCrypto.

## Installation

```sh
npm install @decentralchain/crypto
```

## Usage

All crypto functions are **async** (WASM initialization + WebCrypto).

```typescript
import {
  createAddress,
  createPrivateKey,
  createPublicKey,
  signBytes,
  verifySignature,
  base58Encode,
} from '@decentralchain/crypto';

// Generate keys from a seed phrase
const privateKey = await createPrivateKey('your seed phrase here');
const publicKey = await createPublicKey(privateKey);
const address = await createAddress(publicKey);

console.log('Address:', base58Encode(address));

// Sign and verify
const message = new Uint8Array([1, 2, 3, 4]);
const signature = await signBytes(privateKey, message);
const isValid = await verifySignature(publicKey, message, signature);
```

### Encoding

```typescript
import {
  base16Encode, base16Decode,
  base58Encode, base58Decode,
  base64Encode, base64Decode,
  utf8Encode, utf8Decode,
} from '@decentralchain/crypto';

const bytes = utf8Encode('hello');
const hex = base16Encode(bytes);      // '68656c6c6f'
const b58 = base58Encode(bytes);      // 'Cn8eVZg'
const b64 = base64Encode(bytes);      // 'aGVsbG8='
```

### Hashing

```typescript
import { blake2b, keccak } from '@decentralchain/crypto';

const hash = blake2b(data);   // 32-byte BLAKE2b
const kHash = keccak(data);   // 32-byte Keccak-256
```

### Seed Encryption

```typescript
import { encryptSeed, decryptSeed } from '@decentralchain/crypto';

const encrypted = await encryptSeed('my seed phrase', 'password');
const decrypted = await decryptSeed(encrypted, 'password');
```

### Message Encryption (Diffie-Hellman)

```typescript
import {
  createSharedKey,
  encryptMessage,
  decryptMessage,
} from '@decentralchain/crypto';

const sharedKey = await createSharedKey(myPrivateKey, theirPublicKey);
const encrypted = await encryptMessage(sharedKey, message, 'prefix');
const decrypted = await decryptMessage(sharedKey, encrypted, 'prefix');
```

### Random Seed Generation

```typescript
import { generateRandomSeed } from '@decentralchain/crypto';

const seed = generateRandomSeed(); // 15-word mnemonic seed phrase
```

## API

| Function | Description |
|----------|-------------|
| `base16Encode(bytes)` | Encode bytes to hex string |
| `base16Decode(hex)` | Decode hex string to bytes |
| `base58Encode(bytes)` | Encode bytes to Base58 string |
| `base58Decode(b58)` | Decode Base58 string to bytes |
| `base64Encode(bytes)` | Encode bytes to Base64 string |
| `base64Decode(b64)` | Decode Base64 string to bytes |
| `utf8Encode(str)` | Encode string to UTF-8 bytes |
| `utf8Decode(bytes)` | Decode UTF-8 bytes to string |
| `blake2b(data)` | BLAKE2b-256 hash |
| `keccak(data)` | Keccak-256 hash |
| `createAddress(publicKey, chainId?)` | Derive address from public key |
| `createPrivateKey(seed, nonce?)` | Derive Ed25519 private key from seed |
| `createPublicKey(privateKey)` | Derive public key from private key |
| `createSharedKey(privateKey, publicKey)` | X25519 Diffie-Hellman shared key |
| `signBytes(privateKey, data)` | Ed25519 signature |
| `verifySignature(publicKey, data, signature)` | Verify Ed25519 signature |
| `verifyAddress(address, chainId?)` | Validate address checksum |
| `encryptSeed(seed, password)` | AES-ECB encrypt seed phrase |
| `decryptSeed(encrypted, password)` | AES-ECB decrypt seed phrase |
| `encryptMessage(sharedKey, message, prefix)` | AES-CBC encrypt with shared key |
| `decryptMessage(sharedKey, encrypted, prefix)` | AES-CBC decrypt with shared key |
| `generateRandomSeed(size?)` | Generate BIP39-compatible mnemonic |

## Architecture

The library uses a hybrid Rust/WASM + TypeScript architecture:

- **Rust/WASM**: Ed25519 key generation, X25519 key exchange, signing, verification, MD5 (for legacy AES key derivation)
- **TypeScript + WebCrypto**: AES-CBC/ECB encryption, BLAKE2b/Keccak hashing (via `@noble/hashes`), Base58 encoding (via `@scure/base`)

## Building from Source

Requires [Rust](https://rustup.rs/) and [wasm-pack](https://rustwasm.github.io/wasm-pack/):

```sh
npm run build:wasm   # Compile Rust → WASM
npm run build:ts     # Compile TypeScript
npm run build        # Both steps
```

## License

[MIT](LICENSE)

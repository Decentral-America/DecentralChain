# io.decentralchain:crypto

Cryptographic primitives for the DecentralChain blockchain.

Forked from [`Decentral-America/crypto`](https://github.com/Decentral-America/crypto) v2.0.7 with full upstream commit history.

## Features

| Class | Description |
|-------|-------------|
| `Crypto` | Curve25519 key generation, seed derivation, signing/verification |
| `Hash` | Blake2b256, Keccak256, SHA256, fast-hash (Blake2b → Keccak256) |
| `Bytes` | Byte array utilities (concat, split, compare) |
| `BlsUtils` | BLS12-381 signature utilities |
| `MerkleTree` | Merkle root and proof construction |
| `base/Base16` | Hex encoding/decoding |
| `base/Base58` | Bitcoin Base58 encoding/decoding |
| `base/Base64` | Standard + URL-safe Base64 encoding/decoding |
| `rsa/RsaKeyPair` | RSA key pair generation and signing |
| `rsa/RsaPublicKey` | RSA signature verification |

## Requirements

- Java 25+
- Maven 3.9+

## Usage

```xml
<dependency>
  <groupId>io.decentralchain</groupId>
  <artifactId>crypto</artifactId>
  <version>2.0.7</version>
</dependency>
```

```java
import io.decentralchain.crypto.Crypto;
import io.decentralchain.crypto.Hash;
import io.decentralchain.crypto.base.Base58;

// Generate seed and key pair
String seed = Crypto.getRandomSeedPhrase(15);
byte[] privateKey = Crypto.getPrivateKey(seed);
byte[] publicKey  = Crypto.getPublicKey(privateKey);
byte[] address    = Crypto.getAddress(publicKey, (byte) 63); // mainnet

// Hash
byte[] hash = Hash.blake(data);           // Blake2b256
byte[] fast  = Hash.fastHash(data);       // Blake2b → Keccak256

// Encode
String b58  = Base58.encode(address);
byte[] back = Base58.decode(b58);
```

## Build

```bash
mvn verify            # compile + test + JaCoCo coverage
mvn verify -P audit   # + SpotBugs + PMD + OWASP dependency-check
mvn package -P release -Dgpg.skip=true  # local install without signing
```

## Upstream

- **Source**: [Decentral-America/crypto](https://github.com/Decentral-America/crypto)
- **Upstream version**: v2.0.7 (Feb 11, 2026)
- **License**: MIT

## License

MIT — see [LICENSE](LICENSE).

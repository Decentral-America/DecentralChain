# Waves Crypto for Java

[![Maven Central](https://badgen.net/maven/v/maven-central/com.wavesplatform/waves-crypto?icon=maven&label=latest&cache=3600)](https://search.maven.org/artifact/com.wavesplatform/waves-crypto)
[![Checks](https://badgen.net/github/checks/wavesplatform/waves-crypto-java?icon=github&cache=600)](https://github.com/wavesplatform/waves-crypto-java/actions)

[![Waves Node GitHub](https://badgen.net/badge/icon/Waves%20Node?icon=github&label&color=gray&cache=86400)](https://github.com/wavesplatform/waves)
[![Telegram](https://badgen.net/badge/icon/Waves%20Dev%20Jedi?icon=telegram&label=Telegram&cache=86400)](https://t.me/waves_ride_dapps_dev)
[![Awesome Waves](https://badgen.net/badge/icon/Waves?icon=awesome&label=Awesome&color=pink&cache=86400)](https://github.com/msmolyakov/awesome-waves)

## Table of contents

- [How to install](#how-to-install)
- [Quick start](#quick-start)
- [Cryptography](#cryptography)
  - [Seed phrase](#seed-phrase)
  - [Account seed](#account-seed)
  - [Private and public keys](#private-and-public-keys)
  - [Address](#address)
  - [Signing](#signing)
- [Base encodings](#base-encodings)
- [Hashing algorithms](#hashing-algorithms)
- [Merkle tree](#merkle-tree)
- [RSA](#rsa)

## How to install

1. Go to the [Waves-Crypto page at Maven Central](https://search.maven.org/artifact/com.wavesplatform/waves-crypto);
1. open the latest version page of the library;
1. copy&paste dependency template into your project management tool config file (Maven, Gradle, etc).

## Quick start

Here's a complete example of how to generate a new Waves account:

```java
import com.wavesplatform.crypto.Crypto;
import com.wavesplatform.crypto.base.Base58;

public class WavesAccount {
    
    public static final byte MAINNET = 'W';
    public static final byte TESTNET = 'T';
    
    public static void main() {
        String seedPhrase = Crypto.getRandomSeedPhrase();
        
        byte[] accountSeed = Crypto.getAccountSeed(seedPhrase);
        byte[] privateKey = Crypto.getPrivateKey(accountSeed);
        byte[] publicKey = Crypto.getPublicKey(privateKey);
        
        byte[] publicKeyHash = Crypto.getPublicKeyHash(publicKey);
        byte[] mainnetAddress = Crypto.getAddress(MAINNET, publicKeyHash);
        byte[] testnetAddress = Crypto.getAddress(TESTNET, publicKeyHash);

        System.out.println("# Account details");
        System.out.println("Seed phrase:\t" + seedPhrase);
        System.out.println("Private key:\t" + Base58.encode(privateKey));
        System.out.println("Public key:\t" + Base58.encode(publicKey));
        System.out.println("Mainnet address:\t" + Base58.encode(mainnetAddress));
        System.out.println("Testnet address:\t" + Base58.encode(testnetAddress));
    }
}
```

## Cryptography

Please read about Waves cryptography on [the official documentation page](https://docs.waves.tech/en/blockchain/waves-protocol/cryptographic-practical-details).

### Seed phrase

Seed phrase also means Recovery phrase.

This is usually a sequence of several words, but technically it's just an array of arbitrary bytes.

#### Human-readable phrase

```java
String seedPhraseOf15WordsByDefault = Crypto.getRandomSeedPhrase();
String seedPhraseOfCustomWordsNumber = Crypto.getRandomSeedPhrase(15);
```

#### Random bytes phrase

```java
byte[] seedPhraseOf255BytesByDefault = Crypto.getRandomSeedBytes();
byte[] seedPhraseOfCustomNumberOfBytes = Crypto.getRandomSeedBytes(255);
```

### Account seed

Account seed is a hash of seed phrase and nonce.

Nonce allows creating multiple addresses from a single seed phrase.

The default nonce is 0.

```java
byte[] accountSeedWithNonce0ByDefault = Crypto.getAccountSeed(seedPhrase);
byte[] accountSeedWithSpecificNonce = Crypto.getAccountSeed(seedPhrase, 1);
```

### Private and public keys

From account seed, you can calculate a pair of private and public keys.

```java
byte[] privateKey = Crypto.getPrivateKey(accountSeed);
byte[] publicKey = Crypto.getPublicKey(privateKey);
```

### Address

Account address contains hash of public key, so you need to calculate that hash first.

```java
byte chainId = 'T';
byte[] publicKeyHash = Crypto.getPublicKeyHash(publicKey);

byte[] address = Crypto.getAddress(chainId, publicKeyHash);
```

### Signing

If you have generated an account, you can sign messages with private key and validate resulting signature with public key.

```java
byte[] message = new Random().nextBytes(new byte[32]);

byte[] proof = Crypto.sign(privateKey, message);
boolean isValid = Crypto.isProofValid(publicKey, message, proof);
```

## Base encodings

In the Waves blockchain, all binary data is presented in Base Encodings:

* Base58 is used for "short" values like:
  - private and public keys
  - addresses
  - proofs
  - transaction id
  - asset id
* Base64 is used for potentially long values like:
  - compiled Ride scripts
  - binary arguments of smart contract invocations
  - binary entries in account data storage
* Base16 is available in smart contracts for any purpose.

```java
byte[] message = new Random().nextBytes(new byte[32]);

String base58Encoded = Base58.encode(message);
String base64Encoded = Base64.encode(message);
String base16Encoded = Base16.encode(message);

byte[] base58Decoded = Base58.decode(base58Encoded);
byte[] base64Decoded = Base64.decode(base64Encoded);
byte[] base16Decoded = Base16.decode(base16Encoded);
```

All decoded results are equal to the initial message.

## Hashing algorithms

There are supported hashing algorithms:

* sha256
* blake2b256
* keccak256

```java
byte[] message = new Random().nextBytes(new byte[32]);

byte[] shaHash = Hash.sha256(message);
byte[] blakeHash = Hash.blake(message);
byte[] keccakHash = Hash.keccak(message);

// the same as blake hashing
byte[] fastHash = Hash.fastHash(message);

// sequential hashing with blake and then keccak
byte[] secureHash = Hash.secureHash(message);
```

## Merkle tree

TBD... see [TestMerkleTree](./src/test/java/com/wavesplatform/crypto/TestMerkleTree.java) for usage examples.

## RSA

TBD... see [TestRsa](./src/test/java/com/wavesplatform/crypto/TestRsa.java) for usage examples.

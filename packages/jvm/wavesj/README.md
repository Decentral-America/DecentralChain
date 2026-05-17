<div align="center">
  <img src="https://avatars.githubusercontent.com/u/79326247?s=80" width="80" alt="DecentralChain logo" />

  ### wavesj

  Java library to interact with the DecentralChain blockchain

  [![Maven Central](https://img.shields.io/maven-central/v/io.decentralchain/wavesj?label=Maven%20Central)](https://central.sonatype.com/artifact/io.decentralchain/wavesj)
  [![License: Apache 2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)
  [![Java 25](https://img.shields.io/badge/Java-25-orange)](https://openjdk.org/projects/jdk/25/)
  [![CI](https://github.com/Decentral-America/DecentralChain/actions/workflows/wavesj.yml/badge.svg)](https://github.com/Decentral-America/DecentralChain/actions/workflows/wavesj.yml)
</div>

---

## Overview

`wavesj` is the DecentralChain fork of [wavesplatform/WavesJ](https://github.com/wavesplatform/WavesJ),
published as `io.decentralchain:wavesj:1.6.4.0`.

It provides a complete Java library for interacting with the DecentralChain / Waves blockchain:

- **Node HTTP client** — full coverage of the [DCC Node REST API](https://nodes.decentralchain.io/api-docs/index.html)
  via JDK built-in `java.net.http.HttpClient` (no external HTTP dependencies)
- **Transaction building + signing** — all transaction types via the sibling `transactions-java` library
- **EVM/Ethereum support** — `DccEthConverter` for Ethereum-compatible transaction signing
- **Ride script compiler** — compile + estimate scripts against a live node
- **Account primitives** — `PrivateKey`, `PublicKey`, `Address`, `Proof`, `Id`
- **Jackson JSON integration** — `DccMapper` and `DccModule` for node API serialization
- **DCC node profiles** — preconfigured mainnet + testnet endpoints

### Upstream reference

| Item          | Value                                                          |
|---------------|----------------------------------------------------------------|
| Upstream repo | `wavesplatform/WavesJ`                                         |
| Fork base     | commit `2f78fd3f6` (WavesJ 1.6.4-SNAPSHOT, May 2026)          |
| DCC version   | `1.6.4.0`                                                      |
| License       | Apache 2.0 (inherited from upstream)                           |

---

## Installation

### Maven

```xml
<dependency>
  <groupId>io.decentralchain</groupId>
  <artifactId>wavesj</artifactId>
  <version>1.6.4.0</version>
</dependency>
```

### Gradle (Kotlin DSL)

```kotlin
implementation("io.decentralchain:wavesj:1.6.4.0")
```

### SBT

```scala
libraryDependencies += "io.decentralchain" % "wavesj" % "1.6.4.0"
```

---

## Quick Start

```java
// Connect to the DCC mainnet node
Node node = new Node(Profile.MAINNET);
System.out.println("Current height: " + node.getHeight());

// Create a keypair from a seed phrase
String seed = Crypto.getRandomSeedPhrase();
PrivateKey privateKey = PrivateKey.fromSeed(seed);
PublicKey publicKey  = PublicKey.from(privateKey);
Address  address     = Address.from(publicKey);

System.out.println("My balance: " + node.getBalance(address));

// Broadcast a transfer
Address recipient = new Address("3PEkTn69hcVFtcN7K4ZcbxVzxJFAHpfYM41");
node.broadcast(
    TransferTransaction.builder(recipient, Amount.of(1_00000000, Asset.WAVES))
        .getSignedWith(privateKey)
);
```

See the upstream [WavesJ examples](https://github.com/wavesplatform/WavesJ) for
detailed usage of Exchange, InvokeScript, SetScript, and more.

---

## DCC-specific classes

| Class | Purpose |
|---|---|
| `Profile.MAINNET` | DCC mainnet node URL |
| `Profile.TESTNET` | DCC testnet node URL |
| `DccEthConverter` | Ethereum-compatible transaction signing (EVM support) |
| `DccModule` | Jackson module for DCC-specific JSON types |
| `DccMapper` | Pre-configured `ObjectMapper` with `DccModule` registered |

---

## Building locally

```bash
cd packages/jvm/wavesj
export JAVA_HOME="$(brew --prefix openjdk)"
./mvnw verify                                    # unit tests + SpotBugs + JaCoCo
./mvnw verify -P audit -Ddependency-check.skip   # add PMD analysis
./mvnw verify -P integration-test                # requires Docker + DCC node image
```

---

## Relation to sibling packages

| Package | Purpose |
|---|---|
| `transactions-java` | Binary + JSON serialization for all transaction types |
| **`wavesj`** | HTTP Node client + high-level API (depends on `transactions-java`) |
| `curve25519-java` | Native curve25519 cryptography |
| `blst-java` | Native BLS12-381 cryptography |
| `zwaves` | ZK-SNARK proof utilities |

---

## Known issues

See [KNOWN_ISSUES.md](KNOWN_ISSUES.md).

## Security

See [SECURITY.md](SECURITY.md).

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

Apache License, Version 2.0 — see [LICENSE](LICENSE).


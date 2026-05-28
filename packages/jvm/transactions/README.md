<div align="center">
  <img src="https://avatars.githubusercontent.com/u/79326247?s=80" width="80" alt="DecentralChain logo" />

  ### transactions

  Binary and JSON serialization for all DecentralChain / Waves transaction types

  [![Maven Central](https://img.shields.io/maven-central/v/io.decentralchain/transactions?label=Maven%20Central)](https://central.sonatype.com/artifact/io.decentralchain/transactions)
  [![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
  [![Java 25](https://img.shields.io/badge/Java-25-orange)](https://openjdk.org/projects/jdk/25/)
  [![CI](https://github.com/Decentral-America/DCC/actions/workflows/transactions.yml/badge.svg)](https://github.com/Decentral-America/DCC/actions/workflows/transactions.yml)
</div>

---

## Overview

`transactions` is the DecentralChain fork of
[Decentral-America/transactions-java](https://github.com/Decentral-America/transactions-java),
published as `io.decentralchain:transactions:1.0.0`.

It provides the complete serialization layer for **all** transaction types used in
the DecentralChain / Waves blockchain:

- **Standard Waves transactions** — Transfer, Issue, Reissue, Burn, Exchange,
  Lease, LeaseCancel, Alias, Data, SetScript, SetAssetScript, SponsorFee,
  MassTransfer, UpdateAssetInfo, InvokeScript, Payment, Genesis
- **Ethereum-compatible transactions** — EIP-155 signing, ABI encoding for
  Transfer and InvokeScript payloads via [web3j](https://github.com/LFDT-web3j/web3j)
- **Protobuf codec** — full read/write support for `SignedTransaction` and
  related protobuf types from `protobuf-schemas`
- **JSON codec** — Jackson-based serialization for node API interop
- **Account primitives** — `PrivateKey`, `PublicKey`, `Address`, `Proof`, `Id`

### Upstream reference

| Item          | Value                                                                      |
|---------------|----------------------------------------------------------------------------|
| Upstream repo | `Decentral-America/transactions-java`                                    |
| Fork base     | commit `e6afed3` — Version 1.2.7 (Feb 11, 2026)                           |
| DCC version   | `1.0.0`                                                                    |
| License       | MIT (inherited from upstream)                                              |

---

## Installation

### Maven

```xml
<dependency>
  <groupId>io.decentralchain</groupId>
  <artifactId>transactions</artifactId>
  <version>1.0.0</version>
</dependency>
```

### Gradle (Kotlin DSL)

```kotlin
implementation("io.decentralchain:transactions:1.0.0")
```

---

## Quick start

### Build a signed Transfer transaction

```java
import com.decentralchain.transactions.TransferTransaction;
import com.decentralchain.transactions.account.PrivateKey;
import com.decentralchain.transactions.common.Amount;
import com.decentralchain.transactions.WavesConfig;

WavesConfig.chainId('W'); // mainnet

PrivateKey sender = PrivateKey.fromSeed("your seed phrase");
TransferTransaction tx = TransferTransaction.builder(recipient, Amount.of(100_000_000L))
        .fee(Amount.of(100_000L))
        .getSignedWith(sender);

System.out.println(tx.toJson());
```

### Build an Ethereum-compatible transaction

```java
import com.decentralchain.transactions.EthereumTransaction;
import org.web3j.crypto.ECKeyPair;
import java.math.BigInteger;

ECKeyPair keyPair = ECKeyPair.create(privateKeyBytes);
EthereumTransaction tx = EthereumTransaction.transfer(
        recipient, Amount.of(100_000_000L),
        EthereumTransaction.DEFAULT_GAS_PRICE,
        (byte) 'W', 100_000L, System.currentTimeMillis(), keyPair);
```

### Parse a raw transaction

```java
import com.decentralchain.transactions.Transaction;

Transaction tx = Transaction.fromJson(jsonString);
Transaction txFromBytes = Transaction.fromBytes(rawBytes);
```

---

## Requirements

| Tool  | Minimum |
|-------|---------|
| Java  | 25      |
| Maven | 3.9     |

---

## Building locally

```bash
# Requires JAVA_HOME pointing to JDK 25
JAVA_HOME=/opt/homebrew/opt/java ./mvnw verify
```

### Running tests

```bash
JAVA_HOME=/opt/homebrew/opt/java ./mvnw test
```

### OWASP dependency audit

```bash
JAVA_HOME=/opt/homebrew/opt/java ./mvnw verify -P audit -DnvdApiKey=$NVD_API_KEY
```

---

## Dependencies

| Artifact                              | Version | License |
|---------------------------------------|---------|---------|
| `io.decentralchain:crypto`             | 2.0.7   | MIT     |
| `io.decentralchain:protobuf-schemas`   | 1.6.2   | MIT     |
| `com.fasterxml.jackson.core:jackson-databind` | 2.21.3 | Apache 2.0 |
| `org.web3j:crypto`                    | 5.0.2   | Apache 2.0 |

Test dependencies: `org.junit.jupiter:junit-jupiter:5.14.4`,
`org.assertj:assertj-core:3.27.7`.

---

## Modernization notes (DCC fork)

The following changes were applied on top of the upstream `v1.2.7` baseline
when creating the DCC fork:

1. **Java 11 → Java 25** — compiler release flag updated; no source changes needed
2. **`io.decentralchain` group ID** — published as `io.decentralchain:transactions`
3. **web3j:crypto `4.9.8` → `5.0.2`** — `TransactionEncoder.encode(RawTransaction, Sign.SignatureData)` became public in web3j 5.x; the reflection hack (`getDeclaredMethod` + `setAccessible`) was **removed** and replaced with a direct method call
4. **jackson-databind `2.16.1` → `2.21.3`** — latest; no breaking changes for this usage
5. **junit-jupiter `5.8.1` → `5.14.4`** — latest; backwards compatible
6. **Maven plugins at latest stable** — compiler 3.15.0, surefire 3.5.5, central-publishing 0.10.0, enforcer 3.6.2
7. **GPG / publishing moved to `release` profile** — dev builds don't require GPG keys
8. **OWASP dependency-check** added in `audit` profile

---

## License

MIT — see [LICENSE](LICENSE).

Original work © Wavesplatform contributors.  
Fork © 2026-present [Decentral America](https://decentralchain.io).

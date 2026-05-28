[![Maven Central](https://img.shields.io/maven-central/v/io.decentralchain/java-sdk.svg?label=Maven%20Central)](https://central.sonatype.com/artifact/io.decentralchain/java-sdk)
[![CI](https://github.com/Decentral-America/java-sdk/actions/workflows/ci.yml/badge.svg)](https://github.com/Decentral-America/java-sdk/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

# DecentralChain Java SDK

A Java library for interacting with the [DecentralChain](https://decentralchain.io) blockchain.

Supports node interaction, offline transaction signing, and creating addresses and keys.

> **Upstream:** This library is a maintained fork of [Decentral-America/java-sdk](https://github.com/Decentral-America/java-sdk),
> rebranded and extended for the DecentralChain ecosystem.

## Requirements

- Java 11 or above

## Installation

### Maven

```xml
<dependency>
    <groupId>io.decentralchain</groupId>
    <artifactId>java-sdk</artifactId>
    <version>1.6.4</version>
</dependency>
```

### Gradle

```groovy
implementation 'io.decentralchain:java-sdk:1.6.4'
```

### SBT

```scala
libraryDependencies += "io.decentralchain" % "java-sdk" % "1.6.4"
```

## Getting Started

### Create an account

```java
String seed = Crypto.getRandomSeedPhrase();
PrivateKey privateKey = PrivateKey.fromSeed(seed);
PublicKey publicKey = PublicKey.from(privateKey);
Address address = Address.from(publicKey);
```

### Connect to a node

```java
Node node = new Node(Profile.MAINNET);
System.out.println("Current height: " + node.getHeight());
System.out.println("Balance: " + node.getBalance(address));
```

### Send a transfer

```java
Address recipient = new Address("3N9gDFq8tKFhBDBTQxR3zqvtpXjw5wW3syA");
node.broadcast(
    TransferTransaction.builder(recipient, Amount.of(1_00000000, Asset.WAVES))
        .getSignedWith(privateKey)
);
```

### Set a script on an account

```java
Base64String script = node
    .compile("{-# CONTENT_TYPE EXPRESSION #-} sigVerify(tx.bodyBytes, tx.proofs[0], tx.senderPublicKey)")
    .script();
node.broadcast(new SetScriptTransaction(publicKey, script).addProof(privateKey));
```

## Development

### Build & verify

```bash
./mvnw verify -Dgpg.skip=true -Dsigstore.skip=true
```

### Tests only

```bash
./mvnw test
```

### Static analysis

```bash
./mvnw spotbugs:check
./mvnw checkstyle:check
```

### Coverage report

```bash
./mvnw jacoco:report
# open target/site/jacoco/index.html
```

## Publishing

Releases are published to Maven Central via the [publish workflow](.github/workflows/publish-java-sdk.yml).
Snapshots are available at:
```
https://central.sonatype.com/repository/maven-snapshots/
```

## Upstream Tracking

This repository tracks `Decentral-America/java-sdk` as the `upstream` remote:

```bash
git fetch upstream
git merge upstream/master --no-ff -m "chore: merge upstream WavesJ <tag>"
```

## License

MIT — see [LICENSE](LICENSE).

# groth16 — ZK-SNARK Groth16 Verifier for DecentralChain

[![CI](https://github.com/Decentral-America/DecentralChain/actions/workflows/groth16.yml/badge.svg)](https://github.com/Decentral-America/DecentralChain/actions/workflows/groth16.yml)
[![Maven Central](https://img.shields.io/maven-central/v/io.decentralchain/groth16.svg)](https://central.sonatype.com/artifact/io.decentralchain/groth16)

Java JNI bindings for [Decentral-America/zwaves](https://github.com/Decentral-America/zwaves) —
a ZK-SNARK Groth16 proof verifier for **BLS12-381** (Zcash Sapling) and **BN256**
(Ethereum/Zcash) elliptic curves, implemented in Rust via the
[bellman](https://github.com/zkcrypto/bellman) and
[pairing](https://github.com/zkcrypto/pairing) crates.

Forked from `Decentral-America/zwaves` at commit `d4546dbb` with full upstream history.
Published as `io.decentralchain:groth16` under the DCC JVM ecosystem standard.

---

## What this library does

The library exposes a single native method per curve:

```java
// BLS12-381 (Zcash Sapling Groth16)
boolean result = com.decentralchain.groth16.bls12.Groth16.verify(vk, proof, inputs);

// BN256 (Ethereum / Zcash Groth16)
boolean result = com.decentralchain.groth16.bn256.Groth16.verify(vk, proof, inputs);
```

All arguments are raw bytes:
- `vk` — verification key
- `proof` — Groth16 proof
- `inputs` — public inputs (empty `byte[]` if none)

Returns `true` if the proof is valid, `false` otherwise (including malformed inputs).

---

## Supported platforms

Pre-built native libraries are bundled in the JAR for all supported platforms:

| OS | Architecture | Library |
|----|-------------|---------|
| Linux | amd64 | `libgroth16_jni.so` |
| Linux | aarch64 | `libgroth16_jni.so` |
| Linux | x86 (32-bit) | `libgroth16_jni.so` |
| macOS | aarch64 (Apple Silicon) | `libgroth16_jni.dylib` |
| macOS | x86_64 (Intel) | `libgroth16_jni.dylib` |
| Windows | amd64 | `groth16_jni.dll` |
| Windows | x86 (32-bit) | `groth16_jni.dll` |

The library is loaded automatically at class initialization via the embedded
`JNILibrary` loader (extracted to a temp directory on first use).

---

## Installation

### Maven
```xml
<dependency>
  <groupId>io.decentralchain</groupId>
  <artifactId>groth16</artifactId>
  <version>0.2.1.0</version>
</dependency>
```

### Gradle (Kotlin DSL)
```kotlin
implementation("io.decentralchain:groth16:0.2.1.0")
```

---

## Building from source

### Prerequisites
- Java 25+
- Rust stable (1.88+, target for your platform)
- Cargo in `PATH`

### Build native library (macOS aarch64)

```bash
cd groth16_jni
cargo build --release --target aarch64-apple-darwin
cp ../target/aarch64-apple-darwin/release/libgroth16_jni.dylib \
   javalib/src/main/resources/META-INF/native/osx64/aarch64/
```

### Build Java library
```bash
export JAVA_HOME=/opt/homebrew/Cellar/openjdk/25.0.2/libexec/openjdk.jdk/Contents/Home
./mvnw verify
```

### Run security audit
```bash
./mvnw verify -P audit -Ddependency-check.skip=true
```

---

## Project structure

```
packages/jvm/groth16/
├── Cargo.toml                    # Rust workspace (upstream)
├── pom.xml                       # Maven build (DCC standard)
├── project.json                  # Nx integration
├── config/
│   ├── pmd-ruleset.xml           # PMD security rules
│   └── spotbugs-exclude.xml      # SpotBugs exclusions (JNILibrary.java)
├── groth16_jni/
│   ├── Cargo.toml                # Rust JNI crate (groth16_jni)
│   ├── src/                      # Rust source (bls12/, bn256/, lib.rs)
│   └── javalib/src/main/
│       ├── java/com/decentralchain/groth16/
│       │   ├── bls12/Groth16.java
│       │   ├── bn256/Groth16.java
│       │   ├── JNILibrary.java   # hawtjni loader (EPL-1.0)
│       │   └── Groth16JNILibrary.java
│       └── resources/META-INF/native/
│           ├── osx64/aarch64/libgroth16_jni.dylib   (prebuilt)
│           └── …other platforms (built in CI)
├── sapling-crypto/               # Rust workspace member (Zcash Sapling)
└── groth16_primitives/            # Rust workspace member
```

---

## Upstream tracking

This package tracks `Decentral-America/zwaves` via `git subtree`:

```bash
# Pull upstream updates:
git subtree pull --prefix=packages/jvm/groth16 \
  upstream-groth16 master --squash
```

Last upstream sync: `d4546dbb5094dd4389207cafd61d0c1a285b6f2b`

---

## License

Apache License 2.0 — see [LICENSE](LICENSE).

`JNILibrary.java` is derived from the [hawtjni](https://github.com/fusesource/hawtjni)
project (FuseSource Corp / Eclipse Foundation) and is licensed under the
Eclipse Public License v1.0.

The upstream Rust codebase (`Decentral-America/zwaves`) is MIT-licensed.

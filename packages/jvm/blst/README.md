# blst

Java JNI bindings for [supranational/blst](https://github.com/supranational/blst) — a high-performance, constant-time BLS12-381 signature library with no external dependencies.

Forked from [wavesplatform/blst-java](https://github.com/wavesplatform/blst-java) (upstream blst v0.3.15), rebranded and hardened to DecentralChain production standards.

Used by the [DecentralChain node](https://github.com/Decentral-America/DCC) for BLS-based threshold signatures and zkSNARK verifier operations.

---

## Maven coordinates

```xml
<dependency>
  <groupId>io.decentralchain</groupId>
  <artifactId>blst</artifactId>
  <version>0.3.15.0</version>
</dependency>
```

### Gradle (Kotlin DSL)

```kotlin
implementation("io.decentralchain:blst:0.3.15.0")
```

---

## Bundled native libraries

The JAR contains pre-built native binaries for all supported platforms. No separate native install is required — the JNI loader in `blstJNI` unpacks the correct library at runtime:

| Platform | Architecture | File |
|:---------|:-------------|:-----|
| Linux | x86_64 | `Linux/amd64/libblst.so` |
| Linux | aarch64 | `Linux/aarch64/libblst.so` |
| Linux | x86 | `Linux/x86/libblst.so` |
| macOS | arm64 (Apple Silicon) | `Mac/aarch64/libblst.dylib` |
| macOS | x86_64 | `Mac/x86_64/libblst.dylib` |
| Windows | x86_64 | `Windows/amd64/blst.dll` |

---

## Requirements

| Requirement | Minimum |
|:------------|:--------|
| Java | 25 |
| Maven (build) | 3.9 |
| blst upstream | 0.3.15 |

---

## Quick start

```java
import supranational.blst.*;

// Generate a key pair
SecretKey sk = new SecretKey();
sk.keygen(seed);                      // seed is a byte[] of ≥ 32 bytes
P1 pk = new P1(sk);

// Sign
byte[] msg = "hello".getBytes();
String dst = "BLS_SIG_BLS12381G2_XMD:SHA-256_SSWU_RO_NUL_";
P2 sig = new P2();
sig.hash_to(msg, dst).sign_with(sk);

// Verify
Pairing ctx = new Pairing(true, dst);
BLST_ERROR err = ctx.aggregate(pk.to_affine(), sig.to_affine(), msg);
ctx.commit();
boolean valid = ctx.finalverify();   // true
```

---

## Build from source

### Prerequisites

- Java 25 (`export JAVA_HOME=/path/to/java-25`)
- Maven 3.9+ (or use the included `./mvnw` wrapper — preferred)
- SWIG 4.4.1 (only needed to regenerate Java bindings from C++ — see below)

### Compile and test

```bash
./mvnw verify
```

### Full security audit

```bash
# SpotBugs + FindSecBugs + PMD (no NVD key needed)
./mvnw verify -P audit -Ddependency-check.skip=true

# Include OWASP CVE scan (requires free API key from nvd.nist.gov)
./mvnw verify -P audit -DnvdApiKey=YOUR_NVD_API_KEY
```

---

## Regenerating the Java bindings (SWIG)

The Java source files in `src/main/java/supranational/blst/` are generated from
the upstream `supranational/blst` C++ headers using SWIG. To regenerate after an
upstream blst version bump:

```bash
# 1. Clone blst at the target version
git clone --branch v0.3.15 https://github.com/supranational/blst /tmp/blst-build/blst

# 2. Run SWIG with the DCC wrapper (blst-dcc.swg patches duplicate Java signatures)
cd /tmp/blst-build/blst/bindings/java
swig -c++ -java -package supranational.blst \
     -outdir /tmp/blst-build/java-src \
     -o /tmp/blst-build/blst_wrap.cpp \
     ../../blst-dcc.swg  # path to blst-dcc.swg from this repo

# 3. Copy generated Java source into src/main/java/supranational/blst/
# 4. Compile the native library for macOS arm64
clang++ -O2 -shared -fPIC -std=c++11 \
  -I /path/to/jdk25/include -I /path/to/jdk25/include/darwin \
  /tmp/blst-build/blst_wrap.cpp \
  /tmp/blst-build/blst/libblst.a \
  -o src/main/resources/supranational/blst/Mac/aarch64/libblst.dylib
```

See `blst-dcc.swg` in this directory for the documented fix applied to upstream's
`bindings/blst.swg` to resolve duplicate Java method signatures.

---

## Version scheme

```
<upstream-blst-version>.<dcc-patch>
```

`0.3.15.0` — upstream blst 0.3.15 + DCC patch 0.

---

## License

[Apache 2.0](LICENSE) — same as upstream supranational/blst.

© 2021–present [Decentral America](https://decentralchain.io)

# Known Issues

> Tracked items in the transactions-java package (DCC fork of
> wavesplatform/waves-transactions-java). Each item includes its risk level,
> reason it is not resolved immediately, and the recommended resolution path.

---

## KNOWN-1: `mvn dependency:analyze` reports non-test scoped test-only dependencies

**Risk:** INFO (build tooling report — no runtime or security impact)

**Description:** Running `mvn dependency:analyze` may report certain
transitive dependencies as "Non-test scoped test only" warnings. These
dependencies are resolved at compile scope because their direct parents
(e.g., `wavesj`) declare them as compile dependencies. The production source
does not call their APIs directly, but they must remain on the classpath at
runtime.

Examples:
- `org.web3j:crypto` — via `wavesj`; used by EVM transaction support
- `com.google.protobuf:protobuf-java` — pinned in `<dependencyManagement>`
  for version alignment; runtime-required by protobuf codegen

**Why not resolved:** This is a known limitation of Maven's dependency
analysis tool when working with large dependency graphs. The analysis
cannot distinguish between "code references exist but are indirect" and
"dependency is truly unused".

**Resolution path:**
- Suppress known false positives in `.mvn/analyze-suppression.txt`
- Tracking improves automatically as DCC-249 (namespace rename) and
  DCC-252 (lang fork) progress, giving full control of the dependency tree.

---

## KNOWN-2: EVM transaction support requires web3j crypto (external dependency)

**Risk:** LOW (supply chain — external dependency with active maintenance)

**Description:** Ethereum-compatible transaction encoding and decoding
depends on `org.web3j:crypto` for secp256k1 key operations and RLP encoding.
This introduces a non-trivial transitive dependency tree from the web3j
ecosystem.

**Why not replaced:** Implementing secp256k1 operations from scratch is
high-risk cryptographic work. web3j is actively maintained and widely
used in the Ethereum JVM ecosystem.

**Resolution path:**
- If web3j is ever deprecated or security-compromised, replace with
  Bouncy Castle's `ECDSASigner` + a standalone RLP library.
- Monitor web3j releases in `renovate.json` and security advisories.

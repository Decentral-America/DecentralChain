# Known Issues

> Tracked items in the zwaves package (DCC fork of Decentral-America/zwaves).
> Each item includes its risk level, reason it is not resolved immediately,
> and the recommended resolution path.

---

## KNOWN-1: Rust dependency tree contains three un-upgradable cargo audit advisories

**Risk:** LOW (see per-advisory rationale below — vulnerable code paths are
NOT reachable from the zwaves JNI public API)

**Description:** Three vulnerability advisories exist in the transitive Rust
dependency chain rooted at `sapling-crypto 0.0.1`:

| Advisory | Crate | Severity | Vulnerable Path |
|---|---|---|---|
| RUSTSEC-2022-0011 | rust-crypto 0.2.36 | HIGH | AES miscomputation |
| RUSTSEC-2022-0004 | rustc-serialize 0.3.25 | HIGH | JSON stack overflow |
| RUSTSEC-2020-0071 | time 0.1.45 | MEDIUM (CVSS 6.2) | localtime_r segfault |

**Why these cannot be patched:**  
`sapling-crypto` is a vendored snapshot of the Zcash Sapling cryptographic
library, pinned at a specific commit that matches the **Sapling trusted setup
parameters** used by the DecentralChain ZK verifier. Upgrading any dependency
within `sapling-crypto` would require regenerating the Groth16 proving
parameters (a multi-party trusted ceremony) and would break every existing
ZK proof on the DecentralChain network.

**Risk assessment per advisory:**

- **RUSTSEC-2022-0011** (AES miscomputation): zwaves never calls any AES
  function. The vulnerable `crypto::aes` module is compiled into the binary
  but its code path is unreachable from `groth16_jni`'s `Java_com_decentralchain_groth16_*`
  JNI entry points. The only operations zwaves exposes are Groth16 BN256/BLS12
  pairing checks using SHA-256/SHA-512 from rust-crypto. **Risk: LOW.**

- **RUSTSEC-2022-0004** (JSON stack overflow): zwaves accepts only fixed-length
  byte array inputs from the JVM. No JSON parsing occurs anywhere in the call
  path. The `rustc-serialize` crate is pulled in transitively but its JSON
  decoder is never invoked. **Risk: LOW.**

- **RUSTSEC-2020-0071** (time segfault): The segfault requires a concurrent
  mutation of the `TZ` environment variable while another thread calls
  `localtime_r`. In a JVM server environment, the system timezone is set once
  at startup and never mutated. **Risk: LOW in all known deployment contexts.**

**Formal suppression:** All three advisories are suppressed in `deny.toml`
with the full rationale. The `cargo audit` step in CI passes clean after
suppression.

**Resolution path:**
- When DecentralChain conducts the next Sapling parameter refresh (planned
  for the ZK upgrade sprint), upgrade `sapling-crypto` to a modern fork
  (e.g., `bellman` 0.14+, `ff` 0.13+, `pairing` 0.23+) and remove all
  three suppressions from `deny.toml`.

---

## ~~KNOWN-2~~: JNI function names — **RESOLVED**

**Resolution:** JNI symbols already use `com.decentralchain.groth16` namespace.
Both the Rust entry points (`groth16_jni/src/lib.rs`) and the Java class
(`com.decentralchain.groth16.{bls12,bn256}.Groth16`) are fully migrated.
Verified JNI exports:

```
Java_com_decentralchain_groth16_bls12_Groth16_verify
Java_com_decentralchain_groth16_bn256_Groth16_verify
```

No `com.wavesplatform.zwaves` symbols remain. This issue is closed.

---

## KNOWN-3: Rust dependencies use ancient major versions (bellman 0.1, ff_ce 0.7)

**Risk:** LOW (no known CVEs in these specific versions; locked for ZK compat)

**Description:** The `groth16_jni` Cargo.toml uses very old Rust crate versions:
`bellman = "0.1.0"`, `pairing = "0.14"`, `ff = "=0.7"` (ff_ce). These
predate the modern `bls12_381` / `ark-ff` ecosystem.

**Why not upgraded:** These versions are the exact versions used to generate
the Sapling proving parameters. The Groth16 circuit is parameterized by these
specific polynomial evaluations. Any change to the arithmetic libraries would
produce a different circuit representation and invalidate existing proofs.

**Resolution path:** Same as KNOWN-1 — requires a Sapling parameter refresh
ceremony. Tracked in DCC roadmap as part of the ZK upgrade sprint.

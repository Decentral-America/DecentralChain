# Known Issues

> Tracked items in the curve25519-java package (DCC fork of
> wavesplatform/curve25519-java, originally WhisperSystems/curve25519-java).
> Each item includes its risk level, reason it is not resolved immediately,
> and the recommended resolution path.

---

## KNOWN-1: License is GPL-3.0 (upstream WhisperSystems — cannot be relicensed)

**Risk:** LOW (license constraint — well-understood and intentional)

**Description:** This library is derived from WhisperSystems/curve25519-java
which is published under the GNU General Public License v3.0. DecentralChain
cannot change this license because the original author has not granted a
separate license and the GPL-3.0 propagates to all derivative works.

**Why not changed:** The upstream license is a hard constraint. All consumers
of `io.decentralchain:curve25519-java` must be aware they are linking a
GPL-3.0 library.

**Resolution path:**
- If a non-copyleft license is required, the only option is to write a
  fully independent Curve25519 implementation or use a permissively-licensed
  alternative (e.g., Tink, Bouncy Castle's `X25519Agreement`).
- The DCC node currently links this under the same GPL-3.0 terms as the
  upstream Waves node. No license violation exists in the current deployment.

---

## KNOWN-2: `NativeCurve25519Provider` uses JNA reflection — no compile-time type safety

**Risk:** LOW (API ergonomics — no security impact)

**Description:** The native Curve25519 provider loads the `curve25519` shared
library via JNA's `Native.load()` with a Java interface (`Curve25519Library`).
JNA uses reflection at runtime to match Java method signatures to native
symbols. If the native library ABI changes, the mismatch will surface at
runtime as an `UnsatisfiedLinkError`, not at compile time.

**Why not fixed now:** Migrating to explicit JNI would require writing a C
glue layer, regenerating native binaries for all platforms, and changes that
are out of scope for this maintenance release. The current JNA approach is
stable and used by the upstream codebase.

**Resolution path:**
- Consider migrating to JNI with explicit glue for future native security
  hardening sprints, or replacing with a pure-Java implementation
  (Bouncy Castle `X25519Agreement`) to eliminate the native dependency.

---

## KNOWN-3: VRF implementation uses a custom (non-standard) Unique Signature scheme

**Risk:** LOW (cryptographic note — no immediate vulnerability)

**Description:** The `calculateVrfSignature` / `verifyVrfSignature` methods
implement the "Unique Signature" / VRF construction originally developed for
the Waves blockchain. This is NOT RFC 9381 (ECVRF) — it predates the RFC
and uses a slightly different nonce construction. The scheme is secure under
the same assumptions as standard Curve25519 but is not interoperable with
standard ECVRF implementations.

**Why not changed:** The Waves/DecentralChain VRF construction is embedded
in the on-chain consensus protocol. Changing it would be a hard fork.

**Resolution path:**
- If RFC 9381 ECVRF interoperability is ever required, it must be introduced
  as a new VRF method alongside the existing one, not as a replacement.

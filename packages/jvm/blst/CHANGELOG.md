# Changelog

All notable changes to `io.decentralchain:blst` are documented here.

Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).  
Versioning: [DecentralChain version conventions](https://github.com/Decentral-America/DecentralChain/blob/dev/CONTRIBUTING.md).

---

## [0.3.16.0] — 2026-05-20

Upstream [supranational/blst](https://github.com/supranational/blst) v0.3.16 contains
genuine correctness fixes alongside the stated hardening. Tracked as DCC-265.

### Fixed (correctness — upstream blst v0.3.16)
- **`src/multi_scalar.c` — wbits/window parameter bug**: `get_wval_limb()` was called
  with `wbits` (Booth-encoded window) where the actual window width `window` was
  required. When `wbits != window`, this produced incorrect scalar windowing → wrong
  multi-scalar multiplication results → potentially wrong BLS aggregate verification.
- **`src/blst_t.hpp` — wrong shift direction**: `>>=` and `>>` operators incorrectly
  called `lshift_mod_256` instead of `rshift_mod_256`. Wrong-direction bit-shift in the
  256-bit integer type used throughout field arithmetic.
- **`build/*/ct_inverse_mod_256-armv8.S` — ARM64 assembly workspace offsets**: workspace
  array offsets were off by one stride (`#8*9→#8*10`, `#8*13→#8*14`, stride `#8*5→#8*6`).
  Constant-time modular inverse produced incorrect results on ARM64 hardware.
- **`src/multi_scalar.c` — infinity point in precompute table**: projective Z=0 was left
  unguarded when an infinity point was passed to `ptype##s_precompute_wbits`, causing
  division-by-zero in subsequent field operations.
- **`src/recip.c` + `src/vect.h`**: `ct_inverse_mod_383` → `ct_inverse_mod_384`, lifting
  the 383-bit modulus limit; removes `RRx4` workaround, uses `BLS12_381_RR` directly.

### Security (hardening — upstream blst v0.3.16)
- **`src/ec_mult.h` — `ptype##s_mult_wbits` hardening**: conditional `add` vs `dadd`
  removed; always uses `dadd` (handles point-at-infinity and is branch-free), eliminating
  a timing side-channel on identity element inputs.
- **`bindings/blst.hpp`**: all `operator[]` on `std::vector` → `.at()` (bounds-checked,
  throws `std::out_of_range` on out-of-bounds instead of silent UB); vector params
  changed to `const&` to prevent accidental copies.

### Changed
- Version: `0.3.15.0` → `0.3.16.0` (upstream `0.3.16` + DCC patch `0`)
- All 6 native libraries compiled from v0.3.16 source and committed:
  - Linux amd64, aarch64, x86 — Ubuntu 24.04 / GCC (native + multilib)
  - macOS ARM64 — Apple clang 21.0.0 on macOS 15 (macos-15 runner)
  - macOS x86_64 — Apple clang on macOS 13 (macos-13 runner)
  - Windows amd64 — MinGW-w64 cross-compile (x86_64-w64-mingw32-g++),
    statically links libstdc++ + libgcc (no MSVC runtime dependency)
- All production binaries stripped of non-essential symbols:
  - Linux: `strip --strip-unneeded` (removes `.symtab` / `.strtab`)
  - macOS: `strip -x` (removes local symbols)
  - Windows: `x86_64-w64-mingw32-strip --strip-debug`
- `.github/workflows/build-native.yml` added: reproducible multi-platform native
  library build workflow (Linux amd64/aarch64/x86, macOS ARM64/x86_64, Windows amd64)

### Security hardening (native binaries — second audit)
Recompiled all 6 native libraries with production-grade hardening flags:

- **Linux (amd64, aarch64, x86)**: upgraded to `-D_FORTIFY_SOURCE=3` (GCC 13 +
  glibc 2.39 dynamic size checks, vs. the static-only level 2); added
  `-Wl,-z,relro,-z,now` (Full RELRO — GOT marked read-only after dynamic linking,
  preventing GOT-overwrite attacks) and `-Wl,-z,noexecstack` (NX stack — prevents
  stack-based code injection). All three ELF security attributes confirmed via
  `readelf`: `FLAGS: SYMBOLIC BIND_NOW`, `PT_GNU_STACK`, `PT_GNU_RELRO`.
- **macOS (ARM64, x86_64)**: added `-fstack-protector-strong` (stack canary guards
  on all functions with local buffers/arrays). Apple Clang 21.0.0 (Xcode 16).
  x86_64 built via Apple Silicon cross-compile (`clang -arch x86_64` + conditional
  CPP assembly: `assembly.S #if defined(__x86_64__) ... mach-o/`).
- **Windows amd64 (DLL)**: added `-Wl,--dynamicbase,--nxcompat,--high-entropy-va`
  (ASLR, DEP/NX, 64-bit high-entropy ASLR). PE DllCharacteristics confirmed:
  `DYNAMIC_BASE | NX_COMPAT | HIGH_ENTROPY_VA`. MinGW-w64 GCC 13 (Ubuntu 24.04).

### Security hardening (native binaries — third audit)
Third pass: control-flow integrity, stack-clash prevention, zero-initialization,
and supply-chain source pinning. Recompiled all 6 libraries.

- **Linux amd64 + x86 — Intel CET (`-fcf-protection=full`)**: enables Control-flow
  Enforcement Technology — IBT (Indirect Branch Tracking, `ENDBR64`/`ENDBR32`
  instructions at valid indirect-call targets) and SHSTK (Shadow Stack, hardware
  return address protection). Confirmed via `readelf -n`:
  `NT_GNU_PROPERTY_TYPE_0: x86 feature: IBT, SHSTK`.
- **Linux aarch64 — ARM BTI + PAC-RET (`-mbranch-protection=standard`)**: enables
  Branch Target Identification (BTI landing pads at indirect-call targets) and
  Pointer Authentication Code for return addresses (PAC-RET). Standard profile =
  `bti+pac-ret` per GCC documentation. Supported since GCC 9 / Linux 5.8.
- **Linux + Windows — stack-clash protection (`-fstack-clash-protection`)**: inserts
  stack page probes when allocating large stack frames, preventing stack-clash attacks
  (adjacent-segment heap-to-stack or mmap-to-stack collisions). GCC 8.1+. Not added
  to macOS: Apple Clang 21 does not implement this flag (compiler warning confirmed).
- **Linux + Windows — libstdc++ bounds checks (`-D_GLIBCXX_ASSERTIONS`)**: enables
  runtime bounds checking in libstdc++ containers (e.g., `std::vector::operator[]`,
  iterator validity). No-op on macOS (uses libc++ which has separate hardening modes).
- **All platforms — zero-init locals (`-ftrivial-auto-var-init=zero`)**: zero-initializes
  all uninitialized local variables before first use, eliminating stack data leakage
  from uninitialized memory. GCC 12+ / Clang 8+. Verified supported on Apple Clang 21.
- **Supply-chain pinning (`build-native.yml`)**: all three build jobs now verify the
  blst commit hash after clone. For v0.3.16, expected SHA `e7f90de551e8df682f3cc99067d204d8b90d27ad`
  (lightweight tag, confirmed via `git ls-remote`). Fails CI on tag-poisoning attacks.
  Unknown tags emit a warning and skip the check (extendable per-tag in the `case` block).
- **`build-native.yml` Linux matrix**: added `extra_security_flags` per arch —
  amd64 + x86: `-fcf-protection=full`; aarch64: `-mbranch-protection=standard`.
- All binaries compiled with GCC 13.3.0 / Apple Clang 21.0.0 / MinGW GCC 13,
  all from blst v0.3.16 source, all pass `mvn verify` (blst 6/6, crypto 33/33).

### Notes
- Java API: no changes — `BlsUtils.java` usage of `P1`, `P2`, `P1_Affine`, `P2_Affine`,
  `SecretKey`, `Pairing` is identical; only the native C implementation changed.
- All 6 native libraries are available on the classpath for their respective
  platforms. No additional build step is required at runtime.

---

## [0.3.15.0] — 2026-05-17

Initial DCC release — fork of [wavesplatform/blst-java](https://github.com/wavesplatform/blst-java)
at upstream [supranational/blst](https://github.com/supranational/blst) v0.3.15.

### Changed
- Maven coordinates: `com.wavesplatform:blst-java` → `io.decentralchain:blst`
- Version: `0.3.15` → `0.3.15.0` (DCC convention: upstream + `.0`)
- Java: upgraded 11 → 25 (`<release>25</release>`)
- License declaration in `pom.xml` corrected to MIT (inherits from upstream blst/MIT)
- URL and SCM references updated from `Decentral-America/DCC` to `Decentral-America/DecentralChain`
- Native library resource path structure: `<os>/<arch>/<libname>` inside JAR
  (unchanged from upstream; all SWIG-generated Java is retained verbatim)

### Added
- Enterprise Maven build: enforcer (Java 25 gate), JaCoCo coverage, SpotBugs + FindSecBugs,
  CycloneDX SBOM, maven-source-plugin, maven-javadoc-plugin
- `config/pmd-ruleset.xml` — PMD source analysis (audit profile)
- `config/spotbugs-exclude.xml` — SpotBugs false-positive exclusions
  (SWIG-generated blstJNI.java is fully excluded from SpotBugs analysis)
- `config/owasp-suppressions.xml` — OWASP dependency-check suppressions
- `KNOWN_ISSUES.md`, `CONTRIBUTING.md`, `SECURITY.md`
- `.github/workflows/blst-java.yml` — CI on push/PR
- `.github/workflows/publish-blst-java.yml` — manual publish to Maven Central
- `project.json` — Nx project descriptor
- Maven wrapper for reproducible builds
- Reproducible build timestamp (`project.build.outputTimestamp`)

### Security
- `protobuf-java` → `4.34.1` (latest stable via `dependencyManagement`)
- JNI native library extraction uses `Files.createTempDirectory()` with restricted
  permissions; library loaded from temp path then deleted on JVM exit ✅
- All SWIG-generated JNI code reviewed — no unsafe inputs at Java boundary

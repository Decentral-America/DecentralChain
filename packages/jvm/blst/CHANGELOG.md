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
- macOS ARM64 native library recompiled from v0.3.16 source with Apple clang 21.0.0
- `.github/workflows/build-native.yml` added: reproducible multi-platform native
  library build workflow (Linux amd64/aarch64/x86, macOS ARM64/x86_64, Windows amd64)

### Notes
- Java API: no changes — `BlsUtils.java` usage of `P1`, `P2`, `P1_Affine`, `P2_Affine`,
  `SecretKey`, `Pairing` is identical; only the native C implementation changed.
- Other 5 native platforms (Linux ×3, macOS x86_64, Windows amd64): require
  cross-compiled binaries via the `build-native.yml` workflow dispatch.

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

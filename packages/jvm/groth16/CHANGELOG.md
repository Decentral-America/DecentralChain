# Changelog

All notable changes to `io.decentralchain:groth16` are documented here.

Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).  
Versioning: [DecentralChain version conventions](https://github.com/Decentral-America/DecentralChain/blob/dev/CONTRIBUTING.md).

---

## [0.2.1.0] — 2026-05-17

Initial DCC release — fork of [Decentral-America/zwaves](https://github.com/Decentral-America/zwaves),
a Java JNI wrapper around a Rust Groth16 ZK-SNARK verifier for the
Sapling (BN256) and BLS12-381 pairing curves.

### Changed
- Maven coordinates: `com.wavesplatform:zwaves` → `io.decentralchain:groth16`
- Java package: `com.wavesplatform.zwaves.*` → `com.decentralchain.groth16.*`
- JNI symbol prefix: `Java_com_wavesplatform_zwaves_*` → `Java_com_decentralchain_groth16_*`
- Version: `0.2.1` → `0.2.1.0` (DCC convention: upstream + `.0`)
- Java: upgraded to target Java 25 (`<release>25</release>`)
- CI: comprehensive multi-platform native build matrix (7 targets: Linux
  amd64/aarch64/x86, macOS aarch64/x86_64, Windows amd64/x86)
- Rust: native libraries built with Rust stable (1.85+, MSRV ≥ 1.80)
- Corrected native resource path in groth16_jni: `META-INF/native/<os>/<arch>/`
  (was referencing wrong path in earlier build configurations)

### Added
- Enterprise Maven build: enforcer (Java 25 gate), JaCoCo coverage, SpotBugs + FindSecBugs,
  CycloneDX SBOM, maven-source-plugin, maven-javadoc-plugin
- `deny.toml` — cargo-deny configuration with formal risk assessment for all
  known cargo audit advisories (RUSTSEC-2022-0011, RUSTSEC-2022-0004,
  RUSTSEC-2020-0071, RUSTSEC-2025-0141)
- `config/pmd-ruleset.xml`, `config/spotbugs-exclude.xml`, `config/owasp-suppressions.xml`
- `KNOWN_ISSUES.md`, `CONTRIBUTING.md`, `SECURITY.md`
- `.github/workflows/groth16.yml` — CI with 7-platform native build matrix + cargo audit
- `.github/workflows/publish-groth16.yml` — manual publish to Maven Central
- `project.json` — Nx project descriptor
- Maven wrapper for reproducible builds
- Reproducible build timestamp (`project.build.outputTimestamp`)

### Security
- **DCC-261 cargo audit gate** — `cargo audit` passes (zero unpatched advisories)
  on ubuntu/amd64 in CI; the three un-upgradable advisories in the
  `sapling-crypto` embedded dep chain are formally suppressed with documented
  risk assessment in `deny.toml`. See KNOWN_ISSUES.md for details.
- JNI boundary is fail-closed: `groth16_verify()` returns `JNI_FALSE` on any
  Rust-level error (malformed proof, invalid key, deserialization failure).
  No panics can escape through the JNI boundary.
- `parse_jni_bytes()` uses `mem::forget` + `Vec::from_raw_parts` for safe
  `Vec<i8>` → `Vec<u8>` reinterpretation (same allocation, sign cast only;
  no memory safety issue).

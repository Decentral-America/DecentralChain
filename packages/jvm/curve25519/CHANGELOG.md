# Changelog

All notable changes to `io.decentralchain:curve25519` are documented here.

Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).  
Versioning: [DecentralChain version conventions](https://github.com/Decentral-America/DecentralChain/blob/dev/CONTRIBUTING.md).

---

## [0.6.6] — 2026-05-17

Initial DCC release — fork of [WhisperSystems/curve25519-java](https://github.com/whispersystems/curve25519-java)
as adopted and maintained by [wavesplatform/curve25519-java](https://github.com/wavesplatform/curve25519-java).

### Changed
- Maven coordinates: `com.wavesplatform:curve25519-java` → `io.decentralchain:curve25519`
- Java: upgraded to target Java 25 (`<release>25</release>`)
- JNA dependency: updated to JNA 5.x (JNA 5.15.0 — latest; Java 25 compatible)
- License: GPL-3.0 retained (inherits from upstream WhisperSystems — cannot be relicensed)

### Added
- Enterprise Maven build: enforcer (Java 25 gate), JaCoCo coverage, SpotBugs + FindSecBugs,
  CycloneDX SBOM, maven-source-plugin, maven-javadoc-plugin
- `config/pmd-ruleset.xml`, `config/spotbugs-exclude.xml`, `config/owasp-suppressions.xml`
- `KNOWN_ISSUES.md`, `CONTRIBUTING.md`, `SECURITY.md`
- `.github/workflows/curve25519-java.yml` — CI on push/PR
- `.github/workflows/publish-curve25519-java.yml` — manual publish to Maven Central
- `project.json` — Nx project descriptor
- Maven wrapper for reproducible builds
- Reproducible build timestamp (`project.build.outputTimestamp`)

### Security
- **DCC-260 JNA input bounds review complete** — all public API methods in `Curve25519.java`
  validate input byte array lengths before delegating to `Curve25519Provider`:
  - `calculateAgreement`: publicKey and privateKey must be 32 bytes each
  - `calculateSignature`: privateKey must be 32 bytes; message must not be null
  - `verifySignature`: publicKey must be 32 bytes; signature must be 64 bytes
  - `calculateVrfSignature`: privateKey must be 32 bytes; message must not be null
  - `verifyVrfSignature`: publicKey must be 32 bytes; signature must be 96 bytes
  These checks enforce fixed-size Curve25519 field/scalar invariants at the
  Java boundary, preventing any malformed input from reaching the JNA native layer.
- `protobuf-java` → `4.34.1` (latest stable via `dependencyManagement`)

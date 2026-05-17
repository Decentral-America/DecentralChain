# Changelog

All notable changes to `io.decentralchain:blst-java` are documented here.

Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).  
Versioning: [DecentralChain version conventions](https://github.com/Decentral-America/DecentralChain/blob/dev/CONTRIBUTING.md).

---

## [0.3.15.0] — 2026-05-17

Initial DCC release — fork of [wavesplatform/blst-java](https://github.com/wavesplatform/blst-java)
at upstream [supranational/blst](https://github.com/supranational/blst) v0.3.15.

### Changed
- Maven coordinates: `com.wavesplatform:blst-java` → `io.decentralchain:blst-java`
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

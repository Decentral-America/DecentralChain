# Changelog

All notable changes to `io.decentralchain:transactions` are documented here.

Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).  
Versioning: [DecentralChain version conventions](https://github.com/Decentral-America/DecentralChain/blob/dev/CONTRIBUTING.md).

---

## [1.1.0] — unreleased

### Changed
- `ChainId.MAINNET`/`TESTNET`/`STAGENET` are now the DecentralChain values `'?'`, `'!'`, `'S'`
  (were the Waves values `'W'`, `'T'`, `'S'`), and `DccConfig`'s default chain id is DecentralChain
  mainnet (`DccConfig.DEFAULT_CHAIN_ID`). Code that never set a chain id built Waves-mainnet
  transactions that DecentralChain nodes reject.
- Dependency set aligned with the source tree (crypto 2.0.8 with BouncyCastle 1.86,
  protobuf-schemas 1.6.6, web3j 6.0.0, vert.x 5.2.0, Jackson 2.22.3); 1.0.0 on Maven Central was
  built from an older tree.
- Sources moved to `io/decentralchain/...` to match their package names.

## [1.0.0] — 2026-05-17

Initial DCC release — fork of [Decentral-America/transactions-java](https://github.com/Decentral-America/transactions-java)
which provided binary and JSON serialization for all Waves/DecentralChain
transaction types.

### Changed
- Maven coordinates: `com.wavesplatform:dcc-transactions` → `io.decentralchain:transactions`
  (DCC-251 — replaced by `java-sdk` consumers as part of the DCC supply-chain migration)
- Java: upgraded to target Java 25 (`<release>25</release>`)
- protobuf-java: pinned to `4.34.1` (latest stable; security floor)
- License: MIT retained (inherits from upstream wavesplatform)

### Added
- Enterprise Maven build: enforcer (Java 25 gate), JaCoCo coverage, SpotBugs + FindSecBugs,
  CycloneDX SBOM, maven-source-plugin, maven-javadoc-plugin
- `config/pmd-ruleset.xml`, `config/spotbugs-exclude.xml`, `config/owasp-suppressions.xml`
- `KNOWN_ISSUES.md`, `CONTRIBUTING.md`, `SECURITY.md`
- `.github/workflows/transactions-java.yml` — CI on push/PR
- `.github/workflows/publish-transactions-java.yml` — manual publish to Maven Central
- `project.json` — Nx project descriptor
- Maven wrapper for reproducible builds
- Reproducible build timestamp (`project.build.outputTimestamp`)

### Security
- `protobuf-java` → `4.34.1` (latest stable via `dependencyManagement`)
- All protobuf deserialization uses `parseFrom(byte[])` with no size unbounding;
  protobuf's built-in field limits apply

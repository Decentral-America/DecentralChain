# Changelog — io.decentralchain:crypto

All notable changes to this package are documented here.
Format: [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [2.0.7] — 2026-05-19

### Added
- Full upstream history from `Decentral-America/crypto v2.0.7` grafted via
  `git subtree add` — complete provenance preserved.
- DCC production toolchain applied:
  - Java 25 compiler target (`maven.compiler.release=25`)
  - JaCoCo 0.8.14 coverage enforcement (≥70% line/branch)
  - CycloneDX 2.9.1 SBOM generation (`mvn package` outputs `bom.json`)
  - SpotBugs 4.9.8.3 + FindSecBugs 1.14.0 (audit profile)
  - PMD 3.28.0 with `config/pmd-ruleset.xml` (audit profile)
  - OWASP dependency-check 12.2.2 (audit profile)
  - Reproducible builds (`project.build.outputTimestamp=2026-05-19T00:00:00Z`)

### Changed
- **Coordinates**: `com.wavesplatform:dcc-crypto:2.0.7` → `io.decentralchain:crypto:2.0.7`
- **Java package namespace**: `com.wavesplatform.crypto.*` → `io.decentralchain.crypto.*`
- **Dependencies repointed to DCC forks**:
  - `com.wavesplatform:curve25519-java:0.6.6` → `io.decentralchain:curve25519-java:0.6.6`
  - `com.wavesplatform:blst-java:0.3.15` → `io.decentralchain:blst:0.3.15.0`
- **BouncyCastle**: `bcpkix-jdk18on/bcprov-jdk18on` remain at 1.82 (latest upstream; unchanged)
- **Test deps upgraded**: `junit-jupiter` 5.7.2 → 5.14.4, `assertj-core` 3.20.2 → 3.27.7
- **Plugin versions upgraded**: compiler 3.14.1→3.15.0, surefire 3.5.4→3.5.5,
  source 3.3.1→3.4.0, enforcer 3.6.1→3.6.2

### Upstream changes (v2.0.7, Feb 11 2026)
All cryptographic behavior is identical to upstream. No protocol changes.

---

## Upstream history

Complete upstream commit history from `Decentral-America/crypto` is
preserved in this repository via `git subtree`. See:
`git log --follow packages/jvm/crypto/src`

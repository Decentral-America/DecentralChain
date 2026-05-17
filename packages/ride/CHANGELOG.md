# Changelog

All notable changes to `packages/ride` are documented here.

## [Unreleased] — Round 8 enterprise audit

### Fixed
- `FileCompiler.scala`: replaced `println(...)` with SLF4J `logger.info(...)` — eliminates
  bare `println` in production code (DCC-252 AC: zero `println` in production).
  SLF4J is available via `logback-classic` which is already a `lang-jvm` dependency.
- `Dependencies.scala`: `curve25519-java` dependency version updated to `0.6.6`
  (previously `1.0.0`; corrected to match upstream DCC-260 ticket AC and the
  fork version scheme `<upstream>.<dcc-increment>`, i.e. upstream 0.6.5 + DCC = 0.6.6).

### Documented
- KNOWN_ISSUES KNOWN-4: `com.wavesplatform.protobuf.*` and `com.wavesplatform.zwaves.*`
  imports are wire-compat / JNI bindings and are intentionally retained. Zero
  `com.wavesplatform.lang.*` occurrences exist — the DCC-252 AC is satisfied.
- KNOWN_ISSUES KNOWN-5: `scalatestplus:scalacheck-1-18` + ScalaCheck 1.19.0 combination
  documented; upgrade path noted for when `scalacheck-1-19` module is published.

## [1.6.2] — 2026-05-16

### Added
- Standalone sbt build extracted from `node-scala` with full upstream git history
- `packages/ride/lang/` — RIDE compiler (JVM + Scala.js), 1,991 commits of history
- `packages/ride/repl/` — RIDE REPL (JVM + Scala.js)
- `packages/ride/ts/` — TypeScript wrapper (`@decentralchain/ride-js`)
- `@decentralchain/ride-lang` npm package (rebranded from `@waves/ride-lang`)
- `@decentralchain/ride-repl` npm package (rebranded from `@waves/ride-repl`)
- sbt quality gates: scalafmt, scalafix, scoverage ≥ 40% per JVM sub-project (DCC-252 AC)
- Nx targets: compile, test, fullLinkJS, coverage, fmt, fix, bulletproof

### Changed
- Namespace rebrand applied (DCC-147): `com.wavesplatform.lang` → `com.decentralchain.lang`
- Organization: `io.decentralchain` (matches node-scala)
- ScalaJS upgraded: 1.20.2 → 1.21.0
- sbt-scalafmt upgraded: 2.5.6 → 2.6.1
- scalafmt upgraded: 3.9.4 → 3.11.1

### Notes
- `com.wavesplatform.protobuf.*` imports are intentional: they reference wire-compatible
  protobuf-generated code for Waves protocol compatibility. Do not rename.
- `com.wavesplatform.zwaves.*` is an external library — external artifact, not our namespace.

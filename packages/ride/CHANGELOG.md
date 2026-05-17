# Changelog

All notable changes to `packages/ride` are documented here.

## [1.6.2] — 2026-05-16

### Added
- Standalone sbt build extracted from `node-scala` with full upstream git history
- `packages/ride/lang/` — RIDE compiler (JVM + Scala.js), 1,991 commits of history
- `packages/ride/repl/` — RIDE REPL (JVM + Scala.js)
- `packages/ride/ts/` — TypeScript wrapper (`@decentralchain/ride-js`)
- `@decentralchain/ride-lang` npm package (rebranded from `@waves/ride-lang`)
- `@decentralchain/ride-repl` npm package (rebranded from `@waves/ride-repl`)
- sbt quality gates: scalafmt, scalafix, scoverage ≥ 60%
- Nx targets: compile, test, fullLinkJS, coverage, fmt, fix

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

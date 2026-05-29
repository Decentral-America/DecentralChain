# Changelog

All notable changes to `packages/ride` are documented here.

## [Unreleased] — Round 9 enterprise audit

### Changed
- `plugins.sbt`: `jackson-module-scala_3` upgraded `2.21.0` → `2.21.3`
  (build-time dependency; Maven Central artifact confirmed via direct HTTP check;
  aligns with `jackson-databind 2.21.3` used in JVM packages).

### Verified (no changes required)
Version freshness sweep via GitHub API + Maven Central direct artifact checks:
- `scala-logging_3 3.9.6`: latest (MC solrsearch stale at 3.9.5; 3.9.6 confirmed
  on repo1.maven.org — HTTP 200).
- `sbt-scalajs-crossproject 1.3.2`: latest (MC solrsearch stale at 1.3.1; 1.3.2
  confirmed on repo1.maven.org).
- `scalapb compilerplugin 1.0.0-alpha.3`: confirmed latest alpha via GitHub tag
  `scalapb/ScalaPB`; stable `0.11.20` exists but requires downgrading sbt-protoc.
- `scalajs-stubs 1.1.0`, `scala-js-macrotask-executor 1.1.1`, `big-math 2.3.2`,
  `hjson 3.1.0`: all at latest (Maven Central confirmed).
- All sbt plugins at latest: `sbt-scalafmt 2.6.1`, `sbt-scalafix 0.14.6`,
  `sbt-assembly 2.3.1`, `sbt-explicit-dependencies 0.3.1`, `sbt-scoverage 2.4.4`,
  `sbt-git 2.1.0`, `sbt-scalajs 1.21.0`.

### Documented
- KNOWN_ISSUES KNOWN-7: `scalapb compilerplugin 1.0.0-alpha.3` + `sbt-protoc 1.0.8`
  pairing is intentional. Alpha designation reflects API surface stability for
  library users, not production safety. Latest alpha on the 1.0.x track.

## [Unreleased-R8] — Round 8 enterprise audit

### Fixed
- `FileCompiler.scala`: replaced `println(...)` with SLF4J `logger.info(...)` — eliminates
  bare `println` in production code (DCC-252 AC: zero `println` in production).
  SLF4J is available via `logback-classic` which is already a `lang-jvm` dependency.
- `Dependencies.scala`: `curve25519-java` dependency version updated to `0.6.6`
  (previously `1.0.0`; corrected to match upstream DCC-260 ticket AC and the
  fork version scheme `<upstream>.<dcc-increment>`, i.e. upstream 0.6.5 + DCC = 0.6.6).

### Documented
- KNOWN_ISSUES KNOWN-4: `com.wavesplatform.protobuf.*` imports are from a stale artifact
  (`protobuf-schemas:1.6.1` predates the java_package rename; not a wire-format constraint).
  `com.wavesplatform.zdcc.*` in `Global.scala` is from a locally-installed jar whose Rust
  native library has not yet been rebuilt under the new `com.decentralchain.groth16.*` namespace.
  Both are publish-gap issues, not permanent constraints. See KNOWN_ISSUES.md for fix paths.
  Zero `com.wavesplatform.lang.*` occurrences exist — the DCC-252 AC is satisfied.
- KNOWN_ISSUES KNOWN-5: `scalatestplus:scalacheck-1-18` + ScalaCheck 1.19.0 combination
  documented; upgrade path noted for when `scalacheck-1-19` module is published.

## [1.6.2] — 2026-05-16

### Added
- Standalone sbt build extracted from `node-scala` with full upstream git history
- `packages/ride/lang/` — RIDE compiler (JVM + Scala.js), 1,991 commits of history
- `packages/ride/repl/` — RIDE REPL (JVM + Scala.js)
- `packages/ride/ts/` — TypeScript wrapper (`@decentralchain/ride`)
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
- `com.wavesplatform.protobuf.*` imports are from the `protobuf-schemas:1.6.1` artifact
  which predates the java_package rename. Not a wire-format constraint — see KNOWN_ISSUES.md.
- `com.wavesplatform.zdcc.*` is from the locally-installed `zdcc:0.2.1.0` jar. The
  `groth16` package in the monorepo has been rebranded; awaiting Rust rebuild + re-install.

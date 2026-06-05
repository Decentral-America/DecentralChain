# Known Issues

> Tracked unresolved items from the DCC-240 fork and migration. Each item includes its risk level, reason it cannot be resolved immediately, and the recommended path forward.

---

## ~~KNOWN-1: Java source packages retain `com.wavesplatform.dccj.*` naming~~ — RESOLVED

**Status: RESOLVED** (Round 11 — 2026-05-17)

All 77 Java source files have been moved from `com.wavesplatform.dccj.*` to `io.decentralchain.sdk.*`.
The old `src/main/java/com/` directory tree has been deleted. Version bumped to `2.0.0-SNAPSHOT` (major — breaking API change).
Consumers must update their imports from `com.wavesplatform.dccj` → `io.decentralchain.sdk`.

Remaining `com.wavesplatform.*` references are **upstream library imports only** (see KNOWN-2) — not DCC-owned code.

---

## KNOWN-2: Runtime dependencies on `com.wavesplatform:*` artifacts

**Risk:** MEDIUM (supply chain — depends on upstream Waves Maven Central artifacts)

**Description:** Two runtime dependencies are published by the Waves team:
- `com.wavesplatform:dcc-transactions:1.2.7`
- `com.wavesplatform:lang:1.6.1`

~~`com.wavesplatform:dcc-crypto`~~ — **RESOLVED (2026-05-19, DCC-264)**: Forked as
`io.decentralchain:crypto:2.0.7`. `java-sdk` now declares it as a direct dependency and all
`com.wavesplatform.crypto.*` imports in source have been updated to `io.decentralchain.crypto.*`.

**Why not fixed now:** `dcc-transactions` requires updating to `io.decentralchain:transactions`
(DCC-240 follow-up). `lang` is the Ride compiler — a large, complex Scala project.

**Resolution path:**
- ~~Fork `dcc-transactions-java` as `io.decentralchain:transactions`~~ ✅ Done (DCC-240) — java-sdk
  still references the OLD upstream `com.wavesplatform:dcc-transactions`; update pom.xml to use
  `io.decentralchain:transactions:1.0.0`
- Long-term: replace `com.wavesplatform:lang:1.6.1` with `io.decentralchain:lang` (DCC-252 ✅ done,
  pending java-sdk wiring)

**Affected file:** `pom.xml` lines with `com.wavesplatform` dependencies

---

## KNOWN-3: `io.decentralchain:protobuf-schemas` not yet published to stable Maven Central

**Risk:** LOW (build infrastructure — no functionality impact)

**Description:** `node-scala/project/Dependencies.scala` now references `io.decentralchain:protobuf-schemas:1.6.1`. The `packages/protobuf-schemas/pom.xml` is set to version `1.6.1` (release-ready). However, the artifact has not yet been published to Maven Central — the `publish-protobuf-schemas` GitHub Actions workflow must be triggered (via `workflow_dispatch` in the DCC monorepo) before `node-scala` CI builds can resolve this dependency.

**Why not fixed now:** Publishing requires a manual workflow trigger by an engineer with the `CENTRAL_USERNAME`, `CENTRAL_PASSWORD`, and `MAVEN_GPG_PASSPHRASE` secrets configured in the DCC repository.

**Resolution path:**
1. Trigger `.github/workflows/publish-protobuf-schemas.yml` (`workflow_dispatch`) in the Decentral-America/DecentralChain repo (dry-run first, then real publish)
2. Verify `io.decentralchain:protobuf-schemas:1.6.1` appears on [Maven Central](https://central.sonatype.com/artifact/io.decentralchain/protobuf-schemas)
3. Bump `packages/protobuf-schemas/pom.xml` to `1.6.2-SNAPSHOT` for next development cycle

**Affected files:**
- `Ecosystem/DecentralChain/packages/sdk/protobuf-schemas/pom.xml`
- `Ecosystem/node-scala/project/Dependencies.scala`

---

## ~~KNOWN-4: Checkstyle — 3,273 upstream style violations (report-only)~~ — RESOLVED

**Risk:** LOW (code quality — no security impact)

**Resolved:** Spotless Maven Plugin 3.5.0 + google-java-format 1.35.0 auto-reformatted all 77 source files in a single formatting commit, eliminating 3,071 mechanical formatting violations. `failOnViolation=true` is now enabled — Checkstyle enforces Google Java Style in CI. Remaining upstream debt (299 violations: NeedBraces 135, MissingJavadoc 156, AvoidStarImport 8) is explicitly suppressed in `checkstyle-suppressions.xml` for future cleanup sprints.

**Resolution summary:**
- `spotless-maven-plugin 3.5.0` added to `pom.xml` (bound to `verify` phase)
- `google-java-format 1.35.0` applied to all 77 `.java` source files
- `checkstyle-suppressions.xml` created — suppresses known upstream-debt rule violations
- `failOnViolation` flipped `false` → `true`
- 14 malformed Javadoc comments fixed manually (missing periods, empty `@throws`)
- 0 checkstyle violations remain; 71/71 tests pass

---

## KNOWN-5: Docker integration test coverage not measured in unit-test-only builds

**Risk:** INFO

**Description:** JaCoCo coverage thresholds are set to 20%/7% for local builds (unit tests only). Docker integration tests (10 test classes) are skipped gracefully when Docker is not available. Full coverage (expected ~70%+) only runs in CI where Docker is available. CI enforces 70%/60% thresholds.

**Resolution path:** No action needed — coverage enforcement is already in `ci.yml`.

---

## KNOWN-6: Transitive compile-scope deps flagged as test-only by dependency analyzer

**Risk:** INFO

**Description:** `mvn dependency:analyze` reports three dependencies as "Non-test scoped test only":
- `org.web3j:crypto` — transitive from `dcc-transactions`; used internally by `DccEthConverter.java` through the upstream library's own API
- `com.wavesplatform:protobuf-schemas` — transitive from `dcc-transactions`
- `com.google.protobuf:protobuf-java` — transitive from `dcc-transactions`; pinned in `<dependencyManagement>` for version alignment only

These are resolved at compile scope because `dcc-transactions` (a runtime compile dep) declares them as compile dependencies. Our production source does not call their APIs directly — but they must remain on the compile classpath at runtime for `dcc-transactions` to function.

**Why not fixed now:** Moving them to `test` scope would break `dcc-transactions` at runtime (it needs them on the classpath). Fixing this properly requires forking `dcc-transactions` (see KNOWN-2).

**Resolution path:** Resolved automatically when KNOWN-2 is addressed (fork of `dcc-transactions` → full control over the dependency tree).

---

## ~~KNOWN-7: `DccConfig.chainId()` not set from connected node in Docker tests~~ — RESOLVED

**Status: RESOLVED** (Round 11 — 2026-05-17)

`BaseTestWithNodeInDocker` created a `Node` object (which discovers the chain-id from the live node)
but never propagated it into `DccConfig.chainId()`. All `PrivateKey.fromSeed()` and address
construction used the static default (`87` = Waves mainnet 'W'), while the DCC private node
uses chain-id `82`. Every broadcasted transaction was rejected with "Wrong chain-id. Expected - 82,
provided - 87".

Fixed by adding `DccConfig.chainId(node.chainId())` in `BaseTestWithNodeInDocker` static
initializer immediately after `node = new Node(NODE_API_URL)`, before `faucet` is constructed.
All 71 Docker integration tests now pass.

**Note:** `DccConfig.chainId()` is a global static — safe for single-threaded test execution
but would cause problems under parallel test classes each connecting to nodes on different chain-ids.
This is a known limitation of the upstream `com.wavesplatform:dcc-transactions` design.

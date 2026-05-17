# Known Issues

> Tracked unresolved items in the wavesj package (DCC fork of wavesplatform/WavesJ).
> Each item includes its risk level, reason it is not resolved immediately, and
> the recommended path forward.

---

## KNOWN-1: Java source packages retain `com.wavesplatform.wavesj.*` naming

**Risk:** LOW (branding only — no security or functionality impact)

**Description:** All Java source packages under `src/main/java/` and `src/test/java/`
retain the upstream package namespace `com.wavesplatform.wavesj.*`. Renaming would
be a breaking API change for any consumers who import from the existing coordinates.

**Why not fixed now:** Breaking change requires a major version bump and migration
guide. Deferred to a dedicated sprint.

**Resolution path:**
- Bump to `2.0.0`
- Rename all source packages to `io.decentralchain.wavesj.*`
- Publish migration guide with automated refactor instructions
- Tracked in: **DCC-249**

**Affected files:** All `.java` files under `src/`

---

## KNOWN-2: Runtime dependency on `com.wavesplatform:lang:1.6.1`

**Risk:** MEDIUM (supply chain — depends on an upstream Waves Maven Central artifact)

**Description:** The Ride language compiler is published by the Waves team as
`com.wavesplatform:lang:1.6.1`. It cannot easily be replaced until DCC-252
(the DCC fork of the Ride compiler / lang package) is published to Maven Central.

Note: `com.wavesplatform:waves-transactions:1.2.7` was already replaced with
`io.decentralchain:transactions-java:1.0.0` as part of this migration (DCC-251).

**Why not fixed now:** The Ride compiler is a large, complex Scala/JS project
(`node-scala/lang`). Publishing it as a standalone DCC artifact requires the
DCC-252 publish pipeline to complete.

**Resolution path:**
- Await DCC-252 publishing `io.decentralchain:lang_3` to Maven Central
- Replace `com.wavesplatform:lang:1.6.1` in `pom.xml`
- Remove the `KNOWN-2` suppression entry in `config/owasp-suppressions.xml`

**Affected file:** `pom.xml` — `com.wavesplatform:lang:1.6.1` dependency

---

## KNOWN-3: Docker integration tests not measured in unit-test-only builds

**Risk:** INFO

**Description:** JaCoCo coverage thresholds are intentionally low (20% line / 10%
branch) for local and PR builds that skip Docker-dependent integration tests. The
integration test suite (`EthereumTransactionIntegrationTest`) requires a live DCC
node in Docker via Testcontainers 2.x, and is excluded from the default surefire run.

Full coverage (expected ~70%+) is only measured in CI when Docker is available.
The `integration-test` Maven profile (`./mvnw verify -P integration-test`) enables
Docker tests and applies stricter coverage gates.

**Resolution path:** No action needed — this is an intentional build configuration.
The CI pipeline runs integration tests and enforces higher thresholds.

---

## KNOWN-4: Checkstyle not enforced (upstream style violations)

**Risk:** LOW (code quality — no security impact)

**Description:** The upstream WavesJ codebase was not written against Google Java
Style or any common Checkstyle ruleset. Enabling strict Checkstyle would surface
a large number of upstream style violations that require systematic formatting work.

**Why not fixed now:** Formatting 77+ source files in bulk obscures meaningful diffs.
Reserved for a dedicated formatting PR.

**Resolution path:**
- Apply Google Java formatter to all source files in a single formatting commit
- Add `maven-checkstyle-plugin` to the audit profile with `failOnViolation=true`
- Update this entry and close the DCC Jira ticket when complete

---

## KNOWN-5: Transitive compile-scope deps from `waves-transactions` / `lang`

**Risk:** INFO

**Description:** `mvn dependency:analyze` may report transitive dependencies from
`transactions-java` and `lang` as "Non-test scoped test only". These are resolved
at compile scope because their direct parents declare them as compile dependencies.
The production source does not call their APIs directly, but they must remain on
the classpath at runtime.

Examples:
- `org.web3j:crypto` — via `transactions-java`; used by EVM transaction support
- `com.google.protobuf:protobuf-java` — pinned in `<dependencyManagement>` for
  version alignment; runtime-required by `transactions-java`

**Resolution path:** Tracking improves automatically as DCC-249 (namespace rename)
and DCC-252 (lang fork) progress, giving full control of the dependency tree.

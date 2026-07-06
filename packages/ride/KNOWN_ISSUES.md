# Known Issues — packages/ride

## 1. Tests require `sbt fullLinkJS` first

`packages/ride/ts` depends on `@decentralchain/ride-lang` and
`@decentralchain/ride-repl` as workspace packages. These are Scala.js-compiled
binaries that are NOT committed to git (dist/ is gitignored).

**Before running `pnpm test` in packages/ride/ts, you must build the JS binaries:**

```bash
# From packages/ride/
sbt fullLinkJS

# Then from monorepo root
pnpm --filter @decentralchain/ride test
```

Or use the Nx target:

```bash
npx nx run ride:fullLinkJS
```

## 2. RSA verify not supported in Scala.js build

The RIDE REPL's Scala.js compilation does not bundle a native RSA provider.
`rsaVerify(SHA256, ...)` and all RSA-family functions throw at runtime in the
Scala.js (browser/Node WASM) build. This is a known upstream limitation.

Affected algorithms: `NOALG`, `MD5`, `SHA1`, `SHA224`, `SHA256`, `SHA384`,
`SHA512`, `SHA3224`, `SHA3256`, `SHA3384`, `SHA3512`.

**Workaround**: Use the JVM build (`repl-jvm`) for RSA operations.

**Tracking**: https://github.com/Decentral-America/node-scala (upstream lang/repl)

## 3. sbt-scoverage 2.4.4 + Scala 3.8.3 — evaluator tree excluded from instrumentation

`sbt-scoverage 2.4.4` miscompiles context-passing closures when instrumenting the
RIDE evaluator package under **Scala 3.8.3**. All files under `lang/v1/evaluator/`
(including `ctx/` and `ctx/impl/`) are affected: scoverage transforms native-function
call sites so that the closure returns `scala.runtime.BoxedUnit` instead of the
declared return type. At runtime this produces:

```
An error during run <+(a: Int, b: Int): Int>:
  class java.lang.ClassCastException: class scala.runtime.BoxedUnit
  cannot be cast to class com.decentralchain.lang.v1.traits.Environment
```

Resolved approaches that did **not** work:
- `ClassLoaderLayeringStrategy.Flat` — same error
- `Test / fork := true` — same error (bytecode transformation, not classloader issue)
- Surgical exclusion of 6 entry-point files — `ctx/impl/` still triggers the bug

**Current fix**: `coverageExcludedFiles` excludes the entire `evaluator` tree
(`.*/lang/v1/evaluator/.*`). Evaluator **correctness** is still fully verified by
Phase 1 of the `bulletproof` alias (`sbt test`, no instrumentation).
Per-project coverage minimums are 40 % (lang) and 40 % (repl) — measured over
parser, compiler, estimator, and repl logic only.

**Tracking**: sbt-scoverage issue tracker — upgrade to a future version of
sbt-scoverage that fixes Scala 3 closure instrumentation.

### 3a. Re-investigated 2026-07-05 — no scoverage upgrade available; JaCoCo spiked and rejected

**sbt-scoverage upgrade path: not available.** `2.4.4` is the *latest* published
release of `sbt-scoverage` as of this investigation (confirmed against both the
GitHub releases API and the Maven Central artifact listing for
`org.scoverage:sbt-scoverage_2.12_1.0` — `2.4.4` is the newest version on both).
The underlying `scalac-scoverage-plugin` has since published `2.5.0`–`2.5.2`, but
their changelogs contain no mention of a Scala 3 closure/boxing fix (bumped
scala-xml, added Scala 2.12.21 support, added "incremental coverage support" —
nothing related to KNOWN-3), and `sbt-scoverage` itself has not picked up a build
against them. There is currently nothing newer to bump to. Re-check this
periodically by re-running the Maven Central listing check below; do not assume
this is permanent.

```
curl -s https://repo1.maven.org/maven2/org/scoverage/sbt-scoverage_2.12_1.0/ \
  | grep -oE 'href="[0-9][^"]*/"' | sed 's/href="//;s/\/"//' | sort -V | tail -5
```

**JaCoCo spike: attempted, reverted.** `sbt-jacoco` (`com.github.sbt % sbt-jacoco`,
latest `3.6.0`) is actively maintained (releases as recently as this month) and,
because it instruments compiled `.class` bytecode rather than doing AST/compiler-
plugin instrumentation, it does not go anywhere near the Scala-3-compiler-integrated
instrumentation path that causes KNOWN-3. A spike was run: added the plugin,
enabled `JacocoItPlugin` on `lang-jvm`, scoped it to the evaluator package via
`jacocoIncludes := Seq("com.decentralchain.lang.v1.evaluator.*")`, and ran
`sbt lang/jacoco`. It instrumented successfully (911 classes, no BoxedUnit/
ClassCastException), but reported **0 % coverage across the board**. Root cause:
`sbt-jacoco`'s `jacoco` task instruments and runs `Test/test` *within the project
it's scoped to*. The evaluator's actual exercising tests live in `lang-tests`
(depending on `lang-testkit` → `lang-jvm`), not in `lang-jvm` itself — `lang-jvm`
has no evaluator-exercising tests of its own, so nothing meaningful ran against the
instrumented classes. Getting a real number out of JaCoCo here would require either:
- pointing `lang-tests`'s test JVM at a JaCoCo javaagent targeting `lang-jvm`'s
  instrumented classes and merging/reporting cross-project (undocumented for this
  plugin, would need custom wiring), or
- moving/duplicating the relevant evaluator tests into `lang-jvm` itself (would
  fragment the existing `lang-tests` test organization for no other benefit).

Both are a materially larger lift than "add a plugin and flip a setting," and
their risk (fragile cross-project javaagent wiring, or restructuring test layout)
is disproportionate to the payoff (a coverage *percentage*, when evaluator
*correctness* is already fully covered by the un-instrumented `sbt test` run).
The spike was fully reverted (`git diff` against `project/plugins.sbt` and
`build.sbt` is clean) — no plugin bump or setting change was kept.

**Recommendation**: leave KNOWN-3 open as-is (evaluator excluded from scoverage
instrumentation, correctness verified by uninstrumented `sbt test`). If a team
member wants to pursue JaCoCo further, the actual remaining work is the
cross-project instrumentation wiring described above — budget roughly half a day
for a spike of that specific mechanism (javaagent + report merge) before deciding
whether it's worth adopting permanently, since it's unproven and undocumented for
this multi-project-with-shared-test-project shape.

## 4. `com.wavesplatform.*` imports — RESOLVED (2026-05-19)

The DCC-252 AC "zero `com.wavesplatform.lang` in .scala files" is satisfied:
**zero** occurrences of `com.wavesplatform.lang.*` exist in the production source tree.

All remaining `com.wavesplatform.*` imports in this package have been eliminated:

### 4a. `com.wavesplatform.protobuf.*` — resolved
`protobuf-schemas` bumped to `1.6.2` (built with `io.decentralchain.*` java_package
options from updated proto files). All 14 affected Scala source files renamed.

### 4b. `com.wavesplatform.zdcc.*` — resolved
`zdcc_jni` Rust rebuilt with `Java_com_decentralchain_groth16_*` JNI symbol names.
Dependency renamed to `io.decentralchain:groth16:0.2.1.0`. `Global.scala` imports
updated to `com.decentralchain.groth16.{bls12,bn256}.Groth16`.

## 5. ScalaTestPlus `scalacheck-1-18` used with ScalaCheck 1.19.0

`org.scalatestplus:scalacheck-1-18_3:3.2.19.0` is the ScalaTest integration
module for ScalaCheck 1.18.x. It is used alongside `org.scalacheck:scalacheck_3:1.19.0`
(the latest stable release as of 2026-05).

No `scalatestplus:scalacheck-1-19` integration module exists on Maven Central yet.
ScalaCheck 1.19.0 maintains binary compatibility with the 1.18.x API surface used
by ScalaTestPlus. All 1,312 tests pass with this combination.

**Action**: Upgrade to `scalatestplus:scalacheck-1-19` when it is published.

## 6. `Parser.scala` excluded from scalafmt (fastparse implicit-context syntax)

`lang/shared/src/main/scala/com/decentralchain/lang/v1/parser/Parser.scala` uses
the fastparse implicit-context macro pattern:

```scala
.map(o => { implicit (c: fastparse.P[Any]) => ... })
```

scalafmt 3.11.1 with `runner.dialect = scala3` cannot parse this construct
(reports: `error: [dialect scala3] expected start of definition`) and exits
non-zero. The file is excluded via `project.excludePaths` in `.scalafmt.conf`.

**Action**: Either rewrite the fastparse usage to idiomatic Scala 3 (`using c: P[_]`)
or wait for scalafmt to support this syntax. The file must be formatted manually.

## 7. `scalapb compilerplugin 1.0.0-alpha.3` — intentional alpha dependency

`plugins.sbt` pins `com.thesamet.scalapb:compilerplugin:1.0.0-alpha.3` (alpha)
rather than the latest stable release (`0.11.20` as of 2026-05).

This is a required pairing: `sbt-protoc 1.0.8` invokes the scalapb 1.0.x code
generator API, which changed from the 0.11.x series. Downgrading to
`compilerplugin 0.11.20` requires also downgrading `sbt-protoc` to the `0.99.x`
series — and `sbt-protoc 0.99.x` lacks full Scala 3 crossProject support.

`v1.0.0-alpha.3` is confirmed as the **latest** ScalaPB 1.0.x release (verified
via GitHub tag `scalapb/ScalaPB`). The "alpha" designation reflects API surface
stability for scalapb-as-a-library users, not production safety of the generated
code. The generated protobuf Scala code is identical in quality to 0.11.x.

All 1,312 sbt tests pass with this combination. `sbt-protoc 1.0.8` is the specific
version referenced in the ScalaPB 1.0.0-alpha.3 release notes.

**Action**: Upgrade to a stable `1.0.x` release when the ScalaPB team promotes it
out of alpha. No code change will be required — only the version pin in `plugins.sbt`.

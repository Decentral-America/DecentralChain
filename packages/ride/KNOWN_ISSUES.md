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
pnpm --filter @decentralchain/ride-js test
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

## 4. `com.wavesplatform.*` imports are wire-compat / JNI — not namespace violations

The DCC-252 AC "zero `com.wavesplatform.lang` in .scala files" is satisfied:
**zero** occurrences of `com.wavesplatform.lang.*` exist in the production
source tree.

The 13 remaining `com.wavesplatform.*` imports fall into two categories that
**cannot** be renamed without breaking binary or wire-format compatibility:

### 4a. `com.wavesplatform.protobuf.*` (8 occurrences)
These import Protobuf-generated classes from `io.decentralchain:protobuf-schemas`.
The `.proto` files in that artifact define the Waves/DCC blockchain wire format
(block, transaction, dApp meta-descriptors). The `java_package` option in those
`.proto` files is `com.wavesplatform.protobuf.*` — changing it would break
the binary protobuf encoding used by every node and client in the ecosystem.

Affected files: `ContractSerDeV1.scala`, `ContractSerDeV2.scala`,
`MetaMapper.scala`, `DataMetaMapper.scala`, `MetaMapperStrategy.scala`,
`DApp.scala`, `TransferTxSerializer.scala`.

### 4b. `com.wavesplatform.zwaves.*` (2 occurrences)
These import JNI binding classes from `io.decentralchain:zwaves`. The Rust crate
compiles the JNI glue with the `com.wavesplatform.zwaves` Java package namespace
baked into the JNI function symbol names (e.g. `Java_com_wavesplatform_zwaves_bls12_Groth16_...`).
Changing this would require recompiling and releasing a new zwaves native library.

Affected files: `Global.scala` (imports `Groth16` from bls12 and bn256 sub-packages).

**Action**: These are tracked in the respective library tickets (DCC-261 for zwaves,
protobuf-schemas ticket TBD) to eventually publish under the `io.decentralchain`
Java package. Until then, the imports are intentional and correct.

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

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

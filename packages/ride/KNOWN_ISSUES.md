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

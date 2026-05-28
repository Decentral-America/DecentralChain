# @decentralchain/ride

RIDE language compiler and REPL — standalone sbt package extracted from [node-scala](https://github.com/Decentral-America/node-scala) with full upstream git history preserved.

## Packages

| Package | Description | Published |
|---------|-------------|-----------|
| `io.decentralchain:lang` | RIDE compiler (JVM) | Maven Central |
| `io.decentralchain:lang-testkit` | Test helpers | Maven Central |
| `@decentralchain/ride-lang` | RIDE compiler (npm Scala.js binary) | npm |
| `@decentralchain/ride-repl` | RIDE REPL (npm Scala.js binary) | npm |
| `@decentralchain/ride` | TypeScript wrapper | npm |

## Building

```bash
# Compile all subprojects
sbt compile

# Run tests
sbt test

# Produce JS binaries (consumed by packages/ride/ts/)
sbt fullLinkJS

# Coverage report
sbt coverage test coverageReport
```

## Nx targets

```bash
npx nx run ride:compile
npx nx run ride:test
npx nx run ride:fullLinkJS
npx nx run ride:coverage
npx nx run ride:fmt
npx nx run ride:fix
```

## Project structure

```
packages/ride/
├── build.sbt          # root sbt build
├── version.sbt        # git.baseVersion = "1.6.2"
├── .scalafmt.conf     # scalafmt 3.11.1 (Scala 3 dialect)
├── .scalafix.conf     # scalafix rules
├── project/           # sbt meta-build
│   ├── build.properties (sbt 1.12.11)
│   ├── plugins.sbt
│   ├── Dependencies.scala
│   ├── PublishedModule.scala
│   ├── VersionObject.scala
│   ├── Tasks.scala
│   └── DocSourceData.scala
├── lang/              # RIDE compiler (crossProject JVM + JS)
│   ├── shared/src/    # shared Scala sources
│   ├── jvm/src/       # JVM-only sources
│   ├── js/src/        # JS-only sources + dist/
│   ├── testkit/       # test helper library
│   ├── tests/         # JVM tests
│   └── tests-js/      # Scala.js tests
├── repl/              # RIDE REPL (crossProject JVM + JS)
│   ├── shared/src/    # shared Scala sources
│   ├── jvm/src/       # JVM-only sources
│   └── js/src/        # JS-only sources + dist/
└── ts/                # TypeScript wrapper (npm package)
    └── src/index.js   # wraps @decentralchain/ride-lang + ride-repl
```

## Git history

`packages/ride/lang/` and `packages/ride/repl/` carry the full upstream
Decentral-America/node-scala history (1,991 commits touching these directories) extracted
via `git filter-repo` from [Decentral-America/node-scala](https://github.com/Decentral-America/node-scala).

All DCC patches from node-scala are included:
- `feat(DCC-147)`: namespace rename `com.wavesplatform` → `com.decentralchain`
- `feat(DCC-146,DCC-148,DCC-149)`: chain identity and CI pipelines

## License

MIT — see [LICENSE](./LICENSE)

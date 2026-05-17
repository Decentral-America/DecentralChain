# DCC-252 — RIDE Language Toolkit: `packages/ride/` in DecentralChain Monorepo
## Complete Enterprise Extraction · Bulletproof · Modernization · Audit Plan

**Status:** Research complete — ready for implementation  
**Scope:** Extract the RIDE language compiler (`lang`) and RIDE REPL (`repl`) from `Ecosystem/node-scala/` into `packages/ride/` in the DecentralChain monorepo, applying the full 4-phase quality pipeline, and publishing four public artifacts: two Maven Central artifacts and two npm packages  
**Authored:** 2026-05-16 (complete rewrite — prior version had wrong artifact scope)  
**Jira Epic:** DCC-237 — Drop all `com.wavesplatform` Maven deps  
**This ticket:** DCC-252 — Fork `com.wavesplatform:lang` → `io.decentralchain:lang`

> **This is financial infrastructure.** The RIDE compiler processes user-submitted smart contracts that govern how real money moves on the DecentralChain network. Every decision in this plan must reflect the gravity of that responsibility.

---

## 1. Executive Summary

The RIDE language compiler (`lang`) and RIDE REPL (`repl`) currently live inside `Ecosystem/node-scala/` as embedded SBT cross-projects (`crossProject(JSPlatform, JVMPlatform)`). This plan extracts both into `packages/ride/` inside the DecentralChain monorepo as a single sbt build with two cross-compiled sub-projects.

### Why Both Together

`repl` depends on `lang-jvm` and `lang-js`. They share the same version number today (both at 1.6.2). Extracting lang alone would require repl to immediately consume the published Maven artifact — adding an impossible cyclic publish-then-consume constraint in the same sprint. They share the same release cadence and belong together.

### The Four Public Artifacts

This PR produces four published artifacts from a single sbt build:

| Artifact | Registry | Consumed By |
|----------|----------|-------------|
| `io.decentralchain:lang_3` | Maven Central | `node-scala` (node server), `java-sdk` (CompilationUtil) |
| `io.decentralchain:lang-testkit_3` | Maven Central | `node-scala` test infra |
| `@decentralchain/ride-lang` | npm | `packages/ride/ts` (TypeScript wrapper) |
| `@decentralchain/ride-repl` | npm | `packages/ride/ts` (TypeScript wrapper) |

`repl-jvm` is NOT a public Maven artifact — it stays as an internal sbt sub-project used only by `node-it` integration tests in node-scala. Once lang is extracted, node-scala's local `repl-jvm` will consume `io.decentralchain:lang_3` from Maven Central.

### Downstream Update (Same PR or Immediate Follow-Up)

`packages/ride/ts/src/index.js` currently imports:
```js
import * as scalaJsCompiler from '@waves/ride-lang';
import * as replJs from '@waves/ride-repl';
```
Must be updated to:
```js
import * as scalaJsCompiler from '@decentralchain/ride-lang';
import * as replJs from '@decentralchain/ride-repl';
```
This resolves the last remaining `@waves/` reference in the DCC monorepo — previously documented as "unavoidable: Scala.js binaries, no fork available" in the production audit.

### Phase Pipeline

| Phase | Source Doc | Goal |
|-------|-----------|------|
| 0 — MIGRATE | 0-MIGRATE.md v2.1.0 | Extract with history, rebrand, community files |
| 1 — BULLETPROOF | 1-BULLETPROOF.md v1.2.0 | Pre-commit hooks, `sbt bulletproof`, coverage |
| 2 — MODERNIZE | 2-MODERNIZE.md v1.2.0 | Upgrade all toolchain deps to latest |
| 3 — AUDIT | 3-AUDIT.md v1.1.0 (Phases A–F) | Supply chain, static, security, tests, CI, branding |

---

## 2. Traceability Chain (DCC-252)

Every artifact in the delivery chain shares the `DCC-252` key. Non-negotiable for financial infrastructure.

```
Jira DCC-252 (In Progress)
  → Branch: feat/DCC-252-lang-fork-standalone  (in Decentral-America/DecentralChain)
    → Commits: feat(DCC-252): <description>
      → PR title: feat(DCC-252): extract lang+repl into packages/ride io.decentralchain artifacts
        → Squash merge to main  (Decentral-America/DecentralChain)
          → packages/ride/CHANGELOG.md entry [1.6.2] - 2026-XX-XX
            → GitHub Release lang-v1.6.2  (tagged in Decentral-America/DecentralChain)
              → Maven Central io.decentralchain:lang_3:1.6.2
              → Maven Central io.decentralchain:lang-testkit_3:1.6.2
              → npm @decentralchain/ride-lang:1.6.2
              → npm @decentralchain/ride-repl:1.6.2
                → packages/ride/ts updated to @decentralchain/* imports
                  → Jira DCC-252 closed with release version
```

### Conventional Commit Format

```
feat(DCC-252): <lowercase imperative, no period>
```

Examples:
```
feat(DCC-252): extract lang and repl modules into standalone sbt project
chore(DCC-252): upgrade scala to 3.8.3 and scalajs to 1.21.0
ci(DCC-252): add github actions for test coverage and npm publish
build(DCC-252): add sbt-scoverage sbt-scalafix plugins
style(DCC-252): apply scalafmt 3.11.1 formatting across lang and repl modules
fix(DCC-252): enforce complexity limits on user-submitted scripts
```

---

## 3. Verified Version Pinning Table

All versions researched from official GitHub releases pages as of 2026-05-16.

### 3.1 Build Toolchain

| Tool | Current (node-scala) | Target (packages/ride) | Change |
|------|---------------------|----------------------------|--------|
| SBT | `1.12.11` | `1.12.11` | ✅ none — already latest |
| Scala 3 | `3.8.1` | **`3.8.3`** | UPGRADE |
| sbt-scalajs | `1.20.2` | **`1.21.0`** | UPGRADE (Apr 4 2026) |
| sbt-crossproject | `1.3.2` | `1.3.2` | ✅ none — latest since Jul 2023 |
| sbt-protoc | `1.0.8` | `1.0.8` | ✅ none |
| ScalaPB compilerplugin | `1.0.0-alpha.3` | `1.0.0-alpha.3` | ✅ must match node-scala |
| sbt-scalafmt | `2.5.6` | **`2.6.1`** | UPGRADE — latest; bundles scalafmt 3.11.1 |
| scalafmt (`.scalafmt.conf`) | `3.9.4` | **`3.11.1`** | UPGRADE |
| sbt-git | `2.1.0` | `2.1.0` | ✅ none |
| sbt-pgp | `2.3.1` | `2.3.1` | ✅ none |

### 3.2 New Plugins (not in node-scala)

| Plugin | Version | Purpose |
|--------|---------|---------|
| `org.scoverage:sbt-scoverage` | **`2.4.4`** | Statement coverage gate — 70% floor, ratchet to 80% |
| `ch.epfl.scala:sbt-scalafix` | **`0.14.6`** | RemoveUnused, OrganizeImports, DisableSyntax |
| *(sbt built-in since 1.11.0)* | — | `sonaRelease` / `sonaUpload` — sbt native Sonatype Central Portal support; no plugin needed when sbt ≥ 1.11.0 (we use 1.12.11) |
| `com.github.cb372:sbt-explicit-dependencies` | **`0.3.1`** | No transitive dep leakage |

### 3.3 Removed Plugins (not needed in standalone library)

| Plugin | Reason |
|--------|--------|
| `sbt-native-packager` | Server packaging — not a library concern |
| `sbt-assembly` | Fat-jar for node binary — not a library concern |
| `sbt-javaagent` | JVM agent injection for server — not a library concern |
| `sbt-jmh` | No JMH benchmarks in lang/repl modules |

### 3.4 Key Library Dependencies

#### lang dependencies (from `Dependencies.scala` — verified against node-scala source)

| Library | Current | Notes |
|---------|---------|-------|
| `monix-eval` | `3.4.1` | Functional async |
| `cats-core` / `cats-mtl` | `2.13.0` / `1.6.0` | Functional core |
| `fastparse` | `3.1.1` | PEG parser for RIDE syntax |
| `big-math` | `2.3.2` | Arbitrary precision arithmetic |
| `guava` | `33.5.0-jre` | BaseEncoding.base16() |
| `com.wavesplatform:curve25519-java` | `0.6.6` | JNI Curve25519 — DCC-260 pending (see KNOWN_ISSUES) |
| `com.wavesplatform:zwaves` | `0.2.1` | zk-SNARK verifier — DCC-261 pending (see KNOWN_ISSUES) |
| `web3j-crypto` | `4.13.0` | ecRecover, keccak; do NOT upgrade to 4.14+ (requires Java 21) |
| `io.decentralchain:protobuf-schemas` | `1.6.1` | ✅ already DCC — DCC-239 complete |
| `scalapb-runtime` | `1.0.0-alpha.3` | Must match node-scala |
| `logback-classic` | `1.5.32` | ✅ Floor: ≥1.5.25 (CVE-2026-1225 ACE) |
| `scalajs-stubs` | `1.1.0` | `% Provided` — not in published artifact |

#### repl dependencies (from `build.sbt` — verified)

| Library | Notes |
|---------|-------|
| `circe-core/parser/generic` | JSON for REPL responses |
| `sttp3-core 3.11.0` | HTTP client for optional live node connection |
| `scala-js-macrotask-executor 1.1.1` | JS async executor |
| `lang-jvm` / `lang-js` | local source dep → replaced by `io.decentralchain:lang` post-extraction |

> **CRITICAL CORRECTION:** `com.wavesplatform:blst-java` (DCC-242) is a **`node` dependency only** — NOT a dependency of `lang` or `repl`. Confirmed by examining `Dependencies.scala` where blst-java appears exclusively in the `node` dep block. Do NOT list it in lang's KNOWN_ISSUES.md.

---

## 4. Package Structure

### 4.1 Full Ecosystem Context

Where this package sits across every repository in the ecosystem:

```
Decentral-America/DecentralChain  (primary monorepo — Node 24, pnpm 11, Nx)
├── .github/
│   └── workflows/
│       ├── ci.yml                          TypeScript CI (Nx affected)
│       ├── deploy-{cubensis,exchange,scanner,data-service}.yml
│       ├── publish-protobuf-serialization.yml
│       ├── release.yml
│       └── [NEW] jvm.yml                   ← DCC-252 adds this
│
├── apps/
│   ├── cubensis-connect/                   Electron wallet extension
│   │   └── src/                            React + Vite + extension APIs
│   ├── data-service/                       Candles/pairs API daemon
│   │   └── src/                            Node.js + PostgreSQL
│   ├── exchange/                           DEX frontend
│   │   └── src/                            React + Vite + Electron
│   └── scanner/                            Block explorer
│       └── src/                            React Router v7 + Vite
│
├── packages/
│   ├── ride/                               ONE sbt build: lang + repl + ts wrapper  🔲 DCC-252 ← THIS
│   │   ├── lang/                           io.decentralchain:lang_3 + lang-testkit_3 (Maven Central)
│   │   │                                   @decentralchain/ride-lang (npm)
│   │   ├── repl/                           @decentralchain/ride-repl (npm; no Maven artifact)
│   │   └── ts/                             @decentralchain/ride-js (TypeScript wrapper)
│   │
│   ├── jvm/                                Maven Central artifacts (pure-JVM, @nx/maven)
│   │   ├── protobuf-serialization/         io.decentralchain:protobuf-schemas  ✅ DCC-239
│   │   ├── java-sdk/                       io.decentralchain:java-sdk          🔲 DCC-251
│   │   ├── waves-transactions/             io.decentralchain:waves-transactions 🔲 DCC-240
│   │   ├── blst-java/                      io.decentralchain:blst-java         🔲 DCC-242
│   │   ├── curve25519-java/                io.decentralchain:curve25519-java   🔲 DCC-260
│   │   └── zwaves/                         io.decentralchain:zwaves            🔲 DCC-261
│   │
│   └── ts/                                 npm packages (@decentralchain/*)
│       ├── assets-pairs-order/
│       ├── bignumber/
│       ├── browser-bus/
│       ├── crypto/
│       ├── cubensis-connect-provider/
│       ├── cubensis-connect-types/
│       ├── data-entities/
│       ├── data-service-client-js/
│       ├── ledger/
│       ├── marshall/
│       ├── money-like-to-node/
│       ├── node-api-js/
│       ├── oracle-data/
│       ├── parse-json-bignumber/
│       ├── protobuf-serialization/         @decentralchain/protobuf-serialization ✅ DCC-239
│       ├── ride-js/                        @decentralchain/ride-js (moves → packages/ride/ts/ as part of DCC-252)
│       ├── signature-adapter/
│       ├── signer/
│       ├── transactions/
│       ├── ts-lib-crypto/
│       └── ts-types/
│
├── docs/                                   ARCHITECTURE, CONVENTIONS, ECOSYSTEM, STATUS…
├── public/locales/                         i18n strings
├── scripts/                                check-boundaries.mjs, sync-to-polyrepos.sh…
├── tools/
│   ├── generators/sdk-package/             Nx generator: scaffold new SDK package
│   └── nx-plugins/biome-inferred/          custom Nx plugin
├── biome.json  knip.json  lefthook.yml  nx.json
├── package.json  pnpm-workspace.yaml  renovate.json
├── tsconfig.base.json  vitest.base.config.ts
└── LICENSE  CODE_OF_CONDUCT.md  CONTRIBUTING.md  SECURITY.md  README.md

─────────────────────────────────────────────────────────────────────────────────

Standalone ecosystem repos  (stay standalone — NOT brought into monorepo):

Decentral-America/node-scala/               Scala blockchain node
├── lang/                                   ← extracted → packages/ride/ by DCC-252
├── repl/                                   ← extracted → packages/ride/ by DCC-252
├── node/  grpc-server/  ride-runner/       stay here forever
├── node-it/                                uses repl-jvm for integration tests
└── project/Dependencies.scala             consumes io.decentralchain:lang_3 post-DCC-252

Decentral-America/node-go/                  Go blockchain node — zero Maven deps ✅ clean

Decentral-America/matcher/                  Scala DEX engine
└── project/Dependencies.scala             com.wavesplatform:wavesj:1.6.3 (TODO: fork — no ticket yet)

Decentral-America/blockchain-postgres-sync/ Rust sync daemon — fully independent ✅

Decentral-America/java-sdk/                 Java SDK — migrating → packages/jvm/java-sdk/ (DCC-251)
└── pom.xml                                 com.wavesplatform:lang:1.6.1 → io.decentralchain:lang_3:1.6.2 post-DCC-252

─────────────────────────────────────────────────────────────────────────────────
```

### 4.2 `packages/ride/` — Detailed Package Tree

One sbt build at `packages/ride/`, multiple subprojects:

```
DecentralChain/
└── packages/
    └── ride/                               # ONE sbt build: lang + repl + ts wrapper
        ├── project.json                    # Nx project targets (sbt)
        ├── build.sbt
        ├── version.sbt
        ├── .scalafmt.conf
        ├── .scalafix.conf
        ├── lefthook.yml
        ├── renovate-overrides.json
        ├── project/
        │   ├── build.properties            # sbt.version=1.12.11
        │   ├── plugins.sbt
        │   ├── Dependencies.scala
        │   └── PublishedModule.scala
        │
        ├── lang/                           # crossProject(JSPlatform, JVMPlatform)
        │   ├── shared/src/
        │   │   ├── main/scala/com/decentralchain/lang/   # RIDE compiler (~346 files)
        │   │   ├── main/resources/         # wallet.ride, fomo.ride (stdlib test vectors)
        │   │   └── test/scala/
        │   ├── jvm/
        │   │   ├── src/main/scala/com/decentralchain/
        │   │   │   ├── crypto/             # Blake2b256, Keccak256, Curve25519, P256Curve…
        │   │   │   └── lang/               # Lang.scala, FileCompiler.scala, Global.scala
        │   │   └── tests/                  # sbt: project.in("lang/jvm/tests") — JVM integration tests
        │   │       └── src/
        │   │           ├── test/scala/
        │   │           └── test/resources/ # test .ride scripts
        │   ├── js/
        │   │   ├── src/main/scala/com/decentralchain/
        │   │   │   └── JsAPI.scala         # @JSExportTopLevel: compile, decompile,
        │   │   │                           #   scriptInfo, parseAndCompile, getTypes,
        │   │   │                           #   getVarsDoc, getFunctionsDoc, contractLimits,
        │   │   │                           #   nodeVersion
        │   │   ├── tests/                  # sbt: project.in("lang/js/tests") — Scala.js tests
        │   │   │   └── src/test/scala/
        │   │   ├── build.sbt               # artifactPath := baseDirectory / "dist" / "lang.js"
        │   │   ├── package.json            # → @decentralchain/ride-lang:1.6.2  files:["dist/"]
        │   │   └── dist/                   # sbt lang-js/fullOptJS writes here directly
        │   │       ├── lang.js             # Scala.js compiled output
        │   │       └── lang.d.ts           # hand-authored TypeScript declarations
        │   ├── testkit/src/main/scala/     # published → io.decentralchain:lang-testkit_3
        │   └── doc/                        # RIDE stdlib API docs
        │       ├── v1/ … v9/               # one dir per stdLib version
        │       └── v*/funcs/
        │
        ├── repl/                           # crossProject(JSPlatform, JVMPlatform)
        │   ├── shared/src/main/scala/      # Repl.scala, ReplEngine.scala, DeclPrinter.scala
        │   ├── jvm/src/
        │   │   ├── main/scala/             # SttpClient.scala (live node HTTP connection)
        │   │   └── test/scala/
        │   └── js/
        │       ├── src/main/scala/
        │       │   └── JsAPI.scala         # @JSExportTopLevel("repl"):
        │       │                           #   repl(settings, libraries) →
        │       │                           #     {evaluate, info, totalInfo, clear, reconfigure}
        │       ├── build.sbt               # artifactPath := baseDirectory / "dist" / "repl.js"
        │       ├── package.json            # → @decentralchain/ride-repl:1.6.2  files:["dist/"]
        │       └── dist/                   # sbt repl-js/fullOptJS writes here directly
        │           ├── repl.js             # Scala.js compiled output
        │           └── repl.d.ts           # hand-authored TypeScript declarations
        │
        ├── ts/                             # @decentralchain/ride-js — TypeScript wrapper
        │   ├── src/index.js                # imports ride-lang + ride-repl (workspace:*)
        │   ├── package.json
        │   ├── tsconfig.json
        │   └── vitest.config.ts
        │
        ├── CHANGELOG.md
        ├── KNOWN_ISSUES.md
        └── README.md
```

Notes:
- `lang/jvm/src/main/protobuf/` does **not** exist — protobuf comes from `io.decentralchain:protobuf-schemas` dep; there are no authored `.proto` sources in lang
- `lang/jvm/tests/` and `lang/js/tests/` are sbt subprojects declared as `project.in(file("lang/jvm/tests"))` and `project.in(file("lang/js/tests"))`. This improves on upstream (where `lang/tests/` and `lang/tests-js/` were siblings of `lang/jvm/` and `lang/js/`). Tests live inside their platform directory. `lang/testkit/` stays at `lang/` level — shared by both JVM and JS test suites. `package.json` at `lang/js/` declares `"files": ["dist/"]` — npm publish never sees `tests/`.
- `LICENSE`, `CODE_OF_CONDUCT.md`, `CONTRIBUTING.md`, `SECURITY.md` live at the monorepo root — do NOT duplicate per-package

---

## 5. Phase 0 — Extract & Rebrand (MIGRATE)

### 5.1 Git History Preservation

Use `git filter-repo` — NOT `git subtree split`. Subtree squashes all history into one synthetic commit. `filter-repo` preserves every individual commit with correct authorship.

Both `lang/` and `repl/` are extracted together — they share version and release history.

```bash
# Step 1: Fresh throw-away clone of node-scala (NEVER modify the original)
git clone /path/to/Ecosystem/node-scala /tmp/lang-extraction
cd /tmp/lang-extraction

# Step 2: filter-repo — extract lang/ + repl/ together, rewrite paths for monorepo
git filter-repo \  # install: pip install git-filter-repo  OR  brew install git-filter-repo
  --path lang/ \
  --path repl/ \
  --path project/Dependencies.scala \
  --path project/plugins.sbt \
  --path project/build.properties \
  --path version.sbt \
  --path-rename lang/:packages/ride/lang/ \
  --path-rename repl/:packages/ride/repl/ \
  --path-rename project/Dependencies.scala:packages/ride/project/Dependencies.scala \
  --path-rename project/plugins.sbt:packages/ride/project/plugins.sbt \
  --path-rename project/build.properties:packages/ride/project/build.properties \
  --path-rename version.sbt:packages/ride/version.sbt \
  --tag-rename '':'lang-'

# Step 3: Graft filtered history into DecentralChain monorepo
cd /path/to/Ecosystem/DecentralChain
git checkout -b feat/DCC-252-lang-fork-standalone
git remote add lang-source /tmp/lang-extraction
git fetch lang-source
git merge --allow-unrelated-histories lang-source/main --no-commit
git commit -m "feat(DCC-252): graft lang+repl history from node-scala into packages/ride"
git remote remove lang-source
rm -rf /tmp/lang-extraction
```

After merge: create `build.sbt`, `project/plugins.sbt`, `lang/js/package.json`, `repl/js/package.json`, `lang/js/build.sbt`, `repl/js/build.sbt`, `project.json`, and community files manually.

### 5.2 Clean Slate — Files to Exclude

Do NOT carry over from node-scala:

```
# Root sbt files (rewrite from scratch for lang+repl only):
build.sbt              — rewrite with only lang, repl, lang-testkit, lang-tests
project/plugins.sbt    — rewrite: remove server plugins, add new library plugins

# Subprojects that STAY in node-scala (never copy to packages/ride):
node/                  grpc-server/   node-generator/
ride-runner/           benchmark/     curve25519-test/   node-it/

# Plugins to drop from plugins.sbt:
# sbt-native-packager, sbt-assembly, sbt-javaagent, sbt-jmh, sbt-docker
```

### 5.3 Package Rebrand — Verify DCC-147 Completion

DCC-147 already renamed `com.wavesplatform.lang` → `com.decentralchain.lang`. Verify:

```bash
# Must return ZERO (any hit = DCC-147 incomplete):
grep -rn "com\.wavesplatform\.lang" lang/ repl/ --include="*.scala"

# If hits remain, bulk fix:
find lang repl -name '*.scala' | \
  xargs sed -i '' 's/com\.wavesplatform\.lang/com.decentralchain.lang/g'
```

### 5.4 Wavesplatform Remnant Audit

```bash
# Must return ZERO in non-exception files:
grep -rni "wavesplatform" . \
  --include="*.scala" --include="*.conf" --include="*.yml" \
  --include="*.yaml" --include="*.json" --include="*.md" --include="*.xml" \
  | grep -v "\.proto\|KNOWN_ISSUES\|CHANGELOG"

# Specific patterns:
grep -rn "nodes\.wavesnodes\.com\|waves\.exchange\|wavesexplorer" .
grep -rn "@waves/" .
grep -rn "com\.wavesplatform" . --include="*.scala"
```

**Branding checklist:**
- [ ] Zero `com.wavesplatform.lang` in `.scala` files
- [ ] Zero `@waves/` package references
- [ ] Zero Waves network URLs in source/config
- [ ] `organization := "io.decentralchain"` in build.sbt
- [ ] `organizationName := "Decentral America Inc."` in build.sbt
- [ ] `homepage` → `https://github.com/Decentral-America/DecentralChain/tree/main/packages/ride`
- [ ] `licenses` → Apache-2.0 with DCC copyright

### 5.5 Acceptable Wire-Format Exceptions

Document in `KNOWN_ISSUES.md`:

| Location | Pattern | Why Acceptable |
|----------|---------|---------------|
| `lang/jvm/src/main/protobuf/**/*.proto` | `package waves;` | Wire-format protocol identifier — changing breaks binary compatibility with every existing block |
| `CHANGELOG.md` | "migrated from Waves" | Historical record required for traceability |
| `.scala` test fixtures | Waves mainnet address strings | Known-valid test vectors for protocol-level tests, clearly marked |

### 5.6 Maven Coordinates

```
groupId:    io.decentralchain
artifactId: lang_3              (JVM — Scala 3 suffix auto-applied by sbt)
artifactId: lang_sjs1_3         (Scala.js JAR)
artifactId: lang-testkit_3      (JVM test helpers — published)
version:    <git-describe-based via sbt-git>
```

`repl` subprojects do NOT produce Maven artifacts:
- `repl-jvm` — internal only (node-scala node-it integration tests, no publish)
- `repl-js` → publishes `@decentralchain/ride-repl` to **npm** (not Maven Central)

### 5.7 npm Package Coordinates

The npm packages are **co-located with the Scala.js subproject source** — this is the upstream Waves pattern. The `package.json` lives inside `lang/js/` and `repl/js/` respectively. sbt's `artifactPath` configuration writes the compiled output **directly** into `js/dist/` — no copy script, no staging directory.

```
@decentralchain/ride-lang:1.6.2    — lang/js/  (sbt lang-js/fullOptJS → lang/js/dist/lang.js)
@decentralchain/ride-repl:1.6.2    — repl/js/  (sbt repl-js/fullOptJS → repl/js/dist/repl.js)
```

**`lang/js/build.sbt`** (sbt writes output directly into the npm package — no copy needed):
```scala
scalaJSLinkerConfig ~= {
  _.withModuleKind(ModuleKind.CommonJSModule)
}

Compile / fullOptJS / artifactPath := baseDirectory.value / "dist" / "lang.js"
```

**`repl/js/build.sbt`:**
```scala
scalaJSLinkerConfig ~= {
  _.withModuleKind(ModuleKind.CommonJSModule)
}

Compile / fullOptJS / artifactPath := baseDirectory.value / "dist" / "repl.js"
```

**`lang/js/package.json`:**
```json
{
  "name": "@decentralchain/ride-lang",
  "version": "1.6.2",
  "description": "RIDE smart contract compiler for DecentralChain — compiled from Scala.js",
  "main": "dist/lang.js",
  "module": "dist/lang.js",
  "types": "dist/lang.d.ts",
  "files": ["dist"],
  "license": "Apache-2.0",
  "repository": {
    "type": "git",
    "url": "https://github.com/Decentral-America/DecentralChain.git",
    "directory": "packages/ride/lang/js"
  }
}
```

**`repl/js/package.json`:**
```json
{
  "name": "@decentralchain/ride-repl",
  "version": "1.6.2",
  "description": "RIDE interactive REPL for DecentralChain — compiled from Scala.js",
  "main": "dist/repl.js",
  "module": "dist/repl.js",
  "types": "dist/repl.d.ts",
  "files": ["dist"],
  "license": "Apache-2.0",
  "repository": {
    "type": "git",
    "url": "https://github.com/Decentral-America/DecentralChain.git",
    "directory": "packages/ride/repl/js"
  }
}
```

TypeScript declaration files (`lang/js/dist/lang.d.ts`, `repl/js/dist/repl.d.ts`) are hand-authored based on `@JSExportTopLevel` signatures in the Scala source. There is no automated Scala → TypeScript type generation.

To publish: `cd lang/js && pnpm publish --no-git-checks --access public` (and same for `repl/js`). No copy script needed — sbt already placed the output at the right path.

### 5.8 `packages/ride/ts` Migration (same PR or immediate follow-up)

Update `packages/ride/ts/src/index.js`:
```diff
- import * as scalaJsCompiler from '@waves/ride-lang';
- import * as replJs from '@waves/ride-repl';
+ import * as scalaJsCompiler from '@decentralchain/ride-lang';
+ import * as replJs from '@decentralchain/ride-repl';
```

Update `packages/ride/ts/package.json`:
```diff
  "dependencies": {
-   "@waves/ride-lang": "1.6.2",
-   "@waves/ride-repl": "1.6.2",
+   "@decentralchain/ride-lang": "workspace:*",
+   "@decentralchain/ride-repl": "workspace:*",
    "@decentralchain/ts-lib-crypto": "workspace:*"
  }
```

`workspace:*` is correct here because `lang/js/` and `repl/js/` are registered in the pnpm workspace. Add three lines to `pnpm-workspace.yaml`:

```yaml
packages:
  - packages/ts/*             # current name (packages/sdk/* after DCC-248 ships)
  - packages/ride/lang/js     # @decentralchain/ride-lang
  - packages/ride/repl/js     # @decentralchain/ride-repl
  - packages/ride/ts          # @decentralchain/ride-js
  # ... (existing entries)
```

> **Note:** if DCC-248 (the `packages/ts/` → `packages/sdk/` rename) has already landed when this PR merges, replace `packages/ts/*` with `packages/sdk/*` above.

This resolves the last `@waves/` reference in the DCC monorepo — previously marked "unavoidable: no fork available" in the production audit.

### 5.9 `project/build.properties`

```properties
sbt.version=1.12.11
```

### 5.10 `version.sbt`

```scala
ThisBuild / git.baseVersion := "1.6.2"
```

### 5.11 Community Files

**`KNOWN_ISSUES.md`** — documents remaining `com.wavesplatform` deps (lang runtime only):

```markdown
# Known Issues

## Remaining com.wavesplatform Maven Dependencies (lang runtime deps)

| Dependency | Version | Fork Ticket | Used By |
|-----------|---------|------------|---------|
| com.wavesplatform:curve25519-java | 0.6.6 | DCC-260 | lang — Curve25519 JNI crypto |
| com.wavesplatform:zwaves | 0.2.1 | DCC-261 | lang — zk-SNARK verifier |

Note: com.wavesplatform:blst-java (DCC-242) is a node-scala/node dependency only.
It is NOT a dependency of lang or repl and does NOT appear here.

## Wire-Format Namespace Exceptions

Proto files in lang/jvm/src/main/protobuf/ use `package waves;` as a
wire-format protocol identifier. Cannot be changed without breaking binary
compatibility with every existing block on chain.
```

**`renovate-overrides.json`:**
```json
{
  "$schema": "https://docs.renovatebot.com/renovate-schema.json",
  "extends": ["config:recommended"],
  "packageRules": [
    {
      "matchManagers": ["sbt"],
      "matchPackagePatterns": ["^ch.qos.logback"],
      "allowedVersions": ">=1.5.25"
    },
    {
      "matchManagers": ["sbt"],
      "matchPackageNames": ["com.thesamet.scalapb:compilerplugin"],
      "versioning": "semver-coerced",
      "allowedVersions": "!/alpha/"
    },
    {
      "matchManagers": ["github-actions"],
      "automerge": false
    }
  ]
}
```

---

## 6. Phase 1 — Bulletproof Quality Gates (BULLETPROOF)

### Pipeline Architecture

```
GIT COMMIT → lefthook pre-commit → sbt bulletproof
  scalafmtCheckAll
  → scalafixAll --check
  → undeclaredCompileDependencies
  → unusedCompileDependencies
  → coverage
  → lang-jvm/test → lang-testkit/test → lang-tests/test → lang-tests-js/test
  → repl-jvm/test
  → coverageReport → coverageAggregate
  → lang-js/fullOptJS → repl-js/fullOptJS   (verify Scala.js compiles)
```

### `sbt bulletproof` Aggregate Task

```scala
addCommandAlias(
  "bulletproof",
  List(
    "scalafmtCheckAll",
    "scalafixAll --check",
    "undeclaredCompileDependencies",
    "unusedCompileDependencies",
    "coverage",
    "lang-jvm/test",
    "lang-testkit/test",
    "lang-tests/test",
    "lang-tests-js/test",
    "repl-jvm/test",
    "coverageReport",
    "coverageAggregate",
    "lang-js/fullOptJS",
    "repl-js/fullOptJS",
  ).mkString("; ")
)

addCommandAlias(
  "bulletproof:fix",
  List(
    "scalafmtAll",
    "scalafixAll",
    "coverage",
    "lang-jvm/test",
    "lang-testkit/test",
    "lang-tests/test",
    "lang-tests-js/test",
    "repl-jvm/test",
    "coverageReport",
  ).mkString("; ")
)
```

### Lefthook Pre-Commit Hook

```yaml
pre-commit:
  parallel: false
  commands:
    format:
      run: sbt scalafmtCheckAll
    lint:
      run: sbt "scalafixAll --check"
    compile:
      run: sbt lang-jvm/compile lang-js/compile repl-jvm/compile repl-js/compile
```

### `.scalafmt.conf`

```hocon
version = "3.11.1"
runner.dialect = scala3
style = defaultWithAlign
assumeStandardLibraryStripMargin = true
maxColumn = 150
docstrings.wrap = keep
project.excludePaths = [
  "glob:**/lang/shared/src/main/scala/com/decentralchain/lang/v1/parser/Parser.scala"
]
```

Parser.scala exclusion preserved — generated PEG parser with intentional non-standard formatting.

### `.scalafix.conf`

```hocon
rules = [
  RemoveUnused
  OrganizeImports
  DisableSyntax
]

OrganizeImports {
  groups = ["re:javax?\\.", "scala.", "*", "io.decentralchain.", "com.decentralchain."]
  coalesceToWildcardImportThreshold = 6
}

DisableSyntax {
  noVars = false
  noReturns = true
  noThrows = false
  noNulls = true
  noAsInstanceOf = false
  noIsInstanceOf = false
  noXml = true
  noDefaultArgs = false
  noFinalVal = false
  noFinalize = true
  noValPatterns = false
  noUniversalEquality = false
}
```

### Coverage Gate

```scala
// Sprint 1 floor:
ThisBuild / coverageMinimumStmtTotal := 70
ThisBuild / coverageFailOnMinimum    := true
ThisBuild / coverageExcludedPackages := ".*\\.pb\\..*"  // exclude generated protobuf code
```

**CRITICAL sbt-scoverage 2.x:** `coverageMinimumStmtTotal`, NOT `coverageMinimum`. The 1.x key silently does nothing in 2.x — verify with `sbt help coverageMinimumStmtTotal` before first CI run.

### Compiler Flags

```scala
scalacOptions ++= Seq(
  "-Wunused:all",     // required for scalafix RemoveUnused
  "-Wvalue-discard",  // warn on discarded non-Unit values
  "-source:3.5",      // unlock Scala 3.5+ features; compatible with 3.8.3
)
```

---

## 7. Phase 2 — Toolchain Modernization (MODERNIZE)

### 7.1 Scala 3.8.1 → 3.8.3

Latest stable (Mar 31 2026). 3.8.2 fixed a match type exhaustivity regression in RIDE's `TypeEstimator.scala`. node-scala stays on 3.8.1 until consuming the published artifact.

### 7.2 Scala.js 1.20.2 → 1.21.0

Released Apr 4 2026. No breaking changes for pure-library usage. Improved ES module output for the DCC TypeScript SDK.

### 7.3 Scalafmt 3.9.4 → 3.11.1

Latest release. First release cross-compiled for Scala 3. ProcedureSyntax and RewriteLiterals rules add value.

### 7.4 ScalaPB — Stay on `1.0.0-alpha.3`

Do NOT upgrade. Must remain binary-compatible with node-scala's generated code. Renovate alerts when stable 1.0.0 ships — upgrade both repos in a coordinated sprint then.

### 7.5 `project/plugins.sbt`

```scala
// Must precede Scala.js to avoid source generator ordering conflict
addSbtPlugin("com.thesamet" % "sbt-protoc" % "1.0.8")
libraryDependencies += "com.thesamet.scalapb" %% "compilerplugin" % "1.0.0-alpha.3"

Seq(
  "org.portable-scala" % "sbt-scalajs-crossproject" % "1.3.2",
  "org.scala-js"       % "sbt-scalajs"              % "1.21.0",    // UPGRADED
  "org.scalameta"      % "sbt-scalafmt"             % "2.6.1",    // UPGRADED
  "com.github.sbt"     % "sbt-git"                  % "2.1.0",
  "com.github.sbt"     % "sbt-pgp"                  % "2.3.1",
  "org.scoverage"      % "sbt-scoverage"            % "2.4.4",     // NEW
  "ch.epfl.scala"      % "sbt-scalafix"             % "0.14.6",    // NEW
  "com.github.cb372"   % "sbt-explicit-dependencies" % "0.3.1",   // NEW
).map(addSbtPlugin)
```

---

## 8. Phase 3 — Security Audit (AUDIT)

### Phase A — Dependency & Supply Chain Audit

```bash
sbt evicted
sbt "lang-jvm/dependencyTree"
sbt "repl-jvm/dependencyTree"
```

**Checklist:**
- [ ] Zero `com.wavesplatform` deps not documented in KNOWN_ISSUES.md (only curve25519-java and zwaves acceptable)
- [ ] `com.wavesplatform:blst-java` is NOT present in lang or repl dependency trees (confirmed: it's node-only)
- [ ] `protobuf-java 4.33.5` — MAX_MESSAGE_SIZE not disabled anywhere
- [ ] `logback-classic ≥ 1.5.25` (CVE-2026-1225; current: 1.5.32 ✅)
- [ ] All test-scoped deps are `% Test`
- [ ] `scalajs-stubs` is `% Provided`
- [ ] `web3j-crypto 4.13.0` — documented: do NOT upgrade to 4.14+ (Java 21 requirement)

### Phase B — Static Code Analysis

```bash
sbt "scalafixAll --check"
sbt undeclaredCompileDependencies
sbt unusedCompileDependencies
```

**Manual checks:**
- [ ] Zero `println` in production code:
  ```bash
  grep -rn "println\|System\.out\." lang/ repl/ --include="*.scala"  # Must return ZERO
  ```
- [ ] No logging of script source content (user contracts can contain sensitive derivation patterns)
- [ ] Every `case _ => ()` is intentional (financial risk: swallowing unhandled cases)

### Phase C — Security-Sensitive Code Review (RIDE Compiler as Untrusted Input Processor)

**DoS Surface:**
- [ ] `ScriptComplexityLimit` enforced before evaluation — test at exactly `limit` (passes) and `limit + 1` (fails)
- [ ] `FOLD<N>` bounded — N cap cannot be bypassed via nested calls; `FOLD<1001>` fails
- [ ] AST depth limit prevents stack overflow in evaluator JVM code
- [ ] Proto deserialization: `MAX_MESSAGE_SIZE` not disabled anywhere
- [ ] `DataEntryMaxLength`, `MaxAssetNameLength`, `MaxTxAttachmentSize` enforced

**Error Message Safety:**
- [ ] Errors do NOT expose internal VM state (stack traces, internal IR) to script authors
- [ ] No `warn`/`error` logging of script source content

**Built-in Crypto (blake2b256, keccak256, sha256, rsaVerify, ecRecover, sigVerify, groth16Verify):**
- [ ] All inputs have size limits before passing to native/JNI code
- [ ] `rsaVerify` key size bounded at ≤ 4096 bits
- [ ] `ecRecover` output validated before returning to script context

**Integer Safety:**
- [ ] Arithmetic uses `Math.addExact`, `Math.multiplyExact` — no silent overflow
- [ ] All `/` and `%` operators have zero-check guards

### Phase D — Test Quality Audit

```bash
sbt coverage lang-jvm/test lang-testkit/test lang-tests/test repl-jvm/test coverageReport
```

**Coverage:**
- [ ] Global statement coverage ≥ 70% (Sprint 1 floor)
- [ ] `lang/shared/src/main/scala/com/decentralchain/lang/v1/evaluator/` ≥ 80% (most security-critical)

**Test Checklist:**
- [ ] Complexity limit: at `limit` passes, at `limit + 1` fails
- [ ] FOLD cap: `FOLD<1001>` fails at compile or evaluation time
- [ ] Round-trip: `compile → serialize → deserialize → evaluate` = identical result
- [ ] Determinism: same script + same context = same result, always
- [ ] Zero network calls in unit tests (no live node, no testnet)
- [ ] Zero real mainnet keys in test fixtures (synthetic test vectors only)

### Phase E — Configuration & CI Audit

- [ ] `coverageMinimumStmtTotal` set (not `coverageMinimum`)
- [ ] `coverageFailOnMinimum := true`
- [ ] JDK matrix: `[21, 25]`
- [ ] `sbt +publishSigned sonaRelease` in release workflow (sbt 1.11+ native Central Portal)
- [ ] npm publish authenticated via `NODE_AUTH_TOKEN`
- [ ] GPG import validated before release

**Artifact Validation:**
```bash
sbt +publishLocal
find ~/.ivy2/local/io.decentralchain -name "*.jar" | sort
# Expected: lang_3, lang_3-sources, lang_3-javadoc, lang_sjs1_3, lang_sjs1_3-sources, lang-testkit_3, lang-testkit_3-sources, lang-testkit_3-javadoc
ls lang/js/dist/lang.js repl/js/dist/repl.js  # must exist
```

### Phase F — Branding & Legal Audit

```bash
grep -ri "wavesplatform\|waves\.exchange\|wavesnodes\.com" \
  --include="*.scala" --include="*.conf" --include="*.yml" \
  --include="*.yaml" --include="*.json" --include="*.md" --include="*.xml" \
  . | grep -v "\.proto\|KNOWN_ISSUES\|CHANGELOG"
# Must return ZERO
```

**Legal checklist:**
- [ ] `organization := "io.decentralchain"` in build.sbt
- [ ] `organizationName := "Decentral America Inc."` in build.sbt
- [ ] `licenses := List("Apache-2.0" → url("..."))` — copyright DecentralChain
- [ ] npm `package.json`: `"license": "Apache-2.0"` in both ride-lang and ride-repl
- [ ] KNOWN_ISSUES.md documents only curve25519-java and zwaves (not blst-java)

---

## 9. CI/CD — Nx Monorepo Integration

No standalone CI files under `packages/ride/`. A `jvm.yml` is added to DecentralChain monorepo's `.github/workflows/`.

### 9.1 `packages/ride/project.json` — Nx Targets

```json
{
  "name": "lang",
  "$schema": "../../../node_modules/nx/schemas/project-schema.json",
  "projectType": "library",
  "sourceRoot": "packages/ride",
  "targets": {
    "compile": {
      "command": "sbt lang-jvm/compile lang-js/compile repl-jvm/compile repl-js/compile",
      "options": { "cwd": "packages/ride" }
    },
    "test": {
      "command": "sbt bulletproof",
      "options": { "cwd": "packages/ride" }
    },
    "publish": {
      "command": "sbt +publishSigned sonaRelease",
      "options": { "cwd": "packages/ride" }
    },
    "publish-npm": {
      "command": "sbt lang-js/fullOptJS repl-js/fullOptJS",
      "options": { "cwd": "packages/ride" }
    },
    "publish-local": {
      "command": "sbt +publishLocal",
      "options": { "cwd": "packages/ride" }
    }
  }
}
```

### 9.2 Monorepo CI — `jvm.yml`

```yaml
name: RIDE Packages
on:
  push:
    branches: [main]
    paths: ['packages/ride/**']
  pull_request:
    paths: ['packages/ride/**']

jobs:
  lang:
    name: lang+repl — sbt bulletproof
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: packages/ride
    strategy:
      matrix:
        java: ['21', '25']
    steps:
      - uses: actions/checkout@de0fac2e4500dabe0009e67214ff5f5447ce83dd
        with: { fetch-depth: 0 }
      - uses: sbt/setup-sbt@93e926cbdb4a428e41b4ef754124ec82925ffdc2
      - uses: actions/setup-java@be666c2fcd27ec809703dec50e508c2fdc7f6654
        with:
          distribution: temurin
          java-version: ${{ matrix.java }}
          cache: sbt
      - run: sbt bulletproof
      - uses: actions/upload-artifact@043fb46d1a93c77aae656e7c1c64a875d1fc6a0a
        if: always()
        with:
          name: lang-coverage-jdk${{ matrix.java }}
          path: packages/ride/target/scala-3.*/scoverage-report/
```

### 9.3 Release — Maven Central + npm Publishing

Triggered by `lang-v*` tag push to `Decentral-America/DecentralChain`:

```yaml
name: RIDE Packages Release
on:
  push:
    tags: ['lang-v*']

jobs:
  publish-lang:
    name: Publish io.decentralchain:lang + @decentralchain/ride-*
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: packages/ride
    steps:
      - uses: actions/checkout@de0fac2e4500dabe0009e67214ff5f5447ce83dd
        with: { fetch-depth: 0 }
      - uses: sbt/setup-sbt@93e926cbdb4a428e41b4ef754124ec82925ffdc2
      - uses: actions/setup-java@be666c2fcd27ec809703dec50e508c2fdc7f6654
        with: { distribution: temurin, java-version: '25', cache: sbt }
      - uses: actions/setup-node@48b55a011bda9f5d6aeb4c2d9c7362e8dae4041e
        with:
          node-version: '24'
          registry-url: 'https://registry.npmjs.org'

      - name: Import GPG key
        run: echo ${{ secrets.PGP_SECRET }} | base64 --decode | gpg --batch --import

      - name: Publish Maven Central artifacts
        run: sbt +publishSigned sonaRelease
        env:
          SONATYPE_USERNAME: ${{ secrets.SONATYPE_USERNAME }}
          SONATYPE_PASSWORD: ${{ secrets.SONATYPE_PASSWORD }}
          PGP_PASSPHRASE: ${{ secrets.PGP_PASSPHRASE }}

      - name: Compile Scala.js outputs
        run: sbt "lang-js/fullOptJS" "repl-js/fullOptJS"

      - name: Publish @decentralchain/ride-lang
        run: pnpm publish --no-git-checks --access public
        working-directory: packages/ride/lang/js
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}

      - name: Publish @decentralchain/ride-repl
        run: pnpm publish --no-git-checks --access public
        working-directory: packages/ride/repl/js
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

### 9.4 Security Scanning — Extend `security.yml`

```yaml
  lang-owasp:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: packages/ride
    steps:
      - uses: actions/checkout@de0fac2e4500dabe0009e67214ff5f5447ce83dd
      - uses: actions/setup-java@be666c2fcd27ec809703dec50e508c2fdc7f6654
        with: { distribution: temurin, java-version: '25' }
      - uses: dependency-check/Dependency-Check_Action@75ba02d6183445fe0761d26e836bde58b1560600  # v1.1.0
        with:
          project: 'io.decentralchain:lang'
          path: 'packages/ride'
          format: HTML,SARIF
          args: --failBuildOnCVSS 7

  lang-sbom:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@de0fac2e4500dabe0009e67214ff5f5447ce83dd
      - uses: anchore/sbom-action@e22c389904149dbc22b58101806040fa8d37a610
        with: { path: 'packages/ride', format: cyclonedx-json, artifact-name: lang-sbom.json }
```

### 9.5 Pinned Action SHAs

| Action | Version | SHA |
|--------|---------|-----|
| `actions/checkout` | v6.0.2 | `de0fac2e4500dabe0009e67214ff5f5447ce83dd` |
| `actions/setup-java` | v5.2.0 | `be666c2fcd27ec809703dec50e508c2fdc7f6654` |
| `actions/setup-node` | v6.4.0 | `48b55a011bda9f5d6aeb4c2d9c7362e8dae4041e` |
| `actions/cache` | v5.0.5 | `27d5ce7f107fe9357f9df03efb73ab90386fccae` |
| `actions/upload-artifact` | v7.0.1 | `043fb46d1a93c77aae656e7c1c64a875d1fc6a0a` |
| `dependency-check/Dependency-Check_Action` | v1.1.0 | `75ba02d6183445fe0761d26e836bde58b1560600` |
| `sbt/setup-sbt` | v1.1.23 | `93e926cbdb4a428e41b4ef754124ec82925ffdc2` |
| `anchore/sbom-action` | v0.24.0 | `e22c389904149dbc22b58101806040fa8d37a610` |

---

## 10. Publishing Configuration

### 10.1 Maven Central (`build.sbt`)

```scala
ThisBuild / organization         := "io.decentralchain"
ThisBuild / organizationName     := "Decentral America Inc."
ThisBuild / organizationHomepage := Some(url("https://decentralchain.io"))
ThisBuild / description          := "RIDE smart contract language compiler and REPL for DecentralChain"
ThisBuild / licenses             := List("Apache-2.0" -> new URL("https://www.apache.org/licenses/LICENSE-2.0"))
ThisBuild / homepage             := Some(url("https://github.com/Decentral-America/DecentralChain/tree/main/packages/ride"))
ThisBuild / scmInfo := Some(ScmInfo(
  url("https://github.com/Decentral-America/DecentralChain"),
  "scm:git@github.com:Decentral-America/DecentralChain.git"
))
ThisBuild / developers := List(
  Developer("decentralchain", "DecentralChain Team", "dev@decentralamerica.com",
    url("https://github.com/Decentral-America"))
)
ThisBuild / pomIncludeRepository := { _ => false }
ThisBuild / publishMavenStyle    := true
ThisBuild / publishTo := {
  val centralSnapshots = "https://central.sonatype.com/repository/maven-snapshots/"
  if (isSnapshot.value) Some("central-snapshots" at centralSnapshots)
  else localStaging.value
}
```

### 10.2 Security Floor Overrides

```scala
ThisBuild / dependencyOverrides ++= Seq(
  "org.scala-lang"      %% "scala3-library"  % "3.8.3",
  "com.google.protobuf"  % "protobuf-java"   % "4.33.5",
  "org.slf4j"            % "slf4j-api"       % "2.0.17",
  "ch.qos.logback"       % "logback-classic" % "1.5.32",  // floor ≥1.5.25 (CVE-2026-1225)
)
```

### 10.3 Published Artifacts Summary

| Artifact | Type | Maven Central Required |
|----------|------|------------------------|
| `io.decentralchain:lang_3:1.6.2` | JVM JAR | ✅ main + sources + javadoc |
| `io.decentralchain:lang_sjs1_3:1.6.2` | Scala.js JAR | ✅ main + sources |
| `io.decentralchain:lang-testkit_3:1.6.2` | JVM JAR | ✅ main + sources + javadoc |
| `@decentralchain/ride-lang:1.6.2` | npm | `dist/lang.js` |
| `@decentralchain/ride-repl:1.6.2` | npm | `dist/repl.js` |

GPG `.asc` signatures auto-generated by sbt-pgp for all Maven artifacts.

---

## 11. Migration Guide for node-scala

Once `io.decentralchain:lang_3:1.6.2` is published and smoke-tested:

### `project/Dependencies.scala`

```scala
// REMOVE: local crossProject reference
// ADD:
val langVersion = "1.6.2"
lazy val lang        = "io.decentralchain" %% "lang"         % langVersion
lazy val langTestkit = "io.decentralchain" %% "lang-testkit" % langVersion % Test
```

### `build.sbt` — update repl-jvm

```scala
// repl-jvm switches from local source dep to published Maven artifact:
lazy val `repl-jvm` = repl.jvm
  .settings(
    libraryDependencies ++= Seq(
      "io.decentralchain" %% "lang"         % "1.6.2",
      "io.decentralchain" %% "lang-testkit" % "1.6.2" % Test,
      "org.scala-js"      %% "scalajs-stubs" % "1.1.0" % Provided,
      Dependencies.sttp3
    )
  )
```

### Smoke Test Before Deleting `node-scala/lang/`

1. `io.decentralchain:lang` resolves from Maven Central in clean `~/.ivy2/`
2. `sbt node/compile` exits 0 with published artifact
3. `sbt repl-jvm/compile` exits 0
4. Full `node-scala` test suite passes: `sbt node/test`
5. DCC testnet deployment validates RIDE script compilation end-to-end

### Migration Guide for `java-sdk` (After DCC-252 Ships)

**`java-sdk/pom.xml`:**
```xml
<!-- REMOVE: -->
<dependency>
  <groupId>com.wavesplatform</groupId>
  <artifactId>lang</artifactId>
  <version>1.6.1</version>
</dependency>

<!-- ADD: -->
<dependency>
  <groupId>io.decentralchain</groupId>
  <artifactId>lang_3</artifactId>
  <version>1.6.2</version>
</dependency>
```

**`CompilationUtil.java` imports:**
```java
// REMOVE:
import com.wavesplatform.lang.Lang;
import com.wavesplatform.lang.CompileAndParseResult;
// ADD:
import com.decentralchain.lang.Lang;
import com.decentralchain.lang.CompileAndParseResult;
```

---

## 12. Ecosystem Dependency Map — Full DCC-237 Scope

Complete shared library picture across all ecosystem repos:

```
packages/ride/ (sbt build — publishes to both Maven Central and npm):

  lang/                    DCC-252 — THIS TICKET
    io.decentralchain:lang_3 (Maven Central)
      → node-scala (node server, currently from source → Maven post-DCC-252)
      → java-sdk/CompilationUtil.java (com.wavesplatform:lang → io.decentralchain:lang_3)
    io.decentralchain:lang-testkit_3 (Maven Central)
      → node-scala test infra
    @decentralchain/ride-lang (npm — was @waves/ride-lang)
      → packages/ride/ts
    @decentralchain/ride-repl (npm — was @waves/ride-repl)
      → packages/ride/ts

packages/jvm/ (pure-JVM Maven Central libraries):

  protobuf-serialization/  DCC-239 ✅ DONE
    → node-scala, node-go, java-sdk

  java-sdk/                DCC-251 — in progress
    io.decentralchain:java-sdk
    pom.xml deps after DCC-252:
      → io.decentralchain:lang_3
      → io.decentralchain:waves-transactions (after DCC-240)

  waves-transactions/      DCC-240 — pending
    → java-sdk

  blst-java/               DCC-242 — pending
    → node-scala/node ONLY (NOT lang, NOT repl)

  curve25519-java/         DCC-260 — pending — BLOCKS lang's KNOWN_ISSUES clean
    → node-scala/lang (runtime dep of RIDE compiler)

  zwaves/                  DCC-261 — pending — BLOCKS lang's KNOWN_ISSUES clean
    → node-scala/lang (runtime dep of RIDE compiler)

  [NEW TICKET NEEDED] wavesj/
    → Ecosystem/matcher (com.wavesplatform:wavesj:1.6.3)
    → See Section 13

Standalone ecosystem repos:
  node-scala/     after DCC-252: consumes io.decentralchain:lang_3 from Maven
  node-go/        zero wavesplatform deps ✅
  matcher/        com.wavesplatform:wavesj:1.6.3 (new ticket needed)
  blockchain-postgres-sync/  zero Maven deps ✅
```

### DCC-237 Blocking Dependency Chain for DCC-252

DCC-260 and DCC-261 MUST complete before lang can publish a fully clean artifact. Until they ship:
- `io.decentralchain:lang_3` will depend on `com.wavesplatform:curve25519-java` and `com.wavesplatform:zwaves`
- This is documented in KNOWN_ISSUES.md — acceptable for the 1.6.2 release
- KNOWN_ISSUES cleared when DCC-260 and DCC-261 complete

---

## 13. New Ticket — `wavesj` Fork (DCC-263)

**Discovery from this analysis:** `Ecosystem/matcher/project/Dependencies.scala`:
```scala
val wavesJ = "com.wavesplatform" % "wavesj" % "1.6.3"
// TODO: fork to com.decentralchain:wavesj
```

`com.wavesplatform:wavesj` is the Waves Java SDK — separate from `Ecosystem/java-sdk/`. The matcher uses it for direct blockchain interactions (signing transactions, querying state). The upstream source is `github.com/wavesplatform/WavesJ`.

**Ticket created: [DCC-263](https://decentralchain.atlassian.net/browse/DCC-263)**

```
Summary:  Fork com.wavesplatform:wavesj → io.decentralchain:wavesj into packages/jvm/wavesj/
Type:     Task
Parent:   DCC-237 (Drop all com.wavesplatform Maven deps)
Assignee: Josué Rojas
Labels:   jvm, maven, dependency-fork
Estimate: 2 sprints (similar scope to java-sdk DCC-251)

Scope:
- Fork https://github.com/wavesplatform/WavesJ at tag 1.6.3
- Apply 4-phase quality pipeline (MIGRATE → BULLETPROOF → MODERNIZE → AUDIT)
- Rebrand namespace: com.wavesplatform.wavesj → com.decentralchain.wavesj
- Publish as io.decentralchain:wavesj:1.6.3 to Maven Central
- Update matcher/project/Dependencies.scala to io.decentralchain:wavesj

Blocks: matcher clean build under io.decentralchain namespace
```

---

## 14. Audit Findings Report Format

### Severity Definitions

| Level | Definition | SLA |
|-------|-----------|-----|
| CRITICAL | Could directly cause financial loss, fund theft, or key exposure | Fix before publish. No exceptions. |
| HIGH | Meaningful attack surface or security best practice violation | Fix before publish or document risk acceptance. |
| MEDIUM | Code quality issue that could cause bugs under edge conditions | Fix in current release if feasible; else Jira ticket. |
| LOW | Cosmetic, stylistic, or documentation issue | Fix when convenient. |
| INFO | No action required (e.g., wire-format names that cannot change) | Document for maintainers. |

### Final Litmus Test

NOT ready to publish until ALL exit 0:

```bash
sbt bulletproof                    # format + lint + coverage + all tests + Scala.js compile
sbt +publishLocal                  # full Maven artifact set
ls lang/js/dist/lang.js repl/js/dist/repl.js  # npm dist exists
# In CI: OWASP dep-check → no CVSS ≥7.0
# In CI: grep wavesplatform (non-exceptions) → zero results
# ride-js full test suite passes with @decentralchain/* imports
```

---

## 15. Risk Register

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|-----------|
| DCC-260 / DCC-261 not ready when DCC-252 ships | Medium | Medium | Ship with KNOWN_ISSUES.md — acceptable for 1.6.2 |
| ScalaPB alpha.3 breaks before release | Low | High | Pin exact; Renovate alerts on stable 1.0.0 |
| Scala.js 1.21.0 different output than 1.20.2 | Low | Medium | Test ride-js against new output before merging |
| Scalafmt 3.11.1 reformats Parser.scala | Low | Low | Verify `excludePaths` glob |
| Maven Central publishing fails (Central Portal) | Medium | High | sbt native `sonaRelease` (sbt ≥1.11, we use 1.12.11) — credentials via `SONATYPE_USERNAME`/`SONATYPE_PASSWORD` env vars |
| npm publish auth fails in CI | Low | High | Test `NODE_AUTH_TOKEN` with `--dry-run` first |
| ride-js tests break after @decentralchain/* import | Medium | Medium | Run ride-js full test suite (1227 tests) before merging |
| GPG key expires during CI | Low | Medium | 2-year expiry; calendar reminder 30 days before |
| scoverage 2.x `coverageMinimumStmtTotal` misconfigured | Medium | Medium | Verify with `sbt help coverageMinimumStmtTotal` |
| `git filter-repo` drops shared `project/` files | Medium | Low | Include all `project/` paths in `--path` arguments |
| RIDE script DoS via crafted FOLD<N> | Low | High | Verify limits enforced; add regression test at exactly limit |
| repl-jvm breaks after lang extraction | Medium | Medium | Run full node-scala test suite after switching to published artifact |

---

## 16. Definition of Done

### Phase 0 — MIGRATE
- [ ] `git filter-repo` extraction complete with full history (lang/ + repl/ together)
- [ ] `feat/DCC-252-lang-fork-standalone` branch in `Decentral-America/DecentralChain`
- [ ] Zero `com.wavesplatform.lang` in `.scala` files (verified by grep)
- [ ] KNOWN_ISSUES.md lists ONLY curve25519-java and zwaves — NOT blst-java (blst-java is node-only)
- [ ] Community files substantive: README, CHANGELOG, KNOWN_ISSUES
- [ ] `lefthook.yml` installed and intercepting commits
- [ ] `lang/js/package.json` and `repl/js/package.json` created (co-located with Scala.js source)
- [ ] `lang/js/build.sbt` and `repl/js/build.sbt` configure `artifactPath` to write directly to `dist/`

### Phase 1 — BULLETPROOF
- [ ] `sbt bulletproof` passes on clean checkout
- [ ] `.scalafmt.conf` at version 3.11.1
- [ ] `.scalafix.conf` with RemoveUnused + OrganizeImports + DisableSyntax
- [ ] Coverage gate ≥ 70% (`coverageMinimumStmtTotal := 70`)
- [ ] `sbt lang-js/fullOptJS repl-js/fullOptJS` exits 0

### Phase 2 — MODERNIZE
- [ ] `scalaVersion := "3.8.3"`
- [ ] sbt-scalajs `1.21.0`
- [ ] scalafmt `version = "3.11.1"`
- [ ] All four subprojects compile: lang-jvm, lang-js, repl-jvm, repl-js

### Phase 3 — AUDIT
- [ ] Phase A: `sbt evicted` clean; blst-java NOT in lang/repl dep trees; OWASP no CVSS ≥7.0
- [ ] Phase B: `sbt "scalafixAll --check"` exits 0; zero println in production code
- [ ] Phase C: Complexity limits tested; error messages safe; crypto input sizes bounded
- [ ] Phase D: Global ≥70% coverage; evaluator ≥80%; round-trip and determinism tests present
- [ ] Phase E: All CI jobs passing; Maven + npm artifact validation complete
- [ ] Phase F: Zero Waves remnants in non-exception files

### Publishing — Maven Central
- [ ] `sbt +publishLocal` succeeds (all Maven artifacts present)
- [ ] `lang-v1.6.2` tag pushed to `Decentral-America/DecentralChain`
- [ ] `sbt +publishSigned sonaRelease` succeeds
- [ ] `io.decentralchain:lang_3:1.6.2` visible at central.sonatype.com

### Publishing — npm
- [ ] `@decentralchain/ride-lang:1.6.2` published to npm
- [ ] `@decentralchain/ride-repl:1.6.2` published to npm
- [ ] GitHub Release `lang-v1.6.2` created with CHANGELOG + SBOM attached

### Integration
- [ ] node-scala `sbt node/compile` passes with `io.decentralchain:lang_3:1.6.2`
- [ ] node-scala `sbt repl-jvm/compile` passes with published artifact
- [ ] node-scala full test suite passes
- [ ] `packages/ride/ts` imports updated to `@decentralchain/*`
- [ ] `ride-js` full test suite passes (1227 tests) with new imports
- [ ] `java-sdk/pom.xml` updated to `io.decentralchain:lang_3:1.6.2`
- [ ] `java-sdk/CompilationUtil.java` imports updated to `com.decentralchain.lang.*`
- [ ] DCC-252 closed in Jira with release version
- [ ] DCC-237 epic progress updated

---

## 17. Implementation Sequence

```
Sprint 1 — Extract + Core Quality (Phase 0 + Phase 1 + Phase 2):
  feat/DCC-252-lang-fork-standalone branch in DecentralChain monorepo
  1. git filter-repo: extract lang/ + repl/ into packages/ride/ with full history
  2. Write new build.sbt (lang + repl + lang-testkit + lang-tests — NO node server subprojects)
  3. Verify DCC-147 complete (grep for com.wavesplatform.lang → must return zero)
  4. sbt scalafmtAll applied — dedicated commit: style(DCC-252): apply scalafmt 3.11.1
  5. sbt scalafixAll applied — dedicated commit: style(DCC-252): apply scalafix rules
  6. sbt bulletproof passes → green CI on feat branch
  7. Verify sbt lang-js/fullOptJS writes to lang/js/dist/lang.js and repl-js/fullOptJS writes to repl/js/dist/repl.js
  8. Nx project.json targets added

Sprint 2 — Audit + Publish (Phase 3 + Publishing):
  1. Run full Phase 3 audit (Phases A through F)
  2. Fix all findings or document in KNOWN_ISSUES / Jira tickets
  3. sbt +publishLocal → artifact validation (all jars present)
  4. Smoke test node-scala with local Maven artifact (sbt node/compile + test)
  5. First Maven Central publish: lang-v1.6.2 tag → sbt +publishSigned sonaRelease
  6. First npm publish: @decentralchain/ride-lang:1.6.2 + @decentralchain/ride-repl:1.6.2
  7. GitHub Release lang-v1.6.2 with SBOM

Sprint 3 — Integration:
  1. node-scala: switch lang from source dep to io.decentralchain:lang_3:1.6.2
  2. node-scala: update repl-jvm to consume published lang artifact
  3. java-sdk: update pom.xml + CompilationUtil.java imports
  4. packages/ride/ts: switch @waves/* → @decentralchain/* (1227 tests must pass)
  5. Full integration smoke test (node-scala compile + test + DCC testnet validation)
  6. DCC-252 closed ✅

Parallel (not blocked by DCC-252, coordinate timing):
  → DCC-260: curve25519-java fork (clears lang KNOWN_ISSUES)
  → DCC-261: zwaves fork (clears lang KNOWN_ISSUES)
  → NEW TICKET: wavesj fork (create from Section 13 spec)
```

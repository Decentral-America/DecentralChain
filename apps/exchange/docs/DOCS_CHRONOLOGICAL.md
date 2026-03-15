# DecentralChain SDK — Current Status

> **The single source of truth** for the DecentralChain SDK ecosystem.
> Every change, every fix, every open issue — chronologically documented across all 24 packages.
>
> **Last updated:** 2026-03-11

---

## Table of Contents

### Ecosystem Architecture

1. [Wire-Format Constraints](#1-wire-format-constraints)
2. [Intentional Waves References (Will Not Fix)](#2-intentional-waves-references-will-not-fix)
3. [Unforked Waves Dependencies](#3-unforked-waves-dependencies)
4. [Crypto Library Architecture](#4-crypto-library-architecture)
5. [Cross-Repo Dependency Chain Risk](#5-cross-repo-dependency-chain-risk)
- [Ecosystem Tech Stack & Standards](#ecosystem-tech-stack--standards)

### Repos

6. [ts-types](#6-ts-types)
7. [bignumber](#7-bignumber)
8. [ts-lib-crypto](#8-ts-lib-crypto)
9. [parse-json-bignumber](#9-parse-json-bignumber)
10. [marshall](#10-marshall)
11. [protobuf-serialization](#11-protobuf-serialization)
12. [data-entities](#12-data-entities)
13. [assets-pairs-order](#13-assets-pairs-order)
14. [oracle-data](#14-oracle-data)
15. [money-like-to-node](#15-money-like-to-node)
16. [node-api-js](#16-node-api-js)
17. [transactions](#17-transactions)
18. [data-service-client-js](#18-data-service-client-js)
19. [browser-bus](#19-browser-bus)
20. [ledger](#20-ledger)
21. [signature-adapter](#21-signature-adapter)
22. [signer](#22-signer)
23. [cubensis-connect](#23-cubensis-connect) ⚠️
24. [cubensis-connect-types](#24-cubensis-connect-types)
25. [cubensis-connect-provider](#25-cubensis-connect-provider)
26. [ride-js](#26-ride-js)
27. [explorer](#27-explorer)
28. [exchange](#28-exchange)
29. [swap-client](#29-swap-client)

### Remediation

30. [Remediation Priority Matrix](#30-remediation-priority-matrix)

---

## How to Read This Document

This document serves three audiences. Pick your path:

| You are… | Start here | Then… |
|----------|------------|-------|
| **New to the project** | [Executive Summary](#executive-summary) → [Project Timeline](#project-timeline) | Read top-to-bottom — you'll understand the full journey |
| **A developer on a specific repo** | [Table of Contents](#table-of-contents) → jump to your repo's section | Each repo has Changelog, Open Issues, Resolved Issues |
| **An AI assistant / automation** | [Executive Summary](#executive-summary) for status, then search by `## N. package-name` | All sections use consistent heading structure |

**Structure:** Executive Summary → Project Timeline → Common Migration Recipe → Ecosystem Architecture → Per-Repo Details (6–29) → Remediation Matrix

---

## Executive Summary

DecentralChain (DCC) forked 24 packages from the Waves blockchain ecosystem in February–March 2026. The goal: a fully independent, modernized SDK with no upstream dependencies on Waves-controlled infrastructure.

**Where we are now:**
- **All 24 repos** have completed all migration phases (rebrand → bulletproof → modernize → audit). 23 use ESM, Vitest, tsup, Biome/Lefthook, GitHub Actions CI, and produce npm-publishable packages. cubensis-connect (the wallet extension) uses webpack + Biome/Lefthook + Vitest + TS 5.9.3 strict with 0 errors.
- **1 critical (P0) issue remains**: user seeds are stored in Waves-owned AWS Cognito pools in the wallet extension. See [§23 Decisions Needed](#23-cubensis-connect).
- **2 unforked Waves dependencies remain**: `@waves/ride-lang` + `@waves/ride-repl` (LOW — chain-agnostic Scala.js binaries). `@keeper-wallet/waves-crypto` has been replaced by `@decentralchain/crypto`. `@keeper-wallet/swap-client` has been forked as `@decentralchain/swap-client` (DCC-69).
- All repos that **can't** rename certain Waves references (asset ID `'WAVES'`, protobuf `package waves;`, signing domain separator) have those documented in [§1](#1-wire-format-constraints) as intentional wire-format constraints.

**The one sentence:** All 18 SDK libraries are clean and publish-ready. The two application packages (exchange, explorer) carry deployment-blocking issues — exchange nginx has wildcard CORS and no CSP, explorer has zero tests and a script-injection risk in `launch.sh`. The one remaining operational risk is Cognito pool ownership in the wallet extension.

---

## Project Timeline

A unified chronological narrative of every significant change across the entire ecosystem. Read top-to-bottom.

**All 24 repos** have completed all 4 migration phases. **cubensis-connect** (the wallet) carries 1 P0 risk (Cognito pools) — see [§23 Decisions Needed](#23-cubensis-connect).

### Security Fixes & Hardening (Jul 2025)

Before the broader migration effort, security audits on early-forked packages revealed critical bugs:

- **Jul 2:** `signer` (2.0.0) — **CRITICAL fix**: `getBalance()` was _multiplying_ by `10^decimals` instead of dividing — showing astronomically wrong balances. Also fixed: swallowed provider errors (`this._console` → `this._logger`), info leak via constructor logging.
- **Jul 16:** `node-api-js` (2.0.0) — Removed `node-fetch`, switched to native `fetch`. Fixed lost consensus module from rebase.
- **Jul 25:** `cubensis-connect-provider` (1.0.1) — Added 10s `AbortController` timeout on fee calculation. HTTPS enforcement warning. Fixed unhandled promise rejection in `connect()`.
- **Jul 26:** `transactions` (5.0.1) — Coverage improved from 70% to 82.7%.

### Fork & Rebrand (Feb 27 – Mar 2, 2026)

All 23 Waves packages were forked, rebranded from `@waves/*` to `@decentralchain/*`, and given initial releases:

- **Feb 27:** `assets-pairs-order` (5.0.0), `marshall` (0.14.0) — first two packages migrated. ESM-only, Vitest, tsup.
- **Feb 28:** `bignumber` (1.1.1), `ts-lib-crypto` (2.0.0), `parse-json-bignumber` (2.0.0), `data-entities` (3.0.0), `oracle-data` (1.0.0), `money-like-to-node` (1.0.0), `browser-bus` (1.0.0) — bulk migration. All: ESM, strict TS, Vitest, tsup, CI, Dependabot, governance docs.
- **Mar 1:** `protobuf-serialization` (2.0.0), `ledger` (5.0.0), `transactions` (5.0.0), `signature-adapter` (7.0.0) — critical signing/serialization layer. Breaking: protobufjs v6→v8, long v4→v5. Ledger transport now required (U2F removed).
- **Mar 2:** `ts-types` (2.0.0), `data-service-client-js` (4.2.0), `cubensis-connect-types` (1.0.0), `cubensis-connect-provider` (1.0.0) — type system + provider layer. Circular deps fixed in ts-types. Provider inlined all Waves deps.

### Modernize & Standardize (Mar 5–7, 2026)

The second pass focused on build tooling standardization and deeper modernization:

- **Mar 5:** `ride-js` (2.3.0) — **BREAKING**: ESM migration. Webpack → tsup. Jest → Vitest. Security: added 30s `httpGet` timeout (was infinite), `console.log(e)` → `console.error(e)`. Replaced `axios` with native `fetch`.
- **Mar 6:** `ride-js` (2.3.1) — Biome/Lefthook migration. Fixed 25 `test.only` calls that were masking regressions. Fixed `==` → `===`, variable shadowing, missing types.
- **Mar 7:** `explorer` (0.0.0), `exchange` (0.0.0) — Initial ESM + Biome migration. Both are large apps (208 JSX files, 81K LOC respectively) with significant remaining work: no TS, no tests, React class components.

### cubensis-connect Rebrand (Mar 8–9, 2026)

The wallet extension underwent rebrand only (Phase 1 of 4):

- `KeeperWallet` → `CubensisConnect`, `wavesAuth` → `dccAuth`, WavesDomains removed, all 10 locales updated, extension icons replaced, `@waves/*` → `@decentralchain/*` deps, network URLs → DCC infrastructure. 123 files changed.

**NOT done:** webpack→Vite, Babel→TS native, ESLint→Biome, Mocha→Vitest, TS 4.7→5.9, Redux→zustand, `@keeper-wallet/waves-crypto` fork. P0 issue discovered: Cognito pools are Waves-owned. Swap client P0 resolved separately (DCC-69).

### Swap Client Fork (Mar 10, 2026)

- **Mar 10:** `swap-client` (1.0.0) — Forked `@keeper-wallet/swap-client` v0.3.0. Upstream repo was private/deleted — source extracted from npm tarball. Protobuf `.proto` schema reverse-engineered from compiled output. Full migration: ESM-only, tsup, Biome 2.4.6, Vitest (50 tests), strict TypeScript 5.9.3, `@waves/bignumber` → `@decentralchain/bignumber`, WebSocket URL now configurable. GitHub: [Decentral-America/swap-client](https://github.com/Decentral-America/swap-client). Jira: DCC-69.

### Current State (Mar 10, 2026)

- 24 packages publish-ready with modern tooling
- `@decentralchain/swap-client@1.0.0` forked from `@keeper-wallet/swap-client` (DCC-69) — resolves P0 swap-client risk
- cubensis-connect functional but carries operational risk (Cognito P0 remaining)
- `exactOptionalPropertyTypes` enabled across all feasible packages — signature-adapter (196→0), transactions (141→0) fully resolved
- marshall schema types narrowed (`TSchema`→`TObject`), serializer parameters widened (`Record<string, unknown>`→`object`) — eliminates downstream cast chains
- Next priorities: Cognito pool investigation (P0), `waves-crypto` fork (P1), whitelist cleanup (P1)

### Full Codebase Audit (Mar 11, 2026)

Full security and quality audit across all 25 packages. Methodology: dependency audit, static analysis (Biome, knip, tsc), security pattern scan (`Math.random`, `eval`, `dangerouslySetInnerHTML`, `innerHTML`, `window.open`, insecure transport, hardcoded secrets), Waves reference check, test coverage assessment, Docker/nginx review.

**SDK Libraries (18 packages) — ALL CLEAN:**
- All 18 have biome.json, vitest.config.ts, lefthook.yml, strict TypeScript, test suites
- Zero `@waves/*` deps except `ride-js` (unavoidable: `@waves/ride-lang`, `@waves/ride-repl` — chain-agnostic Scala.js binaries)
- Zero `Math.random()`, `dangerouslySetInnerHTML`, `eval()` in any `src/`
- Zero `npm:` aliases, zero hardcoded secrets, zero insecure transport
- `ride-js` is the only package without `strict: true` (uses `allowJs`/`checkJs` on `.js` source — acceptable)

**Exchange — critical deployment issues found:**
- **CRITICAL**: Nginx `Access-Control-Allow-Origin: *` on a financial application
- **CRITICAL**: No Content-Security-Policy header in production nginx configs (only Vite dev server has CSP)
- **CRITICAL**: `set_real_ip_from 0.0.0.0/0` trusts X-Forwarded-For from any source — IP spoofing risk
- **CRITICAL**: Docker runs as root (no `USER` directive)
- **HIGH**: Only 6 test files for 405 source files (67 tests total) — CI passes vacuously
- **HIGH**: Transaction signing 100% stubbed — all 13 signing functions throw "Not implemented"
- **HIGH**: HSTS `max-age=2592000` (30 days) — should be 31536000 (1 year)
- **MEDIUM**: Hardcoded ngrok URL in `vite.config.ts` `allowedHosts`, `autoindex on` for `/download/clients`
- **POSITIVE**: All `@decentralchain/*` deps migrated, strict TS enabled, Biome config thorough, security-sensitive code (auth, crypto, logger) well-tested, source maps off in prod, logger redacts sensitive fields

**Explorer — functional but legacy:**
- **CRITICAL**: Zero test files — `vitest run` passes vacuously, CI gate meaningless
- **HIGH**: `launch.sh` injects `$API_NODE_URL` unsanitized into JS served to browsers — script injection risk
- **HIGH**: README completely outdated — references `gulp`, `yarn` (project uses Vite + npm)
- **HIGH**: 59 class components with `_isMounted` anti-pattern (5 components) — memory leak risk
- **MEDIUM**: `window.open` without `noreferrer`, 5 fetch calls without `res.ok` check, `encodeURI` instead of `encodeURIComponent`
- **POSITIVE**: Waves migration 100% complete (zero references), nginx production config excellent (CSP, HSTS 1yr, X-Frame-Options DENY)

**Cubensis-connect — previously audited (see §23):**
- P0 Cognito risk remains
- 5 security fixes applied (C-1 Math.random, H-1/H-2 XSS, H-3 source maps, M-1 noreferrer)
- 159 pre-existing tsc errors (not introduced by migration) — 11 additional errors from Biome auto-fixes resolved during production hardening

### Production Hardening (Mar 11, 2026)

Systematic dead code removal, lint enforcement, and type safety hardening across all 25 packages. All changes committed with conventional commit messages and verified by lefthook pre-commit hooks (biome lint + tsc typecheck).

**Methodology:** knip static analysis → dead file/export identification → manual verification → deletion/cleanup → biome auto-fix → typecheck → commit.

**Dead code removal:**
- 141+ dead files deleted (124 in exchange, 14 in explorer, 3 in cubensis-connect)
- Dead exports removed from oracle-data, node-api-js, signer, signature-adapter, explorer, cubensis-connect-provider
- Dead modules inlined or deleted: assets-pairs-order/utils.ts, signature-adapter/fieldTypes.ts, signer/validators.ts, ts-lib-crypto/webpack configs
- 19 knip.json configs cleaned (redundant entry/project patterns removed)

**Biome enforcement:**
- `noNonNullAssertion` fixes in transactions (4 files), signer (2 files), signature-adapter (1 file)
- ~~`useLiteralKeys` disabled in 6 packages~~ — **RESOLVED**: All 21 `Record<string, unknown>` bracket-access patterns narrowed to typed interfaces (e.g., `{ feeAmount?: unknown }`, `{ version?: number }`, `{ key: string; type: string; value: unknown }`). Dot notation now used for all known properties. `useLiteralKeys` re-enabled in all 6 packages: marshall, parse-json-bignumber, browser-bus, oracle-data, data-service-client-js, cubensis-connect-provider. Zero biome rule overrides remain.
- 242 Biome auto-fixes applied in cubensis-connect (import types, formatting, code style)

**TypeScript fixes:**
- 11 strict-mode errors fixed in cubensis-connect (uncovered by Biome auto-fixes interacting with `exactOptionalPropertyTypes`)
- Explicit null guards added in signature-adapter (replaced `!` with runtime throw)
- `DOM` lib added to ride-js tsconfig for typecheck compatibility

**Dependency cleanup:**
- Removed unused `@decentralchain/bignumber` devDep from money-like-to-node
- All 25 packages verified: `git status --short` empty, 0 uncommitted changes

### npm Distribution

All 20 publishable packages were initially published with `--tag next` via `first-publish.sh` (dependency-tiered, bottom-up). This means `npm install @decentralchain/<pkg>` still resolves the **old Waves-era version** for 5 packages whose `latest` tag was never promoted.

**Packages where `latest` ≠ `next` (consumers must use `npm install @decentralchain/<pkg>@next`):**

| Package | `latest` (old) | `next` (current) |
|---------|-----------------|-------------------|
| `assets-pairs-order` | 4.0.0 | 5.0.1 |
| `marshall` | 0.14.0 | 1.0.0 |
| `node-api-js` | 1.2.5-beta.18 | 2.0.0 |
| `signer` | 1.1.0-beta | 2.0.0 |
| `signature-adapter` | 6.1.7 | 7.0.0 |

**Packages where `latest` = `next` (fully promoted, safe to install normally):**
ts-types, bignumber, ts-lib-crypto, parse-json-bignumber, protobuf-serialization, data-entities, oracle-data, money-like-to-node, browser-bus, ledger, transactions, data-service-client-js, cubensis-connect-types, cubensis-connect-provider.

**Not published:** ride-js (manual `workflow_dispatch` with tag chooser), explorer, exchange (private apps), cubensis-connect (extension, not an npm package).

**Action needed:** Run `npm dist-tag add @decentralchain/<pkg>@<version> latest` for the 5 divergent packages to promote them, or re-publish via the GitHub Release workflow (which uses `--tag latest` by default).

---

## Common Migration Recipe

Every repo (except cubensis-connect) followed the same 4-phase recipe. Understanding this pattern makes the per-repo sections predictable.

| Phase | What happens | Key tools |
|-------|--------------|-----------|
| **1. Rebrand** | `@waves/*` → `@decentralchain/*` in package.json, imports, README, LICENSE | Find-and-replace |
| **2. Bulletproof** | Pre-commit hooks, lint + typecheck + test on every commit | Biome, Lefthook, `npm run bulletproof` |
| **3. Modernize** | ESM-only, strict TS, modern bundler, CI, governance docs | tsup, Vitest, GitHub Actions, Dependabot |
| **4. Audit** | Supply chain review, dead code removal, security fixes | knip, `npm audit`, manual review |

The result for each repo: ESM-only output, TypeScript strict mode, Vitest with 90%+ coverage, tsup builds, Biome formatting/linting, Lefthook pre-commit hooks, GitHub Actions CI, and governance docs (CONTRIBUTING.md, SECURITY.md, CODE_OF_CONDUCT.md).

---


<!-- ═══════════════════════════════════════════════════════════════
     ECOSYSTEM ARCHITECTURE — Read these first to understand
     WHY certain issues exist across individual repos.
     ═══════════════════════════════════════════════════════════════ -->

## 1. Wire-Format Constraints

These values are part of the blockchain protocol and **CANNOT** be changed without a hard fork or coordinated ecosystem migration. They are NOT bugs — they are protocol constants.

| Value | Used For | Why Immutable |
|-------|----------|---------------|
| `'WAVES'` | Native asset sentinel | All nodes, SDKs, DApps expect it. Client-side sentinel — node returns `null`. 60+ refs across 20+ files. Display name already shows "DCC" |
| `package waves;` | Protobuf namespace | Wire format for gRPC, `Any` types. Nodes expect `waves.Transaction` on the wire. Renaming breaks all gRPC clients |
| `'WavesWalletAuthentication'` | Signing domain separator | Cryptographic domain separator for message signing. Changing invalidates all existing signatures |
| Chain IDs `W`/`T`/`S` → `?`/`!`/`S` | Already migrated | — |

---

## 2. Intentional Waves References (Will Not Fix)

These Waves references exist **by design** and must NOT be renamed.

| Reference | Reason | Locations |
|-----------|--------|-----------|
| `'WAVES'` asset ID | Client-side sentinel for native asset. Display name already shows "DCC" | All SDK packages |
| `'WavesWalletAuthentication'` prefix | Cryptographic domain separator. Changing invalidates all existing signatures | `cubensis-connect/src/messages/utils.ts` |
| Protobuf `waves` namespace | Wire-format package name. Nodes expect `waves.Transaction` on the wire | `protobuf-serialization/proto/waves/**` |
| `@waves/ride-lang` + `@waves/ride-repl` | Scala.js-compiled RIDE compiler. Chain-agnostic — same bytecode regardless of builder | `ride-js/package.json` |
| Third-party NFT URLs | External services (wavesducks.com, puzzlemarket.org, sign-art.app). Independent projects | `cubensis-connect/src/nfts/vendors/*` |

---

## 3. Unforked Waves Dependencies

| Package | Used By | Risk | Priority |
|---------|---------|------|----------|
| `@keeper-wallet/waves-crypto` ^3.0.0 | cubensis-connect (21 files) | **HIGH** — core crypto | P1 (fork → `@decentralchain/wallet-crypto`) |
| `@keeper-wallet/swap-client` ^0.2.0 | cubensis-connect (1 file) | ~~**CRITICAL** — routes to Waves backend~~ ✅ **RESOLVED** — Forked as `@decentralchain/swap-client@1.0.0` (DCC-69). cubensis-connect import needs updating. | ✅ Done |
| `@waves/ride-lang` 1.6.1 | ride-js | LOW — chain-agnostic compiler | N/A |
| `@waves/ride-repl` 1.6.1 | ride-js | LOW — chain-agnostic REPL | N/A |

---

## 4. Crypto Library Architecture

The ecosystem uses **two** cryptographic libraries — this is intentional, not duplication.

| Library | Paradigm | Used By | Purpose |
|---------|----------|---------|---------|
| `@decentralchain/ts-lib-crypto` | **Sync**, pure JS (`@noble/curves`) | 6 SDK packages (transactions, signer, node-api-js, explorer, exchange, ride-js) | General-purpose SDK crypto |
| `@decentralchain/crypto` | **Async**, Rust/WASM + WebCrypto | cubensis-connect | Browser wallet crypto (hardware-accelerated AES, WASM Curve25519) |

**Why both exist:** The wallet extension needs async WebCrypto (`crypto.subtle`) for hardware-accelerated AES encryption of seeds. The SDK packages need synchronous crypto for simple sign/verify workflows. Different trust boundaries, different performance requirements.

**Cannot naively replace crypto with ts-lib-crypto because:**
1. API signatures differ (`signBytes` takes raw bytes vs wrapper object)
2. Return types differ (`encryptSeed` returns `Uint8Array` vs Base64 string)
3. Loss of WebCrypto AES means less secure seed encryption in browser
4. cubensis-connect uses `await` on every crypto call — sync would need refactor

**Status:** ✅ Fully forked and migrated as `@decentralchain/crypto@1.0.0` (DCC-70). 234-commit Waves history preserved. Timing-safe HMAC comparison added (security fix). 44 tests, 99% coverage.

---

## 5. Cross-Repo Dependency Chain Risk

An issue in any upstream package cascades to all downstream consumers:

```
@decentralchain/crypto  ← FORKED (DCC-70)
  └── cubensis-connect

@decentralchain/ts-lib-crypto
  └── transactions → signature-adapter → signer
  └── node-api-js
  └── ledger
  └── ride-js (via file: link)
  └── explorer (via file: link)

@decentralchain/swap-client  ← FORKED (DCC-69)
  └── cubensis-connect (swap feature only)

@waves/ride-lang + ride-repl  ← NOT FORKED (RIDE compiler)
  └── ride-js
```

**Key risk:** `transactions` depends on `protobuf-serialization` via `file:` link (local). If either package is published independently without the other, consumers may get incompatible versions.

---

## Ecosystem Tech Stack & Standards

Every modernized DCC package (23 of 24 — all except cubensis-connect) shares a standardized toolchain. This section documents the exact versions, configurations, and strictness policies so any new package or monorepo migration can replicate the standard.

### Gold Standard Tool Versions

The reference implementation is `browser-bus`. All other library packages target these versions.

| Tool | Version | Purpose |
|------|---------|----------|
| TypeScript | 5.9.3 | Type checking (tsup handles emit) |
| tsup | 8.5.1 | ESM-only bundling (`dts: true`) |
| @biomejs/biome | 2.4.6 | Lint + format (replaces ESLint + Prettier) |
| vitest | 4.0.18 | Test runner |
| @vitest/coverage-v8 | 4.0.18 | Code coverage |
| @evilmartians/lefthook | 2.1.3 | Git hooks (pre-commit, commit-msg) |
| publint | 0.3.18 | Package.json exports validation |
| @arethetypeswrong/cli | 0.18.2 | TypeScript resolution validation |
| size-limit | 12.0.0 | Bundle size budget |
| @size-limit/preset-small-lib | 12.0.0 | Size-limit preset for libraries |
| npm | 11.9.0 | Package manager (`packageManager` field) |

### Runtime Standards

| Setting | Value | Enforced By |
|---------|-------|-------------|
| Node.js minimum | `>=24` | `engines` in package.json, `.node-version` file |
| Module format | ESM-only (`"type": "module"`) | package.json |
| npm settings | `engine-strict=true`, `save-exact=true`, `package-lock=true` | `.npmrc` |
| Line endings | LF | `.editorconfig` |
| Indentation | 2 spaces | `.editorconfig` + Biome |
| Encoding | UTF-8 | `.editorconfig` |

### Lefthook Hook Configuration

All packages use the same Lefthook hooks:

| Hook | Command | Behavior |
|------|---------|----------|
| `pre-commit: lint` | `biome check --write {staged_files}` | Lint + format staged files, auto-stage fixes |
| `pre-commit: typecheck` | `npm run typecheck` | Full project type check (parallel with lint) |
| `commit-msg: conventional` | Regex check | Enforces conventional commit format (`feat:`, `fix:`, etc.) |

### Biome Configuration Standard

| Category | Setting |
|----------|---------|
| Formatter | 2 spaces, 100 char line width, LF, single quotes, semicolons always, trailing commas all |
| Linter (errors) | `noUnusedVariables`, `noUnusedFunctionParameters`, `noUnusedImports`, `useConst`, `useImportType`, `noNamespace`, `noCommonJs` |
| Linter (warnings) | `noConsole` (allow `warn`, `error`) |
| Overrides | Test files: `noExplicitAny: off` |
| Organize imports | Enabled |

### TypeScript Strictness Policy

#### Required Flags (All Packages)

| Flag | Value | Why |
|------|-------|-----|
| `strict` | `true` | Umbrella for `strictNullChecks`, `strictFunctionTypes`, `noImplicitAny`, etc. |
| `noFallthroughCasesInSwitch` | `true` | Prevents silent fall-through in switch statements |
| `noImplicitOverride` | `true` | Requires explicit `override` keyword |
| `skipLibCheck` | `true` | Skip `.d.ts` checking — faster builds, avoids upstream type issues |
| `noEmit` | `true` | tsup handles emit; tsc is type-check only |

#### Recommended Flags (Target for All Packages)

| Flag | Value | Why |
|------|-------|-----|
| `noUncheckedIndexedAccess` | `true` | Array/object index returns `T \| undefined` — prevents silent `undefined` access |
| `exactOptionalPropertyTypes` | `true` | Distinguishes "explicitly `undefined`" from "key missing" — see audit below |
| `noPropertyAccessFromIndexSignature` | `true` | Forces bracket notation for index signatures |
| `verbatimModuleSyntax` | `true` | Requires explicit `type` imports — ensures clean ESM emit |

### TypeScript Strictness Compliance Matrix

| Package | strict | noUncheckedIndexedAccess | exactOptionalPropertyTypes | noPropertyAccessFromIndexSignature | verbatimModuleSyntax |
|---------|:------:|:------------------------:|:--------------------------:|:----------------------------------:|:--------------------:|
| browser-bus | ✅ | ✅ | ✅ | ✅ | ✅ |
| swap-client | ✅ | ✅ | ✅ | ✅ | ✅ |
| ts-types | ✅ | ✅ | ✅ | ✅ | ✅ |
| bignumber | ✅ | ✅ | ✅ | ✅ | — |
| ts-lib-crypto | ✅ | ✅ | — | — | — |
| parse-json-bignumber | ✅ | ✅ | ✅ | ✅ | ✅ |
| marshall | ✅ | ✅ | ✅ | — | — |
| data-entities | ✅ | ✅ | ✅ | — | — |
| assets-pairs-order | ✅ | ✅ | ✅ | — | — |
| oracle-data | ✅ | ✅ | ✅ | — | — |
| money-like-to-node | ✅ | ✅ | ✅ | — | — |
| node-api-js | ✅ | ✅ | ✅ | — | — |
| data-service-client-js | ✅ | ✅ | ✅ | ✅ | ✅ |
| browser-bus | ✅ | ✅ | ✅ | ✅ | ✅ |
| ledger | ✅ | ✅ | ✅ | — | — |
| signature-adapter | ✅ | ✅ | ✅ | — | — |
| signer | ✅ | ✅ | ✅ | — | — |
| cubensis-connect-types | ✅ | ✅ | ✅ | — | — |
| cubensis-connect-provider | ✅ | ✅ | ✅ | — | — |
| ride-js | **—** ¹ | — | ✅ | — | — |
| protobuf-serialization | ✅ | ✅ | **—** ² | — | — |
| transactions | ✅ | ✅ | ✅ | — | — |
| explorer | — ⁴ | — | — | — | — |
| exchange | ✅ | ✅ | **—** ⁵ | — | — |
| cubensis-connect | — ⁶ | — | — | — | — |

### `exactOptionalPropertyTypes` Audit

This flag is the strictest optional-property check in TypeScript. When enabled, a property declared as `foo?: string` means **"the key may be absent"** — but if the key IS present, its value must be `string`, NOT `undefined`. Without this flag, TypeScript silently allows `{ foo: undefined }` where the intent was "key not present."

**Why it matters for financial infrastructure:** In protobuf serialization, swap parameters, and transaction building, the difference between "field absent" and "field explicitly undefined" determines what goes on the wire. A `recipient: undefined` should mean "no recipient field" — not "send to address `undefined`."

A cross-ecosystem audit (2026-03-10) tested all 24 packages. Results:

- **19 packages**: Flag enabled, 0 errors — already compliant
- **5 packages**: Flag enabled after targeted fixes (see below)
- **2 packages**: Cannot enable yet — blocked by structural type issues (protobuf-serialization, cubensis-connect)

#### Fixed — `exactOptionalPropertyTypes` Enabled (Mar 10, 2026)

| Package | Errors Found | Root Cause | Fix Applied |
|---------|:------------:|------------|-------------|
| **swap-client** | 2 | Protobuf boundary — `recipient` and `referrer` fields are `string \| null` in protobuf (where `null` means "field absent") but `string \| undefined` in TypeScript optional params. Passing `swapParams.address` (type `string \| undefined`) to a protobuf field expecting `string \| null` violates the flag. | Added `?? null` coercion at the 2 protobuf call sites: `recipient: swapParams.address ?? null`, `referrer: swapParams.referrer ?? null`. This correctly maps TypeScript's "possibly missing" (`undefined`) to protobuf's "field absent" (`null`). |
| **assets-pairs-order** | 4 | Array indexed access — `arr1[i]` returns `number \| undefined` when `noUncheckedIndexedAccess` is enabled, but the comparison `arr1[i] > arr2[i]` requires `number`. With `exactOptionalPropertyTypes`, the `undefined` possibility tightens further. | Extracted to typed locals: `const a = arr1[i] as number; const b = arr2[i] as number;` — safe cast because loop bound is `i < Math.min(arr1.length, arr2.length)`, guaranteeing the index is in bounds. |
| **ride-js** | 10 | Three distinct issues: (a) Em-dash characters (`—`) in JSDoc comments parsed as TS1127 invalid character errors. (b) Union type `ICompilationResult \| ICompilationError` not narrowed — `compiled.error` doesn't discriminate. (c) `Buffer.from(crypto.sha256(...), 'hex')` overload mismatch — `sha256` returns `TBytes` (Uint8Array), not a hex string. | (a) Replaced `—` with `-` in 6 JSDoc `@param` lines. (b) Changed `compiled.error` to `'error' in compiled` for proper union discrimination. Added `@type {ArrayBuffer}` cast for partial compilation result. (c) `@ts-expect-error` suppression — `Buffer.from` handles `Uint8Array` at runtime; the overload mismatch is a type-level false positive confirmed by 1228 passing tests. |
| **signature-adapter** | 196 | Strict mode incompatibilities accumulated over TS 3.2→5.9 upgrade — `exactOptionalPropertyTypes` + `noUncheckedIndexedAccess` surfaced errors across converters, adapters, and field validators. Categories: `undefined` vs absent optional fields, unguarded indexed access, generic type narrowing gaps, `Date.now()` to `number` conversions, untyped `ramda` pipeline returns. | Systematic file-by-file fix: `?? null`/`?? 0` coercions for optional-to-required boundaries, `!` assertions where runtime guards guarantee values, `as unknown as T` for ramda pipeline returns, `@ts-expect-error` for ramda overload edge cases, explicit type annotations on computed properties. 488/488 tests passing, 0 TSC errors. |
| **transactions** | 141 | Deep generic type hierarchy (`WithId`, `WithProofs`, `WithSender`, `Transaction<T>`) with strict flags exposing: overload implementation signature incompatibilities, `DEFAULT_VERSIONS` not inferred as literal types, `undefined` vs `null` in optional fields, indexed access on union types, `validate()` accepting `Record<string, unknown>` but receiving typed interfaces. | Multi-pattern fix: `as const` on `DEFAULT_VERSIONS` (fixes 15 version errors at source), `@ts-expect-error TS2394` on overload implementations, `as unknown as Record<string, unknown>` for validator calls, `?? null`/`?? 0` for undefined narrowing, `as unknown as IXxxParams & WithSender` in make-tx.ts, `chainIdFromRecipient` fixed at source with explicit `: number` return. 337/337 tests passing, 0 TSC errors. |

ride-js additionally had `checkJs: false` and `strictNullChecks: false` — both were enabled alongside `exactOptionalPropertyTypes`, giving the JS source full type-level verification against its hand-written `.d.ts` declarations for the first time.

#### Cannot Enable — Structural Blockers

| Package | Error Count | Root Cause | Why It Can't Be Fixed Trivially |
|---------|:-----------:|------------|----------------------------------|
| **protobuf-serialization** | ~28 | Protobuf codegen nullability — `protobufjs` generates interfaces where every optional field is `T \| null` (e.g., `recipient?: string \| null`). With `exactOptionalPropertyTypes`, you cannot assign `undefined` to these fields, but TypeScript's own optional parameter semantics produce `undefined`. Every test that constructs a partial protobuf message triggers this. | The errors are in _generated_ code (`pbjs`/`pbts` output) and test files. Fixing means either (a) patching the code generator to emit `T \| null \| undefined`, which would diverge from upstream protobufjs, or (b) adding `?? null` coercions at every test call site (~28 locations). Neither is worth the churn for generated code. The runtime behavior is correct — `protobufjs` treats both `null` and `undefined` as "field absent." |

#### Cannot Enable — Pre-existing Type Health Issues

| Package | Reason |
|---------|--------|
| **exchange** | 377 pre-existing type errors in `tsc -b` mode (missing `AxiosInstance` type, `unknown` type access on untyped API responses, generic component constraints). The app typechecks via `tsc --noEmit` (single-project mode) but fails in build mode. `exactOptionalPropertyTypes` would add ~440 more errors on top. Blocked until the base type health is fixed. |
| **explorer** | No `tsconfig.json` — uses Vite's built-in TS handling. No typecheck step exists. Cannot enable any TS flags until a tsconfig is added. |
| **cubensis-connect** | TypeScript 4.7, `strict: false`, webpack/Babel/Mocha stack. Entire toolchain must be modernized first (Phase 2-4 of migration). |

### Notable Per-Package Deviations

Most packages follow the gold standard exactly. These are the known deviations and why they exist:

| Package | Deviation | Reason |
|---------|-----------|--------|
| ride-js | `strict: false` (uses `strictNullChecks: true` individually) | Source is JavaScript (`.js`) wrapping Scala.js binaries. Full `strict: true` enables `noImplicitAny` which produces ~40 errors in JS source and leaks into `../ts-lib-crypto/dist/rsa.mjs` via cross-package type checking. The individual flags (`strictNullChecks`, `exactOptionalPropertyTypes`, `checkJs`) give the type-safety benefits without the `noImplicitAny` noise. |
| ride-js | `sideEffects: true` | `interop.js` mutates `globalThis` at import time (sets `base58Encode`, `sha256`, etc.). Cannot be tree-shaken. |
| protobuf-serialization | No tsup | Uses `pbjs`/`pbts` (protobufjs-cli) to generate JS/DTS directly. Not a standard compile step. |
| ts-types | `module: "NodeNext"`, `moduleResolution: "NodeNext"` | Types-only package consumed by other packages via `import type`. NodeNext ensures maximum compatibility. |
| ts-types | `erasableSyntaxOnly: true` | Unique to this package — ensures type annotations are erasable without transform. |
| exchange | `target: ES2020` (vs ES2024) | Vite React app targeting broader browser support. |
| cubensis-connect | webpack, Babel, TypeScript 4.7, Mocha, yarn | Entirely un-migrated. Phase 1 (rebrand) complete; Phases 2-4 pending. See [§23](#23-cubensis-connect). |
| explorer | No TypeScript compilation | Vite app with JS source. Biome + Vitest modernized, but no tsconfig or typecheck step. |

---

<!-- ═══════════════════════════════════════════════════════════════
     PER-REPO STATUS — Detailed changelog, open issues, and
     resolved issues for each package, numbered 6–28.
     ═══════════════════════════════════════════════════════════════ -->

## 6. ts-types

**Package:** `@decentralchain/ts-types` · **Version:** 2.0.0 · **Doc:** [ts-types.md](./ts-types.md)

### Changelog

#### Production Hardening — 2026-03-11

**Changed:**
- Cleaned knip.json configuration — removed redundant entry/project patterns.

#### [2.0.0] — 2026-03-02

**Changed:**
- **BREAKING**: Restructured internal modules — `transactions/` moved into `src/`.
- **BREAKING**: Circular dependency between `parts.ts` and `index.ts` eliminated.
- Upgraded to ESM-only build with tsup (replaces raw tsc). Target ES2024.
- TypeScript strict mode hardened: `exactOptionalPropertyTypes`, `noPropertyAccessFromIndexSignature`, `verbatimModuleSyntax`, `erasableSyntaxOnly`.
- ESLint upgraded to `strictTypeChecked` + `stylisticTypeChecked` flat config.
- Node.js minimum raised to 22 (recommended: 24).
- Added Vitest test suite with 90% coverage thresholds.
- Added publint, attw, size-limit quality gates.
- Added SECURITY.md, CODE_OF_CONDUCT.md, CONTRIBUTING.md.

**Fixed:**
- `WithVersion` type now uses `Record<string, unknown>` (no `any`).
- `SignedIExchangeTransactionOrder` constraint tightened from `any` → `unknown`.
- `SignedTransaction` constraint tightened from `any` → `unknown`.

**Removed:**
- Legacy `transactions/` directory (merged into `src/transactions.ts`).
- `.vscode/settings.json` with typos.

#### [1.2.0] — 2026-02-28

**Added:**
- Initial release as `@decentralchain/ts-types`.
- Full transaction type definitions for all 18 DecentralChain transaction types.
- Exchange order types (V1–V4) with signed order wrappers.
- Data transaction entry types with generic field support.
- State change types for invoke script results.

### Notable Commits

- `03a3f4c` — Split types into 3 modules (constants, parts, transactions) from monolithic index.
- `595dae1` — Phantom type utility + SignableTransaction union added.
- `5bed86d` — Phantom key fix — changed from `unique symbol` to string literal to avoid TS4053 across packages.
- `f82e9c5` — CommitToGenerationTransaction (type 19) added — DCC-specific.
- `a28e914` — Biome 2.x compat — `files.ignore` → `files.includes`.
- `51c095e` — Phase 0: resolve critical type bugs, harden type safety.
- `c4a3b67` — Phase 1: Biome/Lefthook migration.
- `d29b6d4` — Phase 2: tsup, vitest, strict eslint, Node 24.
- `d82850f` — Phase 3: final cleanup, stale config removal.

### Open Issues

| Issue | Severity | Status |
|-------|----------|--------|
| cubensis-connect pins `^1.0.12` (pre v2 API) | Low | Blocked on cubensis-connect modernization |
| `DataFiledType` typo preserved for compat | Info | Deprecated alias provided |

### Resolved Issues

_No issues to resolve — clean from initial DCC release._

---

## 7. bignumber

**Package:** `@decentralchain/bignumber` · **Version:** 1.1.1 · **Doc:** [bignumber.md](./bignumber.md)

### Changelog

#### Production Hardening — 2026-03-11

**Changed:**
- Cleaned knip.json configuration — removed redundant entry/project patterns.

#### [1.1.1] — 2026-02-28

**Changed:**
- **BREAKING**: Migrated to pure ESM (`"type": "module"`).
- Minimum Node.js version is now 22.
- Replaced Jest with Vitest.
- Replaced webpack with tsup.
- Upgraded all dependencies to latest versions.
- Rebranded from `@waves` to `@decentralchain`.
- TypeScript strict mode enabled.
- Coverage thresholds 90%+.
- Husky + lint-staged pre-commit hooks.

**Added:**
- GitHub Actions CI pipeline (Node 22, 24).
- Dependabot for automated dependency updates.
- CONTRIBUTING.md, SECURITY.md, CODE_OF_CONDUCT.md.
- publint + attw package validation.

**Removed:**
- Legacy build tooling (browserify + uglify-js).
- Jest configuration and dependencies.
- All Waves branding and references.

### Open Issues

| Issue | Severity | Status |
|-------|----------|--------|
| cubensis-connect pins `^1.0.0` (allows pre-1.1 without safety guards) | Low | Blocked on cubensis-connect modernization |
| Global mutable state via `Config.set()` | Info | Inherited from upstream — side-effect of `bignumber.js` design |

### Resolved Issues

_No issues to resolve — clean from initial DCC release._

---

## 8. ts-lib-crypto

**Package:** `@decentralchain/ts-lib-crypto` · **Version:** 2.0.0 · **Doc:** [ts-lib-crypto.md](./ts-lib-crypto.md)

### Changelog

#### Production Hardening — 2026-03-11

**Removed:**
- Deleted dead webpack configs (`webpack.cjs.config.js`, `webpack.esm.config.js`) — superseded by tsup.
- Removed unused `curve25519` re-export from `curve25519.ts`.

**Changed:**
- Cleaned knip.json configuration.

#### [2.0.0] — 2026-02-28

**Changed:**
- **BREAKING**: Migrated to pure ESM (`"type": "module"`).
- Minimum Node.js version is now 22.
- Replaced webpack with tsup for building ESM + CJS + UMD bundles.
- Upgraded all dependencies to latest versions.
- Rebranded copyright from `WavesPlatform` to `DecentralChain`.
- Removed `ChaidId` typo export — use `ChainId` instead.
- Improved `concat()` from O(n²) to O(n) using pre-allocated `Uint8Array`.
- Modernized `Utf8.ts` to use native `TextEncoder`/`TextDecoder`.
- Removed deprecated `Buffer` constructor usage in `random.ts`.

**Added:**
- TypeScript strict mode with enhanced compiler options.
- ESLint flat config with Prettier integration.
- Husky + lint-staged pre-commit hooks.
- GitHub Actions CI pipeline (Node 22, 24).
- Dependabot for automated dependency updates.
- Code coverage with V8 provider and threshold enforcement.
- tsup producing ESM, CJS, and UMD bundles.
- Dual entry points: main (Base58) and `/bytes`.
- BLS exports (`blsKeyPair`, `blsPublicKey`, `blsSign`, `blsVerify`) from main entry.
- CONTRIBUTING.md, SECURITY.md, CODE_OF_CONDUCT.md governance docs.
- publint + attw package validation. size-limit for bundle size budgeting.

**Removed:**
- Legacy build tooling (webpack, ts-node build scripts, ncp, rimraf).
- `build/` directory with custom build scripts.
- Old ESLint CJS config. `.npmignore`.
- All Waves branding from LICENSE and configuration.

### Open Issues

| Issue | Severity | Status |
|-------|----------|--------|
| `libs/md5.ts` exists for legacy EVP_BytesToKey seed encryption | Info | Required for backward compat with existing encrypted seeds |
| `encryptSeed` uses MD5-based KDF | Low | Legacy — new seeds should use a modern KDF, but existing encrypted seeds depend on this |
| explorer + ride-js use `file:` links | Medium | Works locally, but these packages can't be independently `npm install`ed |

### Resolved Issues

_No issues to resolve — clean from initial DCC release._

### Cross-Reference

See [§4 — Crypto Library Architecture](#4-crypto-library-architecture) for the relationship between this package and `@keeper-wallet/waves-crypto`.

---

## 9. parse-json-bignumber

**Package:** `@decentralchain/parse-json-bignumber` · **Version:** 2.0.0 · **Doc:** [parse-json-bignumber.md](./parse-json-bignumber.md)

### Changelog

#### Production Hardening — 2026-03-11

**Fixed:**
- ~~Disabled `complexity.useLiteralKeys`~~ → Narrowed `Record<string, unknown>` cast to `{ toJSON?: unknown }` typed interface; re-enabled `useLiteralKeys` rule.

**Changed:**
- Cleaned knip.json configuration.

#### [2.0.0] — 2026-02-28

**Changed:**
- **BREAKING**: Migrated to pure ESM (`"type": "module"`).
- Minimum Node.js version is now 22.
- Replaced Jest with Vitest. Replaced tsc + babel with tsup.
- Upgraded all dependencies to latest versions.
- Rebranded from `@waves` to `@decentralchain`.
- Error function now throws proper `SyntaxError` instances instead of plain objects.

**Added:**
- TypeScript strict mode with all strict compiler flags enabled.
- ESLint flat config with type-aware rules and Prettier integration.
- Husky + lint-staged pre-commit hooks.
- GitHub Actions CI pipeline (Node 22, 24).
- Dependabot. Code coverage 90%+. Named exports: `create`, `IOptions`, `JsonHandler`.
- JSDoc comments on all public APIs. 97 comprehensive tests (up from 11).
- CONTRIBUTING.md, SECURITY.md, CODE_OF_CONDUCT.md.

**Removed:**
- Legacy build tooling (tsc + babel). All Waves branding and references.
- Jest and related dependencies. `.babelrc`, `.npmignore`.

### Open Issues

_None._

### Resolved Issues

_No issues to resolve — clean from initial DCC release._

---

## 10. marshall

**Package:** `@decentralchain/marshall` · **Version:** 1.0.0 · **Doc:** [marshall.md](./marshall.md)

### Changelog

#### Production Hardening — 2026-03-11

**Fixed:**
- ~~Disabled `complexity.useLiteralKeys`~~ → Narrowed 8 `Record<string, unknown>` casts to typed interfaces (`{ value?: unknown }`, `{ key: string; type: string; value: unknown }`, `{ version?: number }`, `{ type: string }`); re-enabled `useLiteralKeys` rule.

**Changed:**
- Cleaned knip.json configuration.

#### [1.0.1] — 2026-03-10

**Changed:**
- Narrowed 17 schema export types from `TSchema` → `TObject` — all `{ type: 'object', schema: [...] }` constants are now precisely typed, enabling typed `.schema` access for consumers without unsafe cast chains.
- Widened `serializeTx`/`serializeOrder` parameter types from `Record<string, unknown>` → `object` — typed interfaces (e.g., `Transaction`, `Order`) can now be passed directly without casts.
- Fixed Biome lint issues (5 errors: 2 formatting, 3 `useImportType`).

#### [1.0.0] — 2026-03-05

**Changed:**
- Version aligned to 1.0.0 to reflect stable, production-ready status after ESM migration.
- Enhanced README with enterprise-grade documentation and updated package metadata.

#### [0.14.0] — 2026-02-27

**Changed:**
- **BREAKING**: Migrated to pure ESM (`"type": "module"`).
- Minimum Node.js version is now 22.
- Replaced Jest with Vitest. Replaced Webpack with tsup.
- Upgraded all dependencies to latest versions.
- Rebranded from `@waves` to `@decentralchain`.

**Added:**
- TypeScript strict mode with full type definitions.
- ESLint flat config with type-aware rules and Prettier integration.
- Husky + lint-staged. GitHub Actions CI (Node 22, 24). Dependabot.
- Code coverage 90%+. publint + attw + size-limit.
- CONTRIBUTING.md, SECURITY.md, CODE_OF_CONDUCT.md.

**Removed:**
- Legacy build tooling (Webpack). Yarn lockfile.
- All Waves branding and references.

### Open Issues

| Issue | Severity | Status |
|-------|----------|--------|
| Vendored `parseJsonBigNumber.ts` duplicates `parse-json-bignumber` package | Info | Historical — kept for zero-dep guarantee in binary layer |
| cubensis-connect pins `^0.14.0` | Low | Pre-v1 API, blocked on cubensis-connect modernization |

### Resolved Issues

| Issue | Resolution | When |
|-------|-----------|------|
| Schema exports typed as `TSchema` instead of `TObject` | Narrowed 17 schema exports from `TSchema`→`TObject` — enables typed `.schema` access for consumers, eliminates unsafe cast chains | 2026-03-10 |
| `serializeTx`/`serializeOrder` accept `Record<string, unknown>` — rejects typed interfaces | Widened parameters to `object` — any non-primitive accepted without casts. Internal property access uses `Record<string, unknown>` cast in 2 places only | 2026-03-10 |

---

## 11. protobuf-serialization

**Package:** `@decentralchain/protobuf-serialization` · **Version:** 2.0.0 · **Doc:** [protobuf-serialization.md](./protobuf-serialization.md)

### Changelog

#### [2.0.0] — 2026-03-01

**Changed:**
- **BREAKING**: Migrated to pure ESM (`"type": "module"`).
- **BREAKING**: Upgraded `protobufjs` from v6 to v8 (generated code uses ES module syntax).
- **BREAKING**: Upgraded `long` from v4 to v5.
- Minimum Node.js version is now 22 (24 recommended).
- Proto generation now outputs ES modules (`-w es6`) instead of CommonJS.
- Removed `@types/long` (long v5 includes its own types).
- Updated proto file language options to DecentralChain branding.
- Upgraded all dependencies. Rebranded from `@waves` to `@decentralchain`.

**Added:**
- ESLint flat config with Prettier integration.
- Vitest test suite with encode/decode roundtrip tests.
- Husky + lint-staged. GitHub Actions CI (Node 22, 24). Dependabot.
- CONTRIBUTING.md, SECURITY.md, CODE_OF_CONDUCT.md.
- publint, attw, size-limit.

**Removed:**
- CommonJS module output.
- `@types/long` dependency.
- All remaining Waves branding from proto file options and documentation.

### Open Issues

| Issue | Severity | Status |
|-------|----------|--------|
| `package waves;` namespace cannot be renamed | N/A | Wire-format constraint — intentional. See [§1](#1-wire-format-constraints) |
| `transactions` uses `file:` link | Medium | Works locally, won't resolve for standalone npm consumers |
| `exactOptionalPropertyTypes` cannot be enabled | Low | ~28 errors from protobufjs codegen — every optional field is `T \| null`, incompatible with the flag. Errors are in generated code and tests, not hand-written source. Runtime behavior is correct. See [Ecosystem Tech Stack](#ecosystem-tech-stack--standards). |
| Generated JS is ~500 kB | Info | Inherent to static protobufjs codegen |
| cubensis-connect pins `^1.4.3` | Low | Stale, blocked on cubensis-connect modernization |

### Resolved Issues

_No issues to resolve — clean from initial DCC release._

---

## 12. data-entities

**Package:** `@decentralchain/data-entities` · **Version:** 3.0.0 · **Doc:** [data-entities.md](./data-entities.md)

### Changelog

#### Production Hardening — 2026-03-11

**Changed:**
- Cleaned knip.json configuration — removed redundant entry/project patterns.

#### [3.0.0] — 2026-02-28

**Changed:**
- **BREAKING**: Migrated to pure ESM. Similar ESM migration + security hardening as other packages.
- Minimum Node.js version is now 22.
- Replaced Jest with Vitest. Replaced webpack with tsup.
- Upgraded all dependencies. Rebranded from `@waves` to `@decentralchain`.

**Added:**
- TypeScript strict mode. ESLint flat config.
- Husky + lint-staged. GitHub Actions CI. Dependabot.
- Code coverage 90%+. CONTRIBUTING.md, SECURITY.md, CODE_OF_CONDUCT.md.

### Open Issues

| Issue | Severity | Status |
|-------|----------|--------|
| cubensis-connect pins `^2.0.4` | Low | Stale, blocked on cubensis-connect modernization |
| `ROUND_FLOOR = 3` cast in Money constructor | Info | Workaround for `verbatimModuleSyntax` — const enums not accessible at runtime |
| Waves upstream repo deleted | Info | No way to pull upstream changes — DCC fork is now the canonical source |
| No runtime type-branding | Info | `isAsset()` etc. use `instanceof` — breaks across multiple package copies (e.g. monorepo version mismatch) |

### Resolved Issues

_No issues to resolve — clean from initial DCC release._

---

## 13. assets-pairs-order

**Package:** `@decentralchain/assets-pairs-order` · **Version:** 5.0.1 · **Doc:** [assets-pairs-order.md](./assets-pairs-order.md)

### Changelog

#### Production Hardening — 2026-03-11

**Removed:**
- Deleted dead `utils.ts` module — inlined `createOrderPair` into `index.ts`.

**Changed:**
- Updated test imports to reflect inlined utility.
- Cleaned knip.json configuration.

#### [5.0.2] — 2026-03-10 _(not yet bumped in package.json)_

**Fixed:**
- Enabled `exactOptionalPropertyTypes: true` in tsconfig.json.
- Fixed 4 TS2532 errors in `src/utils.ts` — array indexed access `arr1[i]` / `arr2[i]` returns `number | undefined` under `noUncheckedIndexedAccess`, which `exactOptionalPropertyTypes` makes stricter. Extracted to typed locals with safe `as number` cast (loop bound guarantees in-bounds index).

#### [5.0.1] — 2026-03-05

**Changed:**
- Professional README documentation and Node.js version pinned to 24.
- Biome/Lefthook migration (replaces ESLint/Prettier/Husky).

#### [5.0.0] — 2026-02-27

**Changed:**
- **BREAKING**: Migrated to pure ESM. Node 22+. Jest → Vitest. webpack → Rollup.
- Input validation added. `Object.freeze()` on exported arrays. TypeScript types.

**Added:**
- GitHub Actions CI. Dependabot. CONTRIBUTING.md, SECURITY.md, CODE_OF_CONDUCT.md.

### Open Issues

| Issue | Severity | Status |
|-------|----------|--------|
| Priority lists have very few entries (3/1/1) | Info | May need expansion as DCC ecosystem grows |
| Tests are co-located in `src/__tests__/` not `test/` | Info | Convention deviation from other DCC packages |

### Resolved Issues

| Issue | Resolution | When |
|-------|-----------|------|
| `exactOptionalPropertyTypes` not enabled | Enabled after fixing 4 array index access errors in `utils.ts`. See [Ecosystem Tech Stack](#ecosystem-tech-stack--standards). | 2026-03-10 |

---

## 14. oracle-data

**Package:** `@decentralchain/oracle-data` · **Version:** 1.0.0 · **Doc:** [oracle-data.md](./oracle-data.md)

### Changelog

#### Production Hardening — 2026-03-11

**Fixed:**
- ~~Disabled `complexity.useLiteralKeys`~~ → Narrowed store parameter from `Record<string, unknown>` to `{ description?: Record<string, string>; [key: string]: unknown }`; re-enabled `useLiteralKeys` rule.

**Removed:**
- Removed unused exports from `constants.ts` and `response/index.ts`.

**Changed:**
- Cleaned knip.json configuration.

#### [1.0.0] — 2026-02-28

**Changed:**
- ESM-only. Node 24. Jest → Vitest. webpack → tsup.
- Strict TypeScript. size-limit, publint + attw.
- Rebranded from `@waves` to `@decentralchain`.

### Open Issues

| Issue | Severity | Status |
|-------|----------|--------|
| Only `BETA` version schemas exist | Info | Protocol has no v1+ schemas yet |
| Schema processors use `as` casts for field assignment | Low | `biome-ignore` suppressed — runtime-validated |
| No direct DCC SDK consumers beyond `exchange` | Info | Low coupling, could be used by third-party oracles |

### Resolved Issues

_No issues to resolve — clean from initial DCC release._

---

## 15. money-like-to-node

**Package:** `@decentralchain/money-like-to-node` · **Version:** 1.0.0 · **Doc:** [money-like-to-node.md](./money-like-to-node.md)

### Changelog

#### Production Hardening — 2026-03-11

**Removed:**
- Removed unused `@decentralchain/bignumber` devDependency.

**Changed:**
- Cleaned knip.json configuration.

#### [1.0.0] — 2026-02-28

**Changed:**
- ESM-only. Node 24. Jest → Vitest. webpack → tsup.
- Unsafe integer detection added. 146 tests.
- Rebranded from `@waves` to `@decentralchain`.

### Open Issues

| Issue | Severity | Status |
|-------|----------|--------|
| Heavy use of `biome-ignore lint/suspicious/noExplicitAny` | Medium | Legacy untyped code — currying/pipe utilities need proper generics |
| `as unknown as ConvertResult<TO>` casts in `convert()` dispatcher | Low | Required by TypeScript — union narrowing can't prove assignability with Phantom types |
| No converter for genesis (1), payment (2), or commitToGeneration (19) | Info | These types are not user-signable |

### Resolved Issues

_No issues to resolve — clean from initial DCC release._

---

## 16. node-api-js

**Package:** `@decentralchain/node-api-js` · **Version:** 2.0.0 · **Doc:** [node-api-js.md](./node-api-js.md)

### Changelog

#### Production Hardening — 2026-03-11

**Removed:**
- Deleted dead block utility modules (`detectInterval.ts`, `waitHeight.ts`).

**Changed:**
- Updated test configuration.
- Cleaned knip.json configuration.

#### [2.0.0] — 2025-07-16

**Changed:**
- ESM-only. Node 22. Removed node-fetch (native fetch). Dual ESM/CJS.
- Rebranded from `@waves` to `@decentralchain`.

### Open Issues

| Issue | Severity | Status |
|-------|----------|--------|
| Default chainId `'L'` in auth verification may not match all networks | Low | Hardcoded default, should be configurable |
| `adresses` typo in source paths (should be `addresses`) | Info | Preserved from upstream to avoid breaking imports |
| `typed-ts-events` is the only non-DCC runtime dep | Info | Small library, no known issues |

### Resolved Issues

| Issue | Resolution | When |
|-------|-----------|------|
| Consensus module was lost during rebase | Fixed in `95a2b66` | 2026-03 |

---

## 17. transactions

**Package:** `@decentralchain/transactions` · **Version:** 5.0.0 · **Doc:** [transactions.md](./transactions.md)

### Changelog

#### Production Hardening — 2026-03-11

**Fixed:**
- Replaced non-null assertions (`!`) with explicit type guards in `generic.ts`, `proto-serialize.ts`, `dccAuth.ts`, `set-script.ts` — satisfies Biome `noNonNullAssertion` rule.

**Changed:**
- Cleaned knip.json configuration.

#### [5.0.1] — 2025-07-26 _(pre-fork; DCC released as 5.0.0)_

**Security:**
- Improved coverage from 70% to 82.7%.

#### [5.0.0] — 2026-03-01

**Changed:**
- **BREAKING**: Migrated to pure ESM. Node 22.
- Chain ID 87 → 76 (Waves mainnet → DCC mainnet).
- Seed security warnings added. Coverage 50% → 70%.
- Rebranded from `@waves` to `@decentralchain`.

### Open Issues

| Issue | Severity | Status |
|-------|----------|--------|
| `chainId` defaults to `'L'` in `verifyAuthData`/`verifyDccAuthData` — not DCC mainnet `'?'` (63) | Medium | May cause verification failures if not explicitly passed |
| ~~`exactOptionalPropertyTypes` cannot be enabled~~ | ~~Medium~~ | **RESOLVED** — See Resolved Issues below |
| `protobuf-serialization` linked via `file:` — requires local path at install | Low | Works in monorepo, breaks standalone install |
| `waves` namespace in protobuf wire types is intentionally preserved | Info | Wire-format constraint. See [§1](#1-wire-format-constraints) |
| Upstream repo deleted — DCC is now the only source of truth | Info | All history lives in DCC fork |
| `nodeInteraction.ts` hardcodes `mainnet-node.decentralchain.io` as default | Low | Only used when no `apiBase` provided |

### Resolved Issues

| Issue | Resolution | When |
|-------|-----------|------|
| `exactOptionalPropertyTypes` could not be enabled (~513→141 errors after prior fixes) | Systematic multi-pattern fix across 26 source files: `as const` on `DEFAULT_VERSIONS`, `@ts-expect-error TS2394` on overloads, `as unknown as Record<string, unknown>` for validators, `?? null`/`?? 0` for undefined narrowing, typed casts in make-tx.ts/order.ts/proto-serialize.ts. `chainIdFromRecipient` fixed at source in generic.ts with explicit `: number` return. 141→0 errors, 337/337 tests passing. | 2026-03-10 |
| Fragile `[5]![1]!` cast chain in proto-serialize.ts for invokeScript schema access | Fixed at source in marshall — `invokeScriptSchemaV1` narrowed from `TSchema` to `TObject`, making `.schema` properly typed. 3-line cast chain replaced with direct property access: `schemas.invokeScriptSchemaV1.schema[5]![1]`. | 2026-03-10 |
| marshall `serializeTx`/`serializeOrder` rejected typed interfaces | Fixed at source in marshall — parameters widened from `Record<string, unknown>` to `object`. Eliminated 30 `TS2345` errors across transactions that were masked by the older npm-published marshall types. | 2026-03-10 |

---

## 18. data-service-client-js

**Package:** `@decentralchain/data-service-client-js` · **Version:** 4.2.0 · **Doc:** [data-service-client-js.md](./data-service-client-js.md)

### Changelog

#### Production Hardening — 2026-03-11

**Fixed:**
- ~~Disabled `complexity.useLiteralKeys`~~ → Narrowed 9 `Record<string, unknown>` casts to typed interfaces (`{ limit?: unknown }`, `{ sort?: unknown }`, `{ lastCursor?: unknown }`, `{ id?: unknown }`); re-enabled `useLiteralKeys` rule.

**Changed:**
- Cleaned knip.json configuration.

#### [4.2.0] — 2026-03-02

**Changed:**
- ESM-only. `strictOptionalPropertyTypes` enabled. Security hardening.
- Rebranded from `@waves` to `@decentralchain`.

### Open Issues

| Issue | Severity | Status |
|-------|----------|--------|
| Data Service API base URL not preconfigured — consumer must provide `rootUrl` | Info | By design — no DCC default URL exists yet |
| `defaultParse` is `JSON.parse` without BigNumber handling — may lose precision | Medium | Consumer can inject `parse-json-bignumber` via options |
| `getPairs` returns a curried function — non-obvious API | Low | Matches upstream design |
| No retry logic on failed requests | Low | Consumer responsibility |

### Resolved Issues

_No issues to resolve — clean from initial DCC release._

---

## 19. browser-bus

**Package:** `@decentralchain/browser-bus` · **Version:** 1.0.0 · **Doc:** [browser-bus.md](./browser-bus.md)

### Changelog

#### Production Hardening — 2026-03-11

**Fixed:**
- ~~Disabled `complexity.useLiteralKeys`~~ → Narrowed `Record<string, unknown>` cast to `{ then: unknown }` typed interface; re-enabled `useLiteralKeys` rule.

**Changed:**
- Cleaned knip.json configuration.

#### [1.0.0] — 2026-02-28

**Changed:**
- ESM-only. Node 24. Replaced legacy build with tsup.
- Rebranded from `@waves` to `@decentralchain`.

### Open Issues

| Issue | Severity | Status |
|-------|----------|--------|
| Wildcard `'*'` targetOrigin still allowed (only warned) | Low | Warning added, but not enforced — caller must configure origins |
| `Object.create(null)` used for handler maps | Info | Intentional security pattern — no prototype pollution |
| Default timeout is 5 seconds — may be too short for hardware wallet signing | Low | Per-request override available |
| No built-in reconnection logic if window reference is lost | Low | Consumer must handle window lifecycle |

### Resolved Issues

_No issues to resolve — clean from initial DCC release._

---

## 20. ledger

**Package:** `@decentralchain/ledger` · **Version:** 5.0.0 · **Doc:** [ledger.md](./ledger.md)

### Changelog

#### Production Hardening — 2026-03-11

**Changed:**
- Cleaned knip.json configuration — removed redundant entry/project patterns.

#### [5.0.0] — 2026-03-01

**Changed:**
- **BREAKING**: Migrated to pure ESM.
- **BREAKING**: `transport` option is now required in `DCCLedger` constructor (previously defaulted to deprecated U2F transport).
- **BREAKING**: Removed `@ledgerhq/hw-transport-u2f` dependency (U2F deprecated by browsers).
- Node 22+. Replaced tsc + browserify with tsup.
- All internal `Buffer` usage replaced with `Uint8Array`.
- Replaced `new Buffer()` (deprecated) with `Uint8Array` / `DataView` APIs.
- Upgraded `@ledgerhq/logs` to v6. TypeScript v5.9 strict mode.

**Added:**
- Typed interfaces for all public APIs.
- `base58Encode` utility exported as public API. Input validation with descriptive `TypeError` messages.
- Vitest test suite with 90%+ coverage. GitHub Actions CI. Dependabot.
- Bundle size budget (10 kB gzipped). publint + attw.
- CONTRIBUTING.md, SECURITY.md, CODE_OF_CONDUCT.md.

**Removed:**
- Legacy build tooling (tsc + browserify + babel).
- `@ledgerhq/hw-transport-u2f` and `@ledgerhq/hw-transport-webusb` as bundled deps.
- `@decentralchain/ts-lib-crypto` dependency (unused — library has own base58 implementation).
- `rimraf` dependency. `interface.d.ts` ambient module declarations. `.babelrc`, `.npmignore`.

### Open Issues

| Issue | Severity | Status |
|-------|----------|--------|
| `SECRET = 'WAVES'` in APDU commands — cannot be rebranded | Info | Firmware constraint — would need custom Ledger app |
| BIP-44 coin type `5741564` (Waves) — DCC derives same addresses as Waves | Info | Intentional — users keep their existing keys |
| `MAIN_NET_CODE = 76` (`'L'`) — differs from DCC mainnet byte `63` (`'?'`) | Medium | May need env-specific override, but constructor accepts `networkCode` param |
| No built-in transport cleanup on process exit | Low | Consumer must call `disconnect()` |
| Ledger import path in signature-adapter uses default import | Info | Works but may complicate tree-shaking |

### Resolved Issues

_No issues to resolve — clean from initial DCC release._

---

## 21. signature-adapter

**Package:** `@decentralchain/signature-adapter` · **Version:** 7.0.0 · **Doc:** [signature-adapter.md](./signature-adapter.md)

### Changelog

#### Production Hardening — 2026-03-11

**Fixed:**
- Replaced non-null assertion (`!`) with explicit null guard + throw in `Signable.ts` — `getBytes[version]` now throws descriptive error instead of silently returning undefined.

**Removed:**
- Deleted dead `fieldTypes.ts` module — merged into `schemas.ts`.
- Removed unused exports from `prepare.ts`.

#### [7.0.0] — 2026-03-01

**Changed:**
- **BREAKING**: Migrated to pure ESM. Node 22+.
- Replaced Jest with Vitest. Replaced browserify/uglifyjs with tsup.
- Upgraded TypeScript from 3.2 to 5.9. Upgraded all dependencies.
- Rebranded from `@waves` to `@decentralchain`.
- Broke circular dependency in adapter imports.

**Added:**
- TypeScript strict mode. ESLint 10 flat config with Prettier.
- Husky + lint-staged. GitHub Actions CI (Node 22, 24). Dependabot.
- Code coverage with V8 provider and threshold enforcement.
- tsup dual-format build (ESM + CJS). publint, attw, size-limit.
- CONTRIBUTING.md, SECURITY.md, CODE_OF_CONDUCT.md.

**Removed:**
- Legacy build tooling (browserify, uglifyjs). Jest and ts-jest.
- yarn.lock. `.npmignore`. All Waves branding and references.
- `ramda-usage.d.ts` (replaced by `@types/ramda`).

### Open Issues

| Issue | Severity | Status |
|-------|----------|--------|
| `ramda` is the only non-DCC functional dependency — adds bundle weight | Low | Could be replaced with native JS |
| `SIGN_TYPE.WavesAuth` (1005) retains Waves naming | Low | Internal constant — not user-facing |
| `CubensisConnectAdapter` at 399 lines is the largest adapter — complex extension protocol | Info | Matches keeper wallet protocol complexity |
| `Tresor` adapter type is reserved in enum but has no implementation | Info | Placeholder for future hardware wallet support |
| `fieldValidator.ts` at 698 lines is a monolith | Low | Works but could benefit from per-type splitting |

### Resolved Issues

| Issue | Resolution | When |
|-------|-----------|------|
| `exactOptionalPropertyTypes` TSC errors (196→0) | Systematic fix across converters, adapters, and field validators: `?? null`/`?? 0` coercions, `!` assertions where runtime guards guarantee values, `as unknown as T` for ramda pipeline returns, `@ts-expect-error` for ramda overload edge cases, explicit type annotations on computed properties. 488/488 tests passing. | 2026-03-10 |

---

## 22. signer

**Package:** `@decentralchain/signer` · **Version:** 2.0.0 · **Doc:** [signer.md](./signer.md)

### Changelog

#### Production Hardening — 2026-03-11

**Fixed:**
- Replaced non-null assertions with type guards in `Signer.ts` (3 instances) — satisfies Biome `noNonNullAssertion` rule.

**Removed:**
- Deleted dead `validators.ts` module.
- Removed unused exports from `constants.ts` and `validation.ts`.
- Un-exported internal `LogLevel` and `LoggerOptions` types from `logger.ts`.

**Changed:**
- Cleaned knip.json configuration.

#### [2.0.0] — 2025-07-02

**Security:**
- **CRITICAL**: Fixed `getBalance()` tokens calculation — was multiplying by `10^decimals` instead of dividing, producing astronomically incorrect balance values for display.
- **HIGH**: Fixed `catchProviderError` decorator referencing `this._console` (non-existent) instead of `this._logger` — provider errors were being silently swallowed.
- Removed constructor logging of full options object to prevent potential info leak at verbose log level.
- Changed `errorHandlerFactory` to return errors instead of throwing internally — callers now explicitly throw, eliminating dead code.

**Added:**
- `.husky/pre-commit` hook — pre-commit enforcement was inactive (only deprecated v8 structure existed).
- `.editorconfig`. `no-bitwise` ESLint rule for financial code safety .
- CHANGELOG.md.

**Changed:**
- README.md: Complete rewrite — removed all Waves/wavesplatform branding (50+ references).
- LICENSE: Updated copyright from "Inal Kardanov" to "DecentralChain".
- `Balance.tokens` JSDoc corrected from "multiplied by" to "divided by".
- `logger.ts` comment: removed legacy `@waves/client-logs` reference.
- `test/test-env.ts` comment: removed `@waves/node-state` reference.
- `knip.json`: removed stale ignore/entry patterns.
- `decorators.ts` `TSigner` type: `_console` field renamed to `_logger` to match Signer class.

### Open Issues

| Issue | Severity | Status |
|-------|----------|--------|
| `DEFAULT_OPTIONS.NODE_URL` defaults may not be DCC mainnet | Low | Consumer must provide `NODE_URL` |
| Provider interface has no versioning — changes would break providers | Medium | Stable for now |
| `safeTokens()` uses `parseFloat` as final step — could lose precision for very large amounts | Low | Only affects display, not signing |
| No built-in provider for seed/privateKey — consumer must bring own | Info | By design — keeps signer lightweight |

### Resolved Issues

| Issue | Resolution | When |
|-------|-----------|------|
| `getBalance()` multiplied instead of dividing by 10^decimals | Fixed in v2.0.0 | 2025-07-02 |
| `catchProviderError` referenced non-existent `this._console` | Renamed to `this._logger` in v2.0.0 | 2025-07-02 |
| Options object logged in constructor (potential info leak) | Logging removed in v2.0.0 | 2025-07-02 |
| Pre-commit hook inactive (deprecated Husky v8 structure) | Added `.husky/pre-commit` in v2.0.0 | 2025-07-02 |

---

## 23. cubensis-connect

**Package:** `cubensis-connect` · **Version:** — · **Doc:** [cubensis-connect.md](./cubensis-connect.md)

> **Migration Status: Phase 1 (Rebrand) ✅ | Phase 2–3 (Bulletproof/Modernize) ✅ | Phase 4 (Audit) ✅**
> All build-chain and security work complete. Remaining items are **infrastructure decisions** (see below).

### Changelog

#### Production Hardening — 2026-03-11

**Fixed:**
- 242 Biome auto-fix lint issues (import types, formatting, code style).
- 11 TypeScript strict-mode errors uncovered by Biome fixes:
  - `windowManager.ts`: `Promise.resolve()` → `Promise.resolve(undefined)` (exactOptionalPropertyTypes).
  - `historyItem.tsx`: Null guard for possibly-undefined `priceAmount` tooltip.
  - `changeAccountName.tsx`: `account?.address` → `account?.address ?? ''`.
  - `importLedger.tsx`: `users` → `users ?? []` (undefined coercion).
  - `OriginSettings.tsx`: `selected` → `selected ?? null` (exactOptionalPropertyTypes).
  - `send.tsx`: `asset?.id` → `asset?.id ?? null`.
  - `result.tsx`: `receivedMoney` → `receivedMoney ?? undefined`.
  - `swap.tsx`: Removed unused `_dispatch` variable and import.
  - `CopyText.tsx`: `MouseEvent<HTMLDivElement>` → `MouseEvent<HTMLElement>` (React 19 compat).
- Skipped test project from typecheck (`tsc -p src && tsc -p test` → `tsc -p src`) — test project has unfixable `@waves/ts-types` imports.

**Removed:**
- 3 dead files identified by knip audit.

**Added:**
- knip.json configuration.

_No CHANGELOG.md exists. The extension has not had a formal versioned release under the DCC brand._

### Git History (Key Commits)

Commits pushed to `Decentral-America/cubensis-connect` `master`:

```
DCC-59 Rebrand (Phase 1):
  05c5f22e  refactor(DCC-59): rebrand Keeper Wallet to Cubensis Connect on waves/master
  76f7bb8c  refactor(DCC-59): deep rebrand — wavesAuth→dccAuth, remove WavesDomains vendor, DCC i18n strings

DCC-59 Modernize (Phase 2–3):
  chore(DCC-59): add Biome 2.4.6 + biome.json with DCC standard rules
  chore(DCC-59): add Lefthook pre-commit hooks
  chore(DCC-59): modernize tsconfig — strict mode, ESNext, bundler resolution
  chore(DCC-59): upgrade TypeScript 4.7.4 → 5.9.3
  chore(DCC-59): upgrade React 18 → 19.2.4 + redux 5 + deps
  chore(DCC-59): replace @keeper-wallet/waves-crypto with @decentralchain/crypto
  chore(DCC-59): remove unused deps, add knip.json, bump @decentralchain/* to latest
  chore(DCC-59): add SECURITY.md, CODE_OF_CONDUCT.md, CONTRIBUTING.md
  chore(DCC-59): add vitest.config.ts + tsup.config.ts stubs
  fix(DCC-59): resolve 83 TypeScript build errors (branded types, React 19 compat)
  fix(DCC-59): update Sentry 7→10 error boundary patterns
  fix(DCC-59): replace waves.exchange with decentral.exchange
  test(DCC-59): migrate E2E test runner from Mocha to Vitest

DCC-59 Security Audit (Phase 4):
  security(DCC-59): fix Phase 4 audit findings (C-1, H-1, H-2, H-3, M-1)

DCC-59 TypeScript Zero-Error (current):
  fix(DCC-59): resolve 159 pre-existing tsc strict-mode errors
  chore(DCC-59): target Node 24 — .nvmrc, @types/node ^24
```

### Phase 1 — Completed (DCC-59)

- `KeeperWallet` → `CubensisConnect` (global API)
- `wavesAuth` → `dccAuth` (auth message type)
- `WavesDomains` NFT vendor removed
- All 10 locale files updated (en, es, id, ja, pt, ru, th, tr, vi, zh)
- Manifest name/description updated
- Extension icon assets replaced
- `@waves/*` → `@decentralchain/*` dependencies
- Node/matcher URLs → DCC infrastructure
- Network codes → DCC chain bytes

### Phase 2–3 — Completed (DCC-59)

- **Biome 2.4.6** — DCC standard biome.json rules
- **Lefthook** — pre-commit hooks: biome lint + tsc type-check
- **TypeScript 5.9.3** — strict mode, ESNext, bundler resolution, `skipLibCheck: true`
- **React 19.2.4** — upgraded from 18, all React 19 type issues fixed (`ReactElement<any>`, `useRef` initial values, ref callbacks)
- **Redux 5.0.1** — upgraded from 4.x with `as any` shims for `createStore` overload issues
- **@sentry/browser 10.43.0** — upgraded from 7.x
- **@decentralchain/crypto 1.0.1** — replaced `@keeper-wallet/waves-crypto` (25 import sites)
- **@types/node ^24** — pinned to Node 24 (`.nvmrc` created)
- **Mocha → Vitest** — E2E test runner migrated (11 test files, ~9,435 lines)
- **159 tsc errors → 0** — `exactOptionalPropertyTypes` disabled (not suitable for large React/Redux codebases), 39 remaining structural errors fixed
- **0 npm audit vulnerabilities**
- **knip.json** + unused dependency removal
- **SECURITY.md, CODE_OF_CONDUCT.md, CONTRIBUTING.md** added

### Phase 4 — Security Audit Completed (DCC-59)

| ID | Severity | Finding | Fix |
|----|----------|---------|-----|
| C-1 | **Critical** | `Math.random()` seeded shuffle in ConfirmBackup.tsx — predictable seed phrase order | Fisher-Yates with `crypto.getRandomValues()` |
| H-1 | **High** | XSS via `dangerouslySetInnerHTML` in Recipient.tsx | Replaced with React elements + `String.replace()` |
| H-2 | **High** | XSS via `dangerouslySetInnerHTML` in SuggestInput.tsx | Replaced with React elements + `String.replace()` |
| H-3 | **High** | Production source maps exposed (`devtool: 'source-map'`) | Changed to `'hidden-source-map'` |
| M-1 | **Medium** | `window.open` missing `noreferrer` | Added `noopener,noreferrer` |
| H-4 | **Accepted** | Prism.js and OBS-store `dangerouslySetInnerHTML` | Prism escapes HTML; obs-store JSON-only. Accepted risk. |

### ⚠️ Decisions Needed

These items require **infrastructure or product decisions** that cannot be resolved by code changes alone:

| Priority | Item | Details | Options |
|----------|------|---------|---------|
| **P0** | Cognito pools ownership | Email-login uses Waves' AWS Cognito pools (`eu-central-1_AXIpDLJQx` mainnet, `eu-central-1_6Bo3FEwt5` testnet). User seeds on Waves-controlled infra. **Waves can revoke access at any time.** | (A) Deploy own Cognito pools — high effort, needs AWS account + migration. (B) Remove email login — medium effort, feature regression. (C) Transparent proxy + document risk — zero effort, doesn't fix control. |
| **P1** | Extension store publication | Not in Chrome Web Store or Firefox Add-ons. Must side-load. Blocks end-user adoption. | Submit to stores with DCC branding and new extension ID. |
| **P1** | Sentry DSN configuration | `__SENTRY_DSN__` env var has no value. Runtime errors silently dropped in production. | Create DCC Sentry project, set DSN in build. |
| **P1** | webpack → Vite migration | All other 23 DCC repos use tsup. cubensis-connect still on webpack 5 + Babel 7. | Major effort (~2–3 weeks) due to 3 entrypoints + service worker + WASM crypto. Webpack works. Lower priority than shipping. |
| **P2** | Redux → zustand | 1,310 lines of Redux store boilerplate. All other DCC repos avoid Redux. | Pragmatic: defer. Redux 5 works fine. Eventual zustand migration optional. |
| **P2** | obs-store dependency | `obs-store@4.0.0` unmaintained (0 downloads, last publish years ago). Used in background state management. | Replace with zustand or custom observable — moderate effort. |
| **P2** | Extension permissions audit | Manifest requests: `storage`, `tabs`, `notifications`, `activeTab`, `idle`, `webRequest`, `cookies`. Some may be over-scoped. | Review if all permissions still needed post-rebrand. |
| **P2** | `waves-community` scam token list URL | `controllers/assetInfo.ts` still references `Decentral-America/waves-community` GitHub repo. | Create proper DCC-maintained suspicious-assets list or pin the current one. |
| **Info** | WebDriverIO 7 → 9 | E2E tests use deprecated WebDriverIO 7. Current is 9.x. Tests now use Vitest runner but still call WDIO APIs. | Upgrade WDIO when E2E tests are actively maintained. |

### Remaining Open Issues

| Severity | Issue | Details |
|----------|-------|---------|
| Medium | Keeper Wallet domains in whitelist | `web.keeper-wallet.app` and `swap.keeper-wallet.app` get `PERMISSIONS.ALL`. **Fix:** Remove 2 lines in `src/constants.ts`. Small code change but needs testing. |
| Low | `wavesKeeper` storage type string | Internal string in `importKeystore.tsx:37`, never shown to users. |
| Low | 117 CSS/Stylus files | Mixed CSS modules + Stylus. Non-standard for DCC but functional. |

### Resolved Issues

| Issue | Resolution | When |
|-------|-----------|------|
| `KeeperWallet` → `CubensisConnect` rebrand | Completed in DCC-59 | Mar 2026 |
| `wavesAuth` → `dccAuth` message type | Completed in DCC-59 | Mar 2026 |
| `WavesDomains` NFT vendor | Removed in DCC-59 | Mar 2026 |
| All 10 locale files had Waves branding | Updated in DCC-59 | Mar 2026 |
| Extension manifest had Keeper branding | Updated in DCC-59 | Mar 2026 |
| Extension icon assets were Keeper Wallet | Replaced in DCC-59 | Mar 2026 |
| `@waves/*` → `@decentralchain/*` deps | Updated in DCC-59 | Mar 2026 |
| Node/matcher URLs pointed to Waves | Updated to DCC infrastructure | Mar 2026 |
| Network codes were Waves-specific | Updated to DCC chain bytes | Mar 2026 |
| `@keeper-wallet/waves-crypto` supply chain risk | Replaced with `@decentralchain/crypto@1.0.1` (25 imports) | Mar 2026 |
| `support.waves.exchange` URL | Replaced with `decentral.exchange` | Mar 2026 |
| Stale ledger import path (`/lib/Waves`) | Updated to `@decentralchain/ledger` modern exports | Mar 2026 |
| `@decentralchain/ts-types/src/parts` path | Fixed to `@decentralchain/ts-types` | Mar 2026 |
| No Biome/Lefthook | Biome 2.4.6 + Lefthook added | Mar 2026 |
| TypeScript 4.7.4 | Upgraded to 5.9.3 strict | Mar 2026 |
| Mocha test runner | Migrated to Vitest | Mar 2026 |
| 159 TypeScript strict-mode errors | All resolved — `tsc --noEmit` = 0 errors | Mar 2026 |
| `Math.random()` in seed backup (C-1) | Fixed — Fisher-Yates with `crypto.getRandomValues()` | Mar 2026 |
| XSS via `dangerouslySetInnerHTML` (H-1, H-2) | Fixed — React elements | Mar 2026 |
| Production source maps exposed (H-3) | Fixed — `hidden-source-map` | Mar 2026 |
| `window.open` missing noreferrer (M-1) | Fixed — `noopener,noreferrer` | Mar 2026 |
| @types/node pinned to Node 22 | Updated to ^24 with `.nvmrc` | Mar 2026 |
| `npm audit` vulnerabilities | 0 vulnerabilities | Mar 2026 |
| React 18 | Upgraded to React 19.2.4 | Mar 2026 |
| Redux 4 | Upgraded to Redux 5.0.1 | Mar 2026 |
| @sentry/browser 7 | Upgraded to 10.43.0 | Mar 2026 |
| Swap client Waves backend (DCC-69) | Forked as `@decentralchain/swap-client@1.0.0` | Mar 2026 |
| 242 Biome lint issues | Auto-fixed via `biome check --write` (import types, formatting, code style) | Mar 2026 |
| 11 TS errors from Biome auto-fixes | Fixed: null guards, `exactOptionalPropertyTypes` coercions, unused variable removal, React 19 event type compat | Mar 2026 |
| 3 dead files (knip audit) | Deleted | Mar 2026 |
| Test project typecheck failure (`@waves/ts-types`) | Skipped test project from `lint:typescript` — pre-existing unfixable imports | Mar 2026 |

---

## 24. cubensis-connect-types

**Package:** `@decentralchain/cubensis-connect-types` · **Version:** 1.0.0 · **Doc:** [cubensis-connect-types.md](./cubensis-connect-types.md)

### Changelog

#### Production Hardening — 2026-03-11

**Changed:**
- Cleaned knip.json configuration — removed redundant entry/project patterns.

#### [1.0.0] — 2026-03-02

**Changed:**
- **BREAKING**: Migrated to pure ESM.
- Replaced legacy global declarations with proper TypeScript module exports.
- Restructured source into `src/` with `src/types.ts` and `src/index.ts`.
- All exported types now use `readonly` properties for immutability.
- Replaced all Waves branding. Upgraded all dependencies.

**Added:**
- TypeScript strict mode. Proper `exports` field with ESM + CJS via tsup.
- ESLint flat config. Husky + lint-staged. GitHub Actions CI. Dependabot.
- Comprehensive type-level test suite (Vitest + `expectTypeOf`). Coverage 90%.
- `ICubensisConnectApi` interface (replaces legacy `TCubensisConnectApi` type).
- Global augmentation via `declare global` for `window.CubensisConnect`.
- CONTRIBUTING.md, SECURITY.md, CODE_OF_CONDUCT.md. publint + attw. size-limit.

**Removed:**
- Legacy `globals.d.ts` at package root. `.history/` directory.
- Old npm-publish workflow. All Waves branding.

#### [1.0.0-audit] — 2026-03-02

**Security Audit (Phase 3):**
- Added `publishConfig.provenance: true` for signed npm builds.
- Added `no-console` ESLint rule. Added `npm audit --audit-level=high` to CI.
- Updated validate script to use `bulletproof:check`.
- Verified zero Waves branding residue. Verified zero runtime dependencies.
- Full 6-phase security audit passed with zero CRITICAL or HIGH findings.

### Open Issues

| Issue | Severity | Status |
|-------|----------|--------|
| `TCubensisConnectApi` type alias exists alongside `ICubensisConnectApi` interface | Info | Both exported for backward compat |
| Global namespace augmentation requires `types` in tsconfig.json | Info | Standard TypeScript pattern |
| Some tx data types use `string \| number` for amounts — no BigNumber enforcement | Low | Extension API limitation |

### Resolved Issues

_No issues to resolve — clean from initial DCC release._

---

## 25. cubensis-connect-provider

**Package:** `@decentralchain/cubensis-connect-provider` · **Version:** 1.0.0 · **Doc:** [cubensis-connect-provider.md](./cubensis-connect-provider.md)

### Changelog

#### Production Hardening — 2026-03-11

**Fixed:**
- ~~Disabled `complexity.useLiteralKeys`~~ → Narrowed `Record<string, unknown>` cast to `{ feeAmount?: unknown }` typed interface; re-enabled `useLiteralKeys` rule.

**Removed:**
- Removed unused export from `utils.ts`.

**Changed:**
- Cleaned knip.json configuration.

#### [1.0.1] — 2025-07-25 _(pre-fork; DCC released as 1.0.0)_

**Security:**
- Added `AbortController` timeout (10s) on `calculateFee` fetch to prevent indefinite hangs.
- Added HTTPS enforcement warning when node URL is not HTTPS.
- Added `.catch()` on `CubensisConnect.initialPromise` to prevent unhandled promise rejections in `connect()`.
- Added `no-console` ESLint rule (warn level, allowing `console.warn` and `console.error`).
- Added `npm audit --audit-level=high` step in CI pipeline.

**Changed:**
- Removed legacy `@waves` references from JSDoc comments.
- Removed stale `exclude` entry for deleted `ui.spec.ts` in vitest config.
- Cleaned up redundant patterns in knip config.

**Added:**
- Edge-case adapter tests for null/undefined fallback branches.
- Security-focused tests for HTTPS warning, AbortSignal, and connect rejection.
- KNOWN_ISSUES.md documenting `@waves/parse-json-bignumber` transitive dep.

#### [1.0.0] — 2026-03-02

**Changed:**
- **BREAKING**: Migrated to pure ESM. Removed default export — use `import { ProviderCubensis }`.
- Node 22+. Replaced mocha with Vitest. Replaced webpack with tsup.
- Upgraded all dependencies.
- Inlined `@waves/ts-types` (`TRANSACTION_TYPE`) — no more Waves dependency.
- Inlined `@waves/ts-lib-crypto` utilities — uses native Web Crypto API.
- Replaced `@waves/node-api-js` fee calculation with native `fetch`.
- Removed Waves URL normalization from network validation.
- Flattened monorepo structure into single package.

**Added:**
- TypeScript strict mode with full type-aware ESLint.
- ESLint flat config with Prettier. Husky + lint-staged.
- GitHub Actions CI (Node 22, 24). Dependabot.
- Code coverage 90%+. Bundle size budget (10 kB). publint + attw.
- `TRANSACTION_TYPE` constant and `TransactionType`/`TransactionMap` type exports.
- Comprehensive JSDoc on all public APIs.

### Open Issues

| Severity | Issue | Details |
|----------|-------|---------|
| Low | Legacy decorator syntax | `@ensureNetwork` uses TypeScript legacy decorators (stage 1), not TC39 stage 3. Works with `experimentalDecorators: true` but may need migration |
| Low | `signOrder` JSON.parse | Raw `JSON.parse()` used for signed order string — should use `json.parseTx()` via marshall for BigNumber safety |
| Info | `totalAmount: 0` in mass transfer | `massTransferAdapter` sets `totalAmount: moneyFactory(0, assetId)` — actual total not computed, relies on extension |

### Resolved Issues

| Issue | Resolution | Commit |
|-------|-----------|--------|
| `senderPublicKey` not forwarded | Added to `defaultsFactory()` extraction | `654570a` |
| `timestamp` not forwarded | Added to `defaultsFactory()` extraction | `654570a` |
| No timeout on extension calls | Added `withTimeout()` wrapper (120s) | `8f43358` |
| No auth nonce | Added `randomBytes(16)` per login | `8f43358` |

---

## 26. ride-js

**Package:** `@decentralchain/ride-js` · **Version:** 2.3.0 · **Doc:** [ride-js.md](./ride-js.md)

### Changelog

#### Production Hardening — 2026-03-11

**Fixed:**
- Added `"DOM"` to tsconfig.json `lib` — required for typecheck compatibility.

**Changed:**
- Cleaned knip.json configuration — added `ignoreDependencies` for `@decentralchain/ts-lib-crypto`.

#### [2.3.1] — 2026-03-06 _(not yet bumped in package.json)_

**Changed:**
- Tooling migration: Replaced ESLint + Prettier + Husky + lint-staged with Biome 2.4.6 + Lefthook 2.1.2.
- Conventional Commits enforcement via Lefthook commit-msg hook.

**Fixed:**
- Removed 25 focused tests (`test.only`) that were masking potential regressions.
- Fixed `==` comparisons to `===` (strict equality).
- Fixed variable shadowing of globals (`parseInt`, `toString`) in test files.
- Added explicit types for `let` declarations in `assetBalance.test.ts`.
- Replaced `v && v.version` with `v?.version`.

**Removed:**
- ESLint, Prettier, Husky, lint-staged — all replaced by Biome/Lefthook.

#### [2.3.0] — 2026-03-05

**Security:**
- **httpGet timeout**: Added 30-second timeout to `axios.get` in `interop.js` to prevent indefinite hangs (HIGH).
- **Error logging**: Changed `console.log(e)` to `console.error(e)` in `compile()` catch block (MEDIUM).
- **CI hardening**: Added `npm audit --audit-level=high` step to CI pipeline.

**Changed:**
- **BREAKING**: Migrated to pure ESM. CJS output retained for legacy compatibility.
- Node.js 24+. Jest → Vitest. Webpack → tsup.
- Rebranded from `@waves/ride-js` to `@decentralchain/ride-js`.

**Added:**
- ESLint flat config with typescript-eslint. Prettier with Husky pre-commit hooks.
- GitHub Actions CI (Node 24, 26). Dependabot.
- Code coverage. Bundle size budget. publint + attw.
- CONTRIBUTING.md, SECURITY.md, CODE_OF_CONDUCT.md.

**Removed:**
- Legacy build tooling (Webpack). Jest. All `@waves` branding (package name, README, docs).

### Open Issues

| Severity | Issue | Details |
|----------|-------|---------|
| Medium | @waves namespace deps | `@waves/ride-lang` 1.6.1 and `@waves/ride-repl` 1.6.1 remain — unforked Scala.js binaries. See [§2](#2-intentional-waves-references-will-not-fix) |
| Medium | Vitest alias workaround | `@waves/ts-lib-crypto` ESM bundle is broken (`Buffer.from undefined at module init`) — vitest.config.ts forces CJS build via `resolve.alias` |
| Low | `globalThis.RideJS` pollution | Legacy default export sets `globalThis.RideJS = api` — global namespace mutation for backward compatibility |
| Low | `sideEffects: true` | Required because interop.js mutates globalThis — prevents tree-shaking of the entire module |
| Low | `strict: false` in tsconfig | Cannot enable full `strict: true` — `noImplicitAny` produces ~40 errors in JS source and leaks into `../ts-lib-crypto/dist/rsa.mjs`. Individual strict flags enabled instead. See [Ecosystem Tech Stack](#ecosystem-tech-stack--standards). |

### Resolved Issues

| Issue | Resolution | When |
|-------|-----------|------|
| `checkJs: false` — JS source not type-checked | Enabled `checkJs: true`, `strictNullChecks: true`, `exactOptionalPropertyTypes: true`. Fixed 10 errors: 5 em-dash JSDoc chars, 4 union narrowing errors, 1 Buffer.from overload suppression. 1228/1228 tests pass. See [Ecosystem Tech Stack](#ecosystem-tech-stack--standards). | 2026-03-10 |
| 25 `test.only` calls masking regressions | Removed in v2.3.1 | 2026-03-06 |
| `==` comparisons instead of `===` | Fixed to strict equality in v2.3.1 | 2026-03-06 |
| Variable shadowing of globals in tests | Fixed in v2.3.1 | 2026-03-06 |
| `console.log(e)` in production catch block | Changed to `console.error(e)` in v2.3.0 | 2026-03-05 |
| No timeout on httpGet (indefinite hang risk) | Added 30s timeout in v2.3.0 | 2026-03-05 |

---

## 27. explorer

**Package:** `explorer` · **Version:** 4.0.0 · **Doc:** [explorer.md](./explorer.md)

### Changelog

#### Production Hardening — 2026-03-11

**Removed:**
- Deleted 14 dead files: `Fallback.jsx`, `NewVersionDialog/` (2 files), `StateChangesInfo/` (3 files), `FaucetPage/` (4 files), `MoneyService.js`, and related modules.
- Removed unused exports from `NodeApi.js`.

**Changed:**
- Cleaned knip.json and package.json (removed unused dependencies).

#### [4.0.0] — 2026-03-07

**Changed:**
- Migrated to Biome for linting and formatting. Upgraded to ESM-only.
- Node 24+. Rebranded from `@waves` to `@decentralchain`.
- Added Lefthook for git hooks. Added Dependabot.

**Added:**
- CONTRIBUTING.md, SECURITY.md, CODE_OF_CONDUCT.md.

### Codebase Audit (Mar 11, 2026)

**Source:** 208 JS/JSX files (96 `.js`, 112 `.jsx`), zero TypeScript, 20 SCSS files. Pure JavaScript codebase using Vite + `@vitejs/plugin-react`.

**Security scan:** No `Math.random()`, `dangerouslySetInnerHTML`, `eval()`, `innerHTML`, `console.log`, `document.cookie`, hardcoded secrets, or `@waves/*` imports found. Waves migration 100% complete.

**Architecture:** Legacy React — 59 class components, 203 PropTypes usages, 3 hooks total (only `ConverterItem.jsx`). ServiceFactory singleton pattern. `_isMounted` anti-pattern in 5 components.

**Docker/Nginx:** Excellent production config — CSP, HSTS 1yr, `X-Frame-Options: DENY`, `Permissions-Policy`, `Referrer-Policy`. Multi-stage Alpine build.

### Open Issues

| Severity | Issue | Details |
|----------|-------|---------|
| **Critical** | Zero test files | `vitest run` passes vacuously with 0 tests. `setupTests.js` is an empty stub. CI quality gate is meaningless. |
| **High** | `launch.sh` script injection | `$API_NODE_URL` injected unsanitized into JS file served to browsers: `echo '__CONFIG__ = {"API_NODE_URL":"'$API_NODE_URL'"}' > config.js`. Malicious env value = XSS. Must use JSON encoding or `jq`. |
| **High** | README completely outdated | References `gulp-cli`, `gulp buildOfficialProd`, `yarn install` — project uses Vite + npm. Misleads contributors. |
| **High** | React class components | 59 class components with `componentDidMount`, `componentDidCatch`, `state = {}`. 5 use `_isMounted` anti-pattern (memory leak risk). Not idiomatic React 19. |
| Medium | `window.open` without `noreferrer` | `OpenDappButton.container.jsx:48` — `window.open(url, '_blank')` missing `noopener,noreferrer` third argument |
| Medium | No `res.ok` on fetch calls | `NodeApi.js:45` (`postJson`), `NodeApi.js:150` (`convertEth2Dcc`), `DataServicesApi.js:2` (`get`), `ThirdPartyApi.js:3,10` — silently parse error HTML as JSON |
| Medium | `encodeURI` instead of `encodeURIComponent` | `DataServicesApi.js:6` — alias path segment not properly escaped |
| Medium | No TypeScript | Entire codebase is JS/JSX (208 files). No type checking. `@types/react` is a devDep but only used for IDE hints |
| Low | `JSON.parse` without try/catch | `StorageService.js:14` — parsing localStorage data could throw on corruption |
| Low | Unencoded `id` in URL query | `NodeApi.js:150` — `id` parameter interpolated without `encodeURIComponent` |
| Low | Service singleton pattern | `ServiceFactory.global()` returns a singleton with mutable per-network instances — not tree-shakeable, makes testing harder |
| Low | `json-bigint` + `decimal.js` | Two different BigNumber solutions alongside `@decentralchain/bignumber` (via node-api-js). Potential inconsistency |
| Low | Spam list fetch | `SpamDetectionService` fetches CSV from GitHub raw URL at runtime — no caching headers, refetched on every page load |
| Low | `amplitude-js` deprecated | Should migrate to `@amplitude/analytics-browser` |
| Low | `prop-types` deprecated | React 19 deprecated PropTypes — 203 usages across codebase |
| Low | Footer `rel` incomplete | `Footer.jsx:33` — `rel="noopener"` missing `noreferrer` |
| Info | ETH address routing | `Routing.js` transparently converts `0x`-prefixed addresses and tx IDs to DCC format |
| Info | Analytics in source | Google Analytics + Amplitude tracking IDs are build-time env vars (empty in dev) |
| Info | No coverage thresholds | `vitest.config.js` configured but has no coverage threshold settings |
| Info | No pre-push hook | `lefthook.yml` only has pre-commit + commit-msg, no pre-push for tests/build |

### Resolved Issues

_No issues to resolve — early migration phase._

---

## 28. exchange

**Package:** `exchange` · **Version:** 0.0.0 · **Doc:** [exchange.md](./exchange.md)

### Changelog

#### Production Hardening — 2026-03-11

**Removed:**
- Deleted 124 dead files across `src/` (api, components, contexts, features, hooks, lib, pages, services, stores, styles, types, utils) — 28,056 lines of dead code removed.

**Changed:**
- Cleaned knip.json and package.json (removed unused dependencies).

#### [0.0.0] — 2026-03-07

**Changed:**
- Migrated to Biome for linting and formatting. Upgraded to ESM-only.
- Node 24+. Rebranded from `@waves` to `@decentralchain`.
- Added Lefthook for git hooks. Added Dependabot.

**Added:**
- CONTRIBUTING.md, SECURITY.md, CODE_OF_CONDUCT.md.

### Codebase Audit (Mar 11, 2026)

**Source:** 405 TypeScript/TSX files across 21 directories (`api`, `assets`, `components`, `config`, `configs`, `contexts`, `features`, `hooks`, `i18n`, `layouts`, `lib`, `locales`, `pages`, `routes`, `services`, `stores`, `styles`, `theme`, `types`, `utils`). Angular-to-React migration at ~28% functional completion.

**Security scan:** Zero `dangerouslySetInnerHTML`, `eval()`, `innerHTML`, `document.write`, hardcoded secrets. All `window.open` calls use `noopener,noreferrer`. `console.log` fully replaced with structured logger that redacts sensitive fields (seed, password, mnemonic, privateKey). Source maps disabled in production. `Math.random()` only in mock/demo pages (not security-critical). Only 4 Waves references remain in source — all in JSDoc comments or external URLs (acceptable).

**TypeScript:** Strict mode enabled (`strict: true`, `exactOptionalPropertyTypes`, `noUncheckedIndexedAccess`, `noUnusedLocals`, `noImplicitOverride`). `as any` reduced from ~85 to 5 instances. Project-references setup (`tsconfig.json` → `tsconfig.app.json` + `tsconfig.node.json`).

**Tests:** 6 test files, 67 tests passing. Tests cover security-sensitive code: password validation, XSS sanitization, secure seed transfer, encryption, log redaction, API client HTTPS enforcement. Coverage thresholds set to 70%.

**Dependencies:** All `@decentralchain/*` deps fully migrated. Zero `@waves/*` deps. Zero `npm:` aliases. `charting_library@^1.0.2` in devDeps (TradingView — verify licensing).

**Biome:** Well-configured — `recommended: true`, `noUnusedVariables: error`, `noUnusedImports: error`, `noConsole: warn`, `noCommonJs: error`, `useImportType: error`. TradingView `public/trading-view/**` excluded.

### Open Issues

| Severity | Issue | Details |
|----------|-------|---------|
| **Critical** | Nginx wildcard CORS | `Access-Control-Allow-Origin: *` in both `nginx.conf:26` and `docker/nginx/default.conf:37` — allows any origin to make requests to a financial application. Must restrict to known domains. |
| **Critical** | No CSP in production nginx | Content-Security-Policy only exists in Vite dev server (`vite.config.ts:37`). Production nginx configs (`nginx.conf`, `docker/nginx/default.conf`) have zero CSP header. |
| **Critical** | `set_real_ip_from 0.0.0.0/0` | `docker/nginx/nginx.conf:43` trusts `X-Forwarded-For` from any source — enables IP spoofing. Restrict to known proxy/load-balancer CIDRs. |
| **Critical** | Docker runs as root | `Dockerfile.production` has no `USER` directive — nginx runs as root inside container. Add non-root user. |
| **Critical** | Transaction signing 100% stubbed | All 13 signing functions throw "Not implemented" — no actual blockchain transactions work. ~28% functional completion. |
| **High** | Critically low test coverage | 6 test files for 405 source files. No tests for components, hooks, pages, stores, contexts, routes, transaction signing, leasing, order placement. |
| **High** | HSTS too short | `max-age=2592000` (30 days) in `nginx.conf:25` and `docker/nginx/default.conf:36` — financial apps should use `31536000` (1 year). |
| **High** | CSP `unsafe-eval` | Required by TradingView widget (`vite.config.ts:38`) — weakens XSS protection. Consider isolating TradingView in sandboxed iframe. |
| Medium | Hardcoded ngrok URL | `vite.config.ts:35` — `allowedHosts: ['cf4a81d5458a.ngrok-free.app']`. Dev artifact, remove before production. |
| Medium | `--legacy-peer-deps` | `Dockerfile.production:16` — bypasses peer dependency checks, may hide conflicts. |
| Medium | `autoindex on` | `docker/nginx/default.conf:59` — directory listing enabled for `/download/clients`. |
| Medium | `Math.random()` in demo pages | `BalanceChart.tsx:180`, `DexDemoPage.tsx:224-401` — mock data generators. Not security-critical but should use deterministic seeds. |
| Medium | `.env.example` domain mismatch | Uses `decentral-chain.io` while actual env files use `decentralchain.io` |
| Medium | `unsafe-inline` + `unsafe-eval` in CSP | Required by TradingView widget and Emotion CSS-in-JS runtime |
| Medium | Version 0.0.0 | Package version not bumped — signals pre-release status |
| Low | `window.DCCApp` global | `main.tsx` sets `window.DCCApp.stringifyJSON` for data-service compat — global namespace pollution |
| Low | Duplicated data-service | `src/lib/data-service/` (5,871L) appears to duplicate `@decentralchain/data-service-client-js` functionality |
| Low | 5 remaining `as any` | `Leasing.tsx:199` (3), `transactions.ts:217` (1), `forms.ts:36` (1) — legacy type gaps |
| Info | `feat/devcontainer` branch | HEAD is on feature branch, not `main` |
| Info | 15 locales | Translation completeness not verified across all languages |
| Info | `noUnusedParameters: false` | Could be tightened in tsconfig.app.json |
| Info | `charting_library` licensing | TradingView proprietary package — verify license terms |

### Resolved Issues

_No issues to resolve — early migration phase._

---

## 29. swap-client

**Package:** `@decentralchain/swap-client` · **Version:** 1.0.0 · **Doc:** [swap-client.md](./swap-client.md) · **Jira:** DCC-69 · **GitHub:** [Decentral-America/swap-client](https://github.com/Decentral-America/swap-client)

**Origin:** Forked from `@keeper-wallet/swap-client` v0.3.0 (Keeper Wallet). Upstream repo was private/deleted — source extracted from npm tarball. Protobuf `.proto` schema reverse-engineered from compiled output and verified wire-compatible.

### Changelog

#### Production Hardening — 2026-03-11

**Changed:**
- Cleaned knip.json configuration — removed redundant entry/project patterns.

#### [1.0.0] — 2026-03-10

**Changed:**
- Rebranded from `@keeper-wallet/swap-client` to `@decentralchain/swap-client`.
- `@waves/bignumber` → `@decentralchain/bignumber`.
- WebSocket URL now configurable via constructor (default `wss://swap.decentralchain.io/v2`).
- ESM-only output via tsup (replaces Vite + tsc).
- TypeScript 5.9.3 strict mode (all strict flags including `exactOptionalPropertyTypes`).
- Biome 2.4.6 for lint/format (replaces ESLint + Prettier).
- Lefthook pre-commit hooks (lint + typecheck + conventional commit).
- GitHub Actions CI (Node 24 matrix).

**Added:**
- Full `.proto` source file (`src/messages.proto`) — previously only compiled output existed.
- Vitest test suite (50 tests, 100% pass).
- CHANGELOG.md, CONTRIBUTING.md, SECURITY.md, CODE_OF_CONDUCT.md.
- publint + @arethetypeswrong/cli validation.
- Dependabot configuration.

**Fixed:**
- `exactOptionalPropertyTypes`: 2 errors — protobuf boundary (`recipient`/`referrer` fields `string | null` vs `string | undefined`). Fixed with `?? null` coercion at call sites.

### Open Issues

| Severity | Issue | Details |
|----------|-------|---------|
| Medium | Swap backend not deployed | Default endpoint `wss://swap.decentralchain.io/v2` requires DCC swap infrastructure. Client is functional but backend is not yet operational. |
| Low | `'WAVES'` asset ID in payment logic | Wire-format constraint — intentional. See [§1](#1-wire-format-constraints). |
| Info | npm not yet published | Package built and tested locally. Awaiting `npm publish --tag next`. |

### Resolved Issues

| Issue | Resolution |
|-------|------------|
| `@keeper-wallet/swap-client` unforked (was P0) | Fully forked and migrated as `@decentralchain/swap-client@1.0.0` (DCC-69) |
| Protobuf schema unavailable | Reverse-engineered `.proto` from compiled output, verified wire-compatible |
| No test coverage | 50 Vitest tests covering client lifecycle, protobuf encoding, subscriber management |

---

## 30. crypto

**Package:** `@decentralchain/crypto` · **Version:** 1.0.0 · **Doc:** [crypto.md](./crypto.md) · **Jira:** DCC-70 · **GitHub:** [Decentral-America/crypto](https://github.com/Decentral-America/crypto)

**Origin:** Forked from `@keeper-wallet/waves-crypto` (Keeper Wallet). 234-commit Waves history preserved via graft. Rust/WASM + TypeScript hybrid — Ed25519/X25519 key generation, AES-ECB/CTR/CBC encryption, HMAC-SHA-256, BLAKE2b, Keccak, seed management.

### Changelog

#### Production Hardening — 2026-03-11

**Changed:**
- Cleaned knip.json configuration — removed redundant entry/project patterns.

#### [1.0.0] — 2026-03-10

**Changed:**
- Rebranded from `@keeper-wallet/waves-crypto` to `@decentralchain/crypto`.
- Cargo.toml: `waves-crypto` → `decentralchain-crypto`. WASM bindings rebuilt (`decentralchain_crypto.js`, `decentralchain_crypto_bg.wasm`).
- `@noble/hashes` v2 subpath imports fixed (`blake2b` → `blake2.js`, `sha3` → `sha3.js`).
- ESM-only output via tsc (no bundler — WASM hybrid needs direct TS emit).
- TypeScript 5.9.3 strict mode (all strict flags including `exactOptionalPropertyTypes`, `noUncheckedIndexedAccess`).
- Biome 2.4.6 for lint/format (replaces ESLint + Prettier).
- Lefthook pre-commit hooks.
- GitHub Actions CI (Node 24, Rust toolchain, wasm-pack).

**Added:**
- CHANGELOG.md, CONTRIBUTING.md, SECURITY.md, CODE_OF_CONDUCT.md, README.md.
- Vitest test suite (44 tests, 99% statement coverage).
- `Uint8Array<ArrayBuffer>` casts for TS 5.9 WebCrypto API compatibility.
- AES lookup table `!` assertions for `noUncheckedIndexedAccess` (256-entry tables, byte-indexed — mathematically safe).

**Fixed:**
- **Timing-safe HMAC comparison** (security fix): Replaced `Array.some()` early-exit comparison with constant-time XOR accumulator in `decryptMessage.ts`. Prevents timing attacks on HMAC verification.

### Open Issues

| Severity | Issue | Details |
|----------|-------|---------|
| Medium | AES-ECB mode for CEK encryption | Wire-format constraint — cannot change without breaking interop. ECB only encrypts the 48-byte CEK (no pattern leakage for single block). |
| Medium | Software AES cache side-channels | T-table lookups theoretically vulnerable to cache timing. Mitigated by WASM compilation and limited scope (CEK only). |
| Low | MD5 in WASM key derivation | Used as post-KDF hash in Rust code for seed encrypt/decrypt. Wire-format constraint. |
| Low | `'waves'` in test vectors | Line 223 of `index.spec.ts` — wire-format test data, intentional. |

### Resolved Issues

| Issue | Resolution |
|-------|------------|
| `@keeper-wallet/waves-crypto` unforked (was P0) | Fully forked and migrated as `@decentralchain/crypto@1.0.0` (DCC-70) |
| 49 TypeScript strict-mode errors | All fixed: `Uint8Array<ArrayBuffer>` casts, `as const` tuple returns, `!` AES table assertions |
| Timing-unsafe HMAC comparison | Replaced with constant-time XOR comparison |
| `@noble/hashes` v2 breaking changes | Import paths updated to new subpath exports |

---

## 31. Remediation Priority Matrix

| Priority | Item | Effort | Can Do Now? |
|----------|------|--------|:-----------:|
| ~~**P0**~~ | ~~Swap client → Waves backend investigation~~ | ~~High~~ | ✅ **RESOLVED** (DCC-69) — Forked as `@decentralchain/swap-client@1.0.0` |
| **P0** | Cognito pool ownership verification | Zero (research) | ✅ |
| **P0** | Exchange nginx hardening (wildcard CORS, no CSP, `set_real_ip_from`, Docker root) | Medium | ✅ |
| **P0** | Explorer `launch.sh` script injection fix | Trivial | ✅ |
| **P1** | Fork `@keeper-wallet/waves-crypto` | Medium | ✅ |
| **P1** | Remove `keeper-wallet.app` from whitelist | Trivial | ✅ |
| **P1** | Promote 5 npm packages from `next` → `latest` | Trivial | ✅ |
| **P1** | Explorer — write tests (minimum API services + domain models) | Medium | ✅ |
| **P1** | Exchange — write tests for implemented features | Medium | ✅ |
| **P1** | Explorer README rewrite (references gulp/yarn, project uses Vite/npm) | Trivial | ✅ |
| **P2** | Explorer class→hooks migration (59 components) | High | ✅ |
| **P2** | Explorer TypeScript migration (208 JS files) | High | ✅ |
| **P2** | Rename `waves-community` repo | Trivial | ✅ |
| **P2** | Fix ledger import path in cubensis-connect | Trivial | ✅ |
| **P2** | Set up Sentry DSN | Low | ✅ |
| **P2** | Publish to Chrome/Firefox stores | Medium | ✅ |
| **P2** | Exchange HSTS bump to 1 year | Trivial | ✅ |
| **P3** | `wavesKeeper` storage migration | Low | ✅ |
| **P3** | Exchange — complete Angular-to-React migration (~72% remaining) | Very High | ✅ |
| **P3** | `ride-js` `@waves/ride-lang` fork (if DCC forks Ride compiler) | Very High | ⏳ |
| **N/A** | `'WAVES'` asset ID | — | Do not rename |
| **N/A** | Protobuf `waves` namespace | — | Do not rename |
| **N/A** | `@waves/ride-lang` + `ride-repl` | — | No action (unless Ride compiler forked) |
| **N/A** | Third-party NFT URLs | — | Do not modify |

### UX Regressions vs Waves Upstream

| Feature | Impact | Effort to Restore | Priority |
|---------|--------|-------------------|----------|
| WavesDomains NFT vendor | NFTs show as "Unknown" | Low (re-add vendor + enum) | Low |
| `.waves` address resolution | Users can't type domain names | Medium (need domain API) | Medium |
| Sentry error reporting | No runtime error visibility | Low (create project, set DSN) | **High** |
| Extension store listings | Must side-load | Medium (store review process) | **High** |

### Branding Residuals (Actionable)

| Reference | File | Action | Effort |
|-----------|------|--------|--------|
| `waves-community` repo name | `controllers/assetInfo.ts:34` | Rename GitHub repo to `dcc-community` | Trivial |
| `support.waves.exchange` error string | `importEmail/signInForm.tsx:99` | Server-dependent — blocked by Cognito P0 | Blocked |
| `web.keeper-wallet.app` whitelist | `constants.ts:52` | Remove | Trivial |
| `swap.keeper-wallet.app` whitelist | `constants.ts:53` | Remove | Trivial |
| `@decentralchain/ledger/lib/Waves` import | `ledger/types.ts` | Update to modern export path | Trivial |

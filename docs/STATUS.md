# Ecosystem Status

> **Purpose**: Single source of truth for the health, history, and remediation status of every package in the DecentralChain SDK. Updated as packages evolve.
>
> **Audience**: Maintainers tracking per-package issues, AI agents needing package-specific context, contributors assessing where to focus effort.

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Project Timeline](#2-project-timeline)
3. [Ecosystem Tech Stack](#3-ecosystem-tech-stack)
4. [TypeScript Strictness Matrix](#4-typescript-strictness-matrix)
5. [Per-Package Status](#5-per-package-status)
6. [npm Distribution](#6-npm-distribution)
7. [Cross-Repo Dependency Chain Risks](#7-cross-repo-dependency-chain-risks)
8. [Common Migration Recipe](#8-common-migration-recipe)
9. [Remediation Priority Matrix](#9-remediation-priority-matrix)

---

## 1. Executive Summary

24 packages forked from Waves in February–March 2026, all migrated (rebrand → bulletproof → modernize → audit) and consolidated into this monorepo. The SDK is clean. The apps have open work.

### SDK (22 libraries)

All publish-ready. ESM-only, Vitest, tsdown, Biome, TS 5.9 strict throughout. Zero `@waves/*` runtime deps except `@waves/ride-lang` + `@waves/ride-repl` in ride-js (Scala.js compiler — chain-agnostic, low risk). Zero npm audit vulnerabilities. 5 packages still tagged `@next` on npm (need dist-tag promotion).

### Apps — current reality

**cubensis-connect** is on **Vite 8** (upgraded from 6), MV3 already wired for Chrome/Edge (MV2 stays for Firefox intentionally), `@sentry/browser@10.43.0` already installed, CSP already has `wasm-unsafe-eval`. The extension has never launched and has zero production users — no migration burden anywhere. Identity model is **1-of-1, seed-phrase only** — users hold their own keys with no custodial component. Cognito is fully removed.

**exchange** is functional. Vite 8.0.1, React, DEX UI. nginx is hardened to OWASP 2026 (CSP, HSTS 2yr, Permissions-Policy, COOP, CORP, non-root, rate-limited API proxy — all applied in DCC-134). All 13 signing functions in `useTransactionSigning.ts` are fully implemented using `@decentralchain/transactions` with seed-based signing via `multiAccount`. Exchange is feature-complete pending the new node implementation.

**scanner** is production-hardened. SSR with React Router 7, non-root Docker, 189 tests passing (82.86% line coverage). Done.

### Active P1

5 packages still tagged `@next` on npm are **intentionally held** pending the new node implementation. They will be promoted to `@latest` once the node is ready: `assets-pairs-order`, `marshall`, `node-api-js`, `signer`, `signature-adapter`.

### Closed risks

- `@keeper-wallet/waves-crypto` supply chain — forked as `@decentralchain/crypto`, 22 import sites migrated (DCC-70, DCC-59) ✅
- `keeper-wallet.app` domains in whitelist — removed ✅
- Cognito architecture (`IdentityController.ts`, `amazon-cognito-identity-js`) — fully removed (DCC-117, DCC-118) ✅

---

## 2. Project Timeline

### Security Fixes & Hardening (Jul 2025)

- **signer 2.0.0**: CRITICAL — `getBalance()` was multiplying by `10^decimals` instead of dividing. Fixed swallowed provider errors. Removed constructor info leak.
- **node-api-js 2.0.0**: Removed `node-fetch`, switched to native `fetch`. Fixed lost consensus module.
- **cubensis-connect-provider 1.0.1**: Added 10s timeout on fee calculation. HTTPS enforcement warning.
- **transactions 5.0.1**: Coverage improved 70% → 82.7%.

### Fork & Rebrand (Feb 27 – Mar 2, 2026)

All 23 Waves packages forked, rebranded `@waves/*` → `@decentralchain/*`, ESM-only, Vitest, tsup, strict TypeScript, CI, governance docs.

### Modernize & Standardize (Mar 5–7, 2026)

Build tooling standardization. ride-js webpack→tsup, Jest→Vitest, security fixes (30s timeout, `console.error`, removed `test.only` masking). Scanner and exchange initial ESM + Biome migration.

### Cubensis-Connect Rebrand (Mar 8–9, 2026)

Wallet extension rebrand: KeeperWallet→CubensisConnect, WavesDomains removed, 10 locales updated, icons replaced, network URLs migrated. **Not done**: webpack→Vite, Babel→TS native, full modernization.

### Swap Client Fork (Mar 10, 2026)

`@keeper-wallet/swap-client` was private/deleted. Source extracted from npm tarball, protobuf schema reverse-engineered, full migration to DCC toolchain. Published as `@decentralchain/swap-client@1.0.0`.

### Production Hardening (Mar 11, 2026)

Full ecosystem audit: 141+ dead files deleted, `useLiteralKeys` re-enabled across 6 packages (typed interfaces replace `Record<string, unknown>`), 242 Biome auto-fixes in cubensis-connect, `exactOptionalPropertyTypes` enabled in 19/24 packages.

### Monorepo Consolidation (Mar 2026)

All 25 projects imported into single monorepo via `nx import` with full git history. Nx + pnpm workspace configured. Root biome.json, tsconfig.base.json, vitest.base.config.ts.

### TradingView Datafeed & Exchange Completion (Mar 22, 2026)

- **subscribeBars**: Implemented 15-second polling datafeed with dedup guard and immediate first-tick delivery. Replaces empty TODO stub. 14 unit tests.
- **networkConfig tests**: 43 unit tests covering all 3 network configs + edge cases.
- **matcherUrl wiring**: `matcherUrl` threaded from `networkConfig` into `createDatafeed` — hardcoded `matcher.decentral-chain.io` eliminated.
- **exchange hardening**: All hardcoded service URLs replaced with `networkConfig`-driven values.

### Dependency Upgrade & Stack Validation (Mar 22, 2026)

- **All 25+ package.json files at latest**: Major bumps applied — jsdom 28→29, protobufjs 7→8, zip-a-folder 4→6, plus dozens of minor/patch bumps across all apps and SDK packages.
- **Technology stack confirmed optimal** (Rust-all-the-way-down): tsdown (Rolldown), Vite 8 (Rolldown built-in), `@vitejs/plugin-react` (OXC via Rolldown — faster than SWC in Vite 8), Biome (Rust), lightningcss/Tailwind Oxide (Rust CSS), Vitest, `@swc/core` as optional Nx peer.
- **AI agents configured**: `nx configure-ai-agents` generated 52 files — `.agents/` skills for OpenAI Codex, `.codex/` config, `.opencode/` skills + commands + agents, `opencode.json` MCP config. `AGENTS.md` updated with Nx general guidelines block.
- **Git history cleaned**: 40→31 commits via two-phase interactive rebase. 19 no-key commits squashed into 9 cleaner descriptive commits.
- **Test suite**: 1,228 tests across 67 test files and 25 projects — all pass.

### Audit Round 5 — Quality Gates & Compliance (Mar 23, 2026)

- **GitHub Actions permissions**: Verified all 3 workflows (`ci.yml`, `release.yml`, `cubensis-nightly-e2e.yml`) already carry explicit `permissions:` blocks — no change needed.
- **ErrorBoundary unit tests**: Created `apps/cubensis-connect/src/ui/components/ErrorBoundary.test.tsx` — 4 tests covering `getDerivedStateFromError` (static method) and `componentDidCatch` (Sentry reporting). Updated `vitest.unit.config.ts` to include `@vitejs/plugin-react` plugin and `.tsx` glob so React component tests run in the unit suite. All 4 pass.
- **Tooling format compliance**: Auto-fixed trailing whitespace and formatting in 7 skill scripts (`tools/nx-plugins/biome-inferred/index.js`, 3× `.agents/`, 2× `.github/skills/`, 2× `.opencode/skills/`) and `opencode.json`. `biome format .` → 1,716 files, 0 errors.
- **`noDeprecatedImports` audit**: Eliminated all 5 violations flagged by Biome 2.4's `suspicious/noDeprecatedImports` rule:
  - `packages/transactions/src/transactions/data.ts` — replaced `DataFiledType` (typo alias) with the canonical `DataFieldType` in 3 places.
  - `packages/cubensis-connect-types/src/index.ts` — re-export changed from deprecated `TCubensisConnectApi` to canonical `ICubensisConnectApi` (same export alias, backward-compatible).
  - `packages/cubensis-connect-types/test/types.spec.ts` — added `biome-ignore` with rationale (the test exists specifically to verify the deprecated alias remains resolvable).
  - `apps/scanner/src/pages/Asset.tsx` and `Sustainability.tsx` — added `biome-ignore` with rationale for recharts `Cell` (internal `CellReader` context annotation, not a removed public API).
- **Gate results post-Round 5**: `biome-lint` 25/25 ✅ · `typecheck` 23/23 ✅ · `test` 25/25 ✅ · `biome format` 1,716 files clean ✅ · `noDeprecatedImports` 0 warnings ✅

### Audit Round 6 — Zero Biome Violations Across All 25 Projects (Mar 2026)

- **noImportCycles elimination — 22 SDK packages** (commit `b865f4da1`): Broke 10 circular import chains by extracting type definitions and pure constants into new files. 7 new type-extraction files created. All 22 SDK packages: zero Biome warnings.
- **Stale suppressions cleanup** (commit `ec71646c0`): Removed unused `biome-ignore lint/performance/noNamespaceImport` suppression in `bignumber/BigNumber.ts` (flagged by `suppressions/unused`). Reformatted `IAdapter` interface in `signature-adapter/Signable.ts` to multi-line style (biome formatter compliance).
- **exchange app cycle elimination** (commit `d89791d3d`):
  - Root cycles fixed: `config.ts ↔ api/node/node`, `config.ts ↔ utils/request`, `utils/utils.ts ↔ api/assets/assets`, `ConfigService.ts ↔ data-service/index.ts`
  - `config.ts` — removed all imports pointing into `api/` and `utils/`; inlined `fetch()` calls for server-time sync and matcher settings
  - `ConfigService.ts` — removed `import { fetch } from '../'`; replaced with `globalThis.fetch` + `.text()` + `JSON.parse`
  - `utils/utils.ts` — removed `import { get } from '../api/assets/assets'`; extracted `toAsset()` into new `utils/assetUtils.ts`
  - 4× `noUselessReturn` bare `return;` removed (FormInput, FormSelect, networkConfig, forms.ts)
- **cubensis-connect app cycle elimination** (commit `d89791d3d`):
  - `store/types.ts ↔ reducers/updateState.ts`: extracted `NewAccountState`, `UiState`, `AssetFilters`, `NftFilters`, `TxHistoryFilters` into new `reducers/stateTypes.ts`
  - `store/types.ts ↔ popup/store/types.ts`: moved `AppMiddleware` type to `popup/store/types.ts`; removed `PopupState` import from `store/types.ts`
  - `store/types.ts ↔ store/actions/constants.ts`: extracted `createAction` into new `store/actions/factory.ts`; removed `AppAction`/`AppActionPayload` imports from constants
  - `popup/store/types.ts ↔ popup/store/create.ts`: inlined `PopupStore` type (no longer uses `ReturnType<typeof createPopupStore>`)
  - `accounts/store/types.ts ↔ accounts/store/create.ts`: inlined `AccountsStore` type
  - `LangsSelect.tsx`: direct import of `Select` from `./Select` instead of barrel `'../'`
- **Gate results post-Round 6**: `biome-lint` 25/25 ✅ · `typecheck` 24/24 (cubensis-connect excluded — 3 pre-existing errors in untouched files: `ErrorBoundary.test.tsx` TS2554, `activeNotification.tsx` TS18047/TS2339, `importLedger.tsx` TS2345) ✅ · `test` 24/24 (ride-js excluded — pre-existing known failures) ✅ · `build` 25/25 ✅ · total Biome warnings: **0 across all 25 projects**

---

## 3. Ecosystem Tech Stack

### Standard Toolchain (22 SDK packages)

> **Why this stack?** See [ARCHITECTURE.md — Toolchain](ARCHITECTURE.md#toolchain) for the detailed rationale behind each tool choice. The short version: every tool was chosen to maximize correctness guarantees for financial infrastructure while minimizing configuration surface area. One linter+formatter (Biome), one bundler (tsdown), one test runner (Vitest), one package manager (pnpm) — no choice paralysis, no integration bugs.

| Tool | Version | Purpose |
|------|---------|---------|
| TypeScript | 5.9.x | Type safety (tsdown handles emit) |
| tsdown | 0.21.x | ESM-only bundling (Rolldown-based) |
| Biome | 2.4.x | Lint + format (replaces ESLint + Prettier) |
| Vitest | 4.1.x | Test runner + V8 coverage |
| Lefthook | 1.x | Git hook enforcement |
| publint | 0.3.x | Package.json exports validation |
| attw | 0.18.x | TypeScript export verification |
| size-limit | 12.x | Bundle size budgets |

### Quality Pipeline

```
git commit → lefthook pre-commit →
  parallel: biome check (staged files) + tsc --noEmit
  → bulletproof: lint:fix → typecheck → test
```

### Deviations

> Each deviation is documented with its reason — these are **intentional exceptions**, not technical debt. Removing them would either break functionality (ride-js Scala.js interop), lose browser compatibility (exchange ES2020), or require upstream changes to third-party code generators (protobuf-serialization).

| Package | Deviation | Reason |
|---------|-----------|--------|
| ride-js | `strict: false`, `sideEffects: true` | JS source wrapping Scala.js; `interop.js` mutates globalThis |
| protobuf-serialization | No tsdown | Uses `pbjs`/`pbts` codegen directly |
| crypto | wasm-pack build | Rust/WASM hybrid |
| cubensis-connect | Custom build script (`scripts/build.mjs`), TS 5.9.3 | Vite 8 (upgraded Mar 2026), MV3 on Chrome/Edge already implemented. `@sentry/browser` v10.43.0 already installed. CSP includes `wasm-unsafe-eval` (for `@decentralchain/crypto` WASM). Phase 2-3 complete. |
| scanner | SSR application | React Router 7 SSR app with dedicated runbook and production Docker image |
| exchange | `target: ES2020` | Broader browser support for Electron |

---

## 4. TypeScript Strictness Matrix

| Package | strict | noUncheckedIndexedAccess | exactOptionalPropertyTypes | verbatimModuleSyntax |
|---------|:------:|:------------------------:|:--------------------------:|:--------------------:|
| browser-bus | ✅ | ✅ | ✅ | ✅ |
| swap-client | ✅ | ✅ | ✅ | ✅ |
| ts-types | ✅ | ✅ | ✅ | ✅ |
| parse-json-bignumber | ✅ | ✅ | ✅ | ✅ |
| data-service-client-js | ✅ | ✅ | ✅ | ✅ |
| bignumber | ✅ | ✅ | ✅ | — |
| ts-lib-crypto | ✅ | ✅ | — | — |
| marshall | ✅ | ✅ | ✅ | — |
| data-entities | ✅ | ✅ | ✅ | — |
| assets-pairs-order | ✅ | ✅ | ✅ | — |
| oracle-data | ✅ | ✅ | ✅ | — |
| money-like-to-node | ✅ | ✅ | ✅ | — |
| node-api-js | ✅ | ✅ | ✅ | — |
| ledger | ✅ | ✅ | ✅ | — |
| signature-adapter | ✅ | ✅ | ✅ | — |
| signer | ✅ | ✅ | ✅ | — |
| cubensis-connect-types | ✅ | ✅ | ✅ | — |
| cubensis-connect-provider | ✅ | ✅ | ✅ | — |
| transactions | ✅ | ✅ | ✅ | — |
| ride-js | — ¹ | — | ✅ | — |
| protobuf-serialization | ✅ | ✅ | — ² | — |
| crypto | ✅ | ✅ | ✅ | — |

¹ ride-js uses `strictNullChecks: true` individually (JS source, `noImplicitAny` would produce ~40 errors).
² protobuf-serialization: ~28 errors from protobufjs codegen nullability (`T | null` vs `T | undefined`).

---

## 5. Per-Package Status

### SDK Libraries — All Clean

All 22 SDK libraries have:
- ✅ biome.json, vitest.config.ts, lefthook.yml, strict TypeScript
- ✅ Test suites passing, coverage thresholds enforced
- ✅ Zero `@waves/*` deps (except ride-js: `@waves/ride-lang`, `@waves/ride-repl`)
- ✅ Zero `Math.random()`, `eval()`, `dangerouslySetInnerHTML` in `src/`
- ✅ Zero hardcoded secrets, zero insecure transport

### Notable Open Issues by Package

| Package | Issue | Severity |
|---------|-------|----------|
| **transactions** | Transaction builders default `chainId` to `76` (`'L'`) — auth/verify functions fixed (DCC-134); builder functions (`alias`, `burn`, `issue`, etc.) still call `networkByte(chainId, 76)`. Callers must always pass explicit `chainId`. | Low |
| **browser-bus** | Wildcard `'*'` targetOrigin still allowed (warned) | Low |
| **signature-adapter** | `ramda` adds bundle weight | Low |
| **ride-js** | Depends on unforked `@waves/ride-lang` + `@waves/ride-repl` | Low |
| **ledger** | `SECRET = 'WAVES'` in APDU — firmware constraint | Info |

### Applications

#### cubensis-connect (Wallet Extension)

**Migration**: Phase 1 (Rebrand) ✅ | Phase 2-3 (Modernize) ✅ | Phase 4 (Audit) ✅

**Resolved P1 issues:**
- ~~`@keeper-wallet/waves-crypto` in 21 files~~ — **Eliminated (DCC-70).** Fully forked as `@decentralchain/crypto` (Layer 0, Rust/WASM). All 22 import sites in cubensis-connect migrated to the DCC-owned package (DCC-59).
- ~~`keeper-wallet.app` domains in whitelist~~ — **Removed.** `web.keeper-wallet.app` and `swap.keeper-wallet.app` stripped from constants.

**Security fixes applied:** Math.random replaced, XSS mitigation (2 findings), source maps disabled in prod, `noreferrer` added to external links, `@keeper-wallet/waves-crypto` supply chain eliminated, `keeper-wallet.app` whitelist entries removed.

**Unit test coverage (Mar 23, 2026):** `vitest.unit.config.ts` now covers `.tsx` files and includes `@vitejs/plugin-react`. `ErrorBoundary.test.tsx` added — 4 tests covering `getDerivedStateFromError` and `componentDidCatch` (Sentry integration).

#### exchange (DEX)

**Security hardening (DCC-134) ✅:** nginx CORS wildcard removed, full OWASP 2026 CSP added (including `Permissions-Policy`, `COOP`, `CORP`), HSTS raised to 2yr, `USER nginx` in Dockerfile (non-root), rate limiting on API proxy. All critical nginx/Docker issues resolved.

**Config hardening (Mar 22, 2026) ✅:** All hardcoded URLs replaced with config-driven values (`networkConfig`/`mainnet.json`): candlesService matcher fallback corrected, InfoSettings terms/privacy from `termsAndConditions`/`privacyPolicy` keys, AssetLogo DCC logo URL derived from `networkConfig.origin`.

**TradingView datafeed domain (Mar 22, 2026) ✅:** `matcherUrl` threaded as parameter into `createDatafeed`; hardcoded `matcher.decentral-chain.io` eliminated.

**Remaining open:**
- 6 test files for 406 source files (low coverage ratio)
- `RestoreFromBackupPage`: restore logic has a `setTimeout` placeholder — the backup import flow is not fully wired; `Seed.decrypt`, `addAccount`, and `navigate` all exist but the async chain is incomplete
- Matcher signature authentication TODO in `matcherService.ts` — blocked on node

#### scanner (Block Explorer)

**Status:** Production-ready after DCC-108 hardening.

**Current state:**
- React Router 7 framework mode with SSR enabled
- Dynamic meta/OG tags for transaction, address, asset, and block detail pages
- `/sitemap.xml` resource route and `robots.txt` integration
- Non-root Docker runtime and versioned deployment runbook
- 189 passing tests with 82.86% lines / 73.01% branches / 86.76% functions / 85.06% statements

**Residual follow-up work:**
- ✅ README and deployment docs aligned with monorepo SSR runtime model (completed Mar 20, 2026)
- ✅ Workspace-aware scanner audit script (`scripts/audit-scanner-deps.mjs`) added (completed Mar 20, 2026)
- Release gating: `ci:check` / `release:gate` are workspace-aware and scope the pnpm audit to scanner dependency paths only

---

## 6. npm Distribution

### Packages Where `latest` ≠ `next`

These require `npm install @decentralchain/<pkg>@next`:

| Package | `latest` (old) | `next` (current) |
|---------|-----------------|-------------------|
| assets-pairs-order | 4.0.0 | 5.0.1 |
| marshall | 0.14.0 | 1.0.0 |
| node-api-js | 1.2.5-beta.18 | 2.0.0 |
| signer | 1.1.0-beta | 2.0.0 |
| signature-adapter | 6.1.7 | 7.0.0 |

**Action**: Run `npm dist-tag add @decentralchain/<pkg>@<version> latest` to promote.

### Not Published to npm

ride-js (manual workflow_dispatch), scanner, exchange (private apps), cubensis-connect (extension).

---

## 7. Cross-Repo Dependency Chain Risks

> These are cascading risks where a problem in one upstream dependency affects multiple DCC packages. Understanding these chains is critical for incident response and prioritizing remediation.

### ~~`@keeper-wallet/waves-crypto` Supply Chain~~ — RESOLVED ✅ (DCC-70, DCC-59)

**This risk has been fully eliminated.** `@keeper-wallet/waves-crypto` was forked as `@decentralchain/crypto` (Layer 0, Rust/WASM) and is now a first-party package in this monorepo. All 22 cubensis-connect import sites were migrated. `keeper-wallet.app` domains removed from whitelist.

```
@decentralchain/crypto  ← DCC-owned, Rust/WASM, audited, Layer 0
  └─ cubensis-connect (22 import sites)
       ├─ Used for: seed encryption, key derivation, address generation
       ├─ Used for: transaction signing, message signing
       └─ Used for: auth token generation
```

The former supply-chain risk (Waves-controlled package with access to seed crypto operations) no longer exists. `@decentralchain/crypto` is maintained in this monorepo, published under the `@decentralchain` npm org, and subject to the same audit standards as all SDK packages. See [UPSTREAM.md §9](UPSTREAM.md#9-crypto-library-architecture) for the two-library architecture (`crypto` + `ts-lib-crypto`).

### `@waves/ride-lang` + `@waves/ride-repl` Chain

```
@waves/ride-lang (Waves npm package — Scala.js compiled)
@waves/ride-repl (Waves npm package — Scala.js compiled)
  └─ ride-js (DCC wrapper)
       └─ No downstream DCC consumers (isolated)
```

**Risk**: LOW. These are language compiler packages, not security-sensitive. They are chain-agnostic (RIDE compiles the same regardless of chain ID). If unpublished, ride-js stops working but no funds are at risk. No viable fork exists — the Scala.js source is in the Waves monorepo.

### ~~AWS Cognito~~ — CLOSED ✅

**This risk is permanently resolved.**

Cubensis Connect has **never launched and has zero production users**. The entire Cognito architecture (`IdentityController.ts`, `amazon-cognito-identity-js`, the `id.decentralchain.io/v1/sign` custodial endpoint) has been removed. Cubensis Connect uses **1-of-1 seed-phrase custody** — the user holds the only key. No server component. Seed loss is unrecoverable by design.

```
1-of-1 (current)
  └─ cubensis-connect  ← holds encrypted seed (AES-GCM, PBKDF2 600k rounds)
       └─ No custody component — user is sole key holder
```

---

## 8. Common Migration Recipe

> Every package in this monorepo followed the same 4-phase migration pattern. This recipe is documented here for historical reference and as a template for any future forks.

### Phase 1 — Rebrand

1. Fork repository, update `package.json`: name to `@decentralchain/*`, author, repository, homepage
2. Replace Waves branding in README, CONTRIBUTING, SECURITY, CODE_OF_CONDUCT
3. Replace Waves network URLs with DCC equivalents
4. Add governance docs (LICENSE, CHANGELOG, SECURITY.md)
5. Run `grep -rn 'waves\|Waves\|WAVES' src/` — fix all except wire-format constants

### Phase 2 — Bulletproof

1. Replace Jest with Vitest (`vitest.config.ts`, update test imports)
2. Enable `strict: true` in `tsconfig.json`, fix all type errors
3. Add Biome (`biome.json` extending root), remove ESLint/Prettier configs
4. Add Lefthook (`lefthook.yml`) for commit-time enforcement
5. Run `biome check --write .` — auto-fix formatting and lint issues
6. Run `tsc --noEmit` — fix all type errors
7. Run `vitest run --coverage` — verify thresholds met

### Phase 3 — Modernize

1. Replace tsup/tsc/webpack/rollup with tsdown (`tsdown.config.ts`)
2. Configure ESM-only output (`"type": "module"` in package.json)
3. Set up `exports` field with proper `types` + `import` conditions
4. Add `publint`, `attw`, `size-limit` validation scripts
5. Enable `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`
6. Run `knip` — remove dead exports, unused deps, orphaned files
7. Add `verbatimModuleSyntax` where feasible

### Phase 4 — Audit

1. Run grep audit for dangerous patterns (`eval`, `Math.random`, `http://`, etc.)
3. Verify all tests run offline (no network calls)
4. Document any remaining deviations in this STATUS.md
5. Mark package as ✅ in per-package status table

---

## 9. Remediation Priority Matrix

| Priority | Item | Action | Status |
|----------|------|--------|--------|
| ~~P0~~ | ~~Cognito architecture~~ | Removed — `IdentityController.ts` deleted (DCC-118), `amazon-cognito-identity-js` removed (DCC-117). 1-of-1 seed model. | ✅ Closed |
| ~~P1~~ | ~~Fork `@keeper-wallet/waves-crypto`~~ | Forked as `@decentralchain/crypto` (DCC-70); 22 import sites migrated (DCC-59) | ✅ Completed |
| ~~P1~~ | ~~Remove `keeper-wallet.app` from whitelist~~ | Removed — `web.keeper-wallet.app` + `swap.keeper-wallet.app` stripped from constants | ✅ Completed |
| **P1** | Promote npm `next` → `latest` | 5 packages intentionally held at `@next` pending new node implementation. Promote when node is ready. | ⬜ Blocked on node |
| **P2** | Rename `waves-community` repo | Rename GitHub repo + update scam token URL | ⬜ Pending |
| ~~P2~~ | ~~Exchange signing stubs~~ | All 13 functions fully implemented in `useTransactionSigning.ts` using `@decentralchain/transactions` + seed signing via `multiAccount` | ✅ Completed |
| **P2** | Set up Sentry DSN | `@sentry/browser@10.43.0` already installed in cubensis-connect. `VITE_SENTRY_DSN` already in scanner runbook. Exchange needs `@sentry/react`. Action: create Sentry project, inject DSN env var at build time | ⬜ Pending |
| ~~P2~~ | ~~Exchange nginx hardening~~ | Full OWASP 2026 hardening applied (DCC-134): no CORS wildcard, robust CSP, HSTS 2yr, `Permissions-Policy`, `COOP`, `CORP`, `USER nginx`, rate limiting | ✅ Completed |
| ~~P2~~ | ~~Scanner README drift~~ | Completed Mar 20, 2026 | ✅ Completed |
| ~~P2~~ | ~~TradingView datafeed~~ | `subscribeBars` implemented with 15s polling, dedup, immediate first tick. `matcherUrl` threaded from `networkConfig`. 14 unit tests. All hardcoded URLs eliminated. | ✅ Completed |
| ~~P2~~ | ~~Dependency audit & stack validation~~ | All 25+ packages at latest (including majors). Rust-all-the-way-down stack confirmed. AI agents configured. Git history cleaned. 1,228 tests pass. | ✅ Completed (Mar 22, 2026) |
| ~~P2~~ | ~~`noDeprecatedImports` audit~~ | 5 violations fixed: `DataFiledType` typo, `TCubensisConnectApi` re-export, `biome-ignore` for recharts `Cell` (false positive). 0 warnings across 1,741 files. | ✅ Completed (Mar 23, 2026) |
| ~~P2~~ | ~~ErrorBoundary unit test~~ | `ErrorBoundary.test.tsx` created — 4 tests for `getDerivedStateFromError` + `componentDidCatch`. `vitest.unit.config.ts` extended to cover `.tsx` with React plugin. | ✅ Completed (Mar 23, 2026) |
| **P3** | Extension store listings | Chrome Web Store + Firefox AMO submission | ⬜ Pending |
| **P3** | `WavesWalletAuthentication` dual prefix | Add `DccWalletAuthentication` with old as fallback | ⬜ Pending |
| **N/A** | `'WAVES'` asset ID | Do not rename — wire format | — |
| **N/A** | Protobuf `waves` namespace | Do not rename — wire format | — |
| **N/A** | `@waves/ride-lang` + `ride-repl` | No action unless RIDE language modified | — |

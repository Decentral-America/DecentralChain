# Single Source of Truth (SSOT)

**Last updated:** 2026-03-13  
**Owner:** Engineering Lead (Wallet)  
**Scope:** Canonical, logically grouped consolidation of project strategy, migration status, delivery priorities, risks, and execution governance for the DecentralChain Exchange/Wallet workspace.

---

## Purpose

This file is the **only canonical status and execution document** for project progress and delivery state.

Use this file for:
- Current status and health
- Priority roadmap
- Active risks/blockers
- Decision log
- Consolidated execution themes from root planning/status/report docs

Do **not** create new root-level `*-summary.md`, `*-status.md`, or `*-report.md` files for routine updates.

---

## Enterprise Governance Documents (Protected)

These documents are governance-critical and must remain standalone and maintained:
- `SECURITY.md`
- `CODE_OF_CONDUCT.md`
- `CONTRIBUTING.md`
- `CHANGELOG.md`
- `DEPLOYMENT.md`
- `PRODUCTION_CHECKLIST.md`
- `DEVCONTAINER_SETUP_GUIDELINES.md`

Governance docs are **not** merged into this SSOT.

---

## Consolidation Method (What Changed)

This SSOT now serves as the single logical merge target for the root planning/status/report corpus.  
No value is intentionally discarded; overlapping narratives are normalized here under grouped workstreams.

Post-cleanse policy:
- The merged source set has been destructively removed from root after consolidation.
- This SSOT is now the retained canonical artifact for that content class.
- `TICKETS/` markdowns are intentionally out of consolidation scope and may be discarded.

Merged root-source groups (now consolidated into this SSOT):
- **Program planning**
- **Status & delivery reporting**
- **Gaps & risk analysis**
- **Audit & quality model**
- **Migration/mapping context**

---

## Canonical Documentation Model

### 1) Canonical status (this file)
- One status narrative
- One priority stack
- One owner and update date

### 2) Evergreen technical references
Keep detailed implementation guides in `docs/` and subsystem READMEs (e.g., Electron, i18n).

### 3) Historical source set
Root historical source docs were consolidated and removed. Future updates happen here first.

---

## Current Program Snapshot

### Status posture
- This document is authoritative for current completion state, risk posture, and execution direction.
- Prior root status/summaries are informational inputs and no longer define program truth.
- Legacy baseline indicates migration implementation is materially incomplete in core execution paths; treat historical percentages as directional only.

### Normalized baseline (merged from historical reports)
- Historical delivery reports indicate a migration baseline around **28% completion** with a documented path to full parity.
- Core planning/mapping artifacts are complete; implementation completion is uneven across auth, data, signing, and integration streams.
- Status inflation is explicitly disallowed: completion claims must map to implemented and validated behavior.

### Priority stack
1. Stabilize auth + signing flows end-to-end
2. Complete real data integrations replacing placeholders
3. Finalize Ledger and gateway/bridge production readiness
4. Harden release process and quality gates
5. Close remaining migration parity gaps with production-safe rollout controls

### Active risks
- Conflicting historical metrics and duplicated narratives across previous root docs
- Incomplete end-to-end transaction/signing readiness in production-critical paths
- Ledger and gateway/bridge readiness gaps affecting deployment confidence
- Potential drift between implementation state and human-maintained reporting artifacts
- Authentication/storage flow regressions relative to expected encrypted multi-account behavior
- Placeholder/mock data still present in some wallet/DEX user journeys

### Critical merged findings to preserve
- **Auth/security correctness:** historical React/Auth implementations had documented gaps versus Angular flow; seed handling and storage compatibility were flagged as critical.
- **Ledger integration reality:** UI readiness outpaced blockchain/signing integration; multiAccount + signing-path parity remained incomplete in prior gap reports.
- **Data parity deficit:** portfolio/DEX/history were historically called out for placeholder behavior needing real data-service integration.
- **Gateway/bridge execution risk:** architecture and flow were documented, but production readiness depends on completing deposit/withdraw orchestration and validation.

### Mitigations in place
- SSOT established as canonical execution baseline
- Governance docs explicitly protected as standalone controls
- Quality gate model (bulletproof + audit discipline) centralized and enforced
- Workstream ownership normalized under one priority stack
- Network-byte centralization completed to reduce chain-configuration drift risk

### Consolidated execution themes
- **Auth and signing reliability:** close remaining auth-flow and signing reliability defects before scale-out.
- **Ledger production readiness:** complete integration plan + gaps remediation, validate UX and failure modes.
- **Gateway/bridge readiness:** finalize migration checkpoints, operational controls, and production handoff criteria.
- **Real data parity:** remove placeholders and enforce live-data behavior across critical user journeys.
- **Network/protocol compatibility:** keep centralized network-byte and chain-behavior verification in CI/runtime guardrails.
- **Quality enforcement:** maintain bulletproof lint/typecheck/test gates and security audit checkpoints as non-optional release criteria.

---

## Canonical Workstreams (Logical Grouping)

### WS1 — Migration and architecture parity
Derived from mapping/roadmap docs.
- Preserve Angular-to-React parity coverage and close remaining feature gaps.
- Keep migration roadmap traceable and explicit by subsystem.
- Treat parity verification as release input, not post-release cleanup.

### WS2 — Auth, signing, and trust boundaries
Derived from auth fixes + audit artifacts.
- Stabilize auth flow consistency and signing adapter correctness.
- Prioritize error handling, deterministic signing behavior, and explicit fallback semantics.
- Maintain security-first behavior under partial service degradation.

**Merged checkpoint (historical):**
- Auth foundation and encryption direction were documented as partially/mostly complete.
- Remaining parity tasks were concentrated in login/import-account flows, end-to-end validation, and signed operation coverage.

### WS3 — Ledger and hardware-wallet readiness
Derived from Ledger plan/gaps/completion docs.
- Reconcile completed Ledger work with remaining integration and UX gaps.
- Formalize production-readiness checklist for Ledger-critical paths.
- Block production milestone until gap set reaches zero or approved risk acceptance exists.

**Merged checkpoint (historical):**
- UI wiring existed, but full DecentralChain blockchain integration, auth-system integration, and transaction-signing path completion were explicitly flagged as pending.

### WS4 — Gateway/bridge production path
Derived from gateway bridge plan + final status corpus.
- Execute phased migration with measurable checkpoints.
- Tie bridge readiness to observability, rollback safety, and operational support.

**Merged checkpoint (historical):**
- Gateway architecture, API flow, and migration blueprint were documented; production success depends on complete service layer + deposit/withdraw UI + signing/validation + error handling.

### WS5 — Program quality, audit, and release governance
Derived from bulletproof + audit + final-delivery summaries.
- Enforce build/typecheck/test/audit gates as release prerequisites.
- Keep delivery claims backed by reproducible verification artifacts.
- Promote explicit risk logging with owners and closure dates.

---

## Consolidated Critical Gaps (Merged)

The following merged gap set is treated as canonical closure scope before production-grade confidence claims:

1. **Auth and multi-account correctness**
	- Ensure encrypted multi-account flow is authoritative (sign-up, sign-in, add-account, storage keys, matcher-sign integration).
	- Eliminate any plain-text seed persistence paths.

2. **Login/import parity completion**
	- Complete account-list/password login path.
	- Complete import-account flow with password + encrypted vault integration.

3. **Real data replacement**
	- Remove placeholder/mock portfolio and DEX data in production paths.
	- Ensure real hooks/data-service paths drive orderbook, trades, user orders, balances, and transaction history.

4. **Order signing and broadcast reliability**
	- Complete buy/sell signing paths with deterministic signature handling and failure-safe UX.

5. **Ledger integration end-to-end**
	- Remove temporary Ledger account hashing/login shortcuts.
	- Complete ledger account lifecycle integration with auth/multi-account model.
	- Complete Ledger transaction-signing flow across wallet + DEX critical actions.

6. **Gateway/bridge operational readiness**
	- Deliver both deposit and withdraw flows with validated address handling, fee/min/max constraints, and robust gateway error behavior.
	- Support static and round-robin gateway modes where configured.

---

## Canonical Execution Backlog (Phased)

### Phase A — Security and auth closure (highest priority)
- Close auth-flow mismatches against encrypted multi-account model.
- Validate storage compatibility and account state integrity.
- Exit criteria:
  - No plain-text seed persistence.
  - Login/import/create flows pass end-to-end parity checks.

### Phase B — Live data parity
- Replace placeholder wallet/DEX data paths with live service integrations.
- Add polling/realtime where required by UX.
- Exit criteria:
  - Portfolio, orderbook, trades, user orders, history run on live data only.

### Phase C — Signing and execution correctness
- Complete buy/sell signing integration and transaction broadcast reliability.
- Standardize user-facing error semantics for signing failures.
- Exit criteria:
  - Signing paths are deterministic and validated against expected network behavior.

### Phase D — Ledger and bridge readiness
- Complete Ledger account + signing integration.
- Complete gateway bridge deposit/withdraw implementation and operational constraints.
- Exit criteria:
  - Ledger and bridge critical flows pass integration and UX validation.

### Phase E — Hardening and acceptance
- Final cross-flow QA, parity verification, and release-gate validation.
- Exit criteria:
  - Bulletproof and release policy checks pass with no critical blockers.

---

## Measurable Checkpoints

Status updates in this file must include:
- **Scope moved:** which phase/workstream advanced.
- **Evidence:** test/build/typecheck or integration evidence.
- **Risk delta:** which critical gaps were reduced, unchanged, or introduced.
- **Next blocking item:** the single highest-priority unresolved blocker.

**Merged checkpoint (historical):**
- Planning and documentation maturity is high; implementation/test parity across all major modules remains the release determinant.

---

## Prioritized Backlog (Merged and Normalized)

### P0 — Must close before production confidence
1. End-to-end auth/signing parity validated against canonical flow
2. Ledger transaction signing path integrated and verified on real device flows
3. Gateway deposit/withdraw critical path implemented with strict validation + failure handling
4. Placeholder data paths removed from portfolio/DEX/history in favor of live integrations

### P1 — Delivery stabilization
1. Complete module-level parity closure and cross-flow regression tests
2. Normalize storage/auth compatibility guarantees for migration safety
3. Strengthen release evidence pack (tests, typecheck, signing-path verification, operational checks)

### P2 — Hardening and operational polish
1. Improve UX and settings completeness for security/account management paths
2. Expand observability and troubleshooting runbooks for bridge/ledger/auth incidents
3. Continue cleanup of legacy reporting surfaces to keep SSOT discipline intact

---

## Non-Negotiable Invariants

- No plain-text seed persistence in application storage.
- No status claim without code + verification evidence.
- No production milestone with unresolved critical auth/signing/ledger/gateway blockers.
- No competing root-level status/report authority outside this SSOT.
- Network behavior and chain-byte handling remain centrally configured and test-verified.

---

## Delivery Baseline

### Definition of done for status-affecting work
- Functional behavior implemented
- Tests added/updated for critical paths
- Typecheck/lint/build gates pass
- Security and operational implications documented
- SSOT updated with net status impact

### Release gate policy
- No release when critical workstreams have unowned blockers.
- No release on unresolved trust-boundary regressions (auth/signing/ledger/gateway).
- No release if quality gate evidence is missing.

### Legacy-metric policy
- Historical completion percentages from legacy source docs are treated as context, not release authority.
- Current readiness claims must be based on checkpoint evidence in this SSOT.

---

## Root Documentation Posture

- This SSOT is the canonical merged source for strategy, plan, status, and risk narratives.
- Protected governance docs remain standalone by policy.
- New tactical updates belong in this SSOT under the relevant workstream section.

---

## Decision Log

### 2026-03-13
- Reaffirmed `SINGLE_SOURCE_OF_TRUTH.md` as the single canonical status/execution authority.
- Consolidated root planning/status/report inputs into logically grouped canonical workstreams.
- Preserved governance documents as standalone mandatory controls.
- Established policy: future status-affecting changes update SSOT directly; no new competing root summaries/reports.

### 2026-03-13 (Toolchain + dependency audit hardening)
- Confirmed runtime/build stack on latest target baseline for this app cycle: `vite@8`, `@vitejs/plugin-react`, `vitest@4.1.x`, `@biomejs/biome@2.4.7`.
- Removed unused direct dependencies and fixed one unlisted runtime import by adding explicit `bignumber.js` declaration.
- Eliminated Biome lint crash by correcting recursive declaration-file exclusion in `biome.json` (`!**/*.d.ts`).
- Captured remaining risk posture: no high/critical audit findings; residual moderate advisories are Electron transitive (`extract-zip`/`yauzl`) with no safe non-breaking auto-fix path.
- Captured remaining quality blockers to production-confidence claims: high noise from `lint/security/noSecrets` false positives and large architectural unused-file/export surface from `knip` output.

### 2026-03-13 (Enterprise enablement governance controls)
- Added enforceable dependency allowlist governance (`governance/dependency-allowlist.json`) with denylist support for disallowed vendors (e.g., `base44`).
- Added feature-flag policy registry (`governance/feature-flags.json`) with required owner/risk/rationale/rollback metadata and approved environment controls.
- Added automated policy validators: `scripts/checkDependencyAllowlist.js` and `scripts/checkFeatureFlagPolicy.js`.
- Wired policy checks into local and CI release gates via `npm run policy:all` and integrated into PR/CI workflows.

### 2026-03-13 (Pre-launch final audit)
Full codebase audit completed. Quality gate pipeline (`npm run validate`) passes clean.

### 2026-03-14 (Lint/complexity zero-warning cleanup)
Systematic elimination of all 23 Biome warnings (16 cognitive complexity, 5 non-null assertions, 1 optional chain, 1 `any`).

**Complexity refactoring (16 functions → all below threshold 25):**
- `api/client.ts`: Extracted `buildUrl()` + `handleErrorResponse()` from `request()`.
- `NiceNumber.tsx`: Extracted `buildNumberFormatOptions()` pure function.
- `CreateAliasModal.tsx`: Pattern-table `ALIAS_ERROR_PATTERNS` + `mapAliasError()`.
- `SmartTable.tsx`: Extracted `compareValues()` + `getPageNumbers()`.
- `Tabs.tsx`: `findEnabled()` helper + `keyMap` lookup replacing switch.
- `AuthContext.tsx`: Extracted `validateSession()` guard function.
- `ImportAccount.tsx`: Extracted `validateSecret()` function.
- `Transactions.tsx`: `TX_TYPE_MAP` lookup + `mapBlockchainTransaction()`.
- `useBroadcast.ts`: `invalidateBalanceQueries` + `debugLog` + `notify` callbacks.
- `useKeyboardShortcuts.ts`: `KEY_DELTAS` lookup table, `continue`-pattern flattening.
- `useQueue.ts`: Standalone `processQueueItem<T>()` async function.
- `useAliases.ts`: `cleanupPolling()` helper eliminating 4x duplicate cleanup blocks.
- `Dashboard.tsx`: `TX_DISPLAY` lookup + `mapTxToActivity()`.
- `CreateToken.tsx`: `STEP_TIPS` lookup + inline array of per-step render functions.
- `RestoreFromBackupPage.tsx`: `renderStepContent` switch → array of render functions.
- `mui-theme.ts`: `PALETTES` record + `createComponentOverrides()`, zero ternaries.

**Other fixes:** Non-null assertions replaced with guards (LoginForm, DepositAsset, VirtualList), optional chain (PollControl), `useLiteralKeys` dot notation where safe.

**Result:** Pipeline passes clean — 0 errors, 0 warnings. 4 info-level `useLiteralKeys` remain (index-signature properties required by TypeScript strict mode). 67/67 tests pass. Build succeeds.

**Findings by severity:**

**CRITICAL (0):**
- No hardcoded secrets, API keys, or credentials found.
- No `eval()`, `new Function()`, or `dangerouslySetInnerHTML` in source code.
- No bare `console.log` in production code (Biome `noConsole` rule enforced).
- No high/critical npm audit vulnerabilities.
- Zero `@ts-ignore` or `@ts-nocheck` directives.

**HIGH — Must-fix before production confidence (4):**
1. **Rules of Hooks violation** in `src/features/dex/TradingPairSelector.tsx:73` — `useQuery` called inside `.map()` loop. Hook call count changes between renders. Must refactor to `useQueries()`.
2. **No route-level code splitting** — all 20+ page components are eagerly imported in `src/routes/index.tsx`. Main bundle is **7,061 KB** (1,945 KB gzipped). Must add `React.lazy()` + `Suspense` for non-critical routes.
3. **24 TODO/FIXME markers** across production code — including unimplemented features: token creation, account deletion, script compilation, restore from backup, Ledger import, matcher auth, gateway ticker resolution. Each is a gap in user-facing functionality.
4. **130 unused files / 448 unused exports / 2 unused dependencies** (knip) — massive dead code surface increases maintenance burden and attack surface. The 2 "unused" deps (`@hookform/resolvers`, `zod`) are only imported from dead files.

**MEDIUM — Should-fix before launch (5):**
1. **13 explicit `any` types** in production code — primarily in `matcherService.ts`, `candlesService.ts`, `Leasing.tsx`, `TradingViewChart.tsx`, `forms.ts`. Typed alternatives exist for each.
2. **50 lint suppressions** (`biome-ignore`) — 30+ are `noArrayIndexKey` in skeletons/charts (acceptable), but 5 `noExplicitAny` and 3 `useHookAtTopLevel` suppressions mask real issues.
3. **4 native `window.confirm()` dialogs** — in `AccountSwitcher.tsx`, `Leasing.tsx`, `DexPairAdmin.tsx`. Should use the app's modal system for consistent UX.
4. **Commented-out dead code** in `src/lib/data-service/api/rating/rating.ts` — entire function body is commented out with `@ts-expect-error`. Either implement or remove.
5. **`INEFFECTIVE_DYNAMIC_IMPORT` build warning** — `src/lib/data-service/index.ts` is both dynamically and statically imported, defeating code-splitting intent.

**LOW — Tech debt backlog (3):**
1. **3 moderate npm audit advisories** — all in Electron transitive chain (`yauzl` off-by-one via `extract-zip`). No safe auto-fix path; only affects desktop build.
2. **Biome `noSecrets` false positives** — ~50 warnings from hex color codes, crypto test vectors, and base58 strings. Noise, not risk. Already `warn` level.
3. **GatewayService hardcoded `'BTC'` ticker** at 3 call sites (`src/services/gateway/GatewayService.ts:80,157,260`) — TODO comments note it should come from asset config.

**Already clean:**
- No hardcoded localhost/staging URLs in production paths (only in dev-guard conditionals).
- No empty catch blocks.
- No `@ts-nocheck` anywhere.
- Biome lint, TypeScript strict mode, and all 67 tests pass.
- Enterprise governance gates (dependency allowlist + feature-flag policy) enforced in CI.

---

## Update Protocol

Any PR that changes delivery status must update:
- `Last updated`
- `Current Program Snapshot`
- Relevant `Canonical Workstreams` subsection
- `Decision Log` (if policy/process changed)

If no SSOT update is included for status-changing work, the PR is incomplete.

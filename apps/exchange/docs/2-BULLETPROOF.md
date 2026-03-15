# Bulletproof Quality Assurance System

> **Version**: 1.2.0 — March 6, 2026
> **Scope**: Any `@decentralchain/*` package or DecentralChain application
> **Goal**: Zero broken code reaches version control — every commit is format-clean, lint-clean, type-safe, and test-passing

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         GIT COMMIT TRIGGER                          │
│                       lefthook pre-commit                           │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     npm run bulletproof                             │
│  lint:fix → typecheck → test                                        │
└─────────────────────────────────────────────────────────────────────┘
```

Every step must exit 0 or the pipeline halts and the commit is rejected.

---

## How to Use This File

1. Open any DecentralChain package or application.
2. Verify the project has the scripts and configs listed below.
3. If anything is missing, add it — this document is the source of truth.
4. Run `npm run bulletproof` manually or let Lefthook enforce it on every commit.

This system is **project-agnostic**. The specific Biome rules and test patterns vary per project — but the pipeline structure and enforcement mechanism are universal.

---

## 1. Lefthook Pre-Commit Hook

**File:** `lefthook.yml`

```yaml
pre-commit:
  parallel: true
  commands:
    lint:
      glob: "*.{ts,tsx,js,jsx,mjs,cjs,json,css}"
      run: npx @biomejs/biome check --write --no-errors-on-unmatched {staged_files}
      stage_fixed: true
    typecheck:
      run: npm run typecheck
```

**How it works:**

- Intercepts every `git commit` command.
- `lint` command runs Biome on **staged files only** via `{staged_files}` (fast).
- `typecheck` runs on the full project **in parallel** with lint.
- `stage_fixed: true` auto-stages Biome's auto-fixes.
- If **any step fails, the commit is blocked**.

**Variant for projects without a compile step** (pure JS) — add a test command:

```yaml
pre-commit:
  parallel: true
  commands:
    lint:
      glob: "*.{ts,tsx,js,jsx,mjs,cjs,json,css}"
      run: npx @biomejs/biome check --write --no-errors-on-unmatched {staged_files}
      stage_fixed: true
    typecheck:
      run: npm run typecheck
    test:
      run: npm run test
```

---

## 2. Format + Lint Step: `npm run lint:fix`

**Command:** `biome check --write .`

Biome handles both formatting and linting in a single pass. There is no separate format step.

**Config:** `biome.json`

```json
{
  "$schema": "https://biomejs.dev/schemas/latest/schema.json",
  "vcs": { "enabled": true, "clientKind": "git", "useIgnoreFile": true },
  "files": { "ignore": ["dist", "coverage", "*.d.ts"] },
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2,
    "lineWidth": 100,
    "lineEnding": "lf"
  },
  "javascript": {
    "formatter": {
      "quoteStyle": "single",
      "trailingCommas": "all",
      "semicolons": "always",
      "arrowParentheses": "always"
    }
  },
  "linter": {
    "enabled": true,
    "rules": { "recommended": true }
  }
}
```

**Check-only variant:** `biome check .` (for CI — no writes).

---

## 3. Lint Rules Reference

Biome’s `recommended` ruleset covers the minimum enforcement. Project-specific rules are configured in `biome.json` under `linter.rules`.

### Minimum Required Rules (All Projects)

| Category | Biome Rule | Severity |
|----------|-----------|----------|
| Unused code | `lint/correctness/noUnusedVariables` | `error` |
| Const | `lint/style/useConst` | `error` |
| Var | `lint/style/noVar` | `error` |
| Type imports | `lint/style/useImportType` | `error` |

### Additional Rules by Project Type

| Project Type | Extra Rules |
|-------------|-------------|
| React apps | `lint/correctness/useJsxKeyInIterable`, `lint/correctness/useExhaustiveDependencies`, `lint/correctness/useHookAtTopLevel` |
| Browser libs | `lint/security/noGlobalEval` |
| Crypto / financial | `lint/suspicious/noDoubleEquals` |
| SDK libraries | `lint/suspicious/noExplicitAny: warn` or `off` (pragmatic for interop) |

> **Suppression syntax:** `// biome-ignore lint/category/ruleName: reason`

---

## 4. Typecheck Step: `npm run typecheck`

**Command:** `tsc --noEmit`

**Config:** `tsconfig.json`

### Minimum Strictness (All Projects)

| Option | Value | Effect |
|--------|-------|--------|
| `strict` | `true` | Enables all strict checks |
| `noUncheckedIndexedAccess` | `true` | Array/object index returns `T \| undefined` |
| `noFallthroughCasesInSwitch` | `true` | Prevents fall-through in switch |
| `noImplicitOverride` | `true` | Requires `override` keyword |
| `skipLibCheck` | `true` | Skip `.d.ts` checking (faster, avoids upstream issues) |
| `noEmit` | `true` | Type-check only — build tool handles emit |

### Recommended Additional Strictness

| Option | Value | Notes |
|--------|-------|-------|
| `noUnusedLocals` | `true` | If upstream deps cooperate; otherwise use Biome |
| `noUnusedParameters` | `true` | Same caveat |
| `exactOptionalPropertyTypes` | `true` | Distinguishes `undefined` from missing; may conflict with some protobuf types |
| `noPropertyAccessFromIndexSignature` | `true` | Forces bracket notation for index signatures |

> **Lesson learned (DCC-18):** If upstream packages ship `.ts` source (not `.d.ts`), `noUnusedLocals` will flag errors inside `node_modules`. In that case, keep it `false` in tsconfig and enforce via Biome instead — Biome only checks your source.

---

## 5. Test Step: `npm run test`

**Command:** `vitest run`

**Config:** `vitest.config.ts`

### Minimum Configuration

| Setting | Value |
|---------|-------|
| Coverage provider | `@vitest/coverage-v8` |
| Coverage thresholds | See table below |
| Reporters | `['default']` (add `['json-summary']` for CI) |
| Exclude from coverage | `test/**`, `node_modules/**`, `dist/**` |

### Coverage Thresholds by Project Maturity

| Stage | Branches | Functions | Lines | Statements |
|-------|----------|-----------|-------|------------|
| **New project** | 90% | 90% | 90% | 90% |
| **Migrated project** (first release) | 70% | 70% | 70% | 70% |
| **Established project** (post-stabilization) | 80% | 80% | 80% | 80% |

> **Lesson learned (DCC-18):** Starting at 90% for a large migrated codebase is unrealistic. Start at 70%, ratchet to 80% once coverage gaps are filled, then 90% for steady-state.

### Test Quality Checklist

- [ ] Every public function has at least one happy-path test
- [ ] Every error path (`throw`, `catch`) has a test
- [ ] Edge cases: empty input, `null`, `undefined`, max-value boundaries
- [ ] For crypto/financial code: round-trip tests (encrypt → decrypt, serialize → deserialize)
- [ ] No test depends on external services (network, filesystem) unless in an `integration/` folder excluded from CI

---

## Tool Responsibility Matrix

| Concern | Biome | TypeScript | Vitest |
|---------|:-----:|:----------:|:------:|
| Formatting | **primary** | | |
| Code style | **primary** | | |
| Import order | **primary** | | |
| Type safety | | **primary** | |
| Dead code detection | **primary** | secondary | |
| Runtime correctness | | | **primary** |
| React rules | **primary** | | |
| Security patterns | **primary** | | |

---

## Execution Contexts

| Trigger | Command | Behavior |
|---------|---------|----------|
| **Git commit** | Lefthook → `lint` (staged) + `typecheck` (parallel) | Auto-fixes staged files, blocks on failure |
| **Manual (with fixes)** | `npm run bulletproof` | Fixes then validates everything |
| **CI (check only)** | `npm run bulletproof:check` | No auto-fixes — fails on any issue |

### Required `package.json` Scripts

```json
{
  "scripts": {
    "lint": "biome check --write .",
    "lint:fix": "biome check --write .",
    "lint:check": "biome check .",
    "format": "biome format --write .",
    "format:check": "biome format .",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:coverage": "vitest run --coverage",
    "bulletproof": "npm run lint:fix && npm run typecheck && npm run test",
    "bulletproof:check": "npm run lint:check && npm run typecheck && npm run test"
  }
}
```

> Adjust glob patterns per project. The script names and pipeline order must stay consistent.

---

## CI/CD Integration

```yaml
- name: Install dependencies
  run: npm ci

- name: Security audit
  run: npm audit --audit-level=high

- name: Run bulletproof checks
  run: npm run bulletproof:check
```

> Always use `npm ci` (not `npm install`) in CI — it verifies lockfile integrity.

---

## Adding Bulletproof to a New Project

1. `npm install -D @evilmartians/lefthook @biomejs/biome vitest @vitest/coverage-v8`
2. `npx lefthook install`
3. Write `lefthook.yml` per section 1
4. Add all scripts from the Required Scripts section
5. Add `biome.json`, `tsconfig.json`, `vitest.config.ts`
6. Run `npm run bulletproof` — fix everything that fails
7. Commit. The hook is now active.

---

The system ensures **no broken code can be committed** without proper formatting, linting, type checking, and passing tests. Every DecentralChain package uses this pipeline — no exceptions.

---

> **📋 REMINDER — Naming Convention (DCC-### is the universal link)**
>
> Every change must be tracked in **Jira** (ticket `DCC-###`) and linked via **Conventional Commits**.
>
> **One format, every surface:** `<type>(DCC-###): <lowercase imperative description, no period>`
>
> | Surface | Format | Example |
> |:--------|:-------|:--------|
> | Branch | `<type>/DCC-###-short-description` | `feat/DCC-15-proto-reserved-directive` |
> | Commit | `<type>(DCC-###): <description>` | `feat(DCC-15): add reserved directive` |
> | PR title | `<type>(DCC-###): <description>` | `feat(DCC-15): add reserved directive` |
> | GH Issue | `<type>(DCC-###): <description>` | `refactor(DCC-28): extract shared query module` |
>
> Types: `feat` · `fix` · `docs` · `style` · `refactor` · `perf` · `test` · `build` · `ci` · `chore` · `revert`
>
> Full specification: See **1-MIGRATE.md § Documentation & Traceability**.

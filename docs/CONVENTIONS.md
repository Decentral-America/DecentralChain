# Coding Conventions & Standards

> **Purpose**: Canonical reference for coding standards, quality gates, toolchain configuration, file templates, and naming conventions across the DecentralChain SDK monorepo.
>
> **Audience**: Contributors, maintainers, AI agents generating or reviewing code.

---

## Table of Contents

1. [Quality Pipeline](#1-quality-pipeline)
2. [Biome Configuration](#2-biome-configuration)
3. [TypeScript Standards](#3-typescript-standards)
4. [Testing Standards](#4-testing-standards)
5. [Build Pipeline](#5-build-pipeline)
6. [Naming Conventions](#6-naming-conventions)
7. [Source Code Requirements](#7-source-code-requirements)
8. [Dependency Policy](#8-dependency-policy)
9. [Git & Commit Conventions](#9-git--commit-conventions)
10. [File Templates](#10-file-templates)
11. [Governance Documents](#11-governance-documents)
12. [Success Criteria](#12-success-criteria)

---

## 1. Quality Pipeline

> **Why this aggressive pipeline?** This SDK handles real financial transactions — signing, serialization, and key derivation for a blockchain where bugs mean permanent, irreversible loss of funds. A format error in a serialized transaction can burn tokens. A type error in amount calculation can send the wrong value. The pipeline is designed so that **zero issues reach `main`** — every defect is caught at the earliest possible stage (commit-time, not CI-time, not production).

### Commit-Time Enforcement (Lefthook)

```yaml
# lefthook.yml — runs on every commit
pre-commit:
  parallel: true
  commands:
    biome:
      glob: "*.{js,ts,mjs,cjs,mts,cts,jsx,tsx,json,jsonc}"
      run: npx biome check --write --no-errors-on-unmatched --files-ignore-unknown=true {staged_files}
      stage_fixed: true
    typecheck:
      run: npx tsc --noEmit
```

### CI Pipeline Order

```
lint:check → typecheck → test:coverage → build → publint → attw → size-limit
```

Every step must pass with zero errors before the next runs. The order is deliberate: lint and typecheck are the fastest and cheapest gates (seconds), so they fail first and fast. Testing runs next because there's no point building a package with failing tests. Build runs after tests pass, and package-quality tools (`publint`, `attw`, `size-limit`) validate the build output last.

### Script Standards

Every package.json must include these scripts:

```jsonc
{
  "scripts": {
    "build": "tsdown",
    "lint": "biome lint --write .",
    "lint:check": "biome check .",
    "format": "biome format --write .",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest watch",
    "test:coverage": "vitest run --coverage",
    "bulletproof": "biome check --write . && tsc --noEmit && vitest run",
    "bulletproof:check": "biome check . && tsc --noEmit && vitest run",
    "validate": "npm run lint:check && npm run typecheck && npm run test:coverage && npm run build && npm run check:publint && npm run check:exports && npm run check:size",
    "check:publint": "publint",
    "check:exports": "attw --pack .",
    "check:size": "size-limit"
  }
}
```

### Tool Responsibility Matrix

Each concern has **exactly one owner** — no overlap, no gaps. This prevents the "who checks formatting?" ambiguity that plagues setups where ESLint and Prettier fight over semicolons.

| Concern | Tool | Config File | Why This Tool |
|---------|------|-------------|---------------|
| Formatting | Biome | `biome.json` | Single Rust binary replaces Prettier — 25-100× faster, zero config drift between lint and format |
| Linting | Biome | `biome.json` | Same binary as formatting — one tool, one config, one pass. No ESLint plugin hell |
| Type checking | TypeScript | `tsconfig.json` | Language-native type system with strict mode — no alternative exists at this level |
| Testing | Vitest | `vitest.config.ts` | Native ESM support without Babel transforms; built-in V8 coverage; Jest-compatible API |
| Building | tsdown | `tsdown.config.ts` | Rolldown-powered Rust bundler with `workspace: true` monorepo support; ESM-only output |
| Git hooks | Lefthook | `lefthook.yml` | Go binary — no `node_modules/.hooks` fragility; parallel command execution; cross-platform |
| Package validation | publint + attw | — | publint validates exports map; attw verifies TypeScript types resolve for consumers |
| Bundle size | size-limit | `.size-limit.json` | Prevents accidental dependency bloat before publish |
| Dead code | knip | `knip.json` | Detects unused exports, files, and deps that other tools miss |
| Dependency audit | pnpm audit | — | Native pnpm feature — checks against GitHub Advisory Database |

---

## 2. Biome Configuration

> **Why Biome over ESLint + Prettier?** ESLint + Prettier requires 5-15 npm packages (`eslint`, `prettier`, `eslint-config-*`, `eslint-plugin-*`, `eslint-plugin-prettier`, `eslint-config-prettier`), each with its own config and version matrix. Biome is a single Rust binary that formats and lints in one pass — 25-100× faster than the ESLint+Prettier combo. In a 25-package monorepo, this eliminates hundreds of ESLint plugin dependencies and prevents the common "Prettier formatted it, ESLint un-formatted it" feedback loop. Biome's rule set covers >90% of what ESLint + typescript-eslint provides for TypeScript projects.

### Root biome.json (Monorepo)

The root `biome.json` at workspace root defines shared standards. Package-level `biome.json` files extend it:

```jsonc
// packages/*/biome.json
{
  "$schema": "https://biomejs.dev/schemas/2.0.x/schema.json",
  "extends": ["../../biome.json"]
}
```

### Key Rules

| Setting | Value | Rationale |
|---------|-------|-----------|
| `formatter.indentStyle` | `space` | Consistent across editors |
| `formatter.indentWidth` | 2 | Industry standard for JS/TS |
| `formatter.lineWidth` | 100 | Balanced readability |
| `linter.rules.style.useLiteralKeys` | `error` | Prevents `obj['key']` — use `obj.key` |
| `linter.rules.style.noNonNullAssertion` | `error` | Forces proper null handling |
| `linter.rules.correctness.noUnusedImports` | `error` | Clean imports |
| `linter.rules.correctness.noUnusedVariables` | `error` | No dead code |
| `linter.rules.suspicious.noExplicitAny` | `warn` | Migrate away from `any` — `unknown` preferred |

### Override Justification

When `biome-ignore` is necessary, always include a justification:

```typescript
// ✅ Good
// biome-ignore lint/suspicious/noExplicitAny: third-party SDK returns untyped response
const result: any = externalSdk.call();

// ❌ Bad
// biome-ignore lint/suspicious/noExplicitAny
const result: any = externalSdk.call();
```

---

## 3. TypeScript Standards

> **Why strict TypeScript in a financial SDK?** Every `any` type is a potential runtime crash that TypeScript could have caught at compile time. In financial infrastructure, a wrong type (`number` where `bigint` was needed, `string` where `Uint8Array` was expected) can produce silent data corruption — a mis-serialized transaction that burns funds. `strict: true` plus `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes` close the three most common escape hatches that allow type holes into production code.

### Required Flags

All packages must enable `"strict": true`, which includes:

- `strictNullChecks`
- `strictFunctionTypes`
- `strictBindCallApply`
- `strictPropertyInitialization`
- `noImplicitAny`
- `noImplicitThis`
- `alwaysStrict`
- `useUnknownInCatchVariables`

### Additional Required Flags

```jsonc
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,     // Array/record access returns T | undefined
    "exactOptionalPropertyTypes": true,   // Distinguishes missing vs undefined
    "noFallthroughCasesInSwitch": true,
    "forceConsistentCasingInFileNames": true,
    "isolatedModules": true,
    "moduleResolution": "bundler",
    "module": "ESNext",
    "target": "ES2024",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "skipLibCheck": true
  }
}
```

### Type Safety Rules

| Pattern | Rule |
|---------|------|
| `@ts-nocheck` | **Forbidden** — remove and fix errors |
| `@ts-ignore` | **Forbidden** — use `@ts-expect-error` with comment if truly needed |
| `as any` | **Avoid** — use `as unknown as T` with documented justification |
| `any` in function signatures | **Forbidden** — use `unknown` and narrow |
| `Record<string, unknown>` for objects | **Avoid in library code** — define proper interfaces |
| `import type` | **Required** for type-only imports |

### Known Deviations

| Package | Flag Disabled | Reason |
|---------|---------------|--------|
| ride-js | `strict: false` | JS source wrapping Scala.js |
| protobuf-serialization | `exactOptionalPropertyTypes: false` | protobufjs codegen nullability |

---

## 4. Testing Standards

> **Why Vitest over Jest?** Jest requires Babel transforms to handle ESM and TypeScript — a complex, fragile toolchain. Vitest runs ESM natively (no transforms), has built-in V8 coverage (no `istanbul` instrumentation overhead), and shares the same config format as Vite. For a monorepo that's 100% ESM + TypeScript, Vitest eliminates an entire class of "works in source, fails in test" configuration bugs. Its Jest-compatible API means zero learning curve.

### Configuration

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    include: ['test/**/*.spec.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['src/index.ts'],    // Re-export barrel
      reporter: ['text', 'lcov', 'json-summary'],
      thresholds: {
        branches: 85,
        functions: 90,
        lines: 90,
        statements: 90,
      },
    },
    typecheck: { enabled: true },
  },
});
```

### Coverage Thresholds
> **Why these specific thresholds?** Below 80%, too many code paths are untested to have confidence in refactoring. Above 95% (for non-crypto code), you're testing generated code and trivial re-exports with diminishing returns. The 90% established / 80% new / 95% crypto split reflects industry best practice for financial libraries: crypto and signing code demands near-total coverage because a single untested branch can produce invalid signatures; general utility code has lower risk per uncovered line.
| Maturity | Lines | Branches | Functions |
|----------|-------|----------|-----------|
| Established (>1yr) | ≥90% | ≥85% | ≥90% |
| New (<1yr) | ≥80% | ≥75% | ≥80% |
| Critical paths (crypto, signing) | ≥95% | ≥90% | ≥95% |

### Test Requirements

- Every `src/` module has a corresponding test file
- **Negative tests**: Invalid inputs, malformed data, network failures, edge cases
- **Boundary tests**: Zero amounts, max values, empty arrays
- **Symmetry tests**: `encode(decode(x)) === x` for serialization
- No `test.skip` or `test.only` in committed code
- Tests run completely offline (no network calls)
- No hardcoded test seeds matching mainnet addresses

### Test File Naming

| Language | Pattern | Example |
|----------|---------|---------|
| TypeScript | `test/**/*.spec.ts` | `test/serialize.spec.ts` |
| JavaScript | `src/__tests__/**/*.test.js` | `src/__tests__/parse.test.js` |

---

## 5. Build Pipeline

> **Why ESM-only?** CommonJS is a Node.js-specific module system. ESM is the JavaScript language standard, supported by all modern runtimes (Node ≥16, Deno, Bun, browsers). Publishing ESM-only eliminates the dual-package hazard (CJS and ESM copies of the same module loaded simultaneously causing `instanceof` failures and doubled singletons). It enables proper tree-shaking (bundlers can statically analyze `import`/`export`), and reduces package size by ~40% vs dual CJS+ESM. Every consumer of this SDK already supports ESM — there is no CJS-only consumer to support.

> **Why tsdown over tsup/tsc/rollup?** tsdown is Rolldown-powered (Rust) — 5-10× faster than tsup (which uses esbuild, Go). It supports `workspace: true` for monorepo builds, generates `.d.ts` files via TypeScript's own emit (accurate types, not heuristic-based), and produces clean ESM output without the wrapper noise that tsc emits. Unlike raw `tsc`, it bundles and tree-shakes, producing smaller output.

### tsdown Configuration (TypeScript packages)

```typescript
import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: true,
  sourcemap: true,
  clean: true,
  outDir: 'dist',
  splitting: false,
  treeshake: true,
  target: 'es2024',
});
```

### package.json Exports

```jsonc
{
  "type": "module",
  "main": "./dist/index.mjs",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.mjs"
    }
  },
  "files": ["dist", "LICENSE", "README.md"]
}
```

### Validation

After every build, verify with:
- `publint` — validates package.json structure and exports
- `attw --pack .` — validates TypeScript type exports resolve correctly
- `size-limit` — ensures bundle stays within budget

---

## 6. Naming Conventions

### Code Elements

| Element | Convention | Example |
|---------|-----------|---------|
| Files | kebab-case | `order-pair.ts` |
| Classes | PascalCase | `BigNumber` |
| Functions | camelCase | `createOrderPair` |
| Constants | UPPER_SNAKE_CASE | `MAINNET_DATA` |
| Types / Interfaces | PascalCase (prefix `I` for interfaces, `T` for type aliases) | `IConfig`, `TPair` |
| Private methods | camelCase with `_` prefix | `_toLength` |
| Test files | `*.spec.ts` or `*.test.js` | `index.spec.ts` |

### Package Naming

- npm scope: `@decentralchain/`
- Package names: kebab-case
- No `waves`, `keeper`, or upstream branding in names

---

## 7. Source Code Requirements

> **Why these specific bans?** Each banned pattern has caused real incidents in blockchain projects: `Math.random()` produced predictable "random" keys in a browser wallet (CVE-level); `eval()` enabled RCE through a crafted transaction memo; `http://` URLs allowed MITM of a signing request; `innerHTML` enabled XSS that redirected users to a phishing signer. These aren't theoretical — they're the OWASP Top 10 applied to blockchain SDK context.

### Mandatory for Every Source File

- No `@waves` imports except documented wire-format constraints
- No `Math.random()` in crypto/security contexts — use `crypto.getRandomValues()`
- No `eval()`, `new Function()`, `document.write()`, `innerHTML =`
- No hardcoded secrets, API keys, or private keys
- No `http://` URLs in production code
- Use `import type` for type-only imports
- Error messages must be actionable (include expected vs. received)
- Preserve error causes: `throw new Error('msg', { cause: originalError })`
- Exported data should be immutable (`Object.freeze`, `as const`, `readonly`)
- Named exports only (tree-shakeable, no side effects)

### Dead Code Detection

Run `knip` to detect:
- Unused exports
- Unused dependencies
- Unused files
- Duplicate exports

All findings must be resolved except intentional semantic aliases (e.g., `isPublicKey = isHash` where the alias adds domain clarity).

---

## 8. Dependency Policy

> **Why so strict on dependencies?** Every npm dependency is an attack surface. The `event-stream` incident (2018) showed that a single compromised transitive dependency can steal cryptocurrency. For an SDK that handles private keys and transaction signing, each dependency is a potential supply-chain attack vector. Preferring native APIs reduces the attack surface to Node.js itself (which has a dedicated security team and CVE process). The 2-year-since-last-publish rule catches abandoned packages where known vulnerabilities will never be patched.

### Prefer

- Native Node APIs (`crypto`, `buffer`, `util`, `fetch`)
- Well-maintained, audited libraries with TypeScript types
- Pure ESM packages
- Minimal dependency count

### Avoid

- Deprecated packages (`request`, `node-fetch` < v3)
- Heavy dependencies without justification
- Packages with native bindings (unless critical)
- `@waves/*` packages (vendor/inline if needed)
- Packages last published >2 years ago
- Packages with `postinstall` scripts from untrusted sources

### Before Adding a Dependency

1. Check npm for maintenance status and vulnerability reports
2. Check bundle size on bundlephobia  
3. Run `npm audit` after install
4. Verify ESM support (`"type": "module"` or `"exports"` field)
5. Prefer packages with included TypeScript types (no `@types/` needed)
6. Run `npm ls <package>` to check for duplicate versions

---

## 9. Git & Commit Conventions

> **Why Conventional Commits with Jira IDs?** Conventional Commit prefixes (`feat`, `fix`, `refactor`) enable automated changelog generation and semantic version bumping — Nx Release reads these to determine whether a change is a patch, minor, or major. The `DCC-###` Jira ID creates a traceable chain from business requirement → code change → released version, which is essential for audit compliance in financial software. Without this, a "why was this changed?" question requires git archaeology.

### Commit Format

```
<type>(DCC-###): <lowercase imperative description>
```

Types: `feat` · `fix` · `docs` · `style` · `refactor` · `perf` · `test` · `build` · `ci` · `chore` · `revert`

### Branch Names

```
<type>/DCC-###-short-description
```

Examples:
- `feat/DCC-15-proto-reserved-directive`
- `fix/DCC-42-signing-edge-case`
- `refactor/DCC-28-extract-shared-module`

### PR Titles

Same format as commits: `<type>(DCC-###): <description>`

### Traceability Chain

Every change must be linked: **Jira ticket → Git branch → Commits → PR → Merge**

The `DCC-###` identifier is the universal link across all surfaces.

---

## 10. File Templates

### tsconfig.json (TypeScript package)

```jsonc
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "rootDir": "src",
    "outDir": "dist",
    "composite": true
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist", "test"]
}
```

### biome.json (Package-level)

```jsonc
{
  "$schema": "https://biomejs.dev/schemas/2.0.x/schema.json",
  "extends": ["../../biome.json"]
}
```

### lefthook.yml

```yaml
pre-commit:
  parallel: true
  commands:
    biome:
      glob: "*.{js,ts,mjs,cjs,mts,cts,jsx,tsx,json,jsonc}"
      run: npx biome check --write --no-errors-on-unmatched --files-ignore-unknown=true {staged_files}
      stage_fixed: true
    typecheck:
      run: npx tsc --noEmit
```

### knip.json

```jsonc
{
  "$schema": "https://unpkg.com/knip@latest/schema.json",
  "entry": ["src/index.ts"],
  "project": ["src/**/*.ts"],
  "ignore": ["dist/**"],
  "ignoreDependencies": []
}
```

### .editorconfig

```ini
root = true

[*]
end_of_line = lf
insert_final_newline = true
charset = utf-8
indent_style = space
indent_size = 2
trim_trailing_whitespace = true

[*.md]
trim_trailing_whitespace = false
```

### .npmrc

```ini
access=public
git-tag-version=false
```

---

## 11. Governance Documents

Every published package must include:

| File | Purpose |
|------|---------|
| `README.md` | Package overview, API docs, installation, scripts |
| `CONTRIBUTING.md` | Setup, workflow, PR process, commit conventions |
| `SECURITY.md` | Vulnerability reporting, supported versions, SLAs |
| `CODE_OF_CONDUCT.md` | Contributor Covenant v2.1 |
| `CHANGELOG.md` | Keep a Changelog format, SemVer |
| `LICENSE` | MIT |

### README Section Order

1. Badges (CI, npm version, license, Node.js, TypeScript)
2. One-line description
3. Expanded description (2-3 sentences)
4. Requirements
5. Installation
6. Quick Start
7. API Reference
8. Browser (if applicable)
9. Development (prerequisites, setup, scripts table, quality gates)
10. Contributing → link
11. Security → link
12. Code of Conduct → link
13. Changelog → link
14. License

---

## 12. Success Criteria

A package is considered production-ready when ALL of the following pass with zero errors:

```bash
pnpm run lint:check       # No lint or formatting issues
pnpm run typecheck        # No type errors
pnpm run test:coverage    # All tests pass, coverage thresholds met
pnpm run build            # Clean build output
pnpm run check:publint    # Package structure valid
pnpm run check:exports    # Type exports resolve correctly
pnpm run check:size       # Within bundle size budget
pnpm pack --dry-run       # Package contents correct
```

### Quality Bar

These packages are the **official SDK for DecentralChain developers worldwide**. Every package must meet the standard:

- **Long-term maintenance**: Clear code, comprehensive tests, automated tooling
- **Security**: Input validation, immutable data, minimal dependencies
- **Scalability**: Tree-shakeable, ESM-native, appropriate bundle sizes
- **Professional standards**: Governance docs, CI/CD, semantic versioning
- **Institutional credibility**: Consistent branding, quality gates, provenance

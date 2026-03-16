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

Every step must pass with zero errors before the next runs.

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

| Concern | Tool | Config File |
|---------|------|-------------|
| Formatting | Biome | `biome.json` |
| Linting | Biome | `biome.json` |
| Type checking | TypeScript | `tsconfig.json` |
| Testing | Vitest | `vitest.config.ts` |
| Building | tsdown | `tsdown.config.ts` |
| Git hooks | Lefthook | `lefthook.yml` |
| Package validation | publint + attw | — |
| Bundle size | size-limit | `.size-limit.json` |
| Dead code | knip | `knip.json` |
| Dependency audit | pnpm audit | — |

---

## 2. Biome Configuration

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

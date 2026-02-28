# Modernization Prompt — `@decentralchain/money-like-to-node`

> **Version**: 1.1.0 — February 28, 2026
> **Scope**: `@waves/money-like-to-node` → `@decentralchain/money-like-to-node`
> **Goal**: Transform into a **production-grade, institutionally credible** `@decentralchain/*` package
>
> **Important**: This prompt is designed to be **timeless**. All dependency versions
> use `"latest"` semantics — the AI executing this prompt must resolve them to the
> latest stable versions at execution time. Dated references (e.g. `# ~X.Y.Z as of Feb 2026`)
> are provided only as sanity-check baselines, NOT as pins.

---

## How to Use This File

1. **Open the target repository** (this `@decentralchain/money-like-to-node` package).
2. **Copy everything below the `--- BEGIN PROMPT ---` line** into your AI assistant.
3. The `[VARIABLES]` section is **pre-filled** for this project.
4. The AI will produce every file needed for a fully modernized library.

All decisions below are **pre-made**. The AI should NOT ask for permission — it should execute.

---

## --- BEGIN PROMPT ---

You are modernizing a DecentralChain SDK library. Apply EVERY specification below exactly. Do not skip steps, do not invent protocol behavior, and do not modify source files not listed.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## [VARIABLES] — Pre-Filled for money-like-to-node

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

```yaml
# ── Identity ──────────────────────────────────────────────────────
PACKAGE_NAME: '@decentralchain/money-like-to-node'
PACKAGE_VERSION: '1.0.0'
DESCRIPTION: 'Converts human-readable money-like objects to DecentralChain blockchain node API format'
KEYWORDS:
  - decentralchain
  - dcc
  - money
  - transaction
  - converter
  - blockchain
  - node-api

# ── Repository ────────────────────────────────────────────────────
REPO_ORG: 'Decentral-America'
REPO_NAME: 'money-like-to-node'
AUTHOR: 'DecentralChain'

# ── Source Language ───────────────────────────────────────────────
SOURCE_LANG: 'typescript'

# ── Build Target ──────────────────────────────────────────────────
FORMATS: ['esm', 'cjs']
UMD_GLOBAL_NAME: ''

# ── Node.js ───────────────────────────────────────────────────────
MIN_NODE: '22'
RECOMMENDED_NODE: '24'
NODE_MATRIX: [22, 24]

# ── Quality ───────────────────────────────────────────────────────
COVERAGE_THRESHOLDS:
  branches: 90
  functions: 90
  lines: 90
  statements: 90

# ── Size Budget ───────────────────────────────────────────────────
SIZE_LIMIT_PATH: './dist/index.mjs'
SIZE_LIMIT: '10 kB'
SIZE_LIMIT_IMPORT: '{ toNode, convert }'

# ── Optional Features ─────────────────────────────────────────────
USE_CHANGESETS: false
HAS_BROWSER_BUNDLE: false
HAS_VENDOR_CODE: false
NEEDS_TYPES_NODE: false

# ── Dependencies ──────────────────────────────────────────────────
PRODUCTION_DEPS:
  - '@decentralchain/ts-types: ^1.0.0'   # currently aliased as npm:@waves/ts-types@^0.3.3
DEV_ONLY_DEPS:
  - '@decentralchain/data-entities: ^1.0.0'  # test-only, currently aliased as npm:@waves/data-entities@^1.10.1

# ── Previous Version Info ─────────────────────────────────────────
PREVIOUS_SCOPE: '@waves'
PREVIOUS_VERSION: '0.1.9'
PREVIOUS_BUILD_TOOL: 'tsc'
PREVIOUS_TEST_RUNNER: 'jest'
PREVIOUS_PM: 'npm'

# ── Version Resolution (auto-resolved at execution time) ─────────
# The AI executing this prompt MUST resolve these to latest stable versions.
# Do NOT fill these in manually — they are resolved dynamically.
# LATEST_NPM: ''               # e.g. "11.9.0" — run `npm --version`
# LATEST_ACTIONS_CHECKOUT: ''   # e.g. "v6" — check github.com/actions/checkout/releases
# LATEST_ACTIONS_SETUP_NODE: '' # e.g. "v6" — check github.com/actions/setup-node/releases
# LATEST_ACTIONS_UPLOAD_ARTIFACT: '' # e.g. "v7" — check github.com/actions/upload-artifact/releases
# LATEST_TS_MAJOR: ''           # e.g. "5.9" — run `npm info typescript version`
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## VERSION RESOLUTION (CRITICAL — Read Before Executing)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

This prompt is **version-agnostic by design**. All dependency versions, GitHub
Actions tags, and tool versions use `{{LATEST}}` placeholders.

**Before generating any file**, resolve every `{{LATEST}}` to the **current latest
stable version** at execution time:

1. **npm packages**: Run `npm info <package> version` or check npmjs.com.
2. **GitHub Actions**: Check the latest release/tag on the action's GitHub repo
   (e.g. `actions/checkout` → use the latest major tag like `v6`, not `v4`).
3. **`packageManager` field**: Use the latest stable npm version (`npm --version`).
4. **`@types/node`**: Pin to the major matching `MIN_NODE` (e.g. if `MIN_NODE=22`,
   use `@types/node@^22.x.x`), NOT the absolute latest which may target a newer Node.
5. **TypeScript badge**: Use the latest stable TypeScript major.minor (e.g. `5.9`).

Dated reference comments (e.g. `# ~X.Y.Z as of Feb 2026`) are **baselines only**.
If the current version is significantly newer, that's expected — use the newer version.
If the current version is _older_ than the baseline, something may be wrong — verify.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## BRANDING & INDEPENDENCE (CRITICAL)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Replace ALL Waves-specific values:

| Category                | Waves → DecentralChain                                                     |
| ----------------------- | -------------------------------------------------------------------------- |
| Package scope           | `@waves/*` → `@decentralchain/*`                                           |
| Token name              | `WAVES` → `DCC`                                                            |
| API endpoints           | `nodes.wavesnodes.com` → DecentralChain equivalents                        |
| Network byte / chain ID | Waves chain IDs → DecentralChain equivalents                               |
| Address prefixes        | Waves format → DecentralChain format                                       |
| Explorer links          | `wavesexplorer.com` → DecentralChain explorer                              |
| Default nodes           | Waves nodes → DecentralChain nodes                                         |
| Fee structures          | Waves fees → DecentralChain rules                                          |
| Author/org              | `Wavesplatform` / `wavesplatform` → `DecentralChain` / `Decentral-America` |
| README badges           | Waves URLs → DecentralChain URLs                                           |

**If equivalents are unknown → ask. Do NOT invent protocol behavior.**

The final package MUST:

- NOT require Waves nodes
- NOT depend on Waves APIs or SDKs
- NOT import `@waves/*` packages
- NOT reference Waves branding anywhere (code, comments, docs, config)
- Function as a standalone DecentralChain library

### Current Waves Contamination (Pre-Audit Results)

The following Waves references remain in the current codebase and **must be resolved**:

1. **`package.json`** — npm alias dependencies still resolve to `@waves/*` packages:
   - `"@decentralchain/ts-types": "npm:@waves/ts-types@^0.3.3"` — must point to a real `@decentralchain/ts-types` package
   - `"@decentralchain/data-entities": "npm:@waves/data-entities@^1.10.1"` — must point to a real `@decentralchain/data-entities` package
2. **`.github/workflows/ci.yml`** — contains Waves audit job referencing "waves" strings (intentional — audit code)
3. **`.github/ISSUE_TEMPLATE/bug_report.md`** — assignee `jahsus-waves` must be updated
4. **`.github/ISSUE_TEMPLATE/feature_request.md`** — assignee `jahsus-waves` must be updated
5. **`README.md`** — migration notice references `@waves/money-like-to-node` (acceptable in historical context)
6. **`package-lock.json`** — contains resolved `@waves/*` URLs (will be regenerated)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## ARCHITECTURAL DECISIONS (Pre-Made)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

These are final. Do not deviate.

| Decision           | Choice                         | Rationale                                         |
| ------------------ | ------------------------------ | ------------------------------------------------- |
| Module system      | ESM-first (`"type": "module"`) | Industry standard 2025+                           |
| Package manager    | npm (latest)                   | Universal, no extra tooling                       |
| Test runner        | Vitest                         | Fast, ESM-native, Jest-compatible API             |
| Coverage           | `@vitest/coverage-v8`          | V8-native, fast, threshold enforcement            |
| Linter             | ESLint (flat config)           | `eslint.config.mjs` with `@eslint/js`             |
| TS ESLint          | `typescript-eslint` (strict)   | Type-aware rules for TS projects                  |
| Formatter          | Prettier                       | Via `eslint-config-prettier` to avoid conflicts   |
| Git hooks          | Husky v9+                      | `prepare` script auto-installs                    |
| Staged linting     | lint-staged                    | Runs Prettier + ESLint on staged files only       |
| Package validation | publint + attw                 | Ensures correct exports for all consumers         |
| Bundle size        | size-limit                     | Enforced budget per entry point                   |
| CI                 | GitHub Actions                 | Matrix across Node versions                       |
| Dependency updates | Dependabot                     | Weekly, grouped by dev/prod                       |
| Changelog          | Keep a Changelog format        | Manual or Changesets                              |
| Build (TypeScript) | tsup                           | ESM + CJS + optional IIFE, DTS generation         |

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## FILE-BY-FILE SPECIFICATIONS

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

### Files to DELETE

Remove these if they exist:

```
yarn.lock
.babelrc
.travis.yml
.npmignore          (use "files" in package.json instead)
jest.config.js
jest.config.ts
tslint.json
webpack.config.js
webpack.config.ts
rollup.config.js
tsconfig.build.json (consolidate into tsconfig.json)
.eslintrc*          (replaced by flat config)
.eslintignore       (use ignores in flat config)
```

### `.node-version`

```
24
```

### `.npmrc`

```
engine-strict=true
save-exact=true
package-lock=true
```

### `.editorconfig`

```editorconfig
# https://editorconfig.org
root = true

[*]
charset = utf-8
end_of_line = lf
indent_style = space
indent_size = 2
insert_final_newline = true
trim_trailing_whitespace = true

[*.md]
trim_trailing_whitespace = false

[*.{json,yml,yaml}]
indent_size = 2
```

### `.prettierrc.json`

```json
{
  "semi": true,
  "trailingComma": "all",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "arrowParens": "always",
  "endOfLine": "lf"
}
```

### `.prettierignore`

```
dist
coverage
node_modules
*.cjs
*.mjs
*.d.ts
*.d.cts
*.map
LICENSE
CHANGELOG.md
package-lock.json
```

### `.gitignore`

```gitignore
# IDE
.idea
.vscode
*.swp
*.swo

# Build output
dist
coverage
*.tsbuildinfo

# Dependencies
node_modules

# OS
.DS_Store
Thumbs.db

# Misc
.size-snapshot.json
.rpt2_cache
*.local
```

### `.husky/pre-commit`

```
npx lint-staged && npm run typecheck
```

### `LICENSE`

```
MIT License

Copyright (c) 2026-present DecentralChain

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

### `package.json`

```jsonc
{
  "name": "@decentralchain/money-like-to-node",
  "version": "1.0.0",
  "description": "Converts human-readable money-like objects to DecentralChain blockchain node API format",
  "type": "module",
  "packageManager": "npm@{{LATEST_NPM}}", // resolve to latest stable npm (~11.9.0 as of Feb 2026)
  "exports": {
    ".": {
      "import": {
        "types": "./dist/index.d.ts",
        "default": "./dist/index.mjs"
      },
      "require": {
        "types": "./dist/index.d.cts",
        "default": "./dist/index.cjs"
      }
    }
  },
  "main": "./dist/index.cjs",
  "module": "./dist/index.mjs",
  "types": "./dist/index.d.ts",
  "sideEffects": false,
  "files": ["dist", "LICENSE", "README.md"],
  "engines": { "node": ">=22" },
  "publishConfig": { "access": "public", "provenance": true },
  "repository": {
    "type": "git",
    "url": "git+https://github.com/Decentral-America/money-like-to-node.git"
  },
  "funding": {
    "type": "github",
    "url": "https://github.com/sponsors/Decentral-America"
  },
  "homepage": "https://github.com/Decentral-America/money-like-to-node#readme",
  "bugs": { "url": "https://github.com/Decentral-America/money-like-to-node/issues" },
  "scripts": {
    "build": "tsup",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "typecheck": "tsc --noEmit",
    "lint": "eslint .",
    "lint:fix": "eslint . --fix",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "check:publint": "publint",
    "check:exports": "attw --pack .",
    "check:size": "size-limit",
    "validate": "npm run format:check && npm run lint && npm run typecheck && npm run test && npm run build && npm run check:publint && npm run check:exports && npm run check:size",
    "bulletproof": "npm run format && npm run lint:fix && npm run typecheck && npm run test",
    "bulletproof:check": "npm run format:check && npm run lint && npm run typecheck && npm run test",
    "prepare": "husky",
    "prepack": "npm run build",
    "postversion": "npm publish",
    "postpublish": "git push"
  },
  "lint-staged": {
    "*.ts": ["prettier --write", "eslint --fix"],
    "*.json": ["prettier --write"]
  },
  "size-limit": [
    {
      "path": "./dist/index.mjs",
      "limit": "10 kB",
      "import": "{ toNode, convert }"
    }
  ],
  "keywords": [
    "decentralchain",
    "dcc",
    "money",
    "transaction",
    "converter",
    "blockchain",
    "node-api"
  ],
  "author": "DecentralChain",
  "license": "MIT",
  "dependencies": {
    "@decentralchain/ts-types": "^1.0.0"
  },
  "devDependencies": {
    // ⚠️  IMPORTANT: Resolve ALL versions below to the latest stable at execution time.
    //    Run `npm info <package> version` or check npmjs.com for each.
    //    Dated references (as of Feb 2026) are provided as sanity-check baselines only.
    "@arethetypeswrong/cli": "{{LATEST}}",         // ~0.18.2 as of Feb 2026
    "@decentralchain/data-entities": "{{LATEST}}",  // test-only dependency
    "@eslint/js": "{{LATEST}}",                    // ~10.0.1 as of Feb 2026
    "@size-limit/preset-small-lib": "{{LATEST}}",  // ~12.0.0 as of Feb 2026
    "@vitest/coverage-v8": "{{LATEST}}",           // ~4.0.18 as of Feb 2026
    "eslint": "{{LATEST}}",                        // ~10.0.2 as of Feb 2026
    "eslint-config-prettier": "{{LATEST}}",        // ~10.1.8 as of Feb 2026
    "globals": "{{LATEST}}",                       // ~17.3.0 as of Feb 2026
    "husky": "{{LATEST}}",                         // ~9.1.7 as of Feb 2026
    "lint-staged": "{{LATEST}}",                   // ~16.2.7 as of Feb 2026
    "prettier": "{{LATEST}}",                      // ~3.8.1 as of Feb 2026
    "publint": "{{LATEST}}",                       // ~0.3.17 as of Feb 2026
    "size-limit": "{{LATEST}}",                    // ~12.0.0 as of Feb 2026
    "tsup": "{{LATEST}}",                          // ~8.5.1 as of Feb 2026
    "typescript": "{{LATEST}}",                    // ~5.9.3 as of Feb 2026
    "typescript-eslint": "{{LATEST}}",             // ~8.56.1 as of Feb 2026
    "vitest": "{{LATEST}}"                         // ~4.0.18 as of Feb 2026
  }
}
```

---

### `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2024",
    "lib": ["ES2024"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "verbatimModuleSyntax": true,
    "isolatedModules": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "./dist",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitOverride": true,
    "noPropertyAccessFromIndexSignature": true,
    "forceConsistentCasingInFileNames": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "exclude": ["node_modules", "dist"],
  "include": ["src/**/*.ts"]
}
```

---

### `tsup.config.ts`

```typescript
import { defineConfig } from 'tsup';

export default defineConfig([
  {
    entry: ['src/index.ts'],
    format: ['esm', 'cjs'],
    dts: true,
    sourcemap: true,
    clean: true,
    outDir: 'dist',
    splitting: false,
    treeshake: true,
    target: 'es2024',
    outExtension({ format }) {
      return { js: format === 'esm' ? '.mjs' : '.cjs' };
    },
  },
]);
```

---

### `vitest.config.ts`

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    include: ['test/**/*.spec.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['src/index.ts'],
      reporter: ['text', 'lcov', 'json-summary'],
      thresholds: {
        branches: 90,
        functions: 90,
        lines: 90,
        statements: 90,
      },
    },
    reporters: ['default'],
    typecheck: { enabled: true },
  },
});
```

---

### `eslint.config.mjs`

```javascript
import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import prettierConfig from 'eslint-config-prettier';
import { defineConfig, globalIgnores } from 'eslint/config';

export default defineConfig([
  globalIgnores(['dist', 'node_modules', 'coverage']),

  // ── Source files (type-aware) ──────────────────────────────────
  {
    files: ['src/**/*.ts'],
    extends: [
      js.configs.recommended,
      tseslint.configs.strictTypeChecked,
      tseslint.configs.stylisticTypeChecked,
      prettierConfig,
    ],
    languageOptions: {
      ecmaVersion: 'latest',
      globals: globals.node,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-namespace': 'off',
      '@typescript-eslint/restrict-template-expressions': 'off',
      '@typescript-eslint/no-unnecessary-condition': 'warn',
      '@typescript-eslint/prefer-nullish-coalescing': 'warn',
      '@typescript-eslint/prefer-optional-chain': 'warn',
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],
      '@typescript-eslint/consistent-type-exports': 'error',
    },
  },

  // ── Test files (relaxed) ───────────────────────────────────────
  {
    files: ['test/**/*.ts'],
    extends: [js.configs.recommended, tseslint.configs.recommended, prettierConfig],
    languageOptions: {
      ecmaVersion: 'latest',
      globals: { ...globals.node },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
      ],
    },
  },
]);
```

---

### `.github/workflows/ci.yml`

```yaml
name: CI

on:
  push:
    branches: [main, master, develop]
  pull_request:
    branches: [main, master, develop]

permissions:
  contents: read

concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: true

jobs:
  quality:
    name: Quality Gate (Node ${{ matrix.node-version }})
    runs-on: ubuntu-latest
    strategy:
      fail-fast: false
      matrix:
        node-version: [22, 24]
    steps:
      - uses: actions/checkout@{{LATEST_ACTIONS_CHECKOUT}}

      - name: Setup Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@{{LATEST_ACTIONS_SETUP_NODE}}
        with:
          node-version: ${{ matrix.node-version }}
          cache: npm

      - name: Install dependencies
        run: npm ci

      - name: Formatting check
        run: npm run format:check

      - name: Lint
        run: npm run lint

      - name: Type check
        run: npm run typecheck

      - name: Test with coverage
        run: npm run test:coverage

      - name: Build
        run: npm run build

      - name: Validate package exports (publint)
        run: npm run check:publint

      - name: Validate type exports (attw)
        run: npm run check:exports

      - name: Check bundle size
        run: npm run check:size

      - name: Check package contents
        run: |
          npm pack --dry-run 2>&1 | tail -5
          echo "---"
          du -sh dist/

      - name: Upload coverage
        if: matrix.node-version == 24
        uses: actions/upload-artifact@{{LATEST_ACTIONS_UPLOAD_ARTIFACT}}
        with:
          name: coverage-report
          path: coverage/
          retention-days: 14

  release-dry-run:
    name: Release Dry Run
    runs-on: ubuntu-latest
    needs: quality
    if: github.ref == 'refs/heads/main' || github.ref == 'refs/heads/master'
    steps:
      - uses: actions/checkout@{{LATEST_ACTIONS_CHECKOUT}}
      - uses: actions/setup-node@{{LATEST_ACTIONS_SETUP_NODE}}
        with:
          node-version: 24
          cache: npm
      - run: npm ci
      - run: npm run build
      - run: npm pack --dry-run
```

### `.github/dependabot.yml`

```yaml
version: 2
updates:
  - package-ecosystem: npm
    directory: /
    schedule:
      interval: weekly
      day: monday
    open-pull-requests-limit: 10
    reviewers:
      - Decentral-America
    labels:
      - dependencies
    commit-message:
      prefix: 'chore(deps):'
    groups:
      dev-dependencies:
        dependency-type: development
        update-types: [minor, patch]
      production-dependencies:
        dependency-type: production
        update-types: [minor, patch]

  - package-ecosystem: github-actions
    directory: /
    schedule:
      interval: weekly
    labels:
      - ci
    commit-message:
      prefix: 'ci:'
```

### `.github/ISSUE_TEMPLATE/bug_report.md`

```markdown
---
name: Bug report
about: Create a report to help us improve
title: '[BUG]'
labels: bug
assignees: ''
---

**Describe the bug**
A clear and concise description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:

1. ...
2. ...

**Expected behavior**
What you expected to happen.

**Environment:**

- OS: [e.g. Ubuntu 24.04]
- Node.js: [e.g. 24.0.0]
- Package version: [e.g. 1.0.0]

**Additional context**
Any other context about the problem.
```

### `.github/ISSUE_TEMPLATE/feature_request.md`

```markdown
---
name: Feature request
about: Suggest an idea for this project
title: '[FEATURE]'
labels: feature
assignees: ''
---

**Abstract**
Is your feature request related to a problem? Please describe.

**Motivation and Purposes**
Why is this needed?

**Specification**
Describe the desired behavior. Include API examples if applicable.

**Backwards Compatibility**
Can this affect existing features?
```

---

### Governance Documents

#### `CONTRIBUTING.md`

```markdown
# Contributing to @decentralchain/money-like-to-node

Thank you for your interest in contributing!

## Code of Conduct

By participating, you agree to abide by our [Code of Conduct](./CODE_OF_CONDUCT.md).

## Prerequisites

- **Node.js** >= 22 (24 recommended — see `.node-version`)
- **npm** >= 10 (latest LTS recommended)

## Setup

\`\`\`bash
git clone https://github.com/Decentral-America/money-like-to-node.git
cd money-like-to-node
npm install
\`\`\`

## Scripts

| Command                     | Description                              |
| --------------------------- | ---------------------------------------- |
| `npm run build`             | Build distribution files                 |
| `npm test`                  | Run tests with Vitest                    |
| `npm run test:watch`        | Tests in watch mode                      |
| `npm run test:coverage`     | Tests with V8 coverage                   |
| `npm run typecheck`         | TypeScript type checking                 |
| `npm run lint`              | ESLint                                   |
| `npm run lint:fix`          | ESLint with auto-fix                     |
| `npm run format`            | Format with Prettier                     |
| `npm run validate`          | Full CI validation pipeline              |
| `npm run bulletproof`       | Format + lint fix + typecheck + test     |
| `npm run bulletproof:check` | CI-safe: check format + lint + tc + test |

## Workflow

1. Fork → branch from `main` (`feat/my-feature`)
2. Make changes with tests
3. `npm run bulletproof`
4. Commit with [Conventional Commits](https://www.conventionalcommits.org/)
5. Push → open PR

### Commit Convention

\`\`\`
feat: add new method
fix: handle edge case
docs: update API reference
chore: bump dependencies
test: add coverage for X
refactor: simplify implementation
\`\`\`

## Standards

- **Strict mode** — all TypeScript strict flags enabled
- **Prettier** — auto-formatting on commit
- **Coverage** — thresholds enforced (90%+)
- **Immutable** — operations return new instances where applicable

## PR Checklist

- [ ] Tests added/updated
- [ ] `npm run bulletproof` passes
- [ ] Documentation updated if needed
- [ ] Commit messages follow conventional commits
```

#### `SECURITY.md`

```markdown
# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.x     | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

**Do NOT open a public GitHub issue.**

Email **info@decentralchain.io** with:

1. Description of the vulnerability
2. Steps to reproduce
3. Potential impact assessment
4. Suggested fix (optional)

### Timeline

- **Acknowledgement**: 48 hours
- **Assessment**: 5 business days
- **Critical patch**: 14 days
- **Lower severity**: 30 days

## Best Practices

- Use the latest supported version
- Pin dependencies with lockfiles
- Run `npm audit` regularly
```

#### `CODE_OF_CONDUCT.md`

Use **Contributor Covenant v2.1** verbatim from
<https://www.contributor-covenant.org/version/2/1/code_of_conduct.html>

Enforcement contact: `info@decentralchain.io`

#### `CHANGELOG.md`

```markdown
# Changelog

Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
Versioning: [Semantic Versioning](https://semver.org/spec/v2.0.0.html)

## [1.0.0] - 2026-02-28

### Changed

- **BREAKING**: Migrated to pure ESM (`"type": "module"`).
- Minimum Node.js version is now 22.
- Replaced jest with Vitest.
- Replaced tsc with tsup.
- Upgraded all dependencies to latest versions.
- Rebranded from `@waves` to `@decentralchain`.

### Added

- TypeScript strict mode with full type definitions.
- ESLint flat config with Prettier integration.
- Husky + lint-staged pre-commit hooks.
- GitHub Actions CI pipeline (Node [22, 24]).
- Dependabot for automated dependency updates.
- Code coverage with threshold enforcement (90%+).
- CONTRIBUTING.md, SECURITY.md, CODE_OF_CONDUCT.md.

### Removed

- Legacy build tooling (tsc direct compilation).
- jest test runner and ts-jest.
- All Waves branding and references.
- npm alias dependencies pointing to `@waves/*` packages.
```

---

### `README.md` Structure

```markdown
# @decentralchain/money-like-to-node

[![CI](https://github.com/Decentral-America/money-like-to-node/actions/workflows/ci.yml/badge.svg)](https://github.com/Decentral-America/money-like-to-node/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/@decentralchain/money-like-to-node)](https://www.npmjs.com/package/@decentralchain/money-like-to-node)
[![license](https://img.shields.io/npm/l/@decentralchain/money-like-to-node)](./LICENSE)
[![Node.js](https://img.shields.io/node/v/@decentralchain/money-like-to-node)](./package.json)
[![TypeScript](https://img.shields.io/badge/TypeScript-{{LATEST_TS_MAJOR}}-blue.svg)](https://www.typescriptlang.org/)

Converts human-readable money-like objects to DecentralChain blockchain node API format.

This library transforms GUI-friendly transaction data (using Money objects, BigNumber instances, and
money-like `{ coins, assetId }` structures) into the raw string-based format expected by the
DecentralChain node API. It supports all 17 transaction types plus exchange orders.

## Requirements

- **Node.js** >= 22
- **npm** >= 10

## Installation

\`\`\`bash
npm install @decentralchain/money-like-to-node
\`\`\`

## Quick Start

\`\`\`typescript
import { toNode } from '@decentralchain/money-like-to-node';

// Convert a GUI transfer transaction to node format
const nodeTransaction = toNode({
  type: 4,              // TRANSFER
  version: 1,
  senderPublicKey: 'EM1XUpKdct1eE2mgmdvr4VA4raXMKvYKumCbnArtcQ9c',
  timestamp: Date.now(),
  fee: { coins: '1000000', assetId: 'DCC' },
  amount: { coins: '100000', assetId: 'DCC' },
  recipient: 'address...',
});
\`\`\`

## API Reference

### `toNode(item)`

Converts a single GUI transaction entity or exchange order into the node API format.

- **Parameters**: `item` — A `TDCCGuiEntity` (transaction) or `IDCCGuiExchangeOrder` (order)
- **Returns**: The transaction/order in node format with all monetary values as strings

Supported transaction types:
| Type | Name             | Type ID |
|------|------------------|---------|
| 3    | Issue            | `TYPES.ISSUE` |
| 4    | Transfer         | `TYPES.TRANSFER` |
| 5    | Reissue          | `TYPES.REISSUE` |
| 6    | Burn             | `TYPES.BURN` |
| 7    | Exchange         | `TYPES.EXCHANGE` |
| 8    | Lease            | `TYPES.LEASE` |
| 9    | Cancel Lease     | `TYPES.CANCEL_LEASE` |
| 10   | Alias            | `TYPES.ALIAS` |
| 11   | Mass Transfer    | `TYPES.MASS_TRANSFER` |
| 12   | Data             | `TYPES.DATA` |
| 13   | Set Script       | `TYPES.SET_SCRIPT` |
| 14   | Sponsorship      | `TYPES.SPONSORSHIP` |
| 15   | Set Asset Script | `TYPES.SET_ASSET_SCRIPT` |
| 16   | Invoke Script    | `TYPES.INVOKE_SCRIPT` |
| 17   | Update Asset Info| `TYPES.UPDATE_ASSET_INFO` |

### `convert(tx, factory)`

Generic converter that applies a factory function to transform monetary values within any transaction type.

- **Parameters**:
  - `tx` — A typed transaction or exchange order
  - `factory` — A function `(value: FROM) => TO` applied to all monetary fields
- **Returns**: The transaction with all monetary fields transformed

### Individual converters

Each transaction type also has a standalone converter exported from `converters`:

\`\`\`typescript
import { convert } from '@decentralchain/money-like-to-node';
\`\`\`

## Development

### Prerequisites

- Node.js >= 22 (24 recommended)
- npm >= 10

### Setup

\`\`\`bash
git clone https://github.com/Decentral-America/money-like-to-node.git
cd money-like-to-node
npm install
\`\`\`

### Scripts

| Command                     | Description                              |
| --------------------------- | ---------------------------------------- |
| `npm run build`             | Build distribution files via tsup        |
| `npm test`                  | Run tests with Vitest                    |
| `npm run test:watch`        | Tests in watch mode                      |
| `npm run test:coverage`     | Tests with V8 coverage                   |
| `npm run typecheck`         | TypeScript type checking                 |
| `npm run lint`              | ESLint                                   |
| `npm run format`            | Format with Prettier                     |
| `npm run validate`          | Full CI validation pipeline              |
| `npm run bulletproof`       | Format + lint fix + typecheck + test     |

### Quality Gates

All of the following must pass before merge:

- Prettier formatting check
- ESLint with TypeScript strict rules
- TypeScript type checking (`tsc --noEmit`)
- Vitest tests with 90%+ coverage
- publint package validation
- attw type export validation
- size-limit bundle budget (10 kB)

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md).

## Security

See [SECURITY.md](./SECURITY.md).

## Code of Conduct

See [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md).

## Changelog

See [CHANGELOG.md](./CHANGELOG.md).

## License

[MIT](./LICENSE)
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## SOURCE CODE REQUIREMENTS

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

### Project-Specific Source Structure

This library has the following source organization:

```
src/
├── index.ts              # Barrel — re-exports convert and toNode
├── constants/
│   └── index.ts          # TYPES (transaction type IDs) and ALIAS constants
├── converters/
│   └── index.ts          # Generic convert() function and per-type converters
├── core/
│   └── factory.ts        # Transform factory — maps transform objects to output
├── toNodeEntities/
│   ├── index.ts          # toNode() dispatcher + type exports
│   ├── general.ts        # getDefaultTransform() base for all transactions
│   ├── alias.ts          # Alias transaction (type 10)
│   ├── burn.ts           # Burn transaction (type 6)
│   ├── cancelLease.ts    # Cancel Lease transaction (type 9)
│   ├── data.ts           # Data transaction (type 12)
│   ├── exchange.ts       # Exchange transaction (type 7) + order mapping
│   ├── invokeScript.ts   # Invoke Script transaction (type 16)
│   ├── issue.ts          # Issue transaction (type 3)
│   ├── lease.ts          # Lease transaction (type 8)
│   ├── massTransfer.ts   # Mass Transfer transaction (type 11)
│   ├── reissue.ts        # Reissue transaction (type 5)
│   ├── setAssetScript.ts # Set Asset Script transaction (type 15)
│   ├── setScript.ts      # Set Script transaction (type 13)
│   ├── sponsorship.ts    # Sponsorship transaction (type 14)
│   ├── transfer.ts       # Transfer transaction (type 4)
│   └── updateAssetInfo.ts # Update Asset Info transaction (type 17)
├── types/
│   └── index.ts          # IMoney, IMoneyLike, IBigNum, TLong, TMoney types
├── utils/
│   ├── index.ts          # Re-export barrel
│   └── utils.ts          # Utility functions (getAssetId, getCoins, curry, pipe, etc.)
└── validators/
    └── index.ts          # Validation utilities (required, isBase64, isString, etc.)
```

### Key Dependencies

- **`@decentralchain/ts-types`** — Transaction type interfaces (`ITransferTransaction`, `IExchangeTransaction`, etc.)
  - Currently aliased to `npm:@waves/ts-types@^0.3.3` — must be replaced with actual `@decentralchain/ts-types` package
- **`@decentralchain/data-entities`** (dev only) — `Asset`, `Money`, `BigNumber` classes used in tests
  - Currently aliased to `npm:@waves/data-entities@^1.10.1` — must be replaced with actual `@decentralchain/data-entities` package

### Known Issues to Fix During Modernization

1. **Unused import**: `src/utils/utils.ts` imports `{ expression } from '@babel/template'` which is unused and should be removed
2. **`defaultTo('DCC')`**: In `transfer.ts` and `invokeScript.ts`, the fallback fee asset ID defaults to `'DCC'` string — verify this is correct for the DecentralChain native asset behavior
3. **`@ts-ignore` comments**: In `exchange.ts`, there are `@ts-ignore` directives for `chainId` and `priceMode` properties not yet in ts-types — these should be properly typed
4. **Commented-out tests**: In `test/toNode.spec.ts`, several validation tests are commented out — these should be re-enabled or documented why they are disabled

### Refactoring Checklist

Apply to EVERY source file:

- [ ] Remove all `@waves` imports and references (including npm aliases)
- [ ] Replace `WAVES` token with `DCC` everywhere
- [ ] Remove dead code, unused exports, unreachable branches
- [ ] Remove unused `@babel/template` import from utils.ts
- [ ] Add JSDoc / TSDoc comments on all public APIs
- [ ] Add input validation with descriptive `TypeError` messages
- [ ] Make exported data immutable (`Object.freeze`, `as const`, `readonly`)
- [ ] Ensure tree-shakeability (named exports, no side effects)
- [ ] Use `import type` for type-only imports
- [ ] Error messages must be actionable (include expected vs received)

### Naming Conventions

| Element          | Convention                            | Example                   |
| ---------------- | ------------------------------------- | ------------------------- |
| Files            | camelCase (existing convention)       | `cancelLease.ts`          |
| Classes          | PascalCase                            | N/A (no classes)          |
| Functions        | camelCase                             | `getAssetId`, `getCoins`  |
| Constants        | UPPER_SNAKE_CASE                      | `TYPES`, `ALIAS`          |
| Types/Interfaces | PascalCase, prefix I/T                | `IDCCGuiAlias`, `TLong`   |
| Private methods  | camelCase with `_` prefix             | N/A                       |
| Test files       | `*.spec.ts`                           | `toNode.spec.ts`          |

### Test Requirements

- [ ] Migrate all tests from jest to Vitest
- [ ] Replace `@waves` test fixtures with `@decentralchain` equivalents
- [ ] Re-enable commented-out validation tests in `toNode.spec.ts` (or justify removal)
- [ ] Add input validation tests (TypeError for bad inputs)
- [ ] Add edge case tests (empty inputs, boundary values, null amounts)
- [ ] Ensure tests run offline (no network calls — already satisfied)
- [ ] Coverage must meet thresholds after migration (90%+)
- [ ] Add tests for `convert()` function (currently only `toNode()` is tested)
- [ ] Add tests for `utils.spec.ts` edge cases (null/undefined handling)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## DEPENDENCY POLICY

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

### Prefer

- Well-maintained, audited libraries
- Minimal dependency count (fewer = smaller attack surface)
- Native Node APIs when possible
- Pure ESM packages

### Avoid

- Deprecated packages
- Heavy dependencies unless justified
- Packages with native bindings
- `@waves/*` packages (vendor/inline if needed)
- Packages last published > 2 years ago

### Critical Dependency Notes

The `@decentralchain/ts-types` dependency provides all transaction type interfaces. If the real
`@decentralchain/ts-types` package is not yet published on npm, the modernization must either:

1. Wait for it to be published (preferred)
2. Vendor/inline the needed type definitions
3. Continue using the npm alias temporarily (document as tech debt)

The `@decentralchain/data-entities` dev dependency provides `Asset`, `Money`, and `BigNumber`
classes used in tests. If not yet published:

1. Create lightweight test mocks that implement the same interface
2. Or continue using the npm alias temporarily (document as tech debt)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## EXECUTION STEPS

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Execute in this exact order:

1. **Delete** legacy files (`.nvmrc`, old `.gitignore` patterns that exclude `*.js`/`*.d.ts` globally)
2. **Create/replace** all config files per templates above
3. **Remove** unused `@babel/template` import from `src/utils/utils.ts`
4. **Update** `@decentralchain/ts-types` dependency from npm alias to real package
5. **Update** `@decentralchain/data-entities` dev dependency from npm alias to real package
6. **Refactor** source code per the Source Code Requirements
7. **Migrate** tests from jest to Vitest (update imports, assertions)
8. **Re-enable** commented-out validation tests or document removal
9. **Write** all governance docs (CONTRIBUTING, SECURITY, CODE_OF_CONDUCT, CHANGELOG)
10. **Update** README.md with comprehensive documentation
11. **Run** `npm install`
12. **Run** `npm run bulletproof` — fix any failures
13. **Run** `npm run build` — verify clean build
14. **Run** `npm run validate` — full pipeline must pass with zero errors

### Success Criteria

The modernization is complete when ALL of the following pass:

```bash
npm run format:check    # ✅ No formatting issues
npm run lint            # ✅ No lint errors
npm run typecheck       # ✅ No type errors
npm run test            # ✅ All tests pass
npm run build           # ✅ Clean build
npm run check:publint   # ✅ Package structure valid
npm run check:exports   # ✅ Type exports valid
npm run check:size      # ✅ Within size budget (10 kB)
npm pack --dry-run      # ✅ Package contents look correct
```

And:

```bash
grep -rni "waves" . --include="*.ts" --include="*.js" --include="*.json" \
  | grep -v node_modules | grep -v .git | grep -v dist | grep -v MODERNIZE.md | grep -v CHANGELOG.md
# ✅ Returns ZERO results
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## QUALITY STANDARD

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

These packages are the **OFFICIAL SDK for DecentralChain developers worldwide**.

Design for:

- **Long-term maintenance** — clear code, comprehensive tests, automated tooling
- **Security** — input validation, immutable data, minimal dependencies
- **Scalability** — tree-shakeable, ESM-native, appropriate bundle sizes
- **Professional standards** — governance docs, CI/CD, semantic versioning
- **Institutional credibility** — consistent branding, quality gates, provenance

Work iteratively and cautiously. If critical protocol details are missing, **ASK before proceeding**.

## --- END PROMPT ---

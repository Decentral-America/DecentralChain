# Bulletproof Quality Assurance System

> A comprehensive pre-commit quality gate for TypeScript library projects

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         GIT COMMIT TRIGGER                          │
│                      .husky/pre-commit hook                         │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        lint-staged                                  │
│          (only processes staged files — fast)                       │
└────────────────────────────┬────────────────────────────────────────┘
                             │
            ┌────────────────┼────────────────┐
            ▼                ▼                ▼
        prettier          eslint        tsc --noEmit
        --write           --fix        (full project)
      (staged files)   (staged files)
```

**Pre-commit:** lint-staged formats and lints only staged files for speed.  
**Manual / CI:** `npm run bulletproof` checks the full project.

---

## Setup

### 0. Update all packages to latest

Before setting up the quality pipeline, ensure all project dependencies are current:

```bash
# Check for outdated packages
npm outdated

# Update all packages to latest within semver ranges
npm update

# Update all packages to absolute latest (including major versions)
npx npm-check-updates -u && npm install

# Verify nothing broke
npm run build
```

### 1. Install dependencies

```bash
npm install -D husky lint-staged prettier eslint eslint-config-prettier \
  @eslint/js typescript-eslint
```

### 2. Initialize Husky

```bash
npx husky init
```

### 3. Add scripts and lint-staged config to `package.json`

```json
{
  "scripts": {
    "format": "prettier --write \"src/**/*.{ts,json}\"",
    "format:check": "prettier --check \"src/**/*.{ts,json}\"",
    "lint": "eslint .",
    "lint:fix": "eslint . --fix",
    "typecheck": "tsc --noEmit",
    "bulletproof": "npm run format && npm run lint:fix && npm run typecheck && npm test",
    "bulletproof:check": "npm run format:check && npm run lint && npm run typecheck && npm test"
  },
  "lint-staged": {
    "*.ts": ["prettier --write", "eslint --fix"],
    "*.json": ["prettier --write"]
  }
}
```

### 4. Configure pre-commit hook

**File:** `.husky/pre-commit`

```bash
npx lint-staged && npm run typecheck && npm test
```

**How it works:**

- Intercepts every `git commit`
- `lint-staged` formats and lints **only staged files** (fast, even in large projects)
- `typecheck` runs on the full project (types depend on the whole codebase)
- `test` runs the mocha test suite (16 tests)
- If **any step fails, the commit is blocked**

> **Why lint-staged?** Running Prettier/ESLint on the entire `src/` every commit is slow and wasteful. lint-staged only processes files you're actually committing — instant feedback even in large codebases.

---

## 1. Format Step: Prettier

**Config:** `.prettierrc.json`

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

| Setting                | Rationale                                                        |
| ---------------------- | ---------------------------------------------------------------- |
| `trailingComma: "all"` | Default since Prettier v3. Cleaner diffs, fewer merge conflicts. |
| `singleQuote: true`    | Standard for JS/TS ecosystem                                     |
| `printWidth: 100`      | Balanced readability for modern widescreens                      |
| `endOfLine: "lf"`      | Prevents cross-platform line-ending issues                       |

**Scope:** `*.{ts,json}` files in `src/`

> **Note:** Do NOT use `eslint-plugin-prettier`. Running Prettier inside ESLint is slow and produces confusing errors. Keep them as separate tools — Prettier formats, ESLint lints. Use `eslint-config-prettier` only (to disable conflicting ESLint formatting rules).

---

## 2. Lint Step: ESLint

**Config:** `eslint.config.js` (ESLint 9 Flat Config)

> **Important:** ESLint 9 flat config does **not** use `--ext`. File matching is handled by the `files` globs in the config. Simply run `eslint .`.

### Recommended config structure (Node/Library variant)

```js
import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import prettierConfig from 'eslint-config-prettier';
import { defineConfig, globalIgnores } from 'eslint/config';

export default defineConfig([
  globalIgnores(['dist', 'tmp', 'node_modules']),
  {
    files: ['**/*.ts'],
    extends: [js.configs.recommended, tseslint.configs.recommended, prettierConfig],
    languageOptions: {
      ecmaVersion: 'latest',
      globals: globals.node,
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
]);
```

### Rules Summary

| Scope      | Rules                                                                        |
| ---------- | ---------------------------------------------------------------------------- |
| TypeScript | `no-unused-vars: error` (ignores `_` prefixed args), `no-explicit-any: warn` |
| Formatting | Handled by `eslint-config-prettier` (disables conflicting rules)              |

**Auto-fix:** `eslint . --fix`

---

## 3. Typecheck Step: TypeScript

**Command:** `tsc --noEmit`

### Recommended `tsconfig.json` compiler options

```jsonc
{
  "compilerOptions": {
    "baseUrl": "./src",
    "outDir": "./dist",
    "target": "es5",
    "module": "commonjs",
    "declaration": true,
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "sourceMap": true,
    "skipLibCheck": true,
    "lib": ["es2015", "es2016"]
  },
  "include": ["src"]
}
```

| Option                             | Effect                                                                |
| ---------------------------------- | --------------------------------------------------------------------- |
| `strict: true`                     | Enables all strict checks (`strictNullChecks`, `noImplicitAny`, etc.) |
| `noUnusedLocals: true`             | Unused variables = compile error                                      |
| `noUnusedParameters: true`         | Unused params = compile error (prefix with `_` to skip)               |
| `noFallthroughCasesInSwitch: true` | Prevents accidental fall-through in switch                            |
| `declaration: true`                | Generates `.d.ts` type declaration files for consumers                |

---

## Tool Responsibility Matrix

| Concern             | Prettier | ESLint | TypeScript |
| ------------------- | :------: | :----: | :--------: |
| Formatting          |    ✅    |        |            |
| Code style/patterns |          |   ✅   |            |
| Type safety         |          |        |     ✅     |
| Dead code detection |          |   ✅   |     ✅     |
| Import resolution   |          |        |     ✅     |

**Key principle:** Each tool does ONE job. No overlap, no `eslint-plugin-prettier`.

---

## Execution Contexts

| Trigger        | What runs                              | Scope                                            |
| -------------- | -------------------------------------- | ------------------------------------------------ |
| **Git commit** | `lint-staged` + `typecheck` + `test`   | Staged files (format/lint), full project (types/tests) |
| **Manual**     | `npm run bulletproof`                  | Full project                                     |
| **CI**         | `npm run bulletproof:check`            | Full project, no auto-fixes                      |

---

## Available Scripts

```bash
# Auto-fix formatting and linting, then typecheck and test (full project)
npm run bulletproof

# Check only (no auto-fixes) — for CI pipelines
npm run bulletproof:check

# Individual steps
npm run format          # Auto-format all source files
npm run format:check    # Check formatting without modifying
npm run lint            # Lint check only
npm run lint:fix        # Lint with auto-fix
npm run typecheck       # TypeScript type checking
npm test                # Run mocha test suite
```

---

## CI/CD Integration

```yaml
- name: Install dependencies
  run: npm ci

- name: Run bulletproof checks
  run: npm run bulletproof:check
```

For parallel CI (faster):

```yaml
- name: Install dependencies
  run: npm ci

- name: Check formatting
  run: npm run format:check

- name: Lint
  run: npm run lint

- name: Typecheck
  run: npm run typecheck

- name: Test
  run: npm test
```

---

## Project-Specific Notes

### Dependency: @decentralchain/bignumber

This library depends on `@decentralchain/bignumber` for all BigNumber arithmetic operations. It is used in:

- `src/utils.ts` — `toBigNumber()` utility
- `src/entities/Asset.ts` — quantity and minSponsoredFee fields
- `src/entities/Candle.ts` — OHLCV price fields
- `src/entities/Money.ts` — coins/tokens arithmetic
- `src/entities/OrderPrice.ts` — matcher price calculations

### Test Suite

The project uses **Mocha + Chai** for testing (16 tests):

- `test/classes/Asset.spec.ts` — Asset creation and conversion
- `test/classes/AssetPair.spec.ts` — AssetPair creation and conversion
- `test/classes/Money.spec.ts` — Money arithmetic and formatting
- `test/classes/OrderPrice.spec.ts` — OrderPrice creation and conversion

### Build Pipeline

```bash
tsc --declaration          # Compile TypeScript → dist/
npm run build              # Browserify bundle → dist/data-entities.js
npm run uglify             # Minify → dist/data-entities.min.js
```

---

The system ensures **no broken code can be committed** without proper formatting, linting, type checking, and passing tests.

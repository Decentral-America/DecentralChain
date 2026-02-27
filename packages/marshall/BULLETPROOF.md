# Bulletproof Quality Assurance System

> A comprehensive pre-commit quality gate for React + Node projects

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
  @eslint/js typescript-eslint eslint-plugin-react eslint-plugin-react-hooks \
  eslint-plugin-react-refresh
```

### 2. Initialize Husky

```bash
npx husky init
```

### 3. Add scripts and lint-staged config to `package.json`

```json
{
  "scripts": {
    "format": "prettier --write \"src/**/*.{ts,tsx,json,css}\"",
    "format:check": "prettier --check \"src/**/*.{ts,tsx,json,css}\"",
    "lint": "eslint .",
    "lint:fix": "eslint . --fix",
    "typecheck": "tsc --noEmit",
    "bulletproof": "npm run format && npm run lint:fix && npm run typecheck",
    "bulletproof:check": "npm run format:check && npm run lint && npm run typecheck"
  },
  "lint-staged": {
    "*.{ts,tsx}": ["prettier --write", "eslint --fix"],
    "*.{json,css}": ["prettier --write"]
  }
}
```

### 4. Configure pre-commit hook

**File:** `.husky/pre-commit`

```bash
npx lint-staged && npm run typecheck
```

**How it works:**

- Intercepts every `git commit`
- `lint-staged` formats and lints **only staged files** (fast, even in large projects)
- `typecheck` runs on the full project (types depend on the whole codebase)
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

**Scope:** `*.{ts,tsx,json,css}` files in `src/`

> **Note:** Do NOT use `eslint-plugin-prettier`. Running Prettier inside ESLint is slow and produces confusing errors. Keep them as separate tools — Prettier formats, ESLint lints. Use `eslint-config-prettier` only (to disable conflicting ESLint formatting rules).

---

## 2. Lint Step: ESLint

**Config:** `eslint.config.js` (ESLint 9 Flat Config)

> **Important:** ESLint 9 flat config does **not** use `--ext`. File matching is handled by the `files` globs in the config. Simply run `eslint .`.

### Recommended config structure

```js
import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import react from 'eslint-plugin-react';
import tseslint from 'typescript-eslint';
import prettierConfig from 'eslint-config-prettier';
import { defineConfig, globalIgnores } from 'eslint/config';

export default defineConfig([
  globalIgnores(['dist', 'node_modules']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      react.configs.flat.recommended,
      reactHooks.configs['recommended-latest'],
      reactRefresh.configs.vite,
      prettierConfig, // Must be last — disables formatting rules
    ],
    languageOptions: {
      ecmaVersion: 'latest',
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    settings: {
      react: { version: 'detect' },
    },
    rules: {
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
]);
```

### Rules Summary

| Scope         | Rules                                                                             |
| ------------- | --------------------------------------------------------------------------------- |
| React         | `react-in-jsx-scope: off`, `prop-types: off` (TypeScript handles prop validation) |
| React Refresh | `only-export-components: warn` (allows constant exports for HMR)                  |
| Hooks         | `rules-of-hooks: error`, `exhaustive-deps: warn` (via recommended-latest)         |
| TypeScript    | `no-unused-vars: error` (ignores `_` prefixed args), `no-explicit-any: warn`      |
| Formatting    | Handled by `eslint-config-prettier` (disables conflicting rules)                  |

**Auto-fix:** `eslint . --fix`

---

## 3. Typecheck Step: TypeScript

**Command:** `tsc --noEmit`

### Recommended `tsconfig.json` compiler options

```jsonc
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "skipLibCheck": true,
    "isolatedModules": true,
    "resolveJsonModule": true,
  },
}
```

| Option                             | Effect                                                                 |
| ---------------------------------- | ---------------------------------------------------------------------- |
| `strict: true`                     | Enables all strict checks (`strictNullChecks`, `noImplicitAny`, etc.)  |
| `noUnusedLocals: true`             | Unused variables = compile error                                       |
| `noUnusedParameters: true`         | Unused params = compile error (prefix with `_` to skip)                |
| `noFallthroughCasesInSwitch: true` | Prevents accidental fall-through in switch                             |
| `noUncheckedIndexedAccess: true`   | Array/object index access returns `T \| undefined` — catches real bugs |
| `isolatedModules: true`            | Required by Vite/esbuild — ensures per-file transpilation safety       |
| `noEmit: true`                     | Only checks types, doesn't produce output (bundler handles that)       |

> **Tip:** `noUncheckedIndexedAccess` is one of the highest-value strict options — it catches a whole class of `undefined` bugs that `strict: true` alone misses.

---

## Tool Responsibility Matrix

| Concern               | Prettier | ESLint | TypeScript |
| --------------------- | :------: | :----: | :--------: |
| Formatting            |    ✅    |        |            |
| Code style / patterns |          |   ✅   |            |
| Type safety           |          |        |     ✅     |
| Dead code detection   |          |   ✅   |     ✅     |
| React rules / hooks   |          |   ✅   |            |
| Import resolution     |          |        |     ✅     |

**Key principle:** Each tool does ONE job. No overlap, no `eslint-plugin-prettier`.

---

## Execution Contexts

| Trigger        | What runs                   | Scope                                            |
| -------------- | --------------------------- | ------------------------------------------------ |
| **Git commit** | `lint-staged` + `typecheck` | Staged files (format/lint), full project (types) |
| **Manual**     | `npm run bulletproof`       | Full project                                     |
| **CI**         | `npm run bulletproof:check` | Full project, no auto-fixes                      |

---

## Available Scripts

```bash
# Auto-fix formatting and linting, then typecheck (full project)
npm run bulletproof

# Check only (no auto-fixes) — for CI pipelines
npm run bulletproof:check

# Individual steps
npm run format          # Auto-format all source files
npm run format:check    # Check formatting without modifying
npm run lint            # Lint check only
npm run lint:fix        # Lint with auto-fix
npm run typecheck       # TypeScript type checking
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
```

---

## Adding Tests (Optional Enhancement)

When tests are added to a project, extend the bulletproof pipeline:

### 1. Install Vitest

```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom
```

### 2. Add test scripts

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "bulletproof": "npm run format && npm run lint:fix && npm run typecheck && npm run test",
    "bulletproof:check": "npm run format:check && npm run lint && npm run typecheck && npm run test"
  }
}
```

### 3. Create `vitest.config.ts`

```ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}'],
    exclude: ['node_modules', 'dist'],
  },
});
```

### 4. Update pre-commit hook

```bash
npx lint-staged && npm run typecheck && npm run test
```

---

## Node.js Backend Projects

For backend-only projects (no React), adjust the config:

### ESLint (Node variant)

```js
import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import prettierConfig from 'eslint-config-prettier';
import { defineConfig, globalIgnores } from 'eslint/config';

export default defineConfig([
  globalIgnores(['dist', 'node_modules']),
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

### lint-staged (Node variant)

```json
{
  "lint-staged": {
    "*.ts": ["prettier --write", "eslint --fix"],
    "*.json": ["prettier --write"]
  }
}
```

### Vitest (Node variant)

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts'],
    exclude: ['node_modules', 'dist'],
  },
});
```

---

The system ensures **no broken code can be committed** without proper formatting, linting, and type checking.

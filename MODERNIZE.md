# Universal Modernization Prompt for DecentralChain Libraries

> **Version**: 1.1.0 — February 28, 2026
> **Scope**: Any `@waves/*` or legacy DecentralChain package
> **Goal**: Transform into a **production-grade, institutionally credible** `@decentralchain/*` package
>
> **Important**: This prompt is designed to be **timeless**. All dependency versions
> use `"latest"` semantics — the AI executing this prompt must resolve them to the
> latest stable versions at execution time. Dated references (e.g. `# ~X.Y.Z as of Feb 2026`)
> are provided only as sanity-check baselines, NOT as pins.

---

## How to Use This File

1. **Open the target repository** (the legacy `@waves/*` or outdated `@decentralchain/*` package).
2. **Copy everything below the `--- BEGIN PROMPT ---` line** into your AI assistant.
3. **Fill in the `[VARIABLES]` section** at the top with project-specific values.
4. The AI will produce every file needed for a fully modernized library.

All decisions below are **pre-made**. The AI should NOT ask for permission — it should execute.

---

## --- BEGIN PROMPT ---

You are modernizing a DecentralChain SDK library. Apply EVERY specification below exactly. Do not skip steps, do not invent protocol behavior, and do not modify source files not listed.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## [VARIABLES] — Fill These In Per Project

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

```yaml
# ── Identity ──────────────────────────────────────────────────────
PACKAGE_NAME: '@decentralchain/XXXXX' # e.g. "@decentralchain/bignumber"
PACKAGE_VERSION: 'X.Y.Z' # semver for first modernized release
DESCRIPTION: '...' # one-line npm description
KEYWORDS: # npm keywords array
  - decentralchain
  - dcc
  - ...

# ── Repository ────────────────────────────────────────────────────
REPO_ORG: 'Decentral-America' # GitHub org
REPO_NAME: 'XXXXX' # GitHub repo name
AUTHOR: 'DecentralChain' # or "Decentral-America <https://github.com/Decentral-America>"

# ── Source Language ───────────────────────────────────────────────
# Choose ONE:
#   "typescript"  → .ts source, tsup builds ESM+CJS+UMD, strict type-aware ESLint
#   "javascript"  → .js source, hand-written .d.ts, Rollup for browser IIFE only
SOURCE_LANG: 'typescript'

## ── Build Target ──────────────────────────────────────────────────
# ESM-only is now the default and recommended build for all new TypeScript projects (2026+).
# Only use dual ESM/CJS output if you have a specific legacy requirement.
#
# For TypeScript projects:
#   FORMATS: ["esm"]                — Node/bundler library (recommended, ESM-only)
#   FORMATS: ["esm", "cjs"]         — Only if legacy CJS support is required
#   FORMATS: ["esm", "cjs", "iife"] — Node + browser UMD global (rare)
#   UMD_GLOBAL_NAME: "MyLib"         — only if IIFE included
# For JavaScript projects:
#   FORMATS: ["iife"]                — browser bundle only (source IS the ESM entry)
FORMATS: ['esm']
UMD_GLOBAL_NAME: ''

# ── Node.js ───────────────────────────────────────────────────────
MIN_NODE: '22' # minimum supported Node.js version
RECOMMENDED_NODE: '24' # for .node-version / .nvmrc
NODE_MATRIX: [22, 24] # CI test matrix

# ── Quality ───────────────────────────────────────────────────────
COVERAGE_THRESHOLDS:
  branches: 90
  functions: 90
  lines: 90
  statements: 90

# ── Size Budget ───────────────────────────────────────────────────
SIZE_LIMIT_PATH: './dist/index.mjs' # path to measure
SIZE_LIMIT: '10 kB' # max gzipped size
SIZE_LIMIT_IMPORT: '{ MainExport }' # named import to tree-shake measure

# ── Optional Features ─────────────────────────────────────────────
USE_CHANGESETS: false # true → adds @changesets/cli for versioning
HAS_BROWSER_BUNDLE: false # true → uncomments UMD/IIFE block in tsup
HAS_VENDOR_CODE: false # true → adds relaxed ESLint for src/libs/**
NEEDS_TYPES_NODE: false # true → adds @types/node to devDeps

# ── Dependencies ──────────────────────────────────────────────────
PRODUCTION_DEPS: # list exact deps to keep/add
  - 'bignumber.js: ^10.0.2'
DEV_ONLY_DEPS: # anything that was runtime but should be dev
  - 'long: ^5.3.2'

# ── Previous Version Info ─────────────────────────────────────────
PREVIOUS_SCOPE: '@waves' # or "@decentralchain" if already migrated once
PREVIOUS_VERSION: 'X.Y.Z' # last published version
PREVIOUS_BUILD_TOOL: 'webpack' # webpack | rollup (legacy) | tsc | none
PREVIOUS_TEST_RUNNER: 'jest' # jest | mocha | tape | none
PREVIOUS_PM: 'yarn' # yarn | npm


# ── Version Resolution (auto-resolved at execution time) ─────────
# The AI executing this prompt MUST resolve these to latest stable versions.
# Do NOT fill these in manually — they are resolved dynamically.
# LATEST_NPM: ''               # e.g. "11.11.0" — run `npm --version`
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

Dated reference comments (e.g. `// ~X.Y.Z as of Feb 2026`) are **baselines only**.
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

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## ARCHITECTURAL DECISIONS (Pre-Made)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

These are final. Do not deviate.

| Decision           | Choice                         | Rationale                                         |
| ------------------ | ------------------------------ | ------------------------------------------------- |
| Module system      | ESM-only (`"type": "module"`)  | Industry standard 2026+; no CJS unless legacy req |
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
| Build (TypeScript) | tsup                           | ESM-only (default); CJS only if legacy required   |
| Build (JavaScript) | Rollup                         | IIFE browser bundle only; source IS the ESM entry |

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
rollup.config.js    (only for TS projects — JS projects keep it)
tsconfig.build.json (consolidate into tsconfig.json)
.eslintrc*          (replaced by flat config)
.eslintignore       (use ignores in flat config)
```

### `.node-version` (for TS projects) or `.nvmrc` (for JS projects)

```
{{RECOMMENDED_NODE}}
```

> Use `.node-version` for TypeScript projects (works with fnm, volta, nvm).
> Use `.nvmrc` for JavaScript projects (nvm-only compatibility).

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

### `.prettierrc.json` (TypeScript projects only)

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

> JavaScript projects: omit this file (use Prettier defaults).

### `.prettierignore`

For TypeScript projects:

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
```

For JavaScript projects:

```
dist
coverage
node_modules
*.map
LICENSE
CHANGELOG.md
package-lock.json
```

### `.gitignore`

For TypeScript projects:

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

For JavaScript projects:

```gitignore
node_modules/
dist/
coverage/
.idea/
*.sandbox.js
*.tgz
```

### `.husky/pre-commit`

For TypeScript projects:

```
npx lint-staged && npm run typecheck
```

For JavaScript projects (add test run since no compile step):

```
npx lint-staged && npm run typecheck && npm run test
```

### `LICENSE`

```
MIT License

Copyright (c) {{CURRENT_YEAR}}-present DecentralChain

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

#### TypeScript Project Template

```jsonc
{
  "name": "{{PACKAGE_NAME}}",
  "version": "{{PACKAGE_VERSION}}",
  "description": "{{DESCRIPTION}}",
  "type": "module",
  "packageManager": "npm@{{LATEST_NPM}}", // resolve to latest stable npm (~11.11.0 as of Feb 2026)
  "exports": {
    ".": {
      "import": {
        "types": "./dist/index.d.ts",
        "default": "./dist/index.mjs",
      },
      "require": {
        "types": "./dist/index.d.cts",
        "default": "./dist/index.cjs",
      },
    },
  },
  "main": "./dist/index.cjs",
  "module": "./dist/index.mjs",
  "types": "./dist/index.d.ts",
  // Include "browser" only if IIFE format is built:
  // "browser": "./dist/index.umd.min.js",
  "sideEffects": false,
  "files": ["dist", "LICENSE", "README.md"],
  "engines": { "node": ">={{MIN_NODE}}" },
  "publishConfig": { "access": "public", "provenance": true },
  "repository": {
    "type": "git",
    "url": "git+https://github.com/{{REPO_ORG}}/{{REPO_NAME}}.git",
  },
  "funding": {
    "type": "github",
    "url": "https://github.com/sponsors/{{REPO_ORG}}",
  },
  "homepage": "https://github.com/{{REPO_ORG}}/{{REPO_NAME}}#readme",
  "bugs": { "url": "https://github.com/{{REPO_ORG}}/{{REPO_NAME}}/issues" },
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
    "postpublish": "git push",
  },
  "lint-staged": {
    "*.ts": ["prettier --write", "eslint --fix"],
    "*.json": ["prettier --write"],
  },
  "size-limit": [
    {
      "path": "{{SIZE_LIMIT_PATH}}",
      "limit": "{{SIZE_LIMIT}}",
      "import": "{{SIZE_LIMIT_IMPORT}}",
    },
  ],
  "keywords": ["{{KEYWORDS}}"],
  "author": "{{AUTHOR}}",
  "license": "MIT",
  "dependencies": {
    // {{PRODUCTION_DEPS}}
  },
  "devDependencies": {
    // ⚠️  IMPORTANT: Resolve ALL versions below to the latest stable at execution time.
    //    Run `npm info <package> version` or check npmjs.com for each.
    //    Dated references (as of Feb 2026) are provided as sanity-check baselines only.
    "@arethetypeswrong/cli": "{{LATEST}}", // ~0.18.2 as of Feb 2026
    "@eslint/js": "{{LATEST}}", // ~10.0.1 as of Feb 2026
    "@size-limit/preset-small-lib": "{{LATEST}}", // ~12.0.0 as of Feb 2026
    "@vitest/coverage-v8": "{{LATEST}}", // ~4.0.18 as of Feb 2026
    "eslint": "{{LATEST}}", // ~10.0.2 as of Feb 2026
    "eslint-config-prettier": "{{LATEST}}", // ~10.1.8 as of Feb 2026
    "globals": "{{LATEST}}", // ~17.3.0 as of Feb 2026
    "husky": "{{LATEST}}", // ~9.1.7 as of Feb 2026
    "lint-staged": "{{LATEST}}", // ~16.3.0 as of Feb 2026
    "prettier": "{{LATEST}}", // ~3.8.1 as of Feb 2026
    "publint": "{{LATEST}}", // ~0.3.17 as of Feb 2026
    "size-limit": "{{LATEST}}", // ~12.0.0 as of Feb 2026
    "tsup": "{{LATEST}}", // ~8.5.1 as of Feb 2026
    "typescript": "{{LATEST}}", // ~5.9.3 as of Feb 2026
    "typescript-eslint": "{{LATEST}}", // ~8.56.1 as of Feb 2026
    "vitest": "{{LATEST}}", // ~4.0.18 as of Feb 2026
    // + any {{DEV_ONLY_DEPS}}
    // If NEEDS_TYPES_NODE: "@types/node": "{{LATEST matching MIN_NODE major}}"
    //   NOTE: Pin @types/node to the major matching your MIN_NODE (e.g. @types/node@22
    //   for MIN_NODE=22). Do NOT use latest — it may target a newer Node than you support.
    // If USE_CHANGESETS:  "@changesets/cli": "{{LATEST}}"  // ~2.29.8 as of Feb 2026
  },
}
```

> **Optional fields:**
>
> - Add `"funding"` if the org has GitHub Sponsors.
> - Add `"browser": "./dist/index.umd.min.js"` if HAS_BROWSER_BUNDLE is true.
> - Add `"contributors"` array if there are original upstream authors to credit.
> - If USE_CHANGESETS, add scripts: `"changeset": "changeset"`, `"release": "changeset publish"`.

#### JavaScript Project Template

```jsonc
{
  "name": "{{PACKAGE_NAME}}",
  "version": "{{PACKAGE_VERSION}}",
  "description": "{{DESCRIPTION}}",
  "type": "module",
  "main": "src/index.js",
  "types": "src/index.d.ts",
  "exports": {
    ".": {
      "types": "./src/index.d.ts",
      "import": "./src/index.js",
    },
  },
  "files": ["src/", "dist/", "LICENSE", "README.md", "CHANGELOG.md"],
  "sideEffects": false,
  "engines": { "node": ">={{MIN_NODE}}" },
  "packageManager": "npm@{{LATEST_NPM}}", // resolve to latest stable npm (~11.11.0 as of Feb 2026)
  "publishConfig": { "access": "public", "provenance": true },
  "repository": {
    "type": "git",
    "url": "git+https://github.com/{{REPO_ORG}}/{{REPO_NAME}}.git",
  },
  "funding": {
    "type": "github",
    "url": "https://github.com/sponsors/{{REPO_ORG}}",
  },
  "homepage": "https://github.com/{{REPO_ORG}}/{{REPO_NAME}}#readme",
  "bugs": { "url": "https://github.com/{{REPO_ORG}}/{{REPO_NAME}}/issues" },
  "scripts": {
    "build:browser": "rollup -c rollup.config.js",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "lint": "eslint .",
    "lint:fix": "eslint . --fix",
    "check:publint": "publint",
    "check:exports": "attw --pack . --ignore-rules cjs-resolves-to-esm",
    "check:size": "size-limit",
    "validate": "npm run format:check && npm run lint && npm run typecheck && npm run test && npm run build:browser && npm run check:publint && npm run check:exports && npm run check:size",
    "bulletproof": "npm run format && npm run lint:fix && npm run typecheck && npm run test",
    "bulletproof:check": "npm run format:check && npm run lint && npm run typecheck && npm run test",
    "prepublishOnly": "npm run validate",
    "prepack": "npm run build:browser",
    "prepare": "husky",
  },
  "lint-staged": {
    "*.{js,mjs}": ["prettier --write", "eslint --fix"],
    "*.json": ["prettier --write"],
    "*.md": ["prettier --write"],
  },
  "size-limit": [{ "path": "./dist/browser.js", "limit": "{{SIZE_LIMIT}}" }],
  "keywords": ["{{KEYWORDS}}"],
  "author": "{{AUTHOR}}",
  "license": "MIT",
  "dependencies": {
    // {{PRODUCTION_DEPS}}
  },
  "devDependencies": {
    // ⚠️  IMPORTANT: Resolve ALL versions below to the latest stable at execution time.
    //    Dated references (as of Feb 2026) are provided as sanity-check baselines only.
    "@arethetypeswrong/cli": "{{LATEST}}", // ~0.18.2 as of Feb 2026
    "@eslint/js": "{{LATEST}}", // ~10.0.1 as of Feb 2026
    "@rollup/plugin-commonjs": "{{LATEST}}", // ~29.0.0 as of Feb 2026
    "@rollup/plugin-json": "{{LATEST}}", // ~6.1.0 as of Feb 2026
    "@rollup/plugin-node-resolve": "{{LATEST}}", // ~16.0.3 as of Feb 2026
    "@rollup/plugin-terser": "{{LATEST}}", // ~0.4.4 as of Feb 2026
    "@size-limit/preset-small-lib": "{{LATEST}}", // ~12.0.0 as of Feb 2026
    "@vitest/coverage-v8": "{{LATEST}}", // ~4.0.18 as of Feb 2026
    "eslint": "{{LATEST}}", // ~10.0.2 as of Feb 2026
    "eslint-config-prettier": "{{LATEST}}", // ~10.1.8 as of Feb 2026
    "globals": "{{LATEST}}", // ~17.3.0 as of Feb 2026
    "husky": "{{LATEST}}", // ~9.1.7 as of Feb 2026
    "lint-staged": "{{LATEST}}", // ~16.3.0 as of Feb 2026
    "prettier": "{{LATEST}}", // ~3.8.1 as of Feb 2026
    "publint": "{{LATEST}}", // ~0.3.17 as of Feb 2026
    "rollup": "{{LATEST}}", // ~4.59.0 as of Feb 2026
    "size-limit": "{{LATEST}}", // ~12.0.0 as of Feb 2026
    "typescript": "{{LATEST}}", // ~5.9.3 as of Feb 2026
    "vitest": "{{LATEST}}", // ~4.0.18 as of Feb 2026
  },
}
```

---

### `tsconfig.json`

#### TypeScript Project

```json
{
  "compilerOptions": {
    "target": "ES2024",
    "lib": ["ES2024"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    // NOTE: verbatimModuleSyntax enforces `import type` syntax.
    // Set to false if the codebase has legacy `import { Type }` patterns
    // that would require extensive refactoring (e.g. DCC-2/marshall).
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

#### JavaScript Project

```json
{
  "compilerOptions": {
    "target": "ES2024",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "allowJs": true,
    "checkJs": true,
    "noEmit": true,
    "strict": true,
    "resolveJsonModule": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "include": ["src/**/*.js", "src/**/*.d.ts"],
  "exclude": ["src/__tests__"]
}
```

---

### `tsup.config.ts` (TypeScript projects only)

```typescript
import { defineConfig } from 'tsup';

export default defineConfig([
  // ── ESM + CJS (for Node / bundlers) ────────────────────────────
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
  // ── UMD / IIFE (browser global) — uncomment if HAS_BROWSER_BUNDLE ──
  // {
  //   entry: ['src/index.ts'],
  //   format: ['iife'],
  //   globalName: '{{UMD_GLOBAL_NAME}}',
  //   outDir: 'dist',
  //   minify: true,
  //   sourcemap: true,
  //   target: 'es2024',
  //   outExtension() {
  //     return { js: '.umd.min.js' };
  //   },
  //   // Re-export as CommonJS for bundlers that use the "browser" field:
  //   footer: {
  //     js: 'if(typeof module!=="undefined")module.exports={{UMD_GLOBAL_NAME}};',
  //   },
  // },
]);
```

### `rollup.config.js` (JavaScript projects only)

```javascript
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import terser from '@rollup/plugin-terser';

export default {
  input: 'src/index.js',
  output: {
    file: 'dist/browser.js',
    format: 'iife',
    name: '{{UMD_GLOBAL_NAME}}',
    exports: 'named',
    sourcemap: true,
  },
  plugins: [json(), resolve({ preferBuiltins: false, browser: true }), commonjs(), terser()],
};
```

---

### `vitest.config.ts` (TypeScript) / `vitest.config.js` (JavaScript)

#### TypeScript Project

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    include: ['test/**/*.spec.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['src/index.ts'],     // re-export barrel — exclude from coverage
      reporter: ['text', 'lcov', 'json-summary'],
      thresholds: {
        branches: {{COVERAGE_THRESHOLDS.branches}},
        functions: {{COVERAGE_THRESHOLDS.functions}},
        lines: {{COVERAGE_THRESHOLDS.lines}},
        statements: {{COVERAGE_THRESHOLDS.statements}},
      },
    },
    reporters: ['default'],
    typecheck: { enabled: true },
  },
});
```

#### JavaScript Project

```javascript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/__tests__/**/*.test.js'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.js'],
      exclude: ['src/__tests__/**'],
      reporter: ['text', 'lcov', 'json-summary'],
      thresholds: {
        branches: {{COVERAGE_THRESHOLDS.branches}},
        functions: {{COVERAGE_THRESHOLDS.functions}},
        lines: {{COVERAGE_THRESHOLDS.lines}},
        statements: {{COVERAGE_THRESHOLDS.statements}},
      },
    },
  },
});
```

---

### `eslint.config.mjs`

#### TypeScript Project (type-aware, strict)

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

  // ── Vendor/adapted code (optional — if HAS_VENDOR_CODE) ────────
  // Uncomment if the project has vendored/ported library code in src/libs/
  // {
  //   files: ['src/libs/**/*.ts'],
  //   rules: {
  //     '@typescript-eslint/ban-ts-comment': 'off',
  //     '@typescript-eslint/no-explicit-any': 'off',
  //     '@typescript-eslint/no-unused-vars': 'warn',
  //     'no-control-regex': 'off',
  //     'no-misleading-character-class': 'off',
  //     'prefer-const': 'warn',
  //   },
  // },
]);
```

#### JavaScript Project (no type-aware rules)

```javascript
import js from '@eslint/js';
import globals from 'globals';
import prettierConfig from 'eslint-config-prettier';

export default [
  { ignores: ['dist/**', 'node_modules/**', 'coverage/**'] },
  {
    files: ['src/**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: { ...globals.node },
    },
    rules: {
      ...js.configs.recommended.rules,
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
  {
    files: ['src/__tests__/**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: { ...globals.node },
    },
    rules: {
      ...js.configs.recommended.rules,
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
  {
    files: ['*.js', '*.mjs'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: { ...globals.node },
    },
    rules: { ...js.configs.recommended.rules },
  },
  prettierConfig,
];
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
        node-version: [{ { NODE_MATRIX } }] # e.g. [22, 24]
    # ⚠️  IMPORTANT: Use the latest stable MAJOR version of each action.
    #    Check https://github.com/actions/checkout/releases etc. at execution time.
    #    Dependabot (configured below) will keep these current after initial setup.
    #    Dated references: checkout ~v6, setup-node ~v6, upload-artifact ~v7 as of Feb 2026.
    steps:
      - uses: actions/checkout@{{LATEST_ACTIONS_CHECKOUT}} # latest stable major (e.g. v4 → v6)

      - name: Setup Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@{{LATEST_ACTIONS_SETUP_NODE}} # latest stable major
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
        run: npm run build # or "npm run build:browser" for JS projects

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
        if: matrix.node-version == {{RECOMMENDED_NODE}}
        uses: actions/upload-artifact@{{LATEST_ACTIONS_UPLOAD_ARTIFACT}} # latest stable major
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
          node-version: { { RECOMMENDED_NODE } }
          cache: npm
      - run: npm ci
      - run: npm run build # or "npm run build:browser" for JS projects
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
      - { { REPO_ORG } }
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
    # NOTE: GitHub Actions major version bumps (e.g. v4 → v6) are expected.
    # Review and merge these promptly — they are NOT errors in the template.
```

> **Dependabot guidance for `@types/node`**: If your project uses `@types/node`,
> Dependabot may propose major version bumps (e.g. `@types/node@24` → `@types/node@25`).
> Only accept these if you also add the corresponding Node.js version to your `NODE_MATRIX`.
> To suppress unwanted major bumps, add this to the npm ecosystem section:
>
> ```yaml
> ignore:
>   - dependency-name: '@types/node'
>     update-types: ['version-update:semver-major']
> ```

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
# Contributing to {{PACKAGE_NAME}}

Thank you for your interest in contributing!

## Code of Conduct

By participating, you agree to abide by our [Code of Conduct](./CODE_OF_CONDUCT.md).

## Prerequisites

- **Node.js** >= {{MIN_NODE}} ({{RECOMMENDED_NODE}} recommended — see `.node-version`)
- **npm** >= 10 (latest LTS recommended)

## Setup

\`\`\`bash
git clone https://github.com/{{REPO_ORG}}/{{REPO_NAME}}.git
cd {{REPO_NAME}}
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

| Version       | Supported          |
| ------------- | ------------------ |
| {{MAJOR}}.x   | :white_check_mark: |
| < {{MAJOR}}.0 | :x:                |

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

## [{{PACKAGE_VERSION}}] - {{CURRENT_DATE}}

### Changed

- **BREAKING**: Migrated to pure ESM (`"type": "module"`).
- Minimum Node.js version is now {{MIN_NODE}}.
- Replaced {{PREVIOUS_TEST_RUNNER}} with Vitest.
- Replaced {{PREVIOUS_BUILD_TOOL}} with {{NEW_BUILD_TOOL}}.
- Upgraded all dependencies to latest versions.
- Rebranded from `{{PREVIOUS_SCOPE}}` to `@decentralchain`.

### Added

- TypeScript strict mode / type definitions.
- ESLint flat config with Prettier integration.
- Husky + lint-staged pre-commit hooks.
- GitHub Actions CI pipeline (Node {{NODE_MATRIX}}).
- Dependabot for automated dependency updates.
- Code coverage with threshold enforcement.
- CONTRIBUTING.md, SECURITY.md, CODE_OF_CONDUCT.md.

### Removed

- Legacy build tooling ({{PREVIOUS_BUILD_TOOL}}).
- {{PREVIOUS_PM}} lockfile.
- All Waves branding and references.
```

---

### `README.md` Structure

Every README must include these sections in order:

```markdown
# {{PACKAGE_NAME}}

[![CI](https://github.com/{{REPO_ORG}}/{{REPO_NAME}}/actions/workflows/ci.yml/badge.svg)](https://github.com/{{REPO_ORG}}/{{REPO_NAME}}/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/{{PACKAGE_NAME}})](https://www.npmjs.com/package/{{PACKAGE_NAME}})
[![license](https://img.shields.io/npm/l/{{PACKAGE_NAME}})](./LICENSE)
[![Node.js](https://img.shields.io/node/v/{{PACKAGE_NAME}})](./package.json)
[![TypeScript](https://img.shields.io/badge/TypeScript-{{LATEST_TS_MAJOR}}-blue.svg)](https://www.typescriptlang.org/) <!-- e.g. 5.9 as of Feb 2026 -->

{{One-sentence description.}}

{{2-3 sentence expanded description of what the library does and why.}}

## Requirements

## Installation

## Quick Start

## API Reference

## Browser (if applicable)

## Development

### Prerequisites

### Setup

### Scripts (table)

### Quality Gates

## Contributing → link to CONTRIBUTING.md

## Security → link to SECURITY.md

## Code of Conduct → link to CODE_OF_CONDUCT.md

## Changelog → link to CHANGELOG.md

## License
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## SOURCE CODE REQUIREMENTS

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

### Refactoring Checklist

Apply to EVERY source file:

- [ ] Remove all `@waves` imports and references
- [ ] Replace `WAVES` token with `DCC` everywhere
- [ ] Remove dead code, unused exports, unreachable branches
- [ ] Add JSDoc / TSDoc comments on all public APIs
- [ ] Add input validation with descriptive `TypeError` messages
- [ ] Make exported data immutable (`Object.freeze`, `as const`, `readonly`)
- [ ] Ensure tree-shakeability (named exports, no side effects)
- [ ] Use `import type` for type-only imports (TypeScript)
- [ ] Prefer native Node APIs over external dependencies
- [ ] Error messages must be actionable (include expected vs received)

### Naming Conventions

| Element          | Convention                           | Example            |
| ---------------- | ------------------------------------ | ------------------ |
| Files            | kebab-case                           | `order-pair.ts`    |
| Classes          | PascalCase                           | `BigNumber`        |
| Functions        | camelCase                            | `createOrderPair`  |
| Constants        | UPPER_SNAKE_CASE                     | `MAINNET_DATA`     |
| Types/Interfaces | PascalCase, prefix I for interfaces  | `IConfig`, `TPair` |
| Private methods  | camelCase with `_` prefix            | `_toLength`        |
| Test files       | `*.spec.ts` (TS) or `*.test.js` (JS) | `index.spec.ts`    |

### Test Requirements

- [ ] Migrate all tests from {{PREVIOUS_TEST_RUNNER}} to Vitest
- [ ] Replace `@waves` test fixtures with DecentralChain equivalents
- [ ] Add input validation tests (TypeError for bad inputs)
- [ ] Add edge case tests (empty inputs, boundary values)
- [ ] Add symmetry/idempotency tests where applicable
- [ ] Test both partial and full application (if curried APIs exist)
- [ ] Ensure tests run offline (no network calls)
- [ ] Coverage must meet thresholds after migration

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## DEPENDENCY POLICY

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

### Prefer

- Well-maintained, audited libraries
- Minimal dependency count (fewer = smaller attack surface)
- Native Node APIs when possible (`crypto`, `buffer`, `util`)
- Pure ESM packages

### Avoid

- Deprecated packages (`request`, `node-fetch` < v3, etc.)
- Heavy dependencies unless justified
- Packages with native bindings (unless critical)
- `@waves/*` packages (vendor/inline if needed)
- Packages last published > 2 years ago

### Audit Process

Before adding any dependency:

1. Check npm page for maintenance status
2. Check bundle size on bundlephobia
3. Check for known vulnerabilities via `npm audit`
4. Prefer packages with TypeScript types included

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## EXECUTION STEPS

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Execute in this exact order:

1. **Delete** legacy files (yarn.lock, .babelrc, .travis.yml, webpack configs, jest configs, tslint, old ESLint configs, .npmignore)
2. **Create/replace** all config files per templates above
3. **Refactor** source code per the Source Code Requirements
4. **Migrate** tests to Vitest, update all assertions and imports
5. **Write** hand-written `.d.ts` types (JS projects) or ensure strict TS (TS projects)
6. **Write** all governance docs (README, CONTRIBUTING, SECURITY, CODE_OF_CONDUCT, CHANGELOG)
7. **Run** `npm install`
8. **Run** `npm run bulletproof` — fix any failures
9. **Run** `npm run build` — verify clean build
10. **Run** `npm run validate` — full pipeline must pass with zero errors

### Success Criteria

The modernization is complete when ALL of the following pass:

```bash
npm run format:check    # ✅ No formatting issues
npm run lint            # ✅ No lint errors
npm run typecheck       # ✅ No type errors
npm run test            # ✅ All tests pass
npm run build           # ✅ Clean build (or build:browser for JS)
npm run check:publint   # ✅ Package structure valid
npm run check:exports   # ✅ Type exports valid
npm run check:size      # ✅ Within size budget
npm pack --dry-run      # ✅ Package contents look correct
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

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## OPTIONAL: PER-PROJECT PROMPT FILE

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

After completing the modernization, optionally create a `PROMPT.md` in the repo root.
This file should contain the filled-in version of this universal prompt with:

- All `{{VARIABLES}}` replaced with actual values
- Every file's exact final content included
- Serves as a **reproducible build recipe** — anyone can recreate the repo from scratch

This is useful for:

- Auditing what changed during modernization
- Onboarding new maintainers
- Reproducing the exact modernization on a fresh clone
- Documenting architectural decisions with full context

## --- END PROMPT ---

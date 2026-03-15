---
name: add-sdk-package
description: 'Create a new @decentralchain/* SDK package. USE WHEN: user wants to add a new package/library to the monorepo, scaffold a new module, or asks "how do I create a package". Uses the custom sdk-package Nx generator that scaffolds all required files (biome.json, vitest.config.ts, tsdown.config.ts, tsconfig.json, etc.).'
---

# Add SDK Package

Create a new `@decentralchain/*` package using the workspace's custom Nx generator.

## Prerequisites

Decide these before running the generator:

1. **Package name** — lowercase kebab-case (e.g. `my-utils`). Will be published as `@decentralchain/my-utils`.
2. **Description** — one-line npm description.
3. **Layer** — which dependency layer (determines what this package can depend on):
   - `0` — Primitives (standalone utilities, no SDK deps)
   - `1` — Domain (depends on primitives only)
   - `2` — Services (depends on primitives + domain)
   - `3` — Integration (depends on everything below)
   - `4` — Adapter (top-level adapters)

## Generate the Package

```bash
pnpm nx g sdk-package --name=<name> --description="<description>" --layer=<0-4>
```

### Example

```bash
pnpm nx g sdk-package --name=token-utils --description="Token metadata utilities for DecentralChain" --layer=1
```

This creates `packages/token-utils/` with:

| File | Purpose |
|------|---------|
| `package.json` | Configured with `@decentralchain/token-utils`, `nx.tags`, exports |
| `biome.json` | Extends root: `"extends": "//"`, `"root": false` |
| `tsconfig.json` | Extends `../../tsconfig.base.json` |
| `tsdown.config.ts` | ESM-only build (`.mjs` + `.d.mts`) |
| `vitest.config.ts` | Merges `../../vitest.base.config` (90% coverage thresholds) |
| `src/index.ts` | Entry point stub |
| `test/<name>.spec.ts` | Test file stub |

## Post-Generation Steps

1. **Install dependencies:**
   ```bash
   pnpm install
   ```

2. **Add workspace dependencies** (if needed):
   ```bash
   pnpm add @decentralchain/<dep> --filter @decentralchain/<name> --workspace
   ```
   Remember: only depend on packages at same layer or below.

3. **Validate boundaries:**
   ```bash
   node scripts/check-boundaries.mjs
   ```

4. **Add governance files** (copy from any existing package):
   - `CHANGELOG.md` (empty, auto-populated by nx release)
   - `CODE_OF_CONDUCT.md`
   - `CONTRIBUTING.md`
   - `SECURITY.md`
   - `LICENSE`
   - `knip.json`
   - `lefthook.yml`

5. **Verify the package builds and tests:**
   ```bash
   pnpm nx run @decentralchain/<name>:build
   pnpm nx run @decentralchain/<name>:test
   pnpm nx run @decentralchain/<name>:biome-lint
   ```

## Conventions

- **ESM-only** — no CommonJS. Biome enforces `noCommonJs: error`.
- **Single quotes**, semicolons, 2-space indent, LF line endings.
- Use `import type` for type-only imports (`verbatimModuleSyntax: true`).
- Package `exports` field must map `"."` to `{ "import": "./dist/index.mjs", "types": "./dist/index.d.mts" }`.
- The `files` array should include `dist/` and `src/` only.

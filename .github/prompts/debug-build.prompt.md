---
description: 'Diagnose and fix build, typecheck, or lint failures. USE WHEN a build fails, you see TypeScript errors, Biome lint errors, or need help understanding a CI failure.'
---

# Debug Build

Diagnose and fix build/typecheck/lint failures in the monorepo.

## Context

- Build pipeline: `biome-lint → typecheck → test → build → publint → attw`
- Biome 2.4.x handles lint + format (root `biome.json`, per-package `"extends": "//"`)
- TypeScript 5.9.x with maximum strictness (strict + noUncheckedIndexedAccess + exactOptionalPropertyTypes)
- tsdown produces ESM-only output (`.mjs` + `.d.mts`) for SDK packages
- Builds are dependency-ordered via Nx (`dependsOn: [^build]`)

## Diagnosis Steps

1. **Identify the failing project and target:**
   ```bash
   pnpm nx run <project>:<target> --verbose
   ```

2. **For TypeScript errors:**
   ```bash
   pnpm nx run <project>:typecheck
   ```
   Common causes:
   - Missing `import type` for type-only imports (`verbatimModuleSyntax: true`)
   - Upstream dep not built yet → `pnpm nx run <project>:build`
   - Missing tsconfig reference → add to `references` in `tsconfig.json`

3. **For Biome lint errors:**
   ```bash
   pnpm nx run <project>:biome-fix   # auto-fix what's possible
   pnpm nx run <project>:biome-lint  # check remaining issues
   ```
   Common causes:
   - Unused imports/variables → Biome auto-fixes these
   - `noCommonJs` → convert `require()` to `import`
   - Missing `import type` → Biome's `useImportType` rule

4. **For build errors:**
   ```bash
   pnpm nx run <project>:build --verbose
   ```
   Common causes:
   - Circular dependency → use `pnpm nx graph` to visualize
   - Missing workspace dep → `pnpm add @decentralchain/<dep> --filter @decentralchain/<project> --workspace`
   - Layer violation → `node scripts/check-boundaries.mjs`

5. **For test failures:**
   ```bash
   pnpm nx run <project>:test -- --reporter=verbose
   ```
   Common causes:
   - Stale build artifacts → `pnpm nx run <project>:build` first
   - Missing test dependencies
   - Coverage threshold not met → check `vitest.config.ts`

## Nuclear Options (if stuck)

```bash
pnpm nx reset             # Clear Nx cache
pnpm nx run-many -t build --skipNxCache   # Rebuild everything fresh
```

---
description: 'Run a comprehensive quality check across the monorepo. USE WHEN preparing a PR, before a release, or to verify workspace health. Runs boundary checks, lint, typecheck, and tests.'
---

# Validate Workspace

Run the full quality pipeline to verify the monorepo is healthy.

## Context

- 22 SDK packages + 3 apps, all managed by Nx
- Quality pipeline: `lint → typecheck → test → build → publint → attw`
- Module boundary enforcement via `scripts/check-boundaries.mjs`
- Biome for lint + format, TypeScript for type checking, Vitest for tests

## Full Validation Sequence

Run these in order — each step should pass before proceeding:

```bash
# 1. Module boundaries — packages respect layer:N dependency rules
node scripts/check-boundaries.mjs

# 2. Lint — Biome checks formatting + lint rules
pnpm nx run-many -t biome-lint

# 3. Typecheck — TypeScript strict mode across all packages
pnpm nx run-many -t typecheck --exclude=cubensis-connect,exchange,scanner

# 4. Test — Vitest with coverage thresholds
pnpm nx run-many -t test

# 5. Build — tsdown ESM-only output
pnpm nx run-many -t build
```

## Quick Check (affected only)

For faster feedback when working on a feature branch:

```bash
node scripts/check-boundaries.mjs
pnpm nx affected -t biome-lint typecheck test build
```

## Fix Common Issues

- **Biome errors**: `pnpm biome check --write .` (auto-fix)
- **Type errors**: Check `import type` usage and tsconfig references
- **Boundary violations**: Check layer tags in package.json → nx.tags
- **Stale cache**: `pnpm nx reset` then re-run

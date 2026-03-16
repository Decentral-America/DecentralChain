---
description: 'Test only the packages affected by your current changes. USE WHEN you want fast feedback on what you changed without running the full test suite.'
---

# Test Affected

Run tests only for packages affected by current changes, leveraging Nx's dependency graph to detect impacted downstream consumers.

## Context

- Test runner: Vitest 4.x with v8 coverage
- Nx `affected` compares against `main` (see `nx.json` → `defaultBase`)
- Test caching is enabled — unchanged packages replay from cache
- Coverage thresholds: ≥90% established, ≥80% new, ≥95% crypto

## Instructions

1. Run affected tests:
   ```bash
   pnpm nx affected -t test
   ```
2. If you need to see which projects are affected:
   ```bash
   pnpm nx show projects --affected
   ```
3. To test a specific package:
   ```bash
   pnpm nx run <project>:test
   ```
4. To skip the cache (force re-run):
   ```bash
   pnpm nx affected -t test --skipNxCache
   ```
5. If tests fail, check:
   - The test output for assertion failures
   - Whether upstream dependencies need to be built first (`pnpm nx run <project>:build`)
   - Coverage thresholds in the package's `vitest.config.ts`

## After Tests Pass

Run the full quality gate if preparing to commit:
```bash
pnpm nx affected -t biome-lint    # lint affected
pnpm nx affected -t typecheck     # type-check affected
```

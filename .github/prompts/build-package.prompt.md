---
description: 'Build a specific package and its dependencies. USE WHEN you want to build a single @decentralchain/* package or check if a package compiles cleanly.'
---

# Build Package

Build the specified package using Nx. This ensures all upstream dependencies are built first (respecting the dependency graph), and results are cached.

## Context

- This is an Nx + pnpm monorepo with 22 SDK packages and 3 apps
- Build tool: tsdown (ESM-only `.mjs` + `.d.mts` output) for SDK packages, Vite for apps
- All builds go through Nx for caching and dependency ordering: `dependsOn: [^build]`
- Build outputs are in `{projectRoot}/dist`

## Instructions

1. Use the Nx MCP `nx_project_details` tool to confirm the project name and available targets
2. Run the build:
   ```bash
   pnpm nx run <project>:build
   ```
3. If the build fails, check for:
   - TypeScript errors (`pnpm nx run <project>:typecheck`)
   - Missing workspace dependencies (check `package.json` for `workspace:*` deps)
   - Layer boundary violations (`node scripts/check-boundaries.mjs`)
4. After a successful build, validate the output:
   ```bash
   pnpm nx run <project>:check:publint   # validates package.json exports
   pnpm nx run <project>:check:exports   # validates TypeScript type exports
   ```

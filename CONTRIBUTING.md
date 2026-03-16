# Contributing to DecentralChain SDK

Thank you for your interest in contributing!

## Code of Conduct

By participating, you agree to abide by our [Code of Conduct](./CODE_OF_CONDUCT.md).

## Prerequisites

- **Node.js** >= 24 (see `.node-version`)
- **pnpm** >= 10.32 (corepack-managed via `packageManager` field)

## Setup

```bash
git clone https://github.com/Decentral-America/DecentralChain.git
cd DecentralChain
pnpm install
```

## Monorepo Commands

All tasks run through **Nx**. Never call underlying tools directly.

| Command | Description |
| --- | --- |
| `pnpm nx affected -t build` | Build affected packages |
| `pnpm nx affected -t test` | Test affected packages |
| `pnpm nx affected -t biome-lint` | Lint affected packages |
| `pnpm nx run-many -t typecheck` | Type-check all packages |
| `pnpm nx graph` | Visualize dependency graph |
| `node scripts/check-boundaries.mjs` | Validate module boundary layers |

## Workflow

1. Fork → branch from `main` (`feat/my-feature`)
2. Make changes with tests
3. Run `pnpm nx affected -t biome-lint build test` to validate
4. Commit with [Conventional Commits](https://www.conventionalcommits.org/)
5. Push → open PR

### Commit Convention

```
feat(transactions): add new method
fix(crypto): handle edge case
docs: update API reference
chore(deps): bump dependencies
test(signer): add coverage for X
refactor(marshall): simplify implementation
```

Scope should be the package name (without `@decentralchain/` prefix) when the change is package-specific.

## Architecture Rules

- Packages are organized into dependency layers (0–4). A package may only depend on packages in the same layer or below.
- Apps (`apps/`) can depend on any SDK package. SDK packages must never depend on apps.
- Run `node scripts/check-boundaries.mjs` to validate before pushing.

## PR Checklist

- [ ] Tests added/updated for affected packages
- [ ] `pnpm nx affected -t biome-lint build test` passes
- [ ] Module boundaries respected (layer constraints)
- [ ] Commit messages follow conventional commits
- [ ] No CommonJS — ESM-only (`import`/`export`)

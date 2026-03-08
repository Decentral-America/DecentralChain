# Contributing to @decentralchain/ride-js

Thank you for your interest in contributing!

## Code of Conduct

By participating, you agree to abide by our [Code of Conduct](./CODE_OF_CONDUCT.md).

## Prerequisites

- **Node.js** >= 24 (24 recommended — see `.node-version`)
- **npm** >= 10 (latest stable recommended)

## Setup

```bash
git clone https://github.com/Decentral-America/ride-js.git
cd ride-js
npm install
```

## Scripts

| Command                     | Description                              |
| --------------------------- | ---------------------------------------- |
| `npm run build`             | Build distribution files                 |
| `npm test`                  | Run tests with Vitest                    |
| `npm run test:watch`        | Tests in watch mode                      |
| `npm run test:coverage`     | Tests with V8 coverage                   |
| `npm run typecheck`         | TypeScript type checking                 |
| `npm run lint`              | Biome lint with auto-fix                     |
| `npm run lint:check`        | Biome lint (check only, no fix)              |
| `npm run format`            | Format with Biome                     |
| `npm run format:check`      | Check formatting (no write)              |
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

```
feat: add new method
fix: handle edge case
docs: update API reference
chore: bump dependencies
test: add coverage for X
refactor: simplify implementation
```

## Standards

- **Biome** — auto-formatting on commit
- **Coverage** — thresholds enforced (70%+, ratcheting to 90%)
- **ESM-only** — primary output is ESM, CJS provided for legacy compat

## PR Checklist

- [ ] Tests added/updated
- [ ] `npm run bulletproof` passes
- [ ] Documentation updated if needed
- [ ] Commit messages follow conventional commits

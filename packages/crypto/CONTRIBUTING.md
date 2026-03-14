# Contributing to @decentralchain/crypto

Thank you for your interest in contributing!

## Code of Conduct

By participating, you agree to abide by our [Code of Conduct](./CODE_OF_CONDUCT.md).

## Prerequisites

- **Node.js** >= 24 (see `.node-version`)
- **npm** >= 11
- **Rust** toolchain with `wasm-pack` (for WASM builds)

## Setup

```bash
git clone https://github.com/Decentral-America/crypto.git
cd crypto
npm install
```

## Scripts

| Command                     | Description                              |
| --------------------------- | ---------------------------------------- |
| `npm run build`             | Build WASM + TypeScript                  |
| `npm run build:wasm`        | Build WASM only                          |
| `npm run build:ts`          | Build TypeScript only                    |
| `npm test`                  | Run tests with Vitest                    |
| `npm run test:watch`        | Tests in watch mode                      |
| `npm run test:coverage`     | Tests with V8 coverage                   |
| `npm run typecheck`         | TypeScript type checking                 |
| `npm run lint`              | Lint with Biome                          |
| `npm run lint:fix`          | Lint with auto-fix                       |
| `npm run format`            | Format with Biome                        |
| `npm run validate`          | Full CI validation pipeline              |
| `npm run bulletproof`       | Lint fix + typecheck + test              |
| `npm run bulletproof:check` | CI-safe: check lint + tc + test          |

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

- **Strict mode** — all TypeScript strict flags enabled
- **Biome** — formatting and linting on commit
- **Coverage** — thresholds enforced (80%+)
- **WASM** — Rust/wasm-pack for Ed25519/X25519 cryptographic operations

## PR Checklist

- [ ] Tests added/updated
- [ ] `npm run bulletproof` passes
- [ ] Documentation updated if needed
- [ ] Commit messages follow conventional commits

# Contributing to @decentralchain/bignumber

Thank you for your interest in contributing! This document provides guidelines and instructions.

## Development Setup

### Prerequisites

- **Node.js** >= 22 (24 recommended — see `.node-version`)
- **npm** >= 11

### Getting Started

```bash
git clone https://github.com/Decentral-America/bignumber.git
cd bignumber
npm install
```

### Available Scripts

| Command                 | Description                              |
| ----------------------- | ---------------------------------------- |
| `npm run build`         | Build ESM, CJS, and UMD bundles via tsup |
| `npm test`              | Run tests with Vitest                    |
| `npm run test:watch`    | Run tests in watch mode                  |
| `npm run test:coverage` | Run tests with V8 coverage               |
| `npm run typecheck`     | TypeScript type checking                 |
| `npm run lint`          | ESLint (type-aware, strict)              |
| `npm run lint:fix`      | ESLint with auto-fix                     |
| `npm run format`        | Format code with Prettier                |
| `npm run validate`      | Full CI validation pipeline              |
| `npm run bulletproof`   | Format + lint fix + typecheck + test     |

## Workflow

1. **Fork** the repository
2. **Create a branch** from `main` (`git checkout -b feat/my-feature`)
3. **Make your changes** with tests
4. **Run the full pipeline**: `npm run bulletproof`
5. **Commit** using [Conventional Commits](https://www.conventionalcommits.org/)
6. **Push** and open a Pull Request

### Commit Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add new comparison method
fix: handle NaN edge case in fromBytes
docs: update API reference
chore: bump dependencies
test: add coverage for unsigned range
refactor: simplify toBytes implementation
```

## Code Standards

- **TypeScript strict mode** — all strict compiler flags enabled
- **Type-aware ESLint** — `strictTypeChecked` + `stylisticTypeChecked`
- **Prettier** — auto-formatting on commit via Husky + lint-staged
- **100% type safety** — no untyped escape hatches in production code
- **Immutable by default** — all `BigNumber` operations return new instances

## Testing

- All new features must include tests
- Coverage thresholds are enforced (90%+ for branches, functions, lines, statements)
- Run `npm run test:coverage` to verify locally

## Pull Request Checklist

- [ ] Tests added/updated
- [ ] `npm run bulletproof` passes
- [ ] Documentation updated if needed
- [ ] Commit messages follow conventional commits

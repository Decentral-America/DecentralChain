# Contributing to @decentralchain/protobuf-serialization

Thank you for your interest in contributing!

## Code of Conduct

By participating, you agree to abide by our [Code of Conduct](./CODE_OF_CONDUCT.md).

## Prerequisites

- **Node.js** >= 22 (24 recommended — see `.nvmrc`)
- **npm** >= 10 (latest LTS recommended)

## Setup

```bash
git clone https://github.com/Decentral-America/protobuf-serialization.git
cd protobuf-serialization
npm install
```

## Scripts

| Command                     | Description                                      |
| --------------------------- | ------------------------------------------------ |
| `npm run build`             | Generate JS + types from proto files             |
| `npm test`                  | Run tests with Vitest                            |
| `npm run test:watch`        | Tests in watch mode                              |
| `npm run test:coverage`     | Tests with V8 coverage                           |
| `npm run typecheck`         | TypeScript type checking                         |
| `npm run lint`              | ESLint                                           |
| `npm run lint:fix`          | ESLint with auto-fix                             |
| `npm run format`            | Format with Prettier                             |
| `npm run validate`          | Full CI validation pipeline                      |
| `npm run bulletproof`       | Format + lint fix + build + tc + test            |
| `npm run bulletproof:check` | CI-safe: check format + lint + build + tc + test |

## Workflow

1. Fork → branch from `main` (`feat/my-feature`)
2. Make changes with tests
3. `npm run bulletproof`
4. Commit with [Conventional Commits](https://www.conventionalcommits.org/)
5. Push → open PR

### Commit Convention

```
feat: add new proto message
fix: handle edge case in encoding
docs: update API reference
chore: bump dependencies
test: add coverage for roundtrip encoding
refactor: simplify build pipeline
```

## Proto File Guidelines

- The `package waves;` namespace is a **protocol-level identifier** and must not be changed (it defines the wire format).
- Language-specific options (`java_package`, `csharp_namespace`, `go_package`) use DecentralChain branding.
- When adding new message types, add corresponding roundtrip tests in `test/`.
- Proto files must be compatible with `pbjs` (protobufjs) for JavaScript generation.

## Standards

- **Prettier** — auto-formatting on commit
- **ESLint** — flat config for test and config files
- **Tests** — roundtrip encode/decode verification

## PR Checklist

- [ ] Tests added/updated
- [ ] `npm run bulletproof` passes
- [ ] Documentation updated if needed
- [ ] Commit messages follow conventional commits

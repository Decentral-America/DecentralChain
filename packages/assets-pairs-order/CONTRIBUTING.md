# Contributing to @decentralchain/assets-pairs-order

Thank you for your interest in contributing! This document provides guidelines and instructions for contributing to this project.

## Code of Conduct

By participating in this project, you agree to abide by our [Code of Conduct](./CODE_OF_CONDUCT.md).

## Getting Started

### Prerequisites

- **Node.js** >= 20 (use `.nvmrc` with [nvm](https://github.com/nvm-sh/nvm): `nvm use`)
- **npm** >= 10

### Setup

```bash
git clone https://github.com/Decentral-America/assets-pairs-order.git
cd assets-pairs-order
npm install
```

Husky will automatically set up Git hooks via the `prepare` script.

## Development Workflow

### Branch Naming

| Prefix      | Purpose           | Example                   |
| ----------- | ----------------- | ------------------------- |
| `feat/`     | New features      | `feat/add-new-network`    |
| `fix/`      | Bug fixes         | `fix/ordering-edge-case`  |
| `docs/`     | Documentation     | `docs/update-api-section` |
| `refactor/` | Code refactoring  | `refactor/simplify-curry` |
| `test/`     | Test improvements | `test/add-coverage`       |
| `chore/`    | Maintenance       | `chore/update-deps`       |

### Making Changes

1. Create a feature branch from `main`:

   ```bash
   git checkout -b feat/my-feature
   ```

2. Make your changes with clear, atomic commits.

3. Run the full validation suite:

   ```bash
   npm run bulletproof
   ```

4. Push and open a Pull Request.

### Available Scripts

| Script                      | Description                                     |
| --------------------------- | ----------------------------------------------- |
| `npm test`                  | Run tests with Vitest                           |
| `npm run test:coverage`     | Run tests with coverage reporting               |
| `npm run lint`              | Check for lint errors                           |
| `npm run lint:fix`          | Auto-fix lint errors                            |
| `npm run format`            | Format code with Prettier                       |
| `npm run format:check`      | Check formatting without writing                |
| `npm run typecheck`         | Run TypeScript type checking                    |
| `npm run bulletproof`       | Format + lint fix + typecheck + test (auto-fix) |
| `npm run bulletproof:check` | Format check + lint + typecheck + test (CI)     |
| `npm run build:browser`     | Build IIFE browser bundle                       |

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

**Types:** `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`

**Examples:**

```
feat: add support for custom comparator functions
fix: correct ordering when both assets have same priority
docs: clarify currying behavior in README
test: add edge-case tests for empty priority list
```

## Pull Request Process

1. Ensure `npm run bulletproof:check` passes.
2. Update the README if you changed the public API.
3. Add a CHANGELOG entry under `## [Unreleased]`.
4. Request review from a maintainer.
5. Squash and merge once approved.

## Reporting Bugs

Please use [GitHub Issues](https://github.com/Decentral-America/assets-pairs-order/issues) with:

- A clear, descriptive title
- Steps to reproduce
- Expected vs. actual behavior
- Node.js version and OS

## Suggesting Features

Open a [GitHub Discussion](https://github.com/Decentral-America/assets-pairs-order/discussions) or issue with:

- Use case description
- Proposed API (if applicable)
- Any alternatives you've considered

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](./LICENSE).

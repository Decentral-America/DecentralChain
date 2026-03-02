# Changelog

Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
Versioning: [Semantic Versioning](https://semver.org/spec/v2.0.0.html)

## [1.0.0] - 2026-03-02

### Changed

- **BREAKING**: Migrated to pure ESM (`"type": "module"`).
- **BREAKING**: Removed default export — use `import { ProviderCubensis }` instead.
- Minimum Node.js version is now 22.
- Replaced mocha with Vitest.
- Replaced webpack with tsup.
- Upgraded all dependencies to latest versions.
- Inlined `@waves/ts-types` (`TRANSACTION_TYPE`) — no more Waves dependency.
- Inlined `@waves/ts-lib-crypto` utilities — uses native Web Crypto API.
- Replaced `@waves/node-api-js` fee calculation with native `fetch`.
- Removed Waves URL normalization from network validation.
- Flattened monorepo structure into single package.

### Added

- TypeScript strict mode with full type-aware ESLint.
- ESLint flat config with Prettier integration.
- Husky + lint-staged pre-commit hooks.
- GitHub Actions CI pipeline (Node 22, 24).
- Dependabot for automated dependency updates.
- Code coverage with 90% threshold enforcement.
- Bundle size budget enforcement (10 kB).
- Package validation via publint and attw.
- `TRANSACTION_TYPE` constant and `TransactionType`/`TransactionMap` type exports.
- Comprehensive JSDoc on all public APIs.
- Unit tests for crypto utilities, decorators, utils, and transaction types.
- CONTRIBUTING.md, SECURITY.md, CODE_OF_CONDUCT.md.

### Removed

- Legacy webpack build tooling.
- Monorepo workspace structure (provider/ + test-app/).
- All `@waves/*` package dependencies.
- Selenium-based e2e tests (moved to separate repo concern).
- Codecov integration, Dockerfile, legacy CI workflows.

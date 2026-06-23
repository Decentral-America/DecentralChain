# Changelog

Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
Versioning: [Semantic Versioning](https://semver.org/spec/v2.0.0.html)

## [5.0.1] - 2025-07-26

### Security

- Added `npm audit --audit-level=high` step to CI pipeline.
- Added runtime warnings in `seedUtils` for weak passwords (<8 chars) and low encryption rounds (<1000).
- Preserved original error causes via `{ cause }` in `seedUtils/decryptSeedPhrase` and `generic/chainIdFromRecipient`.
- Documented `wavesTransaction` protobuf wire-format field in `proto-serialize.ts`.

### Changed

- Raised code coverage thresholds from 50% to 70% (statements, branches, functions, lines).
- Tightened ESLint: `@typescript-eslint/no-unused-vars` → `error`, added `no-console` rule, added `varsIgnorePattern: '^_'`.
- Removed stale `preserve-caught-error: 'off'` ESLint override.
- Updated CI matrix from Node 22/24 to Node 24/26.

### Removed

- 44 unused imports across 8 test files (exchange, data, invoke-script, transfer, burn, lease, alias, mass-transfer).
- CJS `require('fs')` from `exchange.spec.ts`.
- Unused `buffer` devDependency.
- 14 unused named exports from test helpers (`exampleTxs.ts`, `minimalParams.ts`).

### Added

- Comprehensive `seedUtils` test suite (16 new tests): Seed class construction, encryption/decryption round-trip, `strengthenPassword`, `generateNewSeed`, error cases.
- Coverage improved: seedUtils 2.77% → 88.88%, overall 79% → 82.7%.

## [5.0.0] - 2026-03-01

### Changed

- **BREAKING**: Migrated to pure ESM (`"type": "module"`) with CJS compatibility via tsup.
- **BREAKING**: Minimum Node.js version is now 22.
- Replaced Jest with Vitest.
- Replaced webpack + tsc with tsup.
- Upgraded TypeScript from 3.9 to 5.9.
- Upgraded all dependencies to latest versions.
- Rebranded from `@waves` to `@decentralchain`.
- Chain ID updated from 87 (W) to 76 (L) for DCC mainnet.
- Node URLs updated to `nodes.decentralchain.io`.
- Native asset references changed from WAVES to DCC.

### Added

- ESLint flat config with Prettier integration.
- Husky + lint-staged pre-commit hooks.
- GitHub Actions CI pipeline (Node 22, 24).
- Dependabot for automated dependency updates.
- Code coverage with threshold enforcement.
- CONTRIBUTING.md, SECURITY.md, CODE_OF_CONDUCT.md.
- publint + attw package validation.
- size-limit bundle size enforcement.

### Removed

- Legacy build tooling (webpack, tslint).
- Azure Pipelines CI.
- All Waves branding and references.

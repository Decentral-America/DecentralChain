# Changelog

Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
Versioning: [Semantic Versioning](https://semver.org/spec/v2.0.0.html)

## [1.0.0] - 2026-02-28

### Changed

- **BREAKING**: Migrated to pure ESM (`"type": "module"`).
- Minimum Node.js version is now 24.
- Replaced jest with Vitest.
- Replaced tsc with tsup.
- Upgraded all dependencies to latest versions.
- Rebranded source imports from `@waves` to `@decentralchain`.

### Added

- TypeScript strict mode with full type definitions.
- ESLint flat config with Prettier integration.
- Husky + lint-staged pre-commit hooks.
- GitHub Actions CI pipeline (Node [24, 26]).
- Dependabot for automated dependency updates.
- Code coverage with threshold enforcement (90%+).
- CONTRIBUTING.md, SECURITY.md, CODE_OF_CONDUCT.md.
- Unsafe integer detection for monetary values.
- Comprehensive edge-case and security test suite (146 tests).

### Removed

- Legacy build tooling (tsc direct compilation).
- jest test runner and ts-jest.
- All Waves branding in source code and documentation.

### Note

- Production dependency `@decentralchain/ts-types` currently resolves via npm alias to `@waves/ts-types@0.3.3`. A native `@decentralchain/ts-types` package will replace this in a future release.

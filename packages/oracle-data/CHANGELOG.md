# Changelog

Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
Versioning: [Semantic Versioning](https://semver.org/spec/v2.0.0.html)

## [1.0.0] - 2026-02-28

### Changed

- **BREAKING**: Migrated to pure ESM (`"type": "module"`).
- Minimum Node.js version is now 22.
- Replaced Jest with Vitest.
- Replaced webpack with tsup.
- Upgraded all dependencies to latest versions.
- Rebranded from `@decentralchain` 0.x to `@decentralchain` 1.0.
- Strict TypeScript configuration with all strict flags enabled.
- ESM-first dual package (ESM + CJS) via tsup.

### Added

- TypeScript strict mode with full type coverage.
- ESLint flat config with type-aware rules and Prettier integration.
- Husky + lint-staged pre-commit hooks.
- GitHub Actions CI pipeline (Node 22, 24).
- Dependabot for automated dependency updates.
- Code coverage with V8 provider and threshold enforcement (90%+).
- Bundle size budget enforcement via size-limit.
- Package validation via publint and attw.
- CONTRIBUTING.md, SECURITY.md, CODE_OF_CONDUCT.md.
- JSDoc comments on all public APIs.

### Removed

- Legacy webpack build tooling.
- Jest test runner and ts-jest.
- Legacy tsconfig paths and experimental decorators.

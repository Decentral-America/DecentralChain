# Changelog

Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
Versioning: [Semantic Versioning](https://semver.org/spec/v2.0.0.html)

## [1.0.0] - 2026-02-28

### Changed

- **BREAKING**: Migrated to pure ESM (`"type": "module"`).
- Minimum Node.js version is now 24.
- Replaced Jest with Vitest.
- Replaced tsc + browserify with tsup.
- Upgraded all dependencies to latest versions.
- Rebranded from `@waves` to `@decentralchain`.

### Added

- TypeScript strict mode with full type checking.
- ESLint flat config with Prettier integration.
- Husky + lint-staged pre-commit hooks.
- GitHub Actions CI pipeline (Node 24, 26).
- Dependabot for automated dependency updates.
- Code coverage with threshold enforcement (90%+).
- CONTRIBUTING.md, SECURITY.md, CODE_OF_CONDUCT.md.
- tsup-based ESM-only build output.

### Removed

- Legacy build tooling (browserify + uglify-js).
- Jest configuration and dependencies.
- All Waves branding and references.

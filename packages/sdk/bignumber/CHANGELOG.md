# Changelog

Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
Versioning: [Semantic Versioning](https://semver.org/spec/v2.0.0.html)

## [1.1.1] - 2026-02-28

### Changed

- **BREAKING**: Migrated to pure ESM (`"type": "module"`).
- Minimum Node.js version is now 22.
- Replaced jest with Vitest.
- Replaced webpack with tsup.
- Upgraded all dependencies to latest versions.
- Rebranded from `@waves` to `@decentralchain`.

### Added

- TypeScript strict mode with full type definitions.
- ESLint flat config with Prettier integration.
- Husky + lint-staged pre-commit hooks.
- GitHub Actions CI pipeline (Node 22, 24).
- Dependabot for automated dependency updates.
- Code coverage with threshold enforcement (90%+).
- CONTRIBUTING.md, SECURITY.md, CODE_OF_CONDUCT.md.

### Removed

- Legacy build tooling (webpack).
- yarn lockfile.
- All Waves branding and references.

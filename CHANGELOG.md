# Changelog

Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
Versioning: [Semantic Versioning](https://semver.org/spec/v2.0.0.html)

## [2.0.0] - 2025-07-16

### Changed

- **BREAKING**: Migrated to pure ESM (`"type": "module"`).
- Minimum Node.js version is now 22.
- Replaced Jest with Vitest.
- Replaced webpack with tsup.
- Upgraded all dependencies to latest versions.
- Rebranded from `@waves` to `@decentralchain`.

### Added

- TypeScript strict mode / type definitions.
- ESLint flat config with Prettier integration.
- Husky + lint-staged pre-commit hooks.
- GitHub Actions CI pipeline (Node 22, 24).
- Dependabot for automated dependency updates.
- Code coverage with threshold enforcement.
- CONTRIBUTING.md, SECURITY.md, CODE_OF_CONDUCT.md.
- Dual ESM/CJS output with proper exports map.

### Removed

- Legacy build tooling (webpack, dual tsconfig).
- `node-fetch` dependency (uses native `fetch` on Node 22+).
- All Waves branding and references.

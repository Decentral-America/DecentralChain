# Changelog

Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
Versioning: [Semantic Versioning](https://semver.org/spec/v2.0.0.html)

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

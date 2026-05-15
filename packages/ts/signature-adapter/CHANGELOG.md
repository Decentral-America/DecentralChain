# Changelog

Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
Versioning: [Semantic Versioning](https://semver.org/spec/v2.0.0.html)

## [7.0.0] - 2026-03-01

### Changed

- **BREAKING**: Migrated to pure ESM (`"type": "module"`).
- Minimum Node.js version is now 22.
- Replaced Jest with Vitest.
- Replaced browserify/uglifyjs with tsup.
- Upgraded TypeScript from 3.2 to 5.9.
- Upgraded all dependencies to latest versions.
- Rebranded from `@waves` to `@decentralchain`.
- Broke circular dependency in adapter imports.

### Added

- TypeScript strict mode with all strict flags enabled.
- ESLint 10 flat config with type-aware rules and Prettier integration.
- Husky + lint-staged pre-commit hooks.
- GitHub Actions CI pipeline (Node 22, 24).
- Dependabot for automated dependency updates.
- Code coverage with V8 provider and threshold enforcement.
- tsup dual-format build (ESM + CJS).
- publint and attw package validation.
- size-limit bundle size checking.
- CONTRIBUTING.md, SECURITY.md, CODE_OF_CONDUCT.md.
- `.editorconfig`, `.node-version`, `.npmrc`.

### Removed

- Legacy build tooling (browserify, uglifyjs).
- Jest and ts-jest.
- yarn.lock / npm-specific lockfile (regenerated).
- `.npmignore` (replaced by `files` in package.json).
- All Waves branding and references.
- `ramda-usage.d.ts` (replaced by `@types/ramda`).

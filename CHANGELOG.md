# Changelog

Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
Versioning: [Semantic Versioning](https://semver.org/spec/v2.0.0.html)

## [3.0.0] - 2026-03-01

### Changed

- **BREAKING**: Migrated to pure ESM (`"type": "module"`).
- **BREAKING**: Minimum Node.js version is now 22.
- **BREAKING**: `IAssetJSON` no longer extends `IAssetInfo` — standalone interface with exact types.
- **BREAKING**: `ICandleJSON` no longer extends `ICandleInfo` — standalone interface with exact types.
- Replaced Mocha + Chai with Vitest.
- Replaced tsc + browserify + uglify-js with tsup (ESM + CJS dual output).
- Replaced `||` with `??` for optional property defaults (fixes empty-string bug).
- Upgraded TypeScript to 5.9 with all strict flags enabled.
- Rebranded from `@waves` to `@decentralchain`.

### Added

- TypeScript strict mode with `exactOptionalPropertyTypes`, `noUncheckedIndexedAccess`, etc.
- ESLint flat config with type-aware `typescript-eslint` and Prettier integration.
- Husky + lint-staged pre-commit hooks.
- GitHub Actions CI pipeline (Node 22, 24).
- Dependabot for automated dependency updates.
- Code coverage with V8 provider and threshold enforcement (90%).
- Bundle size budget enforcement via size-limit (10 kB).
- Package validation via publint and @arethetypeswrong/cli.
- JSDoc comments on all public APIs.
- CONTRIBUTING.md, SECURITY.md, CODE_OF_CONDUCT.md.
- Additional test coverage for arithmetic, comparisons, edge cases.

### Removed

- Legacy build tooling (tsc + browserify + uglify-js).
- Mocha, Chai, and @types/mocha, @types/chai dev dependencies.
- npm `prepublish` / `prepare` build hook (replaced with `prepack`).
- All Waves branding and references.

## [2.0.7] - Previous

Legacy `@waves/data-entities` version. See original repository for history.

# Changelog

Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
Versioning: [Semantic Versioning](https://semver.org/spec/v2.0.0.html)

## [2.0.0] - 2026-03-01

### Changed

- **BREAKING**: Migrated to pure ESM (`"type": "module"`).
- **BREAKING**: Upgraded `protobufjs` from v6 to v8 (generated code uses ES module syntax).
- **BREAKING**: Upgraded `long` from v4 to v5.
- Minimum Node.js version is now 22 (24 recommended).
- Proto generation now outputs ES modules (`-w es6`) instead of CommonJS.
- Moved `@types/long` from dependencies to removal (long v5 includes its own types).
- Updated proto file language options (`java_package`, `csharp_namespace`, `go_package`) to DecentralChain branding.
- Upgraded all dependencies to latest versions.
- Rebranded from `@waves` to `@decentralchain`.

### Added

- ESLint flat config with Prettier integration.
- Vitest test suite with encode/decode roundtrip tests.
- Husky + lint-staged pre-commit hooks.
- GitHub Actions CI pipeline (Node 22, 24).
- Dependabot for automated dependency updates.
- CONTRIBUTING.md, SECURITY.md, CODE_OF_CONDUCT.md.
- `.editorconfig`, `.npmrc`, `.nvmrc` for consistent tooling.
- `publint` and `attw` package validation.
- `size-limit` bundle size budget.

### Removed

- CommonJS module output.
- `@types/long` dependency (types now bundled with `long` v5).
- All remaining Waves branding from proto file options and documentation.

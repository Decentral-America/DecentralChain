# Changelog

Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
Versioning: [Semantic Versioning](https://semver.org/spec/v2.0.0.html)

## [2.0.0] - 2026-02-28

### Changed

- **BREAKING**: Migrated to pure ESM (`"type": "module"`).
- Minimum Node.js version is now 22.
- Replaced Jest with Vitest.
- Replaced tsc + babel with tsup.
- Upgraded all dependencies to latest versions.
- Rebranded from `@waves` to `@decentralchain`.
- Error function now throws proper `SyntaxError` instances instead of plain objects.

### Added

- TypeScript strict mode with all strict compiler flags enabled.
- ESLint flat config with type-aware rules and Prettier integration.
- Husky + lint-staged pre-commit hooks.
- GitHub Actions CI pipeline (Node 22, 24).
- Dependabot for automated dependency updates.
- Code coverage with threshold enforcement (90%+).
- Named exports: `create`, `IOptions`, `JsonHandler` types.
- JSDoc comments on all public APIs.
- CONTRIBUTING.md, SECURITY.md, CODE_OF_CONDUCT.md.
- 97 comprehensive tests (up from 11).

### Removed

- Legacy build tooling (tsc + babel).
- All Waves branding and references.
- Jest and related dependencies.
- `.babelrc`, `.npmignore`, and other legacy config files.

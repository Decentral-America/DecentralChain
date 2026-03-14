# Changelog

Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
Versioning: [Semantic Versioning](https://semver.org/spec/v2.0.0.html)

## [4.2.0] - 2026-03-02

### Changed

- **BREAKING**: Migrated to pure ESM (`"type": "module"`).
- Minimum Node.js version is now 22.
- Replaced Jest with Vitest.
- Replaced tsc with tsup.
- Upgraded all dependencies to latest versions.
- Rebranded from `@waves` to `@decentralchain`.
- TypeScript strict mode fully enabled including `exactOptionalPropertyTypes`.

### Added

- TypeScript strict mode with all strict flags enabled.
- ESLint flat config with type-aware rules and Prettier integration.
- Husky + lint-staged pre-commit hooks.
- GitHub Actions CI pipeline (Node 22, 24).
- Dependabot for automated dependency updates.
- Code coverage with threshold enforcement (90%+).
- CONTRIBUTING.md, SECURITY.md, CODE_OF_CONDUCT.md.
- Input validation with descriptive error messages.
- Security hardening (URL encoding, prototype pollution protection).
- publint + attw package validation.
- size-limit bundle size enforcement.

### Removed

- Legacy build tooling (tsc + browserify).
- Jest test runner and configuration.
- All Waves branding and references.

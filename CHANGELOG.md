# Changelog

Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
Versioning: [Semantic Versioning](https://semver.org/spec/v2.0.0.html)

## [2.3.0] - 2026-03-05

### Security

- **httpGet timeout**: Added 30-second timeout to `axios.get` in `interop.js` to prevent indefinite hangs (HIGH).
- **Error logging**: Changed `console.log(e)` to `console.error(e)` in `compile()` catch block — production code must not use `console.log` (MEDIUM).
- **CI hardening**: Added `npm audit --audit-level=high` step to CI pipeline before test execution.

### Removed

- Dead `_algs` array in `test/compiler.test.ts` — unused variable referencing algorithm names.

### Changed

- **BREAKING**: Migrated to pure ESM (`"type": "module"`). CJS output retained for legacy compatibility.
- Minimum Node.js version is now 24.
- Replaced Jest with Vitest.
- Replaced Webpack with tsup.
- Upgraded all dependencies to latest stable versions.
- Rebranded from `@waves/ride-js` to `@decentralchain/ride-js`.

### Added

- ESLint flat config with typescript-eslint.
- Prettier auto-formatting with Husky pre-commit hooks.
- GitHub Actions CI pipeline (Node 24, 26).
- Dependabot for automated dependency updates.
- Code coverage with V8 provider and threshold enforcement.
- Bundle size budget enforcement via size-limit.
- Package validation via publint and attw.
- CONTRIBUTING.md, SECURITY.md, CODE_OF_CONDUCT.md.

### Removed

- Legacy build tooling (Webpack).
- Jest test runner.
- All `@waves` branding (package name, README, docs).

### Known Exceptions

- Runtime dependencies `@waves/ride-lang`, `@waves/ride-repl`, and `@waves/ts-lib-crypto`
  are retained because they ARE the Scala.js-compiled Ride compiler. No `@decentralchain`
  equivalents exist — the Ride language is identical between Waves and DecentralChain.

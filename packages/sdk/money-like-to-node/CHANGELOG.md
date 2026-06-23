# 2.0.0 (2026-06-23)

### 🚀 Features

- groth16 v2 verifier, blst 0.3.16 rebuild, 2.0 modernization sprint ([23b26ee7d](https://github.com/Decentral-America/DecentralChain/commit/23b26ee7d))
- **DCC-248:** rename packages/ts to packages/sdk ([7cafab4ae](https://github.com/Decentral-America/DecentralChain/commit/7cafab4ae))

### 🩹 Fixes

- testnet 2.0 launch hardening — wrangler, BPS, postgres, docs ([#48](https://github.com/Decentral-America/DecentralChain/pull/48))
- update all packages/ts → packages/sdk path references ([c75eb492d](https://github.com/Decentral-America/DecentralChain/commit/c75eb492d))

### 🧱 Updated Dependencies

- Updated @decentralchain/data-entities to 4.0.0
- Updated @decentralchain/bignumber to 2.0.0
- Updated @decentralchain/types to 3.0.0

### ❤️ Thank You

- Josue Rojas

# Changelog

Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
Versioning: [Semantic Versioning](https://semver.org/spec/v2.0.0.html)

## [1.0.0] - 2026-02-28

### Changed

- **BREAKING**: Migrated to pure ESM (`"type": "module"`).
- Minimum Node.js version is now 24.
- Replaced jest with Vitest.
- Replaced tsc with tsup.
- Upgraded all dependencies to latest versions.
- Rebranded source imports from `@dcc` to `@decentralchain`.

### Added

- TypeScript strict mode with full type definitions.
- ESLint flat config with Prettier integration.
- Husky + lint-staged pre-commit hooks.
- GitHub Actions CI pipeline (Node [24, 26]).
- Dependabot for automated dependency updates.
- Code coverage with threshold enforcement (90%+).
- CONTRIBUTING.md, SECURITY.md, CODE_OF_CONDUCT.md.
- Unsafe integer detection for monetary values.
- Comprehensive edge-case and security test suite (146 tests).

### Removed

- Legacy build tooling (tsc direct compilation).
- jest test runner and ts-jest.
- All Waves branding in source code and documentation.

### Note

- Production dependency `@decentralchain/types` currently resolves via npm alias to `@waves/ts-types@0.3.3`. A native `@decentralchain/types` package will replace this in a future release.

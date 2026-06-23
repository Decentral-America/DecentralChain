# 6.0.0 (2026-06-23)

### 🚀 Features

- groth16 v2 verifier, blst 0.3.16 rebuild, 2.0 modernization sprint ([23b26ee7d](https://github.com/Decentral-America/DecentralChain/commit/23b26ee7d))
- **DCC-248:** rename packages/ts to packages/sdk ([7cafab4ae](https://github.com/Decentral-America/DecentralChain/commit/7cafab4ae))

### 🩹 Fixes

- update all packages/ts → packages/sdk path references ([c75eb492d](https://github.com/Decentral-America/DecentralChain/commit/c75eb492d))

### ❤️ Thank You

- Josue Rojas

# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [5.0.0] - 2026-02-27

### Changed

- **BREAKING**: Migrated to pure ESM (`"type": "module"`). CommonJS `require()` is no longer supported.
- Minimum Node.js version is now 22 (from 16).
- Replaced Jest with Vitest for testing.
- Replaced webpack with Rollup for browser bundle.
- Added input validation with descriptive `TypeError` messages for all public API functions.
- Exported data arrays (`MAINNET_DATA`, `TESTNET_DATA`, `ARBITRARY_DATA`) are now frozen with `Object.freeze()`.
- Upgraded all dependencies to latest versions.

### Added

- TypeScript type definitions with named tuple elements and `CreateOrderPair` interface.
- ESLint flat config with Prettier integration.
- Husky + lint-staged pre-commit hooks.
- GitHub Actions CI pipeline.
- Comprehensive JSDoc documentation on all public APIs.
- EditorConfig, `.nvmrc`, `.npmrc` for contributor onboarding.
- CONTRIBUTING.md, SECURITY.md, CODE_OF_CONDUCT.md governance docs.
- Dependabot configuration for automated dependency updates.
- Code coverage via `@vitest/coverage-v8` with threshold enforcement.
- Browser bundle source maps.

### Removed

- CommonJS entry point (`require()` support).
- Legacy build tooling (webpack).

## [4.0.0] - Previous release

See [GitHub releases](https://github.com/Decentral-America/assets-pairs-order/releases) for older history.

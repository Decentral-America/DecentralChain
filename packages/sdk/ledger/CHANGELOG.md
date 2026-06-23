# 6.0.0 (2026-06-23)

### 🚀 Features

- groth16 v2 verifier, blst 0.3.16 rebuild, 2.0 modernization sprint ([23b26ee7d](https://github.com/Decentral-America/DecentralChain/commit/23b26ee7d))
- **DCC-248:** rename packages/ts to packages/sdk ([7cafab4ae](https://github.com/Decentral-America/DecentralChain/commit/7cafab4ae))

### 🩹 Fixes

- update all packages/ts → packages/sdk path references ([c75eb492d](https://github.com/Decentral-America/DecentralChain/commit/c75eb492d))

### ❤️ Thank You

- Josue Rojas

# Changelog

Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
Versioning: [Semantic Versioning](https://semver.org/spec/v2.0.0.html)

## [5.0.0] - 2026-03-01

### Changed

- **BREAKING**: Migrated to pure ESM (`"type": "module"`).
- **BREAKING**: `transport` option is now **required** in `DCCLedger` constructor (previously defaulted to deprecated U2F transport).
- **BREAKING**: Removed `@ledgerhq/hw-transport-u2f` dependency (U2F is deprecated by browsers).
- Minimum Node.js version is now 22.
- Replaced tsc + browserify build pipeline with tsup (ESM + CJS output).
- All internal `Buffer` usage replaced with `Uint8Array` for universal compatibility.
- Replaced `new Buffer()` (deprecated) with standard `Uint8Array` / `DataView` APIs.
- Upgraded `@ledgerhq/logs` to v6.
- Upgraded TypeScript to v5.9 with full strict mode.

### Added

- TypeScript strict mode with all strict flags enabled.
- ESLint flat config with type-aware rules and Prettier integration.
- Husky + lint-staged pre-commit hooks.
- GitHub Actions CI pipeline (Node 22, 24).
- Dependabot for automated dependency updates.
- Vitest test suite with 90%+ code coverage thresholds.
- Typed interfaces for all public APIs (`UserData`, `User`, `SignData`, `SignTxData`, `SignOrderData`, `DCCLedgerOptions`, `LedgerTransport`, `LedgerTransportFactory`).
- `base58Encode` utility exported as a public API.
- Input validation with descriptive `TypeError` messages.
- CONTRIBUTING.md, SECURITY.md, CODE_OF_CONDUCT.md.
- Bundle size budget enforcement (10 kB gzipped).
- Package export validation (publint + attw).

### Removed

- Legacy build tooling (tsc + browserify + babel).
- `@ledgerhq/hw-transport-u2f` dependency (deprecated).
- `@ledgerhq/hw-transport-webusb` as bundled dependency (users install their own transport).
- `@decentralchain/ts-lib-crypto` dependency (unused — library has own base58 implementation).
- `rimraf` dependency.
- `interface.d.ts` ambient module declarations (replaced by proper TypeScript types).
- `.babelrc`, `.npmignore` legacy config files.

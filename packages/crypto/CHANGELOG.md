# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.1] - 2026-03-10

### Changed

- Migrated from `@keeper-wallet/waves-crypto` to `@decentralchain/crypto`
- Replaced legacy `tweetnacl` with `@noble/hashes` and `@scure/base`
- Full ESM-only build with TypeScript strict mode
- Added Biome linting and formatting
- Added Vitest test suite (44 tests)
- Added publint and attw validation

## [1.0.0] - 2026-03-06

### Added

- Initial release as `@decentralchain/crypto`
- Ed25519/X25519 key generation via WASM
- AES-ECB/CBC encryption and decryption
- Seed phrase generation and management
- Blake2b, Keccak, SHA-256 hashing
- Base58/Base64 encoding utilities

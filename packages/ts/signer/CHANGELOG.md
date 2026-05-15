# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2025-07-02

### Security

- **CRITICAL**: Fixed `getBalance()` tokens calculation — was multiplying by `10^decimals` instead of dividing, which produced astronomically incorrect balance values for display
- **HIGH**: Fixed `catchProviderError` decorator referencing `this._console` (non-existent) instead of `this._logger` — provider errors were being silently swallowed
- Removed constructor logging of full options object to prevent potential info leak at verbose log level
- Changed `errorHandlerFactory` to return errors instead of throwing internally — callers now explicitly throw, eliminating dead code and clarifying control flow

### Added

- `.husky/pre-commit` hook — pre-commit enforcement was inactive (only deprecated v8 structure existed)
- `.editorconfig` per 2-MODERNIZE.md specification
- `no-bitwise` ESLint rule for financial code safety (prevents accidental `&` vs `&&`)
- `CHANGELOG.md` (this file)

### Changed

- **README.md**: Complete rewrite — removed all Waves/wavesplatform branding (50+ references), replaced with proper DecentralChain documentation
- **LICENSE**: Updated copyright from "Inal Kardanov" to "DecentralChain"
- **`.gitignore`**: Expanded to match 2-MODERNIZE.md specification
- `Balance.tokens` JSDoc corrected from "multiplied by" to "divided by"
- `logger.ts` comment: removed legacy `@waves/client-logs` reference
- `test/test-env.ts` comment: removed `@waves/node-state` reference
- `knip.json`: removed stale ignore/entry patterns per knip hints
- `decorators.ts` `TSigner` type: `_console` field renamed to `_logger` to match Signer class

### Migration from @waves/signer

This is the first release of `@decentralchain/signer`, a complete migration from `@waves/signer`. All Waves branding, endpoints, and dependencies have been replaced with DecentralChain equivalents.

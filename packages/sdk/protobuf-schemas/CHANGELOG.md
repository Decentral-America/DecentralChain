## JVM 1.6.5 (unreleased)

### 🚀 Features

- Add `committee_epoch` (field 7, `uint32`, proto3 default 0) to `HotStuffVote` and `QuorumCertificate` in `dcc/block.proto`, closing threat T10 (cross-committee-epoch fork — two disjoint committees each forming a valid QC for a different block at the same (view, height)). Backward compatible: proto3 additive field, old senders omit it (decodes as 0), old receivers ignore it — no break for peers still on 1.6.4. See node-scala's `HotStuffQuorum`/`HotStuffCrossEpochForkSpecification` for the consuming side.

## JVM 1.6.4 (unreleased)

### 🚀 Features

- Add T2 HotStuff wire messages to `dcc/block.proto`: `HotStuffPhase`, `HotStuffVote`, `QuorumCertificate`, `HotStuffProposal` (feature `feature/hotstuff-t2`, gated behind `dcc.hotstuff.enabled`, testnet-first). `HotStuffProposal` carries the justify-QC linkage the 3-chain commit rule requires. Wire format may evolve until mainnet enablement.

## 3.1.0 (2026-06-23)

### 🩹 Fixes

- testnet 2.0 launch hardening — wrangler, BPS, postgres, docs ([#48](https://github.com/Decentral-America/DecentralChain/pull/48))

### ❤️ Thank You

- Josue Rojas

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
- Rebranded from `@dcc` to `@decentralchain`.

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

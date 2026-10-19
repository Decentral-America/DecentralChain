# Contributing to DecentralChain SDK

Thank you for your interest in contributing!

## Code of Conduct

By participating, you agree to abide by our [Code of Conduct](./CODE_OF_CONDUCT.md).

## Prerequisites

- **Node.js** >= 24 (see `.node-version`)
- **pnpm** >= 10.32 (corepack-managed via `packageManager` field)

## Setup

```bash
git clone https://github.com/Decentral-America/DecentralChain.git
cd DecentralChain
pnpm install
```

## Monorepo Commands

All tasks run through **Nx**. Never call underlying tools directly.

| Command | Description |
| --- | --- |
| `pnpm nx affected -t build` | Build affected packages |
| `pnpm nx affected -t test` | Test affected packages |
| `pnpm nx affected -t biome-lint` | Lint affected packages |
| `pnpm nx run-many -t typecheck` | Type-check all packages |
| `pnpm nx graph` | Visualize dependency graph |
| `node scripts/check-boundaries.mjs` | Validate module boundary layers |

## Workflow

1. Fork → branch from `main` (`feat/my-feature`)
2. Make changes with tests
3. Run `pnpm nx affected -t biome-lint build test` to validate
4. Commit with [Conventional Commits](https://www.conventionalcommits.org/)
5. Push → open PR

### Commit Convention

```
feat(transactions): add new method
fix(crypto): handle edge case
docs: update API reference
chore(deps): bump dependencies
test(signer): add coverage for X
refactor(marshall): simplify implementation
```

Scope should be the package name (without `@decentralchain/` prefix) when the change is package-specific.

## Architecture Rules

- Packages are organized into dependency layers (0–4). A package may only depend on packages in the same layer or below.
- Apps (`apps/`) can depend on any SDK package. SDK packages must never depend on apps.
- Run `node scripts/check-boundaries.mjs` to validate before pushing.

## Releasing

### npm (`packages/sdk/*`)

1. On an up-to-date `main`, as a maintainer with admin rights on `main`:
   `node tools/release/version.mjs --dry-run`, review the versions, then `node tools/release/version.mjs`.
   This versions every package from conventional commits, syncs the protobuf-schemas manifests,
   writes changelogs, tags `@decentralchain/<package>@<version>` and pushes.
2. Run the **Release** workflow with `dry-run` ticked, then again unticked. It fails unless every
   version is on npm, tagged `latest`, installable and importable on Node 24.

### Maven Central (JVM packages, protobuf-schemas, RIDE)

| Package | Directory | Release tag | Publish workflow |
|---|---|---|---|
| blst | `packages/jvm/blst` | `blst/vX.Y.Z.W` | `publish-maven-package.yml` |
| crypto | `packages/jvm/crypto` | `crypto/vX.Y.Z` | `publish-maven-package.yml` |
| curve25519 | `packages/jvm/curve25519` | `curve25519/vX.Y.Z` | `publish-maven-package.yml` |
| java-sdk | `packages/jvm/java-sdk` | `java-sdk/vX.Y.Z` | `publish-maven-package.yml` |
| transactions | `packages/jvm/transactions` | `transactions/vX.Y.Z` | `publish-maven-package.yml` |
| protobuf-schemas | `packages/sdk/protobuf-schemas` | `protobuf-schemas/vX.Y.Z` | `publish-maven-package.yml` |
| groth16 | `packages/jvm/groth16` | `groth16/vX.Y.Z.W` | `publish-groth16.yml` |
| ride | `packages/ride` | `ride/vX.Y.Z` | `publish-ride.yml` (Maven + npm `ride-lang`/`ride-repl`) |

The older unscoped `v1.1.0` ... `v2.0.7` tags predate this scheme and do not identify a package.

1. Bump `<version>` in the package's `pom.xml` in a PR. The **Maven POM drift** check fails if a
   POM changes while its version already exists on Maven Central: Central never accepts the same
   version twice, and the same coordinates must never mean two different artifacts.
2. After merge: `gh workflow run prepare-release.yml -f package=<package> -f version=<version>`.
3. Publish the draft release (`gh release edit <package>/v<version> --draft=false`). The publish
   workflow uploads a signed bundle to the Central Portal with `autoPublish=false`.
4. In the Central Portal, check the deployment is **VALIDATED**, then **Publish** (or **Drop** to abort).

## PR Checklist

- [ ] Tests added/updated for affected packages
- [ ] `pnpm nx affected -t biome-lint build test` passes
- [ ] Module boundaries respected (layer constraints)
- [ ] Commit messages follow conventional commits
- [ ] No CommonJS — ESM-only (`import`/`export`)

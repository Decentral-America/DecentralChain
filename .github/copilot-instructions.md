# DecentralChain SDK — Copilot Instructions

## Project

TypeScript monorepo — 22 `@decentralchain/*` SDK packages + 3 apps (exchange, scanner, cubensis-connect). Blockchain is a Waves-protocol fork (LPoS, Ride smart contracts).

## Dependency Layers

Packages are organized in layers 0–4. A package may only import from the same or lower layer. Enforced by `scripts/check-boundaries.mjs`. Always check `nx.tags` → `layer:N` before adding a cross-package dependency.

| Layer | Packages |
|-------|----------|
| **0** | `ts-types`, `bignumber`, `crypto`, `ts-lib-crypto`, `parse-json-bignumber`, `browser-bus`, `assets-pairs-order`, `cubensis-connect-types`, `ledger`, `marshall`, `oracle-data`, `protobuf-serialization` |
| **1** | `data-entities`, `money-like-to-node`, `ride-js`, `swap-client` |
| **2** | `transactions`, `node-api-js`, `data-service-client-js` |
| **3** | `signer` |
| **4** | `signature-adapter`, `cubensis-connect-provider` |

Apps (`scope:app`) may depend on any package. SDK packages must never depend on apps.

## Tech Stack

| Tool | Version | Purpose |
|------|---------|---------|
| **Nx** | 22.6.x | Workspace orchestration, task caching, affected detection, release |
| **pnpm** | 10.32.x | Package manager with `workspace:*` protocol |
| **TypeScript** | 5.9.x | Maximum strictness (strict + all extra flags), ES2024, bundler moduleResolution |
| **Biome** | 2.4.x | Linting + formatting (replaces ESLint/Prettier entirely) |
| **tsdown** | 0.21.x | Build tool for 21/22 packages (ESM-only `.mjs` + `.d.mts`) |
| **Vite** | 8.x | App bundler (exchange, scanner, cubensis-connect) — Rolldown built-in |
| **Vitest** | 4.x | Testing with v8 coverage |
| **Node.js** | ≥24 | Required runtime (see `.node-version`) |

## Conventions

### Code Style
- **ESM-only**: No CommonJS anywhere. Biome enforces `noCommonJs: error`.
- **Single quotes**, **semicolons always**, **2-space indent**, **LF line endings**, **100-char line width**.
- **`verbatimModuleSyntax: true`** — use `import type` for type-only imports.

### Package Structure
Every SDK package follows this structure:
```
packages/<name>/
  biome.json          # extends root: "extends": "//", "root": false
  knip.json           # dead code detection config
  lefthook.yml        # git hooks (biome check + typecheck)
  package.json        # with nx.tags for layer enforcement
  tsconfig.json       # extends ../../tsconfig.base.json
  tsdown.config.ts    # ESM build config
  vitest.config.ts    # test config with v8 coverage
  src/                # source code
```

### Build & Test Commands
Always use Nx to run tasks, never underlying tools directly:
```bash
pnpm nx run <project>:build        # Build single package
pnpm nx run-many -t build          # Build all
pnpm nx affected -t test           # Test affected packages
pnpm nx affected -t biome-lint     # Lint affected packages
pnpm nx run-many -t typecheck      # Type-check all (excludes cubensis-connect)
```

### Biome
- Root `biome.json` defines all rules. Per-package configs only override with `"extends": "//"`.
- Biome targets (`biome-lint`, `biome-fix`) are inferred by a custom Nx plugin at `tools/nx-plugins/biome-inferred/`.
- `biome-lint` is cached; `biome-fix` is not.

### Releases
- **Independent versioning** via `nx release` with conventional commits.
- Changelogs are auto-generated per-project and at workspace level.
- npm provenance signing is enabled.

### Git Hooks (Lefthook)
- **pre-commit**: Biome check on staged files + typecheck (parallel).
- **commit-msg**: Conventional commits format enforced (see convention below).

### Commit Message Convention

**Format:**
```
<type>(DCC-###): <description>
```

- Scope is the Jira key — **required** when a ticket exists, **omitted** when there is none.
- Description: lowercase, imperative mood, no trailing period.
- Allowed types: `feat` `fix` `docs` `style` `refactor` `perf` `test` `build` `ci` `chore` `revert`

**Examples:**
```
feat(DCC-15): add reserved directive to transaction proto
fix(DCC-42): correct field numbering in block header
chore(DCC-7): upgrade protobufjs to v8
docs: update README
```

**Branch naming:** `<type>/DCC-###-short-kebab-description`

### Module Boundaries
Always respect the layer system. Before adding a dependency:
1. Check the target package's `layer:N` tag in its `package.json` → `nx.tags`.
2. Your package's layer must be ≥ the dependency's layer.
3. Run `node scripts/check-boundaries.mjs` to validate.

## Known Facts — Do Not Contradict

- **No `@keeper-wallet/*` anywhere** — fully migrated to `@decentralchain/*`. Zero references in source or `package.json` files.
- **No Cognito, no WX identity** — `amazon-cognito-identity-js` removed, pool IDs were never DCC-owned, all code deleted. Architecture is 1-of-1 seed-phrase only. Never surface this as a concern.
- **ESM-only** — all 22 packages output `.mjs` + `.d.mts`. No CJS exists.
- **Exchange signing is fully implemented** — all 13 functions in `useTransactionSigning.ts` are wired using `@decentralchain/transactions` + seed-based signing via `multiAccount`. Exchange is feature-complete pending the new node implementation.
- **TradingView datafeed is implemented** — `subscribeBars` uses 15-second polling with dedup and immediate first tick. `matcherUrl` is wired from `networkConfig` — no hardcoded URLs remain.

For current status and open work, see `docs/STATUS.md`.

---

## Domain Context

DecentralChain is a **Waves-protocol blockchain fork** with:
- **Liquid Proof-of-Stake (LPoS)** consensus
- **Ride** smart contract language (non-Turing-complete, predictable execution)
- Native **DEX** (decentralized exchange) built into the protocol
- **Data transactions** for on-chain key-value storage
- Transaction types: transfer, issue, reissue, burn, lease, mass-transfer, set-script, invoke-script, exchange, etc.

Key abstractions across packages:
- `Long` / `BigNumber` for blockchain precision arithmetic
- `SignedTransaction<T>` / `TransactionFromNode<T>` for transaction lifecycle
- `Seed` / `KeyPair` for cryptographic identity (curve25519 + blake2b/keccak)

## Internal Documentation

Refer to these docs for deep context:
- **`docs/UPSTREAM.md`** — Waves provenance, ecosystem mapping, gap analysis, wire-format constraints
- **`docs/ARCHITECTURE.md`** — Monorepo design, dependency tiers, Nx config, build pipeline, decision log
- **`docs/STATUS.md`** — Per-package health, timeline, open issues, remediation priority matrix
- **`docs/SECURITY-AUDIT.md`** — 6-phase security audit playbook with severity definitions and checklists
- **`docs/CONVENTIONS.md`** — Coding standards, TypeScript strictness, testing standards, file templates, naming conventions


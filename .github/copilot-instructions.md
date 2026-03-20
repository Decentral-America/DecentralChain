# DecentralChain SDK — Copilot Instructions

## Project Overview

This is the **DecentralChain SDK monorepo** — a unified TypeScript workspace for all `@decentralchain/*` npm packages. It consolidates 22 SDK libraries and 3 applications that together form the complete developer toolkit for the DecentralChain blockchain (a Waves-protocol fork using Liquid Proof-of-Stake consensus and the Ride smart contract language).

## Architecture

### Package Layers (enforced by `scripts/check-boundaries.mjs`)

Packages are organized into dependency layers (0–4). A package may only depend on packages in the same layer or below.

| Layer | Packages |
|-------|----------|
| **0 — Primitives** | `ts-types`, `bignumber`, `crypto`, `ts-lib-crypto`, `parse-json-bignumber`, `browser-bus`, `assets-pairs-order`, `cubensis-connect-types`, `ledger`, `marshall`, `oracle-data`, `protobuf-serialization` |
| **1 — Domain** | `data-entities`, `money-like-to-node`, `ride-js`, `swap-client` |
| **2 — Services** | `transactions`, `node-api-js`, `data-service-client-js` |
| **3 — Integration** | `signer` |
| **4 — Adapter** | `signature-adapter`, `cubensis-connect-provider` |

### Applications (`apps/`)

| App | Description |
|-----|-------------|
| `exchange` | DecentralChain DEX trading interface (Vite + React) |
| `scanner` | Blockchain explorer (Vite + React) |
| `cubensis-connect` | Browser extension wallet |

Apps have `scope:app` tags and can depend on any SDK package. SDK packages must never depend on apps.

## Tech Stack

| Tool | Version | Purpose |
|------|---------|---------|
| **Nx** | 22.5.x | Workspace orchestration, task caching, affected detection, release |
| **pnpm** | 10.32.x | Package manager with `workspace:*` protocol |
| **TypeScript** | 5.9.x | Maximum strictness (strict + all extra flags), ES2024, bundler moduleResolution |
| **Biome** | 2.4.x | Linting + formatting (replaces ESLint/Prettier entirely) |
| **tsdown** | 0.21.x | Build tool for 21/22 packages (ESM-only `.mjs` + `.d.mts`) |
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

[optional body]

[optional footer(s)]
```

- `DCC-###` is the Jira ticket key — **required** when a ticket exists, **omitted** when there is none.
- Description: lowercase, imperative mood, no trailing period.

**Allowed types:**

| Type | When to Use |
|------|-------------|
| `feat` | New feature or capability |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `style` | Formatting/whitespace — no logic change |
| `refactor` | Code restructuring — no feature or fix |
| `perf` | Performance improvement |
| `test` | Adding or updating tests |
| `build` | Build system or external dependencies |
| `ci` | CI/CD configuration |
| `chore` | Maintenance (dep bumps, config tweaks) |
| `revert` | Reverting a previous commit |

**Validation rules:**

| Rule | Correct | Wrong |
|------|---------|-------|
| Type lowercase | `feat(DCC-15):` | ~~`Feat(DCC-15):`~~ |
| Scope uppercase Jira key | `fix(DCC-42):` | ~~`fix(dcc-42):`~~ |
| Description lowercase | `add reserved directive` | ~~`Add reserved directive`~~ |
| No trailing period | `fix field numbering` | ~~`fix field numbering.`~~ |
| Imperative mood | `add`, `fix`, `remove` | ~~`added`, `fixed`, `removed`~~ |
| Scope required when ticket exists | `chore(DCC-7): upgrade protobufjs` | ~~`chore: upgrade protobufjs`~~ |
| Scope omitted when no ticket | `docs: update README` | ~~`docs(): update README`~~ |

**Branch naming:** `<type>/DCC-###-short-kebab-description`
```
feat/DCC-15-proto-reserved-directive
fix/DCC-42-block-header-field-numbering
docs/DCC-99-update-readme
```

**Breaking change:**
```
feat(DCC-18)!: remove CJS output from marshall package

ESM-only output aligns with the SDK-wide Node 24+ requirement.

BREAKING CHANGE: CJS build output removed. Package is now ESM-only.
Refs: DCC-1, DCC-7
```

**Examples:**
```
feat(DCC-15): add reserved directive to transaction proto
fix(DCC-42): correct field numbering in block header
chore(DCC-7): upgrade protobufjs to v8
test(DCC-15): add roundtrip tests for CommitToGeneration
docs: update README
style: fix formatting in transaction builder
```

### Module Boundaries
Always respect the layer system. Before adding a dependency:
1. Check the target package's `layer:N` tag in its `package.json` → `nx.tags`.
2. Your package's layer must be ≥ the dependency's layer.
3. Run `node scripts/check-boundaries.mjs` to validate.

## Completed Work — Do Not Re-Open as Pending

These migrations are **DONE**. Never present them as open risks, pending tasks, or supply-chain concerns.

| Item | Status | Details |
|------|--------|---------|
| `@keeper-wallet/waves-crypto` → `@decentralchain/crypto` | ✅ Complete | DCC-70 (fork + Rust/WASM Layer 0 package), DCC-59 (22 cubensis-connect import sites migrated). Zero `@keeper-wallet` references remain anywhere in source or `package.json` files. |
| `@keeper-wallet/swap-client` → `@decentralchain/swap-client` | ✅ Complete | DCC-69. Source extracted, protobuf schema reverse-engineered, published as `@decentralchain/swap-client@1.0.0`. |
| `keeper-wallet.app` domain whitelist | ✅ Complete | `web.keeper-wallet.app` and `swap.keeper-wallet.app` removed from all CSP/whitelist configs. |
| Scanner SSR migration | ✅ Complete | React Router 7 framework mode, `@react-router/serve` runtime, Docker builds, 189 tests passing. |
| 22 SDK packages — ESM migration | ✅ Complete | All packages output ESM-only `.mjs` + `.d.mts` via tsdown. No CJS anywhere. |

### Open Items (as of March 2026)
- **P0**: Cognito pool ownership verification — human/AWS action required (`eu-central-1_AXIpDLJQx`, `eu-central-1_6Bo3FEwt5`)
- **P1**: npm dist-tag promotion — 5 packages still tagged `@next`: `assets-pairs-order`, `marshall`, `node-api-js`, `signer`, `signature-adapter`
- **P2**: Exchange signing — all 13 signing functions throw `"Not implemented"`
- **P2**: Exchange nginx — `CORS *`, no CSP, runs as root
- **P3**: Chrome Web Store + Firefox AMO submissions for `cubensis-connect`

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

## AI & Editor Integration

### Nx MCP Server

The workspace is configured with the **Nx MCP server** (`.vscode/mcp.json`), which provides AI agents with structured access to workspace metadata — project graph, dependencies, available targets, tags, and generators. This is far more reliable than parsing files manually.

Key Nx MCP tools available:
- `nx_workspace` — query workspace structure and all projects
- `nx_project_details` — get config, targets, and tags for a specific project
- `nx_visualize_graph` — render the dependency graph
- `nx_generators` — discover available code generators (including our custom `sdk-package` generator)
- `nx_generator_schema` — get the schema for a specific generator
- `nx_docs` — search up-to-date Nx documentation (prevents hallucination)

**Always prefer Nx MCP tools over manual file parsing** when answering questions about workspace structure, project relationships, or task configuration.

### Additional MCP Servers

Three more MCP servers are configured in `.vscode/mcp.json`:

| Server | Purpose |
|--------|---------|
| **Context7** (`@upstash/context7-mcp`) | Fetches up-to-date documentation for any npm library — prevents hallucinating outdated APIs |
| **Chrome DevTools** (`chrome-devtools-mcp`) | Browser automation for testing the exchange, scanner, and cubensis-connect apps — screenshots, network inspection, interaction automation, Lighthouse audits |
| **GitHub** (`api.githubcopilot.com/mcp/`) | Direct GitHub API access — create PRs, manage issues, search code, handle reviews without leaving the editor |

### Reusable Prompts

The `.github/prompts/` directory contains reusable slash-command prompts for common monorepo workflows:
- `/build-package` — build a specific package via Nx
- `/test-affected` — test only what changed
- `/add-dependency` — add cross-package deps with layer validation
- `/debug-build` — diagnose build/typecheck/lint failures
- `/validate-workspace` — run full quality pipeline
- `/explore-workspace` — understand project relationships and architecture
- `/monitor-ci` — monitor Nx Cloud CI pipeline
- `/upstream-sync` — check for and port changes from upstream Waves repositories

### VS Code Integration

The full team uses VS Code with shared workspace configuration:
- **`.vscode/settings.json`** — Biome as sole formatter, TS SDK, monorepo-optimized settings
- **`.vscode/extensions.json`** — Required: Biome + Nx Console + GitHub Copilot + Vitest Explorer + GitLens
- **`.vscode/tasks.json`** — Build/test/lint/typecheck as Command Palette tasks
- **`.vscode/launch.json`** — Debug configs for Vitest and Vite dev servers
- **`.vscode/mcp.json`** — Nx MCP + Context7 + Chrome DevTools + GitHub for AI-assisted development

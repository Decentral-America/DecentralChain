# Monorepo Architecture

> **Purpose**: Documents the architecture, design decisions, toolchain choices, and operational structure of the `decentralchain-sdk` monorepo. This is the technical reference for how the monorepo is built and why.
>
> **Audience**: SDK contributors, DevOps engineers, AI agents interacting with the workspace.

---

## Table of Contents

1. [Overview](#1-overview)
2. [Inclusion Rule](#2-inclusion-rule)
3. [Directory Structure](#3-directory-structure)
4. [Toolchain](#4-toolchain)
5. [Package Tiers](#5-package-tiers)
6. [Nx Configuration](#6-nx-configuration)
7. [pnpm Workspace & Catalogs](#7-pnpm-workspace--catalogs)
8. [TypeScript Project References](#8-typescript-project-references)
9. [Biome Monorepo Config](#9-biome-monorepo-config)
10. [Build Pipeline](#10-build-pipeline)
11. [CI/CD Architecture](#11-cicd-architecture)
12. [Publishing Strategy](#12-publishing-strategy)
13. [Developer Workflow](#13-developer-workflow)
14. [AI Integration](#14-ai-integration)
15. [Decision Log](#15-decision-log)

---

## 1. Overview

The `decentralchain-sdk` monorepo consolidates all `@decentralchain/*` SDK libraries and TypeScript applications into a single repository managed by **Nx + pnpm**.

### Before (Polyrepo) → After (Monorepo)

| Before | After |
|--------|-------|
| 25 separate `npm ci` runs in CI | 1 `pnpm install` with shared cache |
| Change in `ts-types` → manual bump in 6+ downstream repos | Change in `ts-types` → all consumers automatically use latest |
| 25 identical `biome.json` files to maintain | 1 root `biome.json` + per-package overrides |
| Cross-package refactor = 6+ PRs across repos | Cross-package refactor = 1 atomic PR |
| `fix-cross-deps.mjs` to sync versions | Workspace protocol `"workspace:*"` |
| ~3,800 tests across 20 repos, no unified view | `nx run-many -t test` — single command, cached, parallel |
| AI agents can't see across repo boundaries | Full SDK visible in one context |

---

## 2. Inclusion Rule

> **If it's TypeScript and it imports `@decentralchain/*` — it belongs in the monorepo.**
>
> Libraries go in `packages/`. Apps go in `apps/`. Everything else stays in its own repo.

### What's In

| Category | Location | Count | Examples |
|----------|----------|-------|---------|
| SDK libraries | `packages/*` | 22 | All `@decentralchain/*` npm-published packages |
| Apps consuming SDK | `apps/*` | 3 | cubensis-connect (9 SDK deps), exchange (8), explorer (3) |

### What's Out

| Repository | Reason |
|-----------|--------|
| `node-scala` | Scala/JVM — different toolchain |
| `passport`, `DCC-ERC20-Gateway` | Python — different runtime |
| `k8s-manifests`, `dcc-configs`, `dcc-token-filters` | YAML/JSON config — no npm publishing |
| `dcc-ride-templates` | Ride smart contracts — different toolchain |

---

## 3. Directory Structure

```
decentralchain-sdk/
├── .github/
│   ├── copilot-instructions.md     AI context for Copilot
│   ├── skills/                     8 custom AI skills
│   └── workflows/                  CI/CD pipelines
├── apps/
│   ├── cubensis-connect/           Browser wallet extension
│   ├── exchange/                   Electron DEX trading app
│   └── explorer/                   Block explorer web app
├── packages/
│   ├── ts-types/                   Core TypeScript types
│   ├── bignumber/                  Arbitrary precision math
│   ├── ts-lib-crypto/              Cryptographic primitives
│   ├── marshall/                   Binary serialization
│   ├── transactions/               Transaction builders
│   ├── ...                         (22 packages total)
│   └── cubensis-connect-provider/  Wallet provider
├── docs/
│   ├── ARCHITECTURE.md             This file
│   ├── UPSTREAM.md                 Waves provenance & ecosystem
│   ├── STATUS.md                   Per-package health & timeline
│   ├── SECURITY-AUDIT.md           Security audit checklist
│   └── CONVENTIONS.md              Coding standards & quality pipeline
├── scripts/                        Monorepo automation
├── tools/                          Nx plugins & custom tooling
├── biome.json                      Root Biome config (shared)
├── nx.json                         Nx task pipeline
├── pnpm-workspace.yaml             Workspace packages + catalogs
├── tsconfig.base.json              Shared TypeScript config
├── vitest.base.config.ts           Shared Vitest config
├── lefthook.yml                    Root git hooks
└── knip.json                       Dead code detection
```

---

## 4. Toolchain

| Layer | Tool | Version | Why |
|-------|------|---------|-----|
| **Package Manager** | pnpm | 10.x | Strict isolation, workspace protocol, catalogs, fast |
| **Task Runner** | Nx | 22.x | Dependency-aware pipeline, caching, project graph, MCP |
| **Bundler** | tsdown | 0.x | Native `workspace: true` support, ESM-only |
| **Linter/Formatter** | Biome | 2.x | Single Rust-native tool, monorepo support via `extends: "//"` |
| **Test Runner** | Vitest | 4.x | Native workspace support, ESM-native |
| **TypeScript** | TypeScript | 5.9.x | Project references, strict mode |
| **Git Hooks** | Lefthook | 1.x | Parallel execution, root-level config |
| **Node.js** | Node.js | ≥24 | Active LTS |

### Build Tool Distribution

| Tool | Used By |
|------|---------|
| tsdown | 17 standard SDK libraries |
| Vite | exchange, explorer, cubensis-connect |
| tsc + wasm-pack | crypto (Rust/WASM hybrid) |
| buf + tsdown | protobuf-serialization, swap-client |

---

## 5. Package Tiers

```
┌─────────────────────────────────────────────────────────────────┐
│ TIER 0 — Foundation (0 internal deps)                          │
│ ts-types · bignumber · marshall · ts-lib-crypto · oracle-data  │
│ browser-bus · parse-json-bignumber · assets-pairs-order         │
│ protobuf-serialization · ledger · crypto · cubensis-connect-types│
├─────────────────────────────────────────────────────────────────┤
│ TIER 1 — Core (depends on Tier 0)                              │
│ data-entities · money-like-to-node · node-api-js · ride-js     │
│ swap-client                                                     │
├─────────────────────────────────────────────────────────────────┤
│ TIER 2 — Integration (depends on Tier 0+1)                     │
│ data-service-client-js · transactions                           │
├─────────────────────────────────────────────────────────────────┤
│ TIER 3 — Adapters (depends on Tier 0+1+2)                      │
│ signature-adapter · signer                                      │
├─────────────────────────────────────────────────────────────────┤
│ TIER 4 — Providers (depends on all tiers)                       │
│ cubensis-connect-provider                                       │
├─────────────────────────────────────────────────────────────────┤
│ APPS — Not published to npm (in monorepo)                       │
│ cubensis-connect · exchange · explorer                          │
└─────────────────────────────────────────────────────────────────┘
```

---

## 6. Nx Configuration

Nx operates in **package-based mode** — it infers targets from `package.json` scripts and orchestrates them with caching and dependency awareness.

### `nx.json` Key Concepts

- **`namedInputs`**: Define which files affect which tasks (source code, test files, shared globals).
- **`targetDefaults`**: Set `dependsOn`, `inputs`, `outputs`, and `cache` for each task type.
- **`dependsOn: ["^build"]`**: Build dependencies before building the current package.
- **`affected`**: Only run tasks on packages whose source files changed.

### Task Pipeline

```
build       → dependsOn: [^build]     (build deps first)
typecheck   → dependsOn: [^build]     (need built types)
test        → dependsOn: [build]      (need built output)
lint        → no deps                 (independent)
bulletproof → dependsOn: [lint:fix, typecheck, test]
```

### Special Build Targets

| Package | Custom Target | What It Does |
|---------|--------------|--------------|
| crypto | `build:wasm` | Runs `wasm-pack` for Rust → WASM |
| protobuf-serialization | `generate` | Runs `buf generate` for proto compilation |
| swap-client | `generate` | Runs `buf generate` for proto compilation |

---

## 7. pnpm Workspace & Catalogs

### Workspace Protocol

Internal dependencies use `workspace:*` — pnpm resolves them to local source during development and replaces with real versions at publish time:

```jsonc
// In packages/transactions/package.json
{
  "dependencies": {
    "@decentralchain/ts-types": "workspace:*",    // → ^2.0.1 at publish
    "@decentralchain/marshall": "workspace:*"      // → ^1.0.1 at publish
  }
}
```

This eliminates the need for `fix-cross-deps.mjs` and manual version synchronization.

### Catalogs

Shared external dependency versions defined once in `pnpm-workspace.yaml`:

```yaml
catalog:
  typescript: ^5.9.3
  '@biomejs/biome': ^2.4.6
  vitest: ^4.0.0
```

Packages reference them with `"catalog:"` in their `package.json`:

```jsonc
{
  "devDependencies": {
    "typescript": "catalog:",
    "vitest": "catalog:"
  }
}
```

One place to update a shared dependency version → all packages get it.

---

## 8. TypeScript Project References

Each package's `tsconfig.json` extends the root `tsconfig.base.json` and declares `references` to its `@decentralchain/*` dependencies:

```jsonc
// packages/transactions/tsconfig.json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": { "outDir": "./dist", "rootDir": "./src" },
  "references": [
    { "path": "../marshall" },
    { "path": "../protobuf-serialization" },
    { "path": "../ts-lib-crypto" },
    { "path": "../ts-types" }
  ]
}
```

Benefits: incremental builds, editor performance, correct type isolation across package boundaries.

---

## 9. Biome Monorepo Config

Biome v2 has native monorepo support via `"extends": "//"` syntax.

- **Root `biome.json`**: Contains all shared rules (formatter, linter, assist).
- **Per-package overrides**: Use `"extends": "//"` then override. Most packages need no `biome.json`.
- **Running**: `biome check .` from root processes the entire monorepo.

---

## 10. Build Pipeline

```
pnpm install
  → nx run-many -t build          (dependency-ordered, cached)
  → nx run-many -t typecheck      (TS project references)
  → nx run-many -t test           (Vitest per-package)
  → nx run-many -t lint           (Biome)
```

Nx caches results in `.nx/cache/`. If inputs haven't changed, tasks replay from cache instantly.

---

## 11. CI/CD Architecture

### Pull Request CI

```yaml
- pnpm install --frozen-lockfile
- nx run-many -t build
- nx run-many -t typecheck
- nx run-many -t lint
- nx run-many -t test
```

### Affected Detection

On PRs, use `nx affected -t test` to only test packages whose source changed — reduces CI time from ~5 minutes to seconds for single-package changes.

---

## 12. Publishing Strategy

### Workspace Protocol Resolution

| In Monorepo | Published to npm |
|-------------|------------------|
| `"@decentralchain/ts-types": "workspace:*"` | `"@decentralchain/ts-types": "^2.0.1"` |

### npm Provenance

All packages publish with signed provenance:
```json
{ "publishConfig": { "provenance": true, "access": "public" } }
```

---

## 13. Developer Workflow

```bash
# Install everything
pnpm install

# Build all packages (dependency-ordered, cached)
pnpm build

# Build one package and its dependencies
npx nx build @decentralchain/transactions

# Run affected tests only
npx nx affected -t test

# Full quality gate
pnpm bulletproof

# Visualize the dependency graph
pnpm graph

# Dev mode for an app
npx nx dev exchange

# Filter by package
pnpm --filter @decentralchain/signer test
```

---

## 14. AI Integration

Nx provides a native MCP server (`nx mcp`) with 15+ tools for AI agents:

| Tool | Purpose |
|------|---------|
| `nx_workspace` | Query workspace structure and project list |
| `nx_project_details` | Get details for a specific project |
| `nx_docs` | Search Nx documentation |
| `nx_visualize_graph` | Render dependency graph |
| `nx_generators` | Discover available code generators |
| `nx_current_running_tasks_details` | Monitor running tasks |

Custom AI skills in `.github/skills/` cover: `nx-generate`, `nx-run-tasks`, `nx-workspace`, `add-sdk-package`, `link-workspace-packages`, `release-packages`, `validate-architecture`, `monitor-ci`.

---

## 15. Decision Log

| # | Decision | Rationale |
|---|----------|-----------|
| D-1 | **pnpm** over npm | Strict dependency isolation, workspace protocol, catalogs, disk efficiency |
| D-2 | **Nx** over Turborepo | Best-in-class AI integration (native MCP, 15+ tools), superior project graph, `nx import` for history preservation. Config investment pays compound returns. See [full comparison](ARCHITECTURE.md#appendix-turborepo-vs-nx) |
| D-3 | **Changesets** for publishing | Industry standard, works with any task runner, portable |
| D-4 | **`packages/` + `apps/`** layout | Clear separation of publishable libs vs. private apps |
| D-5 | **TypeScript project references** | Incremental builds, editor performance, correct type isolation |
| D-6 | **Per-package Vitest configs** | Preserves per-package coverage thresholds, matches Nx caching |
| D-7 | **Root Biome v2** with `extends: "//"` | Eliminates 20+ duplicate configs |
| D-8 | **Exclude node-scala** | Scala/sbt — fundamentally different toolchain |
| D-9 | **Include all TS apps importing `@decentralchain/*`** | Principled rule that scales. Team velocity demands zero publish-install-test-fix latency |
| D-10 | **`workspace:*` protocol** | Eliminates `fix-cross-deps.mjs`, auto-resolves at publish |
| D-11 | **`nx import`** for history | Preserves full commit history per package in monorepo |

### Nx vs Turborepo — Why Nx

The operator's priorities — best-in-class tooling, heavy AI leverage, willingness to invest in configuration — favor Nx decisively:

| Dimension | Turborepo | Nx |
|-----------|-----------|-----|
| AI/MCP | Community only | **Native** (15+ tools) |
| Feature count | 8/19 | **18/19** |
| Self-healing CI | None | **Native** (Nx Cloud) |
| Config complexity | ~35 lines | ~60 lines |
| Project graph | Static Graphviz | **Interactive web UI** |
| Migration tools | Manual | **`nx import`, `nx migrate`** |

Weighted score: **Nx 9.0 vs Turborepo 7.3** with AI-first weighting (25% AI integration, 20% caching, 15% DX, 15% features, 10% migration, 10% graph, 5% portability).

**Revisit triggers**: Nx daemon instability, Nx Cloud free tier restrictions, Turborepo ships native MCP, or team grows and struggles with Nx learning curve.

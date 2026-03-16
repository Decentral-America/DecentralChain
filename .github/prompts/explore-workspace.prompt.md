---
description: 'Explore the workspace — understand project relationships, dependency graph, and package details. USE WHEN you need to understand how packages connect, what depends on what, or want to visualize the monorepo architecture.'
---

# Explore Workspace

Understand the DecentralChain monorepo structure, project relationships, and dependency graph.

## Context

- 25 Nx projects: 22 SDK packages (`packages/`) + 3 apps (`apps/`)
- 5 dependency layers (0–4) + apps layer — enforced by `scripts/check-boundaries.mjs`
- Nx MCP server provides structured metadata about the workspace
- Full architecture documented in `docs/ARCHITECTURE.md`

## Quick Commands

```bash
# List all projects
pnpm nx show projects

# See affected projects (what changed)
pnpm nx show projects --affected

# Get details for a specific project
pnpm nx show project <project-name> --json

# Visualize the full dependency graph (opens in browser)
pnpm nx graph

# Show only affected graph
pnpm nx graph --affected
```

## Understanding the Layers

Use the Nx MCP tools for AI-assisted exploration:

- `nx_workspace` — full workspace structure and project list
- `nx_project_details` — config, targets, tags for a specific project
- `nx_visualize_graph` — dependency graph visualization

## Key Documentation

- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — Monorepo design, dependency tiers, Nx config
- [docs/STATUS.md](docs/STATUS.md) — Per-package health, open issues
- [docs/UPSTREAM.md](docs/UPSTREAM.md) — Waves provenance, wire-format constraints
- [docs/CONVENTIONS.md](docs/CONVENTIONS.md) — Coding standards, naming conventions

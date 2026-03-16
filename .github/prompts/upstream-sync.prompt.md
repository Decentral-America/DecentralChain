---
description: 'Sync with upstream Waves repositories. USE WHEN you want to check for new changes from upstream Waves repos, port bugfixes/features, or update the sync tracking table. Handles single-package or full-ecosystem sync.'
---

# Upstream Sync

Check for and port changes from upstream Waves repositories into the DCC monorepo.

## Context

- DCC was manually forked from Waves — not a GitHub fork, but repos share git history
- Upstream Waves clones: `/Users/jourlez/Documents/Code/Blockchain/Waves/<repo>/`
- DCC monorepo: `/Users/jourlez/Documents/Code/Blockchain/DecentralChain/`
- Sync tracking: `docs/UPSTREAM.md` §19 — last-synced commit per package
- Full procedure: `.github/skills/upstream-sync/SKILL.md`

## Instructions

1. **Read the sync tracking table** in `docs/UPSTREAM.md` §19 to get last-synced upstream commits
2. **Fetch upstream** — pull latest in `Waves/<repo>` directories
3. **Diff from last sync**: `git log --oneline <last-synced>..HEAD -- src/` in each upstream repo
4. **Evaluate**: Skip tooling/deps noise, port bugfixes/features/security fixes
5. **Port changes** to monorepo — adapt to DCC conventions (ESM, Biome, `@decentralchain/*` imports)
6. **Validate**: `pnpm nx run @decentralchain/<pkg>:test` + typecheck + lint
7. **Commit**: `fix(<pkg>): port upstream <hash> — <desc>`
8. **Update §19**: new upstream commit, new DCC commit, today's date

For comprehensive instructions, read `.github/skills/upstream-sync/SKILL.md`.

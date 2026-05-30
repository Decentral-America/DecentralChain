# Biome Upgrade Assessment — 2026-06-05

## Status: BLOCKED — Stay pinned at 2.4.11

### Summary

GitHub issue [biomejs/biome#10411](https://github.com/biomejs/biome/issues/10411) was **closed** as
completed via PR #10442 (shipped in **2.4.16**). However, **the fix is partial** —
a follow-up report from [@gcko](https://github.com/gcko) on 2026-06-03 confirms
the same stack overflow still occurs on 2.4.16 with different type-aware nursery
rule patterns.

New issue filed: [biomejs/biome#10492](https://github.com/biomejs/biome/issues/10492) — "Stack overflow
on Turbopack-generated chunk with type-aware nursery rules (regression in 2.4.12)"

### What Was Fixed (2.4.16)

- PR #10442: "fix(inference): pass correct scope on return statements"
- Fixes `noMisusedPromises`-specific recursion on certain async patterns

### What Remains Broken (2.4.16)

- Any single type-aware nursery rule (`noFloatingPromises`, `noMisusedPromises`,
  `noUnnecessaryConditions`) still crashes on macOS ARM64 when type resolution
  chases through complex dependency graphs (e.g., Next.js + MUI + Sentry + OTel)
- Root cause: macOS 512KB thread stack limit vs Linux 8MB
- The crash is non-deterministic based on `node_modules` dependency depth

### Our Configuration (affected)

We use `noFloatingPromises`, `noMisusedPromises`, and `useAwaitThenable` in our
biome.json — all three are type-aware nursery rules. Our monorepo has deep
dependency trees that would likely trigger the same overflow.

### Recommendation

| Action | When |
|--------|------|
| Stay pinned at **@biomejs/biome@2.4.11** | Now |
| Monitor [#10492](https://github.com/biomejs/biome/issues/10492) for resolution | Weekly |
| Test upgrade when fix lands | After #10492 is closed + verified |
| Keep `$schema` at `2.4.10` in biome.json | Until safe version confirmed |

### Version Timeline

| Version | Status |
|---------|--------|
| 2.4.11 | SAFE — last known good on macOS ARM64 |
| 2.4.12 | BROKEN — introduced type inference recursion regression |
| 2.4.13–2.4.15 | BROKEN |
| 2.4.16 | PARTIAL FIX — some patterns resolved, others still crash |
| Next release (TBD) | Monitor #10492 |

### Next Review Date

2026-06-12 (one week)

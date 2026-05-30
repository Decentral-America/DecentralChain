# MUI v7 → v9 Migration Epic

## Executive Summary

Material UI **v9.0.1** (released 2026-04-08, latest stable) is a direct successor to v7.
There is no MUI Material v8 — they unified versioning across the ecosystem.
The exchange app currently runs `@mui/material@^7.3.9` and `@mui/icons-material@^7.3.9`.

**Risk: LOW-MEDIUM** — The codebase is already clean of v4-era deprecated APIs
(no `makeStyles`, `withStyles`, `createStyles`). MUI v9 primarily removes
deprecated v6→v7 transitional APIs and improves `sx` prop performance.

---

## Scope

| Metric | Value |
|--------|-------|
| Files importing `@mui/*` | 74 |
| `sx` prop usages | 749 |
| `styled()` from `@mui/material/styles` | 33 files |
| `styled-components` (unchanged by MUI upgrade) | 89 files |
| Theme files | 2 (`mui-theme.ts`, `landingTheme.ts`) |
| Icons used | ~78 imports across files |

---

## Breaking Changes Impacting This Codebase

### 1. System Props Removed from Box, Stack, Typography
**Impact: HIGH (affects ~76 combined usages)**

Props like `mt`, `p`, `display`, `flexGrow` etc. are removed from the
component prop types. Must use `sx={{ mt: 2, p: 1 }}` instead.

**Codemod**: `npx @mui/codemod v9.0.0/system-props --jsx`

### 2. Grid `direction` Prop Restriction
**Impact: LOW (12 Grid usages to audit)**

`direction="column"` and `direction="column-reverse"` removed. Use `sx={{ flexDirection: 'column' }}` or Stack instead.

### 3. TextField Deprecated Props Removed
**Impact: LOW (2 TextField usages)**

- `InputProps` → `slotProps.input`
- `inputProps` → `slotProps.htmlInput`
- `SelectProps` → `slotProps.select`
- `InputLabelProps` → `slotProps.inputLabel`
- `FormHelperTextProps` → `slotProps.formHelperText`

### 4. Legacy `*Outline` Icons Removed
**Impact: AUDIT NEEDED**

Icons like `InfoOutline` → `InfoOutlined`. Need to grep for `*Outline` (not `*Outlined`) patterns.

### 5. Deprecated CSS Classes Removed
**Impact: AUDIT NEEDED**

Removed from: Alert, Button, ButtonGroup, Chip, CircularProgress, Divider,
Drawer, ImageListItemBar, LinearProgress, PaginationItem, Select, Slider, Tabs.

If using `classes` prop overrides targeting old class names, they will silently stop working.

### 6. Deprecated Component Props Removed
**Impact: AUDIT NEEDED (per-component)**

| Component | Removed Props | Replacement |
|-----------|--------------|-------------|
| Accordion | `TransitionComponent`, `TransitionProps` | `slots.transition`, `slotProps.transition` |
| Alert | `components`, `componentsProps` | `slots`, `slotProps` |
| Autocomplete | `ChipProps`, `componentsProps`, `ListboxComponent`, `PaperComponent`, `PopperComponent` | `slotProps` equivalents |
| Avatar | `imgProps` | `slotProps.img` |
| Backdrop | `components`, `componentsProps`, `TransitionComponent` | `slots`, `slotProps` |
| Checkbox/Radio/Switch | `inputProps`, `inputRef` | `slotProps.input`, `slotProps.input.ref` |
| Dialog/Modal/Drawer | Various deprecated props | `slots`, `slotProps` |
| Tooltip | `components`, `componentsProps`, `PopperComponent`, `TransitionComponent` | `slots`, `slotProps` |
| Typography | `paragraph` | `component="p"` or `sx={{ mb: ... }}` |
| Tabs | `ScrollButtonComponent`, `TabIndicatorProps` | `slots` |

### 7. sx Prop Performance Improvement
**Impact: POSITIVE (749 usages benefit)**

Significant runtime performance gains for all `sx` prop evaluations. No code changes needed.

---

## Migration Strategy

### Phase 1: Preparation (½ day)
1. Run `@mui/codemod` suite to auto-fix known patterns
2. Update `@emotion/react` and `@emotion/styled` to latest
3. Verify no `*Outline` icon usage (vs `*Outlined`)

### Phase 2: Automated Codemods (½ day)
```bash
# System props → sx
npx @mui/codemod v9.0.0/system-props apps/exchange/src --jsx

# Deprecated component props → slots/slotProps
npx @mui/codemod v9.0.0/deprecated-props apps/exchange/src
```

### Phase 3: Manual Fixes (1 day)
1. Fix any `Grid direction="column"` → Stack or sx
2. Verify theme overrides still target valid CSS classes
3. Update `TextField` deprecated prop patterns
4. Test dark mode / light mode toggle
5. Verify Vite chunk splitting still works (`mui-core` chunk config)

### Phase 4: Validation (½ day)
1. Visual regression testing (critical flows)
2. Bundle size comparison (expect reduction from tree-shaking improvements)
3. Lighthouse performance comparison (sx perf gains)
4. Cross-browser smoke test

---

## Jira Sub-Tasks

| # | Summary | Story Points | Priority |
|---|---------|-------------|----------|
| 1 | Run MUI v9 codemods and commit auto-fixes | 2 | High |
| 2 | Remove system props from Box/Stack/Typography (manual) | 3 | High |
| 3 | Migrate TextField deprecated props → slotProps | 1 | High |
| 4 | Audit + fix Grid direction="column" usages | 1 | Medium |
| 5 | Audit icon imports for removed `*Outline` pattern | 1 | Medium |
| 6 | Audit theme overrides for removed CSS classes | 2 | High |
| 7 | Migrate deprecated component props (Accordion, Tooltip, etc.) | 2 | Medium |
| 8 | Update Vite config chunk splitting for v9 package structure | 1 | Low |
| 9 | Visual regression testing + fix regressions | 3 | High |
| 10 | Bundle size + performance benchmarking | 1 | Low |

**Total estimate: 17 story points (~3 days)**

---

## Dependencies

- `@mui/material`: `^7.3.9` → `^9.0.1`
- `@mui/icons-material`: `^7.3.9` → `^9.0.1`
- `@emotion/react`: `^11.14.0` (compatible, no change needed)
- `@emotion/styled`: `^11.14.1` (compatible, no change needed)
- `styled-components`: `^6.4.2` (unaffected by MUI upgrade)
- React: Must be ≥18.0 (already satisfied)
- Node.js: No new requirement

---

## Risks & Mitigations

| Risk | Probability | Mitigation |
|------|-------------|-----------|
| Theme CSS class overrides break silently | Medium | Audit both theme files for class references before upgrading |
| `styled-components` + MUI `styled()` conflict | Low | Already co-existing in v7; no API change in v9 |
| Third-party MUI components incompatible | Low | No third-party MUI extensions detected |
| Bundle size regression | Low | v9 improves tree-shaking; verify with build |

---

## Recommendation

**Proceed with migration.** The exchange app has zero deprecated v4 APIs and
only light usage of the v7 transitional APIs being removed. The official
codemods will handle ~80% of changes automatically. The performance gains from
the `sx` prop optimization (749 usages) justify the ~3-day investment.

Schedule for: Next sprint after current audit work completes.

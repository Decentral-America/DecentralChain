# Design System Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the app one theme with genuinely working light and dark modes, so the existing `ThemeSettings` toggle visibly changes every page.

**Architecture:** A single semantic-token module is the source of truth. Both the MUI theme and the styled-components theme are derived from it, so they cannot disagree. The twelve per-page `landingTheme` overrides are deleted and pages inherit. `surface.overlay` resolves to different *constructions* per mode rather than different colours, because dark translucent glass has no honest light inversion. A test-enforced lint keeps raw colour literals out of components so this cannot drift back.

**Tech Stack:** React 19, Vite 8, MUI 9 (emotion), styled-components, TypeScript, Vitest.

## Global Constraints

- Work from `apps/exchange`. Node **24.18.0**: `export NVM_DIR="$HOME/.nvm" && . "$NVM_DIR/nvm.sh" && nvm use 24.18.0` in every shell.
- Run binaries directly: `./node_modules/.bin/tsc`, `./node_modules/.bin/vitest`, `./node_modules/.bin/vite`.
- Gate, all four: `tsc -b --noEmit`, `vitest run`, `pnpm exec biome check .`, `rm -rf dist && vite build`.
- **496 tests currently pass.** The count only grows.
- Biome: **alphabetically sorted object keys**, cognitive complexity ≤ 25, `useExhaustiveDependencies` as an **error**.
- **No new runtime dependencies.**
- **No MUI `Slide`/`Fade`/`Grow`** — they apply inline styles a class-based `@media (prefers-reduced-motion: reduce)` block cannot reach. This codebase removed them twice.
- Every colour a component uses comes from a token. Raw hex/`rgba()` in a component is a build failure after Task 8.
- **Acceptance test for the whole plan:** toggling theme in `ThemeSettings` visibly changes every page, including the twelve that currently ignore it.

---

### Task 1: Semantic token module

The source of truth. Pure data plus one lookup function — no React, so its invariants are testable exhaustively.

**Files:**
- Create: `src/theme/tokens/semantic.ts`
- Test: `src/theme/tokens/__tests__/semantic.test.ts`

**Interfaces:**
- Consumes: nothing
- Produces:
  - `type ThemeMode = 'light' | 'dark'`
  - `interface SemanticTokens { surface: {base,raised,sunken,overlay}; border: {subtle,strong}; text: {primary,secondary,tertiary}; accent: {primary,muted}; intent: {success,danger,warning,info} }`
  - `const SEMANTIC_TOKENS: Record<ThemeMode, SemanticTokens>`
  - `function tokens(mode: ThemeMode): SemanticTokens`
  - `function contrastRatio(fg: string, bg: string): number`

- [ ] **Step 1: Write the failing test**

Create `src/theme/tokens/__tests__/semantic.test.ts`:

```ts
/**
 * Semantic tokens — unit tests
 *
 * These pin the two properties that make dark mode real rather than nominal:
 * every token exists in both modes, and text on its own surface clears WCAG AA.
 * A missing dark value is how a "dark mode" ends up with white-on-white text.
 */
import { describe, expect, it } from 'vitest';
import { contrastRatio, SEMANTIC_TOKENS, tokens, type SemanticTokens } from '../semantic';

const MODES = ['light', 'dark'] as const;

/** Walk a token tree to `group.name` leaf paths. */
const leaves = (t: SemanticTokens): string[] =>
  Object.entries(t).flatMap(([group, vals]) =>
    Object.keys(vals as Record<string, string>).map((k) => `${group}.${k}`),
  );

describe('SEMANTIC_TOKENS', () => {
  it('defines both modes', () => {
    expect(Object.keys(SEMANTIC_TOKENS).sort()).toEqual(['dark', 'light']);
  });

  it('defines exactly the same token paths in both modes', () => {
    // A path present in one mode and missing in the other is the bug this
    // whole module exists to prevent.
    expect(leaves(SEMANTIC_TOKENS.light).sort()).toEqual(leaves(SEMANTIC_TOKENS.dark).sort());
  });

  it('gives every token a non-empty value in both modes', () => {
    for (const mode of MODES) {
      for (const [group, vals] of Object.entries(SEMANTIC_TOKENS[mode])) {
        for (const [name, value] of Object.entries(vals as Record<string, string>)) {
          expect(value, `${mode}.${group}.${name}`).toBeTruthy();
        }
      }
    }
  });

  it('never reuses a light value for a dark surface', () => {
    // Catches a copy-paste that leaves dark mode looking like light mode.
    expect(SEMANTIC_TOKENS.dark.surface.base).not.toBe(SEMANTIC_TOKENS.light.surface.base);
    expect(SEMANTIC_TOKENS.dark.text.primary).not.toBe(SEMANTIC_TOKENS.light.text.primary);
  });
});

describe('tokens()', () => {
  it('returns the set for the requested mode', () => {
    expect(tokens('light')).toBe(SEMANTIC_TOKENS.light);
    expect(tokens('dark')).toBe(SEMANTIC_TOKENS.dark);
  });
});

describe('contrastRatio', () => {
  it('computes the known extremes', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 0);
    expect(contrastRatio('#ffffff', '#ffffff')).toBeCloseTo(1, 1);
  });

  it('is order-independent', () => {
    expect(contrastRatio('#123456', '#abcdef')).toBeCloseTo(
      contrastRatio('#abcdef', '#123456'),
      5,
    );
  });
});

describe('WCAG AA on every surface', () => {
  // Body text must clear 4.5:1; secondary and tertiary are still body-sized
  // in this app, so they are held to the same bar rather than the 3:1
  // large-text allowance.
  for (const mode of MODES) {
    for (const surface of ['base', 'raised', 'sunken'] as const) {
      for (const level of ['primary', 'secondary', 'tertiary'] as const) {
        it(`${mode}: text.${level} on surface.${surface}`, () => {
          const t = tokens(mode);
          expect(contrastRatio(t.text[level], t.surface[surface])).toBeGreaterThanOrEqual(4.5);
        });
      }
    }
  }
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd apps/exchange && export NVM_DIR="$HOME/.nvm" && . "$NVM_DIR/nvm.sh" && nvm use 24.18.0
./node_modules/.bin/vitest run src/theme/tokens/__tests__/semantic.test.ts
```

Expected: FAIL — `Failed to resolve import "../semantic"`.

- [ ] **Step 3: Write the implementation**

Create `src/theme/tokens/semantic.ts`. Values below are the starting point, taken from the existing brand (`palette.indigoHover`, `brandInk`) and the reference design's light surfaces. **If a WCAG assertion fails, darken the text token rather than lightening the surface** — the surfaces are the brand, the text is not.

```ts
/**
 * Semantic design tokens — the single source of truth for colour.
 *
 * Components never name a colour, only a role: `surface.raised`, `text.secondary`.
 * That indirection is what makes dark mode a value swap instead of a rewrite, and
 * it is what the codebase previously lacked — `palette.indigoHover` and
 * `brandInk.night` are literals with no counterpart in the other mode.
 *
 * Both the MUI theme and the styled-components theme are derived from this file,
 * so the two cannot drift apart.
 */

export type ThemeMode = 'light' | 'dark';

export interface SemanticTokens {
  surface: { base: string; raised: string; sunken: string; overlay: string };
  border: { subtle: string; strong: string };
  text: { primary: string; secondary: string; tertiary: string };
  accent: { primary: string; muted: string };
  intent: { success: string; danger: string; warning: string; info: string };
}

export const SEMANTIC_TOKENS: Record<ThemeMode, SemanticTokens> = {
  dark: {
    accent: { muted: '#3d2f8f', primary: '#8b7dff' },
    border: { strong: '#3a3358', subtle: '#241d42' },
    intent: { danger: '#ff6b6b', info: '#6aa8ff', success: '#3ddc97', warning: '#ffb84d' },
    surface: { base: '#0b0724', overlay: '#151033', raised: '#141029', sunken: '#080519' },
    text: { primary: '#f5f4ff', secondary: '#b8b3d9', tertiary: '#8a85ab' },
  },
  light: {
    accent: { muted: '#e8e6ff', primary: '#5b4bdb' },
    border: { strong: '#c7c3e0', subtle: '#e9e7f2' },
    intent: { danger: '#c62828', info: '#1565c0', success: '#1b7a4b', warning: '#a15c00' },
    surface: { base: '#f7f7fb', overlay: '#ffffff', raised: '#ffffff', sunken: '#eeedf5' },
    text: { primary: '#14122b', secondary: '#4a4668', tertiary: '#6b6788' },
  },
};

/** Tokens for a mode. */
export function tokens(mode: ThemeMode): SemanticTokens {
  return SEMANTIC_TOKENS[mode];
}

/** Relative luminance per WCAG 2.1. */
function luminance(hex: string): number {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const channels = [0, 2, 4].map((i) => {
    const v = Number.parseInt(full.slice(i, i + 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  const [r, g, b] = channels as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * WCAG contrast ratio between two opaque hex colours.
 *
 * Opaque only — every token in this file is a solid hex precisely so contrast
 * can be checked. Translucent values belong in the overlay treatments, not here.
 */
export function contrastRatio(fg: string, bg: string): number {
  const a = luminance(fg);
  const b = luminance(bg);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
./node_modules/.bin/vitest run src/theme/tokens/__tests__/semantic.test.ts
```

Expected: PASS. If a contrast case fails, adjust the **text** token darker (light mode) or lighter (dark mode) until it clears 4.5, then re-run. Do not weaken the assertion.

- [ ] **Step 5: Commit**

```bash
git add src/theme/tokens/semantic.ts src/theme/tokens/__tests__/semantic.test.ts
git commit -m "feat(exchange): add semantic design tokens with light and dark values"
```

---

### Task 2: Derive both themes from the tokens

**Files:**
- Modify: `src/theme/mui-theme.ts`
- Modify: `src/styles/themes/index.ts`
- Test: `src/theme/__tests__/themeDerivation.test.ts`

**Interfaces:**
- Consumes: `tokens`, `type ThemeMode`, `SEMANTIC_TOKENS` from `../tokens/semantic`
- Produces: `createAppTheme(mode: ThemeMode)` (unchanged signature, now token-derived); `lightTheme` / `darkTheme` styled-components objects, both token-derived

- [ ] **Step 1: Write the failing test**

Create `src/theme/__tests__/themeDerivation.test.ts`:

```tsx
/**
 * Theme derivation — unit tests
 *
 * The MUI theme and the styled-components theme are two consumers of one token
 * set. These tests pin that they actually agree: the historical bug was three
 * independent systems that only looked similar.
 */
import { describe, expect, it } from 'vitest';
import { darkTheme, lightTheme } from '@/styles/themes';
import { tokens } from '../tokens/semantic';
import { createAppTheme } from '../mui-theme';

describe('createAppTheme', () => {
  it('takes its palette from the semantic tokens', () => {
    for (const mode of ['light', 'dark'] as const) {
      const t = tokens(mode);
      const mui = createAppTheme(mode);
      expect(mui.palette.mode).toBe(mode);
      expect(mui.palette.background.default).toBe(t.surface.base);
      expect(mui.palette.background.paper).toBe(t.surface.raised);
      expect(mui.palette.text.primary).toBe(t.text.primary);
      expect(mui.palette.divider).toBe(t.border.subtle);
    }
  });

  it('produces genuinely different palettes per mode', () => {
    expect(createAppTheme('light').palette.background.default).not.toBe(
      createAppTheme('dark').palette.background.default,
    );
  });
});

describe('styled-components themes', () => {
  it('take the same values as MUI for the same mode', () => {
    // One source, two consumers — if these disagree the app has two looks again.
    expect(lightTheme.colors.background).toBe(tokens('light').surface.base);
    expect(darkTheme.colors.background).toBe(tokens('dark').surface.base);
    expect(lightTheme.colors.text).toBe(tokens('light').text.primary);
    expect(darkTheme.colors.text).toBe(tokens('dark').text.primary);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
./node_modules/.bin/vitest run src/theme/__tests__/themeDerivation.test.ts
```

Expected: FAIL — the current themes use their own literals, so the equality assertions do not hold.

- [ ] **Step 3: Rewrite the palettes to derive from tokens**

In `src/theme/mui-theme.ts`, replace the hardcoded `PALETTES` record so the palette is built from `tokens(mode)`:

```ts
import { tokens, type ThemeMode } from './tokens/semantic';

function paletteFor(mode: ThemeMode) {
  const t = tokens(mode);
  return {
    background: { default: t.surface.base, paper: t.surface.raised },
    divider: t.border.subtle,
    error: { main: t.intent.danger },
    info: { main: t.intent.info },
    primary: { main: t.accent.primary },
    success: { main: t.intent.success },
    text: { primary: t.text.primary, secondary: t.text.secondary },
    warning: { main: t.intent.warning },
  };
}
```

and have `createAppTheme(mode)` use `palette: { mode, ...paletteFor(mode) }`.

In `src/styles/themes/index.ts`, build `lightTheme` and `darkTheme` from `tokens('light')` / `tokens('dark')` rather than from literals. **Keep the existing styled-components theme shape** — every one of the 85 styled-components files reads `p.theme.colors.*`, `p.theme.spacing.*` etc., and changing the shape is a separate migration. Only the *values* change.

- [ ] **Step 4: Run the full suite**

```bash
./node_modules/.bin/vitest run
```

Expected: the new file passes. **Other tests may fail here** — some assert specific colour values. Update those assertions to read from `tokens(...)` rather than hardcoding; do not weaken them to `expect.any(String)`.

- [ ] **Step 5: Commit**

```bash
git add src/theme/mui-theme.ts src/styles/themes/index.ts src/theme/__tests__/themeDerivation.test.ts
git commit -m "feat(exchange): derive the MUI and styled-components themes from one token set"
```

---

### Task 3: `surface.overlay` as two treatments

**Files:**
- Create: `src/theme/surfaces.ts`
- Modify: `src/components/auth/GlassCard.tsx`
- Test: `src/theme/__tests__/surfaces.test.ts`

**Interfaces:**
- Consumes: `tokens`, `type ThemeMode`
- Produces: `function overlaySurface(mode: ThemeMode): SxProps<Theme>` — the complete surface treatment for a floating card

- [ ] **Step 1: Write the failing test**

Create `src/theme/__tests__/surfaces.test.ts`:

```ts
/**
 * Overlay surface — unit tests
 *
 * Dark translucent glass has no honest light inversion: the same treatment with
 * light values is a grey box. So this returns different *constructions* per
 * mode, and these tests pin that difference rather than treating it as a bug.
 */
import { describe, expect, it } from 'vitest';
import { overlaySurface } from '../surfaces';

describe('overlaySurface', () => {
  it('uses a blur in dark mode', () => {
    const s = overlaySurface('dark') as Record<string, unknown>;
    expect(String(s.backdropFilter)).toContain('blur');
    expect(String(s.WebkitBackdropFilter)).toContain('blur');
  });

  it('uses no blur in light mode', () => {
    const s = overlaySurface('light') as Record<string, unknown>;
    expect(s.backdropFilter).toBeUndefined();
    expect(s.WebkitBackdropFilter).toBeUndefined();
  });

  it('is opaque in light mode so text contrast is never left to chance', () => {
    const s = overlaySurface('light') as Record<string, unknown>;
    expect(String(s.backgroundColor)).toMatch(/^#[0-9a-f]{6}$/i);
  });

  it('gives both modes a border and a shadow', () => {
    for (const mode of ['light', 'dark'] as const) {
      const s = overlaySurface(mode) as Record<string, unknown>;
      expect(s.border).toBeTruthy();
      expect(s.boxShadow).toBeTruthy();
    }
  });

  it('gives both modes the same radius, so cards match across modes', () => {
    const light = overlaySurface('light') as Record<string, unknown>;
    const dark = overlaySurface('dark') as Record<string, unknown>;
    expect(light.borderRadius).toBe(dark.borderRadius);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
./node_modules/.bin/vitest run src/theme/__tests__/surfaces.test.ts
```

Expected: FAIL — `Failed to resolve import "../surfaces"`.

- [ ] **Step 3: Write the implementation**

Create `src/theme/surfaces.ts`:

```ts
/**
 * Surface treatments that differ by construction, not just by colour.
 *
 * `surface.overlay` is the one token whose two modes are not a value swap.
 * Dark mode is translucent glass over the aurora field; light mode is a solid
 * card with a soft shadow, because light "glass" reads as a grey box rather
 * than as depth. Callers ask for the surface and do not know which they got.
 */
import type { SxProps, Theme } from '@mui/material';
import { tokens, type ThemeMode } from './tokens/semantic';

/** Shared so a card is the same shape in both modes. */
const RADIUS = '20px';

export function overlaySurface(mode: ThemeMode): SxProps<Theme> {
  const t = tokens(mode);

  if (mode === 'light') {
    return {
      backgroundColor: t.surface.overlay,
      border: `1px solid ${t.border.subtle}`,
      borderRadius: RADIUS,
      boxShadow: '0 8px 32px rgba(20, 18, 43, 0.08)',
    };
  }

  return {
    backdropFilter: 'blur(20px) saturate(140%)',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    border: `1px solid ${t.border.strong}`,
    borderRadius: RADIUS,
    boxShadow: '0 24px 60px rgba(6, 3, 20, 0.55)',
    WebkitBackdropFilter: 'blur(20px) saturate(140%)',
  };
}
```

- [ ] **Step 4: Point `GlassCard` at it**

Rewrite `src/components/auth/GlassCard.tsx` so its `sx` spreads `overlaySurface(mode)`, reading the mode from the MUI theme (`useTheme().palette.mode`). Keep its existing props (`children`, `sx`) and the lit-rim `::before` **only in dark mode** — a lit rim on a white card is noise.

Keep the opaque fallback for browsers without `backdrop-filter`, using the `@supports ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px)))` form already established in this file.

- [ ] **Step 5: Run the gate**

```bash
./node_modules/.bin/vitest run
./node_modules/.bin/tsc -b --noEmit
pnpm exec biome check .
```

- [ ] **Step 6: Commit**

```bash
git add src/theme/surfaces.ts src/theme/__tests__/surfaces.test.ts src/components/auth/GlassCard.tsx
git commit -m "feat(exchange): give surface.overlay a light treatment that is not inverted glass"
```

---

### Task 4: Light-mode canvas

**Files:**
- Modify: `src/components/auth/AuthScene.tsx`
- Modify: `src/components/landing/AuroraField.tsx`
- Modify: `src/components/landing/BandTexture.tsx`
- Test: `src/components/auth/__tests__/AuthScene.test.tsx`

**Interfaces:**
- Consumes: `tokens`, `overlaySurface`
- Produces: nothing new — `AuthScene` keeps its `{ children, maxWidth }` props

- [ ] **Step 1: Write the failing test**

Create `src/components/auth/__tests__/AuthScene.test.tsx`:

```tsx
/**
 * AuthScene — unit tests
 *
 * The aurora and band texture were art-directed for a dark field and have no
 * honest light counterpart, so light mode gets a quiet gradient wash instead.
 * These tests pin that the decorative layers are genuinely absent in light mode
 * rather than merely recoloured.
 */
import { ThemeProvider } from '@mui/material/styles';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { createAppTheme } from '@/theme/mui-theme';
import { AuthScene } from '../AuthScene';

const renderIn = (mode: 'light' | 'dark') =>
  render(
    <ThemeProvider theme={createAppTheme(mode)}>
      <AuthScene>
        <button type="button">Sign in</button>
      </AuthScene>
    </ThemeProvider>,
  );

describe('AuthScene', () => {
  it('renders its children in both modes', () => {
    for (const mode of ['light', 'dark'] as const) {
      const { unmount } = renderIn(mode);
      expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument();
      unmount();
    }
  });

  it('draws the aurora in dark mode', () => {
    renderIn('dark');
    expect(screen.getByTestId('auth-canvas')).toHaveAttribute('data-decor', 'aurora');
  });

  it('omits the aurora in light mode', () => {
    renderIn('light');
    expect(screen.getByTestId('auth-canvas')).toHaveAttribute('data-decor', 'wash');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
./node_modules/.bin/vitest run src/components/auth/__tests__/AuthScene.test.tsx
```

Expected: FAIL — no `auth-canvas` test id exists.

- [ ] **Step 3: Implement the two canvases**

In `AuthScene.tsx`, read `useTheme().palette.mode`. Put `data-testid="auth-canvas"` and `data-decor={mode === 'dark' ? 'aurora' : 'wash'}` on the outer `Box`.

- **dark** — unchanged: `bgcolor: tokens('dark').surface.base`, plus `<AuroraField>` and `<BandTexture>`.
- **light** — no `AuroraField`, no `BandTexture`. A soft vertical wash between two brand-tinted near-whites:
  ```ts
  background: `linear-gradient(180deg, ${t.surface.base} 0%, ${t.surface.sunken} 100%)`
  ```
  Verify body text on that wash clears 4.5:1 using `contrastRatio` from Task 1 — the light stops must not be so tinted that they fail. If they do, lighten the stops.

Also rewrite the `AuthScene` docstring, which currently describes the light-card-on-dark-canvas convention this replaces.

- [ ] **Step 4: Run the gate and commit**

```bash
./node_modules/.bin/vitest run
./node_modules/.bin/tsc -b --noEmit
pnpm exec biome check .
git add src/components/auth src/components/landing/AuroraField.tsx src/components/landing/BandTexture.tsx
git commit -m "feat(exchange): give light mode a gradient wash instead of the aurora"
```

---

### Task 5: Remove the per-page theme overrides — auth and marketing

Six pages. Split from Task 6 so a reviewer can reject the marketing half without blocking the app half.

**Files:**
- Modify: `src/pages/LandingPage.tsx`, `src/pages/SignIn/SignIn.tsx`, `src/pages/SignUp/SignUp.tsx`, `src/pages/ImportPage/ImportPage.tsx`, `src/pages/ImportLedger/ImportLedger.tsx`, `src/pages/ImportAccountPage/ImportAccountPage.tsx`

**Interfaces:**
- Consumes: the unified `createAppTheme` from Task 2
- Produces: nothing

- [ ] **Step 1: Confirm the inventory before touching anything**

```bash
grep -rn "ThemeProvider theme={landingTheme}" src/pages/ --include="*.tsx"
```

Expected: 12 files. If the count differs from the plan, stop and report — the plan was written against 12.

- [ ] **Step 2: Remove the wrapper from each of the six**

For each file: delete the `<ThemeProvider theme={landingTheme}>` wrapper and its import, so the page inherits from `ThemeContext`. Keep the inner tree unchanged.

- [ ] **Step 3: Replace `landingTheme`-only tokens as you go**

These pages import `brandInk`, `onCanvas` and `brandCanvas` from `theme/landingTheme`. Those are dark-only literals. Replace each with its semantic equivalent:

| Old | New |
|---|---|
| `brandInk.night` | `tokens(mode).surface.base` |
| `onCanvas.primary` | `tokens(mode).text.primary` |
| `onCanvas.secondary` | `tokens(mode).text.secondary` |
| `palette.indigoHover` | `tokens(mode).accent.primary` |

Read the mode from `useTheme().palette.mode`. Where a component is not already inside a MUI `ThemeProvider` in tests, the test must wrap it — do not add a fallback default to the component.

- [ ] **Step 4: Run the gate**

```bash
./node_modules/.bin/tsc -b --noEmit
./node_modules/.bin/vitest run
pnpm exec biome check .
```

Fix any test that asserted a dark literal, by reading from `tokens(...)`.

- [ ] **Step 5: Verify both modes in the browser**

```bash
./node_modules/.bin/vite --host
```

Open `/`, `/signin`, `/signup`, `/import`, `/import/ledger`, `/import-account` in **both** modes (toggle in Settings, or set `localStorage.setItem('theme','dark')` and reload). Confirm no unreadable text and no dark-on-dark or light-on-light. **Screenshot each in both modes and attach the list to your report.**

- [ ] **Step 6: Commit**

```bash
git add src/pages/LandingPage.tsx src/pages/SignIn src/pages/SignUp src/pages/ImportPage src/pages/ImportLedger src/pages/ImportAccountPage
git commit -m "feat(exchange): auth and marketing pages inherit the app theme"
```

---

### Task 6: Remove the per-page theme overrides — app pages

The remaining six.

**Files:**
- Modify: `src/pages/Dashboard/Dashboard.tsx`, `src/pages/Wallet/Wallet.tsx`, `src/pages/Dex/Dex.tsx`, `src/pages/Swap/Swap.tsx`, `src/pages/Bridge/Bridge.tsx`, `src/pages/CreateToken.tsx`

**Interfaces:**
- Consumes: the unified theme
- Produces: nothing

- [ ] **Step 1: Remove each wrapper and its import**

Same as Task 5. Note `Bridge.tsx` has **two** `ThemeProvider` wrappers (around line 192 and line 240) — remove both.

- [ ] **Step 2: Replace dark-only tokens with semantic equivalents**

Replace each `landingTheme`-only token with its semantic equivalent, reading the mode
from `useTheme().palette.mode`:

| Old | New |
|---|---|
| `brandInk.night` | `tokens(mode).surface.base` |
| `onCanvas.primary` | `tokens(mode).text.primary` |
| `onCanvas.secondary` | `tokens(mode).text.secondary` |
| `palette.indigoHover` | `tokens(mode).accent.primary` |

Where a component is not already inside a MUI `ThemeProvider` in its tests, the test must
wrap it — do not add a fallback default to the component.

- [ ] **Step 3: Run the gate**

```bash
./node_modules/.bin/tsc -b --noEmit
./node_modules/.bin/vitest run
pnpm exec biome check .
```

- [ ] **Step 4: Confirm no override survives**

```bash
grep -rn "landingTheme" src/ --include="*.tsx" --include="*.ts"
```

Expected: only `theme/landingTheme.ts` itself. If a page still references it, it was missed.

- [ ] **Step 5: Verify both modes in the browser**

Open `/desktop/wallet`, `/desktop/dex`, `/desktop/swap`, `/desktop/bridge`, `/desktop/create-token` in both modes. Screenshot each; attach the list.

- [ ] **Step 6: Commit**

```bash
git add src/pages
git commit -m "feat(exchange): app pages inherit the app theme"
```

---

### Task 7: Light mode for the create-wallet wizard

The spec's Cost section names these explicitly: they were built days ago as dark-only
surfaces and need light counterparts. Left out, the wizard is the one flow that still
hardcodes dark after every page around it has been converted.

**Files:**
- Modify: `src/components/auth/StepRail.tsx`
- Modify: `src/features/auth/create-wallet/steps/RecoveryPhraseStep.tsx`
- Modify: `src/features/auth/create-wallet/steps/SecureStep.tsx`
- Modify: `src/features/auth/create-wallet/CreateWalletWizard.tsx`
- Modify: `src/features/auth/SeedBackup.tsx`
- Test: `src/components/auth/__tests__/StepRail.test.tsx` (extend the existing file)

**Interfaces:**
- Consumes: `tokens`, `type ThemeMode` from `@/theme/tokens/semantic`; `overlaySurface`
- Produces: nothing new — all props unchanged

- [ ] **Step 1: Inventory the dark-only literals**

```bash
grep -rn "onCanvas\|brandInk\|rgba(255, *255, *255" \
  src/components/auth/StepRail.tsx \
  src/features/auth/create-wallet/ \
  src/features/auth/SeedBackup.tsx
```

Every hit is a value that assumes a dark background. Task 8's lint will fail on the
`rgba(...)` ones regardless, so this is the task that resolves them.

- [ ] **Step 2: Extend the StepRail test to cover both modes**

Add to `src/components/auth/__tests__/StepRail.test.tsx`:

```tsx
import { ThemeProvider } from '@mui/material/styles';
import { createAppTheme } from '@/theme/mui-theme';

describe('StepRail in both modes', () => {
  const STEPS = ['Intro', 'Phrase', 'Secure'];

  it('renders its labels in light mode', () => {
    render(
      <ThemeProvider theme={createAppTheme('light')}>
        <StepRail steps={STEPS} current={1} />
      </ThemeProvider>,
    );
    for (const label of STEPS) expect(screen.getByText(label)).toBeInTheDocument();
    expect(screen.getByText('Phrase')).toHaveAttribute('data-state', 'current');
  });

  it('renders its labels in dark mode', () => {
    render(
      <ThemeProvider theme={createAppTheme('dark')}>
        <StepRail steps={STEPS} current={1} />
      </ThemeProvider>,
    );
    for (const label of STEPS) expect(screen.getByText(label)).toBeInTheDocument();
  });
});
```

Note the three-step labels — the wizard was reshaped to Intro → Phrase → Secure, so a
four-item fixture would not match the app.

- [ ] **Step 3: Run it and watch it fail**

```bash
./node_modules/.bin/vitest run src/components/auth/__tests__/StepRail.test.tsx
```

Expected: the existing tests pass; the new ones fail or render unreadably because
`StepRail` reads `onCanvas` directly rather than the theme.

- [ ] **Step 4: Convert each file**

Read `useTheme().palette.mode`, then replace using the same mapping as Tasks 5 and 6:
`onCanvas.primary` → `tokens(mode).text.primary`, `onCanvas.secondary` →
`tokens(mode).text.secondary`, `palette.indigoHover` → `tokens(mode).accent.primary`,
`brandInk.night` → `tokens(mode).surface.base`.

Two specifics:

- **`RecoveryPhraseStep`'s seed grid** uses `rgba(255,255,255,0.05)` for the word tiles
  and a violet-tinted shield panel. Both are dark-mode assumptions. Use
  `tokens(mode).surface.sunken` for the tiles and `tokens(mode).accent.muted` for the
  panel background, keeping `accent.primary` for its border and icon.
- **Do not change the blur-until-revealed behaviour, the placeholder dots, or the
  reduced-motion blocks.** This is a colour change only. The words must still be absent
  from the DOM until revealed, in both modes.

- [ ] **Step 5: Run the gate**

```bash
./node_modules/.bin/tsc -b --noEmit
./node_modules/.bin/vitest run
pnpm exec biome check .
```

- [ ] **Step 6: Verify the wizard in both modes**

```bash
./node_modules/.bin/vite --host
```

Walk `/signup` end to end in **both** modes: intro → reveal the phrase → password. Confirm
the seed words are readable when revealed and genuinely hidden before, in both. Screenshot
each step in each mode; attach the list to your report.

- [ ] **Step 7: Commit**

```bash
git add src/components/auth/StepRail.tsx src/features/auth/create-wallet src/features/auth/SeedBackup.tsx src/components/auth/__tests__/StepRail.test.tsx
git commit -m "feat(exchange): give the create-wallet wizard a light mode"
```

---

### Task 8: Token lint

Enforced as a test so it runs in the existing gate — no new tooling, and it fails CI the same way any other test does.

**Files:**
- Create: `src/theme/__tests__/noRawColours.test.ts`

**Interfaces:**
- Consumes: nothing
- Produces: nothing — this task adds an enforcement test only

- [ ] **Step 1: Write the test**

Create `src/theme/__tests__/noRawColours.test.ts`:

```ts
/**
 * Raw-colour lint.
 *
 * Enforced as a test rather than a bespoke lint rule so it runs in the gate the
 * repo already has. This is the guard that stops the app drifting back into
 * three competing colour systems: the previous state existed precisely because
 * nothing stopped a component inventing its own hex.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import fg from 'fast-glob';
import { describe, expect, it } from 'vitest';

const SRC = path.resolve(import.meta.dirname, '../..');

/** Files allowed to name a literal colour. */
const ALLOWED = [
  'theme/tokens/semantic.ts',
  'theme/surfaces.ts',
  'styles/tokens.ts',
  'theme/landingTheme.ts',
];

const HEX = /#[0-9a-fA-F]{3,8}\b/;
const RGBA = /\brgba?\(/;

describe('no raw colour literals in components', () => {
  it('every colour comes from a token', () => {
    const files = fg.sync(['**/*.{ts,tsx}'], {
      cwd: SRC,
      ignore: ['**/__tests__/**', '**/*.d.ts', ...ALLOWED],
    });

    const offenders: string[] = [];
    for (const rel of files) {
      const src = readFileSync(path.join(SRC, rel), 'utf8');
      src.split('\n').forEach((line, i) => {
        if (line.trimStart().startsWith('*') || line.trimStart().startsWith('//')) return;
        if (HEX.test(line) || RGBA.test(line)) offenders.push(`${rel}:${i + 1}  ${line.trim()}`);
      });
    }

    expect(offenders, `Use a semantic token instead:\n${offenders.join('\n')}`).toEqual([]);
  });
});
```

- [ ] **Step 2: Run it and see the real scale**

```bash
./node_modules/.bin/vitest run src/theme/__tests__/noRawColours.test.ts
```

Expected: FAIL, listing every offender. **This number will be large.** Do not weaken the test to make it pass.

- [ ] **Step 3: Triage, then fix**

Work through the offenders, replacing each literal with the nearest semantic token. Two legitimate outcomes besides a straight swap:

- A colour that is genuinely not a theme colour (a fixed brand asset, a third-party embed's required value) — add its file to `ALLOWED` **with a comment saying why**.
- A colour with no matching token — add the token to `semantic.ts` in both modes, with the Task 1 tests still passing.

If the offender list is too large for one commit, commit in batches by directory, running the full gate each time. The task is not done until the test passes with no additions to `ALLOWED` beyond genuinely-not-theme cases.

- [ ] **Step 4: Confirm `fast-glob` is available**

```bash
node -e "require.resolve('fast-glob')" && echo "available"
```

`fast-glob` ships as a Vite transitive dependency. If this fails, use `node:fs`'s `readdirSync` with `{ recursive: true }` instead — do **not** add a dependency.

- [ ] **Step 5: Commit**

```bash
git add src/theme/__tests__/noRawColours.test.ts src/
git commit -m "test(exchange): fail the build on raw colour literals in components"
```

---

### Task 9: PageFrame adoption and the acceptance test

**Files:**
- Modify: authenticated route pages not already using `PageFrame`
- Test: `src/layouts/__tests__/PageFrame.test.tsx`

**Interfaces:**
- Consumes: `PageFrame` from `@/layouts/PageFrame` — props `{ title: string; subtitle?: string; actions?: ReactNode; fit?: boolean; children }`
- Produces: nothing

- [ ] **Step 1: Find who does not use it**

```bash
grep -rL "PageFrame" src/pages/*/[A-Z]*.tsx src/pages/*.tsx
```

`PageFrame` currently has 5 consumers. Every authenticated route should be one.

- [ ] **Step 2: Adopt it, one page per commit**

For each page, replace its bespoke header markup with `PageFrame`'s `title` / `subtitle` / `actions`. Delete the page's own heading element — `PageFrame` owns the `h1`, and two `h1`s on a screen is the inconsistency this fixes.

Do not restructure page content beyond the header.

- [ ] **Step 3: Write the acceptance test**

Create `src/layouts/__tests__/PageFrame.test.tsx`:

```tsx
/**
 * PageFrame — unit tests
 *
 * One h1 per screen is the invariant; the shell exists because the app had four
 * title sizes across four heading tags.
 */
import { ThemeProvider } from '@mui/material/styles';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { createAppTheme } from '@/theme/mui-theme';
import { PageFrame } from '../PageFrame';

const renderFrame = () =>
  render(
    <ThemeProvider theme={createAppTheme('light')}>
      <PageFrame title="Portfolio" subtitle="Your holdings">
        <div>content</div>
      </PageFrame>
    </ThemeProvider>,
  );

describe('PageFrame', () => {
  it('renders exactly one level-1 heading', () => {
    renderFrame();
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
  });

  it('renders the title, subtitle and children', () => {
    renderFrame();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Portfolio');
    expect(screen.getByText('Your holdings')).toBeInTheDocument();
    expect(screen.getByText('content')).toBeInTheDocument();
  });
});
```

- [ ] **Step 4: Run the full gate including the build**

```bash
./node_modules/.bin/tsc -b --noEmit
./node_modules/.bin/vitest run
pnpm exec biome check .
rm -rf dist && ./node_modules/.bin/vite build
```

- [ ] **Step 5: Run the plan's acceptance test by hand**

```bash
./node_modules/.bin/vite --host
```

Sign in, open **Settings → Theme**, and toggle. Confirm **every** page changes — the six from Task 5, the six from Task 6, and the rest of the app. That toggle doing nothing on twelve pages is the defect this whole plan exists to fix, so this is the check that says it is done.

Record in your report which pages you toggled and what you saw.

- [ ] **Step 6: Commit**

```bash
git add src/pages src/layouts
git commit -m "feat(exchange): every authenticated route renders through PageFrame"
```

---

### Task 10: Intent on-colors

**Added 2026-08-18, after Task 2.** Task 2 established `accent.onPrimary` — an ink
token defined per mode, because `accent.primary` sits at a medium luminance and no
single ink clears AA against both modes. The `intent.*` family has exactly the same
shape and exactly the same gap: nothing names the ink that goes *on* an intent fill,
so call sites hardcode `white`.

Measured consequence: white on `colors.error` renders at **2.78:1 in dark mode** — a
real WCAG AA failure on error messaging, the copy that most needs to be readable.
This is **not a regression** from Task 2; those sites measured 2.44 before it, so the
token derivation improved them. It is a pre-existing defect that Task 2 made visible
and is the last of this class.

**Execute this task before Task 5**, since Tasks 5-7 re-theme pages that render error
and success copy.

**Files:**
- Modify: `src/theme/tokens/semantic.ts` — extend the `intent` group
- Modify: `src/theme/mui-theme.ts` — `paletteFor`, add `contrastText` to all four intents
- Modify: `src/styles/themes/index.ts` — expose the four inks on the styled-components theme
- Modify: `src/styles/styled.d.ts` — declare them on `DefaultTheme['colors']`
- Modify: `src/contexts/ToastContext.tsx:78,105`, `src/features/auth/LoginForm.tsx:41`, `src/features/auth/ImportAccount.tsx:72`
- Test: `src/theme/__tests__/themeDerivation.test.ts`

**Interfaces:**
- Consumes: `SemanticTokens`, `tokens(mode)`, `contrastRatio(fg, bg)` from Task 1; the
  per-mode ink pattern established by `accent.onPrimary` in Task 2.
- Produces: `intent.onSuccess | onDanger | onWarning | onInfo` on `SemanticTokens`;
  `colors.onSuccess | onError | onWarning | onInfo` on the styled-components theme;
  `contrastText` on MUI's `success | error | warning | info`.

**These values are measured, not chosen.** Every intent fill in dark mode is a light
tint and every one in light mode is a deep shade, so the ink inverts per mode — white
in light, near-black in dark. Verified with the WCAG formula against the existing
`intent` values:

| intent | light fill | white | dark fill | near-black `#14122b` |
|---|---|---:|---|---:|
| danger  | `#c62828` | **5.62** | `#ff6b6b` | **6.57** |
| info    | `#1565c0` | **5.75** | `#6aa8ff` | **7.52** |
| success | `#1b7a4b` | **5.34** | `#3ddc97` | **10.32** |
| warning | `#a15c00` | **5.19** | `#ffb84d` | **10.61** |

All eight clear 4.5:1. Do not substitute your own values without re-measuring.

- [ ] **Step 1: Write the failing test**

Add to `src/theme/__tests__/themeDerivation.test.ts`:

```ts
describe('intent on-colors', () => {
  const INTENTS = ['success', 'danger', 'warning', 'info'] as const;
  const INK: Record<(typeof INTENTS)[number], 'onSuccess' | 'onDanger' | 'onWarning' | 'onInfo'> = {
    danger: 'onDanger',
    info: 'onInfo',
    success: 'onSuccess',
    warning: 'onWarning',
  };

  it.each(['light', 'dark'] as const)('every intent ink clears AA in %s mode', (mode) => {
    const t = tokens(mode);
    for (const intent of INTENTS) {
      expect(contrastRatio(t.intent[INK[intent]], t.intent[intent])).toBeGreaterThanOrEqual(4.5);
    }
  });

  it.each(['light', 'dark'] as const)('MUI contrastText reads the same token in %s mode', (mode) => {
    const t = tokens(mode);
    const { palette } = createAppTheme(mode);
    expect(palette.error.contrastText).toBe(t.intent.onDanger);
    expect(palette.success.contrastText).toBe(t.intent.onSuccess);
    expect(palette.warning.contrastText).toBe(t.intent.onWarning);
    expect(palette.info.contrastText).toBe(t.intent.onInfo);
  });
});
```

- [ ] **Step 2: Run it and watch it fail**

```bash
./node_modules/.bin/vitest run src/theme/__tests__/themeDerivation.test.ts
```

Expected: fails — `t.intent.onDanger` is `undefined`, so `contrastRatio` returns `NaN`
and `toBeGreaterThanOrEqual` fails.

- [ ] **Step 3: Extend the token interface and both value sets**

In `src/theme/tokens/semantic.ts`, replace the `intent` line of `SemanticTokens`:

```ts
  /**
   * `on*` is the ink that goes *on* the matching intent fill — the same
   * per-mode role as `accent.onPrimary`. Every intent fill is a light tint in
   * dark mode and a deep shade in light mode, so the ink inverts between them:
   * white on light-mode fills, near-black on dark-mode fills. Ratios are in
   * the plan's Task 10 table; all eight clear 4.5:1.
   */
  intent: {
    success: string; danger: string; warning: string; info: string;
    onSuccess: string; onDanger: string; onWarning: string; onInfo: string;
  };
```

Dark set:

```ts
    intent: {
      danger: '#ff6b6b', info: '#6aa8ff', success: '#3ddc97', warning: '#ffb84d',
      onDanger: '#14122b', onInfo: '#14122b', onSuccess: '#14122b', onWarning: '#14122b',
    },
```

Light set:

```ts
    intent: {
      danger: '#c62828', info: '#1565c0', success: '#1b7a4b', warning: '#a15c00',
      onDanger: '#ffffff', onInfo: '#ffffff', onSuccess: '#ffffff', onWarning: '#ffffff',
    },
```

- [ ] **Step 4: Wire both themes**

In `src/theme/mui-theme.ts`'s `paletteFor`, give all four intents their ink:

```ts
    error: { contrastText: t.intent.onDanger, main: t.intent.danger },
    info: { contrastText: t.intent.onInfo, main: t.intent.info },
    success: { contrastText: t.intent.onSuccess, main: t.intent.success },
    warning: { contrastText: t.intent.onWarning, main: t.intent.warning },
```

In `src/styles/themes/index.ts`, expose them alongside the existing `onPrimary`, reading
the same tokens (`lightTokens` / `darkTokens` per theme). Declare all four on
`DefaultTheme['colors']` in `src/styles/styled.d.ts`.

- [ ] **Step 5: Repoint the hardcoded inks**

Four sites fill with `colors.error` and hardcode white ink. Point each at `colors.onError`:
`src/contexts/ToastContext.tsx:78` and `:105`, `src/features/auth/LoginForm.tsx:41`,
`src/features/auth/ImportAccount.tsx:72`.

Then sweep for the same shape across the other three intents — `colors.success`,
`colors.warning`, `colors.info` used as a fill with a literal ink. State how you searched.
`${colors.error}10`-style alpha washes are backgrounds for *body* text, not intent fills;
leave them and say so.

- [ ] **Step 6: Run the full gate**

```bash
./node_modules/.bin/tsc -b --noEmit
./node_modules/.bin/vitest run
pnpm exec biome check .
```

All green; 15 pre-existing biome warnings are expected, 0 errors.

- [ ] **Step 7: Commit**

```bash
git add src/theme src/styles src/contexts src/features
git commit -m "fix(exchange): give every intent fill a per-mode ink that clears AA"
```

---

### Task 11: Light mode for the landing render tree

**Added 2026-08-19, after Task 5.** Task 5 removed the `landingTheme` override from the
auth and marketing pages, but deliberately left `LandingPage.tsx`'s own canvas **pinned
dark**. That deviation was correct: the page's render tree paints fixed ink directly on
that canvas with no per-mode counterpart, so making the canvas follow the toggle without
converting the tree first would have made most of the page's text invisible in light mode.

**This task exists because the spec does not permit that as a final state.** The
Decisions table commits marketing to *"follow the toggle too — no permanently-dark
surfaces"*, and the acceptance test is *"the toggle demonstrably changes **every** page."*
Until this task lands, `LandingPage` is the one page that still ignores the toggle — the
exact defect this plan was written to eliminate.

**Run this before Task 9**, which owns the acceptance test that this task's completion is
a precondition for.

**Scale, measured:** 1,866 LOC across `src/components/landing/`, ~57 token sites in 11
components. This is comparable in size to Task 5 and should not be folded into another task.

**Files:**
- Modify: `src/pages/LandingPage.tsx` — canvas follows `tokens(mode)`
- Modify, each importing from `@/theme/landingTheme` today:
  `Header.tsx` (`brandInk`), `HeroSection.tsx` (`brandCanvas`, `brandInk`,
  `heroGradientStyles`, `onCanvas`), `FeatureBento.tsx` (`brandCanvas`, `brandSurface`,
  `onCanvas`), `Footer.tsx` (`onCanvas`), `IconBullets.tsx` (`brandCanvas`,
  `brandSurface`, `onCanvas`), `SecurityStatement.tsx` (`onCanvas`), `FaqSection.tsx`
  (`brandCanvas`, `brandSurface`, `onCanvas`), `BigCTA.tsx` (`brandInk`, `brandSurface`,
  `ctaGradientStyles`), plus `MarqueeBand.tsx`, `Blueprint.tsx`, `diagrams.tsx`
- Leave alone: `AuroraField.tsx` and `BandTexture.tsx` — they import `aurora`/`mesh` and
  are **dark-only by design** (Task 4). They do not need light values; they simply do not
  render in light mode. Do not invent a light aurora.
- Test: `src/components/landing/__tests__/` — extend the existing contrast tests

**Interfaces:**
- Consumes: `tokens(mode)`, `contrastRatio(fg, bg)`, `accent.onPrimary`, `intent.on*`
- Produces: no new exports. On completion `landingTheme.ts` should have **no remaining
  consumers outside Task 6's app pages** — check before deleting it, and delete it only
  if nothing imports it.

**Mapping.** These are the same substitutions Tasks 4, 5 and 7 used; reuse them rather
than inventing new ones:

| current | replacement |
|---|---|
| `onCanvas.primary` | `tokens(mode).text.primary` |
| `onCanvas.secondary` | `tokens(mode).text.secondary` |
| `onCanvas.muted` | `tokens(mode).text.tertiary` |
| `brandCanvas` | `tokens(mode).surface.base` |
| `brandSurface` | `tokens(mode).surface.raised` |
| `brandInk.*` used as ink | the matching `text.*` token |
| ink on a gradient or accent fill | `accent.onPrimary` |

`heroGradientStyles` and `ctaGradientStyles` are the hard cases — a gradient has two
stops, and an ink that clears AA against one may fail against the other. Measure against
**both** stops. If no single ink clears both, the gradient's stops are what must change,
not the ink; say so and propose stops rather than picking an ink that fails one end.

- [ ] **Step 1: Write the failing test**

Extend the existing landing contrast tests (`Header.contrast.test.tsx`, `BigCTA.contrast.test.tsx`
already exist and use the established pattern) to cover light mode for every converted
component. Follow `SignUp.canvasContrast.test.tsx`'s idiom: `getComputedStyle` → hex →
`expect(contrastRatio(ink, bg)).toBeGreaterThanOrEqual(4.5)`.

Assert with `toBeGreaterThanOrEqual` directly on `contrastRatio(...)` so a `NaN` from a
bad parse fails loudly rather than passing.

- [ ] **Step 2: Run them and watch them fail**

```bash
./node_modules/.bin/vitest run src/components/landing
```

Expected: light-mode assertions fail — the components still paint fixed light-on-dark ink.

- [ ] **Step 3: Convert the components**

Apply the mapping table. Read `mode` the way the rest of the codebase does — `useTheme().palette.mode`,
or `tokens(mode)` directly. Do not hand-pick per-mode literals.

- [ ] **Step 4: Inspect every section in both modes**

The inspection is the work, exactly as in Task 5. For each converted component, in **both**
modes: does every piece of text clear 4.5:1 against what is actually behind it, and did
anything implicitly light-only become wrong in dark?

Record the per-component results with measured numbers in your report.

- [ ] **Step 5: Run the full gate**

```bash
./node_modules/.bin/tsc -b --noEmit
./node_modules/.bin/vitest run
pnpm exec biome check .
```

- [ ] **Step 6: Commit**

```bash
git add src/components/landing src/pages/LandingPage.tsx
git commit -m "feat(exchange): the landing page follows the theme toggle"
```

---

## Deferred

Not part of this plan.

- **The Dashboard rebuild** — spec 2, depends on this landing first.
- **CSS-in-JS consolidation** — 85 styled-components files against 102 MUI files.
- **`SurfaceContext.chromeless`** — dead (`MobileAuthScreen` renders `<SurfaceProvider chromeless>`, `Card` never consumes it, nothing reads it). Resolve during the card-anatomy work if it blocks; otherwise leave it.

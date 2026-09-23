# Launcher App Grid Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the launcher's three shelves of wide description cards with a flat grid of colour-identified app tiles, in the iOS springboard idiom, without introducing a single raw colour.

**Architecture:** Eight named hues enter `theme/tokens/semantic.ts` as an `appTile` family — each a `fill` plus the `on` ink verified against it, per mode, the same shape `intent` already uses. `navigation.tsx` flattens: destinations become named consts carrying a `hue`, exported as one ordered `LAUNCHER_TILES` array. A new `AppTile` component renders one tile; `AppLauncher` renders the grid. Columns are pinned per breakpoint rather than auto-filled, because hue adjacency depends on the column count.

**Tech Stack:** React 19, TypeScript, MUI 9 (`sx` styling), Vitest + Testing Library, Biome, Nx.

## Global Constraints

- **No raw colours outside token files.** `src/theme/__tests__/noRawColours.test.ts` fails the build on any hex, `rgb()`, `hsl()`, `oklch()`, or named CSS colour in `src/` outside its `ALLOWED` list. `theme/tokens/semantic.ts` is on that list; **no other file this plan touches is.**
- **Every fill ships its own ink, per mode.** A new fill without a verified `on` value in both modes is incomplete.
- **Contrast floors:** glyph-on-fill ≥ 4.5:1; fill-vs-`surface.base` ≥ 3:1; text ≥ 4.5:1.
- **Object literal keys are sorted alphabetically** — Biome enforces this. Note `accent` sorts before `appTile` ("c" < "p"). Interfaces are not sorted.
- **Test command:** `pnpm nx test exchange -- --run <path>` (run from repo root).
- **Commits:** conventional, scoped `exchange`, e.g. `feat(exchange): ...`.
- **Scope:** the desktop launcher only. Do not touch `pages/mobile/`, `MobileQuickActions`, or `AppTopBar`'s visual treatment.

---

## File Structure

| File | Responsibility | Task |
|---|---|---|
| `src/theme/tokens/semantic.ts` | Modify — add `APP_TILE_HUES`, `AppTileHue`, `appTile` to both modes | 1 |
| `src/theme/tokens/__tests__/appTile.test.ts` | Create — contrast floors for all 8 hues × 2 modes | 1 |
| `src/layouts/shell/navigation.tsx` | Modify — named consts, `hue` field, `LAUNCHER_TILES`, cast-free `TOP_TABS` | 2 |
| `src/layouts/shell/__tests__/navigation.test.ts` | Create — hue validity, adjacency, tab identity | 2 |
| `src/layouts/shell/AppTile.tsx` | Create — one tile: plate, glyph, label, ring, tooltip | 3 |
| `src/layouts/shell/__tests__/AppTile.test.tsx` | Create — anatomy, states, accessibility | 3 |
| `src/layouts/shell/AppLauncher.tsx` | Modify — flat pinned grid of `AppTile` | 4 |
| `src/layouts/shell/__tests__/AppLauncher.contrast.test.tsx` | Rewrite — asserts against roles that still exist | 4 |

`AppTile` is a separate file rather than a local function (as `LauncherCard` is today) because it carries its own states — rest, hover, press, focus, current — and testing those through the dialog means mounting fifteen of them to exercise one.

---

## Task 1: The `appTile` token family

**Files:**
- Modify: `apps/exchange/src/theme/tokens/semantic.ts`
- Test: `apps/exchange/src/theme/tokens/__tests__/appTile.test.ts` (create)

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces:
  - `APP_TILE_HUES: readonly ['amber','blue','green','indigo','rose','slate','teal','violet']`
  - `type AppTileHue = (typeof APP_TILE_HUES)[number]`
  - `SemanticTokens['appTile']: Record<AppTileHue, { fill: string; on: string }>`
  - reachable as `tokens(mode).appTile[hue].fill` / `.on`

- [ ] **Step 1: Write the failing test**

Create `apps/exchange/src/theme/tokens/__tests__/appTile.test.ts`:

```ts
/**
 * `appTile` — both-mode contrast.
 *
 * Eight fills is eight more things that can drift, so the floors are asserted
 * per hue rather than spot-checked. A hue added or edited without clearing both
 * modes fails here, which is the only thing keeping the family honest.
 */
import { describe, expect, it } from 'vitest';
import { APP_TILE_HUES, contrastRatio, tokens } from '@/theme/tokens/semantic';

describe.each(['light', 'dark'] as const)('appTile (%s mode)', (mode) => {
  it.each(APP_TILE_HUES)('%s: its glyph ink clears 4.5:1 on its own fill', (hue) => {
    const { fill, on } = tokens(mode).appTile[hue];
    expect(contrastRatio(on, fill)).toBeGreaterThanOrEqual(4.5);
  });

  it.each(APP_TILE_HUES)('%s: its fill is distinguishable from the ground', (hue) => {
    const t = tokens(mode);
    expect(contrastRatio(t.appTile[hue].fill, t.surface.base)).toBeGreaterThanOrEqual(3);
  });

  it('defines exactly the eight hues the type names', () => {
    expect(Object.keys(tokens(mode).appTile).sort()).toEqual([...APP_TILE_HUES].sort());
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm nx test exchange -- --run src/theme/tokens/__tests__/appTile.test.ts
```

Expected: FAIL — `APP_TILE_HUES` is not exported from `@/theme/tokens/semantic`.

- [ ] **Step 3: Add the hue list and type**

In `apps/exchange/src/theme/tokens/semantic.ts`, directly below the existing `export type ThemeMode = 'light' | 'dark';`:

```ts
/**
 * The tile hues the launcher identifies features by.
 *
 * A fixed set of roles, not a per-feature lookup: a sixteenth destination
 * reuses a hue rather than inventing one. Eight is the number that stays
 * mutually distinguishable *and* clears AA in both modes — fifteen distinct
 * hues cannot do both, some pairs always collapse into each other.
 *
 * Declared as a `const` array so the runtime list and the union type come from
 * one place; a test walks it to assert the floors per hue.
 */
export const APP_TILE_HUES = [
  'amber',
  'blue',
  'green',
  'indigo',
  'rose',
  'slate',
  'teal',
  'violet',
] as const;

export type AppTileHue = (typeof APP_TILE_HUES)[number];
```

- [ ] **Step 4: Add `appTile` to the `SemanticTokens` interface**

In the same file, inside `export interface SemanticTokens`, add after the `accent` member:

```ts
  /**
   * Feature-identifying tile fills, each with the ink that survives on it.
   *
   * Same contract as `intent`: the fill inverts between modes — a deep shade
   * in light, a light tint in dark — so the ink inverts with it, white on
   * light-mode fills and near-black on dark-mode ones. All sixteen pairs clear
   * 4.5:1, stricter than the 3:1 WCAG 1.4.11 asks of a graphic, because that
   * is the floor the rest of this file holds.
   */
  appTile: Record<AppTileHue, { fill: string; on: string }>;
```

- [ ] **Step 5: Add the dark-mode values**

Inside `SEMANTIC_TOKENS.dark`, add an `appTile` key **between `accent` and `border`** (alphabetical order is enforced):

```ts
    appTile: {
      amber: { fill: '#fcd34d', on: '#14122b' },
      blue: { fill: '#7dd3fc', on: '#14122b' },
      green: { fill: '#4ade80', on: '#14122b' },
      // Same value as `accent.primary`: the house colour staying on Dashboard
      // is what keeps the launcher looking like this product. If the brand
      // accent moves, this moves with it — deliberately, but consciously.
      indigo: { fill: '#8b7dff', on: '#14122b' },
      rose: { fill: '#fda4af', on: '#14122b' },
      slate: { fill: '#a8b3c4', on: '#14122b' },
      teal: { fill: '#5eead4', on: '#14122b' },
      violet: { fill: '#c4b5fd', on: '#14122b' },
    },
```

- [ ] **Step 6: Add the light-mode values**

Inside `SEMANTIC_TOKENS.light`, likewise between `accent` and `border`:

```ts
    appTile: {
      amber: { fill: '#b45309', on: '#ffffff' },
      blue: { fill: '#1d4ed8', on: '#ffffff' },
      green: { fill: '#15803d', on: '#ffffff' },
      // See the dark-mode note: same value as `accent.primary`, on purpose.
      indigo: { fill: '#5b4bdb', on: '#ffffff' },
      rose: { fill: '#be123c', on: '#ffffff' },
      slate: { fill: '#475569', on: '#ffffff' },
      teal: { fill: '#0f766e', on: '#ffffff' },
      violet: { fill: '#7c3aed', on: '#ffffff' },
    },
```

- [ ] **Step 7: Run the test to verify it passes**

```bash
pnpm nx test exchange -- --run src/theme/tokens/__tests__/appTile.test.ts
```

Expected: PASS — 34 tests (per mode: 8 glyph + 8 ground + 1 completeness = 17; × 2 modes).

- [ ] **Step 8: Verify the raw-colour lint still passes**

```bash
pnpm nx test exchange -- --run src/theme/__tests__/noRawColours.test.ts
```

Expected: PASS. `theme/tokens/semantic.ts` is on the `ALLOWED` list, so the new literals are legal *there* and nowhere else. If this fails, a hex was added to the wrong file.

- [ ] **Step 9: Commit**

```bash
git add apps/exchange/src/theme/tokens/semantic.ts \
        apps/exchange/src/theme/tokens/__tests__/appTile.test.ts
git commit -m "feat(exchange): add appTile hues, each with a verified per-mode ink"
```

---

## Task 2: Flatten navigation and give every destination a hue

**Files:**
- Modify: `apps/exchange/src/layouts/shell/navigation.tsx`
- Test: `apps/exchange/src/layouts/shell/__tests__/navigation.test.ts` (create)

**Interfaces:**
- Consumes: `APP_TILE_HUES`, `AppTileHue` from Task 1.
- Produces:
  - `Destination` gains a required `hue: AppTileHue`
  - `LAUNCHER_TILES: Destination[]` — all 15, in grid order
  - `TOP_TABS: Destination[]` — unchanged export, now built from named consts
  - `LAUNCHER_GROUPS` **retained unchanged in shape** so `AppLauncher` and its existing test keep compiling; Task 4 deletes it.

- [ ] **Step 1: Write the failing test**

Create `apps/exchange/src/layouts/shell/__tests__/navigation.test.ts`:

```ts
/**
 * The launcher's tile list.
 *
 * Two properties that are easy to break silently and impossible to see in
 * review: that every destination names a hue the token family actually
 * defines, and that no two tiles of one hue end up touching.
 *
 * Adjacency depends on the column count, which is why the grid pins its
 * columns instead of auto-filling. This test and
 * `AppLauncher`'s `gridTemplateColumns` have to agree — change one without the
 * other and this fails, which is the point.
 */
import { describe, expect, it } from 'vitest';
import { LAUNCHER_TILES, TOP_TABS } from '@/layouts/shell/navigation';
import { APP_TILE_HUES } from '@/theme/tokens/semantic';

/** The three counts `AppLauncher` pins its grid to, at xs / sm / md+. */
const COLUMN_COUNTS = [3, 4, 7];

describe('LAUNCHER_TILES', () => {
  it('lists fifteen destinations, each path once', () => {
    const paths = LAUNCHER_TILES.map((d) => d.path);
    expect(paths).toHaveLength(15);
    expect(new Set(paths).size).toBe(15);
  });

  it('gives every destination a hue the token family defines', () => {
    for (const destination of LAUNCHER_TILES) {
      expect(APP_TILE_HUES).toContain(destination.hue);
    }
  });

  it.each(COLUMN_COUNTS)('places no two tiles of one hue adjacently at %i columns', (columns) => {
    const clashes: string[] = [];
    LAUNCHER_TILES.forEach((tile, index) => {
      const rightIndex = index + 1;
      const belowIndex = index + columns;
      const hasRightNeighbour = (index % columns) + 1 < columns;
      if (hasRightNeighbour && LAUNCHER_TILES[rightIndex]?.hue === tile.hue) {
        clashes.push(`${tile.label} / ${LAUNCHER_TILES[rightIndex]?.label} (${tile.hue})`);
      }
      if (LAUNCHER_TILES[belowIndex]?.hue === tile.hue) {
        clashes.push(`${tile.label} / ${LAUNCHER_TILES[belowIndex]?.label} (${tile.hue})`);
      }
    });
    expect(clashes).toEqual([]);
  });
});

describe('TOP_TABS', () => {
  it('is built from the very objects the grid renders', () => {
    // Identity, not equality: the previous version indexed into the group
    // arrays positionally, so reordering a group silently retitled the top bar.
    for (const tab of TOP_TABS) {
      expect(LAUNCHER_TILES).toContain(tab);
    }
  });

  it('is the four destinations worth a click from anywhere', () => {
    expect(TOP_TABS.map((t) => t.label)).toEqual(['Dashboard', 'Portfolio', 'Trade', 'Swap']);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm nx test exchange -- --run src/layouts/shell/__tests__/navigation.test.ts
```

Expected: FAIL — `LAUNCHER_TILES` is not exported from `@/layouts/shell/navigation`.

- [ ] **Step 3: Replace the body of `navigation.tsx`**

Replace everything from `export interface Destination` to the end of the file with the following. The imports at the top of the file stay as they are, plus one addition — add `import { type AppTileHue } from '@/theme/tokens/semantic';` after the existing `react` import.

```tsx
export interface Destination {
  path: string;
  label: string;
  icon: ReactElement;
  /** One line saying what the screen does — the launcher tile's tooltip. */
  description: string;
  /** Which `appTile` hue identifies this destination in the launcher. */
  hue: AppTileHue;
  /** Matches the route exactly rather than by prefix. */
  exact?: boolean;
}

/*
 * Destinations are named consts rather than members of group arrays.
 *
 * `TOP_TABS` used to reach into those arrays positionally — `WALLET[0] as
 * Destination` — which meant reordering a group silently retitled the top bar,
 * and needed four casts to convince TypeScript the indexes were populated.
 * Named consts remove both problems: the tabs and the grid reference the same
 * objects by name, and identity is assertable.
 */

const DASHBOARD: Destination = {
  description: 'Your balances and activity at a glance',
  exact: true,
  hue: 'indigo',
  icon: <Apps />,
  label: 'Dashboard',
  path: '/desktop/wallet',
};

const PORTFOLIO: Destination = {
  description: 'Every asset this wallet holds',
  hue: 'violet',
  icon: <Inventory2Outlined />,
  label: 'Portfolio',
  path: '/desktop/wallet/portfolio',
};

const TRANSACTIONS: Destination = {
  description: 'The full history of this address',
  hue: 'slate',
  icon: <ReceiptLong />,
  label: 'Transactions',
  path: '/desktop/wallet/transactions',
};

const LEASING: Destination = {
  description: 'Delegate DCC to a node and earn',
  hue: 'teal',
  icon: <Timeline />,
  label: 'Leasing',
  path: '/desktop/wallet/leasing',
};

const ALIASES: Destination = {
  description: 'Readable names for your address',
  hue: 'violet',
  icon: <Badge />,
  label: 'Aliases',
  path: '/desktop/wallet/aliases',
};

const ACCOUNT_MANAGER: Destination = {
  description: 'Add, switch or remove accounts on this device',
  hue: 'green',
  icon: <ManageAccounts />,
  label: 'Account manager',
  path: '/desktop/wallet/account-manager',
};

const TRADE: Destination = {
  description: 'The order book, live',
  hue: 'green',
  icon: <ShowChart />,
  label: 'Trade',
  path: '/desktop/dex',
};

const SWAP: Destination = {
  description: 'One asset for another, at the best rate',
  hue: 'teal',
  icon: <SwapHoriz />,
  label: 'Swap',
  path: '/desktop/swap',
};

const BRIDGE: Destination = {
  description: 'Move assets across chains',
  hue: 'rose',
  icon: <AccountBalanceWallet />,
  label: 'Bridge',
  path: '/desktop/bridge',
};

const MARKETS: Destination = {
  description: 'Price overview across markets',
  hue: 'blue',
  icon: <BarChart />,
  label: 'Markets',
  path: '/desktop/markets',
};

const ORDER_BOOK: Destination = {
  description: 'Live order book and market depth',
  hue: 'amber',
  icon: <ReceiptLong />,
  label: 'Order book',
  path: '/desktop/orderbook',
};

const CREATE_TOKEN: Destination = {
  description: 'Issue an asset on DecentralChain',
  hue: 'amber',
  icon: <AddCircleOutlined />,
  label: 'Create token',
  path: '/desktop/create-token',
};

const ANALYTICS: Destination = {
  description: 'Activity and performance over time',
  hue: 'blue',
  icon: <QueryStats />,
  label: 'Analytics',
  path: '/desktop/analytics',
};

const MESSAGES: Destination = {
  description: 'Notifications from the network',
  hue: 'slate',
  icon: <NotificationsNoneOutlined />,
  label: 'Messages',
  path: '/desktop/messages',
};

const SETTINGS: Destination = {
  description: 'Preferences, security and session',
  hue: 'indigo',
  icon: <Settings />,
  label: 'Settings',
  path: '/desktop/settings',
};

/**
 * The launcher grid — every destination, most-used first.
 *
 * The order is also the hue arrangement: seven hues are used twice and `rose`
 * once, positioned so no repeated pair touches at 3, 4 or 7 columns, the three
 * counts the grid pins itself to. `navigation.test.ts` holds that.
 */
export const LAUNCHER_TILES: Destination[] = [
  DASHBOARD,
  TRADE,
  SWAP,
  PORTFOLIO,
  MARKETS,
  TRANSACTIONS,
  ORDER_BOOK,
  BRIDGE,
  LEASING,
  ALIASES,
  ACCOUNT_MANAGER,
  CREATE_TOKEN,
  ANALYTICS,
  MESSAGES,
  SETTINGS,
];

/** The launcher's shelves. Superseded by `LAUNCHER_TILES`; removed in Task 4. */
export const LAUNCHER_GROUPS: { title: string; items: Destination[] }[] = [
  {
    items: [DASHBOARD, PORTFOLIO, TRANSACTIONS, LEASING, ALIASES, ACCOUNT_MANAGER],
    title: 'Wallet',
  },
  { items: [TRADE, SWAP, BRIDGE, MARKETS, ORDER_BOOK], title: 'Markets' },
  { items: [CREATE_TOKEN, ANALYTICS, MESSAGES, SETTINGS], title: 'Tools' },
];

/**
 * The top tabs. Four destinations and then the launcher: the places worth a
 * click from anywhere, with everything else one press away.
 */
export const TOP_TABS: Destination[] = [DASHBOARD, PORTFOLIO, TRADE, SWAP];

/** Whether a destination is the one currently open. */
export function isCurrent(destination: Destination, pathname: string): boolean {
  if (destination.exact) {
    return pathname === destination.path || pathname === `${destination.path}/`;
  }
  return pathname === destination.path || pathname.startsWith(`${destination.path}/`);
}
```

- [ ] **Step 4: Run the new test to verify it passes**

```bash
pnpm nx test exchange -- --run src/layouts/shell/__tests__/navigation.test.ts
```

Expected: PASS — 7 tests (2 list + 3 column counts + 2 top-tab).

- [ ] **Step 5: Run the existing shell tests to verify nothing regressed**

```bash
pnpm nx test exchange -- --run src/layouts/shell
```

Expected: PASS. `LAUNCHER_GROUPS` still exists with the same shape, so `AppLauncher.contrast.test.tsx` (14 tests) and `AppTopBar.contrast.test.tsx` are unaffected.

- [ ] **Step 6: Typecheck**

```bash
pnpm nx typecheck exchange
```

Expected: PASS. If it reports a missing `hue` on a `Destination`, a const above was missed.

- [ ] **Step 7: Commit**

```bash
git add apps/exchange/src/layouts/shell/navigation.tsx \
        apps/exchange/src/layouts/shell/__tests__/navigation.test.ts
git commit -m "refactor(exchange): name every destination and give it a tile hue"
```

---

## Task 3: The `AppTile` component

**Files:**
- Create: `apps/exchange/src/layouts/shell/AppTile.tsx`
- Test: `apps/exchange/src/layouts/shell/__tests__/AppTile.test.tsx` (create)

**Interfaces:**
- Consumes: `tokens(mode).appTile` (Task 1); `Destination` with `hue` (Task 2); `radii.cards` from `@/styles/tokens` (existing, `'16px'`).
- Produces: `export function AppTile(props: { destination: Destination; active: boolean; onNavigate: (path: string) => void }): ReactElement`
  - renders a `button` whose accessible name is `destination.label`
  - the plate carries `class="app-tile__plate"` and `aria-hidden="true"`
  - the button carries `aria-describedby` pointing at a visually hidden node holding `destination.description`

- [ ] **Step 1: Write the failing test**

Create `apps/exchange/src/layouts/shell/__tests__/AppTile.test.tsx`:

```tsx
/**
 * AppTile — anatomy, state and reach.
 *
 * Tested directly rather than through the launcher: the tile carries five
 * states, and exercising one of them through the dialog means mounting fifteen
 * tiles to look at one.
 */
import { ThemeProvider } from '@mui/material/styles';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AppTile } from '@/layouts/shell/AppTile';
import { LAUNCHER_TILES } from '@/layouts/shell/navigation';
import { rgbToHex } from '@/test-utils/rgbToHex';
import { createAppTheme } from '@/theme/mui-theme';
import { contrastRatio, type ThemeMode, tokens } from '@/theme/tokens/semantic';

const SWAP = LAUNCHER_TILES.find((d) => d.label === 'Swap')!;

function toHex(value: string): string {
  return value.startsWith('#') ? value.toLowerCase() : rgbToHex(value);
}

function renderTile(mode: ThemeMode, active = false, onNavigate = vi.fn()) {
  render(
    <ThemeProvider theme={createAppTheme(mode)}>
      <AppTile destination={SWAP} active={active} onNavigate={onNavigate} />
    </ThemeProvider>,
  );
  const button = screen.getByRole('button', { name: SWAP.label });
  const plate = button.querySelector('.app-tile__plate') as HTMLElement;
  return { button, onNavigate, plate };
}

describe.each(['light', 'dark'] as const)('AppTile (%s mode)', (mode) => {
  it('paints its plate from the destination hue, both halves', () => {
    const { plate } = renderTile(mode);
    const hue = tokens(mode).appTile[SWAP.hue];
    expect(toHex(getComputedStyle(plate).backgroundColor)).toBe(hue.fill);
    expect(toHex(getComputedStyle(plate).color)).toBe(hue.on);
  });

  it('its glyph clears AA against the plate it sits on', () => {
    const { plate } = renderTile(mode);
    const ink = toHex(getComputedStyle(plate).color);
    const fill = toHex(getComputedStyle(plate).backgroundColor);
    expect(contrastRatio(ink, fill)).toBeGreaterThanOrEqual(4.5);
  });

  it('its label clears AA against the dialog ground, not the plate', () => {
    const { button } = renderTile(mode);
    const label = screen.getByText(SWAP.label);
    const ink = toHex(getComputedStyle(label).color);
    expect(contrastRatio(ink, tokens(mode).surface.base)).toBeGreaterThanOrEqual(4.5);
    // The label sits outside the plate, so its legibility depends on one
    // verified surface rather than on eight separate fills.
    expect(button.querySelector('.app-tile__plate')?.contains(label)).toBe(false);
  });

  it('marks the current destination without relying on the fill', () => {
    const { button, plate } = renderTile(mode, true);
    expect(button).toHaveAttribute('aria-current', 'page');
    // The fill identifies the feature, so the state has to be carried by the
    // ring instead. Asserted as present-vs-absent rather than by matching the
    // colour inside the shorthand: jsdom is free to normalise a hex in
    // `box-shadow` to `rgb()`, and an assertion that depends on which it picks
    // is a coin flip, not a test.
    expect(getComputedStyle(plate).boxShadow).not.toBe('none');
  });

  it('leaves a non-current destination without the marker or the ring', () => {
    const { button, plate } = renderTile(mode, false);
    expect(button).not.toHaveAttribute('aria-current');
    expect(getComputedStyle(plate).boxShadow).toBe('none');
  });
});

describe('AppTile behaviour', () => {
  it('navigates to its destination on click', async () => {
    const { button, onNavigate } = renderTile('light');
    button.click();
    expect(onNavigate).toHaveBeenCalledWith(SWAP.path);
  });

  it('exposes its description without needing a hover', () => {
    const { button } = renderTile('light');
    const id = button.getAttribute('aria-describedby');
    expect(id).toBeTruthy();
    expect(document.getElementById(id as string)?.textContent).toBe(SWAP.description);
  });

  it('hides the glyph from assistive tech and names itself by its label', () => {
    const { button, plate } = renderTile('light');
    expect(plate).toHaveAttribute('aria-hidden', 'true');
    expect(button).toHaveAccessibleName(SWAP.label);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm nx test exchange -- --run src/layouts/shell/__tests__/AppTile.test.tsx
```

Expected: FAIL — cannot resolve `@/layouts/shell/AppTile`.

- [ ] **Step 3: Create the component**

Create `apps/exchange/src/layouts/shell/AppTile.tsx`:

```tsx
import { Box, ButtonBase, Tooltip, Typography, useTheme } from '@mui/material';
import { useId } from 'react';
import type { Destination } from '@/layouts/shell/navigation';
import { radii } from '@/styles/tokens';
import { tokens } from '@/theme/tokens/semantic';

/**
 * One tile in the launcher grid.
 *
 * A coloured plate carrying the destination's glyph, with the label beneath it
 * on the dialog ground. The plate's colour identifies the *feature* — that is
 * what makes the grid scannable without reading — which has one consequence
 * worth stating: it can no longer identify the *state*. The old card marked the
 * current destination by filling its plate with `primary.main`; here the fill
 * is spoken for, so "you are here" is a ring around the plate and a weighted
 * label instead.
 *
 * The label sits outside the plate deliberately. On the plate it would have to
 * clear eight different fills in two modes; on the ground it clears
 * `surface.base`, which is already verified.
 *
 * The description reaches assistive tech through `aria-describedby` as well as
 * the tooltip, so it never depends on a pointer event.
 */

/**
 * Screen-reader-only styling, matching `visuallyHidden` in `@/styles/mixins`.
 * Inlined rather than imported because that mixin is a styled-components `css`
 * block and this component styles via MUI's `sx` — the same reasoning, and the
 * same shape, as `CreateWalletWizard`'s copy.
 */
const SR_ONLY = {
  borderWidth: 0,
  clip: 'rect(0, 0, 0, 0)',
  height: '1px',
  margin: '-1px',
  overflow: 'hidden',
  padding: 0,
  position: 'absolute',
  whiteSpace: 'nowrap',
  width: '1px',
} as const;

export function AppTile({
  destination,
  active,
  onNavigate,
}: {
  destination: Destination;
  active: boolean;
  onNavigate: (path: string) => void;
}) {
  const t = tokens(useTheme().palette.mode);
  const hue = t.appTile[destination.hue];
  const descriptionId = useId();

  /** Gap ring in the ground colour, then the accent — so it reads as detached. */
  const ring = `0 0 0 3px ${t.surface.base}, 0 0 0 5px ${t.accent.primary}`;

  return (
    <Tooltip title={destination.description} placement="bottom">
      <ButtonBase
        onClick={() => onNavigate(destination.path)}
        aria-current={active ? 'page' : undefined}
        aria-describedby={descriptionId}
        aria-label={destination.label}
        sx={{
          '&:active .app-tile__plate': { transform: 'scale(0.97)' },
          '&:focus-visible .app-tile__plate': { boxShadow: ring },
          '&:hover .app-tile__plate': { transform: 'scale(1.04)' },
          '@media (prefers-reduced-motion: reduce)': {
            '& .app-tile__plate': { transition: 'none' },
            '&:active .app-tile__plate, &:hover .app-tile__plate': { transform: 'none' },
          },
          alignItems: 'center',
          borderRadius: radii.cards,
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
          p: 1,
          width: '100%',
        }}
      >
        <Box
          aria-hidden="true"
          className="app-tile__plate"
          sx={{
            '& svg': { fontSize: 28 },
            alignItems: 'center',
            bgcolor: hue.fill,
            borderRadius: radii.cards,
            boxShadow: active ? ring : 'none',
            color: hue.on,
            display: 'flex',
            height: 64,
            justifyContent: 'center',
            transition: 'transform 160ms ease, box-shadow 160ms ease',
            width: 64,
          }}
        >
          {destination.icon}
        </Box>

        <Typography
          sx={{
            color: active ? t.accent.primary : t.text.primary,
            fontSize: 13,
            fontWeight: active ? 600 : 400,
            lineHeight: 1.3,
            textAlign: 'center',
          }}
        >
          {destination.label}
        </Typography>

        <Box component="span" id={descriptionId} sx={SR_ONLY}>
          {destination.description}
        </Box>
      </ButtonBase>
    </Tooltip>
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
pnpm nx test exchange -- --run src/layouts/shell/__tests__/AppTile.test.tsx
```

Expected: PASS — 13 tests.

If the `aria-current` ring assertion fails because `getComputedStyle().boxShadow` returns the hex uppercased or as `rgb()`, note the test compares on the hex digits with `#` stripped; convert with `rgbToHex` if jsdom normalises it to `rgb()` form.

- [ ] **Step 5: Verify the raw-colour lint still passes**

```bash
pnpm nx test exchange -- --run src/theme/__tests__/noRawColours.test.ts
```

Expected: PASS. `AppTile.tsx` is **not** on the `ALLOWED` list, so this is the check that the component names only roles. `'none'` and `'rect(0, 0, 0, 0)'` are not colours and will not trip it.

- [ ] **Step 6: Commit**

```bash
git add apps/exchange/src/layouts/shell/AppTile.tsx \
        apps/exchange/src/layouts/shell/__tests__/AppTile.test.tsx
git commit -m "feat(exchange): add the launcher's colour-identified app tile"
```

---

## Task 4: The launcher becomes a grid

**Files:**
- Modify: `apps/exchange/src/layouts/shell/AppLauncher.tsx`
- Modify: `apps/exchange/src/layouts/shell/navigation.tsx` (delete `LAUNCHER_GROUPS`)
- Test: `apps/exchange/src/layouts/shell/__tests__/AppLauncher.contrast.test.tsx` (rewrite)

**Interfaces:**
- Consumes: `AppTile` (Task 3), `LAUNCHER_TILES` and `isCurrent` (Task 2), `tokens` (Task 1).
- Produces: no new exports. `AppLauncher`'s props are unchanged: `{ open, onClose, pathname }`.

- [ ] **Step 1: Rewrite the test**

Replace the entire contents of `apps/exchange/src/layouts/shell/__tests__/AppLauncher.contrast.test.tsx`:

```tsx
/**
 * AppLauncher — the grid, in both modes.
 *
 * The previous version of this file asserted against a card/plate anatomy that
 * no longer exists: a `surface.raised` card fill, a rest/hover pair on that
 * card, an icon plate whose colour flipped on an active ternary, and shelf
 * headings. Tiles replace all of it, so this is a rewrite rather than an edit.
 *
 * What carries forward is the reason the file exists: this dialog is reachable
 * from all fifteen authenticated routes and had no coverage at all until a
 * mode-invariant fill made it unreadable in dark mode. Per-tile contrast lives
 * in `AppTile.test.tsx`; what is asserted here is the dialog's own ground and
 * that every destination is actually reachable.
 */
import { ThemeProvider } from '@mui/material/styles';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AppLauncher } from '@/layouts/shell/AppLauncher';
import { LAUNCHER_TILES } from '@/layouts/shell/navigation';
import { rgbToHex } from '@/test-utils/rgbToHex';
import { createAppTheme } from '@/theme/mui-theme';
import { contrastRatio, type ThemeMode, tokens } from '@/theme/tokens/semantic';

vi.mock('react-router', () => ({ useNavigate: () => vi.fn() }));

function toHex(value: string): string {
  return value.startsWith('#') ? value.toLowerCase() : rgbToHex(value);
}

/** The first tile's path, so exactly one destination renders as current. */
const ACTIVE_PATH = LAUNCHER_TILES[0]!.path;

function renderLauncher(mode: ThemeMode) {
  return render(
    <ThemeProvider theme={createAppTheme(mode)}>
      <AppLauncher open onClose={vi.fn()} pathname={ACTIVE_PATH} />
    </ThemeProvider>,
  );
}

function paperOf(el: HTMLElement): HTMLElement {
  return el.closest('.MuiDialog-paper') as HTMLElement;
}

describe.each(['light', 'dark'] as const)('AppLauncher (%s mode)', (mode) => {
  it('paints its dialog surface from a mode-aware token', () => {
    renderLauncher(mode);
    const paper = paperOf(screen.getByText('Everything'));
    expect(toHex(getComputedStyle(paper).backgroundColor)).toBe(tokens(mode).surface.base);
  });

  it('the dialog title clears AA against the surface it sits on', () => {
    renderLauncher(mode);
    const title = screen.getByText('Everything');
    const ink = toHex(getComputedStyle(title).color);
    const fill = toHex(getComputedStyle(paperOf(title)).backgroundColor);
    expect(contrastRatio(ink, fill)).toBeGreaterThanOrEqual(4.5);
  });

  it('every tile label clears AA against the dialog surface', () => {
    renderLauncher(mode);
    for (const destination of LAUNCHER_TILES) {
      const label = screen.getByText(destination.label);
      const ink = toHex(getComputedStyle(label).color);
      const fill = toHex(getComputedStyle(paperOf(label)).backgroundColor);
      expect(contrastRatio(ink, fill)).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('every tile plate clears AA between its own glyph and fill', () => {
    renderLauncher(mode);
    const plates = Array.from(document.querySelectorAll('.app-tile__plate'));
    expect(plates).toHaveLength(LAUNCHER_TILES.length);
    for (const plate of plates) {
      const style = getComputedStyle(plate as HTMLElement);
      expect(
        contrastRatio(toHex(style.color), toHex(style.backgroundColor)),
      ).toBeGreaterThanOrEqual(4.5);
    }
  });
});

describe('AppLauncher grid', () => {
  it('renders every destination exactly once', () => {
    renderLauncher('light');
    for (const destination of LAUNCHER_TILES) {
      expect(screen.getByRole('button', { name: destination.label })).toBeInTheDocument();
    }
  });

  it('marks exactly one tile as the current page', () => {
    renderLauncher('light');
    const current = screen
      .getAllByRole('button')
      .filter((b) => b.getAttribute('aria-current') === 'page');
    expect(current).toHaveLength(1);
    expect(current[0]).toHaveAccessibleName(LAUNCHER_TILES[0]!.label);
  });

  it('pins its columns rather than letting auto-fill choose them', () => {
    renderLauncher('light');
    const grid = document.querySelector('[data-testid="launcher-grid"]') as HTMLElement;
    // The hue arrangement is only verified at 3, 4 and 7 columns
    // (navigation.test.ts). `auto-fill` would also produce 5, 6 and 8 at
    // intermediate widths, each of which puts a repeated hue beside its twin.
    const columns = getComputedStyle(grid).gridTemplateColumns;
    expect(columns).toContain('repeat(');
    expect(columns).not.toContain('auto-fill');
    expect(columns).not.toContain('auto-fit');
  });
});
```

Note on the last test: jsdom does not evaluate media queries, so it reports the `xs` value — a fixed `repeat(...)`. The assertion is deliberately about the *form* rather than an exact string, because which breakpoint jsdom resolves is not the property worth pinning; that the count is never left to the browser is.

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm nx test exchange -- --run src/layouts/shell/__tests__/AppLauncher.contrast.test.tsx
```

Expected: FAIL — `LAUNCHER_TILES` renders no tiles; `.app-tile__plate` matches nothing; no `launcher-grid` testid.

- [ ] **Step 3: Rewrite `AppLauncher.tsx`**

Replace the entire contents of `apps/exchange/src/layouts/shell/AppLauncher.tsx`:

```tsx
import { Box, Dialog, Typography, useTheme } from '@mui/material';
import { useNavigate } from 'react-router';
import { AppTile } from '@/layouts/shell/AppTile';
import { isCurrent, LAUNCHER_TILES } from '@/layouts/shell/navigation';
import { radii } from '@/styles/tokens';
import { tokens } from '@/theme/tokens/semantic';

/**
 * The launcher.
 *
 * Every destination in the application on one surface, the way a phone shows
 * its applications: a flat grid of coloured tiles. It exists so the top bar can
 * stay four tabs — the launcher absorbs the tail of the navigation instead of
 * the chrome wearing all fifteen destinations at once.
 *
 * It is a modal rather than a menu because it is a place, not a list: open it,
 * see the whole product, go somewhere. Escape and backdrop close it; picking a
 * destination navigates and closes.
 *
 * ## Why the columns are pinned
 *
 * Tile hues are arranged so no two of one hue touch — but adjacency is a
 * function of the column count, and `auto-fill` would pick whatever fits,
 * including the counts where the arrangement breaks. Three fixed counts are
 * verified in `navigation.test.ts`; this grid may only use those. Changing a
 * value here without changing that list is a test failure, deliberately.
 *
 * ## Surfaces are roles, not `palette.*` constants
 *
 * `styles/tokens.ts`' `palette` has no mode dimension, so using it as a fill
 * under mode-aware ink made this dialog unreadable in dark mode — the paper at
 * 1.05:1 against its own title. The ground is `surface.base`; the tiles bring
 * their own verified fills. The arrangement survives a mode swap because it
 * never names a colour.
 */

export function AppLauncher({
  open,
  onClose,
  pathname,
}: {
  open: boolean;
  onClose: () => void;
  pathname: string;
}) {
  const navigate = useNavigate();
  const mode = useTheme().palette.mode;
  const isDark = mode === 'dark';
  const t = tokens(mode);

  const go = (path: string) => {
    onClose();
    void navigate(path);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      aria-label="All features"
      slotProps={{
        paper: {
          sx: {
            bgcolor: t.surface.base,
            borderRadius: radii.shell,
            boxShadow: 'none',
            overflow: 'hidden',
            position: 'relative',
          },
        },
      }}
    >
      <Box sx={{ p: { sm: 4, xs: 3 } }}>
        {/* The brand's front-door voice: mark, then the promise as a title. */}
        <Box sx={{ alignItems: 'center', display: 'flex', gap: 1.5, mb: 3 }}>
          <Box
            component="img"
            // The mark ships in two cuts and the dialog ground moves with the
            // mode, so the mark has to as well — a light-ground mark on the
            // dark dialog reads as a pale square.
            src={isDark ? '/brand/mark-on-dark.png' : '/brand/mark-on-light.png'}
            alt=""
            aria-hidden="true"
            sx={{ height: 28, width: 28 }}
          />
          <Typography
            component="h1"
            sx={{
              color: 'text.primary',
              fontSize: 22,
              fontWeight: 700,
              letterSpacing: '-0.02em',
              textTransform: 'uppercase',
            }}
          >
            Everything
          </Typography>
        </Box>

        <Box
          data-testid="launcher-grid"
          sx={{
            display: 'grid',
            gap: 2.5,
            gridTemplateColumns: {
              md: 'repeat(7, 1fr)',
              sm: 'repeat(4, 1fr)',
              xs: 'repeat(3, 1fr)',
            },
          }}
        >
          {LAUNCHER_TILES.map((destination) => (
            <AppTile
              key={destination.path}
              active={isCurrent(destination, pathname)}
              destination={destination}
              onNavigate={go}
            />
          ))}
        </Box>
      </Box>
    </Dialog>
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
pnpm nx test exchange -- --run src/layouts/shell/__tests__/AppLauncher.contrast.test.tsx
```

Expected: PASS — 11 tests.

- [ ] **Step 5: Delete the superseded export**

In `apps/exchange/src/layouts/shell/navigation.tsx`, delete the `LAUNCHER_GROUPS` const and its doc comment (added in Task 2, Step 3). Then confirm nothing references it:

```bash
grep -rn "LAUNCHER_GROUPS" apps/exchange/src
```

Expected: no output.

- [ ] **Step 6: Run the whole shell suite and the lint**

```bash
pnpm nx test exchange -- --run src/layouts/shell src/theme
```

Expected: PASS — `AppTopBar.contrast.test.tsx`, `AppTile.test.tsx`, `AppLauncher.contrast.test.tsx`, `navigation.test.ts`, `appTile.test.ts`, `noRawColours.test.ts`, `themeDerivation.test.ts`, `themeToggleAcceptance.test.tsx`, `surfaces.test.ts`.

- [ ] **Step 7: Typecheck and lint**

```bash
pnpm nx typecheck exchange && pnpm nx biome-lint exchange
```

Expected: PASS. If Biome reports unsorted keys, the object literals above are already alphabetical — re-check any key added by hand.

- [ ] **Step 8: Run the full exchange suite**

```bash
pnpm nx test exchange
```

Expected: PASS. This is the check that nothing outside the shell depended on the launcher's old anatomy.

- [ ] **Step 9: Commit**

```bash
git add apps/exchange/src/layouts/shell/AppLauncher.tsx \
        apps/exchange/src/layouts/shell/navigation.tsx \
        apps/exchange/src/layouts/shell/__tests__/AppLauncher.contrast.test.tsx
git commit -m "feat(exchange): the launcher becomes a flat grid of app tiles"
```

---

## Manual verification

After Task 4, confirm in the running app — automated tests cover contrast and structure, not whether it looks right.

```bash
pnpm nx dev exchange
```

1. Sign in, open the launcher from the top bar's `Apps` button.
2. **Both modes.** Toggle via Settings → General. Every tile legible in each; the grid ground moves with the mode.
3. **Current-route ring.** Navigate to Swap, reopen: the Swap tile carries a detached accent ring and a weighted label. No other tile does.
4. **Tooltip.** Hover a tile — the description appears. Tab to a tile — it appears on focus too.
5. **Columns.** At a wide window the grid is 7 across. Narrow the window and confirm it steps to 4, then 3, and that no two same-coloured tiles ever end up side by side or directly stacked.
6. **Reduced motion.** Enable macOS → Accessibility → Display → Reduce motion, reload, and confirm hovering no longer scales the tile.

---

## Notes for the implementer

- **`SR_ONLY` is duplicated on purpose.** `CreateWalletWizard.tsx` has the same constant for the same documented reason (the shared mixin is a styled-components `css` block, unusable from `sx`). Extracting it would mean editing an unrelated feature file; this plan leaves that for whoever needs a third copy.
- **Task 2 keeps `LAUNCHER_GROUPS` alive on purpose.** Deleting it in the same task that introduces `LAUNCHER_TILES` would break `AppLauncher` and its test mid-plan, leaving a task that cannot be run green. Task 4 removes it once its last consumer is gone.
- **`ReceiptLong` is used by two destinations** (Transactions and Order book). That is pre-existing and not this plan's to fix — but it means the glyph alone does not distinguish those two, which is part of why they get different hues (`slate` and `amber`).

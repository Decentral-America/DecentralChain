/**
 * The live mobile shell — ink and fill must follow the theme mode together.
 *
 * HOW THE MOBILE LAYER IS COLOURED NOW
 * ------------------------------------
 * `styles/mobileTokens.ts` no longer holds hex literals. Every `mobileSurface.*`,
 * `mobileText.*` and `mobileAccent.*` value is a CSS variable from `index.css`
 * (`var(--surface-ground)`, `var(--text-primary)`, `var(--color-indigo-ink)`),
 * and the premium kit the screens are built from (`GroupedList`, `Sheet`,
 * `TabBar`, `SearchField`, `PressAction`) paints through the same variables.
 * `:root` carries the light values and `:root[data-theme="dark"]` the dark
 * overrides, so dark mode follows `data-theme` with no per-component branching.
 * Two surfaces still come from the MUI theme instead: `MobileLayout`'s own canvas
 * (`tokens(mode).surface.base`) and `MobileButton`'s accent fill and ink. In the
 * app `ThemeContext` flips both mode sources together.
 *
 * THE DEFECT CLASS THIS FILE GUARDS
 * ---------------------------------
 * The failure it was written for is a *behaviour*, not a syntax: an element
 * whose ink moves when the theme mode moves, sitting on a fill that does not
 * (or the mirror image — pinned ink on a fill that does move). Before the
 * redesign that was a fixed `mobileSurface.*` hex under MUI's mode-aware
 * `text.primary`, ~1:1 in dark mode. The variables make it far harder to write,
 * but not impossible: a raw `#fff` plate, a `var(--color-pure-white)` fill (the
 * QR plate is one, deliberately) or an MUI-theme colour mixed into a
 * variable-painted surface all bring it straight back.
 *
 * So the sweep below still asserts the behaviour directly. Each live mobile
 * surface is rendered once per mode, every text-bearing element is paired
 * across the two renders by document order, and for each pair it resolves the
 * ink and the fill actually painted behind it *for that mode* and asserts:
 *
 *     the ink changes between modes  ⟺  the fill changes between modes
 *
 * The sweep deliberately does not assert a ratio; the named sites in the second
 * block do, in both modes, against the surface each one actually sits on.
 *
 * MEASURING VARIABLES IN JSDOM
 * ----------------------------
 * jsdom never substitutes `var(...)`, so every colour is resolved against the
 * real `index.css` definitions (`@/test-utils/cssVars`) and composited with
 * `@/test-utils/paintedBackground` — translucent layers (the chrome material,
 * `--surface-fill` wells) onto the first opaque surface beneath them. Two jsdom
 * gaps the shared helpers do not cover are bridged here, in `materialise`:
 *   - a `background:` *shorthand* holding `var(...)` — how every styled-component
 *     in the kit paints — is kept verbatim but never expanded into
 *     `background-color`, which stays transparent. Read as-is, a grouped-list
 *     cell or the sheet panel would silently measure the page behind it.
 *   - element-scoped custom properties. `Sheet` re-points `--grouped-cell` (and
 *     in dark mode lifts it to `--surface-frosted`) for the lists inside it;
 *     `index.css` does not define that name, so only the element knows it.
 * A painted image (gradient, url) anywhere under a measured element makes the
 * ratio helpers throw rather than guess — the old dark gradient header band is
 * gone, and nothing on these surfaces paints one today.
 *
 * WHAT COUNTS AS LIVE
 * -------------------
 * Every surface below is production, selected by VIEWPORT, not by
 * `import.meta.env.DEV`:
 *   - `layouts/ResponsiveLayout.tsx` renders `<MobileLayout/>` whenever
 *     `useMediaQuery(theme.breakpoints.down('md'))` is true, i.e. on any phone.
 *   - `routes/walletRoutes.tsx` and `routes/settingsRoutes.tsx` route
 *     `MobileHome`, `MobilePortfolio` and `MobileAccount` through
 *     `ResponsiveScreen`; each opens with `MobileAppBar`, the iOS large-title bar
 *     on the page ground that replaced the dark gradient header band.
 *   - `MobileHome` renders `MobileReceiveSheet`, which renders `BottomSheet`.
 *   - `MobileLayout` renders `MobileTabBar` (the kit's `TabBar` on the chrome
 *     material), which renders `MobileMenuDrawer`, a grouped `BottomSheet`.
 * The only DEV-gated mobile screens are `MobileWelcome` and `MobileMarkets`
 * (the `/mobile-preview*` tree in `routes/index.tsx`), not covered here.
 */
import { Box, CssBaseline, Typography } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import { render, screen, within } from '@testing-library/react';
import { type ReactElement } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { ThemeProvider as StyledThemeProvider } from 'styled-components';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MobileLayout } from '@/layouts/MobileLayout';
import { MobileAccount } from '@/pages/mobile/MobileAccount';
import { MobileHome } from '@/pages/mobile/MobileHome';
import { MobilePortfolio } from '@/pages/mobile/MobilePortfolio';
import { MobileReceiveSheet } from '@/pages/mobile/MobileReceiveSheet';
import { darkTheme, lightTheme } from '@/styles/themes';
import { cssColour } from '@/test-utils/cssVars';
import { paintedBackground } from '@/test-utils/paintedBackground';
import { rgbToHex } from '@/test-utils/rgbToHex';
import { createAppTheme } from '@/theme/mui-theme';
import { contrastRatio, type ThemeMode, tokens } from '@/theme/tokens/semantic';
import { BottomSheet, SheetStep } from '../BottomSheet';
import { MobileMenuDrawer } from '../MobileMenuDrawer';
import { MobileCard } from '../primitives';

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    logout: vi.fn(),
    user: { address: '3PQ8bp1aoqHQo3icNqFv6VM36Vcjbo7pQE5', name: 'Trader' },
  }),
}));

vi.mock('@/hooks/useClipboard', () => ({
  useClipboard: () => ({ copyToClipboard: vi.fn(), isCopied: false }),
}));

// The screens are presentational; the data hook is exercised by its own tests.
vi.mock('@/pages/mobile/useMobileWallet', () => ({
  useMobileWallet: () => ({
    allocations: [
      { assetId: 'DCC', name: 'DecentralChain', percent: 70 },
      { assetId: 'A1', name: 'Asset One', percent: 30 },
    ],
    assets: [
      { amount: 12.5, assetId: 'DCC', decimals: 8, isBaseAsset: true, name: 'DecentralChain' },
      { amount: 4, assetId: 'A1', decimals: 2, isBaseAsset: false, name: 'Asset One' },
    ],
    availableBalance: 12.5,
    baseBalance: 20,
    error: null,
    isLoading: false,
    leased: 7.5,
    totalBalance: 20,
  }),
}));

// Pulls the websocket/notification stack into the graph; nothing it renders is
// part of the mobile shell's paint.
vi.mock('@/components/notifications/TransactionNotificationsMonitor', () => ({
  TransactionNotificationsMonitor: () => null,
}));

vi.mock('qrcode.react', () => ({ QRCodeSVG: () => <svg aria-label="qr" /> }));

/** A screen `MobileLayout` routes to that paints nothing of its own. */
const CHILD_ROUTE_TEXT = 'A screen that paints no canvas of its own';

/**
 * Mounts `ui` the way the app does: a router, both theme providers (the kit is
 * styled-components, the screens are MUI), `CssBaseline` — which sets
 * `body { color: text.primary; background: surface.base }`, so every element
 * with no colour of its own inherits a mode-aware ink — and `data-theme` on
 * `<html>`, which `ThemeContext` sets and the kit's `[data-theme='dark'] &`
 * rules (the sheet's lifted cells, the card hairline) key off.
 */
function renderIn(mode: ThemeMode, ui: ReactElement) {
  document.documentElement.setAttribute('data-theme', mode);
  return render(
    <MemoryRouter initialEntries={['/desktop/wallet']}>
      <StyledThemeProvider theme={mode === 'dark' ? darkTheme : lightTheme}>
        <ThemeProvider theme={createAppTheme(mode)}>
          <CssBaseline />
          {ui}
        </ThemeProvider>
      </StyledThemeProvider>
    </MemoryRouter>,
  );
}

afterEach(() => {
  document.documentElement.removeAttribute('data-theme');
});

/** The production phone shell with a child route that sets no colour. */
function ShellWithChildRoute() {
  return (
    <Routes>
      <Route element={<MobileLayout />}>
        <Route path="*" element={<Typography>{CHILD_ROUTE_TEXT}</Typography>} />
      </Route>
    </Routes>
  );
}

// ---------------------------------------------------------------------------
// Resolving what jsdom leaves unresolved
// ---------------------------------------------------------------------------

const TRANSPARENT = /^(|none|transparent|rgba\(\s*0,\s*0,\s*0,\s*0\s*\))$/;
const IMAGE = /gradient\(|url\(/;

/**
 * `value` with every custom property that `el` itself carries (declared on it
 * or inherited from an ancestor, e.g. `Sheet`'s `--grouped-cell`) substituted.
 * Names only `index.css` defines are left for `cssColour` to resolve.
 */
function withScopedVars(value: string, el: Element): string {
  const style = getComputedStyle(el);
  let out = value;
  for (let depth = 0; depth < 10; depth++) {
    const next = out.replace(
      /var\(\s*(--[\w-]+)\s*(?:,[^()]*(?:\([^()]*\)[^()]*)*)?\)/g,
      (whole, name: string) => style.getPropertyValue(name).trim() || whole,
    );
    if (next === out) break;
    out = next;
  }
  return out;
}

/** `el`'s declared `var(...)` background, or `null` when it has none. */
function varBackground(el: HTMLElement): string | null {
  const style = getComputedStyle(el);
  const longhand = style.backgroundColor;
  if (longhand.includes('var(')) return longhand;
  // jsdom keeps a `background: var(...)` shorthand verbatim and leaves the
  // longhand transparent; the browser would paint it.
  const shorthand = style.getPropertyValue('background').trim();
  if (TRANSPARENT.test(longhand) && shorthand.includes('var(')) return shorthand;
  return null;
}

/**
 * Writes each `var(...)` background under `document.body` back as the colour
 * the browser would compute for `mode`, so `paintedBackground` sees every
 * layer. Image layers are left alone (and recorded) for `fillOf` to report.
 * Idempotent: a materialised element no longer declares a variable.
 */
const imageLayers = new WeakMap<Element, string>();
function materialise(mode: ThemeMode): void {
  for (const el of [document.body, ...document.body.querySelectorAll<HTMLElement>('*')]) {
    const declared = varBackground(el);
    if (declared === null) continue;
    const resolved = cssColour(withScopedVars(declared, el), mode);
    if (IMAGE.test(resolved)) {
      imageLayers.set(el, resolved);
      continue;
    }
    if (TRANSPARENT.test(resolved)) {
      el.style.backgroundColor = 'transparent';
      continue;
    }
    if (!/^rgba?\(/.test(resolved)) {
      throw new Error(`<${el.tagName.toLowerCase()}> paints ${declared} -> ${resolved}`);
    }
    el.style.backgroundColor = resolved;
  }
}

function isOpaque(colour: string): boolean {
  if (colour.startsWith('rgb(')) return true;
  const alpha = colour.match(/^rgba\((?:[^,]+,){3}\s*([\d.]+)\s*\)$/)?.[1];
  return alpha !== undefined && Number(alpha) >= 1;
}

/**
 * What is painted behind `el` in `mode`: the composited colour of every layer
 * down to the first opaque one — or, if a gradient/image is met on the way,
 * that image's resolved value, so the sweep can still compare it across modes
 * while the ratio helpers refuse to guess a colour for it.
 */
function fillOf(el: HTMLElement, mode: ThemeMode): string {
  materialise(mode);
  for (let node: HTMLElement | null = el; node; node = node.parentElement) {
    const style = getComputedStyle(node);
    const image =
      imageLayers.get(node) ??
      (style.backgroundImage && style.backgroundImage !== 'none' ? style.backgroundImage : null);
    if (image) return `image(${image})`;
    if (isOpaque(style.backgroundColor)) break;
  }
  return paintedBackground(el, mode);
}

/** `el`'s text colour as the browser would compute it for `mode`. */
function inkOf(el: HTMLElement, mode: ThemeMode): string {
  return cssColour(withScopedVars(getComputedStyle(el).color, el), mode);
}

/** A stable, human-readable handle for an element, for failure messages. */
function describeEl(el: HTMLElement): string {
  const text = (el.textContent ?? '').trim().replace(/\s+/g, ' ').slice(0, 40);
  return `<${el.tagName.toLowerCase()}> "${text}"`;
}

/** Ratio of `el`'s ink against the fill it is actually read on, in `mode`. */
function ratioAt(el: HTMLElement, mode: ThemeMode): number {
  const fill = fillOf(el, mode);
  if (fill.startsWith('image(')) throw new Error(`${describeEl(el)} sits on ${fill}`);
  const ink = inkOf(el, mode);
  // `rgbToHex` drops alpha, which would overstate a translucent ink.
  if (!isOpaque(ink)) throw new Error(`${describeEl(el)} has a translucent ink ${ink}`);
  return contrastRatio(rgbToHex(ink), rgbToHex(fill));
}

// ---------------------------------------------------------------------------
// The sweep: ink and fill move together
// ---------------------------------------------------------------------------

/** Ink plus the fill it is actually read against. */
interface Paint {
  ink: string;
  fill: string;
}

/**
 * Everything that renders ink of its own, in document order.
 *
 * Two kinds qualify. The obvious one is an element with a non-empty text child
 * (excluding `<style>`/`<script>`: `AnimatedNumber`'s NumberFlow ships its own
 * stylesheet inline). The other is a form control: what the user types into
 * `<input>` is painted in that element's `color`, but it is a *value*, not a
 * text node, so a text-only filter walks straight past it. `MobilePortfolio`'s
 * asset search (`SearchField`, a `--surface-fill` well) is that case.
 */
function inkBearingElements(root: ParentNode): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>('*')).filter((el) => {
    if (el.closest('[aria-hidden="true"]')) return false;
    if (el.matches('style, script, template')) return false;
    if (el.matches('input, textarea, select')) return true;
    return Array.from(el.childNodes).some(
      (child) => child.nodeType === Node.TEXT_NODE && (child.textContent ?? '').trim() !== '',
    );
  });
}

/**
 * Renders `surface` in both modes and returns every element whose ink and fill
 * disagree about whether the theme mode moved.
 *
 * `document.body` is the render root rather than the container returned by
 * `render`, because `Sheet` (the receive sheet and the menu) portals its panel
 * outside it — measuring only the container would silently skip both.
 */
function modeInvarianceViolations(surface: () => ReactElement): string[] {
  const snapshot = (mode: ThemeMode) => {
    const { unmount } = renderIn(mode, surface());
    const els = inkBearingElements(document.body);
    const paints = els.map((el): Paint => ({ fill: fillOf(el, mode), ink: inkOf(el, mode) }));
    const labels = els.map(describeEl);
    unmount();
    return { labels, paints };
  };

  const light = snapshot('light');
  const dark = snapshot('dark');

  expect(dark.labels).toEqual(light.labels);
  expect(light.labels.length).toBeGreaterThan(0);

  const violations: string[] = [];
  light.paints.forEach((lightPaint, i) => {
    const darkPaint = dark.paints[i] as Paint;
    const inkMoved = lightPaint.ink !== darkPaint.ink;
    const fillMoved = lightPaint.fill !== darkPaint.fill;
    if (inkMoved === fillMoved) return;
    violations.push(
      `${light.labels[i]}\n` +
        `      ink  ${inkMoved ? 'MOVES' : 'fixed'}: ${lightPaint.ink} -> ${darkPaint.ink}\n` +
        `      fill ${fillMoved ? 'MOVES' : 'fixed'}: ${lightPaint.fill} -> ${darkPaint.fill}`,
    );
  });
  return violations;
}

const SURFACES: [name: string, surface: () => ReactElement][] = [
  ['MobileLayout (the production phone shell + tab bar)', () => <ShellWithChildRoute />],
  ['MobileHome', () => <MobileHome />],
  ['MobilePortfolio', () => <MobilePortfolio />],
  ['MobileAccount', () => <MobileAccount />],
  ['MobileReceiveSheet (BottomSheet)', () => <MobileReceiveSheet open onClose={vi.fn()} />],
  ['MobileMenuDrawer', () => <MobileMenuDrawer open onClose={vi.fn()} />],
  /*
   * `SheetStep` is the one member of the mobile component library with no
   * caller today, so no rendered screen covers it — and it held the defect in
   * its purest form (`color: 'primary.main'` on the sheet's then-fixed
   * `#ffffff`, 6.04:1 light / 3.24:1 dark). Covered here rather than left for
   * whoever revives it to rediscover.
   */
  [
    'BottomSheet/SheetStep',
    () => (
      <BottomSheet open onClose={vi.fn()}>
        <SheetStep index={1} title="Copy your address" description="Share it to receive funds." />
      </BottomSheet>
    ),
  ],
];

describe.each(SURFACES)('%s', (_name, surface) => {
  it('never reads a mode-aware ink against a mode-invariant fill, or the reverse', () => {
    const violations = modeInvarianceViolations(surface);
    expect(violations, `\n  ${violations.join('\n  ')}\n`).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// The named sites, with numbers
// ---------------------------------------------------------------------------

describe.each(['light', 'dark'] as const)('the named mobile sites (%s mode)', (mode) => {
  /*
   * `MobileCard` on its own, on a surface that DOES follow the toggle.
   *
   * No screen renders the card any more (the redesign moved them to grouped
   * lists), but it is still exported from the primitives barrel and it carries
   * its own fill (`--surface-canvas`) and ink (`--text-primary`). This is the
   * case that isolates the card's own contract: content with no colour of its
   * own dropped into it — inheriting MUI's `text.primary` unless the card pins
   * an ink — must clear AA on the card, whatever is underneath.
   */
  it('MobileCard: unstyled content inside it clears AA even on a mode-aware surface', () => {
    renderIn(
      mode,
      <Box sx={{ bgcolor: tokens(mode).surface.base }}>
        <MobileCard>
          <Typography>1,234.5678 DCC</Typography>
        </MobileCard>
      </Box>,
    );
    expect(ratioAt(screen.getByText('1,234.5678 DCC'), mode)).toBeGreaterThanOrEqual(4.5);
  });

  /*
   * The hero now sets the figure and its unit apart — the number in the primary
   * ink, "DCC" beside it in the secondary — straight on the page ground rather
   * than on a card, so both halves are measured against the ground.
   */
  it('MobileHome: the available-balance figure, its unit and the section heading clear AA', () => {
    renderIn(mode, <MobileHome />);
    const unit = screen.getByText('DCC');
    const figure = within(unit.parentElement as HTMLElement).getByText('12.5');
    expect(ratioAt(figure, mode)).toBeGreaterThanOrEqual(4.5);
    expect(ratioAt(unit, mode)).toBeGreaterThanOrEqual(4.5);
    expect(
      ratioAt(screen.getByRole('heading', { name: 'Your assets' }), mode),
    ).toBeGreaterThanOrEqual(4.5);
  });

  it('MobilePortfolio: the balance figure, its unit and the asset search field clear AA', () => {
    renderIn(mode, <MobilePortfolio />);
    const unit = screen.getByText('DCC');
    const figure = within(unit.parentElement as HTMLElement).getByText('12.5');
    expect(ratioAt(figure, mode)).toBeGreaterThanOrEqual(4.5);
    expect(ratioAt(unit, mode)).toBeGreaterThanOrEqual(4.5);
    // Typed text, on the translucent `--surface-fill` well composited over the ground.
    expect(
      ratioAt(screen.getByRole('searchbox', { name: 'Search your assets' }), mode),
    ).toBeGreaterThanOrEqual(4.5);
  });

  /* The identity row: a grouped-list cell (`--grouped-cell` → `--surface-canvas`). */
  it("MobileAccount: the wallet's own name clears AA", () => {
    renderIn(mode, <MobileAccount />);
    expect(ratioAt(screen.getByText('Trader'), mode)).toBeGreaterThanOrEqual(4.5);
  });

  /*
   * The address sits in a `--surface-fill` well on the sheet panel: the one
   * string on the mobile shell where getting the ink wrong costs money, not
   * just legibility.
   */
  it('MobileReceiveSheet: the wallet address and the sheet heading clear AA', () => {
    renderIn(mode, <MobileReceiveSheet open onClose={vi.fn()} />);
    expect(
      ratioAt(screen.getByText('3PQ8bp1aoqHQo3icNqFv6VM36Vcjbo7pQE5'), mode),
    ).toBeGreaterThanOrEqual(4.5);
    expect(ratioAt(screen.getByRole('heading', { name: 'Receive' }), mode)).toBeGreaterThanOrEqual(
      4.5,
    );
  });

  /*
   * The menu is a grouped sheet: in dark mode `Sheet` lifts its list cells to
   * `--surface-frosted` through the scoped `--grouped-cell`, so this is the
   * site that proves the scoped variable is honoured, not skipped.
   */
  it('MobileMenuDrawer: the account name clears AA on the lifted cell', () => {
    renderIn(mode, <MobileMenuDrawer open onClose={vi.fn()} />);
    expect(ratioAt(screen.getByText('Trader'), mode)).toBeGreaterThanOrEqual(4.5);
  });

  /*
   * `MobileLayout` paints its canvas from the MUI theme (`surface.base`) and
   * pins no ink, so a routed screen that paints nothing inherits `CssBaseline`'s
   * `text.primary`. The two must agree in both modes.
   */
  it('MobileLayout: content the shell does not cover clears AA on the shell canvas', () => {
    renderIn(mode, <ShellWithChildRoute />);
    expect(ratioAt(screen.getByText(CHILD_ROUTE_TEXT), mode)).toBeGreaterThanOrEqual(4.5);
  });

  it('BottomSheet/SheetStep: the step numeral clears AA on its lavender plate', () => {
    renderIn(
      mode,
      <BottomSheet open onClose={vi.fn()}>
        <SheetStep index={1} title="Copy your address" description="Share it to receive funds." />
      </BottomSheet>,
    );
    expect(ratioAt(screen.getByText('1'), mode)).toBeGreaterThanOrEqual(4.5);
  });

  /*
   * The chrome that replaced the dark gradient header band. There is no fixed
   * band with fixed white ink any more: `MobileAppBar` sets the screen's large
   * title and its subtitle on the page ground, and the compact bar above it
   * only gains the chrome material once the title scrolls beneath it (its
   * inline title is an `aria-hidden` duplicate).
   */
  it('MobileAppBar: the large title and its subtitle clear AA on the page ground', () => {
    renderIn(mode, <MobileHome />);
    expect(
      ratioAt(screen.getByRole('heading', { level: 1, name: 'Wallet' }), mode),
    ).toBeGreaterThanOrEqual(4.5);
    expect(ratioAt(screen.getByText(/, Trader$/), mode)).toBeGreaterThanOrEqual(4.5);
  });

  /*
   * The tab bar is the translucent `--material-chrome` over whatever scrolls
   * beneath it; this measures it at rest, composited over the shell canvas.
   * The active tab takes the accent ink, the rest the secondary ink — both
   * are 11px labels, so both owe 4.5:1.
   */
  it('MobileTabBar: every tab label, active and inactive, clears AA on the chrome material', () => {
    renderIn(mode, <ShellWithChildRoute />);
    const bar = screen.getByRole('navigation', { name: 'Primary' });
    expect(within(bar).getByRole('link', { name: 'Portfolio' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    for (const label of ['Portfolio', 'Swap', 'Trade', 'Earn', 'Profile']) {
      expect(ratioAt(within(bar).getByText(label), mode), label).toBeGreaterThanOrEqual(4.5);
    }
  });
});

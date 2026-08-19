/**
 * The live mobile shell — mode-aware ink must never land on a mode-invariant fill.
 *
 * WHY THE SWEEP HERE COMPARES MODES RATHER THAN MEASURING RATIOS
 * -------------------------------------------------------------
 * `styles/mobileTokens.ts` has no mode dimension: every `mobileSurface.*` and
 * `mobileText.*` value is one fixed literal in both modes. It *reads* like a
 * token import, so the token lint passes it, but it *behaves* like a hardcoded
 * hex. Put MUI's mode-aware `text.primary` (which `CssBaseline` sets on
 * `<body>`, so it is inherited everywhere) on top of one of those fills and
 * dark mode gives you near-white ink on a near-white plate at ~1:1.
 *
 * Every previous sweep for this looked for the *syntax* — `contrastText`,
 * `getContrastText`, `grey.NNN`, a raw hex — and every one of them was
 * incomplete, because the failure has no syntax. It is a *behaviour*: an
 * element whose ink moves when the theme mode moves, sitting on a fill that
 * does not (or the mirror image — pinned ink on a fill that does move).
 *
 * So this file asserts the behaviour directly. Each live mobile surface is
 * rendered twice, once per mode, and every text-bearing element is paired
 * across the two renders by document order. For each pair it records the
 * computed ink and the *effective* fill (the nearest ancestor-or-self that
 * actually paints — a colour or a gradient), then asserts the one invariant
 * that has to hold whatever the surface is made of:
 *
 *     the ink changes between modes  ⟺  the fill changes between modes
 *
 * Both halves matter. Ink moving over a frozen fill is the defect that keeps
 * coming back. A frozen ink over a fill that moves is the same defect facing
 * the other way — it is what `MobileButton`'s `outline` variant was before its
 * fix. Anything else is self-consistent: a fixed dark band with fixed white ink
 * (`MobileAppBar`) passes, and a fully mode-aware surface passes.
 *
 * That sweep deliberately does NOT assert a contrast ratio. Several mobile
 * pairings are mode-*consistently* weak — `mobileText.muted` (`#9AA0AA`) on
 * `mobileSurface.card` is 2.63:1 in both modes — and that is a palette question
 * for the deferred mode-dimension work, not this defect class. A sweep that
 * mixed the two would fail for reasons it is not testing and hide the ones it
 * is.
 *
 * The second describe block does assert ratios, but only at the named sites
 * this round repaired, so each one has a number attached to it in both modes
 * rather than only a "these two agree" verdict.
 *
 * WHAT COUNTS AS LIVE
 * -------------------
 * Every surface below is production, selected by VIEWPORT, not by
 * `import.meta.env.DEV`:
 *   - `layouts/ResponsiveLayout.tsx:20` renders `<MobileLayout/>` whenever
 *     `useMediaQuery(theme.breakpoints.down('md'))` is true, i.e. on any phone.
 *   - `routes/walletRoutes.tsx:51,55` and `routes/settingsRoutes.tsx:25` route
 *     `MobileHome`, `MobilePortfolio` and `MobileAccount` through
 *     `ResponsiveScreen`.
 *   - `MobileHome` renders `MobileReceiveSheet`, which renders `BottomSheet`.
 *   - `MobileLayout` renders `MobileTabBar`, which renders `MobileMenuDrawer`.
 * The only DEV-gated mobile screens are `MobileWelcome` and `MobileMarkets`
 * (`routes/index.tsx:256`), and they are not covered here.
 */
import { Box, CssBaseline, Typography } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import { render, screen } from '@testing-library/react';
import { type ReactElement } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { MobileLayout } from '@/layouts/MobileLayout';
import { MobileAccount } from '@/pages/mobile/MobileAccount';
import { MobileHome } from '@/pages/mobile/MobileHome';
import { MobilePortfolio } from '@/pages/mobile/MobilePortfolio';
import { MobileReceiveSheet } from '@/pages/mobile/MobileReceiveSheet';
import { rgbToHex } from '@/test-utils/rgbToHex';
import { createAppTheme } from '@/theme/mui-theme';
import { contrastRatio, type ThemeMode, tokens } from '@/theme/tokens/semantic';
import { BottomSheet, SheetStep } from '../BottomSheet';
import { MobileMenuDrawer } from '../MobileMenuDrawer';
import { MobileCard } from '../primitives';

vi.mock('react-router', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react-router')>()),
  NavLink: ({ children, ...rest }: { children: React.ReactNode }) => <a {...rest}>{children}</a>,
  Outlet: () => <Typography data-testid="outlet-content">child route</Typography>,
  useLocation: () => ({ pathname: '/desktop/wallet' }),
  useNavigate: () => vi.fn(),
}));

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
  }),
}));

// Pulls the websocket/notification stack into the graph; nothing it renders is
// part of the mobile shell's paint.
vi.mock('@/components/notifications/TransactionNotificationsMonitor', () => ({
  TransactionNotificationsMonitor: () => null,
}));

vi.mock('qrcode.react', () => ({ QRCodeSVG: () => <svg aria-label="qr" /> }));

/** Ink plus the fill it is actually read against. */
interface Paint {
  ink: string;
  fill: string;
}

/**
 * The nearest ancestor-or-self that actually paints something behind `el`.
 *
 * A gradient is a fill too — `MobileAppBar`'s band is one — and
 * `getComputedStyle(...).backgroundColor` reports `rgba(0, 0, 0, 0)` for it, so
 * checking only the colour would walk straight past the band and measure the
 * page canvas instead. The walk therefore stops on either. It runs all the way
 * up through `<body>`, whose `CssBaseline` fill is mode-aware and correct to
 * measure against — the guard needed elsewhere (`themeToggleAcceptance`) is
 * about proving a *page* painted something, which is not what this file asks.
 */
function paintOf(el: Element): Paint {
  const ink = getComputedStyle(el).color;
  let node: Element | null = el;
  while (node) {
    const style = getComputedStyle(node);
    if (style.backgroundImage && style.backgroundImage !== 'none') {
      return { fill: `image(${style.backgroundImage})`, ink };
    }
    const bg = style.backgroundColor;
    if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') return { fill: bg, ink };
    node = node.parentElement;
  }
  return { fill: 'none', ink };
}

/**
 * Everything that renders ink of its own, in document order.
 *
 * Two kinds qualify. The obvious one is an element with a non-empty text child.
 * The other is a form control: what the user types into `<input>` is painted in
 * that element's `color`, but it is a *value*, not a text node, so a text-only
 * filter walks straight past it — and MUI's `InputBase` sets
 * `color: text.primary` explicitly, which is exactly the mode-aware half of
 * this defect. `MobilePortfolio`'s asset search is that case, on a fixed
 * `mobileSurface.card` fill.
 */
function inkBearingElements(root: ParentNode): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>('*')).filter((el) => {
    if (el.closest('[aria-hidden="true"]')) return false;
    if (el.matches('input, textarea, select')) return true;
    return Array.from(el.childNodes).some(
      (child) => child.nodeType === Node.TEXT_NODE && (child.textContent ?? '').trim() !== '',
    );
  });
}

/** A stable, human-readable handle for an element, for failure messages. */
function describeEl(el: HTMLElement): string {
  const text = (el.textContent ?? '').trim().replace(/\s+/g, ' ').slice(0, 40);
  return `<${el.tagName.toLowerCase()}> "${text}"`;
}

/**
 * Renders `surface` in both modes and returns every element whose ink and fill
 * disagree about whether the theme mode moved.
 *
 * `document.body` is the render root rather than the container returned by
 * `render`, because `Drawer` (the bottom sheet and the menu) portals its paper
 * outside it — measuring only the container would silently skip both.
 */
function modeInvarianceViolations(surface: () => ReactElement): string[] {
  const snapshot = (mode: ThemeMode) => {
    const { unmount } = render(
      <ThemeProvider theme={createAppTheme(mode)}>
        {/*
         * The real app mounts this next to the provider (`ThemeContext.tsx`),
         * and it is precisely what makes the defect reachable: it sets
         * `body { color: text.primary }`, so every element with no `color` of
         * its own inherits a mode-aware ink no matter how deep it sits.
         */}
        <CssBaseline />
        {surface()}
      </ThemeProvider>,
    );
    const els = inkBearingElements(document.body);
    const paints = els.map(paintOf);
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
  ['MobileLayout (the production phone shell + tab bar)', () => <MobileLayout />],
  ['MobileHome', () => <MobileHome />],
  ['MobilePortfolio', () => <MobilePortfolio />],
  ['MobileAccount', () => <MobileAccount />],
  ['MobileReceiveSheet (BottomSheet)', () => <MobileReceiveSheet open onClose={vi.fn()} />],
  ['MobileMenuDrawer', () => <MobileMenuDrawer open onClose={vi.fn()} />],
  /*
   * `SheetStep` is the one member of the mobile component library with no
   * caller today, so no rendered screen covers it — and it held the defect in
   * its purest form (`color: 'primary.main'` on the sheet's fixed `#ffffff`,
   * 6.04:1 light / 3.24:1 dark). Covered here rather than left for whoever
   * revives it to rediscover.
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
// The repaired sites, with numbers
// ---------------------------------------------------------------------------

/** Ratio of `el`'s ink against the fill it is actually read on. */
function ratioAt(el: Element): number {
  const { fill, ink } = paintOf(el);
  if (fill.startsWith('image('))
    throw new Error(`${describeEl(el as HTMLElement)} sits on ${fill}`);
  return contrastRatio(rgbToHex(ink), rgbToHex(fill));
}

function renderIn(mode: ThemeMode, surface: ReactElement) {
  return render(
    <ThemeProvider theme={createAppTheme(mode)}>
      <CssBaseline />
      {surface}
    </ThemeProvider>,
  );
}

describe.each(['light', 'dark'] as const)('the repaired mobile sites (%s mode)', (mode) => {
  /*
   * `MobileCard` on its own, on a surface that DOES follow the toggle.
   *
   * The three screens that use the card also pin their canvas, so each of those
   * two pins masks the other in a whole-screen render: reverting `primitives`
   * alone left every screen assertion green. That is a coverage artefact, not
   * proof the card is safe — the card is exported from the primitives barrel
   * and its fill is a fixed `#ffffff` wherever it is dropped, including inside
   * `MobilePageShell`, which paints `tokens(mode).surface.base` and pins no ink
   * at all. This is that case, and it is the one that isolates the card's own
   * contract: a fixed fill owes a fixed ink, regardless of what is underneath.
   */
  it('MobileCard: unstyled content inside it clears AA even on a mode-aware surface', () => {
    renderIn(
      mode,
      <Box sx={{ bgcolor: tokens(mode).surface.base }}>
        <MobileCard>
          <Typography data-testid="card-content">1,234.5678 DCC</Typography>
        </MobileCard>
      </Box>,
    );
    expect(ratioAt(screen.getByTestId('card-content'))).toBeGreaterThanOrEqual(4.5);
  });

  it('MobileHome: the available-balance figure and the section heading clear AA', () => {
    renderIn(mode, <MobileHome />);
    expect(ratioAt(screen.getByText('12.5 DCC'))).toBeGreaterThanOrEqual(4.5);
    expect(ratioAt(screen.getByText('Your assets'))).toBeGreaterThanOrEqual(4.5);
  });

  it('MobilePortfolio: the balance figure and the asset search field clear AA', () => {
    renderIn(mode, <MobilePortfolio />);
    expect(ratioAt(screen.getByText('12.5 DCC'))).toBeGreaterThanOrEqual(4.5);
    expect(ratioAt(screen.getByLabelText('Search your assets'))).toBeGreaterThanOrEqual(4.5);
  });

  it("MobileAccount: the wallet's own name clears AA", () => {
    renderIn(mode, <MobileAccount />);
    expect(ratioAt(screen.getByText('Trader'))).toBeGreaterThanOrEqual(4.5);
  });

  it('MobileReceiveSheet: the wallet address and the sheet heading clear AA', () => {
    renderIn(mode, <MobileReceiveSheet open onClose={vi.fn()} />);
    expect(ratioAt(screen.getByText('3PQ8bp1aoqHQo3icNqFv6VM36Vcjbo7pQE5'))).toBeGreaterThanOrEqual(
      4.5,
    );
    expect(ratioAt(screen.getByText('Receive'))).toBeGreaterThanOrEqual(4.5);
  });

  it('MobileMenuDrawer: the account name clears AA', () => {
    renderIn(mode, <MobileMenuDrawer open onClose={vi.fn()} />);
    expect(ratioAt(screen.getByText('Trader'))).toBeGreaterThanOrEqual(4.5);
  });

  it('MobileLayout: content the shell does not cover clears AA on the shell canvas', () => {
    renderIn(mode, <MobileLayout />);
    expect(ratioAt(screen.getByTestId('outlet-content'))).toBeGreaterThanOrEqual(4.5);
  });

  it('BottomSheet/SheetStep: the step numeral clears AA', () => {
    renderIn(
      mode,
      <BottomSheet open onClose={vi.fn()}>
        <SheetStep index={1} title="Copy your address" description="Share it to receive funds." />
      </BottomSheet>,
    );
    expect(ratioAt(screen.getByText('1'))).toBeGreaterThanOrEqual(4.5);
  });
});

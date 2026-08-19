/**
 * Theme toggle — acceptance test
 *
 * The plan's acceptance test, verbatim from the spec: "The dark/light toggle
 * in `ThemeSettings` demonstrably changes every page, including the twelve
 * that currently ignore it." A test that only renders `ThemeSettings` and
 * checks a toggle exists proves nothing about the other twelve screens, so
 * this file proves two separate things and chains them:
 *
 *   1. The control itself: clicking a `ThemeSettings` option, mounted under
 *      the real `ThemeProvider` from `@/contexts/ThemeContext` (the same
 *      provider `App.tsx` mounts), flips the live MUI theme mode a sibling
 *      component reads and persists the choice to `localStorage`. This is
 *      the exact mechanism `main.tsx` wires up — not a stand-in.
 *
 *   2. The twelve pages: each of the twelve screens Task 5 and Task 6 freed
 *      from a hardcoded `landingTheme` wrapper (six auth/marketing, six app)
 *      is rendered TWICE in this file — once under `createAppTheme('light')`,
 *      once under `createAppTheme('dark')` — the exact theme object flipping
 *      the real toggle produces. The two renders' own computed style for the
 *      same DOM role are compared directly with `.not.toBe(...)`, so a page
 *      that silently fell back to a hardcoded literal would make this file
 *      fail, not just some other page's file. Where a page already carries
 *      its own dedicated per-mode contrast suite (all twelve do — see the
 *      "already covered elsewhere" note below each block), this test does
 *      not repeat that file's full assertion list; it adds the one thing
 *      those files do not do explicitly: prove the SAME element's computed
 *      style differs, in one render pass, rather than matching two
 *      independent expectations that happen to differ by construction.
 *
 * Coverage and gaps are stated in full in task-9-report.md. In short: all
 * twelve are rendered here. `LandingPage`, `Dashboard`, `Wallet`, `Dex`,
 * `Swap`, `Bridge` and `CreateToken` render through the real page shell
 * (`PageFrame` for six of them, post task-9). `SignIn`, `SignUp`,
 * `ImportPage`, `ImportLedger` and `ImportAccountPage` render through
 * `AuthScene`/their own desktop layout — those five do not use `PageFrame`
 * (they render outside the authenticated app shell; see task-9-report.md for
 * why). Every mock below mirrors — and in the `react-router` and
 * `react-i18next` cases, generalises — the mocks each page's own existing
 * contrast-test file already uses, so this file exercises the same render
 * path those files independently proved safe, not a new one.
 */
import { CssBaseline } from '@mui/material';
import { ThemeProvider as MuiThemeProvider, useTheme as useMuiTheme } from '@mui/material/styles';
import { type RenderResult, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { type ReactElement } from 'react';
import { ThemeProvider as StyledThemeProvider } from 'styled-components';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ThemeProvider as AppThemeProvider } from '@/contexts/ThemeContext';
import { ThemeSettings } from '@/features/settings/ThemeSettings';
import { Bridge } from '@/pages/Bridge';
import { CreateToken } from '@/pages/CreateToken';
import { Dashboard } from '@/pages/Dashboard';
import { Dex } from '@/pages/Dex';
import { ImportAccountPage } from '@/pages/ImportAccountPage';
import { ImportLedger } from '@/pages/ImportLedger';
import { ImportPage } from '@/pages/ImportPage';
import LandingPage from '@/pages/LandingPage';
import { SignIn } from '@/pages/SignIn';
import { SignUp } from '@/pages/SignUp';
import { Swap } from '@/pages/Swap';
import { Wallet } from '@/pages/Wallet';
import { darkTheme, lightTheme } from '@/styles/themes';
import { rgbToHex } from '@/test-utils/rgbToHex';
import { createAppTheme } from '@/theme/mui-theme';
import { type ThemeMode, tokens } from '@/theme/tokens/semantic';

// ---------------------------------------------------------------------------
// Shared mocks. Each one mirrors an existing page's own contrast-test file
// (cited inline); merged into one file because vi.mock is file-scoped.
// ---------------------------------------------------------------------------

// SignIn.test.tsx / SignUp.canvasContrast.test.tsx / ImportPage.contrast.test.tsx /
// ImportAccountPage.contrast.test.tsx each replace `@/config` outright — safe
// there because none of those four import `@/services/transactionService`
// (which eagerly builds an API client from `config.apiUrl`/`config.nodeUrl`
// at module load). `CreateToken` does, and this file mounts both in one
// module graph, so the real config is spread and only `ledgerEnabled`
// overridden, rather than replacing the module outright.
vi.mock('@/config', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/config')>();
  return { ...actual, config: { ...actual.config, ledgerEnabled: false } };
});

// react-router: every page's own test either stubs `useNavigate` alone or (Wallet)
// stubs `Outlet`. Spreading the real module and overriding only what is needed
// keeps every other export (Link, useLocation, ...) real, so one factory serves
// all twelve without any page losing an export another one relies on.
const navigate = vi.fn();
vi.mock('react-router', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react-router')>()),
  Outlet: () => <div data-testid="outlet-content">child route</div>,
  useNavigate: () => navigate,
  useSearchParams: () => [new URLSearchParams(), vi.fn()],
}));

// LandingPage.test.tsx wants `t(key, {returnObjects:true})` to yield `[]`
// (MarqueeBand); Dex.contrast.test.tsx wants `i18n.language`. One factory
// satisfies both. `initReactI18next` must survive the mock — `src/i18n/index.ts`
// (pulled in transitively by `@/hooks/useTranslation`, which some of the app
// pages use instead of react-i18next's own hook) imports it eagerly.
vi.mock('react-i18next', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react-i18next')>()),
  useTranslation: () => ({
    i18n: { language: 'en' },
    t: (key: string, opts?: { returnObjects?: boolean }) => (opts?.returnObjects ? [] : key),
  }),
}));

// Bridge.contrast.test.tsx's mutable-user pattern, generalised: every one of
// the twelve that reads `useAuth()` gets every field any of them destructures;
// `authUser` is flipped per page below, exactly like Bridge's own `mockUser`.
let authUser: { address: string; name: string } | null = null;
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    addAccount: vi.fn(),
    create: vi.fn().mockResolvedValue(undefined),
    getActiveState: () => '/desktop/wallet',
    isAuthenticated: false,
    login: vi.fn(),
    user: authUser,
  }),
}));

// Bridge.contrast.test.tsx / Dashboard.contrast.test.tsx
vi.mock('@/contexts/ConfigContext', () => ({
  useConfig: () => ({ assets: {}, gateway: {} }),
}));

// Dashboard.contrast.test.tsx / CreateToken.contrast.test.tsx / Bridge.contrast.test.tsx
vi.mock('@/hooks/useBalanceWatcher', () => ({
  useBalanceWatcher: () => ({ balances: { assets: {}, available: 0 }, isLoading: false }),
}));
// Dashboard.contrast.test.tsx
vi.mock('@/hooks/useAliases', () => ({ useAliases: () => ({ aliases: [] }) }));
vi.mock('@/api/services/addressService', () => ({
  useAddressTransactions: () => ({ data: undefined }),
}));
vi.mock('@/api/services/assetsService', () => ({
  useMultipleAssetDetails: () => ({ data: undefined }),
}));
vi.mock('@/components/modals/CreateAliasModal', () => ({ CreateAliasModal: () => null }));
// CreateToken.contrast.test.tsx
vi.mock('@/hooks/useTransactionSigning', () => ({
  useTransactionSigning: () => ({ signIssue: vi.fn() }),
}));
// Bridge.contrast.test.tsx
vi.mock('@/hooks/useGatewayTransaction', () => ({
  useGatewayTransaction: () => ({ withdraw: vi.fn() }),
}));
// SignUp.canvasContrast.test.tsx
vi.mock('@/hooks/useClipboard', () => ({
  useClipboard: () => ({ copyToClipboard: vi.fn(), isCopied: false }),
}));
// Several
vi.mock('@/lib/logger', () => ({
  logger: { debug: vi.fn(), error: vi.fn(), warn: vi.fn() },
}));
// Dex.contrast.test.tsx — the heavy feature panels are stubbed there too, so
// this isolates the page chrome exactly as that file already does.
vi.mock('@/features/dex/TradingPairSelector', () => ({
  TradingPairSelector: () => <div>pair-selector</div>,
}));
vi.mock('@/features/dex/OrderBook', () => ({ OrderBook: () => <div>order-book</div> }));
vi.mock('@/features/dex/BuyOrderForm', () => ({ BuyOrderForm: () => <div>buy-form</div> }));
vi.mock('@/features/dex/SellOrderForm', () => ({ SellOrderForm: () => <div>sell-form</div> }));
vi.mock('@/features/dex/TradeHistory', () => ({ TradeHistory: () => <div>trade-history</div> }));
vi.mock('@/features/dex/TradingViewChart', () => ({ TradingViewChart: () => <div>chart</div> }));
vi.mock('@/features/dex/UserOrders', () => ({ UserOrders: () => <div>user-orders</div> }));
vi.mock('@/api/services/matcherService', () => ({
  useMarketStats24h: () => ({ data: undefined }),
  useOrderBook: () => ({ data: undefined }),
}));
// ImportLedger.contrast.test.tsx — the actual hardware-wallet form is a
// separate component under a different path; this page's own chrome is what
// is under test.
vi.mock('@/features/auth/ImportLedger', () => ({
  ImportLedger: () => <div data-testid="ledger-form-stub">form</div>,
}));

/**
 * Nearest ancestor (inclusive) with an explicit, non-transparent background —
 * **within the page under test**.
 *
 * The walk stops at `<body>` and throws. That guard is the point: `<CssBaseline/>`
 * paints `<body>` with `background.default`, which *does* differ between modes,
 * so an unguarded walk that fell out of the page landed on the body and
 * reported a perfect pass for a page that painted nothing at all. `Bridge` did
 * exactly that — verified by replacing the whole page with
 * `<div>Cross-Chain Bridge</div>` and watching the assertion stay green.
 * Anything this returns is now something the page painted itself.
 */
function nearestBackground(el: HTMLElement): string {
  let node: HTMLElement | null = el;
  while (node && node !== document.body) {
    const bg = getComputedStyle(node).backgroundColor;
    if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') return bg;
    node = node.parentElement;
  }
  throw new Error(
    'Walked out of the page without finding a background it painted itself. ' +
      'Reaching <body> means CssBaseline is being measured, not the page — ' +
      'pick an element the page actually paints.',
  );
}

/**
 * What `el`'s **own** emotion rule declares for `property` — not what it
 * inherited.
 *
 * `getComputedStyle(el).color` is the wrong instrument for an ink assertion:
 * `color` is an inherited property, and `<CssBaseline/>` sets
 * `body { color: text.primary }`, which differs per mode all by itself. So a
 * page that painted *nothing* still reported the right ink in each mode. The
 * `SignIn` and `SignUp` cases below did exactly that — verified by replacing
 * both pages with `<div data-testid="auth-canvas">nothing</div>` and watching
 * the file stay at `Tests 13 passed (13)`.
 *
 * A declaration cannot be inherited. Emotion emits one rule per element, keyed
 * on the `css-<hash>` class it puts on that element, so reading the value out
 * of that rule proves the page's own style object set it. Matching the hash
 * class exactly (`.css-xxxx`, never a substring of a compound selector) is the
 * same discipline `Leasing.contrast.test.tsx` arrived at: emotion never removes
 * an injected `<style>` tag, so by the second render in a file the sheet holds
 * both modes' rules, and anything looser than the content-derived hash can
 * silently match the previous render's.
 *
 * Throwing when there is no hash class is the guard that makes this bite: an
 * element the page did not style has no emotion class at all.
 */
function declared(el: HTMLElement, property: string): string {
  const hashClass = Array.from(el.classList).find((c) => c.startsWith('css-'));
  if (!hashClass) {
    throw new Error(
      `<${el.tagName.toLowerCase()} class="${el.className}"> carries no emotion class, so it ` +
        `declares no style of its own — reading its ${property} would report an inherited ` +
        'value (CssBaseline paints the body), not something the page painted.',
    );
  }
  for (const sheet of Array.from(document.styleSheets)) {
    for (const rule of Array.from(sheet.cssRules) as CSSStyleRule[]) {
      if (rule.selectorText !== `.${hashClass}`) continue;
      const value = rule.style.getPropertyValue(property);
      if (value) return value.trim();
    }
  }
  throw new Error(`.${hashClass} declares no ${property} of its own`);
}

/** Renders `node` under the real MUI theme for `mode`, optionally also the
 * styled-components theme (only the auth pages read both systems). */
function renderPage(node: ReactElement, mode: ThemeMode, withStyled = false): RenderResult {
  const tree = (
    <MuiThemeProvider theme={createAppTheme(mode)}>
      <CssBaseline />
      {withStyled ? (
        <StyledThemeProvider theme={mode === 'light' ? lightTheme : darkTheme}>
          {node}
        </StyledThemeProvider>
      ) : (
        node
      )}
    </MuiThemeProvider>
  );
  return render(tree);
}

beforeEach(() => {
  authUser = null;
  localStorage.clear();
});

// ---------------------------------------------------------------------------
// Part 1 — the control itself changes the live theme
// ---------------------------------------------------------------------------

function ModeProbe() {
  const { palette } = useMuiTheme();
  return <div data-testid="mode-probe">{palette.mode}</div>;
}

describe('ThemeSettings — the toggle in Settings → Theme', () => {
  it('flips the live app theme mode a sibling reads, and persists the choice', async () => {
    const user = userEvent.setup();
    render(
      <AppThemeProvider>
        <ModeProbe />
        <ThemeSettings />
      </AppThemeProvider>,
    );

    // Default mode, before any interaction.
    expect(screen.getByTestId('mode-probe')).toHaveTextContent('light');

    await user.click(screen.getByRole('button', { name: /dark theme/i }));

    expect(screen.getByTestId('mode-probe')).toHaveTextContent('dark');
    expect(localStorage.getItem('theme')).toBe('dark');

    await user.click(screen.getByRole('button', { name: /light theme/i }));

    expect(screen.getByTestId('mode-probe')).toHaveTextContent('light');
    expect(localStorage.getItem('theme')).toBe('light');
  });
});

// ---------------------------------------------------------------------------
// Part 2 — the twelve pages the toggle used to not reach
// ---------------------------------------------------------------------------

describe('Acceptance — the twelve pages render differently in each mode', () => {
  // Task 5 (auth + marketing)

  it('LandingPage: the canvas colour differs, and matches surface.base in each mode', () => {
    const { unmount } = renderPage(<LandingPage />, 'light');
    const light = rgbToHex(getComputedStyle(screen.getByTestId('landing-canvas')).backgroundColor);
    unmount();
    renderPage(<LandingPage />, 'dark');
    const dark = rgbToHex(getComputedStyle(screen.getByTestId('landing-canvas')).backgroundColor);

    expect(dark).not.toBe(light);
    expect(light).toBe(tokens('light').surface.base);
    expect(dark).toBe(tokens('dark').surface.base);
  });

  /*
   * `AuthScene`'s canvas is a gradient in light mode and a flat fill in dark,
   * so `nearestBackground` cannot guard these two the way it guards the four
   * below it — `getComputedStyle(...).backgroundColor` on a gradient is
   * `rgba(0, 0, 0, 0)` and the walk would leave the page. `declared()` is the
   * equivalent guarantee by a different route: it reads the canvas' own
   * emitted rule, so both halves of what the page paints — the fill and the
   * ink it pins on top of it — are asserted as *declarations*, which an
   * unstyled element cannot have. The previous version measured
   * `getComputedStyle(...).color`, an inherited property, and passed against
   * `<body>`'s `CssBaseline` ink for a page that rendered nothing.
   */
  it('SignIn: the AuthScene canvas declares its own fill and ink, and both differ per mode', () => {
    const canvas = () => screen.getByTestId('auth-canvas');
    const { unmount } = renderPage(<SignIn />, 'light', true);
    const lightInk = rgbToHex(declared(canvas(), 'color'));
    const lightFill = declared(canvas(), 'background');
    unmount();
    renderPage(<SignIn />, 'dark', true);
    const darkInk = rgbToHex(declared(canvas(), 'color'));
    const darkFill = declared(canvas(), 'background');

    expect(darkInk).not.toBe(lightInk);
    expect(lightInk).toBe(tokens('light').text.primary);
    expect(darkInk).toBe(tokens('dark').text.primary);

    // Light is the two-stop wash, dark the flat night ground — see AuthScene.
    expect(darkFill).not.toBe(lightFill);
    expect(lightFill).toContain('linear-gradient');
    expect(rgbToHex(darkFill)).toBe(tokens('dark').surface.base);
  });

  it('SignUp: the AuthScene canvas declares its own fill and ink, and both differ per mode', () => {
    const canvas = () => screen.getByTestId('auth-canvas');
    const { unmount } = renderPage(<SignUp />, 'light', true);
    const lightInk = rgbToHex(declared(canvas(), 'color'));
    const lightFill = declared(canvas(), 'background');
    unmount();
    renderPage(<SignUp />, 'dark', true);
    const darkInk = rgbToHex(declared(canvas(), 'color'));
    const darkFill = declared(canvas(), 'background');

    expect(darkInk).not.toBe(lightInk);
    expect(lightInk).toBe(tokens('light').text.primary);
    expect(darkInk).toBe(tokens('dark').text.primary);

    expect(darkFill).not.toBe(lightFill);
    expect(lightFill).toContain('linear-gradient');
    expect(rgbToHex(darkFill)).toBe(tokens('dark').surface.base);
  });

  it('ImportPage: the page-heading background differs, and matches background.default in each mode', () => {
    const { unmount } = renderPage(<ImportPage />, 'light');
    const light = rgbToHex(nearestBackground(screen.getByText('Import Account')));
    unmount();
    renderPage(<ImportPage />, 'dark');
    const dark = rgbToHex(nearestBackground(screen.getByText('Import Account')));

    expect(dark).not.toBe(light);
    expect(light).toBe(tokens('light').surface.base);
    expect(dark).toBe(tokens('dark').surface.base);
  });

  it('ImportLedger: the headline background differs, and matches background.default in each mode', () => {
    const { unmount } = renderPage(<ImportLedger />, 'light');
    const light = rgbToHex(nearestBackground(screen.getByText('Maximum security with Ledger')));
    unmount();
    renderPage(<ImportLedger />, 'dark');
    const dark = rgbToHex(nearestBackground(screen.getByText('Maximum security with Ledger')));

    expect(dark).not.toBe(light);
    expect(light).toBe(tokens('light').surface.base);
    expect(dark).toBe(tokens('dark').surface.base);
  });

  it('ImportAccountPage: the decorative panel background differs between modes', () => {
    const { unmount } = renderPage(<ImportAccountPage />, 'light', true);
    const light = rgbToHex(
      getComputedStyle(screen.getByTestId('import-account-panel')).backgroundColor,
    );
    unmount();
    renderPage(<ImportAccountPage />, 'dark', true);
    const dark = rgbToHex(
      getComputedStyle(screen.getByTestId('import-account-panel')).backgroundColor,
    );

    expect(dark).not.toBe(light);
    // Pinned white in light (ImportAccountPage.contrast.test.tsx); not white,
    // close to surface.raised, in dark.
    expect(light).toBe('#ffffff');
    expect(dark).not.toBe('#ffffff');
  });

  // Task 6 (app)

  it('Dashboard: the "Quick Actions" card background differs, and matches surface.raised in each mode', () => {
    authUser = { address: '3P123', name: 'Trader' };
    const { unmount } = renderPage(<Dashboard />, 'light');
    const light = rgbToHex(nearestBackground(screen.getByText('Quick Actions')));
    unmount();
    renderPage(<Dashboard />, 'dark');
    const dark = rgbToHex(nearestBackground(screen.getByText('Quick Actions')));

    expect(dark).not.toBe(light);
    expect(light).toBe(tokens('light').surface.raised);
    expect(dark).toBe(tokens('dark').surface.raised);
  });

  it('Wallet: the container background differs, and matches surface.base in each mode', () => {
    const { unmount } = renderPage(<Wallet />, 'light');
    const outlet = screen.getByTestId('outlet-content');
    const light = rgbToHex(
      getComputedStyle(outlet.parentElement?.parentElement as HTMLElement).backgroundColor,
    );
    unmount();
    renderPage(<Wallet />, 'dark');
    const outlet2 = screen.getByTestId('outlet-content');
    const dark = rgbToHex(
      getComputedStyle(outlet2.parentElement?.parentElement as HTMLElement).backgroundColor,
    );

    expect(dark).not.toBe(light);
    expect(light).toBe(tokens('light').surface.base);
    expect(dark).toBe(tokens('dark').surface.base);
  });

  it('Dex: the "Price Chart" panel background differs, and matches surface.raised in each mode', () => {
    const { unmount } = renderPage(<Dex />, 'light');
    const light = rgbToHex(nearestBackground(screen.getByText('Price Chart')));
    unmount();
    renderPage(<Dex />, 'dark');
    const dark = rgbToHex(nearestBackground(screen.getByText('Price Chart')));

    expect(dark).not.toBe(light);
    expect(light).toBe(tokens('light').surface.raised);
    expect(dark).toBe(tokens('dark').surface.raised);
  });

  it('Swap: the "Swap tokens" panel background differs, and matches surface.raised in each mode', () => {
    const { unmount } = renderPage(<Swap />, 'light');
    const light = rgbToHex(nearestBackground(screen.getByText('Swap tokens')));
    unmount();
    renderPage(<Swap />, 'dark');
    const dark = rgbToHex(nearestBackground(screen.getByText('Swap tokens')));

    expect(dark).not.toBe(light);
    expect(light).toBe(tokens('light').surface.raised);
    expect(dark).toBe(tokens('dark').surface.raised);
  });

  /*
   * Measured on a network card — a surface `Bridge` paints itself — rather
   * than on the page heading. The heading's nearest painted ancestor was
   * `<body>`, i.e. `CssBaseline`, so the old assertion held for a page that
   * rendered nothing: replacing `Bridge` with `<div>Cross-Chain Bridge</div>`
   * left it green. `nearestBackground` now refuses to walk that far, so the
   * flaw cannot come back here or in any other case using it.
   */
  it('Bridge: a network card it paints itself differs, and matches surface.raised in each mode', () => {
    authUser = { address: '3P123', name: 'Trader' };
    const card = () =>
      nearestBackground(screen.getByText('Ethereum').closest('.MuiCard-root') as HTMLElement);
    const { unmount } = renderPage(<Bridge />, 'light');
    const light = rgbToHex(card());
    unmount();
    renderPage(<Bridge />, 'dark');
    const dark = rgbToHex(card());

    expect(dark).not.toBe(light);
    expect(light).toBe(tokens('light').surface.raised);
    expect(dark).toBe(tokens('dark').surface.raised);
  });

  it('CreateToken: the step-0 panel background differs, and matches surface.raised in each mode', () => {
    authUser = { address: '3P123', name: 'Trader' };
    const { unmount } = renderPage(<CreateToken />, 'light');
    const light = rgbToHex(
      getComputedStyle(screen.getByText('Token Name *').closest('.MuiPaper-root') as HTMLElement)
        .backgroundColor,
    );
    unmount();
    renderPage(<CreateToken />, 'dark');
    const dark = rgbToHex(
      getComputedStyle(screen.getByText('Token Name *').closest('.MuiPaper-root') as HTMLElement)
        .backgroundColor,
    );

    expect(dark).not.toBe(light);
    expect(light).toBe(tokens('light').surface.raised);
    expect(dark).toBe(tokens('dark').surface.raised);
  });
});

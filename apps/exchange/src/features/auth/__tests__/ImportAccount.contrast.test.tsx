/**
 * ImportAccount — InfoBox icon ink
 *
 * `InfoBox`'s background is `theme.colors.primary` (`accent.primary`) and its
 * own `color` is `theme.colors.onPrimary` — the ink designed for that fill.
 * The "private location" notice's `Icon` used to override that with a
 * hardcoded `color="white"`, painting `stroke="white"` directly instead of
 * inheriting the container's ink. In light mode `onPrimary` happens to *be*
 * white (`#ffffff`), so the bug was invisible there; in dark mode
 * `accent.primary` is a light violet (`#8b7dff`) whose ink is near-black
 * (`onPrimary` = `#14122b`, 5.63:1) — `white` measured 3.24:1 against it
 * instead (see task-5-report.md's identical finding on Header/BigCTA's CTA
 * ink, and the fix-round-1 report for this one).
 *
 * The second, Ledger-shortcut InfoBox a few lines below was already fixed to
 * inherit `currentColor` (comment in ImportAccount.tsx says so); this test
 * pins the first one to the same behaviour so the two stay identical.
 *
 * `getComputedStyle` does not resolve SVG presentation attributes the way it
 * resolves CSS properties — `getComputedStyle(svg).stroke` reads back
 * `rgba(0, 0, 0, 0)` regardless of the actual `stroke` attribute in this
 * codebase's jsdom (verified directly while writing this test), and
 * lucide-react's `Icon` passes its `color` prop straight through as the raw
 * `stroke` attribute, never as CSS `color` (see `lucide-react/dist/esm/Icon.mjs`).
 * So this test reads the attribute directly and, only when it is
 * `currentColor`, resolves it the same way the browser would: via the
 * element's own (correctly inherited) `.color`.
 */
import { render, screen } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { describe, expect, it, vi } from 'vitest';
import { darkTheme, lightTheme } from '@/styles/themes';
import { rgbToHex } from '@/test-utils/rgbToHex';
import { contrastRatio, type ThemeMode } from '@/theme/tokens/semantic';
import { ImportAccount } from '../ImportAccount';

vi.mock('@/config', () => ({ config: { ledgerEnabled: false } }));
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    addAccount: vi.fn(),
    create: vi.fn(),
    getActiveState: () => '/desktop/wallet',
    isAuthenticated: false,
    login: vi.fn(),
    user: null,
  }),
}));
vi.mock('react-router', () => ({
  useNavigate: () => vi.fn(),
  useSearchParams: () => [new URLSearchParams(), vi.fn()],
}));
vi.mock('@/lib/logger', () => ({
  logger: { debug: vi.fn(), error: vi.fn(), warn: vi.fn() },
}));

/** See the file header comment: jsdom cannot compute `stroke`, only `.color`. */
function resolveStroke(icon: SVGSVGElement): string {
  const stroke = icon.getAttribute('stroke');
  if (stroke === 'currentColor') return rgbToHex(getComputedStyle(icon).color);
  if (stroke === 'white') return '#ffffff';
  throw new Error(`Unexpected stroke value: ${stroke}`);
}

const renderIn = (mode: ThemeMode) =>
  render(<ImportAccount />, {
    wrapper: ({ children }) => (
      <ThemeProvider theme={mode === 'light' ? lightTheme : darkTheme}>{children}</ThemeProvider>
    ),
  });

describe.each([
  'light',
  'dark',
] as const)('ImportAccount — "private location" InfoBox icon ink (%s mode)', (mode) => {
  it('inherits currentColor from the InfoBox rather than a hardcoded literal, and clears AA', () => {
    renderIn(mode);
    const label = screen.getByText(/make sure you're in a private location/i);
    const infoBox = label.parentElement;
    if (!infoBox) throw new Error('InfoBox not found');
    const icon = infoBox.querySelector('svg');
    if (!icon) throw new Error('Icon svg not found');

    // The exact rule this plan removes: no hardcoded 'white' on a filled
    // surface. The sibling Ledger InfoBox icon already inherits
    // `currentColor` — this one must match.
    expect(icon.getAttribute('stroke')).toBe('currentColor');

    const bg = rgbToHex(getComputedStyle(infoBox).backgroundColor);
    const ink = resolveStroke(icon);
    expect(contrastRatio(ink, bg)).toBeGreaterThanOrEqual(4.5);
  });
});

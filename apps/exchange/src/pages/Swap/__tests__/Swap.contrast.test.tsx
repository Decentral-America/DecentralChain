/**
 * Swap — both-mode contrast.
 *
 * The page was a `ComingSoon` preview with hardcoded figures; it now renders
 * three live panels against the AMM. The assertions below therefore target
 * the chrome that exists — the tab strip and the panel it sits on — rather
 * than the notice and the mock rate rows that used to be here.
 *
 * The original defect this file was written for still applies: panels that
 * paint `text.secondary` on a fixed light literal read at ~1.9:1 once dark
 * mode reaches them. Keeping a both-mode check on the panel is the point.
 */
import { CssBaseline } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { rgbToHex } from '@/test-utils/rgbToHex';
import { createAppTheme } from '@/theme/mui-theme';
import { contrastRatio, type ThemeMode, tokens } from '@/theme/tokens/semantic';
import { Swap } from '../Swap';

// The panels read the chain. This suite is about colour, so the AMM is stubbed
// rather than reached — a contrast test that needs mainnet is not a test.
vi.mock('@/hooks/useAmm', () => ({
  useAmmAssetMeta: () => ({ isLoading: false, metaById: new Map() }),
  useAmmBalance: () => ({ data: undefined }),
  useAmmPaused: () => ({ data: false }),
  useAmmPools: () => ({ data: [], isLoading: false }),
  useLpPosition: () => ({ data: undefined }),
  useSwapQuote: () => ({ data: undefined, error: null, isFetching: false }),
}));

vi.mock('@/hooks/useAmmTransaction', () => ({
  useAmmTransaction: () => ({
    addLiquidity: vi.fn(),
    error: null,
    isConfirming: false,
    isSubmitting: false,
    removeLiquidity: vi.fn(),
    reset: vi.fn(),
    swap: vi.fn(),
  }),
}));

vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: null }) }));

// The Portfolio tab hands off to that page rather than rebuilding it here, so
// the panel needs a navigator. Spreading the real module keeps Link and the
// rest intact — the same shape the other page tests use.
vi.mock('react-router', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react-router')>()),
  useNavigate: () => vi.fn(),
}));

function nearestBackground(el: HTMLElement): string {
  let node: HTMLElement | null = el;
  while (node) {
    const bg = getComputedStyle(node).backgroundColor;
    if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') return bg;
    node = node.parentElement;
  }
  throw new Error('No ancestor with an explicit background found');
}

const renderIn = (mode: ThemeMode) =>
  render(
    <ThemeProvider theme={createAppTheme(mode)}>
      <CssBaseline />
      <Swap />
    </ThemeProvider>,
  );

describe.each(['light', 'dark'] as const)('Swap — page chrome (%s mode)', (mode) => {
  it('the panel actually follows the ambient theme mode, not a forced light literal', () => {
    // The tab strip now sits on the page canvas; the raised surface is the
    // card each panel renders into.
    renderIn(mode);
    // The panel title sits directly on the card; the amount wells have their
    // own tinted ground, so measuring from one of those reads the well.
    const title = screen.getAllByText('Swap').at(-1) as HTMLElement;
    const bg = nearestBackground(title);

    expect(rgbToHex(bg)).toBe(tokens(mode).surface.raised);
  });

  it('the tab labels clear AA against their panel', () => {
    renderIn(mode);
    for (const name of ['Liquidity', 'Pools', 'Explore']) {
      const tab = screen.getByRole('tab', { name });
      const ink = rgbToHex(getComputedStyle(tab).color);
      const bg = rgbToHex(nearestBackground(tab));

      expect(contrastRatio(ink, bg)).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('the amount-well labels clear AA against the well', () => {
    renderIn(mode);
    for (const label of ['You pay', 'You receive']) {
      const text = screen.getByText(label);
      const ink = rgbToHex(getComputedStyle(text).color);
      const bg = rgbToHex(nearestBackground(text));

      expect(contrastRatio(ink, bg)).toBeGreaterThanOrEqual(4.5);
    }
  });
});

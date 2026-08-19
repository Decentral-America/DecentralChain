/**
 * Wallet — both-mode contrast
 *
 * `Wallet.tsx` renders no text of its own — it is a styled container
 * (`background: theme.palette.background.default`) wrapping the routed
 * `<Outlet/>`. Removing the `<ThemeProvider theme={landingTheme}>` wrapper
 * re-derives that background from the real app theme, verified here by
 * asserting the container's own computed background against `tokens(mode)`.
 *
 * Note: `Wallet.tsx`'s wrapper was not just around `Dashboard` (the `index`
 * route) — `walletRoutes.tsx` nests `Portfolio`, `LeasingModern`,
 * `TransactionsModern`, `AliasManagement` and `AccountManagerPage` under the
 * same `<Outlet/>`, so all five were also always forced to `landingTheme`'s
 * light palette and are, for the first time, reaching real dark mode through
 * this exact change. Each was swept independently — see task-6-report.md.
 */
import { ThemeProvider } from '@mui/material/styles';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { createAppTheme } from '@/theme/mui-theme';
import { type ThemeMode, tokens } from '@/theme/tokens/semantic';
import { Wallet } from '../Wallet';

vi.mock('react-router', () => ({
  Outlet: () => <div data-testid="outlet-content">child route</div>,
}));

/**
 * Drops any alpha channel: `.slice(0, 3)` keeps r/g/b and discards a 4th
 * match, so an ink specified with alpha would be measured against its own
 * r/g/b as if fully opaque — overstating its contrast once alpha actually
 * composites onto the background. Every current call site here passes an
 * opaque colour, so this is exact today; it is a structural limitation of
 * this idiom (duplicated across 15+ contrast test files) rather than a bug
 * in any one test. See task-8-report.md, Finding 5.
 */
function rgbToHex(rgb: string): string {
  const channels = rgb.match(/\d+(\.\d+)?/g);
  if (!channels || channels.length < 3) throw new Error(`Unparseable colour: ${rgb}`);
  return `#${channels
    .slice(0, 3)
    .map((c) => Number(c).toString(16).padStart(2, '0'))
    .join('')}`;
}

const renderIn = (mode: ThemeMode) =>
  render(
    <ThemeProvider theme={createAppTheme(mode)}>
      <Wallet />
    </ThemeProvider>,
  );

describe.each(['light', 'dark'] as const)('Wallet — container (%s mode)', (mode) => {
  it('the container background actually follows the ambient theme mode, not a forced light literal', () => {
    renderIn(mode);
    const outlet = screen.getByTestId('outlet-content');
    const container = outlet.parentElement?.parentElement as HTMLElement;
    const bg = rgbToHex(getComputedStyle(container).backgroundColor);
    expect(bg).toBe(tokens(mode).surface.base);
  });
});

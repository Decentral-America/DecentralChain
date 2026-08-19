/**
 * ImportLedger — both-mode contrast
 *
 * Unlike the other five pages in this task, `ImportLedger.tsx` never
 * imported `brandInk`/`onCanvas`/`brandCanvas` — every colour role it uses
 * (`background.default`, `background.paper`, `primary.main`,
 * `primary.contrastText`, `secondary.main`, `secondary.contrastText`,
 * `text.secondary`, `divider`) is already theme-relative, so removing its
 * `<ThemeProvider theme={landingTheme}>` wrapper (task 5) re-derives all of
 * them from the real app theme automatically, in both modes, with no further
 * source changes. This test is the verification for that claim, not a red/
 * green fix — see task-5-report.md.
 */
import { CssBaseline } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { rgbToHex } from '@/test-utils/rgbToHex';
import { createAppTheme } from '@/theme/mui-theme';
import { contrastRatio } from '@/theme/tokens/semantic';
import { ImportLedger } from '../ImportLedger';

vi.mock('@/features/auth/ImportLedger', () => ({
  ImportLedger: () => <div data-testid="ledger-form-stub">form</div>,
}));

/** Nearest ancestor (inclusive) with an explicit, non-transparent background. */
function nearestBackground(el: HTMLElement): string {
  let node: HTMLElement | null = el;
  while (node) {
    const bg = getComputedStyle(node).backgroundColor;
    if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') return bg;
    node = node.parentElement;
  }
  throw new Error('No ancestor with an explicit background found');
}

/**
 * `CssBaseline` is what actually applies `theme.palette.text.primary` to
 * `<body>` in production (via `ThemeContext.tsx`) — the plain `Typography`
 * elements this page uses have no explicit `color` and inherit that body
 * colour rather than setting their own. Omitting it here would test against
 * the browser's black default, not the real rendered page.
 */
const renderIn = (mode: 'light' | 'dark') =>
  render(
    <ThemeProvider theme={createAppTheme(mode)}>
      <CssBaseline />
      <ImportLedger />
    </ThemeProvider>,
  );

describe.each(['light', 'dark'] as const)('ImportLedger (%s mode)', (mode) => {
  it('renders the stubbed form on the theme-relative panel', () => {
    renderIn(mode);
    expect(screen.getByTestId('ledger-form-stub')).toBeInTheDocument();
  });

  it('the icon-plate headings clear AA against the page canvas', () => {
    renderIn(mode);
    for (const text of ['Hardware Security', 'Easy Connection', 'Transaction Approval']) {
      const heading = screen.getByText(text);
      const ink = rgbToHex(getComputedStyle(heading).color);
      // These sit directly on `background.default` (no card behind them).
      const bg = rgbToHex(nearestBackground(heading));
      expect(contrastRatio(ink, bg)).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('the headline clears AA against the page canvas', () => {
    renderIn(mode);
    const heading = screen.getByText('Maximum security with Ledger');
    const ink = rgbToHex(getComputedStyle(heading).color);
    const bg = rgbToHex(nearestBackground(heading));
    expect(contrastRatio(ink, bg)).toBeGreaterThanOrEqual(4.5);
  });
});

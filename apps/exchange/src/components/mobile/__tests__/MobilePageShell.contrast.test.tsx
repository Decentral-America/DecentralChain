/**
 * MobilePageShell — both-mode canvas contrast
 *
 * `MobilePageShell` wraps every desktop screen reused on the mobile path —
 * twelve route entries across `src/routes/index.tsx`, `walletRoutes.tsx` and
 * `dexRoutes.tsx` (Bridge, Markets, OrderBook, Analytics, Messages,
 * CreateToken, Swap, Transactions, Leasing, Aliases, Account manager, Dex) —
 * so unlike the dev-only `/mobile-preview*` tree, this component is live,
 * authenticated production chrome.
 *
 * Its canvas was `mobileSurface.canvas` (`styles/mobileTokens.ts`'s
 * `'#F4F5F7'`), a flat constant with no mode dimension — it behaves exactly
 * like a hardcoded hex literal even though it reads like a token import. The
 * `<Box>` sets no `color`, so its content inherits MUI's mode-aware
 * `text.primary`. In dark mode that is near-white ink (`#f5f4ff`) on a fixed
 * light-grey fill: ~1:1, unreadable.
 *
 * Fixed by moving the fill itself to `tokens(mode).surface.base` — the same
 * page-level canvas role every desktop route already paints through
 * `MainLayout`/`PageFrame`. The ink half needs no change: `text.primary`
 * was already mode-aware, it just had nothing correct to sit on.
 */
import { CssBaseline, Typography } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { rgbToHex } from '@/test-utils/rgbToHex';
import { createAppTheme } from '@/theme/mui-theme';
import { contrastRatio, type ThemeMode, tokens } from '@/theme/tokens/semantic';
import { MobilePageShell } from '../MobilePageShell';

vi.mock('react-router', () => ({ useNavigate: () => vi.fn() }));

function renderIn(mode: ThemeMode) {
  return render(
    <ThemeProvider theme={createAppTheme(mode)}>
      {/*
       * `CssBaseline` is what actually sets `body { color: text.primary }` in
       * the real app (`ThemeContext.tsx` mounts it alongside the provider).
       * Without it a `<Typography>` with no `color` prop falls back to
       * jsdom's own black default rather than the theme's ink, and the test
       * would measure that accident instead of the real inheritance path.
       */}
      <CssBaseline />
      <MobilePageShell title="Bridge" subtitle="Move assets across chains.">
        {/*
         * No explicit `color` — the real failure shape. Every one of the
         * twelve consumers ultimately renders content through `PageFrame`,
         * whose own title/subtitle carry no `color` either and inherit
         * whatever the canvas beneath them offers.
         */}
        <Typography data-testid="content">Cross-chain transfer history</Typography>
      </MobilePageShell>
    </ThemeProvider>,
  );
}

/**
 * The canvas `Box` MobilePageShell renders is the band's parent — the same
 * idiom `MainLayout.contrast.test.tsx` uses to find its shell from the
 * `<header>` it renders. Locating it via the band, rather than via the
 * content node's DOM ancestry, does not depend on how many wrapper elements
 * `SurfaceProvider`/`PageFrame` interpose between the canvas and the content.
 */
function canvasOf(): HTMLElement {
  const band = document.querySelector('header');
  if (!band?.parentElement) throw new Error('could not find the MobilePageShell canvas');
  return band.parentElement;
}

describe.each(['light', 'dark'] as const)('MobilePageShell (%s mode)', (mode) => {
  it('paints the canvas from the mode-aware page-surface token, not the fixed mobile-token grey', () => {
    renderIn(mode);
    const fill = rgbToHex(getComputedStyle(canvasOf()).backgroundColor);
    expect(fill).toBe(tokens(mode).surface.base);
  });

  it('the inherited ink clears AA against the canvas it is actually painted on', () => {
    renderIn(mode);
    const content = screen.getByTestId('content');
    const ink = rgbToHex(getComputedStyle(content).color);
    const fill = rgbToHex(getComputedStyle(canvasOf()).backgroundColor);
    expect(contrastRatio(ink, fill)).toBeGreaterThanOrEqual(4.5);
  });
});

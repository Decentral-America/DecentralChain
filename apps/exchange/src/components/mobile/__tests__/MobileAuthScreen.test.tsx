/**
 * MobileAuthScreen — follows the app's light/dark toggle
 *
 * This screen is the mobile path of `SignIn` and `SignUp` — two of the twelve
 * pages the spec's acceptance test names. It has to honour the toggle like
 * every other page.
 *
 * It briefly did not. The design-system branch deleted twelve hardcoded
 * `<ThemeProvider theme={landingTheme}>` wrappers and then added a thirteenth
 * light pin *here* (`createAppTheme('light')` plus a styled-components
 * `lightTheme`), on a file that carried no theme pin at all at the project's
 * base commit. The justification was real — the sheet behind the forms was
 * `mobileSurface.canvas`, a fixed light literal with no mode dimension, so
 * mode-aware form ink landed on a permanently-light surface. But pinning the
 * ink to match the surface is the wrong direction: it re-broke the toggle on
 * two of the twelve pages to protect one fixed fill. The surface follows the
 * mode now, and the ink is free to as well.
 *
 * What stays fixed, deliberately: the branded band at the top is a dark
 * gradient in both modes (it is the product's chrome identity, the same band
 * the mobile app wears), and its ink is pinned white to match. That is the
 * *correct* inverse pattern — a fixed fill under fixed ink — not the defect
 * class. It is asserted below in both modes so it cannot silently drift into
 * the mode-aware half of the pairing.
 */
import { Typography, useTheme } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import { render, screen } from '@testing-library/react';
import styled, { ThemeProvider as StyledThemeProvider } from 'styled-components';
import { describe, expect, it, vi } from 'vitest';
import { GlassCard } from '@/components/auth/GlassCard';
import { MobileButton } from '@/components/mobile/primitives';
import { darkTheme, lightTheme } from '@/styles/themes';
import { rgbToHex } from '@/test-utils/rgbToHex';
import { createAppTheme } from '@/theme/mui-theme';
import { contrastRatio, type ThemeMode, tokens } from '@/theme/tokens/semantic';
import { MobileAuthScreen } from '../MobileAuthScreen';

vi.mock('react-router', () => ({ useNavigate: () => vi.fn() }));

/** Reads the ambient MUI mode and renders it as text, to probe what its
 * descendants actually see. */
function ModeProbe() {
  const mode = useTheme().palette.mode;
  return <span data-testid="mode-probe">{mode}</span>;
}

/** `LoginForm`'s own `Title`/`Description` idiom: styled-components ink
 * read off `p.theme.colors.text` — the second theme system this screen's
 * content subtree lives in. */
const StyledProbe = styled.p`
  color: ${(p) => p.theme.colors.text};
`;

function renderIn(mode: ThemeMode, children: React.ReactNode, footer?: React.ReactNode) {
  return render(
    <StyledThemeProvider theme={mode === 'dark' ? darkTheme : lightTheme}>
      <ThemeProvider theme={createAppTheme(mode)}>
        <MobileAuthScreen title="Title" footer={footer}>
          {children}
        </MobileAuthScreen>
      </ThemeProvider>
    </StyledThemeProvider>,
  );
}

/** The form sheet: the scrolling surface the content subtree sits on. */
function sheetOf(el: HTMLElement): HTMLElement {
  const sheet = el.closest('[data-testid="mobile-auth-sheet"]');
  if (!sheet) throw new Error('content is not inside the form sheet');
  return sheet as HTMLElement;
}

describe.each(['light', 'dark'] as const)('MobileAuthScreen (%s mode)', (mode) => {
  it('lets its content subtree see the ambient mode instead of pinning light', () => {
    renderIn(mode, <ModeProbe />);
    expect(screen.getByTestId('mode-probe')).toHaveTextContent(mode);
  });

  it('paints the form sheet from the mode-aware surface tokens', () => {
    renderIn(mode, <ModeProbe />);
    const sheet = sheetOf(screen.getByTestId('mode-probe'));
    expect(rgbToHex(getComputedStyle(sheet).backgroundColor)).toBe(tokens(mode).surface.base);
  });

  it('keeps styled-components ink legible on the sheet it actually sits on', () => {
    renderIn(mode, <StyledProbe>probe text</StyledProbe>);
    const probe = screen.getByText('probe text');
    const ink = rgbToHex(getComputedStyle(probe).color);
    const sheet = rgbToHex(getComputedStyle(sheetOf(probe)).backgroundColor);
    expect(contrastRatio(ink, sheet)).toBeGreaterThanOrEqual(4.5);
  });

  it('gives GlassCard the construction its own mode calls for, and it reads on the sheet', () => {
    renderIn(
      mode,
      <GlassCard>
        <Typography sx={{ color: 'text.secondary' }}>
          Three things to know about a wallet only you can open.
        </Typography>
      </GlassCard>,
    );
    const text = screen.getByText(/Three things to know/i);
    const ink = rgbToHex(getComputedStyle(text).color);
    expect(ink).toBe(tokens(mode).text.secondary);

    // Light mode's overlay is an opaque card; dark mode's is translucent
    // glass, so the sheet behind it is what the ink is really read against.
    // Measure the worst of the two rather than assuming which applies.
    const sheet = rgbToHex(getComputedStyle(sheetOf(text)).backgroundColor);
    expect(contrastRatio(ink, sheet)).toBeGreaterThanOrEqual(4.5);
    if (mode === 'light') {
      const card = text.parentElement as HTMLElement;
      const cardBg = rgbToHex(getComputedStyle(card).backgroundColor);
      expect(cardBg).toBe(tokens('light').surface.overlay);
      expect(contrastRatio(ink, cardBg)).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("keeps the footer's outline button legible on the sheet", () => {
    renderIn(
      mode,
      <ModeProbe />,
      <MobileButton variant="outline">Create a new wallet</MobileButton>,
    );
    const button = screen.getByRole('button', { name: /create a new wallet/i });
    const ink = rgbToHex(getComputedStyle(button).color);
    const sheet = rgbToHex(
      getComputedStyle(sheetOf(screen.getByTestId('mode-probe'))).backgroundColor,
    );
    expect(contrastRatio(ink, sheet)).toBeGreaterThanOrEqual(4.5);
  });

  it('keeps the branded band fixed in both modes, with its ink pinned to match', () => {
    renderIn(mode, <ModeProbe />);
    const heading = screen.getByRole('heading', { name: 'Title' });
    const band = heading.parentElement as HTMLElement;
    const ink = rgbToHex(getComputedStyle(band).color);
    // The band's gradient stops, darkest to lightest — the ink has to clear
    // the lightest of them, which is the only one that can fail.
    for (const stop of ['#0B0724', '#1B1046', '#3C1B7A', '#5E2CA5']) {
      expect(contrastRatio(ink, stop)).toBeGreaterThanOrEqual(4.5);
    }
  });
});

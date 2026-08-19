/**
 * MobileAuthScreen — pins its content subtree to the light theme
 *
 * The sheet this screen builds (`mobileSurface.canvas`) is a fixed light
 * literal — deliberately, per `styles/mobileTokens`' own doc comment, mobile
 * chrome does not follow the app's light/dark toggle. But the *forms* it
 * hosts (`LoginForm`'s `Card`, `CreateWalletWizard`'s `GlassCard`) are
 * shared with desktop, where they correctly read the ambient ThemeContext.
 *
 * Once SignIn/SignUp stopped forcing `landingTheme` (task 5), that ambient
 * theme genuinely turns dark when the app is in dark mode — including here,
 * where the actual backdrop never does. Found via `SignUp`'s mobile view in
 * dark mode: `GlassCard`'s dark construction is a *translucent* glass tuned
 * to sit on the dark aurora canvas; on this fixed-light sheet the overlay is
 * nearly a no-op, and its `tokens('dark').text.secondary` ink
 * (`#b8b3d9`) renders close to invisible on the effectively near-white
 * result. `SignIn`'s `LoginForm` `Card` is less severe (opaque, not
 * translucent) but shows the same class of defect: a dark card floating
 * inside a sheet that never stopped being light.
 *
 * The fix pins everything this screen hosts to the light theme — matching
 * the sheet it actually sits on, in both app modes. This has to happen in
 * *both* theme systems: `LoginForm`'s own text (`Title`, `Description`, …)
 * is styled-components, not MUI, so pinning only the MUI `ThemeProvider`
 * fixes the card surface but leaves that text reading the outer (dark)
 * styled-components theme — white-on-white again, just from the other
 * system. See task-5-report.md.
 */
import { Typography, useTheme } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import { render, screen } from '@testing-library/react';
import styled, { ThemeProvider as StyledThemeProvider } from 'styled-components';
import { describe, expect, it, vi } from 'vitest';
import { GlassCard } from '@/components/auth/GlassCard';
import { darkTheme } from '@/styles/themes';
import { rgbToHex } from '@/test-utils/rgbToHex';
import { createAppTheme } from '@/theme/mui-theme';
import { contrastRatio, tokens } from '@/theme/tokens/semantic';
import { MobileAuthScreen } from '../MobileAuthScreen';

vi.mock('react-router', () => ({ useNavigate: () => vi.fn() }));

/** Reads the ambient MUI mode and renders it as text, to probe what its
 * descendants actually see. */
function ModeProbe() {
  const mode = useTheme().palette.mode;
  return <span data-testid="mode-probe">{mode}</span>;
}

/** `LoginForm`'s own `Title`/`Description` idiom: styled-components ink
 * read off `p.theme.colors.text`, exactly what needs to be pinned too. */
const StyledProbe = styled.p`
  color: ${(p) => p.theme.colors.text};
`;

describe('MobileAuthScreen — content subtree theme', () => {
  it('pins descendants to light even when the outer app theme is dark (MUI)', () => {
    render(
      <ThemeProvider theme={createAppTheme('dark')}>
        <MobileAuthScreen title="Title">
          <ModeProbe />
        </MobileAuthScreen>
      </ThemeProvider>,
    );
    expect(screen.getByTestId('mode-probe')).toHaveTextContent('light');
  });

  it('pins descendants to light even when the outer app theme is dark (styled-components)', () => {
    render(
      <StyledThemeProvider theme={darkTheme}>
        <ThemeProvider theme={createAppTheme('dark')}>
          <MobileAuthScreen title="Title">
            <StyledProbe>probe text</StyledProbe>
          </MobileAuthScreen>
        </ThemeProvider>
      </StyledThemeProvider>,
    );
    const ink = rgbToHex(getComputedStyle(screen.getByText('probe text')).color);
    // `LoginForm`'s Card sits on the fixed-light mobile sheet — its own text
    // must clear AA against that, not against a dark card it doesn't have.
    expect(contrastRatio(ink, '#f4f5f7')).toBeGreaterThanOrEqual(4.5);
  });

  it('GlassCard renders its opaque light construction, not the dark translucent glass', () => {
    render(
      <ThemeProvider theme={createAppTheme('dark')}>
        <MobileAuthScreen title="Title">
          <GlassCard>
            <Typography
              sx={{
                color: (t) =>
                  t.palette.mode === 'dark'
                    ? tokens('dark').text.secondary
                    : tokens('light').text.secondary,
              }}
            >
              Three things to know about a wallet only you can open.
            </Typography>
          </GlassCard>
        </MobileAuthScreen>
      </ThemeProvider>,
    );
    const text = screen.getByText(/Three things to know/i);
    const card = text.parentElement as HTMLElement;
    const ink = rgbToHex(getComputedStyle(text).color);
    const cardBg = rgbToHex(getComputedStyle(card).backgroundColor);
    // Light mode's overlay is opaque — verified directly rather than assumed.
    expect(cardBg).toBe(tokens('light').surface.overlay);
    expect(contrastRatio(ink, cardBg)).toBeGreaterThanOrEqual(4.5);
    // And against the fixed mobile sheet behind it, for good measure.
    expect(contrastRatio(ink, '#f4f5f7')).toBeGreaterThanOrEqual(4.5);
  });
});

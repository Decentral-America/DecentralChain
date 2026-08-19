import { Box, ButtonBase, Typography } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import { type ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { ThemeProvider as StyledThemeProvider } from 'styled-components';
import { Icon } from '@/components/atoms/Icon';
import Logo from '@/components/atoms/Logo';
import { SurfaceProvider } from '@/components/atoms/SurfaceContext';
import {
  mobileGradient,
  mobileLayout,
  mobileRadius,
  mobileSurface,
  mobileText,
} from '@/styles/mobileTokens';
import { lightTheme } from '@/styles/themes';
import { createAppTheme } from '@/theme/mui-theme';

/**
 * Pins everything this screen hosts to the light theme — this module's own
 * scope, not per-render, since it never changes.
 *
 * The sheet below (`mobileSurface.canvas`) is a fixed light literal, like
 * the rest of the mobile chrome — deliberately, per `styles/mobileTokens`'
 * own doc comment. `LoginForm`'s `Card` and `CreateWalletWizard`'s
 * `GlassCard` are shared with desktop, though, where they correctly read the
 * ambient `ThemeContext`. Once the app is actually in dark mode (task 5),
 * that ambient theme reaches here too unless pinned: `GlassCard`'s dark
 * construction is translucent glass tuned to sit on the dark aurora canvas,
 * and its `tokens('dark').text.secondary` ink renders close to invisible on
 * this sheet, which never stopped being light.
 *
 * Two theme systems, both pinned: `GlassCard`'s surface and most inline
 * `sx` colour reads are MUI; `LoginForm`'s own text (`Title`, `Description`,
 * …) is styled-components, driven by a *separate* `ThemeContext`-supplied
 * provider that the MUI one alone does not reach. Pinning only the MUI side
 * fixes the card but leaves that text reading the outer dark
 * styled-components theme — the same defect from the other system. See
 * task-5-report.md.
 */
const LIGHT_MUI_THEME = createAppTheme('light');

/**
 * Mobile authentication screen.
 *
 * Gives sign-in, wallet creation and import the same chrome as the rest of the
 * mobile app: the branded gradient band with a back control, and the form on a
 * rounded sheet that overlaps it. Auth is pre-session, so there is no tab bar.
 *
 * The sheet fills the remaining height and scrolls internally, which keeps the
 * submit button reachable when the on-screen keyboard is open.
 */

interface MobileAuthScreenProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  /** Shown under the form as the alternate path */
  footer?: ReactNode;
  /** Hides the back control on entry points that have nowhere to return to */
  hideBack?: boolean;
  onBack?: () => void;
}

export function MobileAuthScreen({
  title,
  subtitle,
  children,
  footer,
  hideBack = false,
  onBack,
}: MobileAuthScreenProps) {
  const navigate = useNavigate();

  return (
    <Box
      component="main"
      sx={{
        background: mobileGradient.header,
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100dvh',
      }}
    >
      {/* Branded band */}
      <Box
        sx={{
          color: mobileText.onAccent,
          flexShrink: 0,
          pb: 3,
          pt: 'calc(env(safe-area-inset-top) + 16px)',
          px: `${mobileLayout.gutter}px`,
        }}
      >
        <Box sx={{ alignItems: 'center', display: 'flex', gap: 1.5, minHeight: 44 }}>
          {hideBack ? (
            <Logo compact onDark />
          ) : (
            <ButtonBase
              aria-label="Back"
              onClick={onBack ?? (() => navigate(-1))}
              sx={{
                bgcolor: 'rgba(255, 255, 255, 0.14)',
                borderRadius: '50%',
                color: 'inherit',
                height: 44,
                width: 44,
              }}
            >
              <Icon name="arrowBack" size={19} strokeWidth={2} />
            </ButtonBase>
          )}
        </Box>

        <Typography
          component="h1"
          sx={{ fontSize: 27, fontWeight: 700, letterSpacing: '-0.5px', mt: 2.5 }}
        >
          {title}
        </Typography>
        {subtitle ? (
          <Typography sx={{ fontSize: 15, lineHeight: 1.5, mt: 1, opacity: 0.75 }}>
            {subtitle}
          </Typography>
        ) : null}
      </Box>

      {/* Form sheet — takes the remaining height and scrolls on its own */}
      <Box
        sx={{
          bgcolor: mobileSurface.canvas,
          borderTopLeftRadius: mobileRadius.sheet,
          borderTopRightRadius: mobileRadius.sheet,
          display: 'flex',
          flex: 1,
          flexDirection: 'column',
          minHeight: 0,
          overflowY: 'auto',
          // The sheet scrolls on its own; it must not drag the page with it.
          overscrollBehavior: 'contain',
          pb: 'calc(env(safe-area-inset-bottom) + 24px)',
          pt: 3,
          px: `${mobileLayout.gutter}px`,
        }}
      >
        <ThemeProvider theme={LIGHT_MUI_THEME}>
          <StyledThemeProvider theme={lightTheme}>
            <Box sx={{ flex: 1 }}>
              <SurfaceProvider chromeless>{children}</SurfaceProvider>
            </Box>
            {footer && (
              <Box
                sx={{
                  '& button': { minHeight: 48 },
                  bgcolor: 'transparent',
                  /*
                   * Sticky insets are measured from the scrollport edge, and the
                   * scrollport now reaches the physical bottom of the screen
                   * (viewport-fit=cover). `bottom: 0` would pin the submit
                   * button under the home indicator while the sheet is
                   * scrolled; the container's own pb only clears it once
                   * scrolled fully down.
                   */
                  bottom: 'env(safe-area-inset-bottom)',
                  position: 'sticky',
                  pt: 2,
                }}
              >
                {footer}
              </Box>
            )}
          </StyledThemeProvider>
        </ThemeProvider>
      </Box>
    </Box>
  );
}

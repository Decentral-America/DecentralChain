import { Box, ButtonBase, Typography } from '@mui/material';
import { type ReactNode } from 'react';
import { useNavigate } from 'react-router';
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
               * (viewport-fit=cover). `bottom: 0` would pin the submit button
               * under the home indicator while the sheet is scrolled; the
               * container's own pb only clears it once scrolled fully down.
               */
              bottom: 'env(safe-area-inset-bottom)',
              position: 'sticky',
              pt: 2,
            }}
          >
            {footer}
          </Box>
        )}
      </Box>
    </Box>
  );
}

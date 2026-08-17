import { useMediaQuery, useTheme } from '@mui/material';
import { MainLayout } from './MainLayout';
import { MobileLayout } from './MobileLayout';

/**
 * Chooses the mobile or desktop shell.
 *
 * The two shells are genuinely different applications in structure — bottom tab
 * navigation and screen-owned headers on mobile, a persistent sidebar and app
 * bar on desktop — so the choice is made once here rather than by scattering
 * breakpoint conditionals through every screen.
 *
 * `noSsr` is set because the shells differ structurally: rendering the desktop
 * tree first and swapping would remount every screen on first paint.
 */
export function ResponsiveAppLayout() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'), { noSsr: true });

  return isMobile ? <MobileLayout /> : <MainLayout />;
}

import { Box } from '@mui/material';
import { Suspense, useEffect } from 'react';
import { Outlet } from 'react-router';
import { MobileTabBar } from '@/components/mobile/MobileTabBar';
import { TransactionNotificationsMonitor } from '@/components/notifications/TransactionNotificationsMonitor';
import { RouteLoadingFallback } from '@/components/RouteLoadingFallback';
import { mobileLayout, mobileSurface } from '@/styles/mobileTokens';

/**
 * Mobile application shell.
 *
 * Deliberately separate from MainLayout rather than a set of breakpoint
 * overrides on it: the mobile experience has different chrome (no sidebar, no
 * desktop app bar), different navigation (a bottom tab bar), and screens are
 * expected to own their own headers. Sharing one layout would mean every screen
 * fighting the desktop scaffolding.
 *
 * The scroll container sits above a fixed tab bar, so it reserves bottom space
 * equal to the bar plus the home-indicator inset.
 */
export function MobileLayout() {
  /*
   * Flag the document so it can adopt the mobile canvas colour. Doing it here
   * rather than globally keeps the desktop shell on the white page background.
   */
  useEffect(() => {
    document.documentElement.setAttribute('data-shell', 'mobile');
    return () => document.documentElement.removeAttribute('data-shell');
  }, []);

  return (
    <Box
      sx={{
        bgcolor: mobileSurface.canvas,
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100dvh',
      }}
    >
      <TransactionNotificationsMonitor />

      <Box
        component="main"
        sx={{
          /*
           * A flex column whose child stretches. Screens previously used
           * `minHeight: 100%`, which does not resolve against an auto-height
           * parent and left the canvas ending part-way down the viewport.
           */
          '& > *': { flex: 1, minHeight: 0 },
          bgcolor: mobileSurface.canvas,
          display: 'flex',
          flex: 1,
          flexDirection: 'column',
          /*
           * Contains any horizontally-scrolling rail inside the page. `clip`
           * rather than `hidden` so this does not become a scroll container —
           * that would make it the containing block for the sticky header in
           * every screen below, and the header would scroll away with the page.
           */
          overflowX: 'clip',
          // Screens render their own header, so no top offset here.
          pb: `calc(${mobileLayout.tabBarHeight}px + env(safe-area-inset-bottom))`,
          width: '100%',
        }}
      >
        <Suspense fallback={<RouteLoadingFallback />}>
          <Outlet />
        </Suspense>
      </Box>

      <MobileTabBar />
    </Box>
  );
}

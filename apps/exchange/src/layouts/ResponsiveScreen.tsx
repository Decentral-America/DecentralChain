import { useMediaQuery, useTheme } from '@mui/material';
import { type ReactElement } from 'react';

/**
 * Renders a mobile-specific screen below the tablet breakpoint, falling back to
 * the existing desktop screen above it.
 *
 * This lives in its own module rather than beside `ResponsiveAppLayout` in
 * `ResponsiveLayout.tsx` for a bundling reason: every route file imports
 * `ResponsiveScreen` statically (the route `element` JSX is built at module
 * evaluation time, so it cannot be deferred). When the two shared a module,
 * that static import also pulled in `MainLayout` and `MobileLayout` — and
 * through `MainLayout`, both `AuthContext` and the Sentry chain — into the
 * entry graph, which defeated the `lazy()` on `ResponsiveAppLayout` and put
 * ~167 kB of "deferred" code into the initial modulepreload list.
 *
 * Keep this module free of layout/page imports.
 */
export function ResponsiveScreen({
  mobile,
  desktop,
}: {
  mobile: ReactElement;
  desktop: ReactElement;
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'), { noSsr: true });

  return isMobile ? mobile : desktop;
}

/**
 * Onboarding keeps its pre-redesign look.
 *
 * The landing page and the welcome, sign-in, sign-up, import, restore and
 * hardware-wallet flows were deliberately left on the previous visual system
 * while the rest of the app moved to the "precision instrument" design. This
 * provider scopes that older system to those routes: it serves the
 * styled-components and MUI themes built from the frozen token snapshot in
 * `src/styles/legacy/`, and the onboarding screens read their colours from the
 * same snapshot, so they render exactly as they did before.
 *
 * Retire it (and `src/styles/legacy/`, `src/components/legacy/`) when
 * onboarding is redesigned.
 */
import { ThemeProvider as MuiThemeProvider } from '@mui/material';
import { type ReactNode, useMemo } from 'react';
import { Outlet } from 'react-router';
import { ThemeProvider as StyledThemeProvider } from 'styled-components';
import { useTheme } from '@/contexts/ThemeContext';
import { LegacyGlobalStyles } from '@/styles/legacy/GlobalStyles';
import { createAppTheme } from '@/styles/legacy/muiTheme';
import { darkTheme, lightTheme } from '@/styles/legacy/themes';

export function LegacyOnboardingTheme({ children }: { children: ReactNode }) {
  const { theme: mode } = useTheme();
  const muiTheme = useMemo(() => createAppTheme(mode), [mode]);
  return (
    <MuiThemeProvider theme={muiTheme}>
      <StyledThemeProvider theme={mode === 'dark' ? darkTheme : lightTheme}>
        {/* Mounted after the app's GlobalStyles, so it wins while onboarding is on screen. */}
        <LegacyGlobalStyles />
        {children}
      </StyledThemeProvider>
    </MuiThemeProvider>
  );
}

/** Pathless layout route that renders its child routes inside `LegacyOnboardingTheme`. */
export function LegacyOnboardingLayout() {
  return (
    <LegacyOnboardingTheme>
      <Outlet />
    </LegacyOnboardingTheme>
  );
}

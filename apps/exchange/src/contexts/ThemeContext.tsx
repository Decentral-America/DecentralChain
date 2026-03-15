/**
 * Theme Context
 * Manages light/dark theme switching and persistence
 * Replaces Angular Themes service
 */

import { CssBaseline, ThemeProvider as MuiThemeProvider } from '@mui/material';
import { createContext, type ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import { ThemeProvider as StyledThemeProvider } from 'styled-components';
import { darkTheme, lightTheme } from '@/styles/themes';
import { createAppTheme } from '@/theme/mui-theme';

export type ThemeMode = 'light' | 'dark';

interface ThemeContextType {
  theme: ThemeMode;
  toggleTheme: () => void;
  setTheme: (theme: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

/**
 * ThemeProvider component
 * Wraps the application to provide theme state and styled-components theming
 */
export const ThemeProvider = ({ children }: ThemeProviderProps) => {
  const [theme, setThemeState] = useState<ThemeMode>('light');

  /**
   * Initialize theme from localStorage on mount
   */
  useEffect(() => {
    const saved = localStorage.getItem('theme') as ThemeMode;
    if (saved === 'light' || saved === 'dark') {
      setThemeState(saved);
    }
  }, []);

  /**
   * Set theme and persist to localStorage
   */
  const setTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  /**
   * Toggle between light and dark themes
   */
  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const currentTheme = theme === 'light' ? lightTheme : darkTheme;
  const muiTheme = useMemo(() => createAppTheme(theme), [theme]);

  const value: ThemeContextType = {
    setTheme,
    theme,
    toggleTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      <MuiThemeProvider theme={muiTheme}>
        <CssBaseline />
        <StyledThemeProvider theme={currentTheme}>{children}</StyledThemeProvider>
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
};

/**
 * useTheme hook
 * Access theme state and methods
 * @throws {Error} if used outside ThemeProvider
 */
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

/**
 * Material UI Theme Configuration
 * Maps semantic design tokens to MUI theme structure
 */
import { createTheme, type ThemeOptions } from '@mui/material/styles';
import { type ThemeMode, tokens } from './tokens/semantic';

export type { ThemeMode };

function paletteFor(mode: ThemeMode) {
  const t = tokens(mode);
  return {
    // Same nudge the styled-components theme uses for `colors.hover` — one
    // token, both consumers. `selected` reuses it too: verified against the
    // `primary.main`-coloured ink every `action.selected` consumer layers on
    // top (icon tiles, chips, avatar initials), it clears AA in both modes
    // where `accent.muted` did not (see task-2-report.md, Fix round 1).
    action: { hover: t.surface.hover, selected: t.surface.hover },
    background: { default: t.surface.base, paper: t.surface.raised },
    divider: t.border.subtle,
    error: { main: t.intent.danger },
    info: { main: t.intent.info },
    // `paletteFor` is already per-mode, so the ink on `accent.primary` is too:
    // `accent.onPrimary` is white in light mode (6.04:1) and near-black in
    // dark (5.63:1). Both clear AA's 4.5:1 body-text floor — the earlier
    // single '#ffffff' could not, because it had to serve both accents at
    // once (3.24:1 in dark). See task-2-report.md, Fix round 4.
    // `dark` is pinned rather than left to MUI's automatic darkening: MUI
    // derives it from `main` alone, with no knowledge of the ink, and it is
    // what `variant="contained"` uses for its hover fill. In dark mode the
    // auto-derived shade (#6157b2) drops `onPrimary` to 3.05:1 — below the
    // body-text floor on every primary CTA's hover state. `accent.primaryHover`
    // keeps it at 4.68:1 while staying a visible step from `main` (1.20:1).
    primary: {
      contrastText: t.accent.onPrimary,
      dark: t.accent.primaryHover,
      main: t.accent.primary,
    },
    // `accent.muted` — same token the styled-components theme's
    // `colors.secondary` reads. It's a *background* role (verified to keep
    // `text.primary` legible on top, in both modes); `contrastText` is set
    // explicitly rather than left to MUI's own threshold-3 heuristic, since
    // we can verify it against our own tokens at AA (4.5). MUI's stock
    // secondary (magenta) was the drift Finding 3 flagged; this keeps both
    // consumers on one value. See task-2-report.md, Fix round 2.
    secondary: { contrastText: t.text.primary, main: t.accent.muted },
    success: { main: t.intent.success },
    text: { primary: t.text.primary, secondary: t.text.secondary },
    warning: { main: t.intent.warning },
  };
}

function createComponentOverrides(): ThemeOptions['components'] {
  return {
    MuiButton: {
      styleOverrides: {
        contained: { '&:hover': { boxShadow: 'none' }, boxShadow: 'none' },
        root: { borderRadius: 12, fontWeight: 500, padding: '10px 20px', textTransform: 'none' },
      },
    },
    MuiCard: {
      styleOverrides: { root: { borderRadius: 12, boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)' } },
    },
    MuiChip: { styleOverrides: { root: { borderRadius: 16 } } },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          '&:hover': { backgroundColor: 'rgba(89, 64, 212, 0.08)' },
          '&.Mui-selected': {
            '& .MuiListItemIcon-root': { color: 'white' },
            '&:hover': { background: 'linear-gradient(135deg, #4a35c0 0%, #6b4ce8 100%)' },
            background: 'linear-gradient(135deg, #5940d4 0%, #7c5dfa 100%)',
            color: 'white',
          },
          borderRadius: 10,
          marginBottom: 8,
        },
      },
    },
    MuiPaper: { styleOverrides: { root: { borderRadius: 12 } } },
    MuiTextField: {
      styleOverrides: { root: { '& .MuiOutlinedInput-root': { borderRadius: 10 } } },
    },
  };
}

export function createAppTheme(mode: ThemeMode) {
  const themeOptions: ThemeOptions = {
    breakpoints: {
      values: { lg: 1280, md: 1024, sm: 768, xl: 1536, xs: 0 },
    },
    components: createComponentOverrides(),
    palette: { mode, ...paletteFor(mode) },
    shadows: [
      'none',
      '0 1px 2px 0 rgba(0, 0, 0, 0.05)', // sm
      '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
      '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
      '0 4px 6px -1px rgba(0, 0, 0, 0.1)', // md
      '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      '0 10px 15px -3px rgba(0, 0, 0, 0.1)', // lg
      '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
      '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
      '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
      '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
      '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
      '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
      '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
      '0 20px 25px -5px rgba(0, 0, 0, 0.1)', // xl
      '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
      '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
      '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
      '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
      '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
      '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
      '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
      '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    ],
    shape: {
      borderRadius: 12, // Updated to 12px for cards and elements
    },
    spacing: 8, // Base unit: 8px (spacing(1) = 8px, spacing(2) = 16px, etc.)
    transitions: {
      duration: {
        complex: 375,
        enteringScreen: 225,
        leavingScreen: 195,
        short: 250,
        shorter: 200,
        shortest: 150,
        standard: 300,
      },
      easing: {
        easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
        easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
        easeOut: 'cubic-bezier(0.0, 0, 0.2, 1)',
        sharp: 'cubic-bezier(0.4, 0, 0.6, 1)',
      },
    },
    typography: {
      body1: {
        fontSize: '1rem',
        fontWeight: 400,
        lineHeight: 1.5,
      },
      body2: {
        fontSize: '0.875rem',
        fontWeight: 400,
        lineHeight: 1.5,
      },
      button: {
        fontSize: '0.875rem',
        fontWeight: 500,
        textTransform: 'none',
      },
      caption: {
        fontSize: '0.75rem',
        fontWeight: 400,
        lineHeight: 1.5,
      },
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      fontSize: 16,
      fontWeightBold: 700,
      fontWeightLight: 300,
      fontWeightMedium: 500,
      fontWeightRegular: 400,
      h1: {
        fontSize: '1.5rem',
        fontWeight: 700,
        lineHeight: 1.2,
      },
      h2: {
        fontSize: '1.25rem',
        fontWeight: 600,
        lineHeight: 1.3,
      },
      h3: {
        fontSize: '1.125rem',
        fontWeight: 600,
        lineHeight: 1.4,
      },
      h4: {
        fontSize: '1rem',
        fontWeight: 600,
        lineHeight: 1.4,
      },
      h5: {
        fontSize: '0.875rem',
        fontWeight: 600,
        lineHeight: 1.5,
      },
      h6: {
        fontSize: '0.75rem',
        fontWeight: 600,
        lineHeight: 1.5,
      },
    },
    zIndex: {
      appBar: 1100,
      drawer: 1200,
      fab: 1050,
      mobileStepper: 1000,
      modal: 1300,
      snackbar: 1400,
      speedDial: 1050,
      tooltip: 1500,
    },
  };

  return createTheme(themeOptions);
}

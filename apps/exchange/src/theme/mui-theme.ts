/**
 * Material UI Theme Configuration
 *
 * Colour comes from the semantic tokens (`./tokens/semantic`), per mode; type,
 * radii, elevation and motion come from `src/styles/tokens.ts`. The component
 * overrides are the "precision instrument" system: Apple-neutral ground, white
 * cards lifted by a soft shadow (a hairline in dark mode), segmented controls
 * with a sliding pill, iOS switches, one indigo accent.
 */
import { createTheme, type ThemeOptions } from '@mui/material/styles';
import {
  chrome,
  focusRing,
  fontFeatures,
  fonts,
  fontWeights,
  layout,
  radii,
  shadows,
  spacingUnit,
  transitions,
  typeScale,
} from '@/styles/tokens';
import { type ThemeMode, tokens } from './tokens/semantic';

export type { ThemeMode };

/** Apple's standard curve: a fast start that settles softly. */
const EASE = 'cubic-bezier(0.32, 0.72, 0, 1)';

function paletteFor(mode: ThemeMode) {
  const t = tokens(mode);
  return {
    // Same nudge the styled-components theme uses for `colors.hover` — one
    // token, both consumers. `selected` reuses it too. Its consumers (the Swap
    // tabs, the DEX market rows, MUI's own selected options) put `text.primary`
    // on it, which clears AA in both modes. Accent ink does not: dark
    // `primary.main` on this fill is 3.76:1, so a selected state that needs an
    // accent label should use `primaryHover` or a surface of its own.
    action: { hover: t.surface.hover, selected: t.surface.hover },
    background: { default: t.surface.base, paper: t.surface.raised },
    divider: t.border.subtle,
    // `contrastText` is the ink that goes *on* the intent fill — the same
    // per-mode role as `accent.onPrimary` (task-2-report.md, Fix round 4).
    // Every intent fill is a light tint in dark mode and a deep shade in
    // light mode, so a hardcoded 'white' clears AA in light but not in dark.
    // `t.intent.on*` inverts per mode instead; all eight clear 4.5:1.
    error: { contrastText: t.intent.onDanger, main: t.intent.danger },
    info: { contrastText: t.intent.onInfo, main: t.intent.info },
    // `paletteFor` is already per-mode, so the ink on `accent.primary` is too:
    // `accent.onPrimary` is white in light mode (6.19:1) and black in dark
    // (5.66:1). Both clear AA's 4.5:1 body-text floor — a single '#ffffff'
    // could not, because it had to serve both accents at once (3.71:1 in
    // dark). See task-2-report.md, Fix round 4.
    // `dark` is pinned rather than left to MUI's automatic darkening: MUI
    // derives it from `main` alone, with no knowledge of the ink, and it is
    // what `variant="contained"` uses for its hover fill. Auto-darkening the
    // dark-mode accent walks it *away* from its black ink; `accent.primaryHover`
    // keeps the ink at AA on hover while staying a visible step from `main`.
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
    success: { contrastText: t.intent.onSuccess, main: t.intent.success },
    text: { primary: t.text.primary, secondary: t.text.secondary },
    warning: { contrastText: t.intent.onWarning, main: t.intent.warning },
  };
}

/**
 * MUI's 25 elevation slots, mapped onto the token ladder. Dark mode resolves
 * every slot to `none`: on black, surfaces separate by hairline, not shadow.
 */
function elevationLadder(mode: ThemeMode): ThemeOptions['shadows'] {
  if (mode === 'dark') return Array.from({ length: 25 }, () => 'none') as ThemeOptions['shadows'];
  return Array.from({ length: 25 }, (_, i) => {
    if (i === 0) return 'none';
    if (i <= 2) return shadows.sm;
    if (i <= 6) return shadows.md;
    if (i <= 12) return shadows.lg;
    return shadows.xl;
  }) as ThemeOptions['shadows'];
}

/**
 * Component overrides — where most of the premium feel is won, because most
 * screens render straight through MUI.
 */
// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: one flat table of per-mode overrides; splitting it would scatter the theme across files
function createComponentOverrides(mode: ThemeMode): ThemeOptions['components'] {
  const isLight = mode === 'light';
  const t = tokens(mode);
  const c = chrome[mode];
  const border = t.border.subtle;
  const strongBorder = t.border.strong;
  const accent = t.accent.primary;
  const accentHover = t.accent.primaryHover;
  const accentTint = t.accent.muted;
  const paper = t.surface.raised;
  const text = t.text.primary;
  const textSecondary = t.text.secondary;
  /** Cards: shadow in light mode, hairline in dark — never both. */
  const cardSurface = isLight
    ? { border: '1px solid transparent', boxShadow: shadows.sm }
    : { border: `1px solid ${border}`, boxShadow: 'none' };
  const popSurface = { border: `1px solid ${c.popBorder}`, boxShadow: c.popShadow };
  const press = {
    '&:active:not(:disabled)': { transform: 'scale(0.97)' },
    transition: `background-color 160ms ${EASE}, color 160ms ${EASE}, box-shadow 160ms ${EASE}, transform 160ms ${EASE}`,
  };
  const focusHalo = { boxShadow: `0 0 0 4px ${c.halo}` };
  /** The segmented track shared by Tabs and ToggleButtonGroup. */
  const segmentTrack = {
    backgroundColor: c.fill,
    borderRadius: radii.md,
    padding: 2,
  };
  const segmentThumb = {
    backgroundColor: c.segmentThumb,
    borderRadius: 8,
    boxShadow: c.segmentThumbShadow,
  };

  return {
    MuiAlert: {
      styleOverrides: {
        icon: { opacity: 1 },
        root: {
          alignItems: 'flex-start',
          border: 'none',
          borderRadius: 12,
          fontSize: typeScale.bodySm.size,
          lineHeight: typeScale.bodySm.lineHeight,
        },
      },
      // MUI 9 dropped the combined `standardError`-style keys; variants match the same props.
      variants: [
        {
          props: { severity: 'error', variant: 'standard' },
          style: { backgroundColor: c.alert.error.bg, color: c.alert.error.fg },
        },
        {
          props: { severity: 'info', variant: 'standard' },
          style: { backgroundColor: accentTint, color: c.alert.info.fg },
        },
        {
          props: { severity: 'success', variant: 'standard' },
          style: { backgroundColor: c.alert.success.bg, color: c.alert.success.fg },
        },
        {
          props: { severity: 'warning', variant: 'standard' },
          style: { backgroundColor: c.alert.warning.bg, color: c.alert.warning.fg },
        },
      ],
    },
    MuiAppBar: {
      defaultProps: { color: 'inherit', elevation: 0 },
      styleOverrides: {
        root: {
          backdropFilter: 'saturate(180%) blur(20px)',
          backgroundColor: c.appBar,
          backgroundImage: 'none',
          borderBottom: `1px solid ${border}`,
          boxShadow: 'none',
        },
      },
    },
    MuiAvatar: {
      styleOverrides: {
        root: { fontSize: typeScale.bodySm.size, fontWeight: fontWeights.semibold },
      },
    },
    MuiBackdrop: {
      styleOverrides: {
        root: {
          '&:not(.MuiBackdrop-invisible)': {
            backdropFilter: 'blur(6px)',
            backgroundColor: c.backdrop,
          },
        },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        contained: {
          '&:hover': { backgroundColor: accentHover, boxShadow: 'none' },
          boxShadow: c.buttonShadow,
        },
        outlined: {
          '&:hover': { backgroundColor: c.fillHover, border: '1px solid transparent' },
          backgroundColor: c.fill,
          border: '1px solid transparent',
          color: text,
        },
        root: {
          ...press,
          '&.Mui-focusVisible': focusHalo,
          // 44px keeps every button at or above the WCAG minimum tap target.
          borderRadius: radii.buttons,
          fontSize: typeScale.body.size,
          fontWeight: fontWeights.medium,
          letterSpacing: typeScale.body.tracking,
          minHeight: layout.minTapTarget,
          padding: '10px 20px',
          textTransform: 'none',
        },
        sizeLarge: {
          borderRadius: 12,
          fontSize: typeScale.bodyLg.size,
          minHeight: 52,
          padding: '14px 28px',
        },
        sizeSmall: { fontSize: typeScale.bodySm.size, minHeight: 32, padding: '6px 14px' },
        text: { '&:hover': { backgroundColor: c.fill }, color: accent },
      },
      // MUI 9 dropped the combined `containedError`-style keys; variants match the same props.
      variants: [
        {
          props: { color: 'error', variant: 'contained' },
          style: { '&:hover': { backgroundColor: c.containedErrorHover } },
        },
        {
          props: { color: 'success', variant: 'contained' },
          style: { '&:hover': { backgroundColor: c.containedSuccessHover } },
        },
        // Outlined buttons sit on the translucent `fill`, where the intent hue
        // itself falls under AA (dark error: 3.75:1, 3.37:1 hovered), so their
        // label takes the intent's deep ink from the alert set instead.
        { props: { color: 'error', variant: 'outlined' }, style: { color: c.alert.error.fg } },
        { props: { color: 'success', variant: 'outlined' }, style: { color: c.alert.success.fg } },
      ],
    },
    MuiButtonBase: {
      // No ink ripple anywhere: presses answer with scale and tint instead.
      defaultProps: { disableRipple: true },
    },
    MuiCard: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          ...cardSurface,
          backgroundColor: paper,
          backgroundImage: 'none',
          borderRadius: radii.cards,
          transition: `box-shadow 240ms ${EASE}, transform 240ms ${EASE}`,
        },
      },
    },
    MuiCardContent: {
      styleOverrides: {
        /*
         * One card padding for the whole application, matching the 24px page
         * rhythm so a card's inside and the space around it agree.
         *
         * Pages must not override this with `sx={{ p: n }}`. MUI's own
         * `:last-child` rule is more specific than an sx class, so overriding
         * the shorthand changed three sides and left the fourth at the theme
         * value. A card that genuinely needs different padding must set
         * `&:last-child` too.
         */
        root: {
          '&:last-child': { paddingBottom: 'clamp(16px, 4vw, 24px)' },
          padding: 'clamp(16px, 4vw, 24px)',
        },
      },
    },
    MuiCheckbox: {
      styleOverrides: {
        root: { '&.Mui-checked': { color: accent }, borderRadius: 6, color: strongBorder },
      },
    },
    MuiChip: {
      styleOverrides: {
        label: { paddingLeft: 10, paddingRight: 10 },
        outlined: { borderColor: border },
        root: {
          borderRadius: radii.tags,
          fontSize: typeScale.caption.size,
          fontWeight: fontWeights.medium,
          height: 24,
          letterSpacing: typeScale.caption.tracking,
        },
        sizeSmall: { height: 20 },
      },
      // Only the neutral chip takes the translucent fill. A coloured chip keeps
      // its intent fill, because its label is that intent's `on*` ink — white on
      // a grey wash is 1.15:1.
      variants: [
        { props: { color: 'default', variant: 'filled' }, style: { backgroundColor: c.fill } },
      ],
    },
    MuiContainer: {
      styleOverrides: {
        root: {
          paddingLeft: 'clamp(16px, 4vw, 24px)',
          paddingRight: 'clamp(16px, 4vw, 24px)',
        },
      },
    },
    MuiCssBaseline: {
      styleOverrides: {
        '::selection': { backgroundColor: c.halo },
        body: {
          fontFeatureSettings: fontFeatures,
          MozOsxFontSmoothing: 'grayscale',
          overflowX: 'hidden',
          textRendering: 'optimizeLegibility',
          WebkitFontSmoothing: 'antialiased',
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          ...popSurface,
          backgroundImage: 'none',
          borderRadius: 20,
          boxShadow: isLight ? shadows.xl : c.popShadow,
          // Dialogs must fit small screens with a margin, never bleed off-screen.
          margin: 16,
          maxHeight: 'calc(100% - 32px)',
          width: 'calc(100% - 32px)',
        },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          fontSize: typeScale.subheading.size,
          fontWeight: fontWeights.semibold,
          letterSpacing: typeScale.subheading.tracking,
          padding: '20px 24px 8px',
        },
      },
    },
    MuiDivider: { styleOverrides: { root: { borderColor: border } } },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundImage: 'none',
          borderRight: `1px solid ${border}`,
          boxShadow: 'none',
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          ...press,
          '&:hover': { backgroundColor: c.fill },
          '&.Mui-focusVisible': focusHalo,
          borderRadius: radii.md,
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          '&.Mui-focused': { color: accent },
          color: textSecondary,
          fontWeight: fontWeights.medium,
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        bar: { borderRadius: radii.tags },
        root: { backgroundColor: c.fill, borderRadius: radii.tags, height: 6 },
      },
    },
    MuiLink: {
      defaultProps: { underline: 'hover' },
      styleOverrides: {
        root: { '&:hover': { color: accentHover }, color: accent, textUnderlineOffset: '3px' },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          '&:hover': { backgroundColor: c.fill },
          '&.Mui-selected': {
            '& .MuiListItemIcon-root': { color: accent },
            '&:hover': { backgroundColor: accentTint },
            backgroundColor: accentTint,
            color: accent,
          },
          borderRadius: radii.md,
          marginBottom: 2,
          minHeight: layout.minTapTarget,
          transition: `background-color 160ms ${EASE}`,
        },
      },
    },
    MuiMenu: {
      styleOverrides: {
        list: { padding: 6 },
        paper: {
          ...popSurface,
          backgroundImage: 'none',
          borderRadius: 14,
          marginTop: 6,
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          '&:hover': { backgroundColor: c.fill },
          '&.Mui-selected': { backgroundColor: accentTint },
          borderRadius: 8,
          fontSize: typeScale.body.size,
          minHeight: 40,
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        input: { '&::placeholder': { color: textSecondary, opacity: 0.8 }, padding: '11px 14px' },
        notchedOutline: { borderColor: strongBorder, transition: `border-color 160ms ${EASE}` },
        root: {
          '&:hover:not(.Mui-focused) .MuiOutlinedInput-notchedOutline': {
            borderColor: c.inputHoverBorder,
          },
          '&.Mui-focused': focusHalo,
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: accent, borderWidth: 1 },
          backgroundColor: c.inputBg,
          borderRadius: radii.inputs,
          transition: `box-shadow 160ms ${EASE}`,
        },
      },
    },
    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        outlined: { borderColor: border },
        root: { backgroundImage: 'none', borderRadius: radii.cards },
      },
    },
    MuiPopover: {
      styleOverrides: { paper: { ...popSurface, borderRadius: 14 } },
    },
    MuiSkeleton: {
      defaultProps: { animation: 'wave' },
      styleOverrides: {
        root: { backgroundColor: c.fill, borderRadius: 8 },
        wave: {
          '&::after': {
            background: `linear-gradient(90deg, transparent, ${c.skeletonWave}, transparent)`,
          },
        },
      },
    },
    MuiSnackbarContent: {
      styleOverrides: {
        root: {
          ...popSurface,
          backdropFilter: 'blur(20px)',
          backgroundColor: c.snackbar,
          borderRadius: 14,
        },
      },
    },
    MuiSwitch: {
      // iOS switch: a 51x31 track with a floating thumb that springs across.
      styleOverrides: {
        root: { height: 31, margin: 4, overflow: 'visible', padding: 0, width: 51 },
        switchBase: {
          '&.Mui-checked': {
            '& + .MuiSwitch-track': { backgroundColor: accent, opacity: 1 },
            color: c.switchThumb,
            transform: 'translateX(20px)',
          },
          '&.Mui-disabled + .MuiSwitch-track': { opacity: 0.4 },
          '&.Mui-focusVisible .MuiSwitch-thumb': { outline: `3px solid ${c.halo}` },
          margin: 2,
          padding: 0,
          transition: `transform 240ms ${EASE}`,
        },
        thumb: {
          boxShadow: c.switchThumbShadow,
          color: c.switchThumb,
          height: 27,
          width: 27,
        },
        track: {
          backgroundColor: c.switchTrack,
          borderRadius: 16,
          opacity: 1,
          transition: `background-color 240ms ${EASE}`,
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          '&.Mui-focusVisible': { outline: `2px solid ${c.halo}` },
          '&.Mui-selected': { color: text },
          borderRadius: 8,
          color: textSecondary,
          fontSize: typeScale.bodySm.size,
          fontWeight: fontWeights.medium,
          minHeight: 32,
          minWidth: 0,
          padding: '6px 14px',
          position: 'relative',
          textTransform: 'none',
          transition: `color 200ms ${EASE}`,
          zIndex: 1,
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          color: textSecondary,
          fontSize: typeScale.caption.size,
          fontWeight: fontWeights.medium,
        },
        root: {
          borderBottom: `1px solid ${border}`,
          fontSize: typeScale.bodySm.size,
          fontVariantNumeric: 'tabular-nums',
          padding: '12px 16px',
        },
      },
    },
    MuiTableContainer: {
      styleOverrides: { root: { maxWidth: '100%', overflowX: 'auto' } },
    },
    MuiTableRow: {
      styleOverrides: {
        root: { '&.MuiTableRow-hover:hover': { backgroundColor: c.rowHover } },
      },
    },
    MuiTabs: {
      /*
       * Every tab strip is a segmented control: a translucent track with the
       * selection riding on a raised pill. MUI already animates the indicator
       * between tabs, so the pill slides on its own.
       */
      styleOverrides: {
        indicator: { ...segmentThumb, height: '100%', transition: `all 320ms ${EASE}`, zIndex: 0 },
        // `list` is MUI 9's name for the old `flexContainer` slot.
        list: { gap: 2 },
        root: ({ ownerState }) => ({
          ...segmentTrack,
          alignSelf: 'flex-start',
          maxWidth: '100%',
          minHeight: 0,
          width: ownerState.variant === 'fullWidth' ? '100%' : 'fit-content',
        }),
        scroller: { borderRadius: 8 },
      },
    },
    MuiTextField: {
      defaultProps: { size: 'small' },
      styleOverrides: { root: { '& .MuiOutlinedInput-root': { borderRadius: radii.inputs } } },
    },
    MuiToggleButton: {
      styleOverrides: {
        root: {
          '&:hover': { backgroundColor: 'transparent', color: text },
          '&.Mui-selected, &.Mui-selected:hover': { ...segmentThumb, color: text },
          border: 'none',
          borderRadius: '8px !important',
          color: textSecondary,
          fontSize: typeScale.bodySm.size,
          fontWeight: fontWeights.medium,
          minHeight: 32,
          padding: '6px 14px',
          textTransform: 'none',
          transition: `background-color 200ms ${EASE}, color 200ms ${EASE}, box-shadow 200ms ${EASE}`,
        },
      },
    },
    MuiToggleButtonGroup: {
      styleOverrides: {
        grouped: { border: 'none', margin: 0 },
        root: { ...segmentTrack, gap: 2 },
      },
    },
    MuiTooltip: {
      defaultProps: { arrow: false, enterDelay: 400 },
      styleOverrides: {
        tooltip: {
          backdropFilter: 'blur(20px)',
          backgroundColor: c.tooltip,
          borderRadius: 8,
          fontSize: typeScale.caption.size,
          fontWeight: fontWeights.medium,
          padding: '6px 10px',
        },
      },
    },
  };
}

/**
 * Type scale for MUI. Headings are fluid so they stay inside narrow viewports
 * without per-breakpoint overrides at every call site.
 */
const typography: ThemeOptions['typography'] = {
  body1: {
    fontSize: typeScale.body.size,
    fontWeight: fontWeights.regular,
    letterSpacing: typeScale.body.tracking,
    lineHeight: typeScale.body.lineHeight,
  },
  body2: {
    fontSize: typeScale.bodySm.size,
    fontWeight: fontWeights.regular,
    letterSpacing: typeScale.bodySm.tracking,
    lineHeight: typeScale.bodySm.lineHeight,
  },
  button: {
    fontSize: typeScale.body.size,
    fontWeight: fontWeights.medium,
    letterSpacing: typeScale.bodySm.tracking,
    textTransform: 'none',
  },
  caption: {
    fontSize: typeScale.caption.size,
    fontWeight: fontWeights.regular,
    letterSpacing: typeScale.caption.tracking,
    lineHeight: typeScale.caption.lineHeight,
  },
  fontFamily: fonts.main,
  fontSize: typeScale.body.size,
  fontWeightBold: fontWeights.semibold,
  fontWeightLight: fontWeights.light,
  fontWeightMedium: fontWeights.medium,
  fontWeightRegular: fontWeights.regular,
  h1: {
    fontSize: `clamp(32px, 5vw, ${typeScale.display.size}px)`,
    fontWeight: fontWeights.semibold,
    letterSpacing: typeScale.display.tracking,
    lineHeight: typeScale.display.lineHeight,
  },
  h2: {
    fontSize: `clamp(28px, 4vw, ${typeScale.headingLg.size}px)`,
    fontWeight: fontWeights.semibold,
    letterSpacing: typeScale.headingLg.tracking,
    lineHeight: typeScale.headingLg.lineHeight,
  },
  h3: {
    fontSize: `clamp(24px, 3vw, ${typeScale.heading.size}px)`,
    fontWeight: fontWeights.semibold,
    letterSpacing: typeScale.heading.tracking,
    lineHeight: typeScale.heading.lineHeight,
  },
  h4: {
    fontSize: `clamp(20px, 2.4vw, ${typeScale.headingSm.size}px)`,
    fontWeight: fontWeights.semibold,
    letterSpacing: typeScale.headingSm.tracking,
    lineHeight: typeScale.headingSm.lineHeight,
  },
  h5: {
    fontSize: typeScale.subheading.size,
    fontWeight: fontWeights.semibold,
    letterSpacing: typeScale.subheading.tracking,
    lineHeight: typeScale.subheading.lineHeight,
  },
  h6: {
    fontSize: typeScale.bodyLg.size,
    fontWeight: fontWeights.semibold,
    letterSpacing: typeScale.bodyLg.tracking,
    lineHeight: typeScale.bodyLg.lineHeight,
  },
  overline: {
    fontSize: typeScale.caption.size,
    fontWeight: fontWeights.regular,
    letterSpacing: '0.5px',
    lineHeight: typeScale.caption.lineHeight,
    textTransform: 'uppercase',
  },
  subtitle1: {
    fontSize: typeScale.body.size,
    fontWeight: fontWeights.regular,
    letterSpacing: typeScale.body.tracking,
    lineHeight: 1.4,
  },
  subtitle2: {
    fontSize: typeScale.bodySm.size,
    fontWeight: fontWeights.medium,
    letterSpacing: typeScale.bodySm.tracking,
    lineHeight: typeScale.bodySm.lineHeight,
  },
};

export function createAppTheme(mode: ThemeMode) {
  const themeOptions: ThemeOptions = {
    // The app's responsive layout (the mobile shell switch in particular) is
    // built on `sm` at 768px, so these stay as they are rather than following
    // the `breakpoints` token's 600px `sm`.
    breakpoints: {
      values: { lg: 1280, md: 1024, sm: 768, xl: 1536, xs: 0 },
    },
    components: createComponentOverrides(mode),
    palette: { mode, ...paletteFor(mode) },
    shadows: elevationLadder(mode),
    // Matches the control step of the radius scale; surfaces override upward.
    shape: { borderRadius: 10 },
    spacing: spacingUnit,
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
        easeInOut: EASE,
        easeOut: 'cubic-bezier(0.22, 1, 0.36, 1)',
        sharp: 'cubic-bezier(0.4, 0, 0.6, 1)',
      },
    },
    typography,
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

/** Re-exported so non-MUI call sites can reuse the same values. */
export { focusRing, transitions };

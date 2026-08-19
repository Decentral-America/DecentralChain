import { Apps } from '@mui/icons-material';
import { Box, ButtonBase, Tooltip, Typography, useTheme } from '@mui/material';
import { type ReactNode } from 'react';
import { NavLink, useLocation } from 'react-router';
import Logo from '@/components/atoms/Logo';
import { isCurrent, TOP_TABS } from '@/layouts/shell/navigation';
import { radii } from '@/styles/tokens';
import { tokens } from '@/theme/tokens/semantic';

/**
 * The application's top bar.
 *
 * Three zones: identity on the left, the primary destinations centred, account
 * controls on the right. Centring the tabs is what separates this from a
 * document header — the navigation is the middle of the chrome, not an
 * afterthought pushed against the logo.
 *
 * The tabs sit in a tinted track with the current one raised on a pill. That
 * reads as a physical selection rather than an underline, and it survives
 * being glanced at.
 *
 * ## Why the surfaces here are tokens, not `palette.*`
 *
 * `styles/tokens.ts`' `palette` is a flat constant table with **no mode
 * dimension** — `shellCanvas`, `frost` and `periwinkleWash` are single hex
 * values that never move. Used as a *fill* under this file's mode-aware ink
 * (`text.secondary`, `text.primary`, `primary.main`) they behave exactly like
 * hex literals, and in dark mode the pairing collapsed: the track measured
 * 1.75:1 for a resting tab label, 1.05:1 on hover, and `NetworkTag` 2.71:1.
 * That is the whole primary navigation, on all fifteen authenticated routes.
 *
 * The track/pill relationship is what carries the selection, so it is
 * expressed as a *relationship between surface roles* — a `sunken` track with
 * a `raised` pill on it — which holds its shape in either mode instead of
 * depending on one mode's literals.
 */

export function TabRail({ onOpenLauncher }: { onOpenLauncher: () => void }) {
  const { pathname } = useLocation();
  const t = tokens(useTheme().palette.mode);

  return (
    <Box
      component="nav"
      aria-label="Primary"
      sx={{
        // The track is a well the pill sits in: `surface.sunken`, per mode.
        bgcolor: t.surface.sunken,
        borderRadius: radii.tags,
        display: { md: 'flex', xs: 'none' },
        gap: 0.5,
        p: 0.5,
      }}
    >
      {TOP_TABS.map((tab) => {
        const active = isCurrent(tab, pathname);
        return (
          <Box
            key={tab.path}
            component={NavLink}
            to={tab.path}
            aria-current={active ? 'page' : undefined}
            sx={{
              '&:hover': { color: 'text.primary' },
              // The raised pill is the selection; everything else is the track.
              // The pill's *fill* is what identifies it (18.24:1 light /
              // 16.96:1 dark against its own label); the hairline only softens
              // its edge, so it is `border.subtle` rather than a value chosen
              // to carry the selection on its own.
              bgcolor: active ? 'background.paper' : 'transparent',
              border: active ? `1px solid ${t.border.subtle}` : '1px solid transparent',
              borderRadius: radii.tags,
              color: active ? 'text.primary' : 'text.secondary',
              fontSize: 14,
              lineHeight: 1,
              px: 2.25,
              py: 1.25,
              textDecoration: 'none',
              transition: 'background-color 160ms ease, color 160ms ease',
              whiteSpace: 'nowrap',
            }}
          >
            {tab.label}
          </Box>
        );
      })}

      {/*
        The launcher trigger sits in the track like a fifth tab, but it opens
        the whole product rather than one screen. Named after the promise the
        landing page makes: everything the network can do.
      */}
      <ButtonBase
        onClick={onOpenLauncher}
        aria-haspopup="dialog"
        sx={{
          '&:hover': { color: 'text.primary' },
          alignItems: 'center',
          borderRadius: radii.tags,
          color: 'text.secondary',
          display: 'flex',
          fontSize: 14,
          gap: 0.75,
          lineHeight: 1,
          px: 2.25,
          py: 1.25,
          transition: 'color 160ms ease',
          whiteSpace: 'nowrap',
        }}
      >
        <Apps sx={{ fontSize: 16 }} />
        Everything
      </ButtonBase>
    </Box>
  );
}

/**
 * A circular chrome control. Round, where the application's operable controls
 * are square: these are chrome affordances, not part of any form.
 */
export function RoundAction({
  label,
  onClick,
  children,
  filled = false,
}: {
  label: string;
  onClick?: (event: React.MouseEvent<HTMLElement>) => void;
  children: ReactNode;
  /** The account control, which carries the brand rather than an outline. */
  filled?: boolean;
}) {
  const t = tokens(useTheme().palette.mode);
  return (
    <Tooltip title={label}>
      <ButtonBase
        aria-label={label}
        onClick={onClick}
        sx={{
          '& svg': { fontSize: 19 },
          '&:hover': { bgcolor: filled ? 'primary.dark' : 'action.hover' },
          bgcolor: filled ? 'primary.main' : 'transparent',
          border: filled ? 'none' : `1px solid ${t.border.subtle}`,
          borderRadius: '50%',
          color: filled ? 'primary.contrastText' : 'text.secondary',
          flexShrink: 0,
          height: 40,
          transition: 'background-color 160ms ease',
          width: 40,
        }}
      >
        {children}
      </ButtonBase>
    </Tooltip>
  );
}

export function AppTopBar({
  actions,
  onOpenLauncher,
}: {
  actions: ReactNode;
  onOpenLauncher: () => void;
}) {
  return (
    <Box
      component="header"
      sx={{
        alignItems: 'center',
        // Opaque, because content passes underneath it once pinned.
        bgcolor: 'background.paper',
        display: 'flex',
        gap: 2,
        justifyContent: 'space-between',
        pb: 2.5,
        position: 'sticky',
        pt: { lg: 3, xs: 2 },
        // Sits above the rail, which is pinned too.
        px: { lg: 3, xs: 2 },
        top: 0,
        zIndex: 2,
      }}
    >
      <Box sx={{ alignItems: 'center', display: 'flex', flex: '1 1 0', minWidth: 0 }}>
        <Logo sx={{ height: 30 }} />
      </Box>

      <TabRail onOpenLauncher={onOpenLauncher} />

      <Box
        sx={{
          alignItems: 'center',
          display: 'flex',
          flex: '1 1 0',
          gap: 1,
          justifyContent: 'flex-end',
          minWidth: 0,
        }}
      >
        {actions}
      </Box>
    </Box>
  );
}

/**
 * Small tinted label for the connected network.
 *
 * The plate was `palette.periwinkleWash` (`#e8e9ff`, no mode dimension) under
 * mode-aware `primary.main` — 2.71:1 in dark. `action.selected` is the tinted
 * plate role the rest of the app already pairs with `primary.main` ink and
 * which `mui-theme.ts` documents as verified in both modes (4.85:1 light /
 * 5.05:1 dark); `accent.muted`, the other candidate, is the pairing that
 * comment records as having *failed* here (3.23:1 dark).
 */
export function NetworkTag({ network }: { network: string }) {
  return (
    <Typography
      sx={{
        bgcolor: 'action.selected',
        borderRadius: radii.tags,
        color: 'primary.main',
        display: { lg: 'block', xs: 'none' },
        fontSize: 12,
        px: 1.5,
        py: 0.75,
      }}
    >
      {network}
    </Typography>
  );
}

import { Apps } from '@mui/icons-material';
import { Box, ButtonBase, Tooltip, useTheme } from '@mui/material';
import { motion } from 'motion/react';
import { type ReactNode } from 'react';
import { NavLink, useLocation } from 'react-router';
import Logo from '@/components/atoms/Logo';
import { StatusPill } from '@/components/premium';
import { isCurrent, TOP_TABS } from '@/layouts/shell/navigation';
import { chrome, materials, radii, spring } from '@/styles/tokens';
import { tokens } from '@/theme/tokens/semantic';

/**
 * The application's top bar.
 *
 * Three zones: identity on the left, the primary destinations centred, account
 * controls on the right. Centring the tabs is what separates this from a
 * document header — the navigation is the middle of the chrome, not an
 * afterthought pushed against the logo.
 *
 * The tabs sit in a track with the current one raised on a pill that springs
 * between destinations (a shared-layout animation), so moving between screens
 * reads as one physical selection sliding, not a repaint.
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
 * expressed as a *relationship between roles* — a `sunken` track with the
 * system's segmented thumb on it — which holds its shape in either mode
 * instead of depending on one mode's literals.
 */

export function TabRail({ onOpenLauncher }: { onOpenLauncher: () => void }) {
  const { pathname } = useLocation();
  const mode = useTheme().palette.mode;
  const t = tokens(mode);
  const material = chrome[mode];

  return (
    <Box
      component="nav"
      aria-label="Primary"
      sx={{
        /*
         * The track is a well the pill sits in: `surface.sunken`, per mode.
         * Opaque on purpose, although the bar around it is translucent: the
         * resting labels are measured against this fill, and a translucent
         * control fill would let whatever scrolls under the bar decide their
         * contrast (over a plain ground it already sits near 4.3:1 in light).
         */
        bgcolor: t.surface.sunken,
        borderRadius: radii.tags,
        display: { md: 'flex', xs: 'none' },
        gap: 0.25,
        p: '3px',
      }}
    >
      {TOP_TABS.map((tab) => {
        const active = isCurrent(tab, pathname);
        return (
          <Box
            key={tab.path}
            component={NavLink}
            to={tab.path}
            onMouseEnter={tab.path === '/desktop/dex' ? preloadDex : undefined}
            onFocus={tab.path === '/desktop/dex' ? preloadDex : undefined}
            aria-current={active ? 'page' : undefined}
            sx={{
              '&:active': { transform: 'scale(0.97)' },
              '&:hover': { color: 'text.primary' },
              borderRadius: radii.tags,
              color: active ? 'text.primary' : 'text.secondary',
              fontSize: 13,
              fontWeight: 500,
              lineHeight: 1,
              position: 'relative',
              px: 2,
              py: 1.125,
              textDecoration: 'none',
              transition:
                'color 200ms cubic-bezier(0.32, 0.72, 0, 1), transform 160ms cubic-bezier(0.32, 0.72, 0, 1)',
              whiteSpace: 'nowrap',
            }}
          >
            {active ? (
              /*
               * The raised pill is the selection; everything else is the track.
               * Its fill is the system's segmented thumb, which carries the
               * label at 16.9:1 light / 5.5:1 dark.
               */
              <Box
                component={motion.span}
                layoutId="top-tab-pill"
                transition={spring}
                aria-hidden
                sx={{
                  bgcolor: material.thumb,
                  borderRadius: radii.tags,
                  boxShadow: material.thumbShadow,
                  inset: 0,
                  position: 'absolute',
                  zIndex: 0,
                }}
              />
            ) : null}
            <Box component="span" sx={{ position: 'relative', zIndex: 1 }}>
              {tab.label}
            </Box>
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
          fontSize: 13,
          fontWeight: 500,
          gap: 0.75,
          lineHeight: 1,
          px: 2,
          py: 1.125,
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
  const material = chrome[useTheme().palette.mode];
  return (
    <Tooltip title={label}>
      <ButtonBase
        aria-label={label}
        onClick={onClick}
        sx={{
          '& svg': { fontSize: 19 },
          '&:active': { transform: 'scale(0.94)' },
          '&:hover': {
            bgcolor: filled ? 'primary.dark' : 'action.hover',
            color: filled ? 'primary.contrastText' : 'text.primary',
          },
          '&.Mui-focusVisible': { boxShadow: `0 0 0 3px ${material.haloStrong}` },
          bgcolor: filled ? 'primary.main' : 'transparent',
          borderRadius: '50%',
          // `contrastText` is the per-mode ink for the accent: white on the
          // deep light-mode indigo, near-black on the light dark-mode one.
          color: filled ? 'primary.contrastText' : 'text.secondary',
          flexShrink: 0,
          height: 36,
          transition:
            'background-color 160ms cubic-bezier(0.32, 0.72, 0, 1), color 160ms cubic-bezier(0.32, 0.72, 0, 1), transform 160ms cubic-bezier(0.32, 0.72, 0, 1)',
          width: 36,
        }}
      >
        {children}
      </ButtonBase>
    </Tooltip>
  );
}

/**
 * Warm the terminal's chunk on intent. The Dex carries the charting stack and
 * is the heaviest route; fetching it while the pointer is still travelling to
 * the tab means the click lands on code that is already here.
 */
const preloadDex = () => {
  void import('@/pages/Dex');
};

export function AppTopBar({
  actions,
  onOpenLauncher,
}: {
  actions: ReactNode;
  onOpenLauncher: () => void;
}) {
  const material = chrome[useTheme().palette.mode];

  return (
    <Box
      component="header"
      sx={{
        alignItems: 'center',
        // Vibrancy material: content scrolls under it and reads through, blurred.
        backdropFilter: materials.filter,
        bgcolor: material.appBar,
        borderBottom: '1px solid',
        borderColor: 'divider',
        display: 'flex',
        gap: 2,
        height: 64,
        justifyContent: 'space-between',
        left: 0,
        // Floats over the scrolling column, which pads its top to clear it.
        position: 'absolute',
        px: { lg: 4, xs: 2 },
        right: 0,
        top: 0,
        WebkitBackdropFilter: materials.filter,
        zIndex: 10,
      }}
    >
      <Box sx={{ alignItems: 'center', display: 'flex', flex: '1 1 0', minWidth: 0 }}>
        <Logo sx={{ height: 26 }} />
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
 * Live pill for the connected network.
 *
 * The label stays the network id as given (`mainnet`) and is capitalised in
 * CSS, so what assistive tech and tests read is the id itself.
 */
export function NetworkTag({ network }: { network: string }) {
  return (
    <Box sx={{ display: { lg: 'block', xs: 'none' }, textTransform: 'capitalize' }}>
      <StatusPill tone="success" live>
        {network}
      </StatusPill>
    </Box>
  );
}

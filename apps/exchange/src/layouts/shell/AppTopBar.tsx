import { Apps } from '@mui/icons-material';
import { Box, ButtonBase, Tooltip, Typography } from '@mui/material';
import { type ReactNode } from 'react';
import { NavLink, useLocation } from 'react-router';
import Logo from '@/components/atoms/Logo';
import { isCurrent, TOP_TABS } from '@/layouts/shell/navigation';
import { palette, radii } from '@/styles/tokens';

/**
 * The application's top bar.
 *
 * Three zones: identity on the left, the primary destinations centred, account
 * controls on the right. Centring the tabs is what separates this from a
 * document header — the navigation is the middle of the chrome, not an
 * afterthought pushed against the logo.
 *
 * The tabs sit in a tinted track with the current one raised on a white pill.
 * That reads as a physical selection rather than an underline, and it survives
 * being glanced at.
 */

export function TabRail({ onOpenLauncher }: { onOpenLauncher: () => void }) {
  const { pathname } = useLocation();

  return (
    <Box
      component="nav"
      aria-label="Primary"
      sx={{
        bgcolor: palette.shellCanvas,
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
              bgcolor: active ? 'background.paper' : 'transparent',
              border: active ? `1px solid ${palette.frost}` : '1px solid transparent',
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
  return (
    <Tooltip title={label}>
      <ButtonBase
        aria-label={label}
        onClick={onClick}
        sx={{
          '& svg': { fontSize: 19 },
          '&:hover': { bgcolor: filled ? 'primary.dark' : 'action.hover' },
          bgcolor: filled ? 'primary.main' : 'transparent',
          border: filled ? 'none' : `1px solid ${palette.frost}`,
          borderRadius: '50%',
          color: filled ? palette.pureWhite : 'text.secondary',
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

/** Small tinted label for the connected network. */
export function NetworkTag({ network }: { network: string }) {
  return (
    <Typography
      sx={{
        bgcolor: palette.periwinkleWash,
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

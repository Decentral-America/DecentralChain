import { Box, ButtonBase, Dialog, Typography, useTheme } from '@mui/material';
import { useNavigate } from 'react-router';
import { type Destination, isCurrent, LAUNCHER_GROUPS } from '@/layouts/shell/navigation';
import { radii } from '@/styles/tokens';
import { tokens } from '@/theme/tokens/semantic';

/**
 * The launcher.
 *
 * Every destination in the application on one surface, the way an OS shows its
 * applications: icon cards on shelves, grouped by what they are for. It exists
 * so the top bar can stay four tabs — the launcher absorbs the tail of the
 * navigation instead of the chrome wearing all eleven destinations at once.
 *
 * It keeps the landing's voice — the mark beside the display-caps title, the
 * annotation-mono shelf labels — but in the application's own register, so the
 * modal belongs to the product it opens over rather than dimming it with a
 * second theme. The current screen carries the filled indigo plate.
 *
 * It is a modal rather than a menu because it is a place, not a list: open it,
 * see the whole product, go somewhere. Escape and backdrop close it; picking a
 * destination navigates and closes.
 *
 * ## Surfaces are roles, not `palette.*` constants
 *
 * `styles/tokens.ts`' `palette` has no mode dimension, so using it as a fill
 * under this file's mode-aware ink made the launcher unreadable in dark mode:
 * the dialog paper at 1.05:1 against its own title, the card `&:hover` at
 * 1.04:1, the inactive icon plate at 2.71:1. Two of those were
 * *half-conversions* — `bgcolor: active ? 'primary.main' : periwinkleWash` and
 * a tokenized rest state whose `&:hover` sibling stayed a literal — which is
 * the shape to watch for: converting the branch you happen to be looking at
 * leaves the other one worse than before, because the pair no longer moves
 * together.
 *
 * So it is expressed as a stack of surface roles: `surface.base` ground,
 * `surface.raised` cards on it, `surface.hover` when one is pointed at. The
 * arrangement survives a mode swap because it never named a colour.
 */

function LauncherCard({
  destination,
  active,
  onNavigate,
}: {
  destination: Destination;
  active: boolean;
  onNavigate: (path: string) => void;
}) {
  const t = tokens(useTheme().palette.mode);
  return (
    <ButtonBase
      onClick={() => onNavigate(destination.path)}
      aria-current={active ? 'page' : undefined}
      sx={{
        // Rest and hover move together, per mode — the pair that was
        // half-converted last time.
        '&:hover': {
          bgcolor: 'action.hover',
          borderColor: t.accent.primary,
        },
        alignItems: 'flex-start',
        bgcolor: 'background.paper',
        border: `1px solid ${active ? t.accent.primary : t.border.subtle}`,
        borderRadius: radii.cards,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        justifyContent: 'flex-start',
        p: 2.5,
        textAlign: 'left',
        transition: 'background-color 160ms ease, border-color 160ms ease',
        width: '100%',
      }}
    >
      <Box
        aria-hidden="true"
        sx={{
          '& svg': { fontSize: 20 },
          alignItems: 'center',
          /*
           * Both branches, per mode. The inactive plate was
           * `palette.periwinkleWash` while its active sibling had already been
           * tokenized — 2.71:1 in dark. `action.selected` is the tinted-plate
           * role `mui-theme.ts` documents as verified against `primary.main`
           * ink in both modes (4.85:1 light / 5.05:1 dark), and specifically
           * records `accent.muted` as the pairing that failed there.
           */
          bgcolor: active ? 'primary.main' : 'action.selected',
          borderRadius: radii.md,
          color: active ? 'primary.contrastText' : 'primary.main',
          display: 'flex',
          height: 40,
          justifyContent: 'center',
          mb: 1.5,
          width: 40,
        }}
      >
        {destination.icon}
      </Box>

      <Typography sx={{ color: 'text.primary', fontSize: 15 }}>{destination.label}</Typography>
      <Typography sx={{ color: 'text.secondary', fontSize: 13, lineHeight: 1.45, mt: 0.5 }}>
        {destination.description}
      </Typography>
    </ButtonBase>
  );
}

export function AppLauncher({
  open,
  onClose,
  pathname,
}: {
  open: boolean;
  onClose: () => void;
  pathname: string;
}) {
  const navigate = useNavigate();
  const mode = useTheme().palette.mode;
  const isDark = mode === 'dark';
  const t = tokens(mode);

  const go = (path: string) => {
    onClose();
    void navigate(path);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      aria-label="All features"
      slotProps={{
        paper: {
          sx: {
            // The ground the cards are raised off, per mode.
            bgcolor: t.surface.base,
            borderRadius: radii.shell,
            boxShadow: 'none',
            overflow: 'hidden',
            position: 'relative',
          },
        },
      }}
    >
      <Box sx={{ p: { sm: 4, xs: 3 } }}>
        {/* The brand's front-door voice: mark, then the promise as a title. */}
        <Box sx={{ alignItems: 'center', display: 'flex', gap: 1.5, mb: 3 }}>
          <Box
            component="img"
            // The mark ships in two cuts, and the dialog ground moves with
            // the mode, so the mark has to as well — a light-ground mark on
            // the dark dialog reads as a pale square.
            src={isDark ? '/brand/mark-on-dark.png' : '/brand/mark-on-light.png'}
            alt=""
            aria-hidden="true"
            sx={{ height: 28, width: 28 }}
          />
          <Typography
            component="h1"
            sx={{
              color: 'text.primary',
              fontSize: 22,
              fontWeight: 700,
              letterSpacing: '-0.02em',
              textTransform: 'uppercase',
            }}
          >
            Everything
          </Typography>
        </Box>

        {LAUNCHER_GROUPS.map((group, index) => (
          <Box key={group.title} sx={{ mt: index === 0 ? 0 : 4 }}>
            {/* The annotation voice the rest of the product uses for group names. */}
            <Typography
              component="h2"
              sx={{
                // Metadata voice — `text.tertiary` is that role with a mode
                // dimension; `palette.steel` was the same intent without one.
                color: t.text.tertiary,
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                fontSize: 12,
                letterSpacing: '0.15em',
                mb: 1.5,
                textTransform: 'uppercase',
              }}
            >
              {group.title}
            </Typography>

            <Box
              sx={{
                display: 'grid',
                gap: 1.5,
                gridTemplateColumns: 'repeat(auto-fill, minmax(min(200px, 100%), 1fr))',
              }}
            >
              {group.items.map((destination) => (
                <LauncherCard
                  key={destination.path}
                  destination={destination}
                  active={isCurrent(destination, pathname)}
                  onNavigate={go}
                />
              ))}
            </Box>
          </Box>
        ))}
      </Box>
    </Dialog>
  );
}

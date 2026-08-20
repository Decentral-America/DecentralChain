import { Box, Dialog, Typography, useTheme } from '@mui/material';
import { useNavigate } from 'react-router';
import { AppTile } from '@/layouts/shell/AppTile';
import { isCurrent, LAUNCHER_TILES } from '@/layouts/shell/navigation';
import { radii } from '@/styles/tokens';
import { tokens } from '@/theme/tokens/semantic';

/**
 * The launcher.
 *
 * Every destination in the application on one surface, the way a phone shows
 * its applications: a flat grid of coloured tiles. It exists so the top bar can
 * stay four tabs — the launcher absorbs the tail of the navigation instead of
 * the chrome wearing all fifteen destinations at once.
 *
 * It is a modal rather than a menu because it is a place, not a list: open it,
 * see the whole product, go somewhere. Escape and backdrop close it; picking a
 * destination navigates and closes.
 *
 * ## Why the columns are pinned
 *
 * Tile hues are arranged so no two of one hue touch — but adjacency is a
 * function of the column count, and `auto-fill` would pick whatever fits,
 * including the counts where the arrangement breaks. Three fixed counts are
 * verified in `navigation.test.ts`; this grid may only use those. Changing a
 * value here without changing that list is a test failure, deliberately.
 *
 * ## Surfaces are roles, not `palette.*` constants
 *
 * `styles/tokens.ts`' `palette` has no mode dimension, so using it as a fill
 * under mode-aware ink made this dialog unreadable in dark mode — the paper at
 * 1.05:1 against its own title. The ground is `surface.base`; the tiles bring
 * their own verified fills. The arrangement survives a mode swap because it
 * never names a colour.
 */

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
            // The mark ships in two cuts and the dialog ground moves with the
            // mode, so the mark has to as well — a light-ground mark on the
            // dark dialog reads as a pale square.
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

        <Box
          data-testid="launcher-grid"
          sx={{
            display: 'grid',
            gap: 2.5,
            gridTemplateColumns: {
              md: 'repeat(7, 1fr)',
              sm: 'repeat(4, 1fr)',
              xs: 'repeat(3, 1fr)',
            },
          }}
        >
          {LAUNCHER_TILES.map((destination) => (
            <AppTile
              key={destination.path}
              active={isCurrent(destination, pathname)}
              destination={destination}
              onNavigate={go}
            />
          ))}
        </Box>
      </Box>
    </Dialog>
  );
}

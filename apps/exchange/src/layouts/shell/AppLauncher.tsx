import { Box, ButtonBase, Dialog, Typography } from '@mui/material';
import { useNavigate } from 'react-router';
import { type Destination, isCurrent, LAUNCHER_GROUPS } from '@/layouts/shell/navigation';
import { palette, radii } from '@/styles/tokens';

/**
 * The launcher.
 *
 * Every destination in the application on one surface, the way an OS shows its
 * applications: icon cards on shelves, grouped by what they are for. It exists
 * so the top bar can stay four tabs — the launcher absorbs the tail of the
 * navigation instead of the chrome wearing all eleven destinations at once.
 *
 * It keeps the landing's voice — the mark beside the display-caps title, the
 * annotation-mono shelf labels — but in the application's light register, so
 * the modal belongs to the product it opens over rather than dimming it with
 * a second theme. The current screen carries the filled indigo plate.
 *
 * It is a modal rather than a menu because it is a place, not a list: open it,
 * see the whole product, go somewhere. Escape and backdrop close it; picking a
 * destination navigates and closes.
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
  return (
    <ButtonBase
      onClick={() => onNavigate(destination.path)}
      aria-current={active ? 'page' : undefined}
      sx={{
        '&:hover': {
          bgcolor: palette.mist,
          borderColor: palette.lavenderBorder,
        },
        alignItems: 'flex-start',
        bgcolor: 'background.paper',
        border: `1px solid ${active ? palette.lavenderBorder : palette.frost}`,
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
          bgcolor: active ? 'primary.main' : palette.periwinkleWash,
          borderRadius: radii.md,
          color: active ? palette.pureWhite : 'primary.main',
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
            bgcolor: palette.shellCanvas,
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
            src="/brand/mark-on-light.png"
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
                color: palette.steel,
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

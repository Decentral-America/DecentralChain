import { Box, Typography } from '@mui/material';
import { useNavigate } from 'react-router';
import { MobileButton, Sparkline } from '@/components/mobile/primitives';
import {
  mobileAccent,
  mobileLayout,
  mobileRadius,
  mobileShadow,
  mobileSurface,
  mobileText,
} from '@/styles/mobileTokens';

/**
 * Mobile onboarding.
 *
 * A concentric-orbit graphic anchors the brand mark with regional participants
 * arranged around it, then the value proposition and the entry actions. The
 * orbit is drawn from layout primitives rather than an image so it scales with
 * the viewport and needs no asset request.
 */

/** Positions are expressed as angles so the ring stays circular at any size. */
const ORBITERS = [
  { angle: -58, initials: 'AF', label: 'Africa', ring: 2 },
  { angle: 176, initials: 'NA', label: 'North America', ring: 1 },
  { angle: 62, initials: 'AS', label: 'Asia', ring: 2 },
];

const RING_SIZES = [0.52, 0.78, 1];

function Orbit() {
  return (
    <Box
      aria-hidden="true"
      sx={{
        aspectRatio: '1',
        display: 'grid',
        maxWidth: 320,
        mx: 'auto',
        placeItems: 'center',
        position: 'relative',
        width: '100%',
      }}
    >
      {RING_SIZES.map((scale) => (
        <Box
          key={scale}
          sx={{
            border: `1px solid ${mobileSurface.border}`,
            borderRadius: '50%',
            gridArea: '1 / 1',
            height: `${scale * 100}%`,
            width: `${scale * 100}%`,
          }}
        />
      ))}

      {/* Brand mark at the centre of the system */}
      <Box
        sx={{
          alignItems: 'center',
          bgcolor: mobileAccent.base,
          borderRadius: '50%',
          boxShadow: mobileShadow.accent,
          color: mobileText.onAccent,
          display: 'flex',
          fontSize: 22,
          fontWeight: 700,
          gridArea: '1 / 1',
          height: 64,
          justifyContent: 'center',
          width: 64,
        }}
      >
        D
      </Box>

      {/*
       * Positioned against the container with percentage offsets. A percentage
       * `translate` would resolve against each avatar's own box instead, which
       * collapses them all onto the centre.
       */}
      {ORBITERS.map((orbiter) => {
        const radius = (RING_SIZES[orbiter.ring] ?? 1) * 50;
        const rad = (orbiter.angle * Math.PI) / 180;
        const left = 50 + Math.cos(rad) * radius;
        const top = 50 + Math.sin(rad) * radius;
        return (
          <Box
            key={orbiter.label}
            sx={{
              alignItems: 'center',
              display: 'flex',
              flexDirection: 'column',
              gap: 0.5,
              left: `${left}%`,
              position: 'absolute',
              top: `${top}%`,
              transform: 'translate(-50%, -50%)',
            }}
          >
            <Box
              sx={{
                alignItems: 'center',
                bgcolor: mobileSurface.card,
                borderRadius: '50%',
                boxShadow: mobileShadow.raised,
                color: mobileAccent.base,
                display: 'flex',
                fontSize: 13,
                fontWeight: 700,
                height: 44,
                justifyContent: 'center',
                width: 44,
              }}
            >
              {orbiter.initials}
            </Box>
            <Typography sx={{ color: mobileText.secondary, fontSize: 11, whiteSpace: 'nowrap' }}>
              {orbiter.label}
            </Typography>
          </Box>
        );
      })}

      {/* A small trend card tucked into the orbit, as in the reference */}
      <Box
        sx={{
          bgcolor: mobileSurface.card,
          borderRadius: mobileRadius.md,
          boxShadow: mobileShadow.card,
          left: '4%',
          p: 1,
          position: 'absolute',
          top: '26%',
        }}
      >
        <Sparkline
          data={[20, 26, 22, 31, 28, 36, 33, 42, 39, 48]}
          positive
          width={72}
          height={28}
          filled
        />
      </Box>
    </Box>
  );
}

export function MobileWelcome() {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        bgcolor: mobileSurface.canvas,
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100dvh',
        pb: 'calc(env(safe-area-inset-bottom) + 24px)',
        pt: 'calc(env(safe-area-inset-top) + 24px)',
        px: `${mobileLayout.gutter}px`,
      }}
    >
      {/* The graphic takes the slack so the copy and actions stay bottom-anchored */}
      <Box sx={{ alignItems: 'center', display: 'flex', flex: 1, minHeight: 0, py: 2 }}>
        <Orbit />
      </Box>

      <Typography
        component="h1"
        sx={{
          fontSize: 30,
          fontWeight: 700,
          letterSpacing: '-0.6px',
          lineHeight: 1.15,
          mb: 1.5,
          textAlign: 'center',
        }}
      >
        Welcome to DecentralExchange
      </Typography>

      <Typography
        sx={{
          color: mobileText.secondary,
          fontSize: 15,
          lineHeight: 1.5,
          maxWidth: 320,
          mb: 4,
          mx: 'auto',
          textAlign: 'center',
        }}
      >
        Start your portfolio with{' '}
        <Box component="strong" sx={{ color: mobileAccent.base }}>
          $1
        </Box>{' '}
        portions.
      </Typography>

      <Box sx={{ display: 'grid', gap: 1.25 }}>
        <MobileButton onClick={() => navigate('/create-account')}>Create a wallet</MobileButton>
        <MobileButton variant="outline" onClick={() => navigate('/sign-in')}>
          I already have one
        </MobileButton>
      </Box>
    </Box>
  );
}

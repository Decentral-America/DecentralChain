import { Box, Container } from '@mui/material';
import { type ReactNode } from 'react';
import AuroraField from '@/components/landing/AuroraField';
import BandTexture from '@/components/landing/BandTexture';
import { brandInk, onCanvas } from '@/theme/landingTheme';

/**
 * The scene every pre-app screen plays in.
 *
 * Night canvas, the drifting mesh, the contour texture — the same stage the
 * landing page set, so arriving at sign-in, sign-up, import or recovery never
 * feels like leaving the product. Screens put their content in the middle.
 * Content sits on a translucent glass surface (see GlassCard) rather than a
 * light card. The card is still the screen's one job, but it now reads as part
 * of the same surface as the landing page instead of a panel pasted onto it.
 *
 * One component rather than a recipe, so the next auth screen cannot drift.
 */
export function AuthScene({
  children,
  maxWidth = 'xl',
}: {
  children: ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl';
}) {
  return (
    <Box
      component="main"
      sx={{
        alignItems: 'center',
        bgcolor: brandInk.night,
        color: onCanvas.primary,
        display: 'flex',
        minHeight: '100vh',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      <AuroraField crown drifting intensity={0.7} />
      <BandTexture width={{ md: '45%', xs: '80%' }} opacity={0.3} />
      <Container
        maxWidth={maxWidth}
        sx={{ position: 'relative', py: 'clamp(48px, 8vw, 96px)', zIndex: 1 }}
      >
        {children}
      </Container>
    </Box>
  );
}

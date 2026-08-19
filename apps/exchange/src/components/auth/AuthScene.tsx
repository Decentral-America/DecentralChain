import { Box, Container, useTheme } from '@mui/material';
import { type ReactNode } from 'react';
import AuroraField from '@/components/landing/AuroraField';
import BandTexture from '@/components/landing/BandTexture';
import { tokens } from '@/theme/tokens/semantic';

/**
 * The scene every pre-app screen plays in.
 *
 * Dark mode keeps the night canvas, the drifting mesh and the contour
 * texture — the same stage the landing page set, so arriving at sign-in,
 * sign-up, import or recovery never feels like leaving the product. Those
 * layers were art-directed for a dark field and have no honest light
 * counterpart, so light mode does not recolour them: it gets a quiet
 * vertical wash between two brand-tinted near-whites instead. No aurora, no
 * band texture, no glass. Screens put their content in the middle either
 * way, on the surface `GlassCard` builds for the current mode.
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
  const mode = useTheme().palette.mode;
  const t = tokens(mode);
  const isDark = mode === 'dark';

  return (
    <Box
      component="main"
      data-decor={isDark ? 'aurora' : 'wash'}
      data-testid="auth-canvas"
      sx={{
        alignItems: 'center',
        background: isDark
          ? t.surface.base
          : `linear-gradient(180deg, ${t.surface.base} 0%, ${t.surface.sunken} 100%)`,
        color: t.text.primary,
        display: 'flex',
        minHeight: '100svh',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {isDark ? (
        <>
          <AuroraField crown drifting intensity={0.7} />
          <BandTexture width={{ md: '45%', xs: '80%' }} opacity={0.3} />
        </>
      ) : null}
      <Container
        maxWidth={maxWidth}
        sx={{ position: 'relative', py: 'clamp(48px, 8vw, 96px)', zIndex: 1 }}
      >
        {children}
      </Container>
    </Box>
  );
}

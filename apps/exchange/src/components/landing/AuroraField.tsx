import { Box } from '@mui/material';
import { aurora, mesh } from '@/theme/landingTheme';

/**
 * The glow layers behind a dark section.
 *
 * Three blurred radial washes rather than one: a single centred glow reads as a
 * vignette, while an off-centre drift plus a bloom at the foot gives the light a
 * direction and the surface some depth.
 *
 * Decorative and inert — no pointer events, no place in the accessibility tree,
 * and no image request, which keeps it inside the application's strict CSP.
 */
function AuroraField({
  /** Bloom rising from the bottom edge — the signature of the card treatment. */
  foot = true,
  /** Wash falling from the top edge. */
  crown = false,
  /**
   * Adds the drifting mesh: three oversized blobs in the band's stops moving
   * slowly past each other, so the field reads as lit rather than painted.
   * Transform-only, compositor-driven, still under prefers-reduced-motion.
   */
  drifting = false,
  intensity = 1,
}: {
  foot?: boolean;
  crown?: boolean;
  drifting?: boolean;
  intensity?: number;
}) {
  return (
    <Box
      aria-hidden="true"
      sx={{
        inset: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
        position: 'absolute',
        zIndex: 0,
      }}
    >
      {crown ? (
        <Box
          sx={{ background: aurora.crown, inset: 0, opacity: intensity, position: 'absolute' }}
        />
      ) : null}
      {drifting
        ? (
            [
              { anim: 'landing-drift-a 26s', bg: mesh.blobA },
              { anim: 'landing-drift-b 34s', bg: mesh.blobB },
              { anim: 'landing-drift-c 42s', bg: mesh.blobC },
            ] as const
          ).map((blob) => (
            <Box
              key={blob.anim}
              sx={{
                '@media (prefers-reduced-motion: no-preference)': {
                  animation: `${blob.anim} ease-in-out infinite alternate`,
                },
                background: blob.bg,
                // Oversized so the blob's edge never shows while it drifts.
                inset: '-25%',
                opacity: intensity,
                position: 'absolute',
                willChange: 'transform',
              }}
            />
          ))
        : null}
      <Box
        sx={{ background: aurora.drift, inset: 0, opacity: 0.9 * intensity, position: 'absolute' }}
      />
      {foot ? (
        <Box
          sx={{
            background: aurora.foot,
            // Blur is what turns a hard radial into light rather than a shape.
            filter: 'blur(28px)',
            inset: 0,
            opacity: intensity,
            position: 'absolute',
          }}
        />
      ) : null}
    </Box>
  );
}

export default AuroraField;

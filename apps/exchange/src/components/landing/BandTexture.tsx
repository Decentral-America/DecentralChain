import { Box } from '@mui/material';
import { palette } from '@/styles/tokens';
import { contourStroke } from '@/theme/landingTheme';

/**
 * The contour motif carried by every indigo band — the hero, the closing panel,
 * and the header of every screen inside the app.
 *
 * Drawn inline rather than loaded, so it costs no image request and stays
 * within the application's strict CSP. It is decorative: it takes no part in
 * the accessibility tree and never receives pointer events.
 *
 * Dark-only by design, not by omission: the contour strokes were tuned for a
 * dark field, and there is no honest light counterpart. Light mode does not
 * call this component at all — see `AuthScene` for the gradient wash it uses
 * instead.
 */

/** Precomputed so each path carries a stable identity rather than an index. */
const CONTOURS = Array.from(
  { length: 9 },
  (_, i) =>
    `M ${210 - i * 6} -20 C ${150 - i * 12} ${40 + i * 6}, ${150 - i * 10} ${120 + i * 4}, ${215 - i * 4} 220`,
);

function BandTexture({
  width = { md: '55%', xs: '85%' },
  opacity = 0.45,
}: {
  /** How far across the band the contours reach. */
  width?: { md: string; xs: string } | string;
  opacity?: number;
}) {
  return (
    <Box
      aria-hidden="true"
      sx={{
        bottom: 0,
        // Fades westward so the contours never compete with the headline.
        // `maskImage` reads the gradient's luminance, not its hue — any
        // opaque colour masks identically to `#000` here.
        maskImage: `linear-gradient(to left, ${palette.midnightInk} 5%, transparent 70%)`,
        opacity,
        overflow: 'hidden',
        pointerEvents: 'none',
        position: 'absolute',
        right: 0,
        top: 0,
        width,
        zIndex: 0,
      }}
    >
      <svg viewBox="0 0 200 200" preserveAspectRatio="xMaxYMid slice">
        <title>Decorative contours</title>
        {CONTOURS.map((d) => (
          <path key={d} d={d} fill="none" stroke={contourStroke} strokeWidth="0.6" />
        ))}
      </svg>
    </Box>
  );
}

export default BandTexture;

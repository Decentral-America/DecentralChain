/**
 * Surface treatments that differ by construction, not just by colour.
 *
 * `surface.overlay` is the one token whose two modes are not a value swap.
 * Dark mode is translucent glass over the aurora field; light mode is a solid
 * card with a soft shadow, because light "glass" reads as a grey box rather
 * than as depth. Callers ask for the surface and do not know which they got.
 */
import { type SxProps, type Theme } from '@mui/material';
import { type ThemeMode, tokens } from './tokens/semantic';

/** Shared so a card is the same shape in both modes. */
const RADIUS = '20px';

/**
 * The lit top rim that makes dark-mode glass read as depth rather than a flat
 * panel (`GlassCard`'s `&::before`). Translucent white, so — like the glass
 * fill and box-shadows above — it belongs here rather than as a
 * `semantic.ts` token: that file's `contrastRatio()` is opaque-hex-only by
 * design ("Translucent values belong in the overlay treatments, not here").
 * Dark mode only; light mode's solid card has no rim.
 */
export const glassRimHighlight = 'linear-gradient(180deg, rgba(255,255,255,0.14), transparent)';

export function overlaySurface(mode: ThemeMode): SxProps<Theme> {
  const t = tokens(mode);

  if (mode === 'light') {
    return {
      backgroundColor: t.surface.overlay,
      border: `1px solid ${t.border.subtle}`,
      borderRadius: RADIUS,
      boxShadow: '0 8px 32px rgba(20, 18, 43, 0.08)',
    };
  }

  return {
    backdropFilter: 'blur(20px) saturate(140%)',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    border: `1px solid ${t.border.strong}`,
    borderRadius: RADIUS,
    boxShadow: '0 24px 60px rgba(6, 3, 20, 0.55)',
    WebkitBackdropFilter: 'blur(20px) saturate(140%)',
  };
}

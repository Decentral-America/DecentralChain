import { Box, ButtonBase, Tooltip, Typography, useTheme } from '@mui/material';
import { useId } from 'react';
import { type Destination } from '@/layouts/shell/navigation';
import { radii } from '@/styles/tokens';
import { tokens } from '@/theme/tokens/semantic';

/**
 * One tile in the launcher grid.
 *
 * A coloured plate carrying the destination's glyph, with the label beneath it
 * on the dialog ground. The plate's colour identifies the *feature* — that is
 * what makes the grid scannable without reading — which has one consequence
 * worth stating: it can no longer identify the *state*. The old card marked the
 * current destination by filling its plate with `primary.main`; here the fill
 * is spoken for, so "you are here" is a ring around the plate and a weighted
 * label instead.
 *
 * The label sits outside the plate deliberately. On the plate it would have to
 * clear eight different fills in two modes; on the ground it clears
 * `surface.base`, which is already verified.
 *
 * The description reaches assistive tech through `aria-describedby` as well as
 * the tooltip, so it never depends on a pointer event.
 */

/**
 * Screen-reader-only styling, matching `visuallyHidden` in `@/styles/mixins`.
 * Inlined rather than imported because that mixin is a styled-components `css`
 * block and this component styles via MUI's `sx` — the same reasoning, and the
 * same shape, as `CreateWalletWizard`'s copy.
 */
const SR_ONLY = {
  borderWidth: 0,
  clip: 'rect(0, 0, 0, 0)',
  height: '1px',
  margin: '-1px',
  overflow: 'hidden',
  padding: 0,
  position: 'absolute',
  whiteSpace: 'nowrap',
  width: '1px',
} as const;

export function AppTile({
  destination,
  active,
  onNavigate,
}: {
  destination: Destination;
  active: boolean;
  onNavigate: (path: string) => void;
}) {
  const t = tokens(useTheme().palette.mode);
  const hue = t.appTile[destination.hue];
  const descriptionId = useId();

  /** Gap ring in the ground colour, then the accent — so it reads as detached. Marks the current route. */
  const currentRing = `0 0 0 3px ${t.surface.base}, 0 0 0 5px ${t.accent.primary}`;

  /**
   * Focus gets its own ring rather than reusing `currentRing`. MUI's
   * `FocusTrap` focuses the dialog container the moment it opens, so the
   * first Tab always lands on the Dashboard tile — and on `/desktop/wallet`,
   * this app's default route, that tile is also the current one. Reusing
   * `currentRing` for focus would make that first Tab produce a
   * pixel-identical `box-shadow`, i.e. no visible change at all (WCAG
   * 2.4.7). Widening the outer band to 6px and swapping `accent.primary` for
   * `accent.primaryHover` means the two states compose instead of
   * collapsing: a focused non-current tile gains an obvious new ring, and a
   * focused current tile visibly thickens and recolours rather than staying
   * identical to its unfocused self.
   *
   * `accent.primaryHover` clears the ≥3:1 a non-text focus indicator needs
   * against the ground it sits on, `surface.base`, in both modes: 7.53:1
   * light, 5.04:1 dark (see AppTile.test.tsx's contrast assertions).
   */
  const focusRing = `0 0 0 3px ${t.surface.base}, 0 0 0 6px ${t.accent.primaryHover}`;

  return (
    <Tooltip title={destination.description} placement="bottom">
      <ButtonBase
        onClick={() => onNavigate(destination.path)}
        aria-current={active ? 'page' : undefined}
        aria-describedby={descriptionId}
        aria-label={destination.label}
        sx={{
          '@media (prefers-reduced-motion: reduce)': {
            '& .app-tile__plate': { transition: 'none' },
            /**
             * Doubled `&&` rather than a single `&`: stylis emits this rule and
             * the `&:active`/`&:hover` rules below at equal specificity
             * (0,3,0) and equal source order does not save it here — unlike a
             * root-level declaration, which stylis hoists ahead of nested
             * selector rules, these are peers, so whichever is emitted later
             * wins. Doubling the ampersand raises this rule to (0,4,0), which
             * beats both without touching Biome's required key order (`@media`
             * before `&:...`, alphabetical).
             */
            '&&:active .app-tile__plate, &&:hover .app-tile__plate': { transform: 'none' },
          },
          '&:active .app-tile__plate': { transform: 'scale(0.97)' },
          '&:focus-visible .app-tile__plate': { boxShadow: focusRing },
          '&:hover .app-tile__plate': { transform: 'scale(1.04)' },
          alignItems: 'center',
          borderRadius: radii.cards,
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
          p: 1,
          width: '100%',
        }}
      >
        <Box
          aria-hidden="true"
          className="app-tile__plate"
          sx={{
            '& svg': { fontSize: 28 },
            alignItems: 'center',
            bgcolor: hue.fill,
            borderRadius: radii.cards,
            boxShadow: active ? currentRing : 'none',
            color: hue.on,
            display: 'flex',
            height: 64,
            justifyContent: 'center',
            transition: 'transform 160ms ease, box-shadow 160ms ease',
            width: 64,
          }}
        >
          {destination.icon}
        </Box>

        <Typography
          sx={{
            color: active ? t.accent.primary : t.text.primary,
            display: '-webkit-box',
            fontSize: 13,
            fontWeight: active ? 600 : 400,
            lineHeight: 1.3,
            overflow: 'hidden',
            textAlign: 'center',
            WebkitBoxOrient: 'vertical',
            // Wraps to at most two lines: a longer future label pushes an
            // ellipsis rather than a taller grid row than its neighbours.
            WebkitLineClamp: 2,
          }}
        >
          {destination.label}
        </Typography>

        <Box component="span" id={descriptionId} sx={SR_ONLY}>
          {destination.description}
        </Box>
      </ButtonBase>
    </Tooltip>
  );
}

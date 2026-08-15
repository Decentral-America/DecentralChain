import { Box } from '@mui/material';
import { type ReactNode } from 'react';
import { SurfaceProvider } from '@/components/atoms/SurfaceContext';
import { MobileAppBar } from '@/components/mobile/MobileAppBar';
import { mobileFluid, mobileLayout, mobileSurface } from '@/styles/mobileTokens';

/**
 * The shared mobile screen skeleton.
 *
 * Every secondary screen uses this so the app reads as one product: a title bar
 * with a back control, an optional line explaining the screen, an optional
 * feature-specific summary block, then content on the canvas.
 *
 * What differs per screen is the summary slot and the content itself — chrome,
 * rhythm and gutters stay identical, which is what makes moving between
 * features feel like one app rather than several stitched together.
 *
 * It declares `compact`, so features suppress their desktop hero block and let
 * this header stand alone.
 */
export function MobilePageShell({
  title,
  subtitle,
  summary,
  children,
}: {
  title: string;
  /** One line explaining the screen; omit when the title is self-evident. */
  subtitle?: string;
  /** Feature-specific block pinned under the header — balances, totals, filters. */
  summary?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Box sx={{ bgcolor: mobileSurface.canvas, minHeight: '100%' }}>
      <MobileAppBar title={title} {...(subtitle ? { subtitle } : {})} />

      {summary && <Box sx={{ pt: 2, px: `${mobileLayout.gutter}px` }}>{summary}</Box>}

      <Box
        sx={{
          /*
           * Below roughly two-thirds of a phone's width a card cannot hold an
           * icon beside a figure and a caption, so its contents stack and the
           * icon plate shrinks to a size proportionate to the smaller card.
           */
          '@container (max-width: 260px)': {
            '& .MuiCardContent-root > .MuiStack-root': {
              alignItems: 'flex-start !important',
              flexDirection: 'column !important',
              gap: '10px',
            },
            // The desktop icon plates are fixed 40-48px squares.
            '& .MuiCardContent-root > .MuiStack-root > .MuiBox-root:first-of-type': {
              height: '34px !important',
              minHeight: '34px',
              minWidth: '34px',
              width: '34px !important',
            },
            '& .MuiCardContent-root > .MuiStack-root > .MuiBox-root:first-of-type > svg': {
              fontSize: '18px',
              height: '18px',
              width: '18px',
            },
          },

          /*
           * Each card becomes its own query container, so the desktop stat
           * cards below can restyle themselves by their own width rather than
           * the viewport's. This is what lets them sit two-up on a phone
           * without their contents cramping.
           *
           * A container cannot query itself, so the rules below target the
           * card's contents, never the card.
           */
          '& .MuiCard-root, & .MuiPaper-root': { containerType: 'inline-size' },

          /*
           * Card figures and labels size against their own card rather than the
           * viewport, so the same card reads correctly full width or two-up.
           * Desktop card padding is built for a 300px-wide column; on a phone it
           * spends a fifth of a half-width card on whitespace.
           */
          '& .MuiCardContent-root': {
            padding: '12px !important',
          },
          '& .MuiCardHeader-root': { padding: '12px 12px 8px' },
          /*
           * Desktop card headers are sized for a full-width panel: a 24px title
           * with 16-24px padding. On a phone that reads as a page heading
           * competing with the band, so both step down.
           */
          // Both selectors carry one class, so the title is qualified by its
          // header to win against the `.MuiTypography-h5` rule below.
          '& .MuiCardHeader-root .MuiCardHeader-title': {
            fontSize: mobileFluid.heading,
            fontWeight: 600,
            letterSpacing: '-0.2px',
            lineHeight: 1.3,
          },
          '& .MuiCardHeader-subheader': { fontSize: mobileFluid.caption, lineHeight: 1.4 },
          /*
           * Desktop features set their own page padding, a viewport-height
           * minimum, and wrap content in a Container that adds a second gutter.
           * Neutralise all three at the boundary rather than rewriting every
           * feature's desktop layout.
           */
          '& .MuiContainer-root': {
            maxWidth: 'none !important',
            // Vertical padding too: the desktop containers add 32-48px, which
            // strands the content well below the band on a phone.
            paddingBottom: '0 !important',
            paddingLeft: '0 !important',
            paddingRight: '0 !important',
            paddingTop: '0 !important',
          },
          /*
           * Desktop page rhythm is 24-32px between sections, tuned for a wide
           * column. On a phone that spends a third of a screen on gaps alone,
           * so the top-level section stack tightens. Only the page-level stack
           * is affected — stacks inside cards keep their own spacing.
           */
          '& .MuiContainer-root > .MuiStack-root': { gap: '16px' },
          /*
           * Desktop icon buttons are 48px with a 24px glyph. Trimmed to the
           * 44px minimum tap target so a lone action row costs a row of chrome
           * rather than a sixth of the screen.
           */
          '& .MuiIconButton-sizeMedium': { padding: '10px' },
          '& .MuiIconButton-sizeMedium .MuiSvgIcon-root': { fontSize: '22px' },
          '& .MuiTypography-h5': { fontSize: mobileFluid.cardFigure, lineHeight: 1.25 },
          // Panels that head themselves with a plain h6 rather than a CardHeader.
          '& .MuiTypography-h6': {
            fontSize: mobileFluid.heading,
            fontWeight: 600,
            letterSpacing: '-0.2px',
            lineHeight: 1.3,
          },
          '& .MuiTypography-overline': {
            display: 'block',
            fontSize: mobileFluid.cardLabel,
            letterSpacing: '0.4px',
            lineHeight: 1.35,
          },
          '& > *': { minHeight: 'auto !important', padding: '0 !important' },
          pb: `${mobileLayout.scrollPaddingBottom}px`,
          // The band already spaces itself from whatever follows it, so this
          // only needs to separate the content from a summary block above it.
          pt: summary != null ? 2 : 0,
          px: `${mobileLayout.gutter}px`,
        }}
      >
        <SurfaceProvider compact>{children}</SurfaceProvider>
      </Box>
    </Box>
  );
}

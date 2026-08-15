import { Box } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { palette } from '@/styles/tokens';

/**
 * The marquee band.
 *
 * A full-bleed indigo field with one line of oversized all-caps display type
 * scrolling through it — the page's loudest, most kinetic moment, placed
 * between the argument and the ask. The words are the product's verbs, not a
 * slogan.
 *
 * The track renders twice head-to-tail and translates by exactly half its own
 * width, so the loop closes without a visible seam. Under
 * prefers-reduced-motion the animation stops and the first copy simply reads
 * as a headline.
 */

/** One full pass of the words, dot-separated, with a trailing dot to join. */
function Pass({ hidden = false, words }: { hidden?: boolean; words: string[] }) {
  return (
    <Box
      component="span"
      aria-hidden={hidden ? true : undefined}
      sx={{ alignItems: 'center', display: 'inline-flex', flexShrink: 0 }}
    >
      {words.map((word) => (
        <Box component="span" key={word} sx={{ alignItems: 'center', display: 'inline-flex' }}>
          <Box component="span" sx={{ px: { md: 4, xs: 2.5 } }}>
            {word}
          </Box>
          <Box aria-hidden="true" component="span" sx={{ fontSize: '0.4em', opacity: 0.7 }}>
            ●
          </Box>
        </Box>
      ))}
    </Box>
  );
}

export default function MarqueeBand() {
  const { t } = useTranslation();
  const words = t('app.landing.marquee.words', { returnObjects: true }) as string[];
  return (
    <Box
      component="section"
      aria-label={t('app.landing.marquee.ariaLabel')}
      sx={{
        bgcolor: palette.indigoInk,
        color: palette.pureWhite,
        overflow: 'hidden',
        py: { md: 4, xs: 3 },
      }}
    >
      <Box
        sx={{
          '@media (prefers-reduced-motion: no-preference)': {
            animation: 'landing-marquee 26s linear infinite',
          },
          display: 'inline-flex',
          fontSize: 'clamp(34px, 5.5vw, 64px)',
          fontWeight: 700,
          letterSpacing: '-0.02em',
          lineHeight: 1,
          textTransform: 'uppercase',
          whiteSpace: 'nowrap',
          willChange: 'transform',
        }}
      >
        <Pass words={words} />
        <Pass hidden words={words} />
      </Box>
    </Box>
  );
}

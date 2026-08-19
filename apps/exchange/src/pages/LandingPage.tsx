import { Box, GlobalStyles, useTheme } from '@mui/material';
import BigCTA from '@/components/landing/BigCTA';
import FaqSection from '@/components/landing/FaqSection';
import FeatureBento from '@/components/landing/FeatureBento';
import Footer from '@/components/landing/Footer';
import Header from '@/components/landing/Header';
import HeroSection from '@/components/landing/HeroSection';
import IconBullets from '@/components/landing/IconBullets';
import MarqueeBand from '@/components/landing/MarqueeBand';
import SecurityStatement from '@/components/landing/SecurityStatement';
import { tokens } from '@/theme/tokens/semantic';

/**
 * Marketing page.
 *
 * Ordered as an argument rather than a feature list: what this is, what you can
 * trade, why your keys are safe, what it does, then the ask. Dark and light
 * sections alternate in long runs rather than every other block, so the page
 * has a shape instead of a stripe pattern.
 *
 * The coin marquee that used to sit here is gone: it published hardcoded prices
 * — bitcoin at $43,527.82 among them — as though they were market data. On a
 * page selling an exchange that is not decoration, it is a false quote. The
 * pair listing that replaced it is gone too — a grid of ticker tuples told a
 * visitor nothing a feature card does not, and the page reads better going
 * straight from the hero to the argument.
 *
 * Four thin sections went with it. Each was a heading, a paragraph and a flat
 * panel, and five of them in a row is the reason the middle of this page read
 * as scrolling rather than reading. What they claimed is now made once, in the
 * feature set, where every claim carries a drawing of itself.
 */

/**
 * The one keyframe every reveal on the page shares.
 *
 * Declared once here rather than per component: `Reveal` is used dozens of
 * times, and each instance defining its own would emit the same rule dozens of
 * times. Only transform and opacity are animated, which the compositor can run
 * without touching layout or the main thread.
 */
const revealKeyframes = (
  <GlobalStyles
    styles={{
      '@keyframes landing-drift-a': {
        from: { transform: 'translate3d(-6%, -4%, 0) scale(1)' },
        to: { transform: 'translate3d(7%, 5%, 0) scale(1.15)' },
      },
      '@keyframes landing-drift-b': {
        from: { transform: 'translate3d(5%, 6%, 0) scale(1.1)' },
        to: { transform: 'translate3d(-6%, -5%, 0) scale(0.95)' },
      },
      '@keyframes landing-drift-c': {
        from: { transform: 'translate3d(-4%, 5%, 0) scale(1.05)' },
        to: { transform: 'translate3d(5%, -6%, 0) scale(1.2)' },
      },
      // Two identical passes; half the track is exactly one pass, so the
      // loop closes seamlessly.
      '@keyframes landing-marquee': {
        from: { transform: 'translateX(0)' },
        to: { transform: 'translateX(-50%)' },
      },
      '@keyframes landing-reveal': {
        from: { opacity: 0, transform: 'translateY(28px)' },
        to: { opacity: 1, transform: 'none' },
      },
    }}
  />
);

export default function LandingPage() {
  const mode = useTheme().palette.mode;
  const t = tokens(mode);
  return (
    <>
      {revealKeyframes}
      {/*
        The page canvas — every section sits on it, and the sections' own
        surfaces rise from it.

        Task 11 moved this from a fixed `brandInk.night` fill to
        `tokens(mode).surface.base`: the render tree beneath it (Header,
        HeroSection, FeatureBento, SecurityStatement, IconBullets,
        FaqSection, BigCTA, Footer) now reads its ink from `tokens(mode)`
        too, so the page follows the app's light/dark toggle like every
        other page. Two sections keep a fixed dark treatment of their own by
        design — the hero band and the closing CTA panel — because they are
        art-directed brand moments; see HeroSection.tsx and BigCTA.tsx for
        how they gate that against `mode` (task-11-report.md).
      */}
      <Box data-testid="landing-canvas" sx={{ bgcolor: t.surface.base, color: t.text.primary }}>
        <Header />
        <Box component="main">
          <HeroSection />
          <FeatureBento />
          <SecurityStatement />
          <IconBullets />
          <FaqSection />
          <MarqueeBand />
          <BigCTA />
        </Box>
        <Footer />
      </Box>
    </>
  );
}

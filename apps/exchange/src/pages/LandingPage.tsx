import { Box, GlobalStyles } from '@mui/material';
import BigCTA from '@/components/landing/BigCTA';
import FaqSection from '@/components/landing/FaqSection';
import FeatureBento from '@/components/landing/FeatureBento';
import Footer from '@/components/landing/Footer';
import Header from '@/components/landing/Header';
import HeroSection from '@/components/landing/HeroSection';
import IconBullets from '@/components/landing/IconBullets';
import MarqueeBand from '@/components/landing/MarqueeBand';
import SecurityStatement from '@/components/landing/SecurityStatement';
import { brandInk } from '@/theme/landingTheme';

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
  return (
    <>
      {revealKeyframes}
      {/*
        The deep-indigo canvas. The page is never on a neutral ground — every
        section sits on the night stop of the brand band, and the sections'
        own surfaces rise from it.

        Pinned to `brandInk.night` rather than `tokens(mode).surface.base`:
        this whole render tree (Header, HeroSection, FeatureBento,
        SecurityStatement, IconBullets, FaqSection, MarqueeBand, BigCTA,
        Footer) is art-directed for this fixed dark canvas — most of it
        paints `onCanvas`/`brandCanvas` ink directly on whatever sits behind
        it, with no per-mode counterpart. Following the app's light/dark
        toggle here would turn that ink invisible the moment the canvas went
        light; the marketing page keeps one fixed brand identity instead
        (see task-5-report.md, "LandingPage canvas").
      */}
      <Box data-testid="landing-canvas" sx={{ bgcolor: brandInk.night, color: 'common.white' }}>
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

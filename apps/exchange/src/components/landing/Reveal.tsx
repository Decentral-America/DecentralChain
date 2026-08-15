import { Box, type BoxProps } from '@mui/material';
import { type ReactNode, useLayoutEffect, useRef, useState } from 'react';

/**
 * Reveals its children as they come into view.
 *
 * Two paths, chosen per browser:
 *
 * Where `animation-timeline: view()` is supported, the browser drives the
 * animation from scroll position itself. It runs on the compositor rather than
 * the main thread, so it stays smooth while React is busy, and it needs no
 * observer, no listener and no state.
 *
 * Everywhere else an IntersectionObserver adds the same transition once. The
 * observer is used only for the visibility signal — the animation is still CSS.
 *
 * Two rules this follows deliberately:
 *
 * Nothing is hidden unless it can be un-hidden. The hidden state is applied by
 * the path that owns the reveal, never as a base style, so a browser without
 * either capability — or one where the script fails — renders the page fully
 * visible rather than blank.
 *
 * Anything already on screen at mount is left alone. Arming it would hide
 * content the reader is looking at and animate it back in, which reads as a
 * flash rather than a reveal.
 */

/** Whether the browser can drive an animation from scroll position. */
function supportsScrollTimeline(): boolean {
  return typeof CSS !== 'undefined' && CSS.supports?.('animation-timeline: view()');
}

function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

interface RevealProps extends BoxProps {
  children: ReactNode;
  /**
   * Order within a group, for staggering. On the scroll-driven path this
   * offsets the range rather than the delay — a scroll timeline has no clock,
   * so `animation-delay` does nothing.
   */
  index?: number;
}

function Reveal({ children, index = 0, sx, ...rest }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  /** Whether this instance took over the reveal from CSS. */
  const [armed, setArmed] = useState(false);
  const [shown, setShown] = useState(false);

  useLayoutEffect(() => {
    // The CSS path handles it; leave the element alone entirely.
    if (supportsScrollTimeline() || prefersReducedMotion()) return;
    if (!('IntersectionObserver' in window)) return;

    const el = ref.current;
    if (!el) return;
    // Already on screen: showing it is the correct final state.
    if (el.getBoundingClientRect().top < window.innerHeight * 0.92) return;

    setArmed(true);
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          setShown(true);
          observer.disconnect();
        }
      },
      // Fires a little before the element's edge, so the motion reads as
      // arriving rather than catching up.
      { rootMargin: '0px 0px -10% 0px', threshold: 0.05 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const stagger = Math.min(index, 6);

  return (
    <Box
      ref={ref}
      sx={{
        '@supports (animation-timeline: view())': {
          '@media (prefers-reduced-motion: no-preference)': {
            animation: 'landing-reveal linear both',
            /*
             * The range sits wholly inside `entry`, which is what makes this
             * correct for content already on screen at load. A range ending in
             * `cover` leaves anything in the first viewport part-way through
             * its animation — rendered half-faded, and stuck there until the
             * reader scrolls. Past `entry 100%` the element is fully entered,
             * so it resolves to its finished state immediately.
             *
             * Later items finish later within that window, which is the stagger.
             */
            animationRange: `entry ${5 + stagger * 5}% entry ${65 + stagger * 5}%`,
            animationTimeline: 'view()',
          },
        },
        ...(armed
          ? {
              opacity: shown ? 1 : 0,
              transform: shown ? 'none' : 'translateY(24px)',
              transition:
                'opacity 700ms cubic-bezier(0.16, 1, 0.3, 1), transform 700ms cubic-bezier(0.16, 1, 0.3, 1)',
              transitionDelay: `${stagger * 90}ms`,
              willChange: 'opacity, transform',
            }
          : {}),
        ...sx,
      }}
      {...rest}
    >
      {children}
    </Box>
  );
}

export default Reveal;

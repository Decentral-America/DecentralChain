/**
 * Skeleton swap: the skeleton and the real content occupy the same grid cell,
 * and the handoff is a crossfade (content sharpens from a 4px blur) rather
 * than a pop, so nothing below it shifts when data lands.
 *
 * Two timing rules come with it: the skeleton only appears if loading takes
 * longer than `delay` (fast loads show nothing, not a grey flash), and once it
 * has appeared it stays at least `minVisible`, so it never flickers.
 *
 * Ported from 21st.dev "Skeleton Swap" by @ddoemonn (demo 23557). The bars
 * are the themed MUI Skeleton (wave) instead of the original's own shimmer.
 */
import { Skeleton } from '@mui/material';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { type ReactNode, useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { SOFT } from './ModalSurface';

const WIDTHS = [100, 93, 97, 88, 95, 91] as const;

export function useSkeletonSwap({
  ready,
  delay = 120,
  minVisible = 380,
}: {
  ready: boolean;
  delay?: number | undefined;
  minVisible?: number | undefined;
}) {
  const [visible, setVisible] = useState(false);
  const shownAt = useRef(0);

  useEffect(() => {
    if (!ready) {
      if (visible) return;
      const t = setTimeout(() => {
        shownAt.current = performance.now();
        setVisible(true);
      }, delay);
      return () => clearTimeout(t);
    }
    if (!visible) return;
    const rest = Math.max(0, minVisible - (performance.now() - shownAt.current));
    const t = setTimeout(() => setVisible(false), rest);
    return () => clearTimeout(t);
  }, [ready, visible, delay, minVisible]);

  return { busy: !ready, showSkeleton: visible };
}

const Cell = styled.div`
  display: grid;
  min-width: 0;

  & > * {
    grid-area: 1 / 1;
    min-width: 0;
  }
`;

const Lines = styled.div<{ $gap: number }>`
  display: flex;
  flex-direction: column;
  gap: ${({ $gap }) => $gap}px;
`;

/** Default skeleton: text-height bars with a short last line. */
export function SkeletonLines({
  lines = 3,
  height = 12,
  gap = 10,
}: {
  lines?: number;
  height?: number;
  gap?: number;
}) {
  return (
    <Lines $gap={gap}>
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton
          // biome-ignore lint/suspicious/noArrayIndexKey: static placeholder bars
          key={i}
          variant="rounded"
          height={height}
          width={`${lines > 1 && i === lines - 1 ? 62 : WIDTHS[(i * 7 + 3) % WIDTHS.length]}%`}
        />
      ))}
    </Lines>
  );
}

export interface SkeletonSwapProps {
  ready: boolean;
  children: ReactNode;
  /** Shaped like the content it stands in for. Defaults to three text lines. */
  skeleton?: ReactNode;
  delay?: number;
  minVisible?: number;
  label?: string;
  className?: string;
}

export function SkeletonSwap({
  ready,
  children,
  skeleton,
  delay,
  minVisible,
  label,
  className,
}: SkeletonSwapProps) {
  const { showSkeleton } = useSkeletonSwap({ delay, minVisible, ready });
  const reduced = useReducedMotion();
  const showContent = ready && !showSkeleton;

  return (
    <Cell aria-busy={!ready} aria-label={label} className={className}>
      <AnimatePresence initial={false}>
        {showSkeleton ? (
          <motion.div
            key="skeleton"
            aria-hidden
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={reduced ? { duration: 0 } : SOFT}
          >
            {skeleton ?? <SkeletonLines />}
          </motion.div>
        ) : null}
      </AnimatePresence>
      {ready ? (
        <motion.div
          initial={false}
          animate={
            reduced
              ? { opacity: showContent ? 1 : 0 }
              : {
                  filter: showContent ? 'blur(0px)' : 'blur(4px)',
                  opacity: showContent ? 1 : 0,
                  scale: showContent ? 1 : 0.99,
                }
          }
          transition={reduced ? { duration: 0 } : SOFT}
          style={{ transformOrigin: 'top left' }}
        >
          {children}
        </motion.div>
      ) : null}
    </Cell>
  );
}

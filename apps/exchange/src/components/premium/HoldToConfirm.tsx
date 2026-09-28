/**
 * Press-and-hold confirm button. A filled copy of the label sweeps in while
 * the button is held and `onConfirm` fires only once the hold completes;
 * releasing early springs it back and nothing happens. Space or Enter hold it
 * from the keyboard, Escape cancels.
 *
 * Ported from 21st.dev "Hold to Confirm" by @ddoemonn (demo 23527). The stone
 * palette becomes the accent: an indigo-tinted face that fills solid indigo.
 * It only wraps a caller's existing handler; validation and signing stay
 * wherever they already were.
 */
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from 'motion/react';
import {
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react';
import styled from 'styled-components';

const FACE = { damping: 34, mass: 0.8, stiffness: 260, type: 'spring' } as const;

type Phase = 'idle' | 'holding' | 'releasing' | 'committed';

function useHold({
  onConfirm,
  duration,
  releaseRate,
  disabled,
}: {
  onConfirm: () => void;
  duration: number;
  releaseRate: number;
  disabled: boolean;
}) {
  const [phase, setPhase] = useState<Phase>('idle');
  const phaseRef = useRef<Phase>('idle');
  const down = useRef(false);
  const elapsed = useRef(0);
  const last = useRef(0);
  const raf = useRef(0);
  const origin = useRef<{ x: number; y: number } | null>(null);
  const confirm = useRef(onConfirm);
  confirm.current = onConfirm;

  const move = useCallback((next: Phase) => {
    phaseRef.current = next;
    setPhase(next);
  }, []);

  const reset = useCallback(() => {
    cancelAnimationFrame(raf.current);
    raf.current = 0;
    down.current = false;
    elapsed.current = 0;
    origin.current = null;
    move('idle');
  }, [move]);

  const begin = useCallback(
    (point?: { x: number; y: number }) => {
      if (disabled || phaseRef.current === 'committed' || phaseRef.current === 'holding') return;
      origin.current = point ?? null;
      down.current = true;
      move('holding');
      if (raf.current) return;
      last.current = performance.now();
      const loop = (now: number) => {
        const dt = Math.min(64, now - last.current);
        last.current = now;
        elapsed.current += down.current ? dt : -dt * releaseRate;
        if (elapsed.current >= duration) {
          raf.current = 0;
          elapsed.current = duration;
          down.current = false;
          move('committed');
          navigator.vibrate?.(14);
          confirm.current();
          return;
        }
        if (elapsed.current <= 0) {
          raf.current = 0;
          elapsed.current = 0;
          move('idle');
          return;
        }
        raf.current = requestAnimationFrame(loop);
      };
      raf.current = requestAnimationFrame(loop);
    },
    [disabled, duration, releaseRate, move],
  );

  const release = useCallback(() => {
    if (phaseRef.current !== 'holding') return;
    down.current = false;
    origin.current = null;
    move('releasing');
  }, [move]);

  useEffect(() => {
    const onVisibility = () => document.hidden && release();
    window.addEventListener('blur', release);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('blur', release);
      document.removeEventListener('visibilitychange', onVisibility);
      cancelAnimationFrame(raf.current);
      raf.current = 0;
    };
  }, [release]);

  const bind = {
    onBlur: release,
    onClick: (e: MouseEvent) => e.preventDefault(),
    onContextMenu: (e: MouseEvent) => e.preventDefault(),
    onKeyDown: (e: KeyboardEvent) => {
      if (
        e.key === 'Escape' &&
        (phaseRef.current === 'holding' || phaseRef.current === 'releasing')
      ) {
        e.preventDefault();
        reset();
        return;
      }
      if (e.repeat) return;
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        begin();
      }
    },
    onKeyUp: (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter') release();
    },
    onPointerCancel: release,
    onPointerDown: (e: PointerEvent) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      e.currentTarget.setPointerCapture?.(e.pointerId);
      begin({ x: e.clientX, y: e.clientY });
    },
    onPointerLeave: release,
    onPointerMove: (e: PointerEvent) => {
      const from = origin.current;
      if (phaseRef.current !== 'holding' || !from) return;
      if (Math.hypot(e.clientX - from.x, e.clientY - from.y) > 10) release();
    },
    onPointerUp: release,
  };

  return { bind, phase, reset };
}

const Root = styled.button<{ $full: boolean }>`
  position: relative;
  isolation: isolate;
  display: inline-grid;
  place-items: center;
  width: ${({ $full }) => ($full ? '100%' : 'auto')};
  height: 48px;
  padding: 0 20px;
  overflow: hidden;
  border: 0;
  border-radius: 12px;
  font: inherit;
  font-size: 15px;
  font-weight: 500;
  letter-spacing: -0.15px;
  user-select: none;
  touch-action: manipulation;
  -webkit-touch-callout: none;
  cursor: pointer;
  /*
   * The accent's hover shade, not the accent: dark primary on its own tint is
   * 4.42:1, under AA for a 15px label; primaryHover clears it in both modes
   * (6.18:1 dark, 5.99:1 light).
   */
  color: ${({ theme }) => theme.colors.primaryHover};
  background: ${({ theme }) => theme.colors.primarySurface};
  transition: transform 160ms cubic-bezier(0.32, 0.72, 0, 1), opacity 160ms;

  &:active:not([aria-disabled='true']) {
    transform: scale(0.97);
  }

  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.primaryBorder};
  }

  &[aria-disabled='true'] {
    cursor: not-allowed;
    opacity: 0.5;
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

const Fill = styled(motion.span)`
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  padding: 0 20px;
  color: ${({ theme }) => theme.colors.textOnPrimary};
  background: ${({ theme }) => theme.colors.primary};
`;

const Stack = styled.span`
  display: grid;
  grid-area: 1 / 1;

  > * {
    grid-area: 1 / 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    white-space: nowrap;
  }
`;

const SrOnly = styled.span`
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
`;

function Faces({
  committed,
  busy,
  confirmLabel,
  children,
}: {
  committed: boolean;
  busy?: ReactNode;
  confirmLabel: string;
  children: ReactNode;
}) {
  return (
    <Stack>
      <motion.span initial={false} animate={{ opacity: committed ? 0 : 1 }} transition={FACE}>
        {children}
      </motion.span>
      <motion.span initial={false} animate={{ opacity: committed ? 1 : 0 }} transition={FACE}>
        {busy ?? (
          <>
            <svg
              width="14"
              height="14"
              viewBox="0 0 12 12"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M2.5 6.4 4.7 8.6 9.5 3.5" />
            </svg>
            {confirmLabel}
          </>
        )}
      </motion.span>
    </Stack>
  );
}

export interface HoldToConfirmProps {
  /** The caller's existing confirm handler, unchanged. */
  onConfirm: () => void;
  children: ReactNode;
  /** Shown once the hold completes, while the caller's work runs. */
  confirmLabel?: string | undefined;
  /** Replaces the confirm face while `pending`, e.g. "Sending…". */
  pendingLabel?: ReactNode | undefined;
  /** The caller's mutation is in flight: stay committed until it settles. */
  pending?: boolean | undefined;
  duration?: number | undefined;
  disabled?: boolean | undefined;
  fullWidth?: boolean | undefined;
  className?: string | undefined;
}

export function HoldToConfirm({
  onConfirm,
  children,
  confirmLabel = 'Confirmed',
  pendingLabel,
  pending = false,
  duration = 1200,
  disabled = false,
  fullWidth = false,
  className,
}: HoldToConfirmProps) {
  const releaseRate = 2.5;
  const { bind, phase, reset } = useHold({
    disabled: disabled || pending,
    duration,
    onConfirm,
    releaseRate,
  });
  const reduced = useReducedMotion();
  const hintId = useId();
  const committed = phase === 'committed' || pending;
  const seconds = Math.round(duration / 100) / 10;

  const swept = useMotionValue(0);
  const clipPath = useTransform(swept, (v) => `inset(0 ${(1 - v) * 100}% 0 0)`);

  // Return to idle after the caller's work settles, so a failed send can be
  // retried without reopening the dialog.
  useEffect(() => {
    if (phase !== 'committed' || pending) return;
    const back = setTimeout(reset, 900);
    return () => clearTimeout(back);
  }, [phase, pending, reset]);

  useEffect(() => {
    if (reduced) {
      swept.set(phase === 'holding' || committed ? 1 : 0);
      return;
    }
    if (committed) {
      const c = animate(swept, 1, { duration: 0.12, ease: 'linear' });
      return () => c.stop();
    }
    const from = swept.get();
    if (phase === 'holding') {
      const c = animate(swept, 1, { duration: (duration * (1 - from)) / 1000, ease: 'linear' });
      return () => c.stop();
    }
    const c = animate(swept, 0, {
      duration: (duration * from) / releaseRate / 1000,
      ease: [0.23, 1, 0.32, 1],
    });
    return () => c.stop();
  }, [phase, committed, duration, reduced, swept]);

  const isDisabled = disabled || committed;

  return (
    <Root
      type="button"
      aria-disabled={isDisabled || undefined}
      aria-describedby={hintId}
      aria-busy={pending || undefined}
      $full={fullWidth}
      className={className}
      {...bind}
    >
      <Faces
        committed={committed}
        busy={pending ? pendingLabel : undefined}
        confirmLabel={confirmLabel}
      >
        {children}
      </Faces>
      <Fill aria-hidden style={{ clipPath }}>
        <Faces
          committed={committed}
          busy={pending ? pendingLabel : undefined}
          confirmLabel={confirmLabel}
        >
          {children}
        </Faces>
      </Fill>
      <SrOnly id={hintId}>
        Press and hold for {seconds} seconds to confirm. Releasing early cancels and nothing
        happens.
      </SrOnly>
      <SrOnly role="status" aria-live="polite">
        {committed ? confirmLabel : ''}
      </SrOnly>
    </Root>
  );
}

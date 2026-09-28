/**
 * Press action — a round, filled-tint action with its label beneath, the way
 * iOS Wallet lays out Receive / Send / Trade. The whole column is the tap
 * target; only the circle moves. On press it sinks a couple of pixels and
 * leans toward the finger on the same spring as the rest of the system, then
 * springs back on release, so it reads as a physical key rather than a link.
 *
 * Ported from 21st.dev "Press Depth" by @ddoemonn (demo 23547): the pointer
 * tracking hook is kept (press follows the finger in and out of the button,
 * cancels on blur and tab switch), the stone palette and bevel give way to
 * the accent tint.
 */
import { motion, useReducedMotion } from 'motion/react';
import {
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import styled from 'styled-components';
import { spring } from '@/styles/tokens';

type Origin = { x: number; y: number };

/**
 * Pressed state that follows the pointer: sliding off the button releases it,
 * sliding back re-presses, lifting anywhere ends the gesture.
 */
export function usePressDepth(disabled = false) {
  const [pressed, setPressed] = useState(false);
  const [tracking, setTracking] = useState(false);
  const [origin, setOrigin] = useState<Origin | null>(null);
  const node = useRef<HTMLElement | null>(null);
  const pointer = useRef<number | null>(null);

  const stop = useCallback(() => {
    pointer.current = null;
    setTracking(false);
    setOrigin(null);
    setPressed(false);
  }, []);

  useEffect(() => {
    if (!tracking) return;
    const inside = (event: globalThis.PointerEvent) => {
      const r = node.current?.getBoundingClientRect();
      return (
        !!r &&
        event.clientX >= r.left &&
        event.clientX <= r.right &&
        event.clientY >= r.top &&
        event.clientY <= r.bottom
      );
    };
    const move = (event: globalThis.PointerEvent) => {
      if (event.pointerId === pointer.current) setPressed(inside(event));
    };
    const lift = (event: globalThis.PointerEvent) => {
      if (event.pointerId === pointer.current) stop();
    };
    const hidden = () => {
      if (document.hidden) stop();
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', lift);
    window.addEventListener('pointercancel', lift);
    window.addEventListener('blur', stop);
    document.addEventListener('visibilitychange', hidden);
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', lift);
      window.removeEventListener('pointercancel', lift);
      window.removeEventListener('blur', stop);
      document.removeEventListener('visibilitychange', hidden);
    };
  }, [tracking, stop]);

  useEffect(() => {
    if (disabled) stop();
  }, [disabled, stop]);

  const ref = useCallback((el: HTMLElement | null) => {
    node.current = el;
  }, []);

  const bind = {
    onBlur: stop,
    onKeyDown: (event: KeyboardEvent) => {
      if (!disabled && !event.repeat && (event.key === ' ' || event.key === 'Enter')) {
        setPressed(true);
      }
    },
    onKeyUp: (event: KeyboardEvent) => {
      if (event.key === ' ' || event.key === 'Enter' || event.key === 'Escape') setPressed(false);
    },
    onPointerDown: (event: PointerEvent) => {
      if (disabled || (event.pointerType === 'mouse' && event.button !== 0)) return;
      const r = event.currentTarget.getBoundingClientRect();
      const clamp = (n: number) => Math.max(-1, Math.min(1, n));
      setOrigin({
        x: clamp(((event.clientX - r.left) / r.width) * 2 - 1),
        y: clamp(((event.clientY - r.top) / r.height) * 2 - 1),
      });
      pointer.current = event.pointerId;
      setTracking(true);
      setPressed(true);
    },
  };

  return { bind, origin, pressed, ref };
}

const Button = styled.button`
  appearance: none;
  border: 0;
  background: none;
  padding: 6px 0;
  margin: 0;
  min-width: 64px;
  min-height: 44px;
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  color: var(--text-primary);
  font: inherit;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
  user-select: none;
  outline: none;

  &:disabled {
    cursor: default;
    opacity: 0.45;
  }

  &:focus-visible > span:first-child {
    box-shadow: 0 0 0 3px var(--focus-ring-color);
  }
`;

const Face = styled(motion.span)<{ $size: number; $tone: 'tint' | 'accent' }>`
  display: grid;
  place-items: center;
  width: ${({ $size }) => $size}px;
  height: ${({ $size }) => $size}px;
  border-radius: 50%;
  background: ${({ $tone }) => ($tone === 'accent' ? 'var(--color-indigo-ink)' : 'var(--surface-lavender)')};
  color: ${({ $tone }) => ($tone === 'accent' ? 'var(--color-pure-white)' : 'var(--color-indigo-ink)')};
  transition: background-color 160ms var(--ease);

  @media (hover: hover) {
    ${Button}:hover:not(:disabled) > & {
      filter: brightness(0.97);
    }
  }
`;

const Caption = styled.span`
  font-size: 13px;
  line-height: 16px;
  font-weight: 500;
  letter-spacing: -0.08px;
  color: var(--text-primary);
  white-space: nowrap;
`;

export interface PressActionProps {
  icon: ReactNode;
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  /** Diameter of the circle. Defaults to 56, the iOS action size. */
  size?: number;
  /** `tint` is the accent wash; `accent` is the solid primary. */
  tone?: 'tint' | 'accent';
}

export function PressAction({
  icon,
  label,
  onClick,
  disabled = false,
  size = 56,
  tone = 'tint',
}: PressActionProps) {
  const reduced = useReducedMotion();
  const { bind, origin, pressed, ref } = usePressDepth(disabled);
  const lean = pressed && origin && !reduced ? origin : null;

  return (
    <Button ref={ref} type="button" disabled={disabled} onClick={onClick} {...bind}>
      <Face
        $size={size}
        $tone={tone}
        aria-hidden="true"
        initial={false}
        animate={{
          rotateX: lean ? -lean.y * 10 : 0,
          rotateY: lean ? lean.x * 10 : 0,
          scale: pressed && !reduced ? 0.94 : 1,
          y: pressed && !reduced ? 2 : 0,
        }}
        transition={reduced ? { duration: 0 } : spring}
        style={{ transformPerspective: 300 }}
      >
        {icon}
      </Face>
      <Caption>{label}</Caption>
    </Button>
  );
}

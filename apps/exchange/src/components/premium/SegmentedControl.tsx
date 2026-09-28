/**
 * Segmented control — an iOS-style radio group whose selection rides on a
 * raised thumb that springs between options. The label under the thumb is
 * re-drawn inside it and masked, so its colour changes mid-slide instead of
 * snapping at the end.
 *
 * Ported from 21st.dev "Segmented Control" by @ddoemonn (demo 23552).
 */
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from 'motion/react';
import {
  type KeyboardEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import styled, { css } from 'styled-components';
import { chrome, spring } from '@/styles/tokens';

export interface SegmentedOption<V extends string = string> {
  value: V;
  label: ReactNode;
  disabled?: boolean;
}

export interface SegmentedControlProps<V extends string = string> {
  options: SegmentedOption<V>[];
  /** Accessible name for the group. */
  label: string;
  value?: V;
  defaultValue?: V;
  onValueChange?: (value: V) => void;
  size?: 'sm' | 'md';
  /** Stretch to the container's width instead of hugging the labels. */
  fullWidth?: boolean;
  /** Tints the thumb for a semantic choice, such as buy and sell. */
  tone?: (value: V) => 'buy' | 'sell' | undefined;
  className?: string;
}

const segment = css<{ $size: 'sm' | 'md' }>`
  padding: ${({ $size }) => ($size === 'sm' ? '5px 12px' : '7px 16px')};
  font-size: ${({ $size }) => ($size === 'sm' ? '12px' : '13px')};
  font-weight: 500;
  line-height: 18px;
  letter-spacing: -0.01em;
  text-align: center;
  white-space: nowrap;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
`;

const Track = styled.div<{ $fullWidth: boolean }>`
  position: relative;
  display: ${({ $fullWidth }) => ($fullWidth ? 'block' : 'inline-block')};
  width: ${({ $fullWidth }) => ($fullWidth ? '100%' : 'auto')};
  max-width: 100%;
  padding: 2px;
  border-radius: 10px;
  user-select: none;
  background: ${({ theme }) => chrome[theme.mode].fill};
`;

const Grid = styled.div`
  position: relative;
  display: grid;
  touch-action: manipulation;
`;

const Label = styled.span<{ $size: 'sm' | 'md'; $state: 'idle' | 'hover' | 'disabled' }>`
  ${segment}
  pointer-events: none;
  color: ${({ theme, $state }) =>
    $state === 'disabled'
      ? theme.colors.disabled
      : $state === 'hover'
        ? theme.colors.text
        : theme.colors.textSecondary};
  transition: color 160ms cubic-bezier(0.32, 0.72, 0, 1);
`;

const Thumb = styled(motion.div)<{ $tone?: 'buy' | 'sell' | undefined }>`
  position: absolute;
  inset: 0 auto 0 0;
  overflow: hidden;
  pointer-events: none;
  border-radius: 8px;
  background: ${({ theme, $tone }) =>
    $tone === 'buy'
      ? theme.colors.buy
      : $tone === 'sell'
        ? theme.colors.sell
        : chrome[theme.mode].thumb};
  box-shadow: ${({ theme }) => chrome[theme.mode].thumbShadow};
  transition: background-color 200ms cubic-bezier(0.32, 0.72, 0, 1);
`;

const ThumbLabel = styled.span<{ $size: 'sm' | 'md'; $tone?: 'buy' | 'sell' | undefined }>`
  ${segment}
  color: ${({ theme, $tone }) =>
    $tone === 'buy'
      ? theme.colors.onBuy
      : $tone === 'sell'
        ? theme.colors.onSell
        : theme.colors.text};
`;

const HitTarget = styled.button`
  all: unset;
  cursor: pointer;
  border-radius: 8px;

  &[aria-disabled='true'] {
    cursor: not-allowed;
  }

  &:focus-visible {
    box-shadow: inset 0 0 0 2px ${({ theme }) => theme.colors.primary};
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

export function SegmentedControl<V extends string = string>({
  options,
  label,
  value,
  defaultValue,
  onValueChange,
  size = 'md',
  fullWidth = false,
  tone,
  className,
}: SegmentedControlProps<V>) {
  const count = Math.max(1, options.length);
  const template = `repeat(${count}, minmax(0, 1fr))`;

  const [internal, setInternal] = useState<V | undefined>(() => defaultValue ?? options[0]?.value);
  const [hovered, setHovered] = useState(-1);

  const controlled = value !== undefined;
  const current = controlled ? value : internal;
  const found = options.findIndex((o) => o.value === current);
  const index = found < 0 ? 0 : found;
  const thumbTone = tone ? tone(options[index]?.value as V) : undefined;

  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const emit = useRef(onValueChange);
  emit.current = onValueChange;

  const reduced = useReducedMotion();
  const pos = useMotionValue(index);
  const thumbX = useTransform(pos, (v) => `${v * 100}%`);
  const maskX = useTransform(pos, (v) => `${v * -100}%`);

  useEffect(() => {
    if (reduced) {
      pos.set(index);
      return;
    }
    const controls = animate(pos, index, spring);
    return () => controls.stop();
  }, [index, reduced, pos]);

  const select = useCallback(
    (next: V) => {
      if (!controlled) setInternal(next);
      if (next !== current) emit.current?.(next);
    },
    [controlled, current],
  );

  const seek = useCallback(
    (from: number, dir: number) => {
      let i = from;
      for (let k = 0; k < count; k++) {
        i = (i + dir + count) % count;
        if (!options[i]?.disabled) return i;
      }
      return from;
    },
    [count, options],
  );

  const go = (i: number) => {
    const option = options[i];
    if (!option || option.disabled) return;
    buttons.current[i]?.focus();
    select(option.value);
  };

  const onKeyDown = (e: KeyboardEvent, i: number) => {
    const moves: Record<string, () => number> = {
      ArrowDown: () => seek(i, 1),
      ArrowLeft: () => seek(i, -1),
      ArrowRight: () => seek(i, 1),
      ArrowUp: () => seek(i, -1),
      End: () => seek(0, -1),
      Home: () => seek(count - 1, 1),
    };
    const move = moves[e.key];
    if (!move) return;
    e.preventDefault();
    go(move());
  };

  return (
    <Track role="radiogroup" aria-label={label} $fullWidth={fullWidth} className={className}>
      <Grid style={{ gridTemplateColumns: template }}>
        {options.map((option, i) => (
          <Label
            key={option.value}
            aria-hidden
            $size={size}
            $state={option.disabled ? 'disabled' : hovered === i && i !== index ? 'hover' : 'idle'}
          >
            {option.label}
          </Label>
        ))}

        <Thumb aria-hidden $tone={thumbTone} style={{ width: `${100 / count}%`, x: thumbX }}>
          <motion.div style={{ inset: 0, position: 'absolute', x: maskX }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: template,
                inset: '0 auto 0 0',
                position: 'absolute',
                width: `${count * 100}%`,
              }}
            >
              {options.map((option) => (
                <ThumbLabel key={option.value} $size={size} $tone={thumbTone}>
                  {option.label}
                </ThumbLabel>
              ))}
            </div>
          </motion.div>
        </Thumb>

        <div
          style={{ display: 'grid', gridTemplateColumns: template, inset: 0, position: 'absolute' }}
          onPointerLeave={() => setHovered(-1)}
        >
          {options.map((option, i) => (
            <HitTarget
              key={option.value}
              ref={(node) => {
                buttons.current[i] = node;
              }}
              type="button"
              role="radio"
              aria-checked={i === index}
              aria-disabled={option.disabled || undefined}
              tabIndex={i === index ? 0 : -1}
              onClick={() => !option.disabled && select(option.value)}
              onKeyDown={(e) => onKeyDown(e, i)}
              onPointerEnter={() => !option.disabled && setHovered(i)}
            >
              <SrOnly>{option.label}</SrOnly>
            </HitTarget>
          ))}
        </div>
      </Grid>
    </Track>
  );
}

/**
 * Wizard rail — the progress rail of a multi-step flow. Numbered chips joined
 * by hairline tracks; a finished step's chip turns solid and morphs its number
 * into a check, and the track after it fills with a spring. Steps already
 * reached are buttons, so someone can step back without hunting for "Back";
 * steps not yet reached are inert. The current step's name crossfades above
 * the rail.
 *
 * Ported from 21st.dev "Wizard Steps" by @ddoemonn (demo 23576). Only the rail
 * is taken: each flow keeps its own panels and validation, so this renders the
 * progress and reports clicks, and the caller decides whether a jump is
 * allowed. Stone literals became theme tokens; the chip is 10px (controls).
 */
import { motion, useReducedMotion } from 'motion/react';
import { type KeyboardEvent, useRef } from 'react';
import styled from 'styled-components';

const RAIL = { damping: 40, mass: 0.5, stiffness: 520, type: 'spring' } as const;
const CROSSFADE = { damping: 34, mass: 0.8, stiffness: 260, type: 'spring' } as const;
const INSTANT = { duration: 0 } as const;

export interface WizardRailProps {
  steps: readonly string[];
  /** Zero-based current step. */
  index: number;
  /** Furthest step reached; steps up to it are clickable. Defaults to `index`. */
  furthest?: number | undefined;
  /** Every step done, for a completion screen. */
  complete?: boolean | undefined;
  onStepClick?: ((index: number) => void) | undefined;
  /** Accessible name for the list. */
  label?: string | undefined;
  className?: string | undefined;
}

const Root = styled.div`
  width: 100%;
`;

const Names = styled.span`
  display: grid;
  margin-bottom: 10px;
  font-size: 13px;
  font-weight: 500;
  line-height: 18px;
  letter-spacing: -0.01em;
  color: ${({ theme }) => theme.colors.text};
  user-select: none;
`;

const Name = styled(motion.span)`
  grid-area: 1 / 1;
  white-space: nowrap;
`;

const Count = styled.span`
  color: ${({ theme }) => theme.colors.textSecondary};
  font-weight: 400;
  font-variant-numeric: tabular-nums;
`;

const List = styled.ol`
  display: flex;
  align-items: center;
  gap: 6px;
  list-style: none;
  margin: 0;
  padding: 0;
`;

const Item = styled.li`
  display: flex;
  flex: 1;
  align-items: center;
  gap: 6px;

  &:last-child {
    flex: none;
  }
`;

const ChipButton = styled.button`
  all: unset;
  border-radius: 10px;
  cursor: pointer;

  &[aria-current='step'] {
    cursor: default;
  }

  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 3px var(--focus-ring-color);
  }
`;

const Chip = styled(motion.span)<{ $state: 'done' | 'here' | 'todo' }>`
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  transition:
    background-color 160ms var(--ease),
    color 160ms var(--ease),
    box-shadow 160ms var(--ease);
  background: ${({ $state, theme }) =>
    $state === 'done' ? theme.colors.primary : theme.colors.surface};
  color: ${({ $state, theme }) =>
    $state === 'done'
      ? theme.colors.textOnPrimary
      : $state === 'here'
        ? theme.colors.primary
        : theme.colors.textSecondary};
  box-shadow: ${({ $state, theme }) =>
    $state === 'done'
      ? 'none'
      : $state === 'here'
        ? `inset 0 0 0 1.5px ${theme.colors.primary}`
        : 'inset 0 0 0 1px var(--border-strong)'};
`;

const Track = styled.span`
  position: relative;
  flex: 1;
  height: 3px;
  overflow: hidden;
  border-radius: 2px;
  background: var(--surface-fill);
`;

const TrackFill = styled(motion.span)`
  position: absolute;
  inset: 0;
  transform-origin: left center;
  border-radius: 2px;
  background: ${({ theme }) => theme.colors.primary};
`;

const SrOnly = styled.span`
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
`;

function Check() {
  return (
    <svg width="12" height="12" viewBox="0 0 256 256" fill="none" aria-hidden="true">
      <polyline
        points="216 72 104 184 48 128"
        stroke="currentColor"
        strokeWidth="26"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Where an arrow, Home or End key moves focus from `index`, or null. */
function keyTarget(key: string, index: number, reach: number): number | null {
  const moves: Record<string, number> = {
    ArrowDown: index + 1,
    ArrowLeft: index - 1,
    ArrowRight: index + 1,
    ArrowUp: index - 1,
    End: reach,
    Home: 0,
  };
  const target = moves[key];
  return target === undefined ? null : Math.max(0, Math.min(target, reach));
}

function StepChip({
  state,
  number,
  reduced,
}: {
  state: 'done' | 'here' | 'todo';
  number: number;
  reduced: boolean;
}) {
  return (
    <Chip
      aria-hidden
      $state={state}
      initial={false}
      animate={{ scale: state === 'here' ? 1 : 0.92 }}
      transition={reduced ? INSTANT : RAIL}
    >
      {state === 'done' ? <Check /> : number}
    </Chip>
  );
}

function RailStep({
  name,
  position,
  state,
  last,
  reduced,
  onKeyDown,
  onSelect,
}: {
  name: string;
  position: number;
  state: 'done' | 'here' | 'todo';
  last: boolean;
  reduced: boolean;
  onKeyDown: (event: KeyboardEvent<HTMLButtonElement>) => void;
  onSelect?: ((index: number) => void) | undefined;
}) {
  const here = state === 'here';
  const chip = <StepChip state={state} number={position + 1} reduced={reduced} />;
  return (
    <Item>
      {onSelect ? (
        <ChipButton
          type="button"
          data-step={position}
          tabIndex={here ? 0 : -1}
          aria-current={here ? 'step' : undefined}
          aria-label={name}
          onKeyDown={onKeyDown}
          onClick={() => {
            if (!here) onSelect(position);
          }}
        >
          {chip}
        </ChipButton>
      ) : (
        <span aria-current={here ? 'step' : undefined}>
          <SrOnly>{name}</SrOnly>
          {chip}
        </span>
      )}
      {last ? null : (
        <Track aria-hidden>
          <TrackFill
            initial={false}
            animate={{ scaleX: state === 'done' ? 1 : 0 }}
            transition={reduced ? INSTANT : RAIL}
          />
        </Track>
      )}
    </Item>
  );
}

export function WizardRail({
  steps,
  index,
  furthest = index,
  complete = false,
  onStepClick,
  label = 'Progress',
  className,
}: WizardRailProps) {
  const reduced = useReducedMotion();
  const listRef = useRef<HTMLOListElement>(null);
  const total = steps.length;
  const reach = Math.max(furthest, index);

  const focusStep = (target: number) => {
    requestAnimationFrame(() => {
      listRef.current?.querySelector<HTMLButtonElement>(`[data-step="${target}"]`)?.focus();
    });
  };

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    const target = keyTarget(event.key, index, reach);
    if (target === null) return;
    event.preventDefault();
    if (target === index) return;
    onStepClick?.(target);
    focusStep(target);
  };

  return (
    <Root className={className}>
      <Names aria-hidden>
        {steps.map((name, i) => (
          <Name
            key={name}
            initial={false}
            animate={{ opacity: i === index ? 1 : 0 }}
            transition={reduced ? INSTANT : CROSSFADE}
          >
            {name}{' '}
            <Count>
              · {i + 1} of {total}
            </Count>
          </Name>
        ))}
      </Names>
      <SrOnly aria-live="polite">{`Step ${index + 1} of ${total}: ${steps[index] ?? ''}`}</SrOnly>

      <List ref={listRef} aria-label={label}>
        {steps.map((name, i) => {
          const here = !complete && i === index;
          const state = complete || i < index ? 'done' : here ? 'here' : 'todo';
          return (
            <RailStep
              key={name}
              name={`Step ${i + 1} of ${total}: ${name}`}
              position={i}
              state={state}
              last={i === total - 1}
              reduced={Boolean(reduced)}
              onKeyDown={onKeyDown}
              onSelect={onStepClick && i <= reach ? onStepClick : undefined}
            />
          );
        })}
      </List>
    </Root>
  );
}

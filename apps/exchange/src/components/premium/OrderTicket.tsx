/**
 * Order ticket parts — the amount field, quick-amount chips, summary lines and
 * the side-coloured action that make up a buy or sell form.
 *
 * Anatomy after 21st.dev "Prediction Market" order form by @starc007
 * (demo 16240): amount entry is the loudest thing on the ticket, quick
 * amounts sit directly under it as a compact chip row, and a quiet summary
 * precedes one full-width action. The chips ride a sliding pill on the same
 * spring as every segmented control in the app.
 */
import { LayoutGroup, motion, useReducedMotion } from 'motion/react';
import { type InputHTMLAttributes, type ReactNode, useId } from 'react';
import styled, { css } from 'styled-components';
import { chrome, spring } from '@/styles/tokens';

type Side = 'buy' | 'sell';

/* ---------------------------------------------------------------- field */

const FieldRoot = styled.label<{ $disabled?: boolean | undefined }>`
  display: flex;
  flex-direction: column;
  gap: 6px;
  opacity: ${({ $disabled }) => ($disabled ? 0.6 : 1)};
`;

const FieldTop = styled.span`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
  font-size: 12px;
  line-height: 16px;
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const Well = styled.span`
  display: flex;
  align-items: center;
  gap: 8px;
  height: 44px;
  padding: 0 12px 0 14px;
  border-radius: 10px;
  background: ${({ theme }) => chrome[theme.mode].fill};
  box-shadow: inset 0 0 0 1px transparent;
  transition:
    box-shadow 160ms cubic-bezier(0.32, 0.72, 0, 1),
    background-color 160ms cubic-bezier(0.32, 0.72, 0, 1);

  &:hover {
    background: ${({ theme }) => chrome[theme.mode].fillHover};
  }

  &:focus-within {
    background: ${({ theme }) => theme.colors.surface};
    box-shadow:
      inset 0 0 0 1px ${({ theme }) => theme.colors.primary},
      0 0 0 4px color-mix(in srgb, ${({ theme }) => theme.colors.primary} 18%, transparent);
  }
`;

const Input = styled.input`
  all: unset;
  flex: 1;
  min-width: 0;
  font-size: 17px;
  font-weight: 500;
  letter-spacing: -0.01em;
  font-variant-numeric: tabular-nums;
  color: ${({ theme }) => theme.colors.text};
  caret-color: ${({ theme }) => theme.colors.primary};

  &::placeholder {
    color: ${({ theme }) => theme.colors.textSubtle};
  }

  &::-webkit-outer-spin-button,
  &::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }

  -moz-appearance: textfield;

  &:disabled {
    cursor: not-allowed;
  }
`;

const Unit = styled.span`
  flex-shrink: 0;
  font-size: 13px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textSecondary};
`;

export interface AmountFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label: string;
  /** The asset the number is denominated in, shown inside the field. */
  unit?: string | undefined;
  /** Anything that belongs on the label line, such as the available balance. */
  hint?: ReactNode | undefined;
}

export function AmountField({ label, unit, hint, disabled, id, ...input }: AmountFieldProps) {
  const auto = useId();
  const inputId = id ?? auto;
  return (
    <FieldRoot htmlFor={inputId} $disabled={disabled}>
      <FieldTop>
        <span>{label}</span>
        {hint}
      </FieldTop>
      <Well>
        <Input id={inputId} inputMode="decimal" disabled={disabled} {...input} />
        {unit ? <Unit>{unit}</Unit> : null}
      </Well>
    </FieldRoot>
  );
}

/* --------------------------------------------------------- quick amounts */

const ChipTrack = styled.div`
  position: relative;
  display: grid;
  grid-auto-columns: minmax(0, 1fr);
  grid-auto-flow: column;
  padding: 2px;
  border-radius: 10px;
  background: ${({ theme }) => chrome[theme.mode].fill};
`;

const Chip = styled(motion.button)<{ $active: boolean }>`
  all: unset;
  position: relative;
  box-sizing: border-box;
  padding: 5px 0;
  border-radius: 8px;
  text-align: center;
  font-size: 12px;
  font-weight: 500;
  line-height: 18px;
  font-variant-numeric: tabular-nums;
  cursor: pointer;
  color: ${({ theme, $active }) => ($active ? theme.colors.text : theme.colors.textSecondary)};
  transition: color 160ms cubic-bezier(0.32, 0.72, 0, 1);

  &:hover:not(:disabled) {
    color: ${({ theme }) => theme.colors.text};
  }

  &:focus-visible {
    box-shadow: inset 0 0 0 2px ${({ theme }) => theme.colors.primary};
  }

  &:disabled {
    cursor: not-allowed;
    color: ${({ theme }) => theme.colors.disabled};
  }

  & > span {
    position: relative;
    z-index: 1;
  }
`;

const ChipThumb = styled(motion.span)`
  position: absolute;
  inset: 0;
  border-radius: 8px;
  background: ${({ theme }) => chrome[theme.mode].thumb};
  box-shadow: ${({ theme }) => chrome[theme.mode].thumbShadow};
`;

export interface QuickAmountsProps {
  options: number[];
  value: number | null;
  onSelect: (value: number) => void;
  disabled?: boolean | undefined;
  /** Accessible name for the group. */
  label: string;
  format?: (value: number) => string;
}

export function QuickAmounts({
  options,
  value,
  onSelect,
  disabled,
  label,
  format = (v) => `${v}%`,
}: QuickAmountsProps) {
  const id = useId();
  const reduced = useReducedMotion();
  return (
    <LayoutGroup id={id}>
      <ChipTrack role="group" aria-label={label}>
        {options.map((option) => {
          const active = value === option;
          return (
            <Chip
              key={option}
              type="button"
              $active={active}
              aria-pressed={active}
              disabled={disabled}
              onClick={() => onSelect(option)}
              whileTap={disabled || reduced ? {} : { scale: 0.97 }}
            >
              {active ? (
                <ChipThumb layoutId="quick-thumb" transition={reduced ? { duration: 0 } : spring} />
              ) : null}
              <span>{format(option)}</span>
            </Chip>
          );
        })}
      </ChipTrack>
    </LayoutGroup>
  );
}

/* --------------------------------------------------------------- summary */

const Summary = styled.dl`
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin: 0;
  padding: 12px 0 0;
  border-top: 1px solid ${({ theme }) => theme.colors.border};
`;

const Line = styled.div<{ $strong?: boolean | undefined }>`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  font-size: 13px;
  line-height: 18px;

  dt {
    color: ${({ theme }) => theme.colors.textSecondary};
  }

  dd {
    margin: 0;
    text-align: right;
    font-variant-numeric: tabular-nums;
    color: ${({ theme }) => theme.colors.text};
    ${({ $strong }) =>
      $strong &&
      css`
        font-size: 15px;
        font-weight: 600;
      `}
  }
`;

export function OrderSummary({ children }: { children: ReactNode }) {
  return <Summary>{children}</Summary>;
}

export function SummaryLine({
  label,
  children,
  strong,
}: {
  label: ReactNode;
  children: ReactNode;
  strong?: boolean | undefined;
}) {
  return (
    <Line $strong={strong}>
      <dt>{label}</dt>
      <dd>{children}</dd>
    </Line>
  );
}

/* ---------------------------------------------------------------- action */

const Action = styled(motion.button)<{ $side: Side }>`
  all: unset;
  box-sizing: border-box;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  height: 48px;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 600;
  letter-spacing: -0.01em;
  cursor: pointer;
  color: ${({ theme, $side }) => ($side === 'buy' ? theme.colors.onBuy : theme.colors.onSell)};
  background: ${({ theme, $side }) => ($side === 'buy' ? theme.colors.buy : theme.colors.sell)};
  transition:
    filter 160ms cubic-bezier(0.32, 0.72, 0, 1),
    background-color 200ms cubic-bezier(0.32, 0.72, 0, 1);

  &:hover:not(:disabled) {
    filter: brightness(1.06);
  }

  &:active:not(:disabled) {
    filter: brightness(0.94);
  }

  &:focus-visible {
    box-shadow:
      0 0 0 2px ${({ theme }) => theme.colors.surface},
      0 0 0 4px ${({ theme }) => theme.colors.primary};
  }

  &:disabled {
    cursor: not-allowed;
    color: ${({ theme }) => theme.colors.disabled};
    background: ${({ theme }) => chrome[theme.mode].fill};
  }
`;

const Spinner = styled.span`
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 2px solid currentColor;
  border-right-color: transparent;
  animation: ticket-spin 700ms linear infinite;

  @keyframes ticket-spin {
    to {
      transform: rotate(360deg);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    animation-duration: 2s;
  }
`;

export interface SideActionProps {
  side: Side;
  loading?: boolean | undefined;
  disabled?: boolean | undefined;
  type?: 'submit' | 'button' | undefined;
  onClick?: () => void;
  children: ReactNode;
}

export function SideAction({
  side,
  loading,
  disabled,
  type = 'submit',
  onClick,
  children,
}: SideActionProps) {
  const reduced = useReducedMotion();
  const off = disabled || loading;
  return (
    <Action
      type={type}
      $side={side}
      disabled={Boolean(off)}
      aria-busy={loading || undefined}
      onClick={onClick}
      whileTap={off || reduced ? {} : { scale: 0.97 }}
      transition={spring}
    >
      {loading ? <Spinner aria-hidden /> : null}
      {children}
    </Action>
  );
}

/* ---------------------------------------------------------------- notice */

export const TicketNotice = styled.p<{ $tone?: 'danger' | 'neutral' | undefined }>`
  margin: 0;
  padding: 10px 12px;
  border-radius: 10px;
  font-size: 13px;
  line-height: 18px;
  color: ${({ theme, $tone = 'danger' }) => ($tone === 'danger' ? theme.colors.error : theme.colors.textSecondary)};
  background: ${({ theme, $tone = 'danger' }) =>
    `color-mix(in srgb, ${$tone === 'danger' ? theme.colors.error : theme.colors.text} 8%, transparent)`};
`;

/** A small inline text button for the label line, e.g. "Max". */
export const InlineAction = styled.button`
  all: unset;
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.primary};
  border-radius: 4px;

  &:hover:not(:disabled) {
    text-decoration: underline;
  }

  &:focus-visible {
    box-shadow: 0 0 0 2px ${({ theme }) => theme.colors.primary};
  }

  &:disabled {
    cursor: not-allowed;
    color: ${({ theme }) => theme.colors.disabled};
  }
`;

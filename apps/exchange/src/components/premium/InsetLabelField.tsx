/**
 * Inset-label field — the Apple ID sign-in field. The label rests inside the
 * empty field like a placeholder and springs up to the field's top edge on
 * focus or once there is a value, so the field never changes height and never
 * loses its name. Password fields carry a show/hide control; multiline fields
 * become a textarea with the same behaviour.
 *
 * Ported from 21st.dev "Floating Label" by @ddoemonn (demo 23565), for the
 * auth screens. The spring and the "final state on first paint" rule are the
 * original's; the label lifts inside the field rather than into a slot above
 * it, and it is the one text-field vocabulary for forms across the app.
 * Colours come from the theme tokens.
 */
import { Eye, EyeOff } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import {
  type ChangeEvent,
  type InputHTMLAttributes,
  type KeyboardEvent,
  type ReactNode,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react';
import styled, { css } from 'styled-components';
import { chrome } from '@/styles/tokens';
import { hasContent } from './hasContent';

const LIFT = { damping: 46, mass: 0.5, stiffness: 760, type: 'spring' } as const;
const INSTANT = { duration: 0 } as const;

type FieldElement = HTMLInputElement | HTMLTextAreaElement;

export interface InsetLabelFieldProps {
  label: string;
  value: string;
  onChange: (value: string, event: ChangeEvent<FieldElement>) => void;
  type?: 'text' | 'password' | 'email' | 'number' | 'search' | undefined;
  /** Helper text below the field; shown in the error tone when `invalid`. */
  hint?: ReactNode | undefined;
  /** Shown only once the label has lifted and the field is still empty, so it
   *  never competes with the resting label. */
  placeholder?: string | undefined;
  invalid?: boolean | undefined;
  id?: string | undefined;
  name?: string | undefined;
  autoComplete?: string | undefined;
  autoFocus?: boolean | undefined;
  disabled?: boolean | undefined;
  required?: boolean | undefined;
  maxLength?: number | undefined;
  min?: number | undefined;
  step?: number | 'any' | undefined;
  inputMode?: InputHTMLAttributes<HTMLInputElement>['inputMode'] | undefined;
  /** Renders a textarea. */
  multiline?: boolean | undefined;
  rows?: number | undefined;
  /** Monospace text, for keys and phrases. */
  mono?: boolean | undefined;
  spellCheck?: boolean | undefined;
  onKeyDown?: ((event: KeyboardEvent<FieldElement>) => void) | undefined;
  onBlur?: (() => void) | undefined;
  className?: string | undefined;
}

const Shell = styled.div<{ $focused: boolean; $invalid: boolean; $disabled: boolean }>`
  position: relative;
  border-radius: 10px;
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid var(--border-strong);
  transition:
    border-color 160ms var(--ease),
    box-shadow 160ms var(--ease);
  opacity: ${({ $disabled }) => ($disabled ? 0.55 : 1)};

  ${({ $focused, theme }) =>
    $focused &&
    css`
      border-color: ${theme.colors.primary};
      box-shadow: 0 0 0 3px var(--focus-ring-color);
    `}

  ${({ $invalid, theme }) =>
    $invalid &&
    css`
      border-color: ${theme.colors.error};
      box-shadow: 0 0 0 3px ${chrome[theme.mode].dangerHalo};
    `}
`;

const control = css<{ $mono: boolean; $trailing: boolean }>`
  display: block;
  width: 100%;
  box-sizing: border-box;
  border: 0;
  outline: none;
  background: transparent;
  color: ${({ theme }) => theme.colors.text};
  font-family: ${({ $mono, theme }) => ($mono ? theme.fonts.mono : 'inherit')};
  font-size: ${({ $mono }) => ($mono ? '15px' : '16px')};
  letter-spacing: ${({ $mono }) => ($mono ? '0' : '-0.01em')};
  padding: 24px ${({ $trailing }) => ($trailing ? '48px' : '14px')} 8px 14px;
  border-radius: 10px;

  &:focus,
  &:focus-visible {
    outline: none;
  }

  &::placeholder {
    color: ${({ theme }) => theme.colors.textSecondary};
    opacity: 0.7;
  }

  &:disabled {
    cursor: not-allowed;
  }
`;

const Input = styled.input<{ $mono: boolean; $trailing: boolean }>`
  ${control}
  height: 54px;
  line-height: 22px;
`;

const Textarea = styled.textarea<{ $mono: boolean; $trailing: boolean }>`
  ${control}
  min-height: 112px;
  resize: vertical;
  line-height: 1.55;
  padding-top: 28px;
`;

const Label = styled(motion.label)<{ $error: boolean }>`
  position: absolute;
  left: 14px;
  top: 16px;
  font-size: 16px;
  line-height: 22px;
  letter-spacing: -0.01em;
  pointer-events: none;
  user-select: none;
  white-space: nowrap;
  transform-origin: 0 0;
  color: ${({ $error, theme }) => ($error ? theme.colors.error : theme.colors.textSecondary)};
`;

const Reveal = styled.button`
  all: unset;
  position: absolute;
  right: 6px;
  top: 7px;
  width: 40px;
  height: 40px;
  display: grid;
  place-items: center;
  border-radius: 8px;
  cursor: pointer;
  color: ${({ theme }) => theme.colors.textSecondary};
  transition:
    background-color 160ms var(--ease),
    color 160ms var(--ease);

  &:hover {
    color: ${({ theme }) => theme.colors.text};
    background: var(--surface-fill);
  }

  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 3px var(--focus-ring-color);
  }
`;

const Hint = styled.p<{ $error: boolean }>`
  margin: 6px 2px 0;
  /* Overrides the global prose measure so the counter reaches the field's edge. */
  max-width: none;
  font-size: 12px;
  line-height: 16px;
  color: ${({ $error, theme }) => ($error ? theme.colors.error : theme.colors.textSecondary)};
`;

const Counter = styled.span`
  float: right;
  margin-left: 12px;
  font-variant-numeric: tabular-nums;
`;

export function InsetLabelField({
  label,
  value,
  onChange,
  type = 'text',
  hint,
  placeholder,
  invalid = false,
  id,
  name,
  autoComplete,
  autoFocus,
  disabled = false,
  required,
  maxLength,
  min,
  step,
  inputMode,
  multiline = false,
  rows,
  mono = false,
  spellCheck,
  onKeyDown,
  onBlur,
  className,
}: InsetLabelFieldProps) {
  const auto = useId();
  const fieldId = id ?? `${auto}-field`;
  const hintId = `${auto}-hint`;
  const reduced = useReducedMotion();
  const [focused, setFocused] = useState(false);
  const [shown, setShown] = useState(false);

  // The first paint lands in its final state; only later changes animate.
  const mounted = useRef(false);
  useEffect(() => {
    mounted.current = true;
  }, []);

  useEffect(() => {
    if (disabled) setFocused(false);
  }, [disabled]);

  const raised = focused || value.length > 0;
  const isPassword = type === 'password';

  const shared = {
    'aria-describedby': hasContent(hint) ? hintId : undefined,
    'aria-invalid': invalid || undefined,
    'aria-required': required || undefined,
    autoComplete,
    autoFocus,
    disabled,
    id: fieldId,
    maxLength,
    name,
    onBlur: () => {
      setFocused(false);
      onBlur?.();
    },
    onChange: (event: ChangeEvent<FieldElement>) => onChange(event.currentTarget.value, event),
    onFocus: () => setFocused(true),
    onKeyDown,
    placeholder: raised ? placeholder : undefined,
    required,
    spellCheck,
    value,
  };

  return (
    <div className={className}>
      <Shell $focused={focused} $invalid={invalid} $disabled={disabled}>
        {multiline ? (
          <Textarea {...shared} rows={rows} $mono={mono} $trailing={false} />
        ) : (
          <Input
            {...shared}
            type={isPassword && shown ? 'text' : type}
            min={min}
            step={step}
            inputMode={inputMode}
            $mono={mono}
            $trailing={isPassword}
          />
        )}

        <Label
          htmlFor={fieldId}
          $error={invalid}
          initial={false}
          animate={{ scale: raised ? 0.75 : 1, y: raised ? -9 : 0 }}
          transition={reduced || !mounted.current ? INSTANT : LIFT}
        >
          {label}
        </Label>

        {isPassword ? (
          <Reveal
            type="button"
            aria-label={shown ? 'Hide password' : 'Show password'}
            aria-pressed={shown}
            aria-controls={fieldId}
            disabled={disabled}
            onClick={() => setShown((s) => !s)}
          >
            {shown ? <EyeOff size={18} strokeWidth={1.75} /> : <Eye size={18} strokeWidth={1.75} />}
          </Reveal>
        ) : null}
      </Shell>

      {hint || maxLength !== undefined ? (
        <Hint id={hasContent(hint) ? hintId : undefined} $error={invalid}>
          {maxLength !== undefined ? (
            <Counter aria-hidden>
              {value.length} / {maxLength}
            </Counter>
          ) : null}
          {hint}
        </Hint>
      ) : null}
    </div>
  );
}

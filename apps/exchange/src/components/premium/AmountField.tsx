/**
 * Large centred amount entry, after Apple Cash: the figure is the field, the
 * asset symbol sits beside it, and a MAX chip and the available balance sit
 * underneath. The input grows with what is typed so the figure stays centred.
 *
 * Figure treatment after 21st.dev "Progress Metric Card" by @makviesainte
 * (demo 15024): an oversized semibold number with tight tracking and a quiet
 * meta row beneath it.
 */
import { type ChangeEvent, useId } from 'react';
import styled from 'styled-components';
import { chrome } from '@/styles/tokens';

const Root = styled.div<{ $invalid: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 20px 16px 16px;
  border-radius: 16px;
  background: ${({ theme }) => chrome[theme.mode].fillSubtle};
  box-shadow: ${({ theme, $invalid }) => ($invalid ? `inset 0 0 0 1.5px ${theme.colors.error}` : 'none')};
  transition: box-shadow 160ms cubic-bezier(0.32, 0.72, 0, 1);

  &:focus-within {
    box-shadow: inset 0 0 0 1.5px
      ${({ theme, $invalid }) => ($invalid ? theme.colors.error : theme.colors.primary)};
  }
`;

const Figure = styled.label`
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 8px;
  max-width: 100%;
  cursor: text;
`;

const Input = styled.input`
  min-width: 1ch;
  max-width: 100%;
  padding: 0;
  border: 0;
  outline: none;
  background: transparent;
  font: inherit;
  font-size: 44px;
  font-weight: 600;
  line-height: 1.1;
  letter-spacing: -0.03em;
  text-align: center;
  font-variant-numeric: tabular-nums;
  color: ${({ theme }) => theme.colors.text};
  caret-color: ${({ theme }) => theme.colors.primary};

  &::placeholder {
    color: ${({ theme }) => theme.colors.textSubtle};
  }

  &:disabled {
    opacity: 0.5;
  }

  /* No spinners on a figure this size. */
  &::-webkit-outer-spin-button,
  &::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
  -moz-appearance: textfield;

  @media (max-width: 480px) {
    font-size: 36px;
  }
`;

const Unit = styled.span`
  font-size: 20px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textSecondary};
  white-space: nowrap;
  flex-shrink: 0;
`;

const Meta = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textSecondary};
  font-variant-numeric: tabular-nums;
`;

const Max = styled.button`
  height: 24px;
  padding: 0 10px;
  border: 0;
  border-radius: 9999em;
  font: inherit;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.02em;
  cursor: pointer;
  color: ${({ theme }) => theme.colors.primary};
  background: ${({ theme }) => theme.colors.primarySurface};
  transition: transform 160ms cubic-bezier(0.32, 0.72, 0, 1);

  &:hover {
    background: ${({ theme }) => theme.colors.primaryBorder};
  }

  &:active {
    transform: scale(0.97);
  }

  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.primaryBorder};
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
`;

const ErrorText = styled.div`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.error};
`;

export interface AmountFieldProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: (() => void) | undefined;
  symbol: string;
  /** Pre-formatted available balance, shown under the figure. */
  available?: string | undefined;
  onMax?: (() => void) | undefined;
  error?: string | null | undefined;
  disabled?: boolean | undefined;
  label?: string | undefined;
}

export function AmountField({
  value,
  onChange,
  onBlur,
  symbol,
  available,
  onMax,
  error,
  disabled,
  label = 'Amount',
}: AmountFieldProps) {
  const id = useId();
  const errorId = `${id}-error`;
  return (
    <Root $invalid={Boolean(error)}>
      <Figure htmlFor={id}>
        <Input
          id={id}
          type="number"
          inputMode="decimal"
          placeholder="0"
          aria-label={label}
          aria-invalid={Boolean(error) || undefined}
          aria-describedby={error ? errorId : undefined}
          value={value}
          disabled={disabled}
          onBlur={onBlur}
          onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
          style={{ width: `${Math.max(1, (value || '0').length) + 0.5}ch` }}
        />
        <Unit>{symbol}</Unit>
      </Figure>
      <Meta>
        {available !== undefined ? <span>Available {available}</span> : null}
        {onMax ? (
          <Max type="button" onClick={onMax} disabled={disabled}>
            MAX
          </Max>
        ) : null}
      </Meta>
      {error ? (
        <ErrorText id={errorId} role="alert">
          {error}
        </ErrorText>
      ) : null}
    </Root>
  );
}

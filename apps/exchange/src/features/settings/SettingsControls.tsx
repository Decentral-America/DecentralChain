/**
 * Small controls shared by the settings panes: a copy button that confirms in
 * place, a monospace well for keys and seeds, and a text field in the system's
 * field material. They sit inside `SettingsRow`s from the premium kit.
 */
import { Check, Copy } from 'lucide-react';
import type React from 'react';
import styled from 'styled-components';
import { fieldFocus, fieldSurface } from '@/components/premium/fieldStyles';
import { chrome } from '@/styles/tokens';

const EASE = 'cubic-bezier(0.32, 0.72, 0, 1)';

const Quiet = styled.button<{ $done: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
  height: 32px;
  padding: 0 12px;
  border: 0;
  border-radius: 8px;
  font: inherit;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  color: ${({ theme, $done }) => ($done ? theme.colors.success : theme.colors.text)};
  background: ${({ theme }) => chrome[theme.mode].fill};
  transition:
    background-color 160ms ${EASE},
    transform 160ms ${EASE},
    color 160ms ${EASE};

  &:hover {
    background: ${({ theme }) => chrome[theme.mode].fillHover};
  }

  &:active {
    transform: scale(0.97);
  }

  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.primary};
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
`;

/** A grey-fill secondary button sized for a settings row. */
export function RowButton({
  children,
  onClick,
  disabled,
  'aria-label': ariaLabel,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  'aria-label'?: string;
}) {
  return (
    <Quiet type="button" $done={false} onClick={onClick} disabled={disabled} aria-label={ariaLabel}>
      {children}
    </Quiet>
  );
}

/** Copies, then says so for as long as the caller reports `copied`. */
export function CopyButton({
  copied,
  onCopy,
  what,
}: {
  copied: boolean;
  onCopy: () => void;
  /** What is being copied, for the accessible name. */
  what: string;
}) {
  return (
    <Quiet
      type="button"
      $done={copied}
      onClick={onCopy}
      aria-label={copied ? `${what} copied` : `Copy ${what}`}
    >
      {copied ? (
        <Check size={14} strokeWidth={2.25} aria-hidden />
      ) : (
        <Copy size={14} strokeWidth={2} aria-hidden />
      )}
      {copied ? 'Copied' : 'Copy'}
    </Quiet>
  );
}

/** Keys, seeds and addresses: monospace, selectable, wrapped anywhere. */
export const MonoWell = styled.div`
  width: 100%;
  box-sizing: border-box;
  padding: 10px 12px;
  border-radius: 8px;
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: 13px;
  line-height: 1.5;
  color: ${({ theme }) => theme.colors.text};
  background: ${({ theme }) => chrome[theme.mode].fillSubtle};
  overflow-wrap: anywhere;
  user-select: all;
  white-space: pre-wrap;
`;

/** A read-only value shown right-aligned and truncated from the middle's end. */
export const MonoValue = styled.span`
  display: block;
  max-width: 100%;
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textSecondary};
  overflow-wrap: anywhere;
  text-align: left;
  user-select: all;
`;

export const FieldInput = styled.input<{ $invalid?: boolean }>`
  ${fieldSurface}
  flex: 1;
  min-width: 0;
  height: 40px;
  padding: 0 12px;
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: 13px;

  &:focus {
    ${fieldFocus}
  }
`;

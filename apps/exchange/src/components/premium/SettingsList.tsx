/**
 * Grouped inset settings list, in the manner of macOS System Settings and iOS
 * Settings: a quiet group heading, then one lifted surface holding rows with
 * the label on the left and its control on the right, split by hairlines that
 * start where the text starts.
 *
 * A row is either static (a label and a control), or a whole-row button when
 * `onClick` is given, which then gets the hover fill and a chevron.
 */
import { ChevronRight } from 'lucide-react';
import { type ReactNode } from 'react';
import styled, { css } from 'styled-components';
import { hasContent } from './hasContent';

const EASE = 'cubic-bezier(0.32, 0.72, 0, 1)';

const Group = styled.section`
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
`;

const GroupTitle = styled.h2`
  margin: 0;
  padding: 0 16px;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: -0.08px;
  color: ${({ theme }) => theme.colors.text};
`;

const GroupFooter = styled.p`
  margin: 0;
  padding: 0 16px;
  font-size: 12px;
  line-height: 1.45;
  color: ${({ theme }) => theme.colors.textSecondary};
`;

/* One surface per group: a soft shadow in light mode, a hairline in dark. */
const Surface = styled.div`
  overflow: hidden;
  border-radius: 12px;
  background: ${({ theme }) => theme.colors.surface};
  box-shadow: ${({ theme }) =>
    theme.mode === 'dark' ? `0 0 0 1px ${theme.colors.border}` : theme.shadows.sm};
`;

const rowBase = css`
  position: relative;
  display: flex;
  align-items: center;
  gap: 16px;
  width: 100%;
  min-height: 52px;
  padding: 10px 16px;
  box-sizing: border-box;
  text-align: left;
  color: ${({ theme }) => theme.colors.text};

  /* Hairline inset to the text edge, drawn by every row but the first. */
  & + &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 16px;
    right: 0;
    height: 1px;
    background: ${({ theme }) => theme.colors.border};
  }
`;

const StaticRow = styled.div<{ $stack: boolean }>`
  ${rowBase}
  ${({ $stack }) =>
    $stack &&
    css`
      flex-wrap: wrap;
    `}
`;

const ButtonRow = styled.button`
  ${rowBase}
  font: inherit;
  border: 0;
  background: transparent;
  cursor: pointer;
  transition: background-color 160ms ${EASE};

  &:hover {
    background: ${({ theme }) => theme.colors.hover};
  }

  &:active {
    background: ${({ theme }) => theme.colors.surfaceHover};
  }

  &:focus-visible {
    outline: none;
    box-shadow: inset 0 0 0 2px ${({ theme }) => theme.colors.primary};
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
`;

const Text = styled.div`
  display: flex;
  flex: 1 1 200px;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
`;

const Label = styled.span<{ $tone?: 'danger' | 'accent' | undefined }>`
  font-size: 15px;
  line-height: 1.33;
  letter-spacing: -0.15px;
  color: ${({ theme, $tone }) =>
    $tone === 'danger'
      ? theme.colors.error
      : $tone === 'accent'
        ? theme.colors.primary
        : theme.colors.text};
`;

const Description = styled.span`
  font-size: 13px;
  line-height: 1.4;
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const Control = styled.div<{ $stack: boolean }>`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  min-width: 0;
  flex: ${({ $stack }) => ($stack ? '1 1 100%' : '0 1 auto')};
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: 15px;
  font-variant-numeric: tabular-nums;
`;

const Chevron = styled(ChevronRight)`
  flex-shrink: 0;
  color: ${({ theme }) => theme.colors.textSubtle};
`;

export interface SettingsGroupProps {
  title?: string;
  /** A sentence under the group explaining what the settings do. */
  footer?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function SettingsGroup({ title, footer, children, className }: SettingsGroupProps) {
  return (
    <Group className={className}>
      {title ? <GroupTitle>{title}</GroupTitle> : null}
      <Surface>{children}</Surface>
      {hasContent(footer) ? <GroupFooter>{footer}</GroupFooter> : null}
    </Group>
  );
}

export interface SettingsRowProps {
  label: ReactNode;
  description?: ReactNode;
  /** The control, or a read-only value, aligned to the right. */
  control?: ReactNode;
  /** Makes the whole row one button, with a chevron. */
  onClick?: () => void;
  /** Colours the label for destructive or primary row actions. */
  tone?: 'danger' | 'accent';
  /** Lets a wide control (a field, a revealed secret) take the full row below the label. */
  stack?: boolean;
  disabled?: boolean;
  /** Associates the label with a form control for click-to-focus. */
  htmlFor?: string;
}

export function SettingsRow({
  label,
  description,
  control,
  onClick,
  tone,
  stack = false,
  disabled,
  htmlFor,
}: SettingsRowProps) {
  const text = (
    <Text>
      <Label $tone={tone} {...((htmlFor ? { as: 'label', htmlFor } : {}) as object)}>
        {label}
      </Label>
      {hasContent(description) ? <Description>{description}</Description> : null}
    </Text>
  );

  if (onClick) {
    return (
      <ButtonRow type="button" onClick={onClick} disabled={disabled}>
        {text}
        {hasContent(control) ? <Control $stack={false}>{control}</Control> : null}
        <Chevron size={16} strokeWidth={2} aria-hidden />
      </ButtonRow>
    );
  }

  return (
    <StaticRow $stack={stack}>
      {text}
      {control !== undefined ? <Control $stack={stack}>{control}</Control> : null}
    </StaticRow>
  );
}

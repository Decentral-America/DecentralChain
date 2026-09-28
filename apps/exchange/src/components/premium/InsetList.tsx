/**
 * Apple grouped inset list: one lifted surface, rows separated by hairlines
 * that start past the avatar, values right-aligned in tabular numerals.
 *
 * Row anatomy ported from 21st.dev "Market Watchlist" by @ssychui (demo
 * 22252): symbol over a muted secondary line on the left, an optional trend in
 * the middle, the figure and its qualifier stacked on the right. The dense
 * trading header and the selected-row accent bar are dropped; this is a list a
 * holder reads, not a terminal.
 */
import { Skeleton } from '@mui/material';
import { type ReactNode } from 'react';
import styled, { css } from 'styled-components';
import { chrome } from '@/styles/tokens';
import { hasContent } from './hasContent';

const AVATAR = 40;
const PAD_X = 16;
const GAP = 12;

export const InsetGroup = styled.section`
  position: relative;
  overflow: hidden;
  border-radius: 16px;
  background: ${({ theme }) => theme.colors.surface};
  box-shadow: ${({ theme }) =>
    theme.mode === 'dark' ? `0 0 0 1px ${theme.colors.border}` : 'var(--shadow-md)'};
`;

const HeaderRoot = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-height: 32px;
  margin: 0 4px 8px;
`;

const HeaderTitle = styled.h2`
  margin: 0;
  font-size: 17px;
  font-weight: 600;
  letter-spacing: -0.3px;
  color: ${({ theme }) => theme.colors.text};

  small {
    margin-left: 8px;
    font-size: 13px;
    font-weight: 400;
    letter-spacing: 0;
    color: ${({ theme }) => theme.colors.textSecondary};
    font-variant-numeric: tabular-nums;
  }
`;

/** A section title that sits above a group, in sentence case. */
export function InsetGroupHeader({
  title,
  count,
  trailing,
  id,
}: {
  title: string;
  /** Quiet secondary figure beside the title, such as a count. */
  count?: ReactNode;
  trailing?: ReactNode;
  id?: string;
}) {
  return (
    <HeaderRoot>
      <HeaderTitle id={id}>
        {title}
        {count !== undefined ? <small>{count}</small> : null}
      </HeaderTitle>
      {hasContent(trailing) ? (
        <div style={{ alignItems: 'center', display: 'flex', gap: 8 }}>{trailing}</div>
      ) : null}
    </HeaderRoot>
  );
}

const rowBase = css`
  position: relative;
  display: flex;
  align-items: center;
  gap: ${GAP}px;
  width: 100%;
  min-height: 64px;
  padding: 12px ${PAD_X}px;
  box-sizing: border-box;
  text-align: left;
  color: inherit;
  background: transparent;
  font: inherit;

  /* The hairline starts past the avatar, like iOS. */
  & + &::before {
    content: '';
    position: absolute;
    top: 0;
    right: 0;
    left: var(--inset-left, ${PAD_X + AVATAR + GAP}px);
    height: 1px;
    background: ${({ theme }) => theme.colors.border};
  }
`;

const RowDiv = styled.div`
  ${rowBase}
`;

const RowButton = styled.button`
  ${rowBase}
  border: 0;
  margin: 0;
  cursor: pointer;
  transition: background-color 160ms cubic-bezier(0.32, 0.72, 0, 1);

  &:hover {
    background: ${({ theme }) => chrome[theme.mode].listHover};
  }

  &:active {
    background: ${({ theme }) => chrome[theme.mode].listPressed};
  }

  &:focus-visible {
    outline: none;
    box-shadow: inset 0 0 0 2px ${({ theme }) => theme.colors.primary};
  }
`;

const Main = styled.div`
  flex: 1;
  min-width: 0;
`;

const Title = styled.div`
  font-size: 15px;
  font-weight: 500;
  letter-spacing: -0.15px;
  line-height: 20px;
  color: ${({ theme }) => theme.colors.text};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const Sub = styled.div`
  margin-top: 1px;
  font-size: 13px;
  line-height: 18px;
  color: ${({ theme }) => theme.colors.textSecondary};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const Value = styled.div`
  flex-shrink: 0;
  text-align: right;
  font-variant-numeric: tabular-nums;
`;

const ValueMain = styled.div<{ $tone?: 'buy' | 'sell' | undefined }>`
  font-size: 15px;
  font-weight: 500;
  line-height: 20px;
  letter-spacing: -0.15px;
  white-space: nowrap;
  color: ${({ theme, $tone }) =>
    $tone === 'buy' ? theme.colors.buy : $tone === 'sell' ? theme.colors.sell : theme.colors.text};
`;

const ValueSub = styled.div`
  margin-top: 1px;
  font-size: 13px;
  line-height: 18px;
  color: ${({ theme }) => theme.colors.textSecondary};
  white-space: nowrap;
`;

export interface InsetRowProps {
  leading?: ReactNode | undefined;
  title: ReactNode;
  subtitle?: ReactNode | undefined;
  /** A trend or chip between the text and the value. */
  middle?: ReactNode | undefined;
  value?: ReactNode | undefined;
  valueSub?: ReactNode | undefined;
  /** Colour the value only when it carries meaning: money in or out. */
  valueTone?: 'buy' | 'sell' | undefined;
  /** Controls after the value, such as a send button. */
  accessory?: ReactNode | undefined;
  onClick?: (() => void) | undefined;
  'aria-label'?: string | undefined;
}

export function InsetRow({
  leading,
  title,
  subtitle,
  middle,
  value,
  valueSub,
  valueTone,
  accessory,
  onClick,
  'aria-label': ariaLabel,
}: InsetRowProps) {
  const body = (
    <>
      {leading}
      <Main>
        <Title>{title}</Title>
        {hasContent(subtitle) ? <Sub>{subtitle}</Sub> : null}
      </Main>
      {hasContent(middle) ? <div style={{ flexShrink: 0 }}>{middle}</div> : null}
      {value !== undefined ? (
        <Value>
          <ValueMain $tone={valueTone}>{value}</ValueMain>
          {hasContent(valueSub) ? <ValueSub>{valueSub}</ValueSub> : null}
        </Value>
      ) : null}
      {hasContent(accessory) ? (
        <div style={{ display: 'flex', flexShrink: 0, gap: 4 }}>{accessory}</div>
      ) : null}
    </>
  );
  // A row with its own controls cannot also be a button, so it stays a div.
  if (onClick && !accessory) {
    return (
      <RowButton type="button" onClick={onClick} aria-label={ariaLabel}>
        {body}
      </RowButton>
    );
  }
  return <RowDiv aria-label={ariaLabel}>{body}</RowDiv>;
}

const AvatarRoot = styled.span<{ $accent: boolean; $size: number }>`
  display: grid;
  flex-shrink: 0;
  place-items: center;
  width: ${({ $size }) => $size}px;
  height: ${({ $size }) => $size}px;
  border-radius: 50%;
  font-size: ${({ $size }) => Math.round($size * 0.4)}px;
  font-weight: 600;
  line-height: 1;
  color: ${({ theme, $accent }) => ($accent ? theme.colors.primary : theme.colors.textMuted)};
  background: ${({ theme, $accent }) =>
    $accent ? theme.colors.primarySurface : chrome[theme.mode].fill};

  svg {
    width: ${({ $size }) => Math.round($size * 0.45)}px;
    height: ${({ $size }) => Math.round($size * 0.45)}px;
  }
`;

/**
 * Round 40px token avatar. Shows an icon when given one (transaction
 * direction), otherwise the name's first letter. `accent` is for the base
 * asset only, so the one indigo circle in a list means DCC.
 */
export function TokenAvatar({
  name,
  icon,
  accent = false,
  size = AVATAR,
}: {
  name?: string;
  icon?: ReactNode;
  accent?: boolean;
  size?: number;
}) {
  return (
    <AvatarRoot aria-hidden $accent={accent} $size={size}>
      {icon ?? (name ? name.trim().charAt(0).toUpperCase() : '')}
    </AvatarRoot>
  );
}

/** A skeleton shaped like a row, for loading lists. */
export function InsetRowSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }, (_, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: placeholders have no identity and never reorder
        <RowDiv key={i} aria-hidden>
          {/* The theme rounds every skeleton to 8px; an avatar stays round. */}
          <Skeleton
            variant="circular"
            width={AVATAR}
            height={AVATAR}
            sx={{ borderRadius: '50%', flexShrink: 0 }}
          />
          <Main>
            <Skeleton width="42%" height={18} />
            <Skeleton width="26%" height={16} />
          </Main>
          <Value>
            <Skeleton width={84} height={18} />
            <Skeleton width={48} height={16} sx={{ ml: 'auto' }} />
          </Value>
        </RowDiv>
      ))}
    </>
  );
}

const DetailRoot = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 16px;
  padding: 11px ${PAD_X}px;
  font-size: 14px;
  line-height: 20px;

  & + & {
    box-shadow: inset 0 1px 0 ${({ theme }) => theme.colors.border};
  }

  dt {
    color: ${({ theme }) => theme.colors.textSecondary};
    flex-shrink: 0;
  }

  dd {
    margin: 0;
    min-width: 0;
    text-align: right;
    color: ${({ theme }) => theme.colors.text};
    font-weight: 500;
    font-variant-numeric: tabular-nums;
    overflow-wrap: anywhere;
  }
`;

/** A label/value line inside a summary group, e.g. "Network fee  0.001 DCC". */
export function DetailRow({ label, children }: { label: ReactNode; children: ReactNode }) {
  return (
    <DetailRoot>
      <dt>{label}</dt>
      <dd>{children}</dd>
    </DetailRoot>
  );
}

/** A filled summary block (not a card) for dialogs: what will be signed. */
export const DetailGroup = styled.dl`
  margin: 0;
  border-radius: 12px;
  overflow: hidden;
  background: ${({ theme }) => chrome[theme.mode].fillSubtle};
`;

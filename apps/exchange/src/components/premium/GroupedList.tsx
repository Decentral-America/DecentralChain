/**
 * Grouped inset list — the iOS Settings / Wallet list. One rounded surface per
 * group, rows with a 40px round avatar, a title and a quiet secondary line on
 * the left, the figure right-aligned in tabular numerals, and hairlines inset
 * past the avatar so the column of marks reads unbroken.
 *
 * Row anatomy follows 21st.dev "Market Watchlist" by @ssychui (demo 22252):
 * symbol over name, figure over change, the change tinted by direction. The
 * selected-row side bar and the uppercase column header are dropped; a group
 * is headed by a sentence-case caption instead.
 *
 * The cell colour reads `--grouped-cell`, so a container (a sheet on the
 * grouped background, for instance) can lift its cells without a prop.
 */
import { Skeleton } from '@mui/material';
import { ChevronRight } from 'lucide-react';
import { type ReactNode } from 'react';
import { Link } from 'react-router';
import styled, { css } from 'styled-components';
import { hasContent } from './hasContent';

const Group = styled.section`
  & + & {
    margin-top: 28px;
  }
`;

const Header = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  padding: 0 0 8px 4px;
  min-height: 28px;

  /* A small iOS-style caption aligns with the text inside the cells. */
  &[data-quiet='true'] {
    padding: 0 4px 6px 16px;
  }
`;

const HeaderTitle = styled.h2<{ $quiet: boolean }>`
  margin: 0;
  font-size: ${({ $quiet }) => ($quiet ? '13px' : '20px')};
  line-height: 1.25;
  font-weight: ${({ $quiet }) => ($quiet ? 400 : 600)};
  letter-spacing: ${({ $quiet }) => ($quiet ? '-0.08px' : '-0.3px')};
  color: ${({ $quiet }) => ($quiet ? 'var(--text-secondary)' : 'var(--text-primary)')};
`;

const Footer = styled.p`
  margin: 8px 16px 0;
  font-size: 13px;
  line-height: 1.4;
  color: var(--text-secondary);
`;

const Surface = styled.div`
  background: var(--grouped-cell, var(--surface-canvas));
  border-radius: 16px;
  overflow: hidden;
  box-shadow: var(--shadow-md);

  [data-theme='dark'] & {
    box-shadow: 0 0 0 1px var(--border-default);
  }
`;

export interface GroupedListProps {
  /** Group heading, sentence case. */
  title?: ReactNode;
  /** Right-aligned header action, such as "See all". */
  action?: ReactNode;
  /** A line of explanation beneath the group. */
  footer?: ReactNode;
  /** A small secondary heading, as iOS Settings uses, instead of a section title. */
  quiet?: boolean;
  children: ReactNode;
  className?: string;
}

export function GroupedList({
  title,
  action,
  footer,
  quiet = false,
  children,
  className,
}: GroupedListProps) {
  return (
    <Group className={className}>
      {hasContent(title) || hasContent(action) ? (
        <Header data-quiet={quiet}>
          {hasContent(title) ? <HeaderTitle $quiet={quiet}>{title}</HeaderTitle> : <span />}
          {action}
        </Header>
      ) : null}
      <Surface>{children}</Surface>
      {hasContent(footer) ? <Footer>{footer}</Footer> : null}
    </Group>
  );
}

/* --------------------------------------------------------------------- row */

const rowBase = css<{ $inset: number; $interactive: boolean }>`
  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  min-height: 60px;
  padding: 10px 16px;
  margin: 0;
  border: 0;
  background: transparent;
  color: var(--text-primary);
  font: inherit;
  text-align: left;
  text-decoration: none;
  -webkit-tap-highlight-color: transparent;
  outline: none;
  transition: background-color 160ms var(--ease);

  /* Hairline inset past the leading mark; the last row has none. */
  &::after {
    content: '';
    position: absolute;
    left: ${({ $inset }) => $inset}px;
    right: 0;
    bottom: 0;
    height: 1px;
    background: var(--grouped-separator, var(--border-default));
    transform: scaleY(0.5);
    transform-origin: bottom;
  }
  &:last-child::after {
    display: none;
  }

  ${({ $interactive }) =>
    $interactive &&
    css`
      cursor: pointer;
      @media (hover: hover) {
        &:hover {
          background: var(--surface-fill);
        }
      }
      &:active {
        background: var(--surface-fill);
      }
      &:focus-visible {
        box-shadow: inset 0 0 0 2px var(--color-indigo-ink);
      }
      &:disabled {
        cursor: default;
        opacity: 0.5;
      }
    `}
`;

const RowButton = styled.button<{ $inset: number; $interactive: boolean }>`
  ${rowBase}
`;
const RowLink = styled(Link)<{ $inset: number; $interactive: boolean }>`
  ${rowBase}
`;
const RowStatic = styled.div<{ $inset: number; $interactive: boolean }>`
  ${rowBase}
`;

const Body = styled.span`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const Title = styled.span<{ $tone?: 'danger' | 'accent' | undefined }>`
  font-size: 17px;
  line-height: 22px;
  font-weight: 500;
  letter-spacing: -0.3px;
  /*
   * Text-weight inks for the tinted titles: on a lifted dark cell (a sheet's
   * #2c2c2e) the system red is 4.09:1 and the base indigo 3.76:1, so titles
   * take the danger ink and the accent's hover step, which clear 4.5:1 on every
   * cell in both modes.
   */
  color: ${({ $tone }) =>
    $tone === 'danger'
      ? 'var(--color-danger-ink)'
      : $tone === 'accent'
        ? 'var(--color-indigo-hover)'
        : 'var(--text-primary)'};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const Secondary = styled.span`
  font-size: 13px;
  line-height: 18px;
  letter-spacing: -0.08px;
  color: var(--text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
`;

const Trailing = styled.span`
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
  max-width: 50%;
  text-align: right;
`;

const Value = styled.span`
  font-size: 17px;
  line-height: 22px;
  font-weight: 500;
  letter-spacing: -0.3px;
  font-variant-numeric: tabular-nums;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
`;

const Detail = styled.span<{ $tone: 'up' | 'down' | 'neutral' }>`
  font-size: 13px;
  line-height: 18px;
  font-variant-numeric: tabular-nums;
  color: ${({ $tone }) =>
    $tone === 'up'
      ? 'var(--color-buy)'
      : $tone === 'down'
        ? 'var(--color-sell)'
        : 'var(--text-secondary)'};
  white-space: nowrap;
`;

const Chevron = styled(ChevronRight)`
  flex-shrink: 0;
  color: var(--text-subtle);
  margin-right: -4px;
`;

export interface ListRowProps {
  /** A 40px Avatar, or any leading mark. */
  leading?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  /** The figure, right-aligned in tabular numerals. */
  value?: ReactNode;
  /** A line beneath the figure, such as a change. */
  detail?: ReactNode;
  detailTone?: 'up' | 'down' | 'neutral';
  /** Tints the title — `danger` for destructive rows. */
  tone?: 'danger' | 'accent';
  /** Shows a disclosure chevron. Defaults to on when the row navigates. */
  chevron?: boolean;
  /** Anything else on the trailing edge, e.g. a switch. */
  accessory?: ReactNode;
  onClick?: () => void;
  to?: string;
  disabled?: boolean;
  'aria-label'?: string;
  /** Width of the leading mark, for insetting the separator. Defaults to 40. */
  leadingWidth?: number;
}

export function ListRow({
  leading,
  title,
  subtitle,
  value,
  detail,
  detailTone = 'neutral',
  tone,
  chevron,
  accessory,
  onClick,
  to,
  disabled,
  leadingWidth = 40,
  'aria-label': ariaLabel,
}: ListRowProps) {
  const inset = hasContent(leading) ? 16 + leadingWidth + 12 : 16;
  const showChevron = chevron ?? Boolean(to || onClick);

  const content = (
    <>
      {leading}
      <Body>
        <Title $tone={tone}>{title}</Title>
        {hasContent(subtitle) ? <Secondary>{subtitle}</Secondary> : null}
      </Body>
      {value !== undefined || hasContent(detail) ? (
        <Trailing>
          {value !== undefined ? <Value>{value}</Value> : null}
          {hasContent(detail) ? <Detail $tone={detailTone}>{detail}</Detail> : null}
        </Trailing>
      ) : null}
      {accessory}
      {showChevron ? <Chevron size={18} strokeWidth={2} aria-hidden="true" /> : null}
    </>
  );

  if (to) {
    return (
      <RowLink to={to} aria-label={ariaLabel} $inset={inset} $interactive>
        {content}
      </RowLink>
    );
  }
  if (onClick) {
    return (
      <RowButton
        type="button"
        onClick={onClick}
        disabled={disabled}
        aria-label={ariaLabel}
        $inset={inset}
        $interactive
      >
        {content}
      </RowButton>
    );
  }
  return (
    <RowStatic $inset={inset} $interactive={false}>
      {content}
    </RowStatic>
  );
}

/** A placeholder row shaped like a real one, for loading. */
export function ListRowSkeleton({ avatar = true }: { avatar?: boolean }) {
  return (
    <RowStatic $inset={avatar ? 68 : 16} $interactive={false} aria-hidden="true">
      {avatar ? (
        <Skeleton
          variant="circular"
          width={40}
          height={40}
          sx={{ borderRadius: '50%', flexShrink: 0 }}
        />
      ) : null}
      <Body>
        <Skeleton variant="text" width="46%" height={22} />
        <Skeleton variant="text" width="28%" height={18} />
      </Body>
      <Skeleton variant="text" width={64} height={22} />
    </RowStatic>
  );
}

/* ------------------------------------------------------------------ avatar */

const AvatarRoot = styled.span<{ $size: number; $tone: 'accent' | 'neutral' | 'danger' }>`
  flex-shrink: 0;
  display: grid;
  place-items: center;
  width: ${({ $size }) => $size}px;
  height: ${({ $size }) => $size}px;
  border-radius: 50%;
  overflow: hidden;
  font-size: ${({ $size }) => Math.round($size * 0.36)}px;
  font-weight: 600;
  letter-spacing: -0.01em;
  background: ${({ $tone }) =>
    $tone === 'accent'
      ? 'var(--surface-lavender)'
      : $tone === 'danger'
        ? 'var(--color-danger-surface)'
        : 'var(--surface-fill)'};
  color: ${({ $tone }) =>
    $tone === 'accent'
      ? 'var(--color-indigo-ink)'
      : $tone === 'danger'
        ? 'var(--color-danger)'
        : 'var(--text-primary)'};
`;

export interface AvatarProps {
  children: ReactNode;
  size?: number;
  tone?: 'accent' | 'neutral' | 'danger';
}

/** Round token or identity mark. Initials, a logo image, or a glyph. */
export function Avatar({ children, size = 40, tone = 'neutral' }: AvatarProps) {
  return (
    <AvatarRoot $size={size} $tone={tone} aria-hidden="true">
      {children}
    </AvatarRoot>
  );
}

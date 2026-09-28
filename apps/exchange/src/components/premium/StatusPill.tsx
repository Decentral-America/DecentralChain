/**
 * Status pill with a live dot, for network state, order status and
 * transaction outcome. The ping on the dot only runs for `live` pills.
 *
 * Ported from 21st.dev "Status" by @diceui.
 */
import { type ReactNode } from 'react';
import styled, { css, type DefaultTheme, keyframes } from 'styled-components';
import { chrome } from '@/styles/tokens';

export type StatusTone = 'neutral' | 'success' | 'danger' | 'warning' | 'accent';

const ping = keyframes`
  75%, 100% { transform: scale(2.2); opacity: 0; }
`;

/** The tone's own hue: the dot, and the tint behind the label. */
const toneColor = (theme: DefaultTheme, tone: StatusTone) =>
  ({
    accent: theme.colors.primary,
    danger: theme.colors.error,
    neutral: theme.colors.textSecondary,
    success: theme.colors.success,
    warning: theme.colors.warning,
  })[tone];

/**
 * The label's ink. A hue on its own 10% tint sits just under 4.5:1 (success
 * measured 4.3:1 on the top bar), so the label takes each tone's deep ink from
 * the alert set instead, which clears AA on that tint in both modes.
 */
const toneInk = (theme: DefaultTheme, tone: StatusTone) => {
  const alert = chrome[theme.mode].alert;
  return {
    accent: alert.info.fg,
    danger: alert.error.fg,
    neutral: theme.colors.text,
    success: alert.success.fg,
    warning: alert.warning.fg,
  }[tone];
};

const Root = styled.span<{ $tone: StatusTone }>`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  width: fit-content;
  flex-shrink: 0;
  padding: 3px 10px;
  border-radius: 9999px;
  font-size: 12px;
  font-weight: 500;
  line-height: 18px;
  white-space: nowrap;
  color: ${({ theme, $tone }) => toneInk(theme, $tone)};
  background: ${({ theme, $tone }) =>
    `color-mix(in srgb, ${toneColor(theme, $tone)} 10%, transparent)`};
`;

const Dot = styled.span<{ $live: boolean; $tone: StatusTone }>`
  position: relative;
  display: inline-flex;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: ${({ theme, $tone }) => toneColor(theme, $tone)};

  ${({ $live }) =>
    $live &&
    css`
      &::before {
        content: '';
        position: absolute;
        inset: 0;
        border-radius: 50%;
        background: inherit;
        animation: ${ping} 1.6s cubic-bezier(0, 0, 0.2, 1) infinite;
      }
    `}
`;

export interface StatusPillProps {
  tone?: StatusTone;
  /** Pulse the dot, for connections and anything streaming. */
  live?: boolean;
  dot?: boolean;
  children: ReactNode;
  className?: string;
}

export function StatusPill({
  tone = 'neutral',
  live = false,
  dot = true,
  children,
  className,
}: StatusPillProps) {
  return (
    <Root $tone={tone} className={className}>
      {dot ? <Dot $live={live} $tone={tone} aria-hidden /> : null}
      {children}
    </Root>
  );
}

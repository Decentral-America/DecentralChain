/**
 * Pressable quick-action tile: a tinted round glyph over a short label, on a
 * grey fill that deepens on hover and sinks to 0.97 on press. Tiles sit in a
 * grid beside the balance hero, the way Apple Wallet puts Send and Receive
 * next to the card rather than in a toolbar.
 *
 * Surface after 21st.dev "Card" (interactive variant) by @wensity (demo
 * 31495): colour-mixed fill instead of a border, and a spring press.
 */
import { motion, useReducedMotion } from 'motion/react';
import { type ReactNode } from 'react';
import styled from 'styled-components';
import { chrome, spring } from '@/styles/tokens';

const Tile = styled(motion.button)<{ $primary: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
  width: 100%;
  height: 100%;
  min-height: 72px;
  padding: 12px;
  border: 0;
  margin: 0;
  border-radius: 14px;
  font: inherit;
  text-align: left;
  cursor: pointer;
  color: ${({ theme, $primary }) => ($primary ? theme.colors.textOnPrimary : theme.colors.text)};
  background: ${({ theme, $primary }) =>
    $primary ? theme.colors.primary : chrome[theme.mode].fill};
  transition: background-color 160ms cubic-bezier(0.32, 0.72, 0, 1);

  &:hover {
    background: ${({ theme, $primary }) =>
      $primary ? theme.colors.primaryHover : chrome[theme.mode].fillHover};
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

const Glyph = styled.span<{ $primary: boolean }>`
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  color: ${({ theme }) => theme.colors.primary};
  background: ${({ theme, $primary }) => ($primary ? theme.colors.textOnPrimary : theme.colors.surface)};
  box-shadow: ${({ theme, $primary }) => ($primary || theme.mode === 'dark' ? 'none' : 'var(--shadow-sm)')};

  svg {
    width: 16px;
    height: 16px;
  }
`;

const Label = styled.span`
  font-size: 14px;
  font-weight: 500;
  letter-spacing: -0.15px;
  line-height: 18px;
`;

const Hint = styled.span<{ $primary: boolean }>`
  display: block;
  margin-top: 1px;
  font-size: 12px;
  line-height: 16px;
  color: ${({ theme, $primary }) => ($primary ? theme.colors.onPrimary : theme.colors.textSecondary)};
`;

export interface ActionTileProps {
  icon: ReactNode;
  label: string;
  /** One quiet line of context, e.g. "2 aliases". */
  hint?: string | undefined;
  onClick: () => void;
  /** The one filled tile, for the action a holder reaches for first. */
  primary?: boolean | undefined;
  disabled?: boolean | undefined;
}

export function ActionTile({
  icon,
  label,
  hint,
  onClick,
  primary = false,
  disabled,
}: ActionTileProps) {
  const reduced = useReducedMotion();
  return (
    <Tile
      type="button"
      $primary={primary}
      onClick={onClick}
      disabled={disabled}
      whileTap={reduced ? {} : { scale: 0.97 }}
      transition={spring}
    >
      <Glyph aria-hidden $primary={primary}>
        {icon}
      </Glyph>
      <span>
        <Label>{label}</Label>
        {hint ? <Hint $primary={primary}>{hint}</Hint> : null}
      </span>
    </Tile>
  );
}

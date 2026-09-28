/**
 * Empty state with a fanned stack of icon tiles that spread apart on hover.
 * It teaches the next action rather than announcing "nothing here".
 *
 * Ported from 21st.dev "Empty State" by @serafimcloud; the dashed frame is
 * dropped so it sits inside a card instead of competing with it.
 */
import { type LucideIcon } from 'lucide-react';
import { type ReactNode } from 'react';
import styled, { css } from 'styled-components';
import { chrome } from '@/styles/tokens';
import { hasContent } from './hasContent';

const EASE = 'cubic-bezier(0.32, 0.72, 0, 1)';

const Root = styled.div<{ $compact: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: ${({ $compact }) => ($compact ? '24px 16px' : '40px 24px')};
  width: 100%;
`;

const Fan = styled.div`
  display: flex;
  justify-content: center;
  isolation: isolate;
  margin-bottom: 20px;
`;

const Tile = styled.div<{ $pos: 'left' | 'center' | 'right' | 'solo' }>`
  display: grid;
  place-items: center;
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.textSecondary};
  box-shadow: ${({ theme }) =>
    theme.mode === 'dark' ? `0 0 0 1px ${theme.colors.borderStrong}` : chrome.light.tileShadow};
  position: relative;
  transition: transform 500ms ${EASE};

  ${({ $pos }) =>
    $pos === 'left'
      ? css`
          left: 10px;
          top: 6px;
          transform: rotate(-6deg);
        `
      : $pos === 'right'
        ? css`
            right: 10px;
            top: 6px;
            transform: rotate(6deg);
          `
        : css`
            z-index: 1;
          `}

  ${Root}:hover & {
    transition-duration: 220ms;
    ${({ $pos }) =>
      $pos === 'left'
        ? 'transform: translate(-18px, -2px) rotate(-12deg);'
        : $pos === 'right'
          ? 'transform: translate(18px, -2px) rotate(12deg);'
          : 'transform: translateY(-2px);'}
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

const Title = styled.h3`
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  letter-spacing: -0.2px;
  color: ${({ theme }) => theme.colors.text};
`;

const Description = styled.p`
  margin: 4px 0 0;
  max-width: 44ch;
  font-size: 13px;
  line-height: 1.45;
  color: ${({ theme }) => theme.colors.textSecondary};
  white-space: pre-line;
`;

const Actions = styled.div`
  margin-top: 16px;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: center;
`;

export interface EmptyStateProps {
  title: string;
  description?: string;
  /** One icon, or three for the fanned stack. */
  icons: LucideIcon[];
  /** Buttons that start the task this empty state is teaching. */
  action?: ReactNode;
  compact?: boolean;
  className?: string;
}

export function EmptyState({
  title,
  description,
  icons,
  action,
  compact = false,
  className,
}: EmptyStateProps) {
  const [A, B, C] = icons;
  const fanned = Boolean(A && B && C);
  return (
    <Root $compact={compact} className={className}>
      <Fan aria-hidden>
        {fanned && A && B && C ? (
          <>
            <Tile $pos="left">
              <A size={22} strokeWidth={1.75} />
            </Tile>
            <Tile $pos="center">
              <B size={22} strokeWidth={1.75} />
            </Tile>
            <Tile $pos="right">
              <C size={22} strokeWidth={1.75} />
            </Tile>
          </>
        ) : A ? (
          <Tile $pos="solo">
            <A size={22} strokeWidth={1.75} />
          </Tile>
        ) : null}
      </Fan>
      <Title>{title}</Title>
      {description ? <Description>{description}</Description> : null}
      {hasContent(action) ? <Actions>{action}</Actions> : null}
    </Root>
  );
}

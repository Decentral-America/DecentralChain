/**
 * The dialog material and motion every modal shares: a blurred, dimmed
 * backdrop, a 20px panel with one deep soft shadow (a hairline in dark mode),
 * and the two springs, "snappy" for the panel entering and "soft" for content.
 * Enter scales from 0.96 and rises 12px; exit is a short tween, because a
 * dismissed thing should leave faster than it arrived.
 *
 * Ported from 21st.dev "Modal" by @ddoemonn (demo 23539): the panel variants,
 * the backdrop fade and the close glyph are that component's; the surface is
 * re-bound to our tokens.
 */
import { motion, useReducedMotion } from 'motion/react';
import { useMemo } from 'react';
import styled from 'styled-components';
import { chrome } from '@/styles/tokens';

const EASE = [0.23, 1, 0.32, 1] as const;
const LEAVE = [0.4, 0, 1, 1] as const;

/** Panel entrance. */
export const SNAPPY = { damping: 36, mass: 0.9, stiffness: 420, type: 'spring' } as const;
/** Content crossfades inside a panel. */
export const SOFT = { damping: 34, mass: 0.8, stiffness: 260, type: 'spring' } as const;

export function useModalVariants() {
  const reduced = useReducedMotion();
  return useMemo(() => {
    if (reduced) {
      const plain = {
        closed: { opacity: 0 },
        gone: { opacity: 0, transition: { duration: 0 } },
        open: { opacity: 1, transition: { duration: 0 } },
      };
      return { backdrop: plain, panel: plain };
    }
    return {
      backdrop: {
        closed: { opacity: 0 },
        gone: { opacity: 0, transition: { duration: 0.15, ease: LEAVE } },
        open: { opacity: 1, transition: { duration: 0.2, ease: EASE } },
      },
      panel: {
        closed: { opacity: 0, scale: 0.96, y: 12 },
        gone: { opacity: 0, scale: 0.98, transition: { duration: 0.15, ease: LEAVE }, y: 6 },
        open: {
          opacity: 1,
          scale: 1,
          transition: { ...SNAPPY, opacity: { duration: 0.16, ease: EASE } },
          y: 0,
        },
      },
    };
  }, [reduced]);
}

/** Fixed layer that centres the panel and hosts the backdrop behind it. */
export const ModalLayer = styled(motion.div)<{ $z?: number }>`
  position: fixed;
  inset: 0;
  z-index: ${({ $z }) => $z ?? 1300};
  display: grid;
  place-items: center;
  padding: clamp(16px, 4vw, 24px);
  overflow-y: auto;
`;

export const ModalBackdrop = styled(motion.div)`
  position: fixed;
  inset: 0;
  touch-action: none;
  background: ${({ theme }) => chrome[theme.mode].backdrop};
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
`;

export const ModalPanel = styled(motion.div)`
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  max-height: calc(100dvh - 48px);
  overflow: hidden;
  border-radius: 20px;
  outline: none;
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.text};
  box-shadow: ${({ theme }) =>
    theme.mode === 'dark'
      ? `0 0 0 1px ${theme.colors.borderStrong}, ${chrome.dark.sheetShadow}`
      : chrome.light.sheetShadow};
`;

export const ModalHead = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 20px 20px 12px 24px;
`;

export const ModalTitleText = styled.h2`
  flex: 1;
  min-width: 0;
  margin: 0;
  padding-top: 4px;
  font-size: 17px;
  font-weight: 600;
  line-height: 1.3;
  letter-spacing: -0.3px;
  color: ${({ theme }) => theme.colors.text};
`;

export const ModalCloseButton = styled.button`
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  margin-left: auto;
  padding: 0;
  border: 0;
  border-radius: 50%;
  cursor: pointer;
  color: ${({ theme }) => theme.colors.textSecondary};
  background: ${({ theme }) => chrome[theme.mode].fill};
  transition:
    background-color 160ms cubic-bezier(0.32, 0.72, 0, 1),
    transform 160ms cubic-bezier(0.32, 0.72, 0, 1);

  &:hover {
    color: ${({ theme }) => theme.colors.text};
    background: ${({ theme }) => chrome[theme.mode].fillHover};
  }

  &:active {
    transform: scale(0.94);
  }

  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.primary};
  }
`;

export const ModalBodyArea = styled.div`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: 4px 24px 24px;
  font-size: 15px;
  line-height: 1.47;
  letter-spacing: -0.15px;
`;

export const ModalFooterBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  padding: 16px 24px 20px;
  border-top: 1px solid ${({ theme }) => theme.colors.border};
`;

export function CloseGlyph() {
  return (
    <svg width="12" height="12" viewBox="0 0 256 256" fill="none" aria-hidden="true">
      <line
        x1="200"
        y1="56"
        x2="56"
        y2="200"
        stroke="currentColor"
        strokeWidth="20"
        strokeLinecap="round"
      />
      <line
        x1="200"
        y1="200"
        x2="56"
        y2="56"
        stroke="currentColor"
        strokeWidth="20"
        strokeLinecap="round"
      />
    </svg>
  );
}

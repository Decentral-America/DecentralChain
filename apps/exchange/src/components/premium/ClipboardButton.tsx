/**
 * Copy-to-clipboard button whose icon swaps to a drawn check, then back.
 *
 * Ported from 21st.dev "Copy Button" by @motiondotdev (demo 24659), the
 * official Motion example. The blur crossfade becomes a scale crossfade (blur
 * is reserved for chrome), and it gains a real surface: a grey-fill pill that
 * matches the system's secondary buttons, or a bare icon for dense rows.
 */
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import styled, { css } from 'styled-components';
import { logger } from '@/lib/logger';
import { chrome } from '@/styles/tokens';

const swap = { damping: 18, stiffness: 260, type: 'spring' } as const;
const check = { damping: 25, stiffness: 300, type: 'spring' } as const;

const Root = styled(motion.button)<{ $variant: 'pill' | 'icon' }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  flex-shrink: 0;
  border: 0;
  margin: 0;
  font: inherit;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  color: ${({ theme }) => theme.colors.text};
  background: ${({ theme }) => chrome[theme.mode].fill};
  transition: background-color 160ms cubic-bezier(0.32, 0.72, 0, 1);

  ${({ $variant }) =>
    $variant === 'pill'
      ? css`
          height: 32px;
          padding: 0 12px;
          border-radius: 10px;
        `
      : css`
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: transparent;
          color: ${({ theme }) => theme.colors.textSecondary};
        `}

  &:hover {
    background: ${({ theme }) => chrome[theme.mode].fillHover};
  }

  &[data-copied] {
    color: ${({ theme }) => theme.colors.success};
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

const Face = styled(motion.span)`
  display: inline-flex;
  align-items: center;
  gap: 6px;
`;

function CopyGlyph() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
    </svg>
  );
}

function CheckGlyph() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <motion.path
        d="M4 12l5 5L20 6"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ ...check, delay: 0.1 }}
      />
    </svg>
  );
}

export interface ClipboardButtonProps {
  value: string;
  /** Visible text for the pill variant; also the accessible name. */
  label?: string | undefined;
  copiedLabel?: string | undefined;
  variant?: 'pill' | 'icon' | undefined;
  disabled?: boolean | undefined;
  onCopied?: (() => void) | undefined;
}

export function ClipboardButton({
  value,
  label = 'Copy',
  copiedLabel = 'Copied',
  variant = 'pill',
  disabled = false,
  onCopied,
}: ClipboardButtonProps) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reduced = useReducedMotion();

  useEffect(() => () => void (timer.current && clearTimeout(timer.current)), []);

  const onClick = async () => {
    if (copied || !value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      onCopied?.();
      timer.current = setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      logger.warn('Failed to copy to clipboard:', err);
    }
  };

  const fade = reduced
    ? { animate: { opacity: 1 }, exit: { opacity: 0 }, initial: { opacity: 0 } }
    : {
        animate: { opacity: 1, scale: 1 },
        exit: { opacity: 0, scale: 0.8 },
        initial: { opacity: 0, scale: 0.8 },
      };

  return (
    <Root
      type="button"
      $variant={variant}
      data-copied={copied || undefined}
      disabled={disabled || !value}
      aria-label={copied ? copiedLabel : label}
      whileTap={reduced ? {} : { scale: 0.95 }}
      transition={{ damping: 20, stiffness: 400, type: 'spring' }}
      onClick={onClick}
    >
      <AnimatePresence mode="popLayout" initial={false}>
        <Face key={copied ? 'copied' : 'copy'} {...fade} transition={swap}>
          {copied ? <CheckGlyph /> : <CopyGlyph />}
          {variant === 'pill' ? <span>{copied ? copiedLabel : label}</span> : null}
        </Face>
      </AnimatePresence>
      <span
        role="status"
        aria-live="polite"
        style={{
          clip: 'rect(0 0 0 0)',
          height: 1,
          overflow: 'hidden',
          position: 'absolute',
          width: 1,
        }}
      >
        {copied ? copiedLabel : ''}
      </span>
    </Root>
  );
}

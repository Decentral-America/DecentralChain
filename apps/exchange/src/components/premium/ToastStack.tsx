/**
 * Toast stack, Sonner-style. The newest toast sits in front; older ones tuck
 * behind it, each a little smaller and lower, so a burst of messages reads as
 * one pile instead of a column marching down the screen. Hover or focus the
 * pile and it fans out into a list; move away and it folds back.
 *
 * Presentation only: the host (src/contexts/ToastContext.tsx) owns timing,
 * announcements and removal, and renders this with its list.
 *
 * Ported from 21st.dev "Toast" by @cnippet-dev (demo 24297): the collapsed
 * scale-and-offset stack, the hover expansion, the small round type glyph and
 * the 1px top highlight in dark mode.
 */
import { CircleCheck, CircleX, Info, TriangleAlert, X } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { type ReactNode, useCallback, useLayoutEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { chrome, spring } from '@/styles/tokens';

export type ToastTone = 'success' | 'error' | 'info' | 'warning';

export interface ToastView {
  id: string;
  /** Rich content is allowed; the host announces a plain-text version. */
  message: ReactNode;
  type: ToastTone;
}

export interface ToastStackProps {
  toasts: ToastView[];
  onDismiss: (id: string) => void;
  /** Toasts already leaving; they are dropped from the pile at once. */
  removingIds?: Set<string>;
}

const GAP = 8;
const PEEK = 10;
const VISIBLE = 3;

const Region = styled.section`
  position: fixed;
  top: 16px;
  right: 16px;
  z-index: 10000;
  width: min(380px, calc(100vw - 32px));
  pointer-events: none;

  @media (max-width: 768px) {
    left: 16px;
    right: 16px;
    width: auto;
  }
`;

const Item = styled(motion.div)`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px 12px 12px 14px;
  border-radius: 14px;
  pointer-events: auto;
  transform-origin: top center;
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.text};
  box-shadow: ${({ theme }) =>
    theme.mode === 'dark'
      ? `0 0 0 1px ${theme.colors.borderStrong}, ${chrome.dark.toastShadow}`
      : chrome.light.toastShadow};
`;

const Glyph = styled.span<{ $tone: ToastTone }>`
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 22px;
  height: 22px;
  margin-top: 1px;
  color: ${({ theme, $tone }) =>
    $tone === 'success'
      ? theme.colors.success
      : $tone === 'error'
        ? theme.colors.error
        : $tone === 'warning'
          ? theme.colors.warning
          : theme.colors.primary};
`;

const Message = styled.p`
  flex: 1;
  min-width: 0;
  margin: 2px 0 0;
  font-size: 14px;
  line-height: 1.4;
  letter-spacing: -0.1px;
  overflow-wrap: anywhere;
`;

const Close = styled.button`
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  padding: 0;
  border: 0;
  border-radius: 50%;
  cursor: pointer;
  color: ${({ theme }) => theme.colors.textSecondary};
  background: transparent;
  transition: background-color 160ms cubic-bezier(0.32, 0.72, 0, 1);

  &:hover {
    color: ${({ theme }) => theme.colors.text};
    background: ${({ theme }) => chrome[theme.mode].fill};
  }

  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 2px ${({ theme }) => theme.colors.primary};
  }
`;

const ICONS = { error: CircleX, info: Info, success: CircleCheck, warning: TriangleAlert } as const;

/** Motion and stacking for one toast, given where it sits in the pile. */
function itemMotion(o: {
  reduced: boolean;
  expanded: boolean;
  index: number;
  y: number;
  front: number;
  count: number;
}) {
  const hidden = !o.expanded && o.index >= VISIBLE;
  // Behind the front toast only the edge shows; its text would bleed through.
  const tucked = !o.expanded && o.index > 0;
  return {
    animate: {
      opacity: hidden ? 0 : 1,
      scale: o.expanded || o.reduced ? 1 : 1 - o.index * 0.05,
      y: o.y,
    },
    exit: o.reduced ? { opacity: 0 } : { opacity: 0, scale: 0.96, transition: { duration: 0.15 } },
    initial: o.reduced ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: -16 },
    style: {
      height: tucked ? o.front : undefined,
      overflow: tucked ? ('hidden' as const) : undefined,
      pointerEvents: hidden ? ('none' as const) : undefined,
      zIndex: o.count - o.index,
    },
    transition: o.reduced ? { duration: 0 } : spring,
    tucked,
  };
}

export function ToastStack({ toasts, onDismiss, removingIds }: ToastStackProps) {
  const reduced = useReducedMotion();
  const [expanded, setExpanded] = useState(false);
  const [heights, setHeights] = useState<Record<string, number>>({});
  const nodes = useRef(new Map<string, HTMLDivElement>());

  // Newest first; toasts on their way out leave the pile immediately.
  const live = toasts.filter((t) => !removingIds?.has(t.id)).reverse();

  const measure = useCallback(() => {
    const next: Record<string, number> = {};
    nodes.current.forEach((node, id) => {
      next[id] = node.scrollHeight;
    });
    setHeights((prev) => {
      const same =
        Object.keys(next).length === Object.keys(prev).length &&
        Object.entries(next).every(([k, v]) => prev[k] === v);
      return same ? prev : next;
    });
  }, []);

  // biome-ignore lint/correctness/useExhaustiveDependencies: re-measure whenever the list changes
  useLayoutEffect(() => {
    measure();
  }, [toasts, expanded, measure]);

  if (live.length === 0 && expanded) setExpanded(false);

  const front = heights[live[0]?.id ?? ''] ?? 56;
  let offset = 0;
  const layout = live.map((toast, index) => {
    const y = expanded ? offset : index * PEEK;
    offset += (heights[toast.id] ?? 56) + GAP;
    return { index, toast, y };
  });
  const regionHeight = expanded
    ? Math.max(0, offset - GAP)
    : front + Math.min(live.length - 1, VISIBLE - 1) * PEEK;

  return (
    <Region
      aria-label="Notifications"
      style={{ height: regionHeight }}
      onPointerEnter={() => setExpanded(true)}
      onPointerLeave={() => setExpanded(false)}
      onFocus={() => setExpanded(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setExpanded(false);
      }}
    >
      <AnimatePresence initial={false}>
        {layout.map(({ toast, index, y }) => {
          const Icon = ICONS[toast.type] ?? Info;
          const m = itemMotion({
            count: live.length,
            expanded,
            front,
            index,
            reduced: Boolean(reduced),
            y,
          });
          return (
            <Item
              key={toast.id}
              ref={(node: HTMLDivElement | null) => {
                if (node) nodes.current.set(toast.id, node);
                else nodes.current.delete(toast.id);
              }}
              initial={m.initial}
              animate={m.animate}
              exit={m.exit}
              transition={m.transition}
              style={m.style}
            >
              <Glyph $tone={toast.type} aria-hidden>
                <Icon size={18} strokeWidth={2} />
              </Glyph>
              <Message style={{ visibility: m.tucked ? 'hidden' : 'visible' }}>
                {toast.message}
              </Message>
              <Close
                type="button"
                aria-label="Dismiss notification"
                onClick={() => onDismiss(toast.id)}
              >
                <X size={14} strokeWidth={2} />
              </Close>
            </Item>
          );
        })}
      </AnimatePresence>
    </Region>
  );
}

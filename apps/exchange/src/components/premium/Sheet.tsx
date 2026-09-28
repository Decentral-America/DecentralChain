/**
 * Bottom sheet — rises from the bottom edge on the system spring, carries a
 * grab handle, and follows the finger: drag it down past a third of its
 * height, or flick it, and it dismisses; let go short of that and it springs
 * back. The backdrop dims in step and dismisses on tap.
 *
 * Ported from 21st.dev "Drawer" by @wensity (demo 31360). Base UI's drawer is
 * replaced by MUI's Modal, which the app already ships, for the focus trap,
 * scroll lock and Escape handling; the swipe, velocity dismiss and spring
 * settle are rebuilt on motion's drag.
 */
import { Modal } from '@mui/material';
import { X } from 'lucide-react';
import {
  animate,
  motion,
  type PanInfo,
  useDragControls,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from 'motion/react';
import { type ReactNode, useEffect, useId, useRef, useState } from 'react';
import styled from 'styled-components';
import { chrome, spring } from '@/styles/tokens';
import { hasContent } from './hasContent';

const Root = styled.div`
  position: fixed;
  inset: 0;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  outline: none;
`;

const Backdrop = styled(motion.div)`
  position: absolute;
  inset: 0;
  background: ${({ theme }) => chrome[theme.mode].backdrop};
`;

const Panel = styled(motion.div)<{ $grouped: boolean; $maxHeight: number }>`
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 640px;
  margin: 0 auto;
  max-height: ${({ $maxHeight }) => $maxHeight * 100}dvh;
  border-radius: 20px 20px 0 0;
  background: ${({ $grouped }) => ($grouped ? 'var(--surface-band)' : 'var(--surface-canvas)')};
  box-shadow: var(--shadow-lg);
  padding-bottom: calc(env(safe-area-inset-bottom) + 8px);
  outline: none;

  /* On the grouped background, list cells lift to the elevated surface. */
  --grouped-cell: var(--surface-canvas);
  [data-theme='dark'] & {
    --grouped-cell: var(--surface-frosted);
    --grouped-separator: var(--border-strong);
    box-shadow: 0 0 0 1px var(--border-default);
  }
`;

/* The drag region: the handle and the heading beneath it. */
const Grip = styled.div`
  position: relative;
  flex-shrink: 0;
  /* Always tall enough for the close control, with or without a title. */
  min-height: 56px;
  touch-action: none;
  cursor: grab;
`;

const Handle = styled.div`
  display: flex;
  justify-content: center;
  padding: 8px 0 4px;

  &::before {
    content: '';
    width: 36px;
    height: 5px;
    border-radius: 4px;
    background: var(--text-subtle);
    opacity: 0.5;
  }
`;

/* iOS close control: a small grey disc inside a full 44px target. */
const Close = styled.button`
  position: absolute;
  top: 6px;
  right: 6px;
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  outline: none;
  -webkit-tap-highlight-color: transparent;

  & > span {
    display: grid;
    place-items: center;
    width: 30px;
    height: 30px;
    border-radius: 50%;
    background: var(--surface-fill);
    transition: transform 160ms var(--ease);
  }
  &:active > span {
    transform: scale(0.92);
  }
  &:focus-visible > span {
    box-shadow: 0 0 0 2px var(--color-indigo-ink);
  }
`;

const Title = styled.h2`
  margin: 0;
  padding: 8px 64px 4px 20px;
  font-size: 22px;
  line-height: 1.2;
  font-weight: 600;
  letter-spacing: -0.4px;
  color: var(--text-primary);
`;

const Description = styled.p`
  margin: 0;
  padding: 0 20px 8px;
  font-size: 15px;
  line-height: 1.45;
  color: var(--text-secondary);
`;

const Body = styled.div`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  touch-action: pan-y;
  padding: 12px 16px 8px;
`;

export interface SheetProps {
  open: boolean;
  onClose: () => void;
  /** Visible heading; also names the dialog for assistive tech. */
  title?: ReactNode;
  description?: ReactNode;
  /** Accessible name when there is no visible title. */
  label?: string;
  children: ReactNode;
  /** Caps the sheet height as a share of the viewport. */
  maxHeightRatio?: number;
  /** Uses the grouped background, for sheets made of inset lists. */
  grouped?: boolean;
  /** Accessible name of the close control. */
  closeLabel?: string;
}

export function Sheet({
  open,
  onClose,
  title,
  description,
  label,
  children,
  maxHeightRatio = 0.9,
  grouped = false,
  closeLabel = 'Close',
}: SheetProps) {
  const reduced = useReducedMotion();
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  // Stays mounted through the exit animation, then unmounts.
  const [mounted, setMounted] = useState(open);
  const drag = useDragControls();
  const y = useMotionValue(0);
  const height = useRef(800);
  const fade = useTransform(y, (v) => 1 - Math.min(1, Math.max(0, v / height.current)));

  useEffect(() => {
    if (open) setMounted(true);
  }, [open]);

  useEffect(() => {
    if (!mounted) return;
    const h = panelRef.current?.offsetHeight ?? window.innerHeight;
    height.current = h;
    if (open) {
      if (reduced) {
        y.set(0);
        return;
      }
      y.set(h);
      const controls = animate(y, 0, spring);
      return () => controls.stop();
    }
    if (reduced) {
      setMounted(false);
      return;
    }
    const controls = animate(y, h, { ...spring, onComplete: () => setMounted(false) });
    return () => controls.stop();
  }, [open, mounted, reduced, y]);

  const onDragEnd = (_: unknown, info: PanInfo) => {
    const h = height.current;
    if (info.offset.y > h / 3 || info.velocity.y > 600) {
      onClose();
      return;
    }
    animate(y, 0, spring);
  };

  if (!mounted) return null;

  return (
    <Modal open hideBackdrop onClose={onClose}>
      <Root>
        <Backdrop style={{ opacity: fade }} onClick={onClose} aria-hidden="true" />
        <Panel
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={hasContent(title) ? titleId : undefined}
          aria-label={hasContent(title) ? undefined : label}
          tabIndex={-1}
          $grouped={grouped}
          $maxHeight={maxHeightRatio}
          style={{ y }}
          drag={reduced ? false : 'y'}
          dragControls={drag}
          dragListener={false}
          dragConstraints={{ bottom: 0, top: 0 }}
          dragElastic={{ bottom: 0.9, top: 0.04 }}
          dragMomentum={false}
          onDragEnd={onDragEnd}
        >
          <Grip onPointerDown={(event) => drag.start(event)}>
            <Handle aria-hidden="true" />
            <Close
              type="button"
              aria-label={closeLabel}
              onClick={onClose}
              onPointerDown={(event) => event.stopPropagation()}
            >
              <span>
                <X size={16} strokeWidth={2.4} aria-hidden="true" />
              </span>
            </Close>
            {hasContent(title) ? <Title id={titleId}>{title}</Title> : null}
            {hasContent(description) ? <Description>{description}</Description> : null}
          </Grip>
          <Body>{children}</Body>
        </Panel>
      </Root>
    </Modal>
  );
}

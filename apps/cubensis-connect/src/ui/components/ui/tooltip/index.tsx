import type { Placement } from '@floating-ui/react-dom';
import { arrow, autoUpdate, flip, offset, shift, useFloating } from '@floating-ui/react-dom';
import clsx from 'clsx';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import invariant from 'tiny-invariant';

import * as modal from '../modal/modal.module.styl';
import * as styles from './tooltip.module.css';

interface Props {
  className?: string | undefined;
  children: (renderProps: {
    // biome-ignore lint/suspicious/noExplicitAny: MutableRefObject is invariant on element type; HTMLElement | null is not assignable to Ref<HTMLButtonElement> or Ref<HTMLDivElement> when consumers spread this onto intrinsic JSX elements
    ref: React.MutableRefObject<any>;
    onMouseEnter: () => void;
    onMouseLeave: () => void;
  }) => React.ReactNode;
  content: React.ReactNode;
  placement?: Placement | undefined;
}

export function Tooltip({
  className = '',
  children,
  content,
  placement = 'top-end',
  ...props
}: Props) {
  const [el, setEl] = useState<HTMLDivElement | null>(null);
  const elRef = useRef(null);
  const arrowRef = useRef<HTMLDivElement | null>(null);
  const [showPopper, setShowPopper] = useState(false);

  const { refs, floatingStyles, middlewareData } = useFloating({
    middleware: [offset(10), flip(), shift(), arrow({ element: arrowRef })],
    placement,
    whileElementsMounted: autoUpdate,
  });

  const setFloatingRef = useCallback(
    (node: HTMLDivElement | null) => {
      refs.setFloating(node);
    },
    [refs],
  );

  useEffect(() => {
    // #app-modal is the shared portal root for overlays; its absence (e.g. test env) is safe to skip.
    const root = document.getElementById('app-modal');
    if (!root) return;

    const child = document.createElement('div');
    // modal.module.styl always defines .modalWrapper; invariant defends against stale CSS module types
    invariant(modal.modalWrapper != null, 'modal.module.styl must export .modalWrapper class');
    child.classList.add(modal.modalWrapper);
    setEl(child);

    return () => {
      root.removeChild(child);
    };
  }, []);

  return (
    <>
      {children({
        onMouseEnter: () => {
          refs.setReference(elRef.current);
          setShowPopper(true);
        },
        onMouseLeave: () => setShowPopper(false),
        ref: elRef,
      })}

      {el &&
        createPortal(
          showPopper && (
            <div
              ref={setFloatingRef}
              className={clsx(className, styles.tooltip)}
              style={floatingStyles}
              {...props}
            >
              <div
                ref={arrowRef}
                className={styles.arrow}
                style={{
                  left: middlewareData.arrow?.x != null ? `${middlewareData.arrow.x}px` : '',
                  top: middlewareData.arrow?.y != null ? `${middlewareData.arrow.y}px` : '',
                }}
              />
              {content}
            </div>
          ),
          el,
        )}
    </>
  );
}

import {
  arrow,
  autoUpdate,
  flip,
  offset,
  type Placement,
  shift,
  useFloating,
} from '@floating-ui/react-dom';
import clsx from 'clsx';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import * as modal from '../modal/modal.styl';
import * as styles from './tooltip.module.css';

interface Props {
  className?: string;
  children: (renderProps: {
    ref: React.MutableRefObject<any>;
    onMouseEnter: () => void;
    onMouseLeave: () => void;
  }) => React.ReactNode;
  content: React.ReactNode;
  placement?: Placement;
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
    placement,
    whileElementsMounted: autoUpdate,
    middleware: [offset(10), flip(), shift(), arrow({ element: arrowRef })],
  });

  const setFloatingRef = useCallback(
    (node: HTMLDivElement | null) => {
      refs.setFloating(node);
    },
    [refs],
  );

  useEffect(() => {
    const root = document.getElementById('app-modal')!;

    const child = document.createElement('div');
    child.classList.add(modal.modalWrapper);
    root.appendChild(child);
    setEl(child);

    return () => {
      root.removeChild(child);
    };
  }, []);

  return (
    <>
      {children({
        ref: elRef,
        onMouseEnter: () => {
          refs.setReference(elRef.current);
          setShowPopper(true);
        },
        onMouseLeave: () => setShowPopper(false),
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

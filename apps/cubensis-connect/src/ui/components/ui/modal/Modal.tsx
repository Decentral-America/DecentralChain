import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { CSSTransition } from 'react-transition-group';

import * as styles from './modal.module.styl';

const ModalWrapper = (props: Props) => {
  return (
    <CSSTransition
      in={props.showModal ?? false}
      classNames={props.animation || 'default_modal'}
      timeout={400}
      unmountOnExit
      onExited={props.onExited}
    >
      {props.children ?? <div> </div>}
    </CSSTransition>
  );
};

interface Props {
  showModal?: boolean | null | undefined;
  children?: React.ReactNode | undefined;
  animation?: string | undefined;
  onExited?: (() => void) | undefined;
}

let modalRoot: HTMLElement | null = null;

export function Modal(props: Props) {
  const elRef = useRef<HTMLDivElement | null>(null);

  if (!elRef.current) {
    const el = document.createElement('div');
    el.classList.add(styles.modalWrapper!);
    elRef.current = el;
  }

  useEffect(() => {
    if (!modalRoot) {
      modalRoot = document.getElementById('app-modal');
    }
    modalRoot?.appendChild(elRef.current!);
    return () => {
      modalRoot?.removeChild(elRef.current!);
    };
  }, []);

  return createPortal(
    <ModalWrapper onExited={props.onExited} animation={props.animation} showModal={props.showModal}>
      {props.children}
    </ModalWrapper>,
    elRef.current,
  );
}

Modal.ANIMATION = {
  FLASH: 'flash_modal',
  FLASH_SCALE: 'flash_scale_modal',
};

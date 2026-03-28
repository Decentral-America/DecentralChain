import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { CSSTransition } from 'react-transition-group';
import invariant from 'tiny-invariant';

import * as styles from './modal.module.styl';

const ModalWrapper = (props: Props) => {
  return (
    <CSSTransition
      in={props.showModal ?? false}
      classNames={props.animation ?? 'default_modal'}
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

// #app-modal is a static element in the extension HTML pages used as the portal root for all modals.
let modalRoot: HTMLElement | null = null;

export function Modal(props: Props) {
  const elRef = useRef<HTMLDivElement | null>(null);

  if (!elRef.current) {
    const el = document.createElement('div');
    // modal.module.styl always defines .modalWrapper — invariant defends against stale CSS module types
    invariant(styles.modalWrapper != null, 'modal.module.styl must export .modalWrapper class');
    el.classList.add(styles.modalWrapper);
    elRef.current = el;
  }

  useEffect(() => {
    const el = elRef.current;
    invariant(el != null, 'Modal: elRef must be set during render before effect runs');
    if (!modalRoot) {
      modalRoot = document.getElementById('app-modal');
    }
    modalRoot?.appendChild(el);
    return () => {
      modalRoot?.removeChild(el);
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

/**
 * Modal Component
 * Reusable modal with overlay, animations, and accessibility features
 * Supports click-to-close, ESC key, and focus trap
 *
 * Drawn with the shared dialog material (src/components/premium/ModalSurface,
 * after 21st.dev "Modal" by @ddoemonn): blurred backdrop, 20px panel, spring
 * entrance and a quick exit that AnimatePresence lets finish before unmount.
 */
import { AnimatePresence } from 'motion/react';
import type React from 'react';
import { useCallback, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { Portal } from '@/components/atoms/Portal';
import {
  CloseGlyph,
  ModalBackdrop,
  ModalBodyArea,
  ModalCloseButton,
  ModalHead,
  ModalLayer,
  ModalPanel,
  ModalTitleText,
  useModalVariants,
} from '@/components/premium/ModalSurface';
import { useEscapeKey, useFocusTrap } from '@/hooks';

export interface ModalProps {
  /**
   * Whether the modal is open
   */
  open: boolean;

  /**
   * Callback when modal should close
   */
  onClose: () => void;

  /**
   * Modal content
   */
  children: React.ReactNode;

  /**
   * Modal title (for accessibility)
   */
  title?: string;

  /**
   * Whether to close on overlay click
   * @default true
   */
  closeOnOverlayClick?: boolean;

  /**
   * Whether to close on ESC key
   * @default true
   */
  closeOnEsc?: boolean;

  /**
   * Whether to trap focus inside modal
   * @default true
   */
  trapFocus?: boolean;

  /**
   * Modal size
   * @default 'medium'
   */
  size?: 'small' | 'medium' | 'large' | 'fullscreen';

  /**
   * Custom className for modal content
   */
  className?: string;

  /**
   * Z-index for the modal
   * @default 1000
   */
  zIndex?: number | undefined;

  /**
   * Animation duration in ms
   * @default 200
   */
  animationDuration?: number;

  /**
   * Whether to show close button
   * @default false
   */
  showCloseButton?: boolean;

  /**
   * Custom test ID for testing
   */
  testId?: string;
}

const sizeWidths = {
  fullscreen: '95vw',
  large: '900px',
  medium: '600px',
  small: '400px',
} as const;

/* The body keeps its padding when a title bar is absent, so content never touches the corner. */
const Body = styled(ModalBodyArea)<{ $titleless: boolean }>`
  padding-top: ${(p) => (p.$titleless ? '24px' : '4px')};
`;

/* A titleless modal floats its close button over the body instead of reserving a bar. */
const FloatingClose = styled(ModalCloseButton)`
  position: absolute;
  top: 16px;
  right: 16px;
  z-index: 1;
`;

/* Keeps a scroll gesture inside the overlay instead of chaining to the page behind it. */
const Layer = styled(ModalLayer)`
  overscroll-behavior: contain;
`;

export const Modal: React.FC<ModalProps> = ({
  open,
  onClose,
  children,
  title,
  closeOnOverlayClick = true,
  closeOnEsc = true,
  trapFocus = true,
  size = 'medium',
  className,
  zIndex = 1300,
  animationDuration: _animationDuration = 200,
  showCloseButton = false,
  testId = 'modal',
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const variants = useModalVariants();
  const previousActiveElement = useRef<HTMLElement | null>(null);

  /**
   * Handle overlay click
   */
  const handleOverlayClick = useCallback(
    (_e: React.MouseEvent<HTMLDivElement>) => {
      if (closeOnOverlayClick) {
        onClose();
      }
    },
    [closeOnOverlayClick, onClose],
  );

  /**
   * Handle ESC key press with our useEscapeKey hook
   */
  useEscapeKey(onClose, open && closeOnEsc);

  /**
   * Focus trap with our useFocusTrap hook
   */
  useFocusTrap(modalRef, open && trapFocus);

  /**
   * Save and restore focus
   */
  useEffect(() => {
    if (!open) return;

    // Save currently focused element
    previousActiveElement.current = document.activeElement as HTMLElement;

    // Restore focus on unmount
    return () => {
      if (previousActiveElement.current) {
        previousActiveElement.current.focus();
      }
    };
  }, [open]);

  /**
   * Prevent body scroll when modal is open
   */
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <Portal>
      <AnimatePresence>
        {open ? (
          <Layer
            key="modal"
            $z={zIndex}
            initial="closed"
            animate="open"
            exit="gone"
            variants={{ closed: {}, gone: {}, open: {} }}
            data-testid={`${testId}-overlay`}
          >
            <ModalBackdrop
              aria-hidden="true"
              variants={variants.backdrop}
              onClick={handleOverlayClick}
            />
            <ModalPanel
              ref={modalRef}
              variants={variants.panel}
              className={className}
              role="dialog"
              aria-modal="true"
              aria-labelledby={title ? `${testId}-title` : undefined}
              tabIndex={-1}
              data-testid={testId}
              style={{
                height: size === 'fullscreen' ? '95vh' : undefined,
                maxWidth: sizeWidths[size],
              }}
            >
              {title ? (
                <ModalHead>
                  <ModalTitleText id={`${testId}-title`}>{title}</ModalTitleText>
                  {showCloseButton && (
                    <ModalCloseButton
                      type="button"
                      onClick={onClose}
                      aria-label="Close modal"
                      data-testid={`${testId}-close`}
                    >
                      <CloseGlyph />
                    </ModalCloseButton>
                  )}
                </ModalHead>
              ) : showCloseButton ? (
                <FloatingClose
                  type="button"
                  onClick={onClose}
                  aria-label="Close modal"
                  data-testid={`${testId}-close`}
                >
                  <CloseGlyph />
                </FloatingClose>
              ) : null}
              <Body $titleless={!title}>{children}</Body>
            </ModalPanel>
          </Layer>
        ) : null}
      </AnimatePresence>
    </Portal>
  );
};

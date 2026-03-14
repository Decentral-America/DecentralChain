/**
 * Modal Component
 * Reusable modal with overlay, animations, and accessibility features
 * Supports click-to-close, ESC key, and focus trap
 */
import React, { useEffect, useRef, useCallback } from 'react';
import styled, { keyframes } from 'styled-components';
import { Portal } from '@/components/atoms/Portal';
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
  zIndex?: number;

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

/**
 * Fade in animation for overlay
 */
const fadeIn = keyframes`
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
`;

/**
 * Slide up animation for modal content
 */
const slideUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const Overlay = styled.div<{ zIndex: number; animationDuration: number }>`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: ${(p) => p.zIndex};
  animation: ${fadeIn} ${(p) => p.animationDuration}ms ease-out;
  padding: ${(p) => p.theme.spacing.lg};
  overflow-y: auto;

  /* Backdrop blur effect */
  backdrop-filter: blur(4px);
`;

const sizeStyles = {
  small: `
    max-width: 400px;
  `,
  medium: `
    max-width: 600px;
  `,
  large: `
    max-width: 900px;
  `,
  fullscreen: `
    max-width: 95vw;
    max-height: 95vh;
    width: 100%;
    height: 100%;
  `,
};

const ModalContent = styled.div<{
  size: 'small' | 'medium' | 'large' | 'fullscreen';
  animationDuration: number;
}>`
  background: ${(p) => p.theme.colors.background};
  border-radius: ${(p) => p.theme.radii.lg};
  box-shadow: ${(p) => p.theme.shadows.xl};
  width: 90%;
  ${(p) => sizeStyles[p.size]}
  animation: ${slideUp} ${(p) => p.animationDuration}ms ease-out;
  position: relative;
  display: flex;
  flex-direction: column;

  /* Ensure modal is scrollable if content is too tall */
  ${(p) =>
    p.size === 'fullscreen' &&
    `
    overflow-y: auto;
  `}
`;

const ModalHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${(p) => p.theme.spacing.lg};
  border-bottom: 1px solid ${(p) => p.theme.colors.border};
`;

const ModalTitle = styled.h2`
  margin: 0;
  font-size: ${(p) => p.theme.fontSizes.xl};
  font-weight: ${(p) => p.theme.fontWeights.semibold};
  color: ${(p) => p.theme.colors.text};
`;

const CloseButton = styled.button`
  background: transparent;
  border: none;
  font-size: ${(p) => p.theme.fontSizes.xl};
  color: ${(p) => p.theme.colors.disabled};
  cursor: pointer;
  padding: ${(p) => p.theme.spacing.xs};
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: ${(p) => p.theme.radii.sm};
  transition: ${(p) => p.theme.transitions.fast};

  &:hover {
    color: ${(p) => p.theme.colors.text};
    background: ${(p) => p.theme.colors.hover};
  }

  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px ${(p) => p.theme.colors.primary};
  }
`;

const ModalBody = styled.div`
  padding: ${(p) => p.theme.spacing.lg};
  flex: 1;
  overflow-y: auto;
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
  zIndex = 1000,
  animationDuration = 200,
  showCloseButton = false,
  testId = 'modal',
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  /**
   * Handle overlay click
   */
  const handleOverlayClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (closeOnOverlayClick && e.target === e.currentTarget) {
        onClose();
      }
    },
    [closeOnOverlayClick, onClose]
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

  if (!open) {
    return null;
  }

  return (
    <Portal>
      <Overlay
        onClick={handleOverlayClick}
        zIndex={zIndex}
        animationDuration={animationDuration}
        data-testid={`${testId}-overlay`}
      >
        <ModalContent
          ref={modalRef}
          size={size}
          animationDuration={animationDuration}
          className={className}
          role="dialog"
          aria-modal="true"
          aria-labelledby={title ? `${testId}-title` : undefined}
          tabIndex={-1}
          data-testid={testId}
        >
          {(title || showCloseButton) && (
            <ModalHeader>
              {title && <ModalTitle id={`${testId}-title`}>{title}</ModalTitle>}
              {showCloseButton && (
                <CloseButton
                  onClick={onClose}
                  aria-label="Close modal"
                  data-testid={`${testId}-close`}
                >
                  ×
                </CloseButton>
              )}
            </ModalHeader>
          )}
          <ModalBody>{children}</ModalBody>
        </ModalContent>
      </Overlay>
    </Portal>
  );
};

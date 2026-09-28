/**
 * Modal Component
 * Reusable modal dialog with overlay and animation
 * Used for send/receive assets, confirmations, and other dialogs
 *
 * MUI's Modal supplies the focus trap, scroll lock and the themed blurred
 * backdrop; the panel is the shared dialog material from
 * src/components/premium/ModalSurface (after 21st.dev "Modal" by @ddoemonn),
 * entering on the snappy spring.
 */

import { Backdrop, Box, Modal as MuiModal } from '@mui/material';
import { styled } from '@mui/material/styles';
import type React from 'react';
import { useEffect, useId } from 'react';
import { Button } from '@/components/atoms/Button';
import {
  CloseGlyph,
  ModalBodyArea,
  ModalCloseButton,
  ModalFooterBar,
  ModalHead,
  ModalPanel,
  ModalTitleText,
  useModalVariants,
} from '@/components/premium/ModalSurface';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'small' | 'medium' | 'large';
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  showCloseButton?: boolean;
}

/*
 * Centres the panel without a transform of its own, so the panel's spring
 * (scale and rise) owns `transform`. It lets clicks through to MUI's backdrop.
 */
const Centre = styled(Box)({
  display: 'grid',
  inset: 0,
  outline: 'none',
  padding: 'clamp(16px, 4vw, 24px)',
  placeItems: 'center',
  pointerEvents: 'none',
  position: 'fixed',
});

const WIDTHS = { large: 800, medium: 600, small: 400 } as const;

/**
 * Modal component
 */
export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'medium',
  closeOnOverlayClick = true,
  closeOnEscape = true,
  showCloseButton = true,
}) => {
  const titleId = useId();
  const variants = useModalVariants();

  /**
   * Prevent body scroll when modal is open
   */
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  return (
    <MuiModal
      open={isOpen}
      onClose={(_event, reason) => {
        if (reason === 'escapeKeyDown' && !closeOnEscape) return;
        if (reason === 'backdropClick' && !closeOnOverlayClick) return;
        onClose?.();
      }}
      slots={{ backdrop: Backdrop }}
      slotProps={{ backdrop: { timeout: 200 } }}
    >
      <Centre tabIndex={-1}>
        <ModalPanel
          role="dialog"
          aria-modal="true"
          aria-labelledby={title ? titleId : undefined}
          variants={variants.panel}
          initial="closed"
          animate="open"
          style={{ maxWidth: WIDTHS[size], pointerEvents: 'auto' }}
        >
          {(title || showCloseButton) && (
            <ModalHead>
              {title ? <ModalTitleText id={titleId}>{title}</ModalTitleText> : null}
              {showCloseButton && (
                <ModalCloseButton type="button" onClick={onClose} aria-label="Close modal">
                  <CloseGlyph />
                </ModalCloseButton>
              )}
            </ModalHead>
          )}

          <ModalBodyArea style={title || showCloseButton ? undefined : { paddingTop: 24 }}>
            {children}
          </ModalBodyArea>

          {footer && <ModalFooterBar>{footer}</ModalFooterBar>}
        </ModalPanel>
      </Centre>
    </MuiModal>
  );
};

/**
 * Default footer with Cancel and Confirm buttons
 */
export const ModalDefaultFooter: React.FC<{
  onCancel: () => void;
  onConfirm: () => void;
  confirmText?: string;
  cancelText?: string;
  confirmDisabled?: boolean;
  confirmLoading?: boolean;
}> = ({
  onCancel,
  onConfirm,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmDisabled = false,
  confirmLoading = false,
}) => {
  return (
    <>
      <Button variant="secondary" onClick={onCancel}>
        {cancelText}
      </Button>
      <Button
        variant="primary"
        onClick={onConfirm}
        disabled={confirmDisabled}
        isLoading={confirmLoading}
      >
        {confirmText}
      </Button>
    </>
  );
};

/**
 * Modal Component
 * Reusable modal dialog with overlay and animation
 * Used for send/receive assets, confirmations, and other dialogs
 *
 * Migrated to Material-UI
 */

import { Backdrop, Box, Fade, IconButton, Modal as MuiModal, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import type React from 'react';
import { useEffect } from 'react';
import { Button } from '@/components/atoms/Button';

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

/**
 * Modal content container with size variants
 */
const ModalContent = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'size',
})<{ size: 'small' | 'medium' | 'large' }>(({ theme, size }) => ({
  backgroundColor: theme.palette.background.paper,
  borderRadius: Number(theme.shape.borderRadius) * 2,
  boxShadow: theme.shadows[24],
  display: 'flex',
  flexDirection: 'column',
  left: '50%',
  maxHeight: '90vh',
  maxWidth: '90vw',
  outline: 'none',
  overflow: 'hidden',
  position: 'absolute',
  top: '50%',
  transform: 'translate(-50%, -50%)',
  width: size === 'small' ? '400px' : size === 'large' ? '800px' : '600px',

  [theme.breakpoints.down('sm')]: {
    maxHeight: '95vh',
    width: '95vw',
  },
}));

/**
 * Modal header
 */
const ModalHeader = styled(Box)(({ theme }) => ({
  alignItems: 'center',
  borderBottom: `1px solid ${theme.palette.divider}`,
  display: 'flex',
  justifyContent: 'space-between',
  padding: theme.spacing(2.5),
}));

/**
 * Close button
 */
const CloseButton = styled(IconButton)(({ theme }) => ({
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
  },
  color: theme.palette.text.secondary,
  marginLeft: theme.spacing(1),
}));

/**
 * Modal body
 */
const ModalBody = styled(Box)(({ theme }) => ({
  flex: 1,
  overflowY: 'auto',
  padding: theme.spacing(2.5),
}));

/**
 * Modal footer
 */
const ModalFooter = styled(Box)(({ theme }) => ({
  alignItems: 'center',
  borderTop: `1px solid ${theme.palette.divider}`,
  display: 'flex',
  gap: theme.spacing(1.5),
  justifyContent: 'flex-end',
  padding: theme.spacing(2.5),
}));

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
      onClose={closeOnOverlayClick ? onClose : undefined}
      closeAfterTransition
      disableEscapeKeyDown={!closeOnEscape}
      slots={{ backdrop: Backdrop }}
      slotProps={{
        backdrop: {
          timeout: 500,
        },
      }}
    >
      <Fade in={isOpen}>
        <ModalContent size={size}>
          {(title || showCloseButton) && (
            <ModalHeader>
              {title && (
                <Typography variant="h6" component="h2" sx={{ fontWeight: 600 }}>
                  {title}
                </Typography>
              )}
              {showCloseButton && (
                <CloseButton onClick={onClose} aria-label="Close modal">
                  ×
                </CloseButton>
              )}
            </ModalHeader>
          )}

          <ModalBody>{children}</ModalBody>

          {footer && <ModalFooter>{footer}</ModalFooter>}
        </ModalContent>
      </Fade>
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

/**
 * Modal Component
 * Reusable modal dialog with overlay and animation
 * Used for send/receive assets, confirmations, and other dialogs
 *
 * Migrated to Material-UI
 */
import React, { useEffect } from 'react';
import { Modal as MuiModal, Backdrop, Fade, Box, Typography, IconButton } from '@mui/material';
import { styled } from '@mui/material/styles';
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
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  backgroundColor: theme.palette.background.paper,
  borderRadius: theme.shape.borderRadius * 2,
  boxShadow: theme.shadows[24],
  maxHeight: '90vh',
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
  width: size === 'small' ? '400px' : size === 'large' ? '800px' : '600px',
  maxWidth: '90vw',
  outline: 'none',

  [theme.breakpoints.down('sm')]: {
    width: '95vw',
    maxHeight: '95vh',
  },
}));

/**
 * Modal header
 */
const ModalHeader = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2.5),
  borderBottom: `1px solid ${theme.palette.divider}`,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
}));

/**
 * Close button
 */
const CloseButton = styled(IconButton)(({ theme }) => ({
  marginLeft: theme.spacing(1),
  color: theme.palette.text.secondary,
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
  },
}));

/**
 * Modal body
 */
const ModalBody = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2.5),
  overflowY: 'auto',
  flex: 1,
}));

/**
 * Modal footer
 */
const ModalFooter = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2.5),
  borderTop: `1px solid ${theme.palette.divider}`,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  gap: theme.spacing(1.5),
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

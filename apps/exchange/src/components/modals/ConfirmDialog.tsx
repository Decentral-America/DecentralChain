/**
 * ConfirmDialog Component
 * Reusable confirmation dialog for critical actions
 * Used for destructive operations with cancel/confirm actions
 */
import React from 'react';
import styled from 'styled-components';
import { Button } from '@/components/atoms/Button';
import { HStack } from '@/components/atoms/Stack';
import { Modal } from './Modal';

export interface ConfirmDialogProps {
  /**
   * Whether the dialog is open
   */
  open: boolean;

  /**
   * Callback when dialog should close (cancel)
   */
  onClose: () => void;

  /**
   * Callback when user confirms the action
   */
  onConfirm: () => void;

  /**
   * Dialog title
   */
  title: string;

  /**
   * Dialog message/description
   */
  message: string;

  /**
   * Confirmation button text
   * @default 'Confirm'
   */
  confirmText?: string | undefined;

  /**
   * Cancel button text
   * @default 'Cancel'
   */
  cancelText?: string | undefined;

  /**
   * Whether the action is destructive (shows red confirm button)
   * @default false
   */
  destructive?: boolean | undefined;

  /**
   * Whether to show a loading state during confirmation
   * @default false
   */
  loading?: boolean;

  /**
   * Whether to disable the confirm button
   * @default false
   */
  disableConfirm?: boolean;

  /**
   * Additional content to display
   */
  children?: React.ReactNode;

  /**
   * Modal size
   * @default 'small'
   */
  size?: 'small' | 'medium' | 'large';

  /**
   * Custom test ID for testing
   */
  testId?: string;
}

const DialogContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${(p) => p.theme.spacing.lg};
`;

const DialogTitle = styled.h3`
  margin: 0;
  font-size: ${(p) => p.theme.fontSizes.xl};
  font-weight: ${(p) => p.theme.fontWeights.semibold};
  color: ${(p) => p.theme.colors.text};
`;

const DialogMessage = styled.p`
  margin: 0;
  font-size: ${(p) => p.theme.fontSizes.md};
  color: ${(p) => p.theme.colors.disabled};
  line-height: 1.5;
`;

const DialogActions = styled(HStack as React.ComponentType)`
  justify-content: flex-end;
  margin-top: ${(p) => p.theme.spacing.md};
`;

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  destructive = false,
  loading = false,
  disableConfirm = false,
  children,
  size = 'small',
  testId = 'confirm-dialog',
}) => {
  const handleConfirm = () => {
    if (!loading && !disableConfirm) {
      onConfirm();
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size={size}
      closeOnOverlayClick={!loading}
      closeOnEsc={!loading}
      testId={testId}
    >
      <DialogContent>
        <div>
          <DialogTitle data-testid={`${testId}-title`}>{title}</DialogTitle>
          <DialogMessage data-testid={`${testId}-message`}>{message}</DialogMessage>
          {children && <div style={{ marginTop: '1rem' }}>{children}</div>}
        </div>

        <DialogActions>
          <Button
            onClick={onClose}
            variant="secondary"
            disabled={loading}
            data-testid={`${testId}-cancel`}
          >
            {cancelText}
          </Button>
          <Button
            onClick={handleConfirm}
            variant={destructive ? 'danger' : 'primary'}
            disabled={loading || disableConfirm}
            data-testid={`${testId}-confirm`}
          >
            {loading ? 'Processing...' : confirmText}
          </Button>
        </DialogActions>
      </DialogContent>
    </Modal>
  );
};

/**
 * Hook to use ConfirmDialog imperatively
 */
export function useConfirmDialog() {
  const [state, setState] = React.useState<{
    open: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    destructive?: boolean;
    confirmText?: string;
    cancelText?: string;
    resolvePromise?: () => void;
    rejectPromise?: () => void;
  }>({
    open: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const confirm = React.useCallback(
    (options: {
      title: string;
      message: string;
      onConfirm: () => void;
      destructive?: boolean;
      confirmText?: string;
      cancelText?: string;
    }) => {
      return new Promise<boolean>((resolve) => {
        const originalOnConfirm = options.onConfirm;

        setState({
          open: true,
          ...options,
          resolvePromise: () => {
            originalOnConfirm();
            resolve(true);
          },
          rejectPromise: () => {
            resolve(false);
          },
        });
      });
    },
    [],
  );

  const close = React.useCallback(() => {
    setState((prev) => ({ ...prev, open: false }));
    state.rejectPromise?.();
  }, [state]);

  const handleConfirm = React.useCallback(() => {
    state.resolvePromise?.();
    state.onConfirm();
    setState((prev) => ({ ...prev, open: false }));
  }, [state]);

  const ConfirmDialogComponent = React.useMemo(
    () => (
      <ConfirmDialog
        open={state.open}
        onClose={close}
        onConfirm={handleConfirm}
        title={state.title}
        message={state.message}
        destructive={state.destructive}
        confirmText={state.confirmText}
        cancelText={state.cancelText}
      />
    ),
    [state, close, handleConfirm],
  );

  return {
    confirm,
    ConfirmDialog: ConfirmDialogComponent,
  };
}

/**
 * AlertModal Component
 * Modal for displaying important notifications and alerts to users
 * Supports success, error, warning, and info types with appropriate styling
 */
import React from 'react';
import styled from 'styled-components';
import { Modal } from './Modal';
import { Button } from '@/components/atoms/Button';

export type AlertType = 'success' | 'error' | 'warning' | 'info';

export interface AlertModalProps {
  /**
   * Whether the alert is open
   */
  open: boolean;

  /**
   * Callback when alert should close
   */
  onClose: () => void;

  /**
   * Alert title
   */
  title: string;

  /**
   * Alert message/description
   */
  message: string;

  /**
   * Alert type (affects icon and colors)
   * @default 'info'
   */
  type?: AlertType;

  /**
   * Button text
   * @default 'OK'
   */
  buttonText?: string;

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

const AlertContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${(p) => p.theme.spacing.lg};
  align-items: center;
  text-align: center;
`;

const IconWrapper = styled.div<{ type: AlertType }>`
  width: 64px;
  height: 64px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  margin-bottom: ${(p) => p.theme.spacing.sm};

  ${(p) => {
    switch (p.type) {
      case 'success':
        return `
          background: ${p.theme.colors.success}20;
          color: ${p.theme.colors.success};
        `;
      case 'error':
        return `
          background: ${p.theme.colors.error}20;
          color: ${p.theme.colors.error};
        `;
      case 'warning':
        return `
          background: ${p.theme.colors.warning}20;
          color: ${p.theme.colors.warning};
        `;
      case 'info':
      default:
        return `
          background: ${p.theme.colors.primary}20;
          color: ${p.theme.colors.primary};
        `;
    }
  }}
`;

const AlertTitle = styled.h3`
  margin: 0;
  font-size: ${(p) => p.theme.fontSizes.xl};
  font-weight: ${(p) => p.theme.fontWeights.semibold};
  color: ${(p) => p.theme.colors.text};
`;

const AlertMessage = styled.p`
  margin: 0;
  font-size: ${(p) => p.theme.fontSizes.md};
  color: ${(p) => p.theme.colors.disabled};
  line-height: 1.5;
`;

const AlertActions = styled.div`
  display: flex;
  justify-content: center;
  margin-top: ${(p) => p.theme.spacing.md};
`;

/**
 * Get icon for alert type
 */
const getAlertIcon = (type: AlertType): string => {
  switch (type) {
    case 'success':
      return '✓';
    case 'error':
      return '✕';
    case 'warning':
      return '⚠';
    case 'info':
    default:
      return 'ℹ';
  }
};

export const AlertModal: React.FC<AlertModalProps> = ({
  open,
  onClose,
  title,
  message,
  type = 'info',
  buttonText = 'OK',
  children,
  size = 'small',
  testId = 'alert-modal',
}) => {
  return (
    <Modal open={open} onClose={onClose} size={size} testId={testId}>
      <AlertContent>
        <IconWrapper type={type} data-testid={`${testId}-icon`}>
          {getAlertIcon(type)}
        </IconWrapper>

        <div>
          <AlertTitle data-testid={`${testId}-title`}>{title}</AlertTitle>
          <AlertMessage data-testid={`${testId}-message`}>{message}</AlertMessage>
          {children && <div style={{ marginTop: '1rem' }}>{children}</div>}
        </div>

        <AlertActions>
          <Button onClick={onClose} variant="primary" data-testid={`${testId}-button`}>
            {buttonText}
          </Button>
        </AlertActions>
      </AlertContent>
    </Modal>
  );
};

/**
 * Hook to use AlertModal imperatively
 */
export function useAlertModal() {
  const [state, setState] = React.useState<{
    open: boolean;
    title: string;
    message: string;
    type: AlertType;
    buttonText?: string;
  }>({
    open: false,
    title: '',
    message: '',
    type: 'info',
  });

  const alert = React.useCallback(
    (options: { title: string; message: string; type?: AlertType; buttonText?: string }) => {
      return new Promise<void>((resolve) => {
        setState({
          open: true,
          type: 'info',
          ...options,
        });

        // Store resolve function
        (options as any).resolvePromise = resolve;
      });
    },
    []
  );

  const close = React.useCallback(() => {
    setState((prev) => ({ ...prev, open: false }));
    (state as any).resolvePromise?.();
  }, [state]);

  const AlertModalComponent = React.useMemo(
    () => (
      <AlertModal
        open={state.open}
        onClose={close}
        title={state.title}
        message={state.message}
        type={state.type}
        buttonText={state.buttonText}
      />
    ),
    [state, close]
  );

  // Convenience methods for different alert types
  const success = React.useCallback(
    (title: string, message: string) => {
      return alert({ title, message, type: 'success' });
    },
    [alert]
  );

  const error = React.useCallback(
    (title: string, message: string) => {
      return alert({ title, message, type: 'error' });
    },
    [alert]
  );

  const warning = React.useCallback(
    (title: string, message: string) => {
      return alert({ title, message, type: 'warning' });
    },
    [alert]
  );

  const info = React.useCallback(
    (title: string, message: string) => {
      return alert({ title, message, type: 'info' });
    },
    [alert]
  );

  return {
    alert,
    success,
    error,
    warning,
    info,
    AlertModal: AlertModalComponent,
  };
}

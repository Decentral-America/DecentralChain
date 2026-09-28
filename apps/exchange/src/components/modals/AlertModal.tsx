/**
 * AlertModal Component
 * Modal for displaying important notifications and alerts to users
 * Supports success, error, warning, and info types with appropriate styling
 */
import React from 'react';
import styled from 'styled-components';
import { Button } from '@/components/atoms/Button';
import { Modal } from './Modal';

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
  buttonText?: string | undefined;

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
  gap: 20px;
  align-items: center;
  text-align: center;
  padding-top: 4px;
`;

/* A round tinted glyph, the way a system alert marks its kind. */
const IconWrapper = styled.div<{ type: AlertType }>`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  ${(p) => {
    const tone =
      p.type === 'success'
        ? [p.theme.colors.successSurface, p.theme.colors.success]
        : p.type === 'error'
          ? [p.theme.colors.errorSurface, p.theme.colors.error]
          : p.type === 'warning'
            ? [p.theme.colors.warningSurface, p.theme.colors.warning]
            : [p.theme.colors.primarySurface, p.theme.colors.primary];
    return `
      background: ${tone[0]};
      color: ${tone[1]};
    `;
  }}
`;

const AlertTitle = styled.h3`
  margin: 0;
  font-size: 17px;
  font-weight: 600;
  line-height: 1.3;
  letter-spacing: -0.3px;
  color: ${(p) => p.theme.colors.text};
`;

const AlertMessage = styled.p`
  margin: 6px 0 0;
  font-size: 15px;
  letter-spacing: -0.15px;
  color: ${(p) => p.theme.colors.textSecondary};
  line-height: 1.47;
`;

const AlertActions = styled.div`
  display: flex;
  justify-content: stretch;
  width: 100%;

  & > * {
    flex: 1;
  }
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
    message: '',
    open: false,
    title: '',
    type: 'info',
  });

  const resolveRef = React.useRef<(() => void) | null>(null);

  const alert = React.useCallback(
    (options: { title: string; message: string; type?: AlertType; buttonText?: string }) => {
      return new Promise<void>((resolve) => {
        setState({
          open: true,
          type: 'info',
          ...options,
        });

        // Store resolve function
        resolveRef.current = resolve;
      });
    },
    [],
  );

  const close = React.useCallback(() => {
    setState((prev) => ({ ...prev, open: false }));
    resolveRef.current?.();
    resolveRef.current = null;
  }, []);

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
    [state, close],
  );

  // Convenience methods for different alert types
  const success = React.useCallback(
    (title: string, message: string) => {
      return alert({ message, title, type: 'success' });
    },
    [alert],
  );

  const error = React.useCallback(
    (title: string, message: string) => {
      return alert({ message, title, type: 'error' });
    },
    [alert],
  );

  const warning = React.useCallback(
    (title: string, message: string) => {
      return alert({ message, title, type: 'warning' });
    },
    [alert],
  );

  const info = React.useCallback(
    (title: string, message: string) => {
      return alert({ message, title, type: 'info' });
    },
    [alert],
  );

  return {
    AlertModal: AlertModalComponent,
    alert,
    error,
    info,
    success,
    warning,
  };
}

import { createContext, type ReactNode, useCallback, useContext, useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { useAnnouncement } from '@/components/a11y';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType, duration?: number) => void;
  showSuccess: (message: string, duration?: number) => void;
  showError: (message: string, duration?: number) => void;
  showInfo: (message: string, duration?: number) => void;
  showWarning: (message: string, duration?: number) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

const slideIn = keyframes`
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
`;

const slideOut = keyframes`
  from {
    transform: translateX(0);
    opacity: 1;
  }
  to {
    transform: translateX(100%);
    opacity: 0;
  }
`;

const ToastContainer = styled.div`
  position: fixed;
  top: 1rem;
  right: 1rem;
  z-index: 10000;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  max-width: 400px;
  pointer-events: none;

  @media (max-width: 768px) {
    left: 1rem;
    right: 1rem;
    max-width: 100%;
  }
`;

const ToastItem = styled.div<{ type: ToastType; isRemoving?: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 1.25rem;
  background: ${({ theme }) => theme.colors.background};
  border: 2px solid
    ${({ theme, type }) => {
      switch (type) {
        case 'success':
          return theme.colors.success;
        case 'error':
          return theme.colors.error;
        case 'warning':
          return theme.colors.warning;
        default:
          return theme.colors.primary;
      }
    }};
  border-radius: 8px;
  box-shadow: ${({ theme }) => theme.shadows.lg};
  pointer-events: auto;
  animation: ${({ isRemoving }) => (isRemoving ? slideOut : slideIn)} 0.3s ease-out;
  min-height: 60px;
`;

const ToastIcon = styled.div<{ type: ToastType }>`
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  background: ${({ theme, type }) => {
    switch (type) {
      case 'success':
        return theme.colors.success;
      case 'error':
        return theme.colors.error;
      case 'warning':
        return theme.colors.warning;
      default:
        return theme.colors.primary;
    }
  }}20;
  border-radius: 50%;
`;

const ToastContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const ToastMessage = styled.p`
  margin: 0;
  font-size: 0.9375rem;
  line-height: 1.5;
  color: ${({ theme }) => theme.colors.text};
  word-wrap: break-word;
`;

const CloseButton = styled.button`
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  color: ${({ theme }) => theme.colors.text};
  opacity: 0.6;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s;
  padding: 0;

  &:hover {
    opacity: 1;
    background: ${({ theme }) => theme.colors.border}40;
  }

  &:active {
    transform: scale(0.95);
  }
`;

const getToastIcon = (type: ToastType): string => {
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

interface ToastProviderProps {
  children: ReactNode;
}

export const ToastProvider = ({ children }: ToastProviderProps) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [removingToasts, setRemovingToasts] = useState<Set<string>>(new Set());
  const { announce } = useAnnouncement();

  const removeToast = useCallback((id: string) => {
    setRemovingToasts((prev) => new Set(prev).add(id));
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
      setRemovingToasts((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }, 300); // Match animation duration
  }, []);

  const showToast = useCallback(
    (message: string, type: ToastType = 'info', duration: number = 5000) => {
      const id = `toast-${Date.now()}-${crypto.randomUUID()}`;
      const toast: Toast = { duration, id, message, type };

      setToasts((prev) => [...prev, toast]);

      // Announce to screen readers
      // Use assertive for errors, polite for everything else
      const politeness = type === 'error' ? 'assertive' : 'polite';
      const prefix = type.charAt(0).toUpperCase() + type.slice(1);
      announce(`${prefix}: ${message}`, politeness);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast, announce],
  );

  const showSuccess = useCallback(
    (message: string, duration?: number) => {
      showToast(message, 'success', duration);
    },
    [showToast],
  );

  const showError = useCallback(
    (message: string, duration?: number) => {
      showToast(message, 'error', duration);
    },
    [showToast],
  );

  const showInfo = useCallback(
    (message: string, duration?: number) => {
      showToast(message, 'info', duration);
    },
    [showToast],
  );

  const showWarning = useCallback(
    (message: string, duration?: number) => {
      showToast(message, 'warning', duration);
    },
    [showToast],
  );

  return (
    <ToastContext.Provider
      value={{
        removeToast,
        showError,
        showInfo,
        showSuccess,
        showToast,
        showWarning,
      }}
    >
      {children}
      <ToastContainer>
        {toasts.map((toast) => (
          <ToastItem key={toast.id} type={toast.type} isRemoving={removingToasts.has(toast.id)}>
            <ToastIcon type={toast.type}>{getToastIcon(toast.type)}</ToastIcon>
            <ToastContent>
              <ToastMessage>{toast.message}</ToastMessage>
            </ToastContent>
            <CloseButton onClick={() => removeToast(toast.id)} aria-label="Close notification">
              ✕
            </CloseButton>
          </ToastItem>
        ))}
      </ToastContainer>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};

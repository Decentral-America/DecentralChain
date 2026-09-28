import {
  createContext,
  lazy,
  type ReactNode,
  Suspense,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { useAnnouncement } from '@/components/a11y';

/*
 * The stack animates with `motion`, and this provider mounts with the app, so a
 * static import put the whole animation library on first paint (+126 kB raw,
 * +40 kB gzipped on the entry chunk) for UI that shows nothing until the first
 * toast. It loads on demand instead, and is warmed once the browser is idle so
 * that first toast rarely waits. The accessible part — the announcement — is
 * made here in `showToast`, not by the stack, so it never waits on the chunk.
 */
const loadToastStack = () => import('@/components/premium/ToastStack');
const ToastStack = lazy(() => loadToastStack().then((m) => ({ default: m.ToastStack })));

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  message: ReactNode;
  type: ToastType;
  duration?: number;
}

interface ToastContextType {
  showToast: (message: ReactNode, type?: ToastType, duration?: number) => void;
  showSuccess: (message: ReactNode, duration?: number) => void;
  showError: (message: ReactNode, duration?: number) => void;
  showInfo: (message: ReactNode, duration?: number) => void;
  showWarning: (message: ReactNode, duration?: number) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

interface ToastProviderProps {
  children: ReactNode;
}

export const ToastProvider = ({ children }: ToastProviderProps) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [removingToasts, setRemovingToasts] = useState<Set<string>>(new Set());
  const [stackMounted, setStackMounted] = useState(false);
  const { announce } = useAnnouncement();

  useEffect(() => {
    const warm = () => void loadToastStack();
    if (typeof window.requestIdleCallback === 'function') {
      const id = window.requestIdleCallback(warm, { timeout: 4000 });
      return () => window.cancelIdleCallback(id);
    }
    const timer = window.setTimeout(warm, 2000);
    return () => window.clearTimeout(timer);
  }, []);

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
    (message: ReactNode, type: ToastType = 'info', duration: number = 5000) => {
      const id = `toast-${Date.now()}-${crypto.randomUUID()}`;
      const toast: Toast = { duration, id, message, type };

      setToasts((prev) => [...prev, toast]);
      setStackMounted(true);

      // Announce to screen readers — stringify for the accessibility layer
      // (ReactNode content is rendered visually; the a11y label uses a plain string)
      const politeness = type === 'error' ? 'assertive' : 'polite';
      const prefix = type.charAt(0).toUpperCase() + type.slice(1);
      const textContent = typeof message === 'string' ? message : `${prefix} notification`;
      announce(`${prefix}: ${textContent}`, politeness);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast, announce],
  );

  const showSuccess = useCallback(
    (message: ReactNode, duration?: number) => {
      showToast(message, 'success', duration);
    },
    [showToast],
  );

  const showError = useCallback(
    (message: ReactNode, duration?: number) => {
      showToast(message, 'error', duration);
    },
    [showToast],
  );

  const showInfo = useCallback(
    (message: ReactNode, duration?: number) => {
      showToast(message, 'info', duration);
    },
    [showToast],
  );

  const showWarning = useCallback(
    (message: ReactNode, duration?: number) => {
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
      {/* Mounted from the first toast on and kept mounted, so exit animations still play. */}
      {(toasts.length > 0 || stackMounted) && (
        <Suspense fallback={null}>
          <ToastStack toasts={toasts} removingIds={removingToasts} onDismiss={removeToast} />
        </Suspense>
      )}
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

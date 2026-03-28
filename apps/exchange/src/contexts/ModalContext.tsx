/**
 * Modal Manager Context
 * Centralized modal state management for app-wide dialogs
 * Provides imperative modal control with type-safe APIs
 */
import React, { createContext, type ReactNode, useCallback, useContext, useState } from 'react';
import { logger } from '@/lib/logger';

/**
 * Modal state interface
 */
export interface ModalState {
  open: boolean;
  props?: Record<string, unknown>;
  onClose?: (() => void) | undefined;
  priority?: number | undefined; // Higher priority modals appear above others
}

/**
 * Modal context interface
 */
export interface ModalContextType {
  /**
   * Open a modal by ID with optional props
   */
  openModal: (id: string, props?: Record<string, unknown>, options?: ModalOptions) => void;

  /**
   * Close a modal by ID
   */
  closeModal: (id: string) => void;

  /**
   * Close all modals
   */
  closeAllModals: () => void;

  /**
   * Check if a modal is open
   */
  isModalOpen: (id: string) => boolean;

  /**
   * Get modal state by ID
   */
  getModalState: (id: string) => ModalState | undefined;

  /**
   * Get all open modals
   */
  getOpenModals: () => string[];

  /**
   * All modal states
   */
  modals: Record<string, ModalState>;
}

/**
 * Options for opening modals
 */
export interface ModalOptions {
  /**
   * Callback when modal closes
   */
  onClose?: () => void;

  /**
   * Modal priority (higher values appear above lower ones)
   * @default 0
   */
  priority?: number;

  /**
   * Whether to close other modals when opening this one
   * @default false
   */
  exclusive?: boolean;
}

/**
 * Modal Provider Props
 */
export interface ModalProviderProps {
  children: ReactNode;

  /**
   * Maximum number of modals that can be open simultaneously
   * @default Infinity
   */
  maxOpenModals?: number;

  /**
   * Callback when modal count changes
   */
  onModalCountChange?: (count: number) => void;
}

const ModalContext = createContext<ModalContextType | null>(null);

/**
 * Modal Provider Component
 * Manages global modal state
 */
export const ModalProvider: React.FC<ModalProviderProps> = ({
  children,
  maxOpenModals = Infinity,
  onModalCountChange,
}) => {
  const [modals, setModals] = useState<Record<string, ModalState>>({});

  /**
   * Open a modal
   */
  const openModal = useCallback(
    (id: string, props?: Record<string, unknown>, options?: ModalOptions) => {
      setModals((prev) => {
        const openCount = Object.values(prev).filter((m) => m.open).length;

        // Check max modals limit
        if (openCount >= maxOpenModals) {
          logger.warn(
            `Maximum number of modals (${maxOpenModals}) reached. Cannot open modal: ${id}`,
          );
          return prev;
        }

        // Close other modals if exclusive
        const newModals = options?.exclusive
          ? Object.keys(prev).reduce(
              (acc, key) => {
                acc[key] = { ...prev[key], open: false };
                return acc;
              },
              {} as Record<string, ModalState>,
            )
          : { ...prev };

        // Open the new modal
        newModals[id] = {
          onClose: options?.onClose,
          open: true,
          priority: options?.priority ?? 0,
          props: props ?? {},
        };

        // Notify modal count change
        const newOpenCount = Object.values(newModals).filter((m) => m.open).length;
        if (newOpenCount !== openCount) {
          onModalCountChange?.(newOpenCount);
        }

        return newModals;
      });
    },
    [maxOpenModals, onModalCountChange],
  );

  /**
   * Close a modal
   */
  const closeModal = useCallback(
    (id: string) => {
      setModals((prev) => {
        if (!prev[id]) {
          return prev;
        }

        const modal = prev[id];
        const openCount = Object.values(prev).filter((m) => m.open).length;

        // Call onClose callback if provided
        if (modal.open && modal.onClose) {
          modal.onClose();
        }

        // Close the modal
        const newModals = {
          ...prev,
          [id]: { ...modal, open: false },
        };

        // Notify modal count change
        const newOpenCount = Object.values(newModals).filter((m) => m.open).length;
        if (newOpenCount !== openCount) {
          onModalCountChange?.(newOpenCount);
        }

        return newModals;
      });
    },
    [onModalCountChange],
  );

  /**
   * Close all modals
   */
  const closeAllModals = useCallback(() => {
    setModals((prev) => {
      const newModals: Record<string, ModalState> = {};
      const hadOpenModals = Object.values(prev).some((m) => m.open);

      // Close all and call their onClose callbacks
      Object.keys(prev).forEach((id) => {
        const modal = prev[id];
        if (modal?.open && modal.onClose) {
          modal.onClose();
        }
        newModals[id] = { ...modal, open: false };
      });

      // Notify modal count change
      if (hadOpenModals) {
        onModalCountChange?.(0);
      }

      return newModals;
    });
  }, [onModalCountChange]);

  /**
   * Check if a modal is open
   */
  const isModalOpen = useCallback(
    (id: string) => {
      return modals[id]?.open ?? false;
    },
    [modals],
  );

  /**
   * Get modal state
   */
  const getModalState = useCallback(
    (id: string) => {
      return modals[id];
    },
    [modals],
  );

  /**
   * Get all open modals (sorted by priority)
   */
  const getOpenModals = useCallback(() => {
    return Object.keys(modals)
      .filter((id) => modals[id]?.open)
      .sort((a, b) => {
        const priorityA = modals[a]?.priority ?? 0;
        const priorityB = modals[b]?.priority ?? 0;
        return priorityB - priorityA; // Higher priority first
      });
  }, [modals]);

  const value: ModalContextType = {
    closeAllModals,
    closeModal,
    getModalState,
    getOpenModals,
    isModalOpen,
    modals,
    openModal,
  };

  return <ModalContext.Provider value={value}>{children}</ModalContext.Provider>;
};

/**
 * Hook to use modal context
 */
export const useModal = (): ModalContextType => {
  const context = useContext(ModalContext);

  if (!context) {
    throw new Error('useModal must be used within a ModalProvider');
  }

  return context;
};

/**
 * Hook to control a specific modal
 */
export const useModalControl = (
  modalId: string,
): {
  isOpen: boolean;
  open: (props?: Record<string, unknown>, options?: ModalOptions) => void;
  close: () => void;
  state: ModalState | undefined;
} => {
  const { openModal, closeModal, isModalOpen, getModalState } = useModal();

  return {
    close: useCallback(() => closeModal(modalId), [closeModal, modalId]),
    isOpen: isModalOpen(modalId),
    open: useCallback(
      (props?: Record<string, unknown>, options?: ModalOptions) =>
        openModal(modalId, props, options),
      [openModal, modalId],
    ),
    state: getModalState(modalId),
  };
};

/**
 * Higher-order component to provide modal control to a component
 */
export function withModalControl<P extends object>(
  Component: React.ComponentType<P & { modalControl: ReturnType<typeof useModalControl> }>,
  modalId: string,
): React.FC<P> {
  const WithModalControl: React.FC<P> = (props: P) => {
    const modalControl = useModalControl(modalId);
    return <Component {...props} modalControl={modalControl} />;
  };

  WithModalControl.displayName = `withModalControl(${Component.displayName || Component.name || 'Component'})`;

  return WithModalControl;
}

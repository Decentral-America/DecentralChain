// Inspired by react-hot-toast library
import { useEffect, useState } from 'react';
import type { ToastAction, ToastData, ToastState } from '@/types';

const TOAST_LIMIT = 20;
const TOAST_REMOVE_DELAY = 1000000;

const actionTypes = {
  ADD_TOAST: 'ADD_TOAST',
  UPDATE_TOAST: 'UPDATE_TOAST',
  DISMISS_TOAST: 'DISMISS_TOAST',
  REMOVE_TOAST: 'REMOVE_TOAST',
} as const;

type ActionType = (typeof actionTypes)[keyof typeof actionTypes];

type Action = ToastAction | { type: ActionType; toast?: ToastData; toastId?: string };

let count = 0;

function genId(): string {
  count = (count + 1) % Number.MAX_VALUE;
  return count.toString();
}

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>();

const addToRemoveQueue = (toastId: string): void => {
  if (toastTimeouts.has(toastId)) {
    return;
  }

  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId);
    dispatch({
      type: actionTypes.REMOVE_TOAST,
      toastId,
    });
  }, TOAST_REMOVE_DELAY);

  toastTimeouts.set(toastId, timeout);
};

const _clearFromRemoveQueue = (toastId: string): void => {
  const timeout = toastTimeouts.get(toastId);
  if (timeout) {
    clearTimeout(timeout);
    toastTimeouts.delete(toastId);
  }
};

export const reducer = (state: ToastState, action: Action): ToastState => {
  switch (action.type) {
    case actionTypes.ADD_TOAST:
      return {
        ...state,
        toasts: [action.toast as ToastData, ...state.toasts].slice(0, TOAST_LIMIT),
      };

    case actionTypes.UPDATE_TOAST:
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toast?.id ? { ...t, ...(action.toast as ToastData) } : t,
        ),
      };

    case actionTypes.DISMISS_TOAST: {
      const { toastId } = action as { toastId?: string };

      // ! Side effects ! - This could be extracted into a dismissToast() action,
      // but I'll keep it here for simplicity
      if (toastId) {
        addToRemoveQueue(toastId);
      } else {
        state.toasts.forEach((toast) => {
          addToRemoveQueue(toast.id);
        });
      }

      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === toastId || toastId === undefined
            ? {
                ...t,
                open: false,
              }
            : t,
        ),
      };
    }
    case actionTypes.REMOVE_TOAST:
      if ((action as { toastId?: string }).toastId === undefined) {
        return {
          ...state,
          toasts: [],
        };
      }
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== (action as { toastId?: string }).toastId),
      };
    default:
      return state;
  }
};

type Listener = (state: ToastState) => void;

const listeners: Listener[] = [];

let memoryState: ToastState = { toasts: [] };

function dispatch(action: Action): void {
  memoryState = reducer(memoryState, action);
  listeners.forEach((listener) => {
    listener(memoryState);
  });
}

type ToastInput = Omit<ToastData, 'id' | 'open'> & {
  id?: string;
  open?: boolean;
};

function toast({ ...props }: ToastInput): {
  id: string;
  dismiss: () => void;
  update: (props: Partial<ToastData>) => void;
} {
  const id = genId();

  const update = (props: Partial<ToastData>) =>
    dispatch({
      type: actionTypes.UPDATE_TOAST,
      toast: { ...props, id },
    });

  const dismiss = () => dispatch({ type: actionTypes.DISMISS_TOAST, toastId: id });

  dispatch({
    type: actionTypes.ADD_TOAST,
    toast: {
      ...props,
      id,
      open: true,
      onOpenChange: (open) => {
        if (!open) dismiss();
      },
    },
  });

  return {
    id,
    dismiss,
    update,
  };
}

function useToast(): ToastState & {
  toast: typeof toast;
  dismiss: (toastId?: string) => void;
} {
  const [state, setState] = useState(memoryState);

  useEffect(() => {
    listeners.push(setState);
    return () => {
      const index = listeners.indexOf(setState);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }, []);

  return {
    ...state,
    toast,
    dismiss: (toastId?: string) => dispatch({ type: actionTypes.DISMISS_TOAST, toastId }),
  };
}

export { toast, useToast };

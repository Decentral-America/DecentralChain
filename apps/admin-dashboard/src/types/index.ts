export interface ToastData {
  id: string;
  open: boolean;
  title?: string;
  description?: string | React.ReactNode;
  variant?: 'default' | 'destructive';
  action?: React.ReactElement;
  onOpenChange?: (open: boolean) => void;
}

export interface ToastState {
  toasts: ToastData[];
}

export type ToastAction =
  | { type: typeof TOAST_ADD; toast: ToastData }
  | { type: typeof TOAST_UPDATE; toast: Partial<ToastData> & { id: string } }
  | { type: typeof TOAST_DISMISS; toastId?: string }
  | { type: typeof TOAST_REMOVE; toastId?: string };

declare const TOAST_ADD: 'ADD_TOAST';
declare const TOAST_UPDATE: 'UPDATE_TOAST';
declare const TOAST_DISMISS: 'DISMISS_TOAST';
declare const TOAST_REMOVE: 'REMOVE_TOAST';

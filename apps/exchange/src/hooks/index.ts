// Export all hooks from subdirectories
export * from './api';
export * from './auth';
export * from './data';
export * from './ui';

// Export utility hooks
export { useLocalStorage } from './useLocalStorage';
export { useDebounce } from './useDebounce';
export { useClipboard } from './useClipboard';
export { useCopyToClipboard } from './useCopyToClipboard';
export { useAutoFocus } from './useAutoFocus';
export type { UseAutoFocusOptions } from './useAutoFocus';
export { useClickOutside, useModalClickOutside, useDropdownClickOutside } from './useClickOutside';
export type { UseClickOutsideOptions } from './useClickOutside';
export { useDraggable, useConstrainedDraggable } from './useDraggable';
export type { UseDraggableOptions, UseDraggableReturn, Position } from './useDraggable';
export { useTranslation } from './useTranslation';
export type { UseTranslationReturn } from './useTranslation';

export { useAsync } from './useAsync';
export { useMediaQuery } from './useMediaQuery';

// Export keyboard navigation hooks
export {
  useKeyboardShortcuts,
  useEscapeKey,
  useFocusTrap,
  useArrowNavigation,
  useHotkey,
} from './useKeyboardShortcuts';
export type {
  KeyboardShortcut,
  KeyboardShortcutsOptions,
  ArrowNavigationOptions,
  HotkeyOptions,
} from './useKeyboardShortcuts';

// Export analytics hooks
export {
  usePageTracking,
  useComponentTiming,
  useApiTiming,
  useAnalytics,
  useFeatureTracking,
  useFormTracking,
  useButtonTracking,
  useModalTracking,
  useErrorTracking,
} from './useAnalytics';

// Export error monitoring hooks
export {
  useErrorMonitoring,
  useErrorCapture,
  useBreadcrumb,
  useApiErrorTracking,
  useComponentLifecycleTracking,
} from './useErrorMonitoring';

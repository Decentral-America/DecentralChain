import { useEffect, RefObject, useCallback } from 'react';

/**
 * Options for customizing click-outside behavior
 */
export interface UseClickOutsideOptions {
  /**
   * Whether the hook is enabled
   * @default true
   */
  enabled?: boolean;

  /**
   * Additional refs to exclude from click-outside detection
   * Useful for related elements like trigger buttons
   */
  excludeRefs?: RefObject<HTMLElement>[];

  /**
   * Event types to listen for
   * @default ['mousedown', 'touchstart']
   */
  eventTypes?: ('mousedown' | 'mouseup' | 'touchstart' | 'touchend')[];

  /**
   * Capture phase for event listeners
   * @default false
   */
  capture?: boolean;
}

/**
 * Hook to detect clicks outside of an element
 *
 * @param ref - Reference to the element to detect clicks outside of
 * @param handler - Callback function to invoke when clicking outside
 * @param options - Configuration options
 *
 * @example
 * ```tsx
 * const ref = useRef<HTMLDivElement>(null);
 * useClickOutside(ref, () => setOpen(false));
 *
 * return <div ref={ref}>...</div>;
 * ```
 *
 * @example With options
 * ```tsx
 * const dropdownRef = useRef<HTMLDivElement>(null);
 * const buttonRef = useRef<HTMLButtonElement>(null);
 *
 * useClickOutside(dropdownRef, () => setOpen(false), {
 *   excludeRefs: [buttonRef],
 *   enabled: isOpen
 * });
 * ```
 */
export function useClickOutside<T extends HTMLElement>(
  ref: RefObject<T | null>,
  handler: (event: MouseEvent | TouchEvent) => void,
  options: UseClickOutsideOptions = {}
): void {
  const {
    enabled = true,
    excludeRefs = [],
    eventTypes = ['mousedown', 'touchstart'],
    capture = false,
  } = options;

  // Memoize handler to avoid unnecessary effect reruns
  const savedHandler = useCallback(handler, [handler]);

  useEffect(() => {
    // Don't attach listeners if disabled
    if (!enabled) {
      return;
    }

    const listener = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;

      // Check if click is inside main ref
      if (!ref.current || ref.current.contains(target)) {
        return;
      }

      // Check if click is inside any excluded refs
      for (const excludeRef of excludeRefs) {
        if (excludeRef.current && excludeRef.current.contains(target)) {
          return;
        }
      }

      // Call handler if click is outside all refs
      savedHandler(event);
    };

    // Attach listeners for all specified event types
    for (const eventType of eventTypes) {
      document.addEventListener(eventType, listener as EventListener, capture);
    }

    // Cleanup listeners on unmount or when dependencies change
    return () => {
      for (const eventType of eventTypes) {
        document.removeEventListener(eventType, listener as EventListener, capture);
      }
    };
  }, [ref, savedHandler, enabled, excludeRefs, eventTypes, capture]);
}

/**
 * Convenience hook for modals with escape key support
 * Combines click-outside detection with escape key handling
 *
 * @param ref - Reference to the modal element
 * @param onClose - Callback to close the modal
 * @param options - Configuration options
 *
 * @example
 * ```tsx
 * const modalRef = useRef<HTMLDivElement>(null);
 * useModalClickOutside(modalRef, () => setOpen(false));
 * ```
 */
export function useModalClickOutside<T extends HTMLElement>(
  ref: RefObject<T | null>,
  onClose: () => void,
  options: Omit<UseClickOutsideOptions, 'enabled'> & { enabled?: boolean } = {}
): void {
  const { enabled = true, ...restOptions } = options;

  // Handle click outside
  useClickOutside(ref, onClose, { enabled, ...restOptions });

  // Handle escape key
  useEffect(() => {
    if (!enabled) {
      return;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [enabled, onClose]);
}

/**
 * Hook for dropdown menus with trigger button exclusion
 * Automatically excludes the trigger button from click-outside detection
 *
 * @param dropdownRef - Reference to the dropdown menu
 * @param triggerRef - Reference to the trigger button
 * @param onClose - Callback to close the dropdown
 * @param options - Additional configuration options
 *
 * @example
 * ```tsx
 * const dropdownRef = useRef<HTMLDivElement>(null);
 * const buttonRef = useRef<HTMLButtonElement>(null);
 * useDropdownClickOutside(dropdownRef, buttonRef, () => setOpen(false));
 * ```
 */
export function useDropdownClickOutside<T extends HTMLElement, U extends HTMLElement>(
  dropdownRef: RefObject<T | null>,
  triggerRef: RefObject<U | null>,
  onClose: () => void,
  options: Omit<UseClickOutsideOptions, 'excludeRefs'> = {}
): void {
  useClickOutside(dropdownRef, onClose, {
    ...options,
    excludeRefs: [triggerRef as RefObject<HTMLElement>],
  });
}

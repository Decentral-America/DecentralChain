import { useEffect, useRef } from 'react';

/**
 * Custom hook that automatically focuses an element when the component mounts
 *
 * @template T - Type of HTML element to focus (e.g., HTMLInputElement, HTMLTextAreaElement)
 * @param options - Configuration options for auto-focus behavior
 * @returns Ref object to attach to the element that should be focused
 *
 * @example
 * // Basic usage
 * const inputRef = useAutoFocus<HTMLInputElement>();
 * return <input ref={inputRef} />;
 *
 * @example
 * // With delay
 * const inputRef = useAutoFocus<HTMLInputElement>({ delay: 100 });
 * return <input ref={inputRef} />;
 *
 * @example
 * // Conditional focus
 * const inputRef = useAutoFocus<HTMLInputElement>({ enabled: isFormVisible });
 * return <input ref={inputRef} />;
 */

export interface UseAutoFocusOptions {
  /** Whether auto-focus is enabled (default: true) */
  enabled?: boolean;
  /** Delay in milliseconds before focusing (default: 0) */
  delay?: number;
  /** Whether to select all text after focus (for input/textarea) */
  selectAll?: boolean;
  /** Scroll the element into view after focus */
  scrollIntoView?: boolean;
  /** Scroll behavior (default: 'smooth') */
  scrollBehavior?: ScrollBehavior;
}

export function useAutoFocus<T extends HTMLElement>(
  options: UseAutoFocusOptions = {},
): React.RefObject<T | null> {
  const {
    enabled = true,
    delay = 0,
    selectAll = false,
    scrollIntoView = false,
    scrollBehavior = 'smooth',
  } = options;

  const ref = useRef<T>(null);

  useEffect(() => {
    if (!enabled || !ref.current) return;

    const focusElement = () => {
      if (ref.current) {
        // Focus the element
        ref.current.focus();

        // Select all text if enabled and element is an input/textarea
        if (
          selectAll &&
          (ref.current instanceof HTMLInputElement || ref.current instanceof HTMLTextAreaElement)
        ) {
          ref.current.select();
        }

        // Scroll into view if enabled
        if (scrollIntoView) {
          ref.current.scrollIntoView({
            behavior: scrollBehavior,
            block: 'center',
          });
        }
      }
    };

    if (delay > 0) {
      const timeoutId = setTimeout(focusElement, delay);
      return () => clearTimeout(timeoutId);
    } else {
      focusElement();
    }
  }, [enabled, delay, selectAll, scrollIntoView, scrollBehavior]);

  return ref;
}

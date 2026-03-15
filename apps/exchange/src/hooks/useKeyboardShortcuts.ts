/**
 * Keyboard Shortcuts Hook
 * Provides comprehensive keyboard navigation and shortcuts for accessibility and power users
 *
 * Features:
 * - Global app-wide shortcuts (navigation, actions)
 * - Modifier key support (Ctrl/Cmd, Alt, Shift)
 * - Conflict prevention (input/textarea exclusion)
 * - Event cleanup and memory management
 * - Cross-platform support (Mac/Windows/Linux)
 *
 * @example
 * // In a component:
 * useKeyboardShortcuts({
 *   'ctrl+k': () => navigate('/dex'),
 *   'ctrl+w': () => navigate('/wallet'),
 *   'ctrl+/': () => setHelpOpen(true),
 *   'Escape': () => closeModal(),
 * });
 */

import { useEffect, useRef } from 'react';

export interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  altKey?: boolean;
  shiftKey?: boolean;
  metaKey?: boolean;
}

export interface KeyboardShortcutsOptions {
  /**
   * Whether to allow shortcuts when focus is inside input/textarea elements
   * @default false
   */
  allowInInputs?: boolean;

  /**
   * Whether to prevent default browser behavior
   * @default true
   */
  preventDefault?: boolean;

  /**
   * Whether to stop event propagation
   * @default false
   */
  stopPropagation?: boolean;

  /**
   * Custom condition to enable/disable shortcuts
   * @default () => true
   */
  enabled?: boolean;
}

/**
 * Parse shortcut string into structured format
 * Supports formats: 'ctrl+k', 'alt+shift+n', 'Escape', 'ctrl+/', etc.
 */
function parseShortcut(shortcutString: string): KeyboardShortcut {
  const parts = shortcutString.toLowerCase().split('+');
  const key = parts[parts.length - 1] ?? '';

  return {
    altKey: parts.includes('alt'),
    ctrlKey: parts.includes('ctrl') || parts.includes('cmd'),
    key,
    metaKey: parts.includes('meta') || parts.includes('cmd'),
    shiftKey: parts.includes('shift'),
  };
}

/**
 * Check if event matches shortcut definition
 */
function matchesShortcut(event: KeyboardEvent, shortcut: KeyboardShortcut): boolean {
  const eventKey = event.key.toLowerCase();
  const shortcutKey = shortcut.key.toLowerCase();

  // Match the key (support both 'Escape' and 'Esc')
  const keyMatches =
    eventKey === shortcutKey ||
    (shortcutKey === 'escape' && eventKey === 'esc') ||
    (shortcutKey === 'esc' && eventKey === 'escape');

  if (!keyMatches) return false;

  // Match modifier keys (only check if specified in shortcut)
  const ctrlMatches =
    shortcut.ctrlKey === undefined || (event.ctrlKey || event.metaKey) === shortcut.ctrlKey;
  const altMatches = shortcut.altKey === undefined || event.altKey === shortcut.altKey;
  const shiftMatches = shortcut.shiftKey === undefined || event.shiftKey === shortcut.shiftKey;
  const metaMatches = shortcut.metaKey === undefined || event.metaKey === shortcut.metaKey;

  return ctrlMatches && altMatches && shiftMatches && metaMatches;
}

/**
 * Check if the active element is an input where shortcuts should be disabled
 */
function isInputElement(element: Element | null): boolean {
  if (!element) return false;

  const tagName = element.tagName.toLowerCase();
  const isInput = tagName === 'input' || tagName === 'textarea';
  const isContentEditable = element.getAttribute('contenteditable') === 'true';

  return isInput || isContentEditable;
}

/**
 * useKeyboardShortcuts Hook
 *
 * Registers global keyboard shortcuts with automatic cleanup
 *
 * @param shortcuts - Map of shortcut strings to handler functions
 * @param options - Configuration options
 *
 * @example
 * ```tsx
 * function App() {
 *   const navigate = useNavigate();
 *
 *   useKeyboardShortcuts({
 *     // Navigation
 *     'ctrl+k': () => navigate('/dex'),
 *     'ctrl+w': () => navigate('/wallet'),
 *     'ctrl+s': () => navigate('/settings'),
 *
 *     // Actions
 *     'ctrl+/': () => toggleHelp(),
 *     'Escape': () => closeActiveModal(),
 *
 *     // Advanced
 *     'ctrl+shift+d': () => toggleDevTools(),
 *   }, {
 *     allowInInputs: false,
 *     preventDefault: true,
 *   });
 * }
 * ```
 */
export function useKeyboardShortcuts(
  shortcuts: Record<string, () => void>,
  options: KeyboardShortcutsOptions = {},
): void {
  const {
    allowInInputs = false,
    preventDefault = true,
    stopPropagation = false,
    enabled = true,
  } = options;

  // Store parsed shortcuts to avoid re-parsing on every keystroke
  const parsedShortcutsRef = useRef<Map<string, KeyboardShortcut>>(new Map());

  // Update parsed shortcuts when shortcuts object changes
  useEffect(() => {
    const parsed = new Map<string, KeyboardShortcut>();
    Object.keys(shortcuts).forEach((key) => {
      parsed.set(key, parseShortcut(key));
    });
    parsedShortcutsRef.current = parsed;
  }, [shortcuts]);

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (!allowInInputs && isInputElement(document.activeElement)) return;

      for (const [shortcutString, parsedShortcut] of parsedShortcutsRef.current.entries()) {
        if (!matchesShortcut(event, parsedShortcut)) continue;

        const handler = shortcuts[shortcutString];
        if (!handler) continue;

        if (preventDefault) event.preventDefault();
        if (stopPropagation) event.stopPropagation();
        handler();
        break;
      }
    };

    // Use capture phase for more reliable event handling
    window.addEventListener('keydown', handleKeyDown, { capture: true });

    return () => {
      window.removeEventListener('keydown', handleKeyDown, { capture: true });
    };
  }, [shortcuts, allowInInputs, preventDefault, stopPropagation, enabled]);
}

/**
 * useEscapeKey Hook
 *
 * Simplified hook for handling Escape key (common pattern for modals/dropdowns)
 *
 * @param onEscape - Callback when Escape is pressed
 * @param enabled - Whether the handler is active
 *
 * @example
 * ```tsx
 * function Modal({ onClose }) {
 *   useEscapeKey(onClose, isOpen);
 *
 *   return <div>Modal content</div>;
 * }
 * ```
 */
export function useEscapeKey(onEscape: () => void, enabled: boolean = true): void {
  useEffect(() => {
    if (!enabled) return;

    const handleEscape = (event: KeyboardEvent): void => {
      if (event.key === 'Escape' || event.key === 'Esc') {
        event.preventDefault();
        onEscape();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onEscape, enabled]);
}

/**
 * useFocusTrap Hook
 *
 * Traps focus within a container (useful for modals, dropdowns)
 * Pressing Tab cycles through focusable elements within the container
 *
 * @param containerRef - Ref to the container element
 * @param enabled - Whether focus trapping is active
 *
 * @example
 * ```tsx
 * function Modal() {
 *   const modalRef = useRef<HTMLDivElement>(null);
 *   useFocusTrap(modalRef, isOpen);
 *
 *   return <div ref={modalRef}>...</div>;
 * }
 * ```
 */
export function useFocusTrap(
  containerRef: React.RefObject<HTMLElement | null>,
  enabled: boolean = true,
): void {
  useEffect(() => {
    if (!enabled || !containerRef.current) return;

    const container = containerRef.current;

    // Get all focusable elements
    const getFocusableElements = (): HTMLElement[] => {
      const selector = [
        'a[href]',
        'button:not([disabled])',
        'textarea:not([disabled])',
        'input:not([disabled])',
        'select:not([disabled])',
        '[tabindex]:not([tabindex="-1"])',
      ].join(', ');

      return Array.from(container.querySelectorAll(selector));
    };

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key !== 'Tab') return;

      const focusableElements = getFocusableElements();
      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      // Shift+Tab on first element: focus last
      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement?.focus();
      }
      // Tab on last element: focus first
      else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement?.focus();
      }
    };

    // Focus first element when trap is enabled
    const focusableElements = getFocusableElements();
    if (focusableElements.length > 0) {
      focusableElements[0]?.focus();
    }

    container.addEventListener('keydown', handleKeyDown);
    return () => container.removeEventListener('keydown', handleKeyDown);
  }, [containerRef, enabled]);
}

/**
 * useArrowNavigation Hook
 *
 * Implements arrow key navigation for lists/grids
 *
 * @param itemCount - Total number of items
 * @param onIndexChange - Callback when selected index changes
 * @param options - Configuration (orientation, loop, etc.)
 *
 * @example
 * ```tsx
 * function Dropdown({ items }) {
 *   const [selectedIndex, setSelectedIndex] = useState(0);
 *
 *   useArrowNavigation(items.length, setSelectedIndex, {
 *     orientation: 'vertical',
 *     loop: true,
 *   });
 *
 *   return items.map((item, index) => (
 *     <div key={index} data-selected={index === selectedIndex}>
 *       {item}
 *     </div>
 *   ));
 * }
 * ```
 */
export interface ArrowNavigationOptions {
  orientation?: 'vertical' | 'horizontal' | 'both';
  loop?: boolean;
  enabled?: boolean;
}

export function useArrowNavigation(
  itemCount: number,
  onIndexChange: (index: number) => void,
  options: ArrowNavigationOptions = {},
): void {
  const { orientation = 'vertical', loop = false, enabled = true } = options;

  useEffect(() => {
    if (!enabled || itemCount === 0) return;

    const KEY_DELTAS: Record<string, Record<string, number>> = {
      both: { ArrowDown: 1, ArrowLeft: -1, ArrowRight: 1, ArrowUp: -1 },
      horizontal: { ArrowLeft: -1, ArrowRight: 1 },
      vertical: { ArrowDown: 1, ArrowUp: -1 },
    };

    const deltas = KEY_DELTAS[orientation] ?? {};

    const handleKeyDown = (event: KeyboardEvent): void => {
      const delta = deltas[event.key];
      if (delta === undefined) return;

      event.preventDefault();
      let newIndex = delta;

      if (loop) {
        if (newIndex < 0) newIndex = itemCount - 1;
        if (newIndex >= itemCount) newIndex = 0;
      } else {
        newIndex = Math.max(0, Math.min(itemCount - 1, newIndex));
      }

      onIndexChange(newIndex);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [itemCount, onIndexChange, orientation, loop, enabled]);
}

/**
 * useHotkey Hook
 *
 * Simplified single hotkey handler
 *
 * @param key - Keyboard key to listen for
 * @param callback - Function to call when key is pressed
 * @param options - Configuration options
 *
 * @example
 * ```tsx
 * function SearchBar() {
 *   const inputRef = useRef<HTMLInputElement>(null);
 *
 *   // Focus search bar with Ctrl+K
 *   useHotkey('k', () => inputRef.current?.focus(), {
 *     ctrlKey: true,
 *   });
 *
 *   return <input ref={inputRef} />;
 * }
 * ```
 */
export interface HotkeyOptions extends KeyboardShortcutsOptions {
  ctrlKey?: boolean;
  altKey?: boolean;
  shiftKey?: boolean;
  metaKey?: boolean;
}

export function useHotkey(key: string, callback: () => void, options: HotkeyOptions = {}): void {
  const {
    ctrlKey = false,
    altKey = false,
    shiftKey = false,
    metaKey = false,
    allowInInputs = false,
    preventDefault = true,
    enabled = true,
  } = options;

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent): void => {
      // Skip if in input and not allowed
      if (!allowInInputs && isInputElement(document.activeElement)) {
        return;
      }

      // Check if all conditions match
      const keyMatches = event.key.toLowerCase() === key.toLowerCase();
      const ctrlMatches = event.ctrlKey === ctrlKey || event.metaKey === ctrlKey;
      const altMatches = event.altKey === altKey;
      const shiftMatches = event.shiftKey === shiftKey;
      const metaMatches = event.metaKey === metaKey;

      if (keyMatches && ctrlMatches && altMatches && shiftMatches && metaMatches) {
        if (preventDefault) {
          event.preventDefault();
        }
        callback();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [key, callback, ctrlKey, altKey, shiftKey, metaKey, allowInInputs, preventDefault, enabled]);
}

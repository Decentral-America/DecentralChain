/**
 * Global Keyboard Shortcuts Component
 * Implements app-wide keyboard navigation for power users
 *
 * Shortcuts:
 * - Ctrl/Cmd + K: Navigate to DEX
 * - Ctrl/Cmd + W: Navigate to Wallet
 * - Ctrl/Cmd + S: Navigate to Settings
 * - Ctrl/Cmd + /: Toggle help/shortcuts modal
 * - Ctrl/Cmd + ,: Navigate to Settings (Mac standard)
 * - Escape: Close active modal/dropdown
 */

import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts';
import { useHotkey, useKeyboardShortcuts } from '@/hooks';
import { logger } from '@/lib/logger';

interface GlobalKeyboardShortcutsProps {
  /**
   * Optional callback when shortcuts are triggered
   */
  onShortcutTriggered?: (shortcut: string) => void;
}

/**
 * GlobalKeyboardShortcuts Component
 *
 * Provides application-wide keyboard shortcuts for navigation and actions
 * Only active when user is authenticated and not in input fields
 *
 * @example
 * ```tsx
 * function App() {
 *   return (
 *     <>
 *       <GlobalKeyboardShortcuts />
 *       <RouterProvider router={router} />
 *     </>
 *   );
 * }
 * ```
 */
export function GlobalKeyboardShortcuts({ onShortcutTriggered }: GlobalKeyboardShortcutsProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [helpModalOpen, setHelpModalOpen] = useState(false);

  // Only enable shortcuts when user is authenticated
  const isEnabled = !!user;

  // Navigation shortcuts
  useKeyboardShortcuts(
    {
      // Alternative settings shortcut (Mac standard)
      'ctrl+,': () => {
        void navigate('/desktop/settings');
        onShortcutTriggered?.('Navigate to Settings');
      },

      // Help/shortcuts modal
      'ctrl+/': () => {
        setHelpModalOpen((prev) => !prev);
        onShortcutTriggered?.('Toggle Help');
      },

      // Search functionality
      'ctrl+f': () => {
        // Focus search input if exists
        const searchInput = document.querySelector<HTMLInputElement>(
          'input[type="search"], input[placeholder*="Search"]',
        );
        if (searchInput) {
          searchInput.focus();
          searchInput.select();
        }
        onShortcutTriggered?.('Focus Search');
      },
      // Primary navigation
      'ctrl+k': () => {
        void navigate('/desktop/dex');
        onShortcutTriggered?.('Navigate to DEX');
      },

      'ctrl+l': () => {
        // Navigate to leasing
        void navigate('/desktop/wallet/leasing');
        onShortcutTriggered?.('View Leasing');
      },

      // Quick actions
      'ctrl+n': () => {
        // Navigate to create transaction based on current page
        if (location.pathname.includes('/wallet')) {
          void navigate('/desktop/wallet/send');
        } else if (location.pathname.includes('/dex')) {
          // Focus on trading form
          document.querySelector<HTMLInputElement>('input[name="amount"]')?.focus();
        }
        onShortcutTriggered?.('New Action');
      },

      'ctrl+p': () => {
        // Navigate to portfolio view
        void navigate('/desktop/wallet/portfolio');
        onShortcutTriggered?.('View Portfolio');
      },
      'ctrl+s': () => {
        void navigate('/desktop/settings');
        onShortcutTriggered?.('Navigate to Settings');
      },

      'ctrl+t': () => {
        // Navigate to transaction history
        void navigate('/desktop/wallet/transactions');
        onShortcutTriggered?.('View Transactions');
      },
      'ctrl+w': () => {
        void navigate('/desktop/wallet');
        onShortcutTriggered?.('Navigate to Wallet');
      },
    },
    {
      allowInInputs: false,
      enabled: isEnabled,
      preventDefault: true,
    },
  );

  // Escape key to close modals/dropdowns
  useHotkey(
    'Escape',
    () => {
      // Close help modal if open
      if (helpModalOpen) {
        setHelpModalOpen(false);
        onShortcutTriggered?.('Close Help');
        return;
      }

      // Close any open modals (trigger click on modal overlay)
      const modalOverlay = document.querySelector('[data-modal-overlay]');
      if (modalOverlay) {
        (modalOverlay as HTMLElement).click();
        onShortcutTriggered?.('Close Modal');
        return;
      }

      // Close any open dropdowns
      const openDropdown = document.querySelector('[aria-expanded="true"]');
      if (openDropdown) {
        (openDropdown as HTMLElement).click();
        onShortcutTriggered?.('Close Dropdown');
      }
    },
    {
      allowInInputs: false,
      enabled: isEnabled,
      preventDefault: false, // Allow escape to work in inputs too
    },
  );

  // Show keyboard shortcuts help modal
  useEffect(() => {
    if (!helpModalOpen) return;

    // Log keyboard shortcuts (in production, show modal)
    logger.debug(`
🎹 Keyboard Shortcuts:

Navigation:
  Ctrl/Cmd + K  →  DEX
  Ctrl/Cmd + W  →  Wallet
  Ctrl/Cmd + S  →  Settings
  Ctrl/Cmd + ,  →  Settings

Actions:
  Ctrl/Cmd + N  →  New Transaction/Order
  Ctrl/Cmd + P  →  Portfolio
  Ctrl/Cmd + T  →  Transactions
  Ctrl/Cmd + L  →  Leasing
  Ctrl/Cmd + F  →  Search

Other:
  Ctrl/Cmd + /  →  Show/Hide Help
  Escape        →  Close Modal/Dropdown
    `);

    // Auto-close help after 10 seconds
    const timeout = setTimeout(() => setHelpModalOpen(false), 10000);
    return () => clearTimeout(timeout);
  }, [helpModalOpen]);

  return null; // This is a logic-only component
}

/**
 * Hook to get keyboard shortcuts status and metadata
 * Useful for displaying keyboard shortcuts in UI tooltips
 */
export function useKeyboardShortcutsInfo() {
  const { user } = useAuth();
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;

  const modifierKey = isMac ? '⌘' : 'Ctrl';
  const altKey = isMac ? '⌥' : 'Alt';
  const shiftKey = isMac ? '⇧' : 'Shift';

  return {
    altKey,
    isEnabled: !!user,
    modifierKey,
    shiftKey,
    shortcuts: {
      dex: `${modifierKey} + K`,
      escape: 'Esc',
      help: `${modifierKey} + /`,
      leasing: `${modifierKey} + L`,
      newAction: `${modifierKey} + N`,
      portfolio: `${modifierKey} + P`,
      search: `${modifierKey} + F`,
      settings: `${modifierKey} + S`,
      transactions: `${modifierKey} + T`,
      wallet: `${modifierKey} + W`,
    },
  };
}

/**
 * KeyboardShortcutBadge Component
 * Displays keyboard shortcut in a styled badge (for tooltips, buttons, etc.)
 *
 * @example
 * ```tsx
 * <Button>
 *   Open DEX
 *   <KeyboardShortcutBadge shortcut="⌘K" />
 * </Button>
 * ```
 */
interface KeyboardShortcutBadgeProps {
  shortcut: string;
  className?: string;
}

export function KeyboardShortcutBadge({ shortcut, className = '' }: KeyboardShortcutBadgeProps) {
  return (
    <kbd
      className={`keyboard-shortcut-badge ${className}`}
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.1)',
        border: '1px solid rgba(0, 0, 0, 0.2)',
        borderRadius: '4px',
        display: 'inline-block',
        fontFamily: 'monospace',
        fontSize: '0.75rem',
        marginLeft: '8px',
        padding: '2px 6px',
      }}
    >
      {shortcut}
    </kbd>
  );
}

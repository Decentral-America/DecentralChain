/**
 * LiveRegion Component
 * ARIA live region for screen reader announcements
 *
 * Features:
 * - Polite and assertive announcement modes
 * - Debounced announcements to prevent spam
 * - Automatic message clearing
 * - Visually hidden but screen reader accessible
 *
 * @example
 * ```tsx
 * function App() {
 *   const [message, setMessage] = useState('');
 *
 *   const handleSave = () => {
 *     saveTo API();
 *     setMessage('Changes saved successfully');
 *   };
 *
 *   return (
 *     <>
 *       <Button onClick={handleSave}>Save</Button>
 *       <LiveRegion message={message} />
 *     </>
 *   );
 * }
 * ```
 */

import React, { useEffect, useState, useRef } from 'react';
import styled from 'styled-components';

/**
 * Visually hidden but accessible to screen readers
 * Follows WCAG 2.1 guidelines for off-screen content
 */
const VisuallyHidden = styled.div`
  position: absolute;
  left: -10000px;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
`;

export interface LiveRegionProps {
  /**
   * Message to announce to screen readers
   */
  message: string;

  /**
   * Announcement priority
   * - 'polite': Wait for user to finish current action
   * - 'assertive': Interrupt immediately
   * @default 'polite'
   */
  politeness?: 'polite' | 'assertive';

  /**
   * Whether to announce the entire region or only changes
   * - true: Announce entire content when changed
   * - false: Announce only the changed part
   * @default true
   */
  atomic?: boolean;

  /**
   * Automatically clear message after duration (ms)
   * Set to 0 to disable auto-clear
   * @default 5000
   */
  clearAfter?: number;

  /**
   * Callback when message is cleared
   */
  onClear?: () => void;

  /**
   * Debounce announcements (ms) to prevent rapid-fire announcements
   * @default 100
   */
  debounceMs?: number;
}

/**
 * LiveRegion Component
 *
 * Creates an ARIA live region for dynamic content announcements
 * Messages are announced to screen readers but hidden visually
 *
 * **Politeness Levels:**
 * - `polite`: Non-urgent updates (default) - most common use case
 * - `assertive`: Urgent updates that interrupt user
 *
 * **Common Use Cases:**
 * - Form validation messages: `politeness="polite"`
 * - Success/error notifications: `politeness="polite"`
 * - Critical alerts: `politeness="assertive"`
 * - Loading state changes: `politeness="polite"`
 *
 * @example
 * ```tsx
 * // Basic usage
 * <LiveRegion message="Loading complete" />
 *
 * // Assertive for critical alerts
 * <LiveRegion
 *   message="Error: Payment failed"
 *   politeness="assertive"
 * />
 *
 * // With auto-clear callback
 * <LiveRegion
 *   message={status}
 *   clearAfter={3000}
 *   onClear={() => setStatus('')}
 * />
 * ```
 */
export const LiveRegion: React.FC<LiveRegionProps> = ({
  message,
  politeness = 'polite',
  atomic = true,
  clearAfter = 5000,
  onClear,
  debounceMs = 100,
}) => {
  const [debouncedMessage, setDebouncedMessage] = useState('');
  const timeoutRef = useRef<number | null>(null);

  // Debounce message updates
  useEffect(() => {
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = window.setTimeout(() => {
      setDebouncedMessage(message);
    }, debounceMs);

    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, [message, debounceMs]);

  // Auto-clear message
  useEffect(() => {
    if (!debouncedMessage || clearAfter === 0) return;

    const clearTimeout = window.setTimeout(() => {
      setDebouncedMessage('');
      onClear?.();
    }, clearAfter);

    return () => window.clearTimeout(clearTimeout);
  }, [debouncedMessage, clearAfter, onClear]);

  // Don't render if no message
  if (!debouncedMessage) {
    return null;
  }

  return (
    <VisuallyHidden
      role={politeness === 'assertive' ? 'alert' : 'status'}
      aria-live={politeness}
      aria-atomic={atomic}
    >
      {debouncedMessage}
    </VisuallyHidden>
  );
};

/**
 * useAnnounce Hook
 *
 * Convenient hook for making screen reader announcements
 * Manages live region state internally
 *
 * @example
 * ```tsx
 * function SaveButton() {
 *   const announce = useAnnounce();
 *
 *   const handleSave = async () => {
 *     try {
 *       await saveData();
 *       announce('Data saved successfully');
 *     } catch (error) {
 *       announce('Error: Could not save data', 'assertive');
 *     }
 *   };
 *
 *   return <Button onClick={handleSave}>Save</Button>;
 * }
 * ```
 */
export function useAnnounce() {
  const [announcement, setAnnouncement] = useState<{
    message: string;
    politeness: 'polite' | 'assertive';
  }>({ message: '', politeness: 'polite' });

  const announce = (message: string, politeness: 'polite' | 'assertive' = 'polite') => {
    setAnnouncement({ message, politeness });
  };

  const LiveRegionComponent = () => (
    <LiveRegion
      message={announcement.message}
      politeness={announcement.politeness}
      onClear={() => setAnnouncement({ message: '', politeness: 'polite' })}
    />
  );

  return { announce, LiveRegionComponent };
}

/**
 * AnnouncementProvider Component
 *
 * Global announcement provider for app-wide screen reader announcements
 * Use with useAnnouncement hook for centralized announcement management
 *
 * @example
 * ```tsx
 * // In App.tsx
 * function App() {
 *   return (
 *     <AnnouncementProvider>
 *       <YourApp />
 *     </AnnouncementProvider>
 *   );
 * }
 *
 * // In any component
 * function MyComponent() {
 *   const { announce } = useAnnouncement();
 *
 *   return (
 *     <Button onClick={() => announce('Action completed')}>
 *       Do Something
 *     </Button>
 *   );
 * }
 * ```
 */

interface AnnouncementContextValue {
  announce: (message: string, politeness?: 'polite' | 'assertive') => void;
}

const AnnouncementContext = React.createContext<AnnouncementContextValue | null>(null);

export const AnnouncementProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [announcements, setAnnouncements] = useState<
    Array<{
      id: string;
      message: string;
      politeness: 'polite' | 'assertive';
    }>
  >([]);

  const announce = (message: string, politeness: 'polite' | 'assertive' = 'polite') => {
    const id = `announcement-${Date.now()}-${Math.random()}`;
    setAnnouncements((prev) => [...prev, { id, message, politeness }]);
  };

  const handleClear = (id: string) => {
    setAnnouncements((prev) => prev.filter((a) => a.id !== id));
  };

  return (
    <AnnouncementContext.Provider value={{ announce }}>
      {children}
      {announcements.map((announcement) => (
        <LiveRegion
          key={announcement.id}
          message={announcement.message}
          politeness={announcement.politeness}
          onClear={() => handleClear(announcement.id)}
        />
      ))}
    </AnnouncementContext.Provider>
  );
};

/**
 * useAnnouncement Hook
 *
 * Access global announcement system from AnnouncementProvider
 * Throws error if used outside provider
 *
 * @example
 * ```tsx
 * function SaveButton() {
 *   const { announce } = useAnnouncement();
 *
 *   return (
 *     <Button onClick={() => announce('Saved')}>
 *       Save
 *     </Button>
 *   );
 * }
 * ```
 */
export function useAnnouncement() {
  const context = React.useContext(AnnouncementContext);

  if (!context) {
    throw new Error('useAnnouncement must be used within AnnouncementProvider');
  }

  return context;
}

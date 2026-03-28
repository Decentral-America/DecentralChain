import { useCallback, useEffect, useRef, useState } from 'react';
import { logger } from '@/lib/logger';

/**
 * Custom hook for copying text to clipboard with feedback
 *
 * This is a simpler alternative to useClipboard that returns a tuple [copied, copy]
 * instead of an object. Use this when you prefer tuple destructuring or need
 * a more concise API.
 *
 * @param resetTimeout - Time in milliseconds before resetting copied state (default: 2000)
 * @returns Tuple of [copied, copy function, error]
 *
 * @example
 * // Basic usage
 * const [copied, copy] = useCopyToClipboard();
 * return (
 *   <button onClick={() => copy('Hello World')}>
 *     {copied ? 'Copied!' : 'Copy'}
 *   </button>
 * );
 *
 * @example
 * // With error handling
 * const [copied, copy, error] = useCopyToClipboard(3000);
 * return (
 *   <div>
 *     <button onClick={() => copy(address)}>
 *       {copied ? '✓ Copied' : 'Copy Address'}
 *     </button>
 *     {error && <span>Failed to copy: {error.message}</span>}
 *   </div>
 * );
 */
export function useCopyToClipboard(
  resetTimeout: number = 2000,
): [boolean, (text: string) => Promise<void>, Error | null] {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const copy = useCallback(
    async (text: string): Promise<void> => {
      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Reset error state
      setError(null);

      // Check for Clipboard API support
      if (!navigator.clipboard) {
        const err = new Error('Clipboard API not supported in this browser');
        setError(err);
        logger.error(err);
        return;
      }

      try {
        // Copy to clipboard
        await navigator.clipboard.writeText(text);
        setCopied(true);

        // Reset copied state after timeout
        timeoutRef.current = setTimeout(() => {
          setCopied(false);
          timeoutRef.current = null;
        }, resetTimeout);
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to copy to clipboard');
        setError(error);
        setCopied(false);
        logger.error('Copy to clipboard failed:', error);
      }
    },
    [resetTimeout],
  );

  return [copied, copy, error];
}

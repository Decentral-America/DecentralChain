/**
 * useClipboard Hook
 * Provides copy-to-clipboard functionality with feedback
 */
import { useCallback, useState } from 'react';
import { logger } from '@/lib/logger';

interface UseClipboardReturn {
  isCopied: boolean;
  copyToClipboard: (text: string) => Promise<boolean>;
  reset: () => void;
}

/**
 * Custom hook for copying text to clipboard
 * @param timeout - Reset timeout in milliseconds (default: 2000)
 * @returns Object with isCopied state and copyToClipboard function
 */
export const useClipboard = (timeout: number = 2000): UseClipboardReturn => {
  const [isCopied, setIsCopied] = useState<boolean>(false);

  const copyToClipboard = useCallback(
    async (text: string): Promise<boolean> => {
      // Modern clipboard API
      if (navigator.clipboard) {
        try {
          await navigator.clipboard.writeText(text);
          setIsCopied(true);

          // Reset isCopied after timeout
          setTimeout(() => {
            setIsCopied(false);
          }, timeout);

          return true;
        } catch (error) {
          logger.warn('Failed to copy to clipboard:', error);
          setIsCopied(false);
          return false;
        }
      }

      // Fallback for older browsers
      try {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();

        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);

        if (successful) {
          setIsCopied(true);
          setTimeout(() => {
            setIsCopied(false);
          }, timeout);
          return true;
        } else {
          logger.warn('Fallback copy failed');
          return false;
        }
      } catch (error) {
        logger.warn('Fallback copy error:', error);
        return false;
      }
    },
    [timeout],
  );

  const reset = useCallback(() => {
    setIsCopied(false);
  }, []);

  return {
    copyToClipboard,
    isCopied,
    reset,
  };
};

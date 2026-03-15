/**
 * useAliases Hook
 * Manages alias operations for the current user
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  checkAliasExists,
  getAliasesByAddress,
  validateAliasFormat,
} from '@/api/services/aliasService';
import { useAuth } from '@/contexts/AuthContext';
import { logger } from '@/lib/logger';

export const useAliases = () => {
  const { user } = useAuth();
  const [aliases, setAliases] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConfirmingAlias, setIsConfirmingAlias] = useState(false);

  // Track polling for newly created alias
  const pollingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingTimeoutRef.current) {
        clearTimeout(pollingTimeoutRef.current);
      }
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  // Fetch aliases for the current user
  const fetchAliases = useCallback(async () => {
    if (!user?.address) {
      setAliases([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const userAliases = await getAliasesByAddress(user.address);
      setAliases(userAliases);
    } catch (err) {
      logger.error('Error fetching aliases:', err);
      setError('Failed to load aliases');
      setAliases([]);
    } finally {
      setIsLoading(false);
    }
  }, [user?.address]);

  // Load aliases when user changes
  useEffect(() => {
    fetchAliases();
  }, [fetchAliases]);

  // Validate and check if alias is available
  const checkAvailability = useCallback(
    async (alias: string): Promise<{ available: boolean; error?: string | undefined }> => {
      // First validate format
      const validation = validateAliasFormat(alias);
      if (!validation.valid) {
        return {
          available: false,
          error: validation.errors[0],
        };
      }

      // Then check if it exists
      try {
        const exists = await checkAliasExists(alias);
        if (exists) {
          return {
            available: false,
            error: 'This alias is already taken',
          };
        }
        return { available: true };
      } catch (err: unknown) {
        logger.error('Error checking alias availability:', err);
        return {
          available: false,
          error: 'Failed to check alias availability. Please try again.',
        };
      }
    },
    [],
  );

  // Add a new alias to the local list (after successful creation)
  const addAlias = useCallback((newAlias: string) => {
    setAliases((prev) => [...prev, newAlias]);
  }, []);

  /**
   * Wait for blockchain confirmation of new alias
   * Polls the API until alias appears or timeout
   * @param aliasName - The alias to wait for
   * @param maxWaitTime - Maximum time to wait in milliseconds (default: 30s)
   * @param pollInterval - Interval between polls in milliseconds (default: 2s)
   */
  const waitForAliasConfirmation = useCallback(
    async (
      aliasName: string,
      maxWaitTime: number = 30000,
      pollInterval: number = 2000,
    ): Promise<boolean> => {
      if (!user?.address) {
        logger.warn('No user address available for alias confirmation');
        return false;
      }

      logger.debug(`[useAliases] Starting confirmation polling for alias: ${aliasName}`);
      setIsConfirmingAlias(true);
      addAlias(aliasName);

      const cleanupPolling = () => {
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
        if (pollingTimeoutRef.current) {
          clearTimeout(pollingTimeoutRef.current);
          pollingTimeoutRef.current = null;
        }
      };

      return new Promise((resolve) => {
        const startTime = Date.now();

        const checkAlias = async () => {
          const elapsed = Date.now() - startTime;

          try {
            const updatedAliases = await getAliasesByAddress(user.address ?? '');

            if (updatedAliases.includes(aliasName)) {
              setAliases(updatedAliases);
              setIsConfirmingAlias(false);
              cleanupPolling();
              resolve(true);
              return;
            }

            if (elapsed >= maxWaitTime) {
              setIsConfirmingAlias(false);
              cleanupPolling();
              await fetchAliases();
              resolve(false);
            }
          } catch (err) {
            logger.error(`[useAliases] Error during confirmation polling:`, err);
          }
        };

        checkAlias();
        pollingIntervalRef.current = setInterval(checkAlias, pollInterval);

        pollingTimeoutRef.current = setTimeout(() => {
          cleanupPolling();
          setIsConfirmingAlias(false);
          resolve(false);
        }, maxWaitTime);
      });
    },
    [user?.address, addAlias, fetchAliases],
  );

  return {
    addAlias,
    aliases,
    checkAvailability,
    error,
    fetchAliases,
    isConfirmingAlias,
    isLoading,
    waitForAliasConfirmation,
  };
};

/**
 * useAliases Hook
 * Manages alias operations for the current user
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  getAliasesByAddress,
  checkAliasExists,
  validateAliasFormat,
} from '@/api/services/aliasService';

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
      console.error('Error fetching aliases:', err);
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
    async (alias: string): Promise<{ available: boolean; error?: string }> => {
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
      } catch (err: any) {
        console.error('Error checking alias availability:', err);
        return {
          available: false,
          error: 'Failed to check alias availability. Please try again.',
        };
      }
    },
    []
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
      pollInterval: number = 2000
    ): Promise<boolean> => {
      if (!user?.address) {
        console.warn('No user address available for alias confirmation');
        return false;
      }

      console.log(`[useAliases] Starting confirmation polling for alias: ${aliasName}`);
      setIsConfirmingAlias(true);

      // Add to local state immediately for optimistic UI
      addAlias(aliasName);

      return new Promise((resolve) => {
        const startTime = Date.now();
        let pollCount = 0;

        const checkAlias = async () => {
          pollCount++;
          const elapsed = Date.now() - startTime;

          console.log(
            `[useAliases] Poll #${pollCount} for ${aliasName} (elapsed: ${elapsed}ms)`
          );

          try {
            // Fetch updated alias list from blockchain
            const updatedAliases = await getAliasesByAddress(user.address!);

            // Check if new alias is in the list
            if (updatedAliases.includes(aliasName)) {
              console.log(`[useAliases] ✅ Alias ${aliasName} confirmed on blockchain!`);
              setAliases(updatedAliases);
              setIsConfirmingAlias(false);

              // Clear polling intervals
              if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current);
                pollingIntervalRef.current = null;
              }
              if (pollingTimeoutRef.current) {
                clearTimeout(pollingTimeoutRef.current);
                pollingTimeoutRef.current = null;
              }

              resolve(true);
              return;
            }

            // Check timeout
            if (elapsed >= maxWaitTime) {
              console.warn(
                `[useAliases] ⏱️ Timeout waiting for ${aliasName} (${elapsed}ms)`
              );
              setIsConfirmingAlias(false);

              // Clear polling
              if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current);
                pollingIntervalRef.current = null;
              }

              // Do one final fetch to make sure we have latest state
              await fetchAliases();
              resolve(false);
            }
          } catch (err) {
            console.error(`[useAliases] Error during confirmation polling:`, err);
            // Continue polling despite errors
          }
        };

        // Start polling immediately
        checkAlias();

        // Set up interval for subsequent polls
        pollingIntervalRef.current = setInterval(checkAlias, pollInterval);

        // Set up timeout to stop polling
        pollingTimeoutRef.current = setTimeout(() => {
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }
          setIsConfirmingAlias(false);
          console.warn(`[useAliases] Polling timeout reached for ${aliasName}`);
          resolve(false);
        }, maxWaitTime);
      });
    },
    [user?.address, addAlias, fetchAliases]
  );

  return {
    aliases,
    isLoading,
    error,
    isConfirmingAlias,
    fetchAliases,
    checkAvailability,
    addAlias,
    waitForAliasConfirmation,
  };
};

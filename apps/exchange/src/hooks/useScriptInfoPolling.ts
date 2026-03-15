/**
 * Script Info Polling Hook
 * Polls blockchain every 10 seconds to check if account has a script attached
 * Accounts with scripts require extra fees for transactions
 * Matches Angular: src/modules/app/services/User.js lines 415-427
 */

import * as ds from 'data-service';
import { useEffect, useState } from 'react';
import { logger } from '@/lib/logger';
import { type ScriptInfo } from '@/types/auth';

const POLL_INTERVAL = 10000; // 10 seconds
const INITIAL_DELAY = 30000; // 30 seconds initial delay

/**
 * Custom hook for polling script info from blockchain
 * @param address - User's blockchain address
 * @param isAuthenticated - Whether user is logged in
 * @returns Script info state
 */
export const useScriptInfoPolling = (
  address: string | undefined,
  isAuthenticated: boolean,
): ScriptInfo => {
  const [scriptInfo, setScriptInfo] = useState<ScriptInfo>({
    extraFee: null,
    hasScript: false,
    networkError: false,
  });

  useEffect(() => {
    if (!address || !isAuthenticated) {
      // Reset state when logged out
      setScriptInfo({
        extraFee: null,
        hasScript: false,
        networkError: false,
      });
      return;
    }

    let intervalId: NodeJS.Timeout | null = null;
    let initialTimeoutId: NodeJS.Timeout | null = null;

    const fetchScriptInfo = async () => {
      try {
        const nodeUrl = ds.config.get('node');
        const response = (await ds.fetch(`${nodeUrl}/addresses/scriptInfo/${address}`)) as {
          extraFee?: unknown;
          [key: string]: unknown;
        };

        if (response && response.extraFee !== undefined) {
          // Account has a script
          const extraFee = response.extraFee;
          setScriptInfo({
            extraFee: extraFee || null,
            hasScript: true,
            networkError: false,
          });
          logger.debug('[ScriptInfo] Account has script, extraFee:', extraFee);
        } else {
          // No script
          setScriptInfo({
            extraFee: null,
            hasScript: false,
            networkError: false,
          });
        }
      } catch (error) {
        logger.error('[ScriptInfo] Failed to fetch script info:', error);
        setScriptInfo((prev) => ({
          ...prev,
          networkError: true,
        }));
      }
    };

    // Delay first poll by 30 seconds (match Angular behavior)
    logger.debug('[ScriptInfo] Starting polling for address:', address);
    initialTimeoutId = setTimeout(() => {
      // First poll
      fetchScriptInfo();

      // Then poll every 10 seconds
      intervalId = setInterval(fetchScriptInfo, POLL_INTERVAL);
    }, INITIAL_DELAY);

    // Cleanup on unmount or when dependencies change
    return () => {
      if (initialTimeoutId) {
        clearTimeout(initialTimeoutId);
      }
      if (intervalId) {
        clearInterval(intervalId);
      }
      logger.debug('[ScriptInfo] Polling stopped');
    };
  }, [address, isAuthenticated]);

  return scriptInfo;
};

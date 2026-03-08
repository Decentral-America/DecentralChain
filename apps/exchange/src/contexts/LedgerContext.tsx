/**
 * LedgerContext
 * Provides global Ledger device state management across the application
 */

import React, { createContext, type ReactNode, useContext } from 'react';
import { useLedger } from '@/hooks/useLedger';

type LedgerContextValue = ReturnType<typeof useLedger>;

const LedgerContext = createContext<LedgerContextValue | undefined>(undefined);

interface LedgerProviderProps {
  children: ReactNode;
}

/**
 * Provider component for Ledger device management
 * Wrap your app with this to enable Ledger functionality
 */
export const LedgerProvider: React.FC<LedgerProviderProps> = ({ children }) => {
  const ledger = useLedger();

  return <LedgerContext.Provider value={ledger}>{children}</LedgerContext.Provider>;
};

/**
 * Hook to access Ledger context
 * Must be used within LedgerProvider
 * @throws Error if used outside of LedgerProvider
 */
export const useLedgerContext = (): LedgerContextValue => {
  const context = useContext(LedgerContext);
  if (!context) {
    throw new Error('useLedgerContext must be used within LedgerProvider');
  }
  return context;
};

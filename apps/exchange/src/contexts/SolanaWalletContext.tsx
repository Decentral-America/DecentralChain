/**
 * Solana wallet connection.
 *
 * Deliberately separate from `AuthContext`. A user has a DecentralChain
 * identity — seed, Ledger, Cubensis — and, independently, a connected Solana
 * wallet. A bridge deposit needs both: the Solana wallet signs the lock, and
 * the DCC address is where the wrapped asset is minted. Folding one into the
 * other would mean a user could not be signed in without a browser extension
 * they may not have, for a page that is one of many.
 *
 * Phantom and Solflare only, by choice. The adapter list is what the connect
 * UI offers; adding one is a line here.
 */
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom';
import { ConnectionProvider, useWallet, WalletProvider } from '@solana/wallet-adapter-react';
import { SolflareWalletAdapter } from '@solana/wallet-adapter-solflare';
import { type PublicKey } from '@solana/web3.js';
import { type ReactNode, useMemo } from 'react';
import { SOLANA_RPC_CLIENT_URL } from '@/config/bridge';
import { logger } from '@/lib/logger';

interface SolanaWalletProviderProps {
  children: ReactNode;
}

export const SolanaWalletProvider: React.FC<SolanaWalletProviderProps> = ({ children }) => {
  // Adapters hold connection state; recreating them on render drops it.
  const wallets = useMemo(() => [new PhantomWalletAdapter(), new SolflareWalletAdapter()], []);

  return (
    <ConnectionProvider endpoint={SOLANA_RPC_CLIENT_URL}>
      <WalletProvider
        wallets={wallets}
        autoConnect
        onError={(error) => logger.error('[solana-wallet]', error)}
      >
        {children}
      </WalletProvider>
    </ConnectionProvider>
  );
};

export interface SolanaWalletState {
  /** True while the extension prompt is open. */
  connecting: boolean;
  disconnect: () => Promise<void>;
  /** The connected wallet's name, for display. */
  name: string | null;
  publicKey: PublicKey | null;
  /** True only when a public key is actually available to sign with. */
  ready: boolean;
}

/**
 * The bridge's view of the Solana wallet.
 *
 * `ready` is deliberately stricter than the adapter's `connected`: a wallet can
 * report connected while `publicKey` is still null mid-handshake, and every
 * caller here needs the key, not the connection.
 */
export const useSolanaWallet = (): SolanaWalletState => {
  const { connecting, disconnect, publicKey, wallet } = useWallet();

  return {
    connecting,
    disconnect,
    name: wallet?.adapter.name ?? null,
    publicKey,
    ready: publicKey !== null,
  };
};

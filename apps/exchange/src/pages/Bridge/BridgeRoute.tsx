/**
 * The Bridge route's entry point.
 *
 * `SolanaWalletProvider` is mounted here rather than in `App.tsx` so the
 * Solana libraries — web3.js, Anchor, two wallet adapters — land in this
 * route's lazy chunk instead of the initial bundle. Every other page pays
 * nothing for them.
 */
import { SolanaWalletProvider } from '@/contexts/SolanaWalletContext';
import { Bridge as BridgePage } from './Bridge';

export const Bridge: React.FC = () => (
  <SolanaWalletProvider>
    <BridgePage />
  </SolanaWalletProvider>
);

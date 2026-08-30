/**
 * The Solana side of the bridge.
 *
 * Solana and the BTC gateway are different systems that share this page. The
 * gateway reads its assets from network config; Solana reads them from the
 * bridge API, which is the only source that knows what is currently safe to
 * offer. Keeping this in its own component means neither path has to know
 * about the other.
 */
import { Alert, Divider, Stack, Typography } from '@mui/material';
import { useState } from 'react';
import { useSolanaWallet } from '@/contexts/SolanaWalletContext';
import { usePendingTransfers } from '@/hooks/usePendingTransfers';
import { rawToHuman } from '@/services/bridge/decimals';
import { type BridgeToken } from '@/services/bridge/types';
import { DepositLimitsPanel } from './DepositLimitsPanel';
import { SolanaAssetList } from './SolanaAssetList';
import { SolanaDepositForm } from './SolanaDepositForm';
import { SolanaWalletButton } from './SolanaWalletButton';
import { SolanaWithdrawForm } from './SolanaWithdrawForm';
import { TransferProgress } from './TransferProgress';
import { WithdrawalReceipt } from './WithdrawalReceipt';

interface SolanaBridgePanelProps {
  /** Wrapped-asset balances by DecentralChain assetId, in raw units. */
  assetBalancesRaw: Record<string, bigint>;
  /** The signed-in DecentralChain address — the deposit's mint destination. */
  dccAddress: string;
  /** DCC balance in wavelets, for the withdrawal fee pre-flight. */
  dccBalanceRaw: bigint;
  mode: 'deposit' | 'withdraw';
}

export const SolanaBridgePanel: React.FC<SolanaBridgePanelProps> = ({
  assetBalancesRaw,
  dccAddress,
  dccBalanceRaw,
  mode,
}) => {
  const [token, setToken] = useState<BridgeToken | null>(null);
  const { name: walletName, ready } = useSolanaWallet();
  const { add, remove, transfers } = usePendingTransfers();

  const balanceRaw = token ? (assetBalancesRaw[token.assetId] ?? 0n) : 0n;

  return (
    <Stack spacing={3}>
      {transfers.length > 0 && (
        <Stack spacing={2}>
          <Typography variant="subtitle2">In flight</Typography>
          {/*
            Only a deposit's id is a bridge transfer id. A withdrawal's is a
            DecentralChain burn txid, which /transfer/:id does not recognise —
            polling it reports "not reached the bridge" forever, including for
            withdrawals that completed.
          */}
          {transfers.map((transfer) =>
            transfer.direction === 'deposit' ? (
              <TransferProgress
                key={transfer.id}
                transferId={transfer.id}
                onDismiss={() => remove(transfer.id)}
              />
            ) : (
              <WithdrawalReceipt
                key={transfer.id}
                amount={transfer.amount}
                onDismiss={() => remove(transfer.id)}
                tokenName={transfer.tokenName}
                txId={transfer.id}
              />
            ),
          )}
          <Divider />
        </Stack>
      )}

      {mode === 'deposit' && (
        <Stack direction="row" sx={{ justifyContent: 'flex-end' }}>
          <SolanaWalletButton />
        </Stack>
      )}

      <SolanaAssetList onSelect={setToken} selectedMint={token?.splMint ?? null} />

      {token && mode === 'deposit' && (
        <Stack spacing={2}>
          <DepositLimitsPanel splMint={token.splMint} tokenName={token.name} />
          {ready ? (
            <SolanaDepositForm
              dccRecipient={dccAddress}
              onSubmitted={(transferId, amount) =>
                add({
                  amount,
                  direction: 'deposit',
                  id: transferId,
                  startedAt: Date.now(),
                  tokenName: token.name,
                })
              }
              token={token}
            />
          ) : (
            <Alert severity="info">
              Connect a Solana wallet to deposit {token.name}
              {walletName ? ` with ${walletName}` : ''}.
            </Alert>
          )}
        </Stack>
      )}

      {token && mode === 'withdraw' && (
        <Stack spacing={2}>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Burns wrapped {token.name} on DecentralChain and releases the original on Solana. Your
            balance: {rawToHuman(balanceRaw, token.dccDecimals)} {token.name}.
          </Typography>
          <SolanaWithdrawForm
            balanceRaw={balanceRaw}
            dccBalanceRaw={dccBalanceRaw}
            onSubmitted={(txId, amount) =>
              add({
                amount,
                direction: 'withdraw',
                id: txId,
                startedAt: Date.now(),
                tokenName: token.name,
              })
            }
            token={token}
          />
        </Stack>
      )}
    </Stack>
  );
};

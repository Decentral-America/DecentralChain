/**
 * The Solana side of the bridge.
 *
 * One asset at a time, one direction at a time: lock on Solana to mint the
 * wrapped form, or burn the wrapped form to release the original. Everything
 * below the form — the token list, the manual route, the vault figures — is
 * there because a bridge is a thing people check before they trust it.
 */
import { Alert, Button, Paper, Skeleton, Stack, Typography } from '@mui/material';
import { useState } from 'react';
import { useSolanaWallet } from '@/contexts/SolanaWalletContext';
import { useBridgeTokens } from '@/hooks/useBridgeTokens';
import { usePendingTransfers } from '@/hooks/usePendingTransfers';
import { describeBridgeError } from '@/services/bridge/api';
import { rawToHuman } from '@/services/bridge/decimals';
import { type BridgeToken } from '@/services/bridge/types';
import { type BridgeDirection, BridgeDirectionToggle } from './BridgeDirectionToggle';
import { BridgeStatusBar } from './BridgeStatusBar';
import { DepositLimitsPanel } from './DepositLimitsPanel';
import { ManualDepositCard } from './ManualDepositCard';
import { SolanaDepositForm } from './SolanaDepositForm';
import { SolanaWalletButton } from './SolanaWalletButton';
import { SolanaWithdrawForm } from './SolanaWithdrawForm';
import { SupportedTokensCard } from './SupportedTokensCard';
import { TransferProgress } from './TransferProgress';
import { WithdrawalReceipt } from './WithdrawalReceipt';

interface SolanaBridgePanelProps {
  assetBalancesRaw: Record<string, bigint>;
  dccAddress: string;
  dccBalanceRaw: bigint;
}

export const SolanaBridgePanel: React.FC<SolanaBridgePanelProps> = ({
  assetBalancesRaw,
  dccAddress,
  dccBalanceRaw,
}) => {
  const { data: tokens, error: tokensError, isPending: tokensPending, refetch } = useBridgeTokens();
  const [token, setToken] = useState<BridgeToken | null>(null);
  const [direction, setDirection] = useState<BridgeDirection>('deposit');
  const [amount, setAmount] = useState('');
  const { name: walletName, ready } = useSolanaWallet();
  const { add, remove, transfers } = usePendingTransfers();

  // Default to SOL, which is the pair everything else is priced against here.
  const active = token ?? tokens?.find((t) => t.name === 'SOL') ?? tokens?.[0] ?? null;
  const balanceRaw = active ? (assetBalancesRaw[active.assetId] ?? 0n) : 0n;

  return (
    <Stack spacing={2} sx={{ maxWidth: 640, mx: 'auto' }}>
      {transfers.length > 0 && (
        <Stack spacing={2}>
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
        </Stack>
      )}

      <BridgeDirectionToggle
        onChange={setDirection}
        tokenName={active?.name ?? 'SOL'}
        value={direction}
      />

      {/*
        Every card below this point is gated on `active`, which is derived from
        `GET /tokens`. Without an explicit state for the three ways that query
        can leave `active` null, a failed token fetch renders the page as a
        direction toggle floating over nothing — no form, no token list, no
        limits, no error. Whatever went wrong, say which one it was.
      */}
      {!active &&
        (tokensPending ? (
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Skeleton variant="text" width={180} />
            <Skeleton variant="rounded" height={120} sx={{ mt: 1.5 }} />
          </Paper>
        ) : (
          <Alert
            severity={tokensError ? 'error' : 'warning'}
            action={
              <Button color="inherit" onClick={() => void refetch()} size="small">
                Retry
              </Button>
            }
          >
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {tokensError
                ? 'Could not load the list of bridgeable assets.'
                : 'The bridge is not offering any asset right now.'}
            </Typography>
            <Typography variant="body2">
              {tokensError
                ? `${describeBridgeError(tokensError)} Nothing can be deposited or redeemed until this list loads.`
                : 'Every registered asset is currently disabled on chain. Nothing can be deposited or redeemed until one is re-enabled.'}
            </Typography>
          </Alert>
        ))}

      {active && (
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            {direction === 'deposit' ? `Deposit ${active.name}` : `Redeem ${active.name}.DCC`}
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
            {direction === 'deposit'
              ? 'Lock on Solana to mint the wrapped asset on DecentralChain.'
              : `Burn ${active.name}.DCC on DecentralChain to unlock ${active.name} on Solana.`}
          </Typography>

          {direction === 'deposit' && (
            <Stack spacing={3}>
              <Stack direction="row" sx={{ justifyContent: 'flex-end' }}>
                <SolanaWalletButton />
              </Stack>

              {ready ? (
                <SolanaDepositForm
                  dccRecipient={dccAddress}
                  onSubmitted={(transferId, submitted) =>
                    add({
                      amount: submitted,
                      direction: 'deposit',
                      id: transferId,
                      startedAt: Date.now(),
                      tokenName: active.name,
                    })
                  }
                  token={active}
                />
              ) : (
                <Alert severity="info">
                  Connect a Solana wallet to deposit {active.name} directly
                  {walletName ? ` with ${walletName}` : ''} — or use the manual route below, which
                  needs no wallet here at all.
                </Alert>
              )}
            </Stack>
          )}

          {direction === 'redeem' && (
            <Stack spacing={2}>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Your balance: {rawToHuman(balanceRaw, active.dccDecimals)} {active.name}.DCC
              </Typography>
              <SolanaWithdrawForm
                balanceRaw={balanceRaw}
                dccBalanceRaw={dccBalanceRaw}
                onSubmitted={(txId, submitted) =>
                  add({
                    amount: submitted,
                    direction: 'withdraw',
                    id: txId,
                    startedAt: Date.now(),
                    tokenName: active.name,
                  })
                }
                token={active}
              />
            </Stack>
          )}
        </Paper>
      )}

      {active && direction === 'deposit' && (
        <ManualDepositCard
          amount={amount}
          decimals={active.solDecimals}
          hasRecipient={Boolean(dccAddress)}
          tokenName={active.name}
        />
      )}

      <SupportedTokensCard
        onSelect={(selected) => {
          setToken(selected);
          setAmount('');
        }}
        selectedMint={active?.splMint ?? null}
      />

      {active && direction === 'deposit' && (
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
            Limits for {active.name}
          </Typography>
          <DepositLimitsPanel splMint={active.splMint} tokenName={active.name} />
        </Paper>
      )}

      <BridgeStatusBar />
    </Stack>
  );
};

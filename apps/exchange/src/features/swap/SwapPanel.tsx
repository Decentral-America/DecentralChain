/**
 * Swap, against the live AMM.
 *
 * Quotes come from the contract's own reserves through the SDK — the same
 * maths the Router runs — so what is shown is what the chain will compute,
 * minus whatever the reserves move between quoting and mining. That gap is
 * what the slippage bound exists for.
 */

import { fromRawAmount, toRawAmount } from '@dcc-amm/sdk';
import { SwapVert } from '@mui/icons-material';
import {
  Alert,
  Box,
  CircularProgress,
  IconButton,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useMemo, useState } from 'react';
import { TokenIcon } from '@/components/common/TokenIcon';
import { AMM_DEFAULT_FEE_BPS, DCC_ASSET } from '@/config/amm';
import { useAuth } from '@/contexts/AuthContext';
import {
  useAmmAssetMeta,
  useAmmBalance,
  useAmmPaused,
  useAmmPools,
  useSwapQuote,
} from '@/hooks/useAmm';
import { useAmmTransaction } from '@/hooks/useAmmTransaction';
import { AmountWell, PanelTitle, PrimaryAction, SurfaceCard } from './ui';
import { findPool, useSwapAssets } from './useSwapPairs';

/** The asset picker used by both wells. Identical shape, different list. */
const AssetSelect: React.FC<{
  assets: { assetId: string; decimals: number; name: string }[];
  onChange: (assetId: string) => void;
  placeholder?: string;
  value: string;
}> = ({ assets, onChange, placeholder = '—', value }) => (
  <Select
    value={value}
    onChange={(e) => onChange(e.target.value)}
    size="small"
    sx={{ borderRadius: 999, minWidth: 132 }}
    renderValue={(id) => {
      const asset = assets.find((a) => a.assetId === id);
      return (
        <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center' }}>
          <TokenIcon name={asset?.name ?? '?'} seed={id} size={20} />
          <Box component="span" sx={{ fontWeight: 600 }}>
            {asset?.name ?? placeholder}
          </Box>
        </Stack>
      );
    }}
  >
    {assets.map((asset) => (
      <MenuItem key={asset.assetId} value={asset.assetId}>
        {asset.name}
      </MenuItem>
    ))}
  </Select>
);

const DetailRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <Stack direction="row" sx={{ justifyContent: 'space-between', py: 0.5 }}>
    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
      {label}
    </Typography>
    <Typography variant="body2">{value}</Typography>
  </Stack>
);

/**
 * What the quote actually costs.
 *
 * The rate is derived: the SDK returns two amounts, and the ratio between them
 * is the number a trader checks first.
 */
const QuoteBreakdown: React.FC<{
  from: { decimals: number; name: string };
  quote: {
    amountIn: bigint;
    amountOut: bigint;
    feeAmount: bigint;
    feeBps: number;
    minAmountOut: bigint;
    priceImpactBps: bigint;
  };
  to: { decimals: number; name: string };
}> = ({ from, quote, to }) => {
  const rate =
    Number(fromRawAmount(quote.amountOut, to.decimals)) /
    Number(fromRawAmount(quote.amountIn, from.decimals));

  return (
    <Paper variant="outlined" sx={{ borderRadius: 2, p: 2 }}>
      <DetailRow label="Rate" value={`1 ${from.name} \u2248 ${rate.toFixed(6)} ${to.name}`} />
      <DetailRow
        label="Minimum received"
        value={`${fromRawAmount(quote.minAmountOut, to.decimals)} ${to.name}`}
      />
      <DetailRow
        label="Price impact"
        value={`${(Number(quote.priceImpactBps) / 100).toFixed(2)}%`}
      />
      <DetailRow
        label="Pool fee"
        value={`${fromRawAmount(quote.feeAmount, from.decimals)} ${from.name} (${quote.feeBps / 100}%)`}
      />
    </Paper>
  );
};

/** What the action says, given where the flow currently is. */
const actionLabel = (state: {
  isConfirming: boolean;
  isSubmitting: boolean;
  signedIn: boolean;
}): string => {
  if (!state.signedIn) return 'Sign in to swap';
  if (state.isConfirming) return 'Confirming on chain\u2026';
  if (state.isSubmitting) return 'Signing\u2026';
  return 'Swap';
};

/**
 * Every condition that must hold before a swap is worth submitting.
 *
 * Gathered in one place because each is a separate reason to refuse, and a
 * chain of them inline is where a missing check hides.
 */
const canSubmit = (state: {
  busy: boolean;
  hasPool: boolean;
  hasQuote: boolean;
  overBalance: boolean;
  parsedAmount: bigint | null;
  paused: boolean;
  signedIn: boolean;
}): boolean =>
  state.signedIn &&
  state.hasPool &&
  !state.paused &&
  state.parsedAmount !== null &&
  state.parsedAmount > 0n &&
  !state.overBalance &&
  state.hasQuote &&
  !state.busy;

export const SwapPanel: React.FC = () => {
  const { user } = useAuth();
  const { data: pools, isLoading: poolsLoading } = useAmmPools();
  const { data: paused } = useAmmPaused();
  const { metaById } = useAmmAssetMeta(pools);
  const assets = useSwapAssets(pools, metaById);

  const [fromId, setFromId] = useState(DCC_ASSET);
  const [toId, setToId] = useState('');
  const [amount, setAmount] = useState('');

  const from = assets.find((a) => a.assetId === fromId);
  const to = assets.find(
    (a) => a.assetId === (toId || assets.find((a2) => a2.assetId !== fromId)?.assetId),
  );
  const resolvedToId = to?.assetId ?? '';

  const pool = findPool(pools, fromId, resolvedToId, AMM_DEFAULT_FEE_BPS);

  const { data: balanceRaw } = useAmmBalance(user?.address, fromId === DCC_ASSET ? null : fromId);

  const {
    data: quote,
    error: quoteError,
    isFetching: quoting,
  } = useSwapQuote({
    amount,
    assetIn: fromId,
    assetOut: resolvedToId,
    decimalsIn: from?.decimals ?? 8,
  });

  const { error: txError, isConfirming, isSubmitting, swap } = useAmmTransaction();
  const [result, setResult] = useState<string | null>(null);

  const balance =
    balanceRaw !== undefined && from ? fromRawAmount(balanceRaw, from.decimals) : null;

  const parsedAmount = useMemo(() => {
    if (!from || !amount.trim()) return null;
    try {
      return toRawAmount(amount.trim(), from.decimals);
    } catch {
      return null;
    }
  }, [amount, from]);

  const overBalance =
    parsedAmount !== null && balanceRaw !== undefined && parsedAmount > balanceRaw;

  const canSwap = canSubmit({
    busy: isSubmitting || isConfirming,
    hasPool: Boolean(pool),
    hasQuote: Boolean(quote),
    overBalance,
    parsedAmount,
    paused: Boolean(paused),
    signedIn: Boolean(user),
  });

  const handleSwap = async () => {
    if (parsedAmount === null || !to) return;
    setResult(null);

    const outcome = await swap({
      amountIn: parsedAmount,
      assetIn: fromId,
      assetOut: to.assetId,
    });

    if (outcome.applied) {
      setResult(`Swapped. Transaction ${outcome.txId.slice(0, 12)}…`);
      setAmount('');
    }
  };

  const flip = () => {
    setFromId(resolvedToId);
    setToId(fromId);
    setAmount('');
  };

  if (poolsLoading) {
    return (
      <Stack sx={{ alignItems: 'center', py: 6 }}>
        <CircularProgress size={28} />
      </Stack>
    );
  }

  return (
    <SurfaceCard>
      <PanelTitle>Swap</PanelTitle>
      <Stack spacing={2}>
        {paused && (
          <Alert severity="warning">
            The AMM is paused. Every callable refuses while it is, so a swap would be mined, charged
            a fee, and change nothing.
          </Alert>
        )}

        <AmountWell
          label="You pay"
          value={
            <TextField
              fullWidth
              variant="standard"
              placeholder="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              error={overBalance}
              slotProps={{ input: { disableUnderline: true } }}
              sx={{
                '& .MuiInputBase-input': {
                  fontSize: '1.75rem',
                  fontWeight: 600,
                  letterSpacing: '-0.02em',
                  p: 0,
                },
              }}
            />
          }
          right={<AssetSelect assets={assets} onChange={setFromId} value={fromId} />}
          secondary={
            <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
              <Typography
                sx={{ color: overBalance ? 'error.main' : 'text.secondary', fontSize: '0.75rem' }}
              >
                {overBalance ? 'More than you hold' : '\u00a0'}
              </Typography>
              <Typography
                onClick={() => balance && setAmount(balance)}
                sx={{
                  color: 'text.secondary',
                  cursor: balance ? 'pointer' : 'default',
                  fontSize: '0.75rem',
                }}
              >
                Balance: {balance ?? '—'}
              </Typography>
            </Stack>
          }
        />

        {/*
        The direction control sits on the seam, overlapping both wells, so the
        two panels read as one exchange rather than two separate inputs.
      */}
        <Stack
          direction="row"
          sx={{ justifyContent: 'center', my: -1.25, position: 'relative', zIndex: 1 }}
        >
          <IconButton
            onClick={flip}
            aria-label="Reverse direction"
            sx={{
              '@media (prefers-reduced-motion: reduce)': {
                '&:active': { transform: 'none' },
                transition: 'none',
              },
              '&:active': { transform: 'scale(0.94)' },
              '&:hover': { bgcolor: 'background.paper' },
              bgcolor: 'background.paper',
              border: 1,
              borderColor: 'divider',
              borderRadius: 2,
              transition: 'transform 120ms ease-out',
            }}
          >
            <SwapVert sx={{ fontSize: 20 }} />
          </IconButton>
        </Stack>

        <AmountWell
          label="You receive"
          value={
            <Typography
              sx={{
                color: quote ? 'text.primary' : 'text.disabled',
                fontSize: '1.75rem',
                fontWeight: 600,
                letterSpacing: '-0.02em',
              }}
            >
              {quote && to ? fromRawAmount(quote.amountOut, to.decimals) : '0'}
            </Typography>
          }
          right={
            <AssetSelect
              assets={assets.filter((asset) => asset.assetId !== fromId)}
              onChange={setToId}
              placeholder="Select"
              value={resolvedToId}
            />
          }
        />

        {!pool && resolvedToId && (
          <Alert severity="info">
            No pool exists for this pair at {AMM_DEFAULT_FEE_BPS / 100}%. Pick another pair, or
            create the pool from the Pools tab.
          </Alert>
        )}

        {quote && to && from && <QuoteBreakdown from={from} quote={quote} to={to} />}

        {quoteError && <Alert severity="error">{(quoteError as Error).message}</Alert>}
        {txError && <Alert severity="error">{txError}</Alert>}
        {result && <Alert severity="success">{result}</Alert>}

        <PrimaryAction
          disabled={!canSwap}
          onClick={handleSwap}
          startIcon={
            quoting || isSubmitting || isConfirming ? <CircularProgress size={16} /> : null
          }
        >
          {actionLabel({ isConfirming, isSubmitting, signedIn: Boolean(user) })}
        </PrimaryAction>
      </Stack>
    </SurfaceCard>
  );
};

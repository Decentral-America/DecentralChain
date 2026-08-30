/**
 * Liquidity — create a pool, add to one, or withdraw from one.
 *
 * Three modes over the same shape, because they are three answers to one
 * question: what do you want this pair to do. Splitting them across separate
 * screens would hide from a user adding liquidity that removing it is one
 * click away.
 *
 * Adding must match the pool's current ratio, so the second amount is derived
 * from the first rather than typed. A mismatched pair either reverts or
 * silently returns the excess, and neither is worth discovering afterwards.
 */
import { fromRawAmount, toRawAmount } from '@dcc-amm/sdk';
import { Add as AddIcon } from '@mui/icons-material';
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
import { DCC_ASSET } from '@/config/amm';
import { useAuth } from '@/contexts/AuthContext';
import { useAmmAssetMeta, useAmmPaused, useAmmPools, useLpPosition } from '@/hooks/useAmm';
import { useAmmTransaction } from '@/hooks/useAmmTransaction';
import { AmountWell, ChoiceRow, PanelTitle, PrimaryAction, SurfaceCard } from './ui';
import { useSwapAssets } from './useSwapPairs';

type Mode = 'add' | 'create' | 'remove';

const SLIPPAGE_OPTIONS = [
  { label: '0.1%', value: 10 },
  { label: '0.5%', value: 50 },
  { label: '1.0%', value: 100 },
];

/** Tiers a new pool may be created at. Multiple pools can exist per pair. */
const FEE_TIER_OPTIONS = [
  { label: '0.1%', value: 10 },
  { label: '0.35%', value: 35 },
  { label: '1.0%', value: 100 },
];

/** The Create / Add / Remove switch. */
const ModeSwitch: React.FC<{ onChange: (mode: Mode) => void; value: Mode }> = ({
  onChange,
  value,
}) => (
  <Box
    sx={{
      bgcolor: 'action.hover',
      borderRadius: 2,
      display: 'grid',
      gap: 0.5,
      gridTemplateColumns: 'repeat(3, 1fr)',
      p: 0.5,
    }}
  >
    {(['create', 'add', 'remove'] as const).map((mode) => {
      const active = mode === value;
      return (
        <Box
          key={mode}
          role="tab"
          tabIndex={0}
          aria-selected={active}
          onClick={() => onChange(mode)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') onChange(mode);
          }}
          sx={{
            '@media (prefers-reduced-motion: reduce)': { transition: 'none' },
            bgcolor: active ? 'background.paper' : 'transparent',
            borderRadius: 1.5,
            boxShadow: active ? 1 : 0,
            color: active ? 'text.primary' : 'text.secondary',
            cursor: 'pointer',
            fontSize: '0.9375rem',
            fontWeight: active ? 600 : 400,
            py: 1,
            textAlign: 'center',
            textTransform: 'capitalize',
            transition: 'background-color 120ms, color 120ms',
            userSelect: 'none',
          }}
        >
          {mode}
        </Box>
      );
    })}
  </Box>
);

const AssetSelect: React.FC<{
  assets: { assetId: string; decimals: number; name: string }[];
  onChange: (assetId: string) => void;
  placeholder?: string;
  value: string;
}> = ({ assets, onChange, placeholder = 'Select token', value }) => (
  <Select
    value={value}
    onChange={(e) => onChange(e.target.value)}
    size="small"
    displayEmpty
    sx={{ borderRadius: 999, minWidth: 148 }}
    renderValue={(id) => {
      const asset = assets.find((a) => a.assetId === id);
      return (
        <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center' }}>
          {asset && <TokenIcon name={asset.name} seed={asset.assetId} size={20} />}
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

/** What the action says, given the mode and where the flow is. */
const actionLabel = (state: { busy: boolean; mode: Mode; signedIn: boolean }): string => {
  if (!state.signedIn) return 'Sign in to continue';
  if (state.busy) return 'Working\u2026';
  if (state.mode === 'create') return 'Create pool';
  if (state.mode === 'add') return 'Add liquidity';
  return 'Remove liquidity';
};

export const LiquidityPanel: React.FC = () => {
  const { user } = useAuth();
  const { data: pools, isLoading } = useAmmPools();
  const { data: paused } = useAmmPaused();
  const { metaById } = useAmmAssetMeta(pools);
  const assets = useSwapAssets(pools, metaById);

  const [mode, setMode] = useState<Mode>('add');
  const [slippageBps, setSlippageBps] = useState(50);
  const [feeBps, setFeeBps] = useState(35);
  const [assetA, setAssetA] = useState(DCC_ASSET);
  const [assetB, setAssetB] = useState('');
  const [amountA, setAmountA] = useState('');
  const [lpAmount, setLpAmount] = useState('');
  const [result, setResult] = useState<string | null>(null);

  const { addLiquidity, createPool, error, isConfirming, isSubmitting, removeLiquidity } =
    useAmmTransaction();

  const metaA = assets.find((a) => a.assetId === assetA);
  const metaB = assets.find((a) => a.assetId === assetB);

  /** The pool for the chosen pair and tier, if one exists. */
  const pool = useMemo(
    () =>
      pools?.find(
        (p) =>
          Number(p.feeBps) === feeBps &&
          ((p.token0 === assetA && p.token1 === assetB) ||
            (p.token0 === assetB && p.token1 === assetA)),
      ),
    [pools, assetA, assetB, feeBps],
  );

  const { data: lpBalance } = useLpPosition(pool, user?.address);

  /**
   * The matching second amount, at the pool's live ratio.
   *
   * Derived from reserves, never carried across from the first figure: an
   * amount denominated in one asset is not the other asset's raw amount, and
   * treating it as one is how a deposit ends up the wrong size entirely.
   */
  const pairedAmount = useMemo(() => {
    if (!pool || !metaA || !amountA.trim() || pool.reserve0 === 0n) return null;

    try {
      const rawA = toRawAmount(amountA.trim(), metaA.decimals);
      const aIsToken0 = pool.token0 === assetA;
      return aIsToken0
        ? (rawA * pool.reserve1) / pool.reserve0
        : (rawA * pool.reserve0) / pool.reserve1;
    } catch {
      return null;
    }
  }, [amountA, assetA, metaA, pool]);

  const busy = isSubmitting || isConfirming;

  if (isLoading) {
    return (
      <Stack sx={{ alignItems: 'center', py: 8 }}>
        <CircularProgress size={28} />
      </Stack>
    );
  }

  const run = async (action: () => Promise<{ applied: boolean; txId: string }>, done: string) => {
    setResult(null);
    const outcome = await action();
    if (outcome.applied) {
      setResult(`${done} Transaction ${outcome.txId.slice(0, 12)}…`);
      setAmountA('');
      setLpAmount('');
    }
  };

  const submit = () => {
    if (mode === 'create') {
      void run(() => createPool({ assetA, assetB, feeBps }), 'Pool created.');
      return;
    }

    if (mode === 'add') {
      if (pairedAmount === null || !metaA) return;
      void run(
        () =>
          addLiquidity({
            amountA: toRawAmount(amountA.trim(), metaA.decimals),
            amountB: pairedAmount,
            assetA,
            assetB,
            feeBps,
          }),
        'Liquidity added.',
      );
      return;
    }

    void run(
      () => removeLiquidity({ assetA, assetB, feeBps, lpAmount: toRawAmount(lpAmount.trim(), 8) }),
      'Liquidity removed.',
    );
  };

  const canAct =
    Boolean(user) &&
    !paused &&
    !busy &&
    Boolean(assetB) &&
    (mode === 'remove' ? Boolean(lpAmount.trim()) : Boolean(amountA.trim()));

  return (
    <SurfaceCard>
      <PanelTitle>Liquidity</PanelTitle>

      <Stack spacing={2}>
        <ModeSwitch value={mode} onChange={setMode} />

        <Paper variant="outlined" sx={{ borderRadius: 2, px: 2, py: 1 }}>
          <ChoiceRow
            label="Slippage"
            options={SLIPPAGE_OPTIONS}
            value={slippageBps}
            onChange={setSlippageBps}
          />
          {/*
            On Create the tier is a decision. On Add and Remove it selects which
            pool you mean — a pair can have one per tier — so it stays a control
            rather than becoming a read-only label.
          */}
          <ChoiceRow
            label="Fee tier"
            options={FEE_TIER_OPTIONS}
            value={feeBps}
            onChange={setFeeBps}
          />
        </Paper>

        {mode !== 'remove' && (
          <>
            <AmountWell
              label="Token A"
              value={
                <TextField
                  fullWidth
                  variant="standard"
                  placeholder="0"
                  value={amountA}
                  onChange={(e) => setAmountA(e.target.value)}
                  disabled={busy}
                  slotProps={{ input: { disableUnderline: true } }}
                  sx={{
                    '& .MuiInputBase-input': {
                      fontSize: '1.5rem',
                      fontWeight: 600,
                      letterSpacing: '-0.02em',
                      p: 0,
                    },
                  }}
                />
              }
              right={<AssetSelect assets={assets} onChange={setAssetA} value={assetA} />}
            />

            <Stack
              direction="row"
              sx={{ justifyContent: 'center', my: -1.25, position: 'relative', zIndex: 1 }}
            >
              <IconButton
                disabled
                aria-hidden
                sx={{
                  bgcolor: 'background.paper',
                  border: 1,
                  borderColor: 'divider',
                  borderRadius: 2,
                }}
              >
                <AddIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Stack>

            <AmountWell
              label="Token B"
              value={
                <Typography
                  sx={{
                    color: pairedAmount === null ? 'text.disabled' : 'text.primary',
                    fontSize: '1.5rem',
                    fontWeight: 600,
                    letterSpacing: '-0.02em',
                  }}
                >
                  {pairedAmount !== null && metaB
                    ? fromRawAmount(pairedAmount, metaB.decimals)
                    : '0'}
                </Typography>
              }
              right={
                <AssetSelect
                  assets={assets.filter((a) => a.assetId !== assetA)}
                  onChange={setAssetB}
                  value={assetB}
                />
              }
              secondary={
                mode === 'add' && pool ? (
                  <Typography sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>
                    Matched to the pool's current ratio — deposits must meet it.
                  </Typography>
                ) : undefined
              }
            />
          </>
        )}

        {mode === 'remove' && (
          <AmountWell
            label="LP amount to burn"
            value={
              <TextField
                fullWidth
                variant="standard"
                placeholder="0"
                value={lpAmount}
                onChange={(e) => setLpAmount(e.target.value)}
                disabled={busy}
                slotProps={{ input: { disableUnderline: true } }}
                sx={{
                  '& .MuiInputBase-input': {
                    fontSize: '1.5rem',
                    fontWeight: 600,
                    letterSpacing: '-0.02em',
                    p: 0,
                  },
                }}
              />
            }
            right={
              <AssetSelect
                assets={assets.filter((a) => a.assetId !== assetA)}
                onChange={setAssetB}
                value={assetB}
              />
            }
            secondary={
              <Typography sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>
                You hold {lpBalance !== undefined ? fromRawAmount(lpBalance, 8) : '—'} LP
                {pool?.lpAssetId ? '' : ' (ledger position)'}
              </Typography>
            }
          />
        )}

        {paused && <Alert severity="warning">The AMM is paused — every callable refuses.</Alert>}

        {mode === 'add' && assetB && !pool && (
          <Alert severity="info">
            No pool exists for this pair at {feeBps / 100}%. Switch to Create to open one.
          </Alert>
        )}

        {mode === 'create' && pool && (
          <Alert severity="info">
            A pool already exists for this pair at {feeBps / 100}%. Switch to Add to deposit into
            it.
          </Alert>
        )}

        {error && <Alert severity="error">{error}</Alert>}
        {result && <Alert severity="success">{result}</Alert>}

        <PrimaryAction disabled={!canAct} onClick={submit}>
          {actionLabel({ busy, mode, signedIn: Boolean(user) })}
        </PrimaryAction>
      </Stack>
    </SurfaceCard>
  );
};

import { Alert, Box, Skeleton, Typography } from '@mui/material';
import { Coins, Download, SearchX, Wallet } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { MobileAppBar } from '@/components/mobile/MobileAppBar';
import {
  AssetMark,
  initialsFor,
  MobileAssetRow,
  MobileHero,
  MobileSection,
  MobileStat,
} from '@/components/mobile/primitives';
import { AnimatedNumber } from '@/components/premium/AnimatedNumber';
import { EmptyState } from '@/components/premium/EmptyState';
import { GroupedList, ListRowSkeleton } from '@/components/premium/GroupedList';
import { SearchField } from '@/components/premium/SearchField';
import { useMobileWallet } from '@/pages/mobile/useMobileWallet';
import {
  mobileAccent,
  mobileLayout,
  mobileRadius,
  mobileSurface,
  mobileText,
} from '@/styles/mobileTokens';
import { formatAmount } from '@/utils/formatters';

/**
 * Mobile portfolio.
 *
 * The real holdings of the connected wallet: a hero balance, a holdings
 * split, and a searchable grouped list. The desktop portfolio is a wide
 * multi-column table which does not survive a narrow viewport, so the same
 * data is presented as stacked rows here.
 */

/** Tints used for the holdings split, in descending share order: one hue, stepping lighter. */
const SPLIT_COLORS = [
  mobileAccent.base,
  mobileAccent.bright,
  'var(--color-lavender-border)',
  'var(--text-subtle)',
];

export function MobilePortfolio() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  const { allocations, assets, availableBalance, error, isLoading, leased, totalBalance } =
    useMobileWallet();

  const visible = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return assets;
    return assets.filter(
      (asset) =>
        asset.name.toLowerCase().includes(term) || asset.assetId.toLowerCase().includes(term),
    );
  }, [assets, query]);

  // Only the largest holdings get their own band; the rest are grouped.
  const splitBands = allocations.slice(0, 4);

  return (
    <Box
      sx={{
        bgcolor: mobileSurface.canvas,
        // The canvas states its own ink — see the note on MobileHome's canvas.
        color: mobileText.primary,
        minHeight: '100%',
      }}
    >
      <MobileAppBar title="Portfolio" subtitle="Every asset held by this wallet." />

      <MobileSection sx={{ pb: `${mobileLayout.scrollPaddingBottom}px` }}>
        {error ? (
          <Alert severity="error" sx={{ borderRadius: mobileRadius.md, mb: 2 }}>
            Could not load balances. Pull to retry once your connection is back.
          </Alert>
        ) : null}

        <MobileHero
          label="Available balance"
          unit={isLoading || error ? undefined : 'DCC'}
          footer={
            !isLoading && (leased > 0 || totalBalance !== availableBalance) ? (
              <Box sx={{ display: 'flex', gap: 4, mt: 1.5 }}>
                <MobileStat
                  label="Total"
                  value={<AnimatedNumber value={totalBalance} decimals={8} />}
                />
                {leased > 0 ? (
                  <MobileStat
                    label="Leased out"
                    value={<AnimatedNumber value={leased} decimals={8} />}
                  />
                ) : null}
              </Box>
            ) : null
          }
        >
          {isLoading ? (
            <Skeleton variant="text" width={200} height={52} />
          ) : error ? (
            // The balance is unknown, which is not the same as zero.
            <Box component="span" sx={{ color: mobileText.tertiary }}>
              —
            </Box>
          ) : (
            <AnimatedNumber value={availableBalance} decimals={8} />
          )}
        </MobileHero>

        {/*
         * Holdings split by token amount. It is deliberately not called an
         * allocation by value: there is no price oracle for arbitrary issued
         * assets, so a value-weighted split would be invented.
         */}
        {!isLoading && splitBands.length > 1 ? (
          <Box sx={{ mt: 3 }}>
            <Typography sx={{ color: mobileText.secondary, fontSize: 13, mb: 1 }}>
              Holdings split by amount
            </Typography>
            <Box
              sx={{
                borderRadius: mobileRadius.pill,
                display: 'flex',
                gap: '2px',
                height: 8,
                overflow: 'hidden',
              }}
            >
              {splitBands.map((band, i) => (
                <Box
                  key={band.assetId}
                  sx={{ bgcolor: SPLIT_COLORS[i % SPLIT_COLORS.length], flex: band.percent }}
                />
              ))}
            </Box>
            <Box sx={{ columnGap: 2, display: 'flex', flexWrap: 'wrap', mt: 1.25, rowGap: 0.75 }}>
              {splitBands.map((band, i) => (
                <Box key={band.assetId} sx={{ alignItems: 'center', display: 'flex', gap: 0.75 }}>
                  <Box
                    sx={{
                      bgcolor: SPLIT_COLORS[i % SPLIT_COLORS.length],
                      borderRadius: '50%',
                      height: 8,
                      width: 8,
                    }}
                  />
                  <Typography
                    sx={{
                      color: mobileText.secondary,
                      fontSize: 13,
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {band.name} {band.percent.toFixed(0)}%
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>
        ) : null}

        <Box sx={{ mb: 2, mt: 4 }}>
          <SearchField
            value={query}
            onChange={setQuery}
            placeholder="Search your assets"
            label="Search your assets"
          />
        </Box>

        {error && assets.length === 0 ? null : (
          <GroupedList title="Assets">
            {isLoading && [0, 1, 2, 3].map((row) => <ListRowSkeleton key={row} />)}

            {!isLoading &&
              visible.map((asset) => (
                <MobileAssetRow
                  key={asset.assetId}
                  logo={
                    <AssetMark tone={asset.isBaseAsset ? 'accent' : 'neutral'}>
                      {initialsFor(asset.name)}
                    </AssetMark>
                  }
                  name={asset.name}
                  subtitle={asset.isBaseAsset ? 'Base asset' : asset.assetId}
                  price={formatAmount(asset.amount, asset.decimals)}
                  change=""
                  positive
                  onClick={() => navigate('/desktop/wallet/transactions')}
                />
              ))}

            {!isLoading && !error && visible.length === 0 ? (
              assets.length === 0 ? (
                <EmptyState
                  compact
                  icons={[Coins, Download, Wallet]}
                  title="No assets yet"
                  description="Receive DCC or an issued asset to get started."
                />
              ) : (
                <EmptyState
                  compact
                  icons={[SearchX]}
                  title="No matches"
                  description={`Nothing in your wallet matches “${query}”.`}
                />
              )
            ) : null}
          </GroupedList>
        )}
      </MobileSection>
    </Box>
  );
}

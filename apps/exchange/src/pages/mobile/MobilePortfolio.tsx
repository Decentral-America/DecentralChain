import { Alert, Box, InputBase, Skeleton, Typography } from '@mui/material';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { Icon } from '@/components/atoms/Icon';
import { MobileAppBar } from '@/components/mobile/MobileAppBar';
import {
  AssetMark,
  MobileAssetRow,
  MobileCard,
  MobileSection,
} from '@/components/mobile/primitives';
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
 * The real holdings of the connected wallet: a balance summary, a holdings
 * split, and a searchable asset list. The desktop portfolio is a wide
 * multi-column table which does not survive a narrow viewport, so the same
 * data is presented as stacked rows here.
 */

/** Tints used for the holdings split, in descending share order. */
const SPLIT_COLORS = [mobileAccent.base, mobileAccent.bright, '#A99BF5', '#D6D0FB'];

function initialsFor(name: string): string {
  return name.slice(0, 2).toUpperCase();
}

export function MobilePortfolio() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  const { allocations, assets, availableBalance, baseBalance, error, isLoading, leased } =
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
    <Box sx={{ bgcolor: mobileSurface.canvas, minHeight: '100%' }}>
      <MobileAppBar title="Portfolio" subtitle="Every asset held by this wallet." />

      <MobileSection sx={{ pb: `${mobileLayout.scrollPaddingBottom}px` }}>
        {error ? (
          <Alert severity="error" sx={{ borderRadius: mobileRadius.md, mb: 2 }}>
            Could not load balances. Pull to retry once your connection is back.
          </Alert>
        ) : null}

        <MobileCard sx={{ p: 2.5 }}>
          <Typography sx={{ color: mobileText.secondary, fontSize: 14, mb: 0.5 }}>
            Available balance
          </Typography>

          {isLoading ? (
            <Skeleton variant="text" width={200} height={40} />
          ) : (
            <Typography
              sx={{
                fontSize: 26,
                fontVariantNumeric: 'tabular-nums',
                fontWeight: 700,
                letterSpacing: '-0.5px',
              }}
            >
              {formatAmount(availableBalance, 8)} DCC
            </Typography>
          )}

          {!isLoading && (leased > 0 || baseBalance !== availableBalance) ? (
            <Box sx={{ display: 'flex', gap: 3, mt: 1.5 }}>
              <Box>
                <Typography sx={{ color: mobileText.muted, fontSize: 12 }}>Total</Typography>
                <Typography
                  sx={{ fontSize: 14, fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}
                >
                  {formatAmount(baseBalance, 8)}
                </Typography>
              </Box>
              {leased > 0 ? (
                <Box>
                  <Typography sx={{ color: mobileText.muted, fontSize: 12 }}>Leased out</Typography>
                  <Typography
                    sx={{ fontSize: 14, fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}
                  >
                    {formatAmount(leased, 8)}
                  </Typography>
                </Box>
              ) : null}
            </Box>
          ) : null}

          {/*
           * Holdings split by token amount. It is deliberately not called an
           * allocation by value: there is no price oracle for arbitrary issued
           * assets, so a value-weighted split would be invented.
           */}
          {!isLoading && splitBands.length > 1 ? (
            <Box sx={{ mt: 2.5 }}>
              <Typography sx={{ color: mobileText.muted, fontSize: 12, mb: 1 }}>
                Holdings split
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
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mt: 1.5 }}>
                {splitBands.map((band, i) => (
                  <Box key={band.assetId} sx={{ alignItems: 'center', display: 'flex', gap: 0.75 }}>
                    <Box
                      sx={{
                        bgcolor: SPLIT_COLORS[i % SPLIT_COLORS.length],
                        borderRadius: '2px',
                        height: 8,
                        width: 8,
                      }}
                    />
                    <Typography sx={{ color: mobileText.secondary, fontSize: 12 }}>
                      {band.name} {band.percent.toFixed(0)}%
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          ) : null}
        </MobileCard>

        {/* Search */}
        <Box
          sx={{
            alignItems: 'center',
            bgcolor: mobileSurface.card,
            border: `1px solid ${mobileSurface.border}`,
            borderRadius: mobileRadius.md,
            display: 'flex',
            gap: 1,
            mt: 2.5,
            px: 1.75,
          }}
        >
          <Box sx={{ color: mobileText.muted, lineHeight: 0 }}>
            <Icon name="search" size={18} strokeWidth={1.8} />
          </Box>
          <InputBase
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search your assets"
            inputProps={{ 'aria-label': 'Search your assets' }}
            // 16px keeps iOS from zooming the viewport when the field is focused.
            sx={{ flex: 1, fontSize: 16, minHeight: 44 }}
          />
        </Box>

        <MobileCard padded={false} sx={{ mt: 2, px: 1, py: 0.5 }}>
          {isLoading &&
            [0, 1, 2, 3].map((row) => (
              <Box key={row} sx={{ alignItems: 'center', display: 'flex', gap: 1.5, p: 1.5 }}>
                <Skeleton variant="circular" width={40} height={40} />
                <Box sx={{ flex: 1 }}>
                  <Skeleton variant="text" width="50%" />
                  <Skeleton variant="text" width="30%" />
                </Box>
              </Box>
            ))}

          {!isLoading &&
            visible.map((asset, index) => (
              <Box
                key={asset.assetId}
                sx={{
                  borderBottom:
                    index === visible.length - 1 ? 'none' : `1px solid ${mobileSurface.border}`,
                }}
              >
                <MobileAssetRow
                  logo={
                    <AssetMark bg={asset.isBaseAsset ? mobileAccent.wash : mobileSurface.chip}>
                      <Box
                        sx={{ color: asset.isBaseAsset ? mobileAccent.base : mobileText.primary }}
                      >
                        {initialsFor(asset.name)}
                      </Box>
                    </AssetMark>
                  }
                  name={asset.name}
                  subtitle={asset.isBaseAsset ? 'Base asset' : asset.assetId}
                  price={formatAmount(asset.amount, asset.decimals)}
                  change=""
                  positive
                  onClick={() => navigate('/desktop/wallet/transactions')}
                />
              </Box>
            ))}

          {!isLoading && visible.length === 0 && (
            <Box sx={{ px: 2, py: 5, textAlign: 'center' }}>
              <Typography
                sx={{ color: mobileText.primary, fontSize: 15, fontWeight: 600, mb: 0.5 }}
              >
                {assets.length === 0 ? 'No assets yet' : 'No matches'}
              </Typography>
              <Typography sx={{ color: mobileText.muted, fontSize: 13 }}>
                {assets.length === 0
                  ? 'Receive DCC or an issued asset to get started.'
                  : `Nothing in your wallet matches “${query}”.`}
              </Typography>
            </Box>
          )}
        </MobileCard>
      </MobileSection>
    </Box>
  );
}

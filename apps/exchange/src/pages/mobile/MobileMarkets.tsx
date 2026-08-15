import { Box, ButtonBase, InputBase, Typography } from '@mui/material';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { Icon } from '@/components/atoms/Icon';
import { MobileAppBar } from '@/components/mobile/MobileAppBar';
import { AssetMark, MobileCard, MobileSection } from '@/components/mobile/primitives';
import { NetworkConfig } from '@/config/networkConfig';
import {
  mobileAccent,
  mobileLayout,
  mobileRadius,
  mobileSurface,
  mobileText,
} from '@/styles/mobileTokens';

/**
 * Mobile markets browser.
 *
 * Lists the trading pairs this network actually supports, read from
 * `NetworkConfig.getTradingPairs()` — the same source the DEX pair selector
 * uses. Selecting a pair opens it in the DEX rather than a separate mobile
 * detail screen, so there is one trading surface and one source of truth.
 */

/**
 * Config stores pairs as raw asset ids. Short ids are already tickers; long
 * base58 ids are truncated for display until the asset name resolves.
 */
function displayName(assetId: string): string {
  if (assetId.length <= 6) return assetId;
  const ticker = NetworkConfig.getAssetTicker?.(assetId);
  return ticker || `${assetId.slice(0, 4)}…${assetId.slice(-3)}`;
}

export function MobileMarkets() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  const pairs = useMemo(() => {
    return NetworkConfig.getTradingPairs().map(([amountAsset, priceAsset]) => ({
      amountAsset,
      amountName: displayName(amountAsset),
      priceAsset,
      priceName: displayName(priceAsset),
    }));
  }, []);

  const visible = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return pairs;
    return pairs.filter((pair) =>
      `${pair.amountName}/${pair.priceName}`.toLowerCase().includes(term),
    );
  }, [pairs, query]);

  return (
    <Box sx={{ bgcolor: mobileSurface.canvas, minHeight: '100%' }}>
      <MobileAppBar title="Markets" subtitle="Every pair this network can trade." />

      <MobileSection sx={{ pb: `${mobileLayout.scrollPaddingBottom}px` }}>
        <Box
          sx={{
            alignItems: 'center',
            bgcolor: mobileSurface.card,
            border: `1px solid ${mobileSurface.border}`,
            borderRadius: mobileRadius.md,
            display: 'flex',
            gap: 1,
            px: 1.75,
          }}
        >
          <Box sx={{ color: mobileText.muted, lineHeight: 0 }}>
            <Icon name="search" size={18} strokeWidth={1.8} />
          </Box>
          <InputBase
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search pairs"
            inputProps={{ 'aria-label': 'Search trading pairs' }}
            // 16px keeps iOS from zooming the viewport when the field is focused.
            sx={{ flex: 1, fontSize: 16, minHeight: 44 }}
          />
        </Box>

        <MobileCard padded={false} sx={{ mt: 2, px: 1, py: 0.5 }}>
          {visible.map((pair, index) => (
            <ButtonBase
              key={`${pair.amountAsset}-${pair.priceAsset}`}
              onClick={() => navigate(`/desktop/dex/pair/${pair.amountAsset}/${pair.priceAsset}`)}
              sx={{
                borderBottom:
                  index === visible.length - 1 ? 'none' : `1px solid ${mobileSurface.border}`,
                display: 'flex',
                gap: 1.5,
                justifyContent: 'flex-start',
                minHeight: 64,
                px: 0.5,
                py: 1,
                textAlign: 'left',
                width: '100%',
              }}
            >
              <AssetMark bg={mobileAccent.wash}>
                <Box sx={{ color: mobileAccent.base, fontSize: 13 }}>
                  {pair.amountName.slice(0, 2).toUpperCase()}
                </Box>
              </AssetMark>

              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography sx={{ fontSize: 15, fontWeight: 600 }}>
                  {pair.amountName} / {pair.priceName}
                </Typography>
                <Typography sx={{ color: mobileText.muted, fontSize: 12 }}>
                  Trade on the DEX
                </Typography>
              </Box>

              <Box sx={{ color: mobileText.muted, flexShrink: 0, lineHeight: 0 }}>
                <Icon name="chevronRight" size={18} />
              </Box>
            </ButtonBase>
          ))}

          {visible.length === 0 && (
            <Box sx={{ px: 2, py: 5, textAlign: 'center' }}>
              <Typography
                sx={{ color: mobileText.primary, fontSize: 15, fontWeight: 600, mb: 0.5 }}
              >
                {pairs.length === 0 ? 'No pairs configured' : 'No matches'}
              </Typography>
              <Typography sx={{ color: mobileText.muted, fontSize: 13 }}>
                {pairs.length === 0
                  ? 'This network has no trading pairs configured.'
                  : `No pair matches “${query}”.`}
              </Typography>
            </Box>
          )}
        </MobileCard>
      </MobileSection>
    </Box>
  );
}

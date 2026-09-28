import { Box } from '@mui/material';
import { ChartCandlestick, SearchX } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { MobileAppBar } from '@/components/mobile/MobileAppBar';
import { AssetMark, MobileSection } from '@/components/mobile/primitives';
import { EmptyState } from '@/components/premium/EmptyState';
import { GroupedList, ListRow } from '@/components/premium/GroupedList';
import { SearchField } from '@/components/premium/SearchField';
import { NetworkConfig } from '@/config/networkConfig';
import { mobileLayout } from '@/styles/mobileTokens';

/**
 * Mobile markets browser.
 *
 * Lists the trading pairs this network actually supports, read from
 * `NetworkConfig.getTradingPairs()` — the same source the DEX pair selector
 * uses. Selecting a pair opens it in the DEX rather than a separate mobile
 * detail screen, so there is one trading surface and one source of truth.
 *
 * No price or change column: this screen has no market-data feed of its own,
 * and a row of dashes would read as broken rather than honest.
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
    <Box sx={{ bgcolor: 'var(--surface-ground)', minHeight: '100%' }}>
      <MobileAppBar title="Markets" subtitle="Every pair this network can trade." />

      <MobileSection sx={{ pb: `${mobileLayout.scrollPaddingBottom}px` }}>
        <Box sx={{ mb: 2.5 }}>
          <SearchField
            value={query}
            onChange={setQuery}
            placeholder="Search pairs"
            label="Search trading pairs"
          />
        </Box>

        <GroupedList>
          {visible.map((pair) => (
            <ListRow
              key={`${pair.amountAsset}-${pair.priceAsset}`}
              leading={
                <AssetMark tone="accent">{pair.amountName.slice(0, 2).toUpperCase()}</AssetMark>
              }
              title={`${pair.amountName} / ${pair.priceName}`}
              subtitle="Trade on the DEX"
              onClick={() => navigate(`/desktop/dex/pair/${pair.amountAsset}/${pair.priceAsset}`)}
            />
          ))}

          {visible.length === 0 &&
            (pairs.length === 0 ? (
              <EmptyState
                compact
                icons={[ChartCandlestick]}
                title="No pairs configured"
                description="This network has no trading pairs configured."
              />
            ) : (
              <EmptyState
                compact
                icons={[SearchX]}
                title="No matches"
                description={`No pair matches “${query}”.`}
              />
            ))}
        </GroupedList>
      </MobileSection>
    </Box>
  );
}

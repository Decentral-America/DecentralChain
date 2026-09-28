/**
 * Markets Page
 * Shows cryptocurrency market overview as a watchlist.
 *
 * The market feed is not wired up, so the rows are the page's existing
 * placeholders, labelled as such, and no row draws a trend line: there is no
 * price history to draw one from.
 */

import { Box } from '@mui/material';
import { ComingSoon } from '@/components/feedback/ComingSoon';
import { MarketWatchlist } from '@/components/premium/MarketWatchlist';
import { PageFrame } from '@/layouts/PageFrame';

export const Markets = () => {
  const marketData = [
    { change: 2.19, pair: 'DCC/USDT', price: '135.22', volume: '1.2M' },
    { change: 1.85, pair: 'BTC/USDT', price: '42,567.10', volume: '15.3M' },
    { change: -0.45, pair: 'ETH/USDT', price: '2,895.40', volume: '8.7M' },
    { change: 0.34, pair: 'DCC/BTC', price: '0.00317', volume: '450K' },
  ];

  return (
    <PageFrame title="Markets" subtitle="Price overview across markets.">
      <ComingSoon
        title="Market data is not connected yet"
        description="The figures below are placeholders, not live prices. Trade shows the real order book for a pair; this page will follow once the market feed is wired up."
      >
        <Box sx={{ maxWidth: 720 }}>
          <MarketWatchlist
            title="Watchlist"
            caption="Placeholder figures"
            rows={marketData.map((market) => ({
              change: market.change,
              changeLabel: `${market.change > 0 ? '+' : ''}${market.change.toFixed(2)}%`,
              id: market.pair,
              name: `Vol ${market.volume}`,
              price: `$${market.price}`,
              symbol: market.pair,
            }))}
          />
        </Box>
      </ComingSoon>
    </PageFrame>
  );
};

import { Box, useTheme } from '@mui/material';
import { useEffect, useState } from 'react';
import { useMarketStats24h, useOrderBook } from '@/api/services/matcherService';
import { TradingViewChart } from '@/features/dex/TradingViewChart';
import { BottomTabs } from '@/features/dex/terminal/BottomTabs';
import { MarketSearchDialog } from '@/features/dex/terminal/MarketSearchDialog';
import { OrderBookPanel } from '@/features/dex/terminal/OrderBookPanel';
import { OrderPanel } from '@/features/dex/terminal/OrderPanel';
import { PairStats } from '@/features/dex/terminal/PairStats';
import { SymbolButton } from '@/features/dex/terminal/SymbolButton';
import { BOTTOM_H, RIGHT_COL_W } from '@/features/dex/terminal/terminalTokens';
import { DEFAULT_PAIR } from '@/features/dex/tradingPairs';
import { useHotkey } from '@/hooks';
import {
  selectSelectedPair,
  selectSetSelectedPair,
  selectUpdateMarketData,
  selectUpdateOrderBook,
  useDexStore,
} from '@/stores/dexStore';
import { tokens } from '@/theme/tokens/semantic';

const FORM_SHARE_KEY = 'dex.formShare';

/**
 * The trading terminal.
 *
 * Chart and history on the left, book and order entry on the right, the market
 * picker as a palette rather than a rail — the chart gets the width, and ⌘K is
 * the gesture people already have for "find a thing". Every region has a fixed
 * chrome height, so nothing shifts as data arrives.
 */
export const Dex: React.FC = () => {
  const t = tokens(useTheme().palette.mode);
  const selectedPair = useDexStore(selectSelectedPair);
  const setSelectedPair = useDexStore(selectSetSelectedPair);
  const updateOrderBook = useDexStore(selectUpdateOrderBook);
  const updateMarketData = useDexStore(selectUpdateMarketData);
  const [pickerOpen, setPickerOpen] = useState(false);
  // Tenths of the right column given to the order ticket. Remembered, because a
  // trader's preference here is a working habit, not a per-visit whim.
  const [formShare, setFormShare] = useState<number>(() => {
    const saved = Number(localStorage.getItem(FORM_SHARE_KEY));
    if (saved >= 4 && saved <= 8) return saved;
    // The ticket's content is a fixed height; the column's is not. On a laptop
    // it needs a larger share of a shorter column to avoid a scrollbar.
    return typeof window !== 'undefined' && window.innerHeight < 900 ? 7 : 6;
  });
  useEffect(() => {
    try {
      localStorage.setItem(FORM_SHARE_KEY, String(formShare));
    } catch {
      /* private mode */
    }
  }, [formShare]);

  // Seed the store, and replace a pair carried over from another network — it
  // arrives with empty asset ids and every panel downstream errors on it.
  useEffect(() => {
    const stale = selectedPair && (!selectedPair.amountAsset || !selectedPair.priceAsset);
    if (stale || (!selectedPair && DEFAULT_PAIR)) setSelectedPair(DEFAULT_PAIR);
  }, [selectedPair, setSelectedPair]);

  useHotkey('k', () => setPickerOpen(true), { metaKey: true });
  useHotkey('k', () => setPickerOpen(true), { ctrlKey: true });

  const { data: orderBookData } = useOrderBook(
    selectedPair?.amountAsset || '',
    selectedPair?.priceAsset || '',
    50,
    { enabled: !!selectedPair },
  );
  useEffect(() => {
    if (!orderBookData) return;
    updateOrderBook({
      asks: orderBookData.asks.map((ask, idx) => ({
        amount: ask.amount.toString(),
        id: `ask-${idx}`,
        price: ask.price.toString(),
        timestamp: orderBookData.timestamp,
        type: 'sell' as const,
      })),
      bids: orderBookData.bids.map((bid, idx) => ({
        amount: bid.amount.toString(),
        id: `bid-${idx}`,
        price: bid.price.toString(),
        timestamp: orderBookData.timestamp,
        type: 'buy' as const,
      })),
    });
  }, [orderBookData, updateOrderBook]);

  const { data: stats24h } = useMarketStats24h(
    selectedPair?.amountAsset || '',
    selectedPair?.priceAsset || '',
    { enabled: !!selectedPair },
  );
  useEffect(() => {
    if (!stats24h) return;
    const bestBid = orderBookData?.bids[0]?.price ?? 0;
    const bestAsk = orderBookData?.asks[0]?.price ?? 0;
    const mid = bestBid > 0 && bestAsk > 0 ? (bestBid + bestAsk) / 2 : bestBid || bestAsk || 0;
    updateMarketData({
      currentPrice: stats24h.hasTrades ? stats24h.lastPrice : mid,
      high24h: stats24h.high24h,
      lastPrice: stats24h.lastPrice,
      low24h: stats24h.low24h,
      priceChange24h: stats24h.priceChange24h,
      priceChangePercent24h: stats24h.priceChangePercent24h,
      volume24h: stats24h.volume24h,
    });
  }, [stats24h, orderBookData, updateMarketData]);

  const base = selectedPair?.amountAssetName || selectedPair?.amountAsset || '—';
  const quote = selectedPair?.priceAssetName || selectedPair?.priceAsset || '—';
  const hairline = `1px solid ${t.border.subtle}`;

  return (
    <Box
      sx={{
        bgcolor: 'background.paper',
        display: 'grid',
        gridTemplateColumns: { lg: `minmax(0, 1fr) ${RIGHT_COL_W}px`, xs: 'minmax(0, 1fr)' },
        height: '100%',
        minHeight: 600,
        minWidth: 0,
      }}
    >
      <Box
        sx={{
          display: 'grid',
          gridTemplateRows: `minmax(0, 1fr) ${BOTTOM_H}px`,
          minHeight: 0,
          minWidth: 0,
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <TradingViewChart
            leading={
              <>
                <SymbolButton base={base} quote={quote} onClick={() => setPickerOpen(true)} />
                <PairStats />
              </>
            }
          />
        </Box>
        <Box sx={{ borderTop: hairline, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <BottomTabs />
        </Box>
      </Box>

      <Box
        sx={{
          borderLeft: hairline,
          display: { lg: 'flex', xs: 'none' },
          flexDirection: 'column',
          minHeight: 0,
          // Nothing here may bleed past the column; each region scrolls itself.
          overflow: 'hidden',
        }}
      >
        {/*
          A flex ratio, not a percentage row: a percentage needs the column's
          height to be definite and silently falls back to content height when
          it is not — which is how the form used to run past the bottom. The
          ratio is the reader's, kept across sessions: some people watch the
          book, some live in the ticket.
        */}
        <Box
          sx={{
            display: 'flex',
            flex: `${10 - formShare} 1 0`,
            flexDirection: 'column',
            minHeight: 96,
          }}
        >
          <OrderBookPanel />
        </Box>
        <Box
          sx={{
            borderTop: hairline,
            display: 'flex',
            flex: `${formShare} 1 0`,
            flexDirection: 'column',
            minHeight: 0,
          }}
        >
          <OrderPanel onResize={setFormShare} share={formShare} />
        </Box>
      </Box>

      <MarketSearchDialog open={pickerOpen} onClose={() => setPickerOpen(false)} />
    </Box>
  );
};

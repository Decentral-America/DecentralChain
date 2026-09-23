/**
 * OrderBook Component
 * Real-time display of bids and asks for the selected trading pair
 * Shows price, amount, and total with color-coded buy/sell orders
 * Matches Angular implementation exactly
 */
import type React from 'react';
import { useMemo } from 'react';
import styled from 'styled-components';
import { Spinner } from '@/components/atoms/Spinner';
import {
  selectIsOrderBookLoading,
  selectMarketData,
  selectOrderBook,
  selectSelectedPair,
  useDexStore,
} from '@/stores/dexStore';

/**
 * Order book wrapper - matches Angular's dex-order-book__wrapper
 */
const OrderBookWrapper = styled.div`
  width: 100%;
  height: 100%;
  position: relative;
  text-align: right;
`;

/**
 * Table container - matches Angular's w-table
 */
const Table = styled.div`
  display: block;
  width: 100%;
  height: 100%;
`;

/**
 * Table header - matches Angular's w-thead
 */
const TableHead = styled.div`
  display: block;
  border-bottom: 1px solid ${(p) => p.theme.colors.border};
`;

/**
 * Header row
 */
const HeaderRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  padding: ${(p) => p.theme.spacing.sm} ${(p) => p.theme.spacing.md};
  font-size: ${(p) => scaled(p.theme.fontSizes.xs)};
  font-weight: ${(p) => p.theme.fontWeights.medium};
  color: ${(p) => p.theme.colors.text};
  opacity: 0.6;
`;

/**
 * The order book runs 15% tighter than the app's base type scale.
 *
 * Applied as an explicit multiplier rather than by setting a percentage on the
 * container: the sizes below are `rem`, which ignores the parent, and
 * converting them to `em` would compound wherever one sized element nests
 * inside another — the last price sits inside the price divider, and would
 * come out smaller than the rows it is meant to anchor.
 */
const RAIL_SCALE = 0.85;

const scaled = (size: string): string => `${(Number.parseFloat(size) * RAIL_SCALE).toFixed(4)}rem`;

/**
 * Header cell
 */
const HeaderCell = styled.div<{ $align?: 'left' | 'center' | 'right' }>`
  text-align: ${(p) => p.$align || 'right'};
`;

/**
 * Table body - container for both scrollable sections and fixed price
 */
const TableBody = styled.div`
  display: flex;
  flex-direction: column;
  height: calc(100% - 40px);
  overflow: hidden;
`;

/**
 * Asks section (sell orders) - SCROLLABLE container at top
 */
const AsksSection = styled.div`
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  display: flex;
  flex-direction: column-reverse; /* Reverse so latest orders appear at bottom */
  min-height: 0;

  /* Custom scrollbar */
  &::-webkit-scrollbar {
    width: 4px;
  }

  &::-webkit-scrollbar-track {
    background: ${(p) => p.theme.colors.background};
  }

  &::-webkit-scrollbar-thumb {
    background: ${(p) => p.theme.colors.border};
    border-radius: 2px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: ${(p) => p.theme.colors.primary};
  }
`;

/**
 * Bids section (buy orders) - SCROLLABLE container at bottom
 */
const BidsSection = styled.div`
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  display: block;
  min-height: 0;

  /* Custom scrollbar */
  &::-webkit-scrollbar {
    width: 4px;
  }

  &::-webkit-scrollbar-track {
    background: ${(p) => p.theme.colors.background};
  }

  &::-webkit-scrollbar-thumb {
    background: ${(p) => p.theme.colors.border};
    border-radius: 2px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: ${(p) => p.theme.colors.primary};
  }
`;

/**
 * Price info divider - FIXED between two scrollable sections
 */
const PriceInfo = styled.div`
  border-top: 1px solid ${(p) => p.theme.colors.border};
  border-bottom: 1px solid ${(p) => p.theme.colors.border};
  background: ${(p) => p.theme.colors.background};
  display: flex;
  align-items: center;
  justify-content: space-between;
  text-align: right;
  font-size: ${(p) => scaled(p.theme.fontSizes.xs)};
  width: 100%;
  min-height: 43px;
  padding: ${(p) => p.theme.spacing.sm} ${(p) => p.theme.spacing.md};
  text-transform: uppercase;
  flex-shrink: 0; /* Don't allow this to shrink */
`;

/**
 * Price info title
 */
const PriceInfoTitle = styled.div`
  flex: 1;
  color: ${(p) => p.theme.colors.text};
  opacity: 0.6;
`;

/**
 * Last price display
 */
const LastPrice = styled.div`
  font-size: ${(p) => scaled(p.theme.fontSizes.md)};
  font-weight: ${(p) => p.theme.fontWeights.semibold};
  color: ${(p) => p.theme.colors.warning};
  margin: 0 ${(p) => p.theme.spacing.sm};
  display: flex;
  align-items: center;
  gap: 4px;
`;

/**
 * Spread display
 */
const Spread = styled.span`
  &::after {
    content: '%';
    display: inline-block;
  }
`;

/**
 * Order row
 */
const OrderRow = styled.div<{ $type: 'buy' | 'sell' }>`
  position: relative;
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  padding: ${(p) => p.theme.spacing.xs} ${(p) => p.theme.spacing.md};
  font-size: ${(p) => scaled(p.theme.fontSizes.sm)};
  cursor: pointer;
  transition: background 0.2s;

  &:hover {
    background: ${(p) => p.theme.colors.primary}10;
  }

  /* Depth visualization background.
     Width comes from the --depth custom property set inline per row rather
     than from a styled-components prop interpolation. Depth is a continuously
     varying float, and styled-components emits a brand new CSS class for every
     distinct interpolated value — so interpolating the depth prop here injected
     ~160 new rules into the stylesheet on every order-book update and grew it
     without bound for the life of the session. A custom property changes one
     inline value and reuses a single static class. */
  &::before {
    content: '';
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    width: var(--depth, 0%);
    background: ${(p) =>
      p.$type === 'buy' ? `${p.theme.colors.info}15` : `${p.theme.colors.error}15`};
    z-index: 0;
  }
`;

/**
 * Order cell
 */
const OrderCell = styled.div<{ $type?: 'buy' | 'sell'; $align?: 'left' | 'center' | 'right' }>`
  position: relative;
  z-index: 1;
  text-align: ${(p) => p.$align || 'left'};
  color: ${(p) => {
    if (!p.$type) return p.theme.colors.text;
    return p.$type === 'buy' ? p.theme.colors.info : p.theme.colors.error;
  }};
  font-family: ${(p) => p.theme.fonts.mono};
`;

/**
 * Empty state
 */
const EmptyState = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: ${(p) => p.theme.spacing.xl};
  color: ${(p) => p.theme.colors.text};
  opacity: 0.5;
  font-size: ${(p) => scaled(p.theme.fontSizes.sm)};
`;

/**
 * Loading state
 */
const LoadingState = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: ${(p) => p.theme.spacing.xl};
`;

/**
 * Shared number formatter, built once at module scope.
 *
 * `Number.prototype.toLocaleString` constructs an `Intl.NumberFormat` on every
 * call. The order book renders up to 160 rows of 3 formatted cells, so the
 * previous per-render helpers built ~480 formatters on every update — one of
 * the most expensive operations available in JS. `Intl.NumberFormat` instances
 * are immutable and safe to share.
 */
const priceFormatter = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 8,
  minimumFractionDigits: 0,
});

/**
 * Format a number with short mode - matches Angular's getNiceNumberTemplate.
 *
 * @param value - The number to format
 * @param shortModeThreshold - Show K/M notation if >= this value (true = 10000)
 */
const formatWithShortMode = (
  value: string | number,
  shortModeThreshold: number | boolean,
): string => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (Number.isNaN(num)) return '0';

  const threshold = typeof shortModeThreshold === 'number' ? shortModeThreshold : 10000;
  const useShortMode =
    typeof shortModeThreshold === 'boolean' ? shortModeThreshold : num >= threshold;

  // Short mode for large numbers
  if (useShortMode && num >= threshold) {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
  }

  return priceFormatter.format(num);
};

/** Format amount - Angular uses shortMode = true (threshold 10000) */
const formatAmount = (amount: string): string => formatWithShortMode(amount, true);

/** Format price - Angular uses shortMode = 100000 (only for very large prices) */
const formatPrice = (price: string): string => formatWithShortMode(price, 100000);

/** Calculate and format total - Angular uses shortMode = true (threshold 10000) */
const calculateTotal = (price: string, amount: string): string => {
  const priceNum = parseFloat(price);
  const amountNum = parseFloat(amount);
  if (Number.isNaN(priceNum) || Number.isNaN(amountNum)) return '0';
  return formatWithShortMode(priceNum * amountNum, true);
};

/**
 * A blank level, drawn so the book keeps its full height.
 *
 * Without these an illiquid pair renders three rows and a large void, and the
 * spread divider floats mid-panel with nothing to divide. Holding the grid
 * makes the shallowness legible instead of looking like a failure to load.
 */
const EmptyRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: ${(p) => p.theme.spacing.sm};
  padding: 2px ${(p) => p.theme.spacing.md};
  color: ${(p) => p.theme.colors.disabled};
  font-size: ${(p) => scaled(p.theme.fontSizes.xs)};
  > span:first-child {
    text-align: left;
  }
  > span:not(:first-child) {
    text-align: right;
  }
`;

/**
 * Levels each side is drawn to, real or blank.
 *
 * Sized for the terminal's full-height rail. Twelve left a gap above the asks
 * once the trading region grew to the viewport — the asks stack upward from
 * the spread divider, so the shortfall shows at the top of the panel rather
 * than the bottom. Each side scrolls independently, so an over-estimate costs
 * nothing on a shorter screen.
 */
const FILLED_ROWS = 22;

const Filler: React.FC<{ count: number; tone: 'buy' | 'sell' }> = ({ count, tone }) => (
  <>
    {/*
      The index is the key because these rows are blank spacers: position is
      the only thing that distinguishes them, and the run only ever grows or
      shrinks from the end, so no reorder can mismatch one.
    */}
    {Array.from({ length: Math.max(0, count) }, (_, i) => (
      // biome-ignore lint/suspicious/noArrayIndexKey: blank spacers, see above
      <EmptyRow key={`${tone}-empty-${i}`}>
        <span>—</span>
        <span>—</span>
        <span>—</span>
      </EmptyRow>
    ))}
  </>
);

/** Maximum order-book rows drawn per side. */
const MAX_ROWS = 80;

/**
 * Take at most `MAX_ROWS` levels and attach a depth percentage to each.
 *
 * `direction: 'desc'` walks the array backwards (used for asks, which arrive
 * sorted ascending but are drawn highest-price-first above the spread).
 * Depth is normalised against the largest amount in the *whole* book, not just
 * the visible slice, so the bars keep the same meaning as before.
 */
function takeWithDepth<T extends { amount: string }>(
  levels: T[],
  direction: 'asc' | 'desc',
): Array<T & { depth: number }> {
  if (!levels.length) return [];

  let maxAmount = 0;
  for (const level of levels) {
    const parsed = parseFloat(level.amount);
    if (parsed > maxAmount) maxAmount = parsed;
  }
  // Guard against an all-zero book, which would make every depth NaN.
  const divisor = maxAmount || 1;

  const rows: Array<T & { depth: number }> = [];
  const count = Math.min(levels.length, MAX_ROWS);
  for (let i = 0; i < count; i++) {
    const level = levels[direction === 'desc' ? levels.length - 1 - i : i];
    if (!level) continue;
    rows.push({ ...level, depth: (parseFloat(level.amount) / divisor) * 100 });
  }
  return rows;
}

/**
 * OrderBook Component
 */
export const OrderBook: React.FC = () => {
  const orderBook = useDexStore(selectOrderBook);
  const isOrderBookLoading = useDexStore(selectIsOrderBookLoading);
  const marketData = useDexStore(selectMarketData);
  const selectedPair = useDexStore(selectSelectedPair);

  // Column headers were hardcoded to "Amount (DCC)" / "Price (G9T)" / "Sum (G9T)".
  // The pair is user-selectable across 28 markets, so on any pair other than
  // DCC/CRC the table labelled every column with the wrong asset — the one thing
  // an order book must never do. Falls back to the raw asset id, matching how
  // TradingPairSelector renders a pair whose name has not resolved yet.
  const amountLabel = selectedPair?.amountAssetName || selectedPair?.amountAsset || '—';
  const priceLabel = selectedPair?.priceAssetName || selectedPair?.priceAsset || '—';

  /**
   * Asks with depth, highest price first, capped at the rows we actually draw.
   *
   * Previously this mapped every level, copied the array, reversed the copy and
   * then took 80 rows — four passes over the full book to render at most 80.
   * Walking backwards produces the same order in one pass and allocates only
   * the rows that get rendered. `Math.max(...arr)` was also replaced with a
   * loop: spreading a large book into an argument list can overflow the stack.
   */
  const visibleAsks = useMemo(() => takeWithDepth(orderBook.asks, 'desc'), [orderBook.asks]);

  /** Bids with depth, highest price first (already sorted descending). */
  const visibleBids = useMemo(() => takeWithDepth(orderBook.bids, 'asc'), [orderBook.bids]);

  if (isOrderBookLoading) {
    return (
      <OrderBookWrapper>
        <LoadingState>
          <Spinner size="md" />
        </LoadingState>
      </OrderBookWrapper>
    );
  }

  const hasAsks = orderBook.asks && orderBook.asks.length > 0;
  const hasBids = orderBook.bids && orderBook.bids.length > 0;
  const hasOrders = hasAsks || hasBids;

  // Calculate spread (difference between lowest ask and highest bid)
  const spread =
    hasAsks && hasBids
      ? ((parseFloat(orderBook.asks[0]?.price ?? '0') -
          parseFloat(orderBook.bids[0]?.price ?? '0')) /
          parseFloat(orderBook.bids[0]?.price ?? '1')) *
        100
      : 0;

  return (
    <OrderBookWrapper>
      {/* Match Angular structure: table > thead + tbody > scroll-box */}
      <Table>
        {/* Table Header - OUTSIDE scroll box */}
        <TableHead>
          <HeaderRow>
            <HeaderCell $align="left">Amount {amountLabel}</HeaderCell>
            <HeaderCell $align="right">Price {priceLabel}</HeaderCell>
            <HeaderCell $align="right">Sum {priceLabel}</HeaderCell>
          </HeaderRow>
        </TableHead>

        {/* Table Body with THREE sections: scrollable asks, fixed price, scrollable bids */}
        <TableBody>
          {hasOrders ? (
            <>
              {/* Asks Section (Sell Orders) - SCROLLABLE at top */}
              <AsksSection>
                {hasAsks &&
                  visibleAsks.map((ask, index) => (
                    <OrderRow
                      key={`ask-${ask.id || index}`}
                      $type="sell"
                      style={{ '--depth': `${ask.depth}%` } as React.CSSProperties}
                    >
                      <OrderCell $align="left">{formatAmount(ask.amount)}</OrderCell>
                      <OrderCell $type="sell" $align="right">
                        {formatPrice(ask.price)}
                      </OrderCell>
                      <OrderCell $align="right">{calculateTotal(ask.price, ask.amount)}</OrderCell>
                    </OrderRow>
                  ))}
                <Filler count={FILLED_ROWS - visibleAsks.length} tone="sell" />
              </AsksSection>

              {/* Price Info - FIXED in middle (not scrollable) */}
              <PriceInfo>
                <PriceInfoTitle>Last Price</PriceInfoTitle>
                <LastPrice>{formatPrice(String(marketData.currentPrice || 0))}</LastPrice>
                <PriceInfoTitle>
                  <span>Spread </span>
                  <Spread>{spread.toFixed(2)}</Spread>
                </PriceInfoTitle>
              </PriceInfo>

              {/* Bids Section (Buy Orders) - SCROLLABLE at bottom */}
              <BidsSection>
                {hasBids &&
                  visibleBids.map((bid, index) => (
                    <OrderRow
                      key={`bid-${bid.id || index}`}
                      $type="buy"
                      style={{ '--depth': `${bid.depth}%` } as React.CSSProperties}
                    >
                      <OrderCell $align="left">{formatAmount(bid.amount)}</OrderCell>
                      <OrderCell $type="buy" $align="right">
                        {formatPrice(bid.price)}
                      </OrderCell>
                      <OrderCell $align="right">{calculateTotal(bid.price, bid.amount)}</OrderCell>
                    </OrderRow>
                  ))}
                <Filler count={FILLED_ROWS - visibleBids.length} tone="buy" />
              </BidsSection>
            </>
          ) : (
            <EmptyState>No orders available</EmptyState>
          )}
        </TableBody>
      </Table>
    </OrderBookWrapper>
  );
};

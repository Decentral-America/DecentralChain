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
import { useDexStore } from '@/stores/dexStore';

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
  font-size: ${(p) => p.theme.fontSizes.xs};
  font-weight: ${(p) => p.theme.fontWeights.medium};
  color: ${(p) => p.theme.colors.text};
  opacity: 0.6;
  text-transform: uppercase;
`;

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
  font-size: ${(p) => p.theme.fontSizes.xs};
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
  font-size: ${(p) => p.theme.fontSizes.md};
  font-weight: ${(p) => p.theme.fontWeights.semibold};
  color: ${(p) => p.theme.colors.success};
  margin: 0 ${(p) => p.theme.spacing.sm};
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
const OrderRow = styled.div<{ $type: 'buy' | 'sell'; $depth: number }>`
  position: relative;
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  padding: ${(p) => p.theme.spacing.xs} ${(p) => p.theme.spacing.md};
  font-size: ${(p) => p.theme.fontSizes.sm};
  cursor: pointer;
  transition: background 0.2s;

  &:hover {
    background: ${(p) => p.theme.colors.primary}10;
  }

  /* Depth visualization background */
  &::before {
    content: '';
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    width: ${(p) => p.$depth}%;
    background: ${(p) =>
      p.$type === 'buy' ? `${p.theme.colors.success}15` : `${p.theme.colors.error}15`};
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
    return p.$type === 'buy' ? p.theme.colors.success : p.theme.colors.error;
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
  font-size: ${(p) => p.theme.fontSizes.sm};
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
 * OrderBook Component
 */
export const OrderBook: React.FC = () => {
  const { orderBook, isOrderBookLoading, marketData } = useDexStore();

  /**
   * Calculate cumulative depth for visualization
   */
  const asksWithDepth = useMemo(() => {
    if (!orderBook.asks.length) return [];

    const maxAmount = Math.max(...orderBook.asks.map((a) => parseFloat(a.amount)));

    return orderBook.asks.map((ask) => ({
      ...ask,
      depth: (parseFloat(ask.amount) / maxAmount) * 100,
    }));
  }, [orderBook.asks]);

  /**
   * Calculate cumulative depth for bids
   */
  const bidsWithDepth = useMemo(() => {
    if (!orderBook.bids.length) return [];

    const maxAmount = Math.max(...orderBook.bids.map((b) => parseFloat(b.amount)));

    return orderBook.bids.map((bid) => ({
      ...bid,
      depth: (parseFloat(bid.amount) / maxAmount) * 100,
    }));
  }, [orderBook.bids]);

  /**
   * Format number with short mode - matches Angular's getNiceNumberTemplate
   * @param value - The number to format
   * @param precision - Number of decimal places
   * @param shortModeThreshold - Show K/M notation if >= this value (true = 10000)
   */
  const formatWithShortMode = (
    value: string | number,
    precision: number,
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

    // Regular formatting with proper precision
    return num.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: precision,
    });
  };

  /**
   * Format amount - Angular uses shortMode = true (threshold 10000)
   */
  const formatAmount = (amount: string): string => {
    return formatWithShortMode(amount, 8, true);
  };

  /**
   * Format price - Angular uses shortMode = 100000 (only for very large prices)
   */
  const formatPrice = (price: string): string => {
    return formatWithShortMode(price, 8, 100000);
  };

  /**
   * Calculate and format total - Angular uses shortMode = true (threshold 10000)
   */
  const calculateTotal = (price: string, amount: string): string => {
    const priceNum = parseFloat(price);
    const amountNum = parseFloat(amount);
    if (Number.isNaN(priceNum) || Number.isNaN(amountNum)) return '0';
    const total = priceNum * amountNum;
    return formatWithShortMode(total, 8, true);
  };

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
            <HeaderCell $align="left">Amount (DCC)</HeaderCell>
            <HeaderCell $align="right">Price (G9T)</HeaderCell>
            <HeaderCell $align="right">Sum (G9T)</HeaderCell>
          </HeaderRow>
        </TableHead>

        {/* Table Body with THREE sections: scrollable asks, fixed price, scrollable bids */}
        <TableBody>
          {hasOrders ? (
            <>
              {/* Asks Section (Sell Orders) - SCROLLABLE at top */}
              <AsksSection>
                {hasAsks &&
                  [...asksWithDepth]
                    .reverse()
                    .slice(0, 80)
                    .map((ask, index) => (
                      <OrderRow key={`ask-${ask.id || index}`} $type="sell" $depth={ask.depth}>
                        <OrderCell $align="left">{formatAmount(ask.amount)}</OrderCell>
                        <OrderCell $type="sell" $align="right">
                          {formatPrice(ask.price)}
                        </OrderCell>
                        <OrderCell $align="right">
                          {calculateTotal(ask.price, ask.amount)}
                        </OrderCell>
                      </OrderRow>
                    ))}
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
                  bidsWithDepth.slice(0, 80).map((bid, index) => (
                    <OrderRow key={`bid-${bid.id || index}`} $type="buy" $depth={bid.depth}>
                      <OrderCell $align="left">{formatAmount(bid.amount)}</OrderCell>
                      <OrderCell $type="buy" $align="right">
                        {formatPrice(bid.price)}
                      </OrderCell>
                      <OrderCell $align="right">{calculateTotal(bid.price, bid.amount)}</OrderCell>
                    </OrderRow>
                  ))}
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

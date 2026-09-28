/**
 * Price ladder — an order book read as one instrument: asks above, bids below,
 * the last price and spread pinned between them. Each row carries a depth bar
 * sized by cumulative resting size from the spread outward, so the shape of
 * the book is readable before any number is.
 *
 * The depth treatment follows 21st.dev "Depth Chart" by @arihantcodes
 * (demo 29968): stepped cumulative liquidity on either side of the mid, tinted
 * green and red at low opacity, spread stats at the seam. The chart is folded
 * into the rows here, because a ladder is what a trader actually operates.
 */
import { Skeleton } from '@mui/material';
import { BookOpen, Layers, TrendingUp } from 'lucide-react';
import { useMemo } from 'react';
import styled from 'styled-components';
import { AnimatedNumber } from './AnimatedNumber';
import { EmptyState } from './EmptyState';

export interface LadderLevel {
  price: number;
  amount: number;
}

export interface PriceLadderProps {
  /** Sell orders, best (lowest) price first. */
  asks: LadderLevel[];
  /** Buy orders, best (highest) price first. */
  bids: LadderLevel[];
  priceUnit?: string | undefined;
  amountUnit?: string | undefined;
  /** The last traded or reference price, shown at the spread. */
  lastPrice?: number | undefined;
  loading?: boolean | undefined;
  /** Rows per side. */
  depth?: number | undefined;
  onSelectPrice?: (price: number, side: 'buy' | 'sell') => void;
  emptyTitle?: string | undefined;
  emptyDescription?: string | undefined;
  className?: string | undefined;
}

const COLUMNS = 'minmax(0, 1.1fr) minmax(0, 1fr) minmax(0, 1fr)';

const Root = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  font-variant-numeric: tabular-nums;
  font-feature-settings: 'tnum' on;
`;

const Head = styled.div`
  display: grid;
  grid-template-columns: ${COLUMNS};
  gap: 8px;
  padding: 0 16px 8px;
  font-size: 12px;
  line-height: 16px;
  color: ${({ theme }) => theme.colors.textSecondary};
  flex-shrink: 0;

  & > span:not(:first-child) {
    text-align: right;
  }
`;

const Side = styled.div<{ $asks?: boolean | undefined }>`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  display: flex;
  /* Asks grow upward from the spread, so the best ask always sits at the seam. */
  flex-direction: ${({ $asks }) => ($asks ? 'column-reverse' : 'column')};
  scrollbar-width: thin;
`;

const Row = styled.div<{ $side: 'buy' | 'sell'; $interactive: boolean }>`
  all: unset;
  box-sizing: border-box;
  position: relative;
  display: grid;
  grid-template-columns: ${COLUMNS};
  gap: 8px;
  width: 100%;
  padding: 3px 16px;
  font-size: 13px;
  line-height: 18px;
  cursor: ${({ $interactive }) => ($interactive ? 'pointer' : 'default')};
  color: ${({ theme }) => theme.colors.text};
  transition: background-color 160ms cubic-bezier(0.32, 0.72, 0, 1);

  &:hover {
    background: color-mix(in srgb, ${({ theme }) => theme.colors.text} 5%, transparent);
  }

  &:focus-visible {
    box-shadow: inset 0 0 0 2px ${({ theme }) => theme.colors.primary};
  }

  & > span {
    position: relative;
    z-index: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  & > span:not(:first-of-type) {
    text-align: right;
  }

  & > span:first-of-type {
    color: ${({ theme, $side }) => ($side === 'buy' ? theme.colors.buy : theme.colors.sell)};
    font-weight: 500;
  }

  & > span:last-of-type {
    color: ${({ theme }) => theme.colors.textSecondary};
  }
`;

const Bar = styled.i<{ $side: 'buy' | 'sell' }>`
  position: absolute;
  inset: 1px 0 1px 0;
  border-radius: 2px 0 0 2px;
  /* Depth grows from the right edge; scaling keeps the animation off layout. */
  transform-origin: right center;
  background: ${({ theme, $side }) =>
    `color-mix(in srgb, ${$side === 'buy' ? theme.colors.buy : theme.colors.sell} ${
      theme.mode === 'dark' ? 18 : 11
    }%, transparent)`};
  transition: transform 240ms cubic-bezier(0.32, 0.72, 0, 1);
  pointer-events: none;
`;

const Seam = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 16px;
  margin: 4px 0;
  flex-shrink: 0;
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
`;

const Last = styled.span`
  font-size: 17px;
  font-weight: 600;
  letter-spacing: -0.02em;
  color: ${({ theme }) => theme.colors.text};
`;

const Quiet = styled.span`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textSecondary};
  white-space: nowrap;
`;

const SkeletonRow = styled.div`
  display: grid;
  grid-template-columns: ${COLUMNS};
  gap: 8px;
  padding: 5px 16px;
`;

const fmt = (n: number, max = 8) =>
  Number.isFinite(n)
    ? n.toLocaleString('en-US', {
        maximumFractionDigits: Math.abs(n) >= 1000 ? 2 : max,
        minimumFractionDigits: 0,
      })
    : '0';

const compact = (n: number) =>
  Math.abs(n) >= 10000
    ? n.toLocaleString('en-US', { maximumFractionDigits: 1, notation: 'compact' })
    : fmt(n, 4);

/** Cumulative size from the best price outward, as a share of the deeper side. */
function withDepth(levels: LadderLevel[], limit: number) {
  let running = 0;
  return levels.slice(0, limit).map((level) => {
    running += level.amount;
    return { ...level, cumulative: running };
  });
}

export function PriceLadder({
  asks,
  bids,
  priceUnit,
  amountUnit,
  lastPrice,
  loading = false,
  depth = 40,
  onSelectPrice,
  emptyTitle = 'The book is empty',
  emptyDescription = 'No resting orders for this pair yet. A limit order placed now becomes the first level.',
  className,
}: PriceLadderProps) {
  // Every price prints to the book's own precision, so the column aligns on
  // the decimal point instead of ragging (135.4 above 135.35).
  const priceDp = useMemo(
    () =>
      Math.min(
        8,
        Math.max(
          0,
          ...[...asks.slice(0, depth), ...bids.slice(0, depth)].map((l) => {
            const text = String(l.price);
            // Exponent notation (1e-7) means a tiny price: show full precision.
            return text.includes('e') ? 8 : (text.split('.')[1] ?? '').length;
          }),
        ),
      ),
    [asks, bids, depth],
  );
  const px = (n: number) =>
    n.toLocaleString('en-US', { maximumFractionDigits: priceDp, minimumFractionDigits: priceDp });

  const askRows = useMemo(() => withDepth(asks, depth), [asks, depth]);
  const bidRows = useMemo(() => withDepth(bids, depth), [bids, depth]);
  const deepest = Math.max(
    askRows[askRows.length - 1]?.cumulative ?? 0,
    bidRows[bidRows.length - 1]?.cumulative ?? 0,
    Number.EPSILON,
  );

  const bestAsk = asks[0]?.price;
  const bestBid = bids[0]?.price;
  const spread = bestAsk !== undefined && bestBid !== undefined ? bestAsk - bestBid : undefined;
  const spreadPct = spread !== undefined && bestBid ? (spread / bestBid) * 100 : undefined;
  const mid = lastPrice || (bestBid ?? bestAsk ?? 0);

  const head = (
    <Head>
      <span>Price{priceUnit ? ` (${priceUnit})` : ''}</span>
      <span>Amount{amountUnit ? ` (${amountUnit})` : ''}</span>
      <span>Total</span>
    </Head>
  );

  if (loading) {
    return (
      <Root className={className} aria-busy="true">
        {head}
        {Array.from({ length: 10 }, (_, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: static placeholder rows
          <SkeletonRow key={i}>
            <Skeleton variant="text" width="70%" />
            <Skeleton variant="text" width="60%" sx={{ justifySelf: 'end' }} />
            <Skeleton variant="text" width="50%" sx={{ justifySelf: 'end' }} />
          </SkeletonRow>
        ))}
      </Root>
    );
  }

  if (!asks.length && !bids.length) {
    return (
      <Root className={className}>
        <EmptyState
          compact
          icons={[Layers, BookOpen, TrendingUp]}
          title={emptyTitle}
          description={emptyDescription}
        />
      </Root>
    );
  }

  const row = (level: (typeof askRows)[number], side: 'buy' | 'sell', key: string) => (
    <Row
      key={key}
      $side={side}
      $interactive={Boolean(onSelectPrice)}
      {...(onSelectPrice
        ? {
            'aria-label': `${side === 'sell' ? 'Ask' : 'Bid'} ${fmt(level.price)} for ${fmt(level.amount)}`,
            as: 'button' as const,
            onClick: () => onSelectPrice(level.price, side),
            type: 'button' as const,
          }
        : {})}
    >
      <Bar $side={side} style={{ transform: `scaleX(${level.cumulative / deepest})` }} />
      <span>{px(level.price)}</span>
      <span>{compact(level.amount)}</span>
      <span>{compact(level.price * level.amount)}</span>
    </Row>
  );

  return (
    <Root className={className}>
      {head}
      <Side $asks aria-label="Asks">
        {askRows.map((level, i) => row(level, 'sell', `a-${level.price}-${i}`))}
      </Side>
      <Seam>
        <Last>
          <AnimatedNumber value={mid} decimals={priceDp || 2} minDecimals={priceDp || 2} />
        </Last>
        <Quiet>
          {spreadPct !== undefined ? (
            <>
              Spread <AnimatedNumber value={spreadPct} decimals={2} suffix="%" />
            </>
          ) : (
            'One-sided book'
          )}
        </Quiet>
      </Seam>
      <Side aria-label="Bids">
        {bidRows.map((level, i) => row(level, 'buy', `b-${level.price}-${i}`))}
      </Side>
    </Root>
  );
}

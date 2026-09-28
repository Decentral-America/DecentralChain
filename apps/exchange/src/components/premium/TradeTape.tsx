/**
 * Trade tape — recent fills as a quiet streaming list. New rows slide in from
 * the top and their price cell carries a brief tone-tinted wash that fades on
 * its own, so a fresh print is noticed without anything flashing.
 *
 * Ported from 21st.dev "Streaming Data Rows" by @rmahammad (demo 29368):
 * popLayout insertion, a single non-flashing highlight, and reduced-motion
 * support. The table chrome, sorting and status pills are dropped because a
 * tape only ever needs price, size and time.
 */
import { Skeleton } from '@mui/material';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { type ReactNode } from 'react';
import styled from 'styled-components';

export interface TapeTrade {
  id: string;
  side: 'buy' | 'sell';
  price: number;
  amount: number;
  timestamp: number;
}

export interface TradeTapeProps {
  trades: TapeTrade[];
  loading?: boolean | undefined;
  priceUnit?: string | undefined;
  amountUnit?: string | undefined;
  /** Rendered in place of the rows when there are none. */
  empty?: ReactNode | undefined;
  className?: string | undefined;
}

const COLUMNS = 'minmax(0, 1fr) minmax(0, 1fr) auto';

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
  gap: 12px;
  padding: 0 16px 8px;
  font-size: 12px;
  line-height: 16px;
  color: ${({ theme }) => theme.colors.textSecondary};
  flex-shrink: 0;

  & > span:not(:first-child) {
    text-align: right;
  }
`;

const List = styled.div`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  scrollbar-width: thin;
`;

const Row = styled(motion.div)`
  position: relative;
  display: grid;
  grid-template-columns: ${COLUMNS};
  gap: 12px;
  padding: 3px 16px;
  font-size: 13px;
  line-height: 18px;
  color: ${({ theme }) => theme.colors.text};
  transition: background-color 160ms cubic-bezier(0.32, 0.72, 0, 1);

  &:hover {
    background: color-mix(in srgb, ${({ theme }) => theme.colors.text} 5%, transparent);
  }

  & > span:not(:first-of-type) {
    text-align: right;
  }
`;

const Price = styled.span<{ $side: 'buy' | 'sell' }>`
  position: relative;
  font-weight: 500;
  color: ${({ theme, $side }) => ($side === 'buy' ? theme.colors.buy : theme.colors.sell)};
`;

const Wash = styled(motion.i)<{ $side: 'buy' | 'sell' }>`
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: ${({ theme, $side }) =>
    `color-mix(in srgb, ${$side === 'buy' ? theme.colors.buy : theme.colors.sell} 12%, transparent)`};
`;

const Time = styled.span`
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: 12px;
`;

const fmt = (n: number) =>
  n.toLocaleString('en-US', {
    maximumFractionDigits: Math.abs(n) >= 1000 ? 2 : 8,
    minimumFractionDigits: 0,
  });

const clock = (t: number) =>
  new Date(t).toLocaleTimeString([], {
    hour: '2-digit',
    hour12: false,
    minute: '2-digit',
    second: '2-digit',
  });

export function TradeTape({
  trades,
  loading,
  priceUnit,
  amountUnit,
  empty,
  className,
}: TradeTapeProps) {
  const reduced = useReducedMotion();

  const head = (
    <Head>
      <span>Price{priceUnit ? ` (${priceUnit})` : ''}</span>
      <span>Amount{amountUnit ? ` (${amountUnit})` : ''}</span>
      <span>Time</span>
    </Head>
  );

  if (loading) {
    return (
      <Root className={className} aria-busy="true">
        {head}
        {Array.from({ length: 8 }, (_, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: static placeholder rows
          <Row key={i} as="div">
            <Skeleton variant="text" width="70%" />
            <Skeleton variant="text" width="60%" sx={{ justifySelf: 'end' }} />
            <Skeleton variant="text" width={52} />
          </Row>
        ))}
      </Root>
    );
  }

  if (!trades.length) return <Root className={className}>{empty}</Root>;

  return (
    <Root className={className}>
      {head}
      <List>
        <AnimatePresence initial={false} mode="popLayout">
          {trades.map((trade) => (
            <Row
              key={trade.id}
              layout={!reduced}
              initial={reduced ? false : { opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
            >
              <Wash
                aria-hidden
                $side={trade.side}
                initial={reduced ? { opacity: 0 } : { opacity: 1 }}
                animate={{ opacity: 0 }}
                transition={{ duration: 1.4, ease: 'easeOut' }}
              />
              <Price $side={trade.side}>{fmt(trade.price)}</Price>
              <span>{fmt(trade.amount)}</span>
              <Time>{clock(trade.timestamp)}</Time>
            </Row>
          ))}
        </AnimatePresence>
      </List>
    </Root>
  );
}

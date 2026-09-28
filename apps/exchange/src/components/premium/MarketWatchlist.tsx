/**
 * Market watchlist — an Apple Stocks style list: symbol and name on the left,
 * an inline trend in the middle, price over a coloured change on the right,
 * each row a hairline-separated line in one grouped card.
 *
 * Ported from 21st.dev "Market Watchlist" by @ssychui (demo 22252). The trend
 * column renders only for rows that carry real history; a row without it
 * leaves the space empty rather than drawing a shape it does not have.
 */
import { type ReactNode } from 'react';
import styled from 'styled-components';
import { hasContent } from './hasContent';
import { Sparkline } from './Sparkline';

export interface WatchlistRow {
  id: string;
  symbol: string;
  name?: ReactNode | undefined;
  price: ReactNode;
  /** Percent change; its sign picks the colour. */
  change?: number | undefined;
  changeLabel?: ReactNode | undefined;
  /** Real price history only. Omit when there is none. */
  history?: number[] | undefined;
  meta?: ReactNode | undefined;
}

export interface MarketWatchlistProps {
  title?: string | undefined;
  caption?: ReactNode | undefined;
  rows: WatchlistRow[];
  onSelect?: (id: string) => void;
}

const Card = styled.section`
  border-radius: 16px;
  overflow: hidden;
  background: ${({ theme }) => theme.colors.surface};
  box-shadow: ${({ theme }) =>
    theme.mode === 'dark' ? `0 0 0 1px ${theme.colors.border}` : theme.shadows.md};
`;

const Head = styled.header`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  padding: 16px 20px 12px;

  h2 {
    margin: 0;
    font-size: 17px;
    font-weight: 600;
    letter-spacing: -0.02em;
    color: ${({ theme }) => theme.colors.text};
  }

  span {
    font-size: 13px;
    color: ${({ theme }) => theme.colors.textSecondary};
  }
`;

const List = styled.ul`
  margin: 0;
  padding: 0;
  list-style: none;
`;

const Row = styled.li<{ $interactive: boolean }>`
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 72px minmax(96px, auto);
  align-items: center;
  gap: 16px;
  padding: 12px 20px;
  cursor: ${({ $interactive }) => ($interactive ? 'pointer' : 'default')};
  font-variant-numeric: tabular-nums;
  transition: background-color 160ms cubic-bezier(0.32, 0.72, 0, 1);

  &:hover {
    background: color-mix(in srgb, ${({ theme }) => theme.colors.text} 4%, transparent);
  }

  &::before {
    content: '';
    position: absolute;
    top: 0;
    right: 0;
    left: 20px;
    border-top: 1px solid ${({ theme }) => theme.colors.border};
  }

  @media (max-width: 420px) {
    grid-template-columns: minmax(0, 1fr) minmax(88px, auto);

    & > [data-trend] {
      display: none;
    }
  }
`;

const Ticker = styled.div`
  font-size: 15px;
  font-weight: 600;
  letter-spacing: -0.01em;
  color: ${({ theme }) => theme.colors.text};
`;

const Sub = styled.div`
  margin-top: 2px;
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textSecondary};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const Right = styled.div`
  text-align: right;
`;

const Price = styled.div`
  font-size: 15px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.text};
`;

const Change = styled.div<{ $tone: 'up' | 'down' | 'flat' }>`
  margin-top: 2px;
  font-size: 13px;
  font-weight: 500;
  color: ${({ theme, $tone }) =>
    $tone === 'up'
      ? theme.colors.buy
      : $tone === 'down'
        ? theme.colors.sell
        : theme.colors.textSecondary};
`;

export function MarketWatchlist({ title, caption, rows, onSelect }: MarketWatchlistProps) {
  return (
    <Card>
      {title ? (
        <Head>
          <h2>{title}</h2>
          {hasContent(caption) ? <span>{caption}</span> : null}
        </Head>
      ) : null}
      <List>
        {rows.map((row) => {
          const tone =
            row.change === undefined || row.change === 0 ? 'flat' : row.change > 0 ? 'up' : 'down';
          return (
            <Row
              key={row.id}
              $interactive={Boolean(onSelect)}
              onClick={onSelect ? () => onSelect(row.id) : undefined}
            >
              <div style={{ minWidth: 0 }}>
                <Ticker>{row.symbol}</Ticker>
                {row.name ? <Sub>{row.name}</Sub> : null}
              </div>
              <div data-trend>
                {row.history ? <Sparkline values={row.history} width={72} height={24} /> : null}
              </div>
              <Right>
                <Price>{row.price}</Price>
                {row.changeLabel !== undefined ? (
                  <Change $tone={tone}>{row.changeLabel}</Change>
                ) : null}
                {row.meta ? <Sub>{row.meta}</Sub> : null}
              </Right>
            </Row>
          );
        })}
      </List>
    </Card>
  );
}

/**
 * Balance hero: the figure, a timeframe control and the balance-history area
 * chart under them.
 *
 * This used to fill the chart with random points around the current balance
 * ("mock data with slight variations"), which drew a market that never
 * happened under a real number. There is no balance-history endpoint in the
 * data service yet, so the chart now receives whatever real series the caller
 * has and otherwise draws its honest empty baseline. When an endpoint lands,
 * pass its points as `history`, keyed by the selected range.
 */
import { type ReactNode, useState } from 'react';
import styled from 'styled-components';
import { AreaChart, type AreaPoint } from '@/components/premium/AreaChart';
import { SegmentedControl } from '@/components/premium/SegmentedControl';

export type BalanceRange = '1D' | '1W' | '1M' | '1Y';

const RANGES: { value: BalanceRange; label: string }[] = [
  { label: '1D', value: '1D' },
  { label: '1W', value: '1W' },
  { label: '1M', value: '1M' },
  { label: '1Y', value: '1Y' },
];

interface BalanceChartProps {
  /** The hero figure block, drawn at the top left. */
  figure: ReactNode;
  /** Real balance points per range. Omit when there is no source. */
  history?: Partial<Record<BalanceRange, AreaPoint[]>>;
  unit?: string;
  height?: number;
}

const Head = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
`;

const Plot = styled.div`
  margin-top: 16px;
  flex: 1;
  min-height: 0;
`;

export function BalanceChart({ figure, history, unit = 'DCC', height = 200 }: BalanceChartProps) {
  const [range, setRange] = useState<BalanceRange>('1W');
  const data = history?.[range] ?? [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Head>
        <div style={{ minWidth: 0 }}>{figure}</div>
        <SegmentedControl
          size="sm"
          label="Balance history range"
          options={RANGES}
          value={range}
          onValueChange={setRange}
        />
      </Head>
      <Plot>
        <AreaChart
          data={data}
          height={height}
          aria-label="Balance history"
          emptyLabel="Balance history will appear here once it is available"
          formatValue={(v) =>
            `${v.toLocaleString(undefined, { maximumFractionDigits: 4 })} ${unit}`
          }
        />
      </Plot>
    </div>
  );
}

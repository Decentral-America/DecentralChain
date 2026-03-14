/**
 * BalanceChart Component
 * Historical balance chart with timeframe selection (hour, day, week, month)
 * Uses Victory Charts (React 19 compatible)
 */
import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import styled from 'styled-components';
import { VictoryChart, VictoryLine, VictoryAxis, VictoryTheme } from 'victory';
import { Spinner } from '@/components/atoms/Spinner';

type ChartMode = 'hour' | 'day' | 'week' | 'month';

interface BalanceChartProps {
  totalBalance: number; // Total DCC balance in DCC (not wavelets)
}

interface ChartDataPoint {
  timestamp: number;
  balance: number;
  dateLabel: string;
}

export function BalanceChart({ totalBalance }: BalanceChartProps) {
  const [chartMode, setChartMode] = useState<ChartMode>('week');

  // Fetch historical balance data
  // Note: Currently mocking data since blockchain API may not have this endpoint
  // TODO: Implement real historical balance fetching from data-service
  const { data, isLoading } = useQuery({
    queryKey: ['balance-chart', chartMode, totalBalance],
    queryFn: () => fetchHistoricalBalance(totalBalance, chartMode),
    refetchInterval: 15000, // Refetch every 15 seconds
    staleTime: 10000, // Data considered fresh for 10 seconds
  });

  // Stabilize chart data to prevent Recharts re-render loops
  const chartData = useMemo(() => {
    if (!data) return [];
    // Create stable array reference with stable object references
    return data.map((item: ChartDataPoint) => ({
      timestamp: item.timestamp,
      balance: item.balance,
    }));
  }, [data]);

  const formatXAxis = (timestamp: number) => {
    const date = new Date(timestamp);
    switch (chartMode) {
      case 'hour':
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      case 'day':
        return date.toLocaleTimeString('en-US', { hour: '2-digit' });
      case 'week':
      case 'month':
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const formatYAxis = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
    return value.toFixed(0);
  };

  return (
    <ChartContainer>
      <ChartHeader>
        <ChartTitle>Balance History</ChartTitle>
        <TimeframeButtons>
          <TimeButton $active={chartMode === 'hour'} onClick={() => setChartMode('hour')}>
            1H
          </TimeButton>
          <TimeButton $active={chartMode === 'day'} onClick={() => setChartMode('day')}>
            1D
          </TimeButton>
          <TimeButton $active={chartMode === 'week'} onClick={() => setChartMode('week')}>
            1W
          </TimeButton>
          <TimeButton $active={chartMode === 'month'} onClick={() => setChartMode('month')}>
            1M
          </TimeButton>
        </TimeframeButtons>
      </ChartHeader>

      {isLoading ? (
        <LoadingContainer>
          <Spinner size="lg" />
        </LoadingContainer>
      ) : (
        <ChartWrapper>
          <VictoryChart
            theme={VictoryTheme.material}
            height={300}
            padding={{ top: 20, bottom: 50, left: 60, right: 20 }}
          >
            <VictoryAxis
              tickFormat={(t) => formatXAxis(t)}
              style={{
                tickLabels: { fontSize: 12, fill: '#666' },
                axis: { stroke: '#E0E0E0' },
              }}
            />
            <VictoryAxis
              dependentAxis
              tickFormat={(t) => formatYAxis(t)}
              style={{
                tickLabels: { fontSize: 12, fill: '#666' },
                axis: { stroke: '#E0E0E0' },
                grid: { stroke: '#E0E0E0', strokeDasharray: '3,3' },
              }}
            />
            <VictoryLine
              data={chartData}
              x="timestamp"
              y="balance"
              style={{
                data: { stroke: '#1976D2', strokeWidth: 2 },
              }}
            />
          </VictoryChart>
        </ChartWrapper>
      )}
    </ChartContainer>
  );
}

/**
 * Fetch historical balance data
 * TODO: Replace with real data-service API call when available
 * Currently generates mock data based on current balance
 */
async function fetchHistoricalBalance(
  currentBalance: number,
  mode: ChartMode
): Promise<ChartDataPoint[]> {
  // Calculate time intervals based on mode
  const now = Date.now();
  let points: number;
  let intervalMs: number;

  switch (mode) {
    case 'hour':
      points = 60; // 60 minutes
      intervalMs = 60 * 1000; // 1 minute
      break;
    case 'day':
      points = 24; // 24 hours
      intervalMs = 60 * 60 * 1000; // 1 hour
      break;
    case 'week':
      points = 7; // 7 days
      intervalMs = 24 * 60 * 60 * 1000; // 1 day
      break;
    case 'month':
      points = 30; // 30 days
      intervalMs = 24 * 60 * 60 * 1000; // 1 day
      break;
  }

  // Generate mock historical data with slight variations
  // TODO: Replace with: await ds.api.balance.getHistorical({ startDate, endDate, interval })
  const data: ChartDataPoint[] = [];
  const variance = currentBalance * 0.05; // ±5% variance

  for (let i = points - 1; i >= 0; i--) {
    const timestamp = now - i * intervalMs;
    const randomVariation = (Math.random() - 0.5) * variance;
    const balance = Math.max(0, currentBalance + randomVariation);
    const dateLabel = new Date(timestamp).toISOString();

    data.push({
      timestamp,
      balance,
      dateLabel,
    });
  }

  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 300));

  return data;
}

// Styled Components
const ChartContainer = styled.div`
  width: 100%;
  height: 100%;
  min-height: 400px;
  padding: 20px;
  background: ${(props) => props.theme.colors.background};
  border: 1px solid ${(props) => props.theme.colors.border};
  border-radius: 8px;
  display: flex;
  flex-direction: column;
`;

const ChartHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

const ChartTitle = styled.h3`
  font-size: ${(props) => props.theme.fontSizes.lg};
  font-weight: ${(props) => props.theme.fontWeights.semibold};
  color: ${(props) => props.theme.colors.text};
  margin: 0;
`;

const TimeframeButtons = styled.div`
  display: flex;
  gap: 8px;
`;

const TimeButton = styled.button<{ $active: boolean }>`
  padding: 6px 12px;
  background: ${(props) => (props.$active ? props.theme.colors.primary : 'transparent')};
  color: ${(props) => (props.$active ? 'white' : props.theme.colors.text)};
  border: 1px solid
    ${(props) => (props.$active ? props.theme.colors.primary : props.theme.colors.border)};
  border-radius: 4px;
  font-size: ${(props) => props.theme.fontSizes.sm};
  font-weight: ${(props) => props.theme.fontWeights.medium};
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: ${(props) =>
      props.$active ? props.theme.colors.primary : props.theme.colors.border};
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 300px;
`;

const ChartWrapper = styled.div`
  width: 100%;
  height: 100%;
  min-height: 300px;
`;

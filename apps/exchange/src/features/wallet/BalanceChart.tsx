/**
 * BalanceChart Component
 * Historical balance chart with timeframe selection (hour, day, week, month)
 * Uses Victory Charts (React 19 compatible)
 *
 * Historical balance API is not yet available on the DCC node.
 * When the endpoint exists, wire it up here.
 */

import { useState } from 'react';
import styled from 'styled-components';

type ChartMode = 'hour' | 'day' | 'week' | 'month';

interface BalanceChartProps {
  totalBalance: number; // Total DCC balance in DCC (not wavelets)
}

export function BalanceChart({ totalBalance: _totalBalance }: BalanceChartProps) {
  const [chartMode, setChartMode] = useState<ChartMode>('week');

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
      <UnavailableContainer>
        <UnavailableMessage>Historical balance data is not yet available.</UnavailableMessage>
      </UnavailableContainer>
    </ChartContainer>
  );
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

const UnavailableContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 300px;
`;

const UnavailableMessage = styled.p`
  color: ${(props) => props.theme.colors.text};
  opacity: 0.5;
  font-size: ${(props) => props.theme.fontSizes.sm};
  text-align: center;
`;

/**
 * TradeHistory Component
 * Displays recent trades for the selected trading pair
 * Shows price, amount, time, and trade direction (buy/sell)
 */
import React from 'react';
import styled from 'styled-components';
import { useTradeHistory } from '@/api/services/matcherService';
import { Spinner } from '@/components/atoms/Spinner';
import { useDexStore } from '@/stores/dexStore';

/**
 * Trade history container
 */
const TradeHistoryContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  background: ${(p) => p.theme.colors.background};
`;

/**
 * Header
 */
const Header = styled.div`
  padding: ${(p) => p.theme.spacing.md};
  border-bottom: 1px solid ${(p) => p.theme.colors.border};
`;

/**
 * Title
 */
const Title = styled.h4`
  font-size: ${(p) => p.theme.fontSizes.md};
  font-weight: ${(p) => p.theme.fontWeights.semibold};
  color: ${(p) => p.theme.colors.text};
  margin: 0;
`;

/**
 * Column headers
 */
const ColumnHeaders = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  padding: ${(p) => p.theme.spacing.sm} ${(p) => p.theme.spacing.md};
  font-size: ${(p) => p.theme.fontSizes.xs};
  font-weight: ${(p) => p.theme.fontWeights.medium};
  color: ${(p) => p.theme.colors.text};
  opacity: 0.6;
  text-transform: uppercase;
  border-bottom: 1px solid ${(p) => p.theme.colors.border};
`;

/**
 * Column header
 */
const ColumnHeader = styled.div<{ $align?: 'left' | 'center' | 'right' }>`
  text-align: ${(p) => p.$align || 'left'};
`;

/**
 * Trades list
 */
const TradesList = styled.div`
  flex: 1;
  overflow-y: auto;

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
 * Trade row
 */
const TradeRow = styled.div<{ $type: 'buy' | 'sell' }>`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  padding: ${(p) => p.theme.spacing.xs} ${(p) => p.theme.spacing.md};
  font-size: ${(p) => p.theme.fontSizes.sm};
  border-bottom: 1px solid ${(p) => p.theme.colors.border}10;
  transition: background 0.2s;

  &:hover {
    background: ${(p) => p.theme.colors.secondary}30;
  }
`;

/**
 * Trade cell
 */
const TradeCell = styled.div<{
  $type?: 'buy' | 'sell';
  $align?: 'left' | 'center' | 'right';
}>`
  text-align: ${(p) => p.$align || 'left'};
  color: ${(p) => {
    if (!p.$type) return p.theme.colors.text;
    return p.$type === 'buy' ? p.theme.colors.success : p.theme.colors.error;
  }};
  font-family: ${(p) => p.theme.fonts.mono};
`;

/**
 * Time cell with secondary color
 */
const TimeCell = styled.div`
  text-align: right;
  color: ${(p) => p.theme.colors.text};
  opacity: 0.7;
  font-size: ${(p) => p.theme.fontSizes.xs};
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
 * Error state
 */
const ErrorState = styled.div`
  padding: ${(p) => p.theme.spacing.md};
  color: ${(p) => p.theme.colors.error};
  font-size: ${(p) => p.theme.fontSizes.sm};
  text-align: center;
`;

/**
 * Trade interface
 */
interface Trade {
  id: string;
  type: 'buy' | 'sell';
  price: string;
  amount: string;
  timestamp: number;
}

/**
 * TradeHistory Component
 */
export const TradeHistory: React.FC = () => {
  const { selectedPair } = useDexStore();

  /**
   * Fetch recent trades for selected pair using real API
   */
  const {
    data: tradesData,
    isLoading,
    error,
  } = useTradeHistory(
    selectedPair?.amountAsset || '',
    selectedPair?.priceAsset || '',
    50,
    { enabled: !!selectedPair, refetchInterval: 10000 }, // Poll every 10 seconds like Angular
  );

  // Transform API data to component format
  const trades: Trade[] = React.useMemo(() => {
    if (!tradesData) return [];
    return tradesData.map((trade) => ({
      amount: trade.amount.toString(),
      id: trade.id,
      price: trade.price.toString(),
      timestamp: trade.timestamp,
      type: trade.type,
    }));
  }, [tradesData]);

  /**
   * Format number with appropriate decimals
   */
  const formatNumber = (value: string | number, decimals: number = 8): string => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (Number.isNaN(num)) return '0.00000000';
    return num.toFixed(decimals);
  };

  /**
   * Format timestamp to time string
   */
  const formatTime = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  if (!selectedPair) {
    return (
      <TradeHistoryContainer>
        <Header>
          <Title>Trade History</Title>
        </Header>
        <EmptyState>Please select a trading pair</EmptyState>
      </TradeHistoryContainer>
    );
  }

  if (isLoading) {
    return (
      <TradeHistoryContainer>
        <Header>
          <Title>Trade History</Title>
        </Header>
        <LoadingState>
          <Spinner size="md" />
        </LoadingState>
      </TradeHistoryContainer>
    );
  }

  if (error) {
    return (
      <TradeHistoryContainer>
        <Header>
          <Title>Trade History</Title>
        </Header>
        <ErrorState>Failed to load trade history</ErrorState>
      </TradeHistoryContainer>
    );
  }

  const hasTrades = trades && trades.length > 0;

  return (
    <TradeHistoryContainer>
      {/* Header */}
      <Header>
        <Title>Trade History</Title>
      </Header>

      {/* Column Headers */}
      <ColumnHeaders>
        <ColumnHeader $align="left">Price</ColumnHeader>
        <ColumnHeader $align="right">Amount</ColumnHeader>
        <ColumnHeader $align="right">Time</ColumnHeader>
      </ColumnHeaders>

      {/* Trades List */}
      <TradesList>
        {!hasTrades ? (
          <EmptyState>No recent trades</EmptyState>
        ) : (
          trades.map((trade) => (
            <TradeRow key={trade.id} $type={trade.type}>
              <TradeCell $type={trade.type} $align="left">
                {formatNumber(trade.price)}
              </TradeCell>
              <TradeCell $align="right">{formatNumber(trade.amount)}</TradeCell>
              <TimeCell>{formatTime(trade.timestamp)}</TimeCell>
            </TradeRow>
          ))
        )}
      </TradesList>
    </TradeHistoryContainer>
  );
};

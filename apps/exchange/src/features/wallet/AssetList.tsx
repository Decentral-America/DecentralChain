/**
 * AssetList Component
 * Scrollable list of user assets with balances and values
 */
import { useQuery } from '@tanstack/react-query';
import styled from 'styled-components';
import { Spinner } from '@/components/atoms/Spinner';
import { Stack } from '@/components/atoms/Stack';
import { useAuth } from '@/contexts/AuthContext';
import { type Asset, AssetCard } from './AssetCard';

const AssetListContainer = styled.div`
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
`;

const LoadingWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
`;

const ErrorMessage = styled.div`
  padding: ${(p) => p.theme.spacing.lg};
  text-align: center;
  color: ${(p) => p.theme.colors.error};
  background-color: ${(p) => p.theme.colors.error}10;
  border-radius: ${(p) => p.theme.radii.md};
`;

const EmptyState = styled.div`
  padding: ${(p) => p.theme.spacing.xl};
  text-align: center;
  color: ${(p) => p.theme.colors.text};
  opacity: 0.6;
`;

const ListHeader = styled.div`
  font-size: ${(p) => p.theme.fontSizes.lg};
  font-weight: ${(p) => p.theme.fontWeights.semibold};
  color: ${(p) => p.theme.colors.text};
  margin-bottom: ${(p) => p.theme.spacing.md};
`;

export const AssetList = () => {
  const { user } = useAuth();

  // Fetch assets with React Query
  const {
    data: assets,
    isLoading,
    error,
  } = useQuery<Asset[]>({
    enabled: !!user?.address,
    queryFn: async () => {
      // Mock data for now - will be replaced with actual API call
      // TODO: Replace with actual API endpoint when backend is ready
      return new Promise<Asset[]>((resolve) => {
        setTimeout(() => {
          resolve([
            {
              balance: 25000.5,
              change24h: 5.23,
              decimals: 8,
              id: 'DCC',
              name: 'DecentralChain',
              symbol: 'DCC',
              usdValue: 12548.75,
            },
            {
              balance: 1000.0,
              change24h: 0.01,
              decimals: 6,
              id: 'USDT',
              name: 'Tether USD',
              symbol: 'USDT',
              usdValue: 1000.0,
            },
            {
              balance: 0.05,
              change24h: -2.15,
              decimals: 8,
              id: 'BTC',
              name: 'Bitcoin',
              symbol: 'BTC',
              usdValue: 2250.0,
            },
            {
              balance: 1.25,
              change24h: 3.47,
              decimals: 18,
              id: 'ETH',
              name: 'Ethereum',
              symbol: 'ETH',
              usdValue: 2125.0,
            },
            {
              balance: 5000.0,
              change24h: 12.8,
              decimals: 2,
              id: 'CRC',
              name: 'CRC Token',
              symbol: 'CRC',
              usdValue: 500.0,
            },
          ]);
        }, 800);
      });
    },
    queryKey: ['assets', user?.address],
    refetchInterval: 60000, // Refetch every minute
    staleTime: 30000, // Consider data fresh for 30 seconds
  });

  if (isLoading) {
    return (
      <AssetListContainer>
        <LoadingWrapper>
          <Spinner size="lg" />
        </LoadingWrapper>
      </AssetListContainer>
    );
  }

  if (error) {
    return (
      <AssetListContainer>
        <ErrorMessage>
          Failed to load assets. Please try again later.
          {error instanceof Error && <div>{error.message}</div>}
        </ErrorMessage>
      </AssetListContainer>
    );
  }

  if (!assets || assets.length === 0) {
    return (
      <AssetListContainer>
        <EmptyState>No assets found in your wallet.</EmptyState>
      </AssetListContainer>
    );
  }

  return (
    <AssetListContainer>
      <ListHeader>Your Assets ({assets.length})</ListHeader>
      <Stack gap="0.5rem">
        {assets.map((asset) => (
          <AssetCard key={asset.id} asset={asset} />
        ))}
      </Stack>
    </AssetListContainer>
  );
};

/**
 * AssetList Component
 * Scrollable list of user assets with real balances fetched from the DCC node
 */
import { useMemo } from 'react';
import styled from 'styled-components';
import { waveletsToCoins } from '@/api/services/addressService';
import { useMultipleAssetDetails } from '@/api/services/assetsService';
import { Spinner } from '@/components/atoms/Spinner';
import { Stack } from '@/components/atoms/Stack';
import { useBalanceWatcher } from '@/hooks/useBalanceWatcher';
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
  const { balances, isLoading, error } = useBalanceWatcher({ interval: 10000 });

  const assetEntries = useMemo(
    () => Object.entries(balances?.assets ?? {}) as Array<[string, number]>,
    [balances?.assets],
  );
  const assetIds = useMemo(() => assetEntries.map(([id]) => id), [assetEntries]);

  const { data: assetDetails, isLoading: isDetailsLoading } = useMultipleAssetDetails(assetIds, {
    enabled: assetIds.length > 0,
  });

  const assets = useMemo<Asset[]>(() => {
    const assetDetailMap = new Map((assetDetails ?? []).map((d) => [d.assetId, d]));

    const dccRow: Asset = {
      balance: waveletsToCoins(balances?.available ?? balances?.balance ?? 0),
      decimals: 8,
      id: 'DCC',
      name: 'DecentralChain',
      symbol: 'DCC',
    };

    const tokenRows: Asset[] = assetEntries.map(([assetId, rawBalance]) => {
      const detail = assetDetailMap.get(assetId);
      const decimals = detail?.decimals ?? 8;
      return {
        balance: rawBalance / 10 ** decimals,
        decimals,
        id: assetId,
        name: detail?.name ?? assetId,
        symbol: detail?.name ?? assetId.slice(0, 8),
      } satisfies Asset;
    });

    return [dccRow, ...tokenRows];
  }, [balances, assetEntries, assetDetails]);

  if (isLoading || isDetailsLoading) {
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

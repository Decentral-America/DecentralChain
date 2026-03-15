/**
 * Asset Info Component
 * Displays comprehensive asset information and metadata
 * Shows all asset details including name, description, supply, and properties
 */
import type React from 'react';
import styled from 'styled-components';
import { useAssetDetails } from '@/api/services/assetsService';
import { Card } from '@/components/atoms/Card';
import { Spinner } from '@/components/atoms/Spinner';

/**
 * Component Props
 */
export interface AssetInfoProps {
  assetId: string;
  showIssuer?: boolean;
  showTimestamp?: boolean;
  compact?: boolean;
}

/**
 * Styled Components
 */
const Container = styled(Card as React.ComponentType<Record<string, unknown>>)`
  max-width: 600px;
`;

const Header = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing.lg};
  padding-bottom: ${({ theme }) => theme.spacing.md};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
`;

const AssetName = styled.h3`
  margin: 0 0 ${({ theme }) => theme.spacing.xs};
  font-size: 24px;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.text};
`;

const AssetId = styled.div`
  font-size: 12px;
  font-family: monospace;
  color: ${({ theme }) => theme.colors.disabled};
  word-break: break-all;
`;

const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: ${({ theme }) => theme.spacing.md};
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const InfoItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xs};
`;

const InfoLabel = styled.span`
  font-size: 12px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.disabled};
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const InfoValue = styled.span`
  font-size: 16px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text};
  word-break: break-word;
`;

const Description = styled.p`
  margin: ${({ theme }) => theme.spacing.md} 0;
  padding: ${({ theme }) => theme.spacing.md};
  background-color: ${({ theme }) => theme.colors.background};
  border-radius: ${({ theme }) => theme.radii.md};
  border: 1px solid ${({ theme }) => theme.colors.border};
  font-size: 14px;
  line-height: 1.6;
  color: ${({ theme }) => theme.colors.text};
  white-space: pre-wrap;
`;

const Badge = styled.span<{ variant: 'success' | 'warning' | 'info' }>`
  display: inline-block;
  padding: 4px 12px;
  border-radius: ${({ theme }) => theme.radii.sm};
  font-size: 12px;
  font-weight: 600;
  background-color: ${({ theme, variant }) => {
    switch (variant) {
      case 'success':
        return `${theme.colors.success}20`;
      case 'warning':
        return `${theme.colors.warning}20`;
      case 'info':
        return `${theme.colors.info}20`;
    }
  }};
  color: ${({ theme, variant }) => {
    switch (variant) {
      case 'success':
        return theme.colors.success;
      case 'warning':
        return theme.colors.warning;
      case 'info':
        return theme.colors.info;
    }
  }};
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: ${({ theme }) => theme.spacing.xl};
`;

const ErrorMessage = styled.div`
  padding: ${({ theme }) => theme.spacing.md};
  background-color: ${({ theme }) => theme.colors.error}20;
  border-radius: ${({ theme }) => theme.radii.md};
  color: ${({ theme }) => theme.colors.error};
  font-size: 14px;
`;

/**
 * Format large numbers with thousands separators
 */
const formatNumber = (num: number): string => {
  return num.toLocaleString();
};

/**
 * Format timestamp to readable date
 */
const formatTimestamp = (timestamp: number): string => {
  return new Date(timestamp).toLocaleDateString(undefined, {
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    month: 'long',
    year: 'numeric',
  });
};

/**
 * Calculate actual quantity with decimals
 */
const formatQuantity = (quantity: number, decimals: number): string => {
  const actualQuantity = quantity / 10 ** decimals;
  return formatNumber(actualQuantity);
};

/**
 * Asset Info Component
 *
 * @example
 * ```tsx
 * <AssetInfo assetId="DG2xFkPdDwKUoBkzGAhQtLpSGzfXLiCYPEzeKH2Ad24p" />
 * ```
 *
 * @example Compact mode
 * ```tsx
 * <AssetInfo
 *   assetId="DG2xFkPdDwKUoBkzGAhQtLpSGzfXLiCYPEzeKH2Ad24p"
 *   compact
 *   showIssuer={false}
 * />
 * ```
 */
export const AssetInfo: React.FC<AssetInfoProps> = ({
  assetId,
  showIssuer = true,
  showTimestamp = true,
  compact = false,
}) => {
  const { data: asset, isLoading, error } = useAssetDetails(assetId);

  if (isLoading) {
    return (
      <Container>
        <LoadingContainer>
          <Spinner size="lg" />
        </LoadingContainer>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <ErrorMessage>Failed to load asset information: {error.message}</ErrorMessage>
      </Container>
    );
  }

  if (!asset) {
    return (
      <Container>
        <ErrorMessage>Asset not found</ErrorMessage>
      </Container>
    );
  }

  return (
    <Container elevation="md" bordered={false}>
      <Header>
        <AssetName>{asset.name}</AssetName>
        {!compact && <AssetId>ID: {asset.assetId}</AssetId>}
      </Header>

      {asset.description && <Description>{asset.description}</Description>}

      <InfoGrid>
        <InfoItem>
          <InfoLabel>Total Supply</InfoLabel>
          <InfoValue>{formatQuantity(asset.quantity, asset.decimals)}</InfoValue>
        </InfoItem>

        <InfoItem>
          <InfoLabel>Decimals</InfoLabel>
          <InfoValue>{asset.decimals}</InfoValue>
        </InfoItem>

        <InfoItem>
          <InfoLabel>Reissuable</InfoLabel>
          <InfoValue>
            <Badge variant={asset.reissuable ? 'success' : 'warning'}>
              {asset.reissuable ? 'Yes' : 'No'}
            </Badge>
          </InfoValue>
        </InfoItem>

        <InfoItem>
          <InfoLabel>Scripted</InfoLabel>
          <InfoValue>
            <Badge variant={asset.scripted ? 'info' : 'success'}>
              {asset.scripted ? 'Yes' : 'No'}
            </Badge>
          </InfoValue>
        </InfoItem>

        {showIssuer && (
          <InfoItem>
            <InfoLabel>Issuer</InfoLabel>
            <InfoValue style={{ fontFamily: 'monospace', fontSize: '12px' }}>
              {asset.issuer}
            </InfoValue>
          </InfoItem>
        )}

        {showTimestamp && (
          <InfoItem>
            <InfoLabel>Issue Date</InfoLabel>
            <InfoValue style={{ fontSize: '14px' }}>
              {formatTimestamp(asset.issueTimestamp)}
            </InfoValue>
          </InfoItem>
        )}

        {!compact && (
          <InfoItem>
            <InfoLabel>Issue Height</InfoLabel>
            <InfoValue>{formatNumber(asset.issueHeight)}</InfoValue>
          </InfoItem>
        )}

        {asset.minSponsoredAssetFee !== null && (
          <InfoItem>
            <InfoLabel>Min Sponsored Fee</InfoLabel>
            <InfoValue>{formatQuantity(asset.minSponsoredAssetFee, asset.decimals)}</InfoValue>
          </InfoItem>
        )}
      </InfoGrid>

      {!compact && (
        <InfoItem style={{ marginTop: '16px' }}>
          <InfoLabel>Origin Transaction</InfoLabel>
          <InfoValue style={{ fontFamily: 'monospace', fontSize: '12px' }}>
            {asset.originTransactionId}
          </InfoValue>
        </InfoItem>
      )}
    </Container>
  );
};

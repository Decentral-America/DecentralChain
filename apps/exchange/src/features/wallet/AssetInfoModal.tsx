/**
 * AssetInfoModal Component
 * Displays detailed asset information including blockchain metadata
 * Matches Angular modalManager.showAssetInfo functionality
 */

import { useQuery } from '@tanstack/react-query';
import * as ds from 'data-service';
import styled from 'styled-components';
import { Spinner } from '@/components/atoms/Spinner';
import { Modal } from '@/components/organisms/Modal';
import { useClipboard } from '@/hooks/useClipboard';
import { logger } from '@/lib/logger';

interface AssetInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  assetId: string;
}

interface AssetInfoData {
  name?: string;
  description?: string;
  quantity?: number | string;
  precision?: number;
  reissuable?: boolean;
  sender?: string;
  height?: number;
  timestamp?: number;
  hasScript?: boolean;
  minSponsoredFee?: number | string;
}

export function AssetInfoModal({ isOpen, onClose, assetId }: AssetInfoModalProps) {
  const { copyToClipboard } = useClipboard();

  // Fetch full asset details from blockchain
  const { data: assetInfo, isLoading } = useQuery({
    queryKey: ['asset-info', assetId],
    queryFn: async () => {
      return (await ds.api.assets.get(assetId)) as AssetInfoData;
    },
    enabled: isOpen && !!assetId,
    staleTime: 60000, // Cache for 1 minute
  });

  const handleCopy = (text: string, label: string) => {
    copyToClipboard(text);
    logger.debug(`Copied ${label}: ${text}`);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Asset Information">
      {isLoading ? (
        <LoadingContainer>
          <Spinner size="lg" />
          <LoadingText>Loading asset details...</LoadingText>
        </LoadingContainer>
      ) : assetInfo ? (
        <InfoGrid>
          <InfoRow>
            <Label>Name:</Label>
            <Value>{assetInfo.name || 'Unnamed Asset'}</Value>
          </InfoRow>

          <InfoRow>
            <Label>Asset ID:</Label>
            <CopyableValue onClick={() => handleCopy(assetId, 'Asset ID')} title="Click to copy">
              {assetId}
            </CopyableValue>
          </InfoRow>

          <InfoRow>
            <Label>Description:</Label>
            <Value>{assetInfo.description || 'No description provided'}</Value>
          </InfoRow>

          <InfoRow>
            <Label>Total Supply:</Label>
            <Value>
              {(Number(assetInfo.quantity) / 10 ** (assetInfo.precision ?? 0)).toLocaleString(
                undefined,
                {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: assetInfo.precision ?? 0,
                },
              )}
            </Value>
          </InfoRow>

          <InfoRow>
            <Label>Decimals:</Label>
            <Value>{assetInfo.precision}</Value>
          </InfoRow>

          <InfoRow>
            <Label>Reissuable:</Label>
            <Value>{assetInfo.reissuable ? '✓ Yes' : '✗ No'}</Value>
          </InfoRow>

          <InfoRow>
            <Label>Issuer:</Label>
            <CopyableValue
              onClick={() => handleCopy(assetInfo.sender ?? '', 'Issuer')}
              title="Click to copy"
            >
              {assetInfo.sender}
            </CopyableValue>
          </InfoRow>

          <InfoRow>
            <Label>Issue Height:</Label>
            <Value>{assetInfo.height?.toLocaleString()}</Value>
          </InfoRow>

          <InfoRow>
            <Label>Issue Date:</Label>
            <Value>
              {assetInfo.timestamp ? new Date(assetInfo.timestamp).toLocaleString() : 'Unknown'}
            </Value>
          </InfoRow>

          {assetInfo.hasScript && (
            <InfoRow>
              <Label>Smart Asset:</Label>
              <Value>⚠️ Yes (has script attached)</Value>
            </InfoRow>
          )}

          {assetInfo.minSponsoredFee && (
            <InfoRow>
              <Label>Min Sponsored Fee:</Label>
              <Value>
                {(Number(assetInfo.minSponsoredFee) / 10 ** (assetInfo.precision ?? 0)).toFixed(
                  assetInfo.precision ?? 0,
                )}{' '}
                {assetInfo.name}
              </Value>
            </InfoRow>
          )}
        </InfoGrid>
      ) : (
        <ErrorMessage>Failed to load asset information</ErrorMessage>
      )}
    </Modal>
  );
}

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: ${(p) => p.theme.spacing.xl};
  gap: ${(p) => p.theme.spacing.md};
`;

const LoadingText = styled.div`
  color: ${(p) => p.theme.colors.text};
  opacity: 0.7;
`;

const InfoGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${(p) => p.theme.spacing.md};
  padding: ${(p) => p.theme.spacing.md};
`;

const InfoRow = styled.div`
  display: grid;
  grid-template-columns: 150px 1fr;
  gap: ${(p) => p.theme.spacing.md};
  align-items: start;
`;

const Label = styled.div`
  font-weight: ${(p) => p.theme.fontWeights.semibold};
  color: ${(p) => p.theme.colors.text};
  opacity: 0.7;
  font-size: ${(p) => p.theme.fontSizes.sm};
`;

const Value = styled.div`
  color: ${(p) => p.theme.colors.text};
  word-break: break-all;
  font-size: ${(p) => p.theme.fontSizes.sm};
  line-height: 1.5;
`;

const CopyableValue = styled(Value)`
  cursor: pointer;
  font-family: ${(p) => p.theme.fonts.mono};
  transition: color 0.2s;

  &:hover {
    color: ${(p) => p.theme.colors.primary};
  }
`;

const ErrorMessage = styled.div`
  padding: ${(p) => p.theme.spacing.lg};
  text-align: center;
  color: ${(p) => p.theme.colors.error};
`;

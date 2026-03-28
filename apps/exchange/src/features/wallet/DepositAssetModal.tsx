/**
 * Deposit Asset Modal
 * Modal for depositing crypto assets via gateway services
 * Matches Angular modalManager.showDepositAsset functionality
 */

import { useEffect, useState } from 'react';
import styled from 'styled-components';
import { Spinner } from '@/components/atoms/Spinner';
import { Modal } from '@/components/organisms/Modal';
import { useAuth } from '@/contexts/AuthContext';
import { useClipboard } from '@/hooks/useClipboard';
import { logger } from '@/lib/logger';
import gatewayService from '@/services/gateways/GatewayService';

interface DepositAssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  assetId: string;
  assetName?: string;
}

export function DepositAssetModal({ isOpen, onClose, assetId, assetName }: DepositAssetModalProps) {
  const { user } = useAuth();
  const { copyToClipboard } = useClipboard();
  const [depositAddress, setDepositAddress] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !user) return;

    setIsLoading(true);
    setError(null);

    // Fetch deposit address from gateway service
    gatewayService
      .getDepositDetails(
        {
          displayName: assetName ?? assetId,
          id: assetId,
          name: assetName ?? assetId,
          precision: 8,
        },
        user.address,
      )
      .then((details) => {
        if (details) {
          setDepositAddress(details.address);
        } else {
          setError('Deposit not available for this asset');
        }
      })
      .catch((err) => {
        logger.error('[DepositModal] Failed to fetch deposit address:', err);
        setError('Failed to load deposit information. Please try again.');
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [isOpen, assetId, assetName, user]);

  const handleCopy = () => {
    if (depositAddress) {
      copyToClipboard(depositAddress);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Deposit ${assetName ?? assetId}`}>
      {isLoading ? (
        <LoadingContainer>
          <Spinner size="lg" />
          <LoadingText>Loading deposit information...</LoadingText>
        </LoadingContainer>
      ) : error ? (
        <ErrorContainer>
          <ErrorIcon>⚠️</ErrorIcon>
          <ErrorText>{error}</ErrorText>
        </ErrorContainer>
      ) : (
        <DepositContent>
          <Warning>
            <WarningIcon>⚠️</WarningIcon>
            <WarningText>
              Only send <strong>{assetName ?? assetId}</strong> to this address. Sending other
              assets will result in permanent loss of funds.
            </WarningText>
          </Warning>

          <AddressSection>
            <Label>Deposit Address:</Label>
            <AddressContainer onClick={handleCopy} title="Click to copy">
              <Address>{depositAddress || 'No address available'}</Address>
              <CopyIcon>📋</CopyIcon>
            </AddressContainer>
          </AddressSection>

          <QRPlaceholder>
            <QRText>QR Code would display here</QRText>
            <QRSubtext>Scan to deposit {assetName ?? assetId}</QRSubtext>
          </QRPlaceholder>

          <InfoSection>
            <InfoItem>
              <InfoLabel>Network:</InfoLabel>
              <InfoValue>DecentralChain</InfoValue>
            </InfoItem>
            <InfoItem>
              <InfoLabel>Processing Time:</InfoLabel>
              <InfoValue>~2-10 minutes</InfoValue>
            </InfoItem>
            <InfoItem>
              <InfoLabel>Minimum Deposit:</InfoLabel>
              <InfoValue>Check gateway requirements</InfoValue>
            </InfoItem>
          </InfoSection>

          <Note>
            Note: Deposits are processed automatically. Your balance will update after network
            confirmation.
          </Note>
        </DepositContent>
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

const ErrorContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${(p) => p.theme.spacing.md};
  padding: ${(p) => p.theme.spacing.xl};
`;

const ErrorIcon = styled.div`
  font-size: 48px;
`;

const ErrorText = styled.div`
  color: ${(p) => p.theme.colors.error};
  text-align: center;
`;

const DepositContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${(p) => p.theme.spacing.lg};
  padding: ${(p) => p.theme.spacing.md};
`;

const Warning = styled.div`
  display: flex;
  gap: ${(p) => p.theme.spacing.sm};
  padding: ${(p) => p.theme.spacing.md};
  background: ${(p) => p.theme.colors.warning || '#fff3cd'};
  border: 1px solid ${(p) => (p.theme.colors as { warningBorder?: string; [key: string]: string | undefined }).warningBorder || '#ffc107'};
  border-radius: ${(p) => p.theme.radii.md};
`;

const WarningIcon = styled.div`
  font-size: 20px;
  flex-shrink: 0;
`;

const WarningText = styled.div`
  color: ${(p) => p.theme.colors.text};
  font-size: ${(p) => p.theme.fontSizes.sm};
  line-height: 1.5;
`;

const AddressSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${(p) => p.theme.spacing.sm};
`;

const Label = styled.div`
  font-weight: ${(p) => p.theme.fontWeights.semibold};
  color: ${(p) => p.theme.colors.text};
  font-size: ${(p) => p.theme.fontSizes.sm};
`;

const AddressContainer = styled.div`
  display: flex;
  align-items: center;
  gap: ${(p) => p.theme.spacing.sm};
  padding: ${(p) => p.theme.spacing.md};
  background: ${(p) => p.theme.colors.background};
  border: 1px solid ${(p) => p.theme.colors.border};
  border-radius: ${(p) => p.theme.radii.md};
  cursor: pointer;
  transition: ${(p) => p.theme.transitions.fast};

  &:hover {
    border-color: ${(p) => p.theme.colors.primary};
    background: ${(p) => p.theme.colors.hover || '#f5f5f5'};
  }
`;

const Address = styled.div`
  flex: 1;
  font-family: ${(p) => p.theme.fonts.mono};
  font-size: ${(p) => p.theme.fontSizes.sm};
  word-break: break-all;
  color: ${(p) => p.theme.colors.text};
`;

const CopyIcon = styled.div`
  font-size: 20px;
  flex-shrink: 0;
`;

const QRPlaceholder = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: ${(p) => p.theme.spacing.sm};
  padding: ${(p) => p.theme.spacing.xl};
  background: ${(p) => p.theme.colors.background};
  border: 2px dashed ${(p) => p.theme.colors.border};
  border-radius: ${(p) => p.theme.radii.md};
  min-height: 200px;
`;

const QRText = styled.div`
  font-size: ${(p) => p.theme.fontSizes.lg};
  color: ${(p) => p.theme.colors.text};
  opacity: 0.5;
`;

const QRSubtext = styled.div`
  font-size: ${(p) => p.theme.fontSizes.sm};
  color: ${(p) => p.theme.colors.text};
  opacity: 0.5;
`;

const InfoSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${(p) => p.theme.spacing.sm};
`;

const InfoItem = styled.div`
  display: flex;
  justify-content: space-between;
  padding: ${(p) => p.theme.spacing.sm} 0;
  border-bottom: 1px solid ${(p) => p.theme.colors.border};

  &:last-child {
    border-bottom: none;
  }
`;

const InfoLabel = styled.div`
  font-weight: ${(p) => p.theme.fontWeights.medium};
  color: ${(p) => p.theme.colors.text};
  opacity: 0.7;
`;

const InfoValue = styled.div`
  color: ${(p) => p.theme.colors.text};
`;

const Note = styled.div`
  font-size: ${(p) => p.theme.fontSizes.sm};
  color: ${(p) => p.theme.colors.text};
  opacity: 0.7;
  padding: ${(p) => p.theme.spacing.sm};
  background: ${(p) => p.theme.colors.background};
  border-radius: ${(p) => p.theme.radii.sm};
  border-left: 3px solid ${(p) => p.theme.colors.primary};
`;

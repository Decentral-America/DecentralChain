/**
 * Burn Asset Modal
 * Modal for permanently burning (destroying) user-issued tokens
 * Matches Angular modalManager.showBurnModal functionality
 */

import * as ds from 'data-service';
import { useState } from 'react';
import styled from 'styled-components';
import { Spinner } from '@/components/atoms/Spinner';
import { Modal } from '@/components/organisms/Modal';
import { useAuth } from '@/contexts/AuthContext';
import { logger } from '@/lib/logger';

interface BurnAssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  assetId: string;
  assetName?: string;
  availableBalance: number;
  decimals: number;
}

export function BurnAssetModal({
  isOpen,
  onClose,
  assetId,
  assetName,
  availableBalance,
  decimals,
}: BurnAssetModalProps) {
  const { user } = useAuth();
  const [amount, setAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const maxAmount = availableBalance / 10 ** decimals;

  const handleBurn = async () => {
    if (!user || !amount || parseFloat(amount) <= 0) return;

    setIsProcessing(true);
    setError(null);

    try {
      const quantityInMinimalUnits = Math.floor(parseFloat(amount) * 10 ** decimals);

      // Create burn transaction
      const tx = {
        assetId,
        fee: 100000, // 0.001 DCC
        quantity: quantityInMinimalUnits,
        senderPublicKey: user.publicKey,
        timestamp: Date.now(),
        type: 6, // Burn transaction type
        version: 2,
      };

      // Sign and broadcast transaction
      await ds.broadcast(tx);

      // Success - close modal
      onClose();
      setAmount('');
    } catch (err) {
      logger.error('[BurnAssetModal] Burn failed:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to burn tokens. Please check your balance and try again.',
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMaxClick = () => {
    setAmount(maxAmount.toString());
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow empty string or valid numbers
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setAmount(value);
      setError(null);
    }
  };

  const isValidAmount = amount && parseFloat(amount) > 0 && parseFloat(amount) <= maxAmount;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Burn ${assetName ?? assetId}`}>
      <Content>
        <Warning>
          <WarningIcon>🔥</WarningIcon>
          <WarningText>
            <strong>Warning:</strong> Burning tokens permanently destroys them from circulation.
            This action cannot be undone.
          </WarningText>
        </Warning>

        <FormSection>
          <Label>Amount to Burn</Label>
          <InputContainer>
            <Input
              type="text"
              placeholder="0.00"
              value={amount}
              onChange={handleAmountChange}
              disabled={isProcessing}
            />
            <MaxButton onClick={handleMaxClick} disabled={isProcessing}>
              MAX
            </MaxButton>
          </InputContainer>
          <BalanceInfo>
            Available: {maxAmount.toFixed(decimals)} {assetName ?? assetId}
          </BalanceInfo>
        </FormSection>

        {error && (
          <ErrorMessage>
            <ErrorIcon>⚠️</ErrorIcon>
            {error}
          </ErrorMessage>
        )}

        <InfoSection>
          <InfoRow>
            <InfoLabel>Asset ID:</InfoLabel>
            <InfoValue>{assetId}</InfoValue>
          </InfoRow>
          <InfoRow>
            <InfoLabel>Network Fee:</InfoLabel>
            <InfoValue>0.001 DCC</InfoValue>
          </InfoRow>
          {amount && (
            <InfoRow>
              <InfoLabel>Amount to Burn:</InfoLabel>
              <InfoValue $highlight>
                {parseFloat(amount).toFixed(decimals)} {assetName ?? assetId}
              </InfoValue>
            </InfoRow>
          )}
        </InfoSection>

        <ButtonGroup>
          <CancelButton onClick={onClose} disabled={isProcessing}>
            Cancel
          </CancelButton>
          <BurnButton onClick={handleBurn} disabled={!isValidAmount || isProcessing}>
            {isProcessing ? (
              <>
                <Spinner size="sm" />
                Burning...
              </>
            ) : (
              '🔥 Burn Tokens'
            )}
          </BurnButton>
        </ButtonGroup>
      </Content>
    </Modal>
  );
}

const Content = styled.div`
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
  border: 1px solid #ffc107;
  border-radius: ${(p) => p.theme.radii.md};
`;

const WarningIcon = styled.div`
  font-size: 24px;
  flex-shrink: 0;
`;

const WarningText = styled.div`
  color: ${(p) => p.theme.colors.text};
  font-size: ${(p) => p.theme.fontSizes.sm};
  line-height: 1.5;
`;

const FormSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${(p) => p.theme.spacing.sm};
`;

const Label = styled.label`
  font-weight: ${(p) => p.theme.fontWeights.semibold};
  color: ${(p) => p.theme.colors.text};
  font-size: ${(p) => p.theme.fontSizes.sm};
`;

const InputContainer = styled.div`
  display: flex;
  gap: ${(p) => p.theme.spacing.sm};
`;

const Input = styled.input`
  flex: 1;
  padding: ${(p) => p.theme.spacing.md};
  border: 1px solid ${(p) => p.theme.colors.border};
  border-radius: ${(p) => p.theme.radii.md};
  font-size: ${(p) => p.theme.fontSizes.md};
  background: ${(p) => p.theme.colors.background};
  color: ${(p) => p.theme.colors.text};

  &:focus {
    outline: none;
    border-color: ${(p) => p.theme.colors.primary};
    box-shadow: 0 0 0 2px ${(p) => p.theme.colors.primary}33;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const MaxButton = styled.button`
  padding: ${(p) => p.theme.spacing.sm} ${(p) => p.theme.spacing.md};
  background: ${(p) => p.theme.colors.primary};
  color: white;
  border: none;
  border-radius: ${(p) => p.theme.radii.md};
  font-weight: ${(p) => p.theme.fontWeights.semibold};
  cursor: pointer;
  transition: ${(p) => p.theme.transitions.fast};

  &:hover:not(:disabled) {
    opacity: 0.9;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const BalanceInfo = styled.div`
  font-size: ${(p) => p.theme.fontSizes.sm};
  color: ${(p) => p.theme.colors.text};
  opacity: 0.7;
`;

const ErrorMessage = styled.div`
  display: flex;
  align-items: center;
  gap: ${(p) => p.theme.spacing.sm};
  padding: ${(p) => p.theme.spacing.md};
  background: ${(p) => p.theme.colors.error}22;
  border: 1px solid ${(p) => p.theme.colors.error};
  border-radius: ${(p) => p.theme.radii.md};
  color: ${(p) => p.theme.colors.error};
  font-size: ${(p) => p.theme.fontSizes.sm};
`;

const ErrorIcon = styled.span`
  font-size: 20px;
`;

const InfoSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${(p) => p.theme.spacing.sm};
  padding: ${(p) => p.theme.spacing.md};
  background: ${(p) => p.theme.colors.background};
  border-radius: ${(p) => p.theme.radii.md};
  border: 1px solid ${(p) => p.theme.colors.border};
`;

const InfoRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const InfoLabel = styled.div`
  font-size: ${(p) => p.theme.fontSizes.sm};
  color: ${(p) => p.theme.colors.text};
  opacity: 0.7;
`;

const InfoValue = styled.div<{ $highlight?: boolean }>`
  font-size: ${(p) => p.theme.fontSizes.sm};
  color: ${(p) => (p.$highlight ? p.theme.colors.error : p.theme.colors.text)};
  font-weight: ${(p) => (p.$highlight ? p.theme.fontWeights.semibold : 'normal')};
  font-family: ${(p) => p.theme.fonts.mono};
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: ${(p) => p.theme.spacing.sm};
  margin-top: ${(p) => p.theme.spacing.md};
`;

const CancelButton = styled.button`
  flex: 1;
  padding: ${(p) => p.theme.spacing.md};
  background: transparent;
  color: ${(p) => p.theme.colors.text};
  border: 1px solid ${(p) => p.theme.colors.border};
  border-radius: ${(p) => p.theme.radii.md};
  font-weight: ${(p) => p.theme.fontWeights.semibold};
  cursor: pointer;
  transition: ${(p) => p.theme.transitions.fast};

  &:hover:not(:disabled) {
    background: ${(p) => p.theme.colors.hover || '#f5f5f5'};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const BurnButton = styled.button`
  flex: 1;
  padding: ${(p) => p.theme.spacing.md};
  background: ${(p) => p.theme.colors.error};
  color: white;
  border: none;
  border-radius: ${(p) => p.theme.radii.md};
  font-weight: ${(p) => p.theme.fontWeights.semibold};
  cursor: pointer;
  transition: ${(p) => p.theme.transitions.fast};
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${(p) => p.theme.spacing.sm};

  &:hover:not(:disabled) {
    opacity: 0.9;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

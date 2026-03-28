/**
 * Reissue Asset Modal
 * Modal for reissuing (minting more) user-issued tokens
 * Matches Angular modalManager.showReissueModal functionality
 */

import * as ds from 'data-service';
import { useState } from 'react';
import styled from 'styled-components';
import { Spinner } from '@/components/atoms/Spinner';
import { Modal } from '@/components/organisms/Modal';
import { useAuth } from '@/contexts/AuthContext';
import { logger } from '@/lib/logger';

interface ReissueAssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  assetId: string;
  assetName?: string;
  currentSupply: number;
  decimals: number;
  isReissuable: boolean;
}

export function ReissueAssetModal({
  isOpen,
  onClose,
  assetId,
  assetName,
  currentSupply,
  decimals,
  isReissuable,
}: ReissueAssetModalProps) {
  const { user } = useAuth();
  const [amount, setAmount] = useState('');
  const [keepReissuable, setKeepReissuable] = useState(isReissuable);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const displaySupply = currentSupply / 10 ** decimals;

  const handleReissue = async () => {
    if (!user || !amount || parseFloat(amount) <= 0) return;

    setIsProcessing(true);
    setError(null);

    try {
      const quantityInMinimalUnits = Math.floor(parseFloat(amount) * 10 ** decimals);

      // Create reissue transaction
      const tx = {
        assetId,
        fee: 100000000, // 1 DCC (higher fee for reissue)
        quantity: quantityInMinimalUnits,
        reissuable: keepReissuable,
        senderPublicKey: user.publicKey,
        timestamp: Date.now(),
        type: 5, // Reissue transaction type
        version: 2,
      };

      // Sign and broadcast transaction
      await ds.broadcast(tx);

      // Success - close modal
      onClose();
      setAmount('');
    } catch (err) {
      logger.error('[ReissueAssetModal] Reissue failed:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to reissue tokens. Please check your permissions and try again.',
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow empty string or valid numbers
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setAmount(value);
      setError(null);
    }
  };

  const isValidAmount = amount && parseFloat(amount) > 0;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Reissue ${assetName ?? assetId}`}>
      <Content>
        <InfoSection>
          <InfoLabel>Current Supply</InfoLabel>
          <InfoValue>
            {displaySupply.toLocaleString(undefined, { maximumFractionDigits: decimals })}{' '}
            {assetName ?? assetId}
          </InfoValue>
        </InfoSection>

        <FormSection>
          <Label>Amount to Mint</Label>
          <InputWrapper>
            <Input
              type="text"
              inputMode="decimal"
              placeholder="0.00"
              value={amount}
              onChange={handleAmountChange}
              disabled={isProcessing}
              autoFocus
            />
            <TokenSymbol>{assetName ?? assetId}</TokenSymbol>
          </InputWrapper>
          {amount && (
            <HintText>
              New supply will be:{' '}
              {(displaySupply + parseFloat(amount)).toLocaleString(undefined, {
                maximumFractionDigits: decimals,
              })}{' '}
              {assetName ?? assetId}
            </HintText>
          )}
        </FormSection>

        <CheckboxSection>
          <CheckboxWrapper>
            <Checkbox
              type="checkbox"
              id="keepReissuable"
              checked={keepReissuable}
              onChange={(e) => setKeepReissuable(e.target.checked)}
              disabled={isProcessing}
            />
            <CheckboxLabel htmlFor="keepReissuable">Keep Reissuable</CheckboxLabel>
          </CheckboxWrapper>
        </CheckboxSection>

        {!keepReissuable && (
          <Warning>
            <WarningIcon>⚠️</WarningIcon>
            <WarningText>
              <strong>Warning:</strong> If you uncheck &quot;Keep Reissuable&quot;, this will be
              <strong>last time</strong> you can mint more tokens. This action is permanent and
              cannot be reversed.
            </WarningText>
          </Warning>
        )}

        {error && <ErrorMessage>{error}</ErrorMessage>}

        <InfoSection>
          <InfoRow>
            <InfoLabel>Transaction Fee</InfoLabel>
            <InfoValue>1 DCC</InfoValue>
          </InfoRow>
        </InfoSection>

        <ButtonGroup>
          <CancelButton onClick={onClose} disabled={isProcessing}>
            Cancel
          </CancelButton>
          <ReissueButton onClick={handleReissue} disabled={!isValidAmount || isProcessing}>
            {isProcessing ? (
              <>
                <SpinnerWrapper>
                  <Spinner size="sm" />
                </SpinnerWrapper>
                Processing...
              </>
            ) : (
              'Mint Tokens'
            )}
          </ReissueButton>
        </ButtonGroup>
      </Content>
    </Modal>
  );
}

// Styled Components
const Content = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 4px;
`;

const InfoSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px;
  background: ${(props) => props.theme.colors.background};
  border-radius: 8px;
  border: 1px solid ${(props) => props.theme.colors.border};
`;

const InfoRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const InfoLabel = styled.div`
  font-size: 14px;
  color: ${(props) => props.theme.colors.text};
  opacity: 0.7;
`;

const InfoValue = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: ${(props) => props.theme.colors.text};
`;

const FormSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Label = styled.label`
  font-size: 14px;
  font-weight: 500;
  color: ${(props) => props.theme.colors.text};
`;

const InputWrapper = styled.div`
  position: relative;
  display: flex;
  align-items: center;
`;

const Input = styled.input`
  width: 100%;
  padding: 12px 80px 12px 16px;
  font-size: 16px;
  color: ${(props) => props.theme.colors.text};
  background: ${(props) => props.theme.colors.background};
  border: 2px solid ${(props) => props.theme.colors.border};
  border-radius: 8px;
  outline: none;
  transition: border-color 0.2s;

  &:focus {
    border-color: ${(props) => props.theme.colors.primary};
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  &::placeholder {
    color: ${(props) => props.theme.colors.text};
    opacity: 0.5;
  }
`;

const TokenSymbol = styled.div`
  position: absolute;
  right: 16px;
  font-size: 14px;
  font-weight: 500;
  color: ${(props) => props.theme.colors.text};
  opacity: 0.7;
  pointer-events: none;
`;

const HintText = styled.div`
  font-size: 12px;
  color: ${(props) => props.theme.colors.text};
  opacity: 0.7;
  margin-top: 4px;
`;

const CheckboxSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const CheckboxWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const Checkbox = styled.input`
  width: 18px;
  height: 18px;
  cursor: pointer;

  &:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }
`;

const CheckboxLabel = styled.label`
  font-size: 14px;
  font-weight: 500;
  color: ${(props) => props.theme.colors.text};
  cursor: pointer;
  user-select: none;
`;

const Warning = styled.div`
  display: flex;
  gap: 12px;
  padding: 16px;
  background: #fff3cd;
  border: 1px solid #ffc107;
  border-radius: 8px;
`;

const WarningIcon = styled.div`
  font-size: 24px;
  flex-shrink: 0;
`;

const WarningText = styled.div`
  font-size: 14px;
  line-height: 1.5;
  color: #856404;

  strong {
    font-weight: 600;
  }
`;

const ErrorMessage = styled.div`
  padding: 12px 16px;
  background: #f8d7da;
  border: 1px solid #dc3545;
  border-radius: 8px;
  color: #721c24;
  font-size: 14px;
`;

const ButtonGroup = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-top: 8px;
`;

const Button = styled.button`
  padding: 12px 24px;
  font-size: 16px;
  font-weight: 600;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const CancelButton = styled(Button)`
  background: ${(props) => props.theme.colors.background};
  color: ${(props) => props.theme.colors.text};
  border: 2px solid ${(props) => props.theme.colors.border};

  &:hover:not(:disabled) {
    opacity: 0.8;
  }
`;

const ReissueButton = styled(Button)`
  background: ${(props) => props.theme.colors.primary};
  color: white;

  &:hover:not(:disabled) {
    opacity: 0.9;
  }
`;

const SpinnerWrapper = styled.div`
  display: flex;
  align-items: center;
`;

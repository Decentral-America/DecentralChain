/**
 * Asset Burn Form
 * Form for permanently destroying tokens to reduce supply
 * Burning tokens is irreversible and permanently removes them from circulation
 */
import React, { useState } from 'react';
import styled from 'styled-components';
import { FormProvider } from 'react-hook-form';
import { useZodForm, assetBurnSchema, AssetBurnFormData } from '@/lib/forms';
import { FormInput } from '@/components/forms/FormInput';
import { Button } from '@/components/atoms/Button';
import { Card } from '@/components/atoms/Card';
import { useTransactionSigning } from '@/hooks/useTransactionSigning';
import { transactionService, Transaction } from '@/services/transactionService';
import { AlertModal } from '@/components/modals/AlertModal';
import { ConfirmDialog } from '@/components/modals/ConfirmDialog';
import { useAssetDetails } from '@/api/services/assetsService';
import { Spinner } from '@/components/atoms/Spinner';

/**
 * Component Props
 */
export interface BurnTokenFormProps {
  assetId: string;
  onSuccess?: (transaction: Transaction) => void;
  onCancel?: () => void;
}

/**
 * Styled Components
 */
const FormContainer = styled(Card)`
  max-width: 600px;
  margin: 0 auto;
`;

const FormTitle = styled.h2`
  margin: 0 0 ${({ theme }) => theme.spacing.lg};
  font-size: 24px;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.text};
`;

const FormDescription = styled.p`
  margin: 0 0 ${({ theme }) => theme.spacing.xl};
  font-size: 14px;
  line-height: 1.6;
  color: ${({ theme }) => theme.colors.disabled};
`;

const AssetInfoBox = styled.div`
  padding: ${({ theme }) => theme.spacing.md};
  background-color: ${({ theme }) => theme.colors.background};
  border-radius: ${({ theme }) => theme.radii.md};
  border: 1px solid ${({ theme }) => theme.colors.border};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

const InfoRow = styled.div`
  display: flex;
  justify-content: space-between;
  padding: ${({ theme }) => theme.spacing.xs} 0;
`;

const InfoLabel = styled.span`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.disabled};
`;

const InfoValue = styled.span`
  font-size: 14px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text};
`;

const FormGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.lg};
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.md};
  justify-content: flex-end;
  margin-top: ${({ theme }) => theme.spacing.xl};
  padding-top: ${({ theme }) => theme.spacing.lg};
  border-top: 1px solid ${({ theme }) => theme.colors.border};
`;

const FeeInfo = styled.div`
  padding: ${({ theme }) => theme.spacing.md};
  background-color: ${({ theme }) => theme.colors.info}20;
  border-radius: ${({ theme }) => theme.radii.md};
  border: 1px solid ${({ theme }) => theme.colors.info};
  margin-top: ${({ theme }) => theme.spacing.md};
`;

const FeeText = styled.p`
  margin: 0;
  font-size: 14px;
  color: ${({ theme }) => theme.colors.text};

  strong {
    color: ${({ theme }) => theme.colors.info};
    font-weight: 600;
  }
`;

const WarningBox = styled.div`
  padding: ${({ theme }) => theme.spacing.md};
  background-color: ${({ theme }) => theme.colors.error}20;
  border-radius: ${({ theme }) => theme.radii.md};
  border: 1px solid ${({ theme }) => theme.colors.error};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

const WarningText = styled.p`
  margin: 0;
  font-size: 14px;
  color: ${({ theme }) => theme.colors.error};
  font-weight: 600;
  line-height: 1.6;
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: ${({ theme }) => theme.spacing.xl};
`;

const CalculationBox = styled.div`
  padding: ${({ theme }) => theme.spacing.md};
  background-color: ${({ theme }) => theme.colors.warning}20;
  border-radius: ${({ theme }) => theme.radii.md};
  border: 1px solid ${({ theme }) => theme.colors.warning};
  margin-top: ${({ theme }) => theme.spacing.md};
`;

const CalculationText = styled.p`
  margin: 0;
  font-size: 14px;
  color: ${({ theme }) => theme.colors.text};

  strong {
    font-weight: 600;
    color: ${({ theme }) => theme.colors.warning};
  }
`;

/**
 * Format quantity with decimals
 */
const formatQuantity = (quantity: number, decimals: number): string => {
  const actualQuantity = quantity / Math.pow(10, decimals);
  return actualQuantity.toLocaleString();
};

/**
 * Asset Burn Form Component
 *
 * @example
 * ```tsx
 * <BurnTokenForm
 *   assetId="DG2xFkPdDwKUoBkzGAhQtLpSGzfXLiCYPEzeKH2Ad24p"
 *   onSuccess={(tx) => console.log('Burned:', tx.id)}
 *   onCancel={() => navigate('/assets')}
 * />
 * ```
 */
export const BurnTokenForm: React.FC<BurnTokenFormProps> = ({ assetId, onSuccess, onCancel }) => {
  const { signBurn, isSigning } = useTransactionSigning();
  const { data: asset, isLoading: isLoadingAsset } = useAssetDetails(assetId);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [errorModalOpen, setErrorModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [transactionId, setTransactionId] = useState<string | null>(null);
  const [pendingBurnData, setPendingBurnData] = useState<AssetBurnFormData | null>(null);

  const form = useZodForm<AssetBurnFormData>(assetBurnSchema, {
    defaultValues: {
      assetId,
      quantity: 0,
      fee: undefined,
    },
  });

  const burnQuantity = form.watch('quantity');
  const remainingSupply =
    asset && burnQuantity
      ? (asset.quantity - burnQuantity * Math.pow(10, asset.decimals)) /
        Math.pow(10, asset.decimals)
      : 0;

  const handleBurnSubmit = (data: AssetBurnFormData) => {
    setPendingBurnData(data);
    setConfirmDialogOpen(true);
  };

  const executeBurn = async () => {
    if (!pendingBurnData || !asset) {
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage('');
      setConfirmDialogOpen(false);

      // Convert quantity to wavelets (smallest units)
      const quantityInWavelets = pendingBurnData.quantity * Math.pow(10, asset.decimals);

      // Prepare transaction parameters
      const burnParams = {
        assetId: pendingBurnData.assetId,
        amount: quantityInWavelets, // Burn uses 'amount' instead of 'quantity'
        fee: pendingBurnData.fee || 100000, // Default 0.001 DCC fee for burn
      };

      // Sign transaction
      const signedTx = await signBurn(burnParams);

      // Broadcast transaction
      const broadcastResult = await transactionService.broadcast(signedTx);

      if (broadcastResult.status === 'error') {
        throw new Error(broadcastResult.error || 'Failed to broadcast transaction');
      }

      // Wait for confirmation
      const confirmedTx = await transactionService.waitForConfirmation(
        broadcastResult.id,
        60000 // 60 second timeout
      );

      // Success
      setTransactionId(broadcastResult.id);
      setSuccessModalOpen(true);

      if (onSuccess && confirmedTx) {
        onSuccess(confirmedTx);
      }

      // Reset form on success
      form.reset();
      setPendingBurnData(null);
    } catch (error) {
      console.error('Asset burn failed:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Unknown error occurred');
      setErrorModalOpen(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    form.reset();
    if (onCancel) {
      onCancel();
    }
  };

  const isLoading = isSigning || isSubmitting;

  if (isLoadingAsset) {
    return (
      <FormContainer>
        <LoadingContainer>
          <Spinner size="lg" />
        </LoadingContainer>
      </FormContainer>
    );
  }

  if (!asset) {
    return (
      <FormContainer>
        <WarningBox>
          <WarningText>Asset not found or could not be loaded.</WarningText>
        </WarningBox>
      </FormContainer>
    );
  }

  return (
    <>
      <FormContainer elevation="md">
        <FormTitle>Burn Tokens</FormTitle>
        <FormDescription>
          Permanently destroy tokens to reduce the total supply. This action is irreversible and
          cannot be undone.
        </FormDescription>

        <WarningBox>
          <WarningText>
            ⚠️ WARNING: Burning tokens is permanent and irreversible. The tokens will be destroyed
            forever and cannot be recovered. Please double-check the quantity before proceeding.
          </WarningText>
        </WarningBox>

        <AssetInfoBox>
          <InfoRow>
            <InfoLabel>Token Name</InfoLabel>
            <InfoValue>{asset.name}</InfoValue>
          </InfoRow>
          <InfoRow>
            <InfoLabel>Current Supply</InfoLabel>
            <InfoValue>{formatQuantity(asset.quantity, asset.decimals)}</InfoValue>
          </InfoRow>
          <InfoRow>
            <InfoLabel>Decimals</InfoLabel>
            <InfoValue>{asset.decimals}</InfoValue>
          </InfoRow>
        </AssetInfoBox>

        <FormProvider {...form}>
          <form onSubmit={form.handleSubmit(handleBurnSubmit)}>
            <FormGrid>
              {/* Quantity to Burn */}
              <FormInput
                name="quantity"
                label="Quantity to Burn"
                type="number"
                placeholder="1000"
                disabled={isLoading}
                required
                helperText="Number of tokens to permanently destroy"
              />

              {burnQuantity > 0 && asset && (
                <CalculationBox>
                  <CalculationText>
                    <strong>After burning:</strong> {formatQuantity(asset.quantity, asset.decimals)}{' '}
                    - {burnQuantity.toLocaleString()} ={' '}
                    <strong>{remainingSupply.toLocaleString()} tokens remaining</strong>
                  </CalculationText>
                </CalculationBox>
              )}

              {/* Fee Information */}
              <FeeInfo>
                <FeeText>
                  <strong>Transaction Fee:</strong> 0.001 DCC (100,000 wavelets)
                </FeeText>
              </FeeInfo>
            </FormGrid>

            <ButtonGroup>
              {onCancel && (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleCancel}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
              )}
              <Button type="submit" variant="danger" disabled={isLoading || burnQuantity === 0}>
                {isLoading ? 'Burning...' : 'Burn Tokens'}
              </Button>
            </ButtonGroup>
          </form>
        </FormProvider>
      </FormContainer>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        open={confirmDialogOpen}
        onClose={() => setConfirmDialogOpen(false)}
        onConfirm={executeBurn}
        title="Confirm Token Burn"
        message={`Are you sure you want to permanently burn ${burnQuantity} ${asset?.name} tokens? This action cannot be undone and the tokens will be destroyed forever.`}
        confirmText="Yes, Burn Tokens"
        cancelText="Cancel"
      />

      {/* Success Modal */}
      <AlertModal
        open={successModalOpen}
        onClose={() => setSuccessModalOpen(false)}
        type="success"
        title="Tokens Burned Successfully!"
        message={`${burnQuantity} tokens have been permanently destroyed.${
          transactionId ? `\n\nTransaction ID: ${transactionId}` : ''
        }`}
        buttonText="Close"
      />

      {/* Error Modal */}
      <AlertModal
        open={errorModalOpen}
        onClose={() => setErrorModalOpen(false)}
        type="error"
        title="Burn Failed"
        message={errorMessage}
        buttonText="Close"
      />
    </>
  );
};

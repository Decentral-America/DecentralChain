/**
 * Asset Reissue Form
 * Form for increasing the supply of existing reissuable tokens
 * Only works with tokens that have reissuable=true
 */
import React, { useState } from 'react';
import styled from 'styled-components';
import { FormProvider } from 'react-hook-form';
import { useZodForm, assetReissueSchema, AssetReissueFormData } from '@/lib/forms';
import { FormInput } from '@/components/forms/FormInput';
import { Button } from '@/components/atoms/Button';
import { Checkbox } from '@/components/atoms/Checkbox';
import { Card } from '@/components/atoms/Card';
import { useTransactionSigning } from '@/hooks/useTransactionSigning';
import { transactionService, Transaction } from '@/services/transactionService';
import { AlertModal } from '@/components/modals/AlertModal';
import { useAssetDetails } from '@/api/services/assetsService';
import { Spinner } from '@/components/atoms/Spinner';

/**
 * Component Props
 */
export interface ReissueTokenFormProps {
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

const CheckboxContainer = styled.div`
  display: flex;
  align-items: center;
  padding: ${({ theme }) => theme.spacing.md};
  background-color: ${({ theme }) => theme.colors.background};
  border-radius: ${({ theme }) => theme.radii.md};
  border: 1px solid ${({ theme }) => theme.colors.border};
`;

const HelpText = styled.p`
  margin: ${({ theme }) => theme.spacing.xs} 0 0;
  font-size: 12px;
  color: ${({ theme }) => theme.colors.disabled};
  line-height: 1.4;
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
  background-color: ${({ theme }) => theme.colors.warning}20;
  border-radius: ${({ theme }) => theme.radii.md};
  border: 1px solid ${({ theme }) => theme.colors.warning};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

const WarningText = styled.p`
  margin: 0;
  font-size: 14px;
  color: ${({ theme }) => theme.colors.warning};
  font-weight: 500;
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: ${({ theme }) => theme.spacing.xl};
`;

/**
 * Format quantity with decimals
 */
const formatQuantity = (quantity: number, decimals: number): string => {
  const actualQuantity = quantity / Math.pow(10, decimals);
  return actualQuantity.toLocaleString();
};

/**
 * Asset Reissue Form Component
 *
 * @example
 * ```tsx
 * <ReissueTokenForm
 *   assetId="DG2xFkPdDwKUoBkzGAhQtLpSGzfXLiCYPEzeKH2Ad24p"
 *   onSuccess={(tx) => console.log('Reissued:', tx.id)}
 *   onCancel={() => navigate('/assets')}
 * />
 * ```
 */
export const ReissueTokenForm: React.FC<ReissueTokenFormProps> = ({
  assetId,
  onSuccess,
  onCancel,
}) => {
  const { signReissue, isSigning } = useTransactionSigning();
  const { data: asset, isLoading: isLoadingAsset } = useAssetDetails(assetId);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [errorModalOpen, setErrorModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [transactionId, setTransactionId] = useState<string | null>(null);

  const form = useZodForm<AssetReissueFormData>(assetReissueSchema, {
    defaultValues: {
      assetId,
      quantity: 0,
      reissuable: asset?.reissuable ?? true,
      fee: undefined,
    },
  });

  const onSubmit = async (data: AssetReissueFormData) => {
    if (!asset) {
      setErrorMessage('Asset information not loaded');
      setErrorModalOpen(true);
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage('');

      // Convert quantity to wavelets (smallest units)
      const quantityInWavelets = data.quantity * Math.pow(10, asset.decimals);

      // Prepare transaction parameters
      const reissueParams = {
        assetId: data.assetId,
        quantity: quantityInWavelets,
        reissuable: data.reissuable,
        fee: data.fee || 100000000, // Default 1 DCC fee
      };

      // Sign transaction
      const signedTx = await signReissue(reissueParams);

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
    } catch (error) {
      console.error('Asset reissue failed:', error);
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

  if (!asset.reissuable) {
    return (
      <FormContainer>
        <FormTitle>Cannot Reissue Token</FormTitle>
        <WarningBox>
          <WarningText>
            This token is not reissuable. The supply is fixed and cannot be increased.
          </WarningText>
        </WarningBox>
        {onCancel && (
          <ButtonGroup>
            <Button variant="secondary" onClick={handleCancel}>
              Go Back
            </Button>
          </ButtonGroup>
        )}
      </FormContainer>
    );
  }

  return (
    <>
      <FormContainer elevation="md">
        <FormTitle>Reissue Token</FormTitle>
        <FormDescription>
          Increase the supply of an existing reissuable token. You can add more tokens to the
          current supply and optionally disable future reissuance.
        </FormDescription>

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
          <InfoRow>
            <InfoLabel>Reissuable</InfoLabel>
            <InfoValue>{asset.reissuable ? 'Yes' : 'No'}</InfoValue>
          </InfoRow>
        </AssetInfoBox>

        <FormProvider {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <FormGrid>
              {/* Quantity to Add */}
              <FormInput
                name="quantity"
                label="Quantity to Add"
                type="number"
                placeholder="1000000"
                disabled={isLoading}
                required
                helperText={`Additional tokens to create (will be added to current supply of ${formatQuantity(
                  asset.quantity,
                  asset.decimals
                )})`}
              />

              {/* Reissuable Checkbox */}
              <CheckboxContainer>
                <Checkbox
                  {...form.register('reissuable')}
                  checked={form.watch('reissuable')}
                  label="Keep Reissuable"
                  disabled={isLoading}
                />
                <HelpText style={{ marginLeft: '28px', marginTop: 0 }}>
                  Keep this enabled to allow future reissuance. If disabled, the supply will be
                  locked permanently after this transaction.
                </HelpText>
              </CheckboxContainer>

              {!form.watch('reissuable') && (
                <WarningBox>
                  <WarningText>
                    ⚠️ Warning: Disabling reissuability is permanent and cannot be reversed. The
                    token supply will be locked forever.
                  </WarningText>
                </WarningBox>
              )}

              {/* Fee Information */}
              <FeeInfo>
                <FeeText>
                  <strong>Transaction Fee:</strong> 1 DCC (100,000,000 wavelets)
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
              <Button type="submit" variant="primary" disabled={isLoading}>
                {isLoading ? 'Reissuing...' : 'Reissue Token'}
              </Button>
            </ButtonGroup>
          </form>
        </FormProvider>
      </FormContainer>

      {/* Success Modal */}
      <AlertModal
        open={successModalOpen}
        onClose={() => setSuccessModalOpen(false)}
        type="success"
        title="Token Reissued Successfully!"
        message={`Your token supply has been increased.${
          transactionId ? `\n\nTransaction ID: ${transactionId}` : ''
        }`}
        buttonText="Close"
      />

      {/* Error Modal */}
      <AlertModal
        open={errorModalOpen}
        onClose={() => setErrorModalOpen(false)}
        type="error"
        title="Reissue Failed"
        message={errorMessage}
        buttonText="Close"
      />
    </>
  );
};

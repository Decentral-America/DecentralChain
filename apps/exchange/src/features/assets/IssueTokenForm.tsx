/**
 * Token Issuance Form
 * Form for creating new tokens on the DecentralChain blockchain
 * Handles validation, transaction signing, and broadcasting
 */
import React, { useState } from 'react';
import styled from 'styled-components';
import { FormProvider } from 'react-hook-form';
import { useZodForm, tokenIssuanceSchema, TokenIssuanceFormData } from '@/lib/forms';
import { FormInput } from '@/components/forms/FormInput';
import { Button } from '@/components/atoms/Button';
import { Checkbox } from '@/components/atoms/Checkbox';
import { Card } from '@/components/atoms/Card';
import { useTransactionSigning } from '@/hooks/useTransactionSigning';
import { transactionService, Transaction } from '@/services/transactionService';
import { AlertModal } from '@/components/modals/AlertModal';

/**
 * Component Props
 */
export interface IssueTokenFormProps {
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

const FormGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.lg};
`;

const FormRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${({ theme }) => theme.spacing.md};

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
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

/**
 * Token Issuance Form Component
 *
 * @example
 * ```tsx
 * <IssueTokenForm
 *   onSuccess={(tx) => console.log('Token issued:', tx.id)}
 *   onCancel={() => navigate('/wallet')}
 * />
 * ```
 */
export const IssueTokenForm: React.FC<IssueTokenFormProps> = ({ onSuccess, onCancel }) => {
  const { signIssue, isSigning } = useTransactionSigning();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [errorModalOpen, setErrorModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [transactionId, setTransactionId] = useState<string | null>(null);

  const form = useZodForm<TokenIssuanceFormData>(tokenIssuanceSchema, {
    defaultValues: {
      name: '',
      description: '',
      quantity: 0,
      decimals: 8,
      reissuable: true,
      fee: undefined,
    },
  });

  const onSubmit = async (data: TokenIssuanceFormData) => {
    try {
      setIsSubmitting(true);
      setErrorMessage('');

      // Convert quantity to wavelets (smallest units)
      const quantityInWavelets = data.quantity * Math.pow(10, data.decimals);

      // Prepare transaction parameters
      const issueParams = {
        name: data.name,
        description: data.description,
        quantity: quantityInWavelets,
        decimals: data.decimals,
        reissuable: data.reissuable,
        fee: data.fee || 100000000, // Default 1 DCC fee
      };

      // Sign transaction
      const signedTx = await signIssue(issueParams);

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
      console.error('Token issuance failed:', error);
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

  return (
    <>
      <FormContainer elevation="md">
        <FormTitle>Issue New Token</FormTitle>
        <FormDescription>
          Create a new token on the DecentralChain blockchain. Fill in the details below to define
          your token&apos;s properties. This operation cannot be reversed after confirmation.
        </FormDescription>

        <FormProvider {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <FormGrid>
              {/* Token Name */}
              <FormInput
                name="name"
                label="Token Name"
                placeholder="e.g., MyToken"
                disabled={isLoading}
                required
                helperText="4-16 characters. This will be the display name of your token."
              />

              {/* Description */}
              <FormInput
                name="description"
                label="Description"
                placeholder="Describe your token's purpose"
                type="textarea"
                disabled={isLoading}
                helperText="Up to 1000 characters. Provide details about your token."
              />

              <FormRow>
                {/* Quantity */}
                <FormInput
                  name="quantity"
                  label="Total Supply"
                  type="number"
                  placeholder="1000000"
                  disabled={isLoading}
                  required
                  helperText="Total number of tokens to create."
                />

                {/* Decimals */}
                <FormInput
                  name="decimals"
                  label="Decimals"
                  type="number"
                  placeholder="8"
                  min="0"
                  max="8"
                  disabled={isLoading}
                  required
                  helperText="Number of decimal places (0-8)."
                />
              </FormRow>

              {/* Reissuable Checkbox */}
              <CheckboxContainer>
                <Checkbox
                  {...form.register('reissuable')}
                  checked={form.watch('reissuable')}
                  label="Reissuable"
                  disabled={isLoading}
                />
                <HelpText style={{ marginLeft: '28px', marginTop: 0 }}>
                  Allow increasing the token supply in the future. If disabled, the supply will be
                  fixed permanently.
                </HelpText>
              </CheckboxContainer>

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
                {isLoading ? 'Creating Token...' : 'Create Token'}
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
        title="Token Created Successfully!"
        message={`Your token has been successfully issued on the blockchain.${
          transactionId ? `\n\nTransaction ID: ${transactionId}` : ''
        }`}
        buttonText="Close"
      />

      {/* Error Modal */}
      <AlertModal
        open={errorModalOpen}
        onClose={() => setErrorModalOpen(false)}
        type="error"
        title="Token Issuance Failed"
        message={errorMessage}
        buttonText="Close"
      />
    </>
  );
};

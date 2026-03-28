/**
 * Mass Transfer Form
 * Send tokens to multiple recipients in a single transaction
 * Supports up to 100 recipients with batch optimization
 */

import { type IMassTransferParams } from '@decentralchain/transactions';
import { zodResolver } from '@hookform/resolvers/zod';
import type React from 'react';
import { useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import styled from 'styled-components';
import { z } from 'zod';
import { Button } from '@/components/atoms/Button';
import { Card } from '@/components/atoms/Card';
import { Input } from '@/components/atoms/Input';
import {
  TransactionConfirmationFlow,
  type TxOmit,
} from '@/components/wallet/TransactionConfirmationFlow';
import { useAuth } from '@/contexts/AuthContext';
import { logger } from '@/lib/logger';

/**
 * Styled Components
 */
const FormCard = styled(Card as React.ComponentType<Record<string, unknown>>)`
  padding: ${({ theme }) => theme.spacing.xl};
  max-width: 900px;
  margin: 0 auto;
`;

const FormTitle = styled.h2`
  margin: 0 0 ${({ theme }) => theme.spacing.md};
  font-size: 24px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text};
`;

const FormDescription = styled.p`
  margin: 0 0 ${({ theme }) => theme.spacing.xl};
  font-size: 14px;
  color: ${({ theme }) => theme.colors.disabled};
  line-height: 1.6;
`;

const FormSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
  margin-bottom: ${({ theme }) => theme.spacing.xl};
`;

const RecipientsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

const RecipientCard = styled(Card as React.ComponentType<Record<string, unknown>>)`
  padding: ${({ theme }) => theme.spacing.md};
  background: ${({ theme }) => theme.colors.background};
  border: 1px solid ${({ theme }) => theme.colors.border};
`;

const RecipientHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const RecipientTitle = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text};
`;

const RemoveButton = styled(Button as React.ComponentType<Record<string, unknown>>)`
  padding: ${({ theme }) => theme.spacing.xs} ${({ theme }) => theme.spacing.sm};
  font-size: 12px;
`;

const RecipientGrid = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: ${({ theme }) => theme.spacing.md};
  align-items: start;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.md};
  margin-top: ${({ theme }) => theme.spacing.lg};

  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const AddButton = styled(Button as React.ComponentType<Record<string, unknown>>)`
  width: 100%;
  max-width: 200px;
`;

const InfoBox = styled.div`
  padding: ${({ theme }) => theme.spacing.md};
  background: ${({ theme }) => theme.colors.info || theme.colors.primary}10;
  border: 1px solid ${({ theme }) => theme.colors.info || theme.colors.primary}30;
  border-radius: ${({ theme }) => theme.radii.md};
  margin-bottom: ${({ theme }) => theme.spacing.xl};
  font-size: 13px;
  color: ${({ theme }) => theme.colors.text};
  line-height: 1.6;

  strong {
    font-weight: 600;
  }
`;

const SummaryBox = styled.div`
  padding: ${({ theme }) => theme.spacing.md};
  background: ${({ theme }) => theme.colors.background};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.sm};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

const SummaryRow = styled.div`
  display: flex;
  justify-content: space-between;
  padding: ${({ theme }) => theme.spacing.xs} 0;
  font-size: 14px;

  &:not(:last-child) {
    border-bottom: 1px solid ${({ theme }) => theme.colors.border};
    margin-bottom: ${({ theme }) => theme.spacing.xs};
    padding-bottom: ${({ theme }) => theme.spacing.xs};
  }
`;

const FieldError = styled.div`
  color: red;
  font-size: 14px;
`;

const SummaryLabel = styled.span`
  color: ${({ theme }) => theme.colors.disabled};
`;

const SummaryValue = styled.span`
  color: ${({ theme }) => theme.colors.text};
  font-weight: 600;
`;

/**
 * Transfer recipient schema
 */
const transferRecipientSchema = z.object({
  amount: z.string().refine((val) => {
    const num = parseFloat(val);
    return !Number.isNaN(num) && num > 0;
  }, 'Amount must be greater than 0'),
  recipient: z
    .string()
    .min(35, 'Invalid address')
    .regex(/^3[A-Za-z0-9]{34}$/, 'Must be a valid DecentralChain address'),
});

/**
 * Form schema
 */
const massTransferSchema = z.object({
  assetId: z.string().optional(),
  attachment: z.string().max(140, 'Attachment must be under 140 characters').optional(),
  transfers: z
    .array(transferRecipientSchema)
    .min(2, 'At least 2 recipients required for mass transfer')
    .max(100, 'Maximum 100 recipients allowed'),
});

type MassTransferFormData = z.infer<typeof massTransferSchema>;

/**
 * MassTransferForm Component
 * Send to multiple recipients in a single transaction
 *
 * @example
 * ```tsx
 * <MassTransferForm />
 * ```
 */
export const MassTransferForm: React.FC = () => {
  const { user } = useAuth();
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [transactionParams, setTransactionParams] = useState<TxOmit<IMassTransferParams> | null>(
    null,
  );

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<MassTransferFormData>({
    defaultValues: {
      assetId: '',
      attachment: '',
      transfers: [
        { amount: '', recipient: '' },
        { amount: '', recipient: '' },
      ],
    },
    resolver: zodResolver(massTransferSchema),
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'transfers',
  });

  const transfers = watch('transfers');

  // Calculate total amount
  const totalAmount = transfers.reduce((sum, transfer) => {
    const amount = parseFloat(transfer.amount || '0');
    return sum + (Number.isNaN(amount) ? 0 : amount);
  }, 0);

  const handleAddRecipient = () => {
    if (fields.length < 100) {
      append({ amount: '', recipient: '' });
    }
  };

  const handleRemoveRecipient = (index: number) => {
    if (fields.length > 2) {
      remove(index);
    }
  };

  const onSubmit = async (formData: MassTransferFormData) => {
    if (!user) {
      alert('Please login first');
      return;
    }

    try {
      // Convert form data to transaction format
      const transfersData = formData.transfers.map((transfer) => ({
        amount: Math.round(parseFloat(transfer.amount) * 100000000), // Convert to wavelets
        recipient: transfer.recipient,
      }));

      // Calculate fee (0.001 DCC + 0.0005 DCC per recipient)
      const baseFee = 100000; // 0.001 DCC
      const perRecipientFee = 50000; // 0.0005 DCC
      const totalFee = baseFee + perRecipientFee * formData.transfers.length;

      // Create mass transfer parameters
      const params = {
        assetId: formData.assetId || null,
        attachment: formData.attachment || '',
        fee: totalFee,
        transfers: transfersData,
      };

      setTransactionParams(params);
      setShowConfirmation(true);
    } catch (error) {
      logger.error('Error preparing mass transfer:', error);
      alert('Failed to prepare mass transfer transaction');
    }
  };

  const handleConfirmationClose = () => {
    setShowConfirmation(false);
    setTransactionParams(null);
  };

  // Calculate fee display
  const estimatedFee = 0.001 + 0.0005 * fields.length;

  return (
    <>
      <FormCard elevation="lg">
        <FormTitle>Mass Transfer</FormTitle>
        <FormDescription>
          Send tokens to multiple recipients in a single transaction. Save on fees and time by
          batching transfers together. Supports up to 100 recipients.
        </FormDescription>

        <InfoBox>
          <strong>💡 Mass Transfer Benefits:</strong>
          <br />• Lower fees compared to individual transfers
          <br />• Single transaction for multiple recipients (2-100)
          <br />• Fee: 0.001 DCC + 0.0005 DCC per recipient
          <br />• Supports DCC and custom tokens
          <br />• Optional attachment message (max 140 characters)
        </InfoBox>

        <form onSubmit={handleSubmit(onSubmit)}>
          <FormSection>
            <Input
              label="Asset ID (Optional)"
              placeholder="Leave empty for DCC, or enter token ID"
              {...register('assetId')}
              error={errors.assetId?.message}
              helperText="Leave empty to transfer DCC tokens"
              fullWidth
            />

            <Input
              label="Attachment (Optional)"
              placeholder="Optional message"
              {...register('attachment')}
              error={errors.attachment?.message}
              helperText="Optional message attached to transaction (max 140 chars)"
              fullWidth
            />
          </FormSection>

          <RecipientsContainer>
            {fields.map((field, index) => (
              <RecipientCard key={field.id} elevation="sm">
                <RecipientHeader>
                  <RecipientTitle>Recipient #{index + 1}</RecipientTitle>
                  {fields.length > 2 && (
                    <RemoveButton
                      variant="secondary"
                      size="small"
                      type="button"
                      onClick={() => handleRemoveRecipient(index)}
                    >
                      Remove
                    </RemoveButton>
                  )}
                </RecipientHeader>

                <RecipientGrid>
                  <Input
                    label="Address"
                    placeholder="3P..."
                    {...register(`transfers.${index}.recipient`)}
                    error={errors.transfers?.[index]?.recipient?.message}
                  />

                  <Input
                    label="Amount"
                    type="number"
                    step="0.00000001"
                    placeholder="0.00"
                    {...register(`transfers.${index}.amount`)}
                    error={errors.transfers?.[index]?.amount?.message}
                  />
                </RecipientGrid>
              </RecipientCard>
            ))}

            {errors.transfers && typeof errors.transfers.message === 'string' && (
              <FieldError>{errors.transfers.message}</FieldError>
            )}
          </RecipientsContainer>

          <AddButton
            variant="secondary"
            type="button"
            onClick={handleAddRecipient}
            disabled={fields.length >= 100}
          >
            + Add Recipient ({fields.length}/100)
          </AddButton>

          <SummaryBox>
            <SummaryRow>
              <SummaryLabel>Total Recipients:</SummaryLabel>
              <SummaryValue>{fields.length}</SummaryValue>
            </SummaryRow>
            <SummaryRow>
              <SummaryLabel>Total Amount:</SummaryLabel>
              <SummaryValue>{totalAmount.toFixed(8)} DCC</SummaryValue>
            </SummaryRow>
            <SummaryRow>
              <SummaryLabel>Estimated Fee:</SummaryLabel>
              <SummaryValue>{estimatedFee.toFixed(4)} DCC</SummaryValue>
            </SummaryRow>
          </SummaryBox>

          <ButtonGroup>
            <Button type="submit" disabled={isSubmitting} fullWidth>
              {isSubmitting ? 'Preparing...' : 'Send Mass Transfer'}
            </Button>
          </ButtonGroup>
        </form>
      </FormCard>

      {showConfirmation && transactionParams && (
        <TransactionConfirmationFlow
          open={showConfirmation}
          transactionType="massTransfer"
          params={transactionParams}
          onClose={handleConfirmationClose}
        />
      )}
    </>
  );
};

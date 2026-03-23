/**
 * Data Transaction Form
 * Create data transactions to store key-value pairs on the blockchain
 * Supports string, integer, boolean, and binary data types
 */

import { type IDataParams } from '@decentralchain/transactions';
import { zodResolver } from '@hookform/resolvers/zod';
import type React from 'react';
import { useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import styled from 'styled-components';
import { z } from 'zod';
import { Button } from '@/components/atoms/Button';
import { Card } from '@/components/atoms/Card';
import { Input } from '@/components/atoms/Input';
import { Select, type SelectOption } from '@/components/atoms/Select';
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
  max-width: 800px;
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

const EntriesContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.lg};
  margin-bottom: ${({ theme }) => theme.spacing.xl};
`;

const EntryCard = styled(Card as React.ComponentType<Record<string, unknown>>)`
  padding: ${({ theme }) => theme.spacing.md};
  background: ${({ theme }) => theme.colors.background};
  border: 1px solid ${({ theme }) => theme.colors.border};
`;

const EntryHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const EntryTitle = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text};
`;

const RemoveButton = styled(Button as React.ComponentType<Record<string, unknown>>)`
  padding: ${({ theme }) => theme.spacing.xs} ${({ theme }) => theme.spacing.sm};
  font-size: 12px;
`;

const EntryGrid = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr 2fr;
  gap: ${({ theme }) => theme.spacing.md};
  align-items: start;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.md};
  margin-top: ${({ theme }) => theme.spacing.xl};

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

/**
 * Data entry schema
 */
const dataEntrySchema = z.object({
  key: z.string().min(1, 'Key is required').max(400, 'Key must be under 400 characters'),
  type: z.enum(['string', 'integer', 'boolean', 'binary']),
  value: z.string().min(1, 'Value is required'),
});

/**
 * Form schema
 */
const dataTransactionSchema = z.object({
  entries: z
    .array(dataEntrySchema)
    .min(1, 'At least one data entry is required')
    .max(100, 'Maximum 100 entries allowed'),
});

type DataTransactionFormData = z.infer<typeof dataTransactionSchema>;

/**
 * Data type options
 */
const dataTypeOptions: SelectOption[] = [
  { label: 'String', value: 'string' },
  { label: 'Integer', value: 'integer' },
  { label: 'Boolean', value: 'boolean' },
  { label: 'Binary (Base64)', value: 'binary' },
];

/**
 * DataTransactionForm Component
 * Create data transactions with key-value pairs
 *
 * @example
 * ```tsx
 * <DataTransactionForm />
 * ```
 */
export const DataTransactionForm: React.FC = () => {
  const { user } = useAuth();
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [transactionParams, setTransactionParams] = useState<TxOmit<IDataParams> | null>(null);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<DataTransactionFormData>({
    defaultValues: {
      entries: [{ key: '', type: 'string', value: '' }],
    },
    resolver: zodResolver(dataTransactionSchema),
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'entries',
  });

  const handleAddEntry = () => {
    append({ key: '', type: 'string', value: '' });
  };

  const handleRemoveEntry = (index: number) => {
    if (fields.length > 1) {
      remove(index);
    }
  };

  const onSubmit = async (formData: DataTransactionFormData) => {
    if (!user) {
      alert('Please login first');
      return;
    }

    try {
      // Convert form entries to transaction data format
      // DataEntry is derived from IDataParams to stay in sync with the type contract.
      type DataEntry = TxOmit<IDataParams>['data'][number];
      const dataEntries = formData.entries.map((entry): DataEntry => {
        switch (entry.type) {
          case 'integer':
            return { key: entry.key, type: entry.type, value: parseInt(entry.value, 10) };
          case 'boolean':
            return {
              key: entry.key,
              type: entry.type,
              value: entry.value.toLowerCase() === 'true',
            };
          case 'binary':
            return { key: entry.key, type: entry.type, value: entry.value };
          default:
            return { key: entry.key, type: 'string', value: entry.value };
        }
      });

      // Create data transaction parameters
      const params = {
        data: dataEntries,
        fee: 100000, // 0.001 DCC
      };

      setTransactionParams(params);
      setShowConfirmation(true);
    } catch (error) {
      logger.error('Error preparing data transaction:', error);
      alert('Failed to prepare data transaction');
    }
  };

  const handleConfirmationClose = () => {
    setShowConfirmation(false);
    setTransactionParams(null);
  };

  return (
    <>
      <FormCard elevation="lg">
        <FormTitle>Create Data Transaction</FormTitle>
        <FormDescription>
          Store arbitrary key-value pairs on the blockchain. Data is publicly accessible and
          permanently stored. Each entry consists of a key, data type, and value.
        </FormDescription>

        <InfoBox>
          <strong>💡 Data Transaction Info:</strong>
          <br />• Maximum 100 entries per transaction
          <br />• Keys can be up to 400 characters
          <br />• Supports string, integer, boolean, and binary (Base64) types
          <br />• Default fee: 0.001 DCC per transaction
          <br />• Data is immutable and publicly readable
        </InfoBox>

        <form onSubmit={handleSubmit(onSubmit)}>
          <EntriesContainer>
            {fields.map((field, index) => (
              <EntryCard key={field.id} elevation="sm">
                <EntryHeader>
                  <EntryTitle>Entry #{index + 1}</EntryTitle>
                  {fields.length > 1 && (
                    <RemoveButton
                      variant="secondary"
                      size="small"
                      type="button"
                      onClick={() => handleRemoveEntry(index)}
                    >
                      Remove
                    </RemoveButton>
                  )}
                </EntryHeader>

                <EntryGrid>
                  <Input
                    label="Key"
                    placeholder="my_key"
                    {...register(`entries.${index}.key`)}
                    error={errors.entries?.[index]?.key?.message}
                  />

                  <Select
                    label="Type"
                    {...register(`entries.${index}.type`)}
                    options={dataTypeOptions}
                    error={errors.entries?.[index]?.type?.message}
                  />

                  <Input
                    label="Value"
                    placeholder="Enter value"
                    {...register(`entries.${index}.value`)}
                    error={errors.entries?.[index]?.value?.message}
                    helperText={
                      errors.entries?.[index]?.value
                        ? undefined
                        : 'For boolean: true/false, For integer: numbers only'
                    }
                  />
                </EntryGrid>
              </EntryCard>
            ))}

            {errors.entries && typeof errors.entries.message === 'string' && (
              <div style={{ color: 'red', fontSize: '14px' }}>{errors.entries.message}</div>
            )}
          </EntriesContainer>

          <AddButton variant="secondary" type="button" onClick={handleAddEntry}>
            + Add Entry
          </AddButton>

          <ButtonGroup>
            <Button type="submit" disabled={isSubmitting} fullWidth>
              {isSubmitting ? 'Creating...' : 'Create Data Transaction'}
            </Button>
          </ButtonGroup>
        </form>
      </FormCard>

      {showConfirmation && transactionParams && (
        <TransactionConfirmationFlow
          open={showConfirmation}
          transactionType="data"
          params={transactionParams}
          onClose={handleConfirmationClose}
        />
      )}
    </>
  );
};

/**
 * Alias Registration Form
 * Register human-readable aliases for blockchain addresses
 * Aliases are permanent and must be unique on the network
 */

import { type IAliasParams } from '@decentralchain/transactions';
import { zodResolver } from '@hookform/resolvers/zod';
import type React from 'react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
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
  max-width: 600px;
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
  gap: ${({ theme }) => theme.spacing.lg};
`;

const InfoBox = styled.div`
  padding: ${({ theme }) => theme.spacing.md};
  background: ${({ theme }) => theme.colors.info || theme.colors.primary}10;
  border: 1px solid ${({ theme }) => theme.colors.info || theme.colors.primary}30;
  border-radius: ${({ theme }) => theme.radii.md};
  font-size: 13px;
  color: ${({ theme }) => theme.colors.text};
  line-height: 1.6;

  strong {
    font-weight: 600;
  }
`;

const WarningBox = styled.div`
  padding: ${({ theme }) => theme.spacing.md};
  background: ${({ theme }) => theme.colors.warning}10;
  border: 1px solid ${({ theme }) => theme.colors.warning}50;
  border-radius: ${({ theme }) => theme.radii.md};
  font-size: 13px;
  color: ${({ theme }) => theme.colors.text};
  line-height: 1.6;

  strong {
    font-weight: 600;
    color: ${({ theme }) => theme.colors.warning};
  }
`;

const PreviewBox = styled.div`
  padding: ${({ theme }) => theme.spacing.md};
  background: ${({ theme }) => theme.colors.background};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.sm};
`;

const PreviewLabel = styled.div`
  font-size: 12px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.disabled};
  margin-bottom: ${({ theme }) => theme.spacing.xs};
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const PreviewValue = styled.div`
  font-size: 14px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.text};
  font-family: ${({ theme }) => theme.fonts.mono};
  word-break: break-all;
`;

const ExamplesList = styled.ul`
  margin: ${({ theme }) => theme.spacing.xs} 0 0 0;
  padding-left: ${({ theme }) => theme.spacing.lg};
  list-style: disc;

  li {
    margin-bottom: ${({ theme }) => theme.spacing.xs};
  }
`;

/**
 * Alias validation schema
 */
const aliasSchema = z.object({
  alias: z
    .string()
    .min(4, 'Alias must be at least 4 characters')
    .max(30, 'Alias must be at most 30 characters')
    .regex(/^[a-z0-9@._-]+$/, 'Only lowercase letters, numbers, @, ., _, - allowed')
    .regex(/^[a-z0-9]/, 'Must start with a letter or number')
    .regex(/[a-z0-9]$/, 'Must end with a letter or number'),
});

type AliasFormData = z.infer<typeof aliasSchema>;

/**
 * AliasForm Component
 * Register human-readable aliases for addresses
 *
 * @example
 * ```tsx
 * <AliasForm />
 * ```
 */
export const AliasForm: React.FC = () => {
  const { user } = useAuth();
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [transactionParams, setTransactionParams] = useState<TxOmit<IAliasParams> | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<AliasFormData>({
    mode: 'onChange',
    resolver: zodResolver(aliasSchema),
  });

  const aliasValue = watch('alias', '');
  const fullAlias = aliasValue ? `alias:W:${aliasValue}` : '';

  const onSubmit = async (formData: AliasFormData) => {
    if (!user) {
      alert('Please login first');
      return;
    }

    try {
      // Create alias transaction parameters
      const params = {
        alias: formData.alias,
        fee: 100000, // 0.001 DCC
      };

      setTransactionParams(params);
      setShowConfirmation(true);
    } catch (error) {
      logger.error('Error preparing alias transaction:', error);
      alert('Failed to prepare alias transaction');
    }
  };

  const handleConfirmationClose = () => {
    setShowConfirmation(false);
    setTransactionParams(null);
  };

  return (
    <>
      <FormCard elevation="lg">
        <FormTitle>Register Alias</FormTitle>
        <FormDescription>
          Create a human-readable name for your blockchain address. Aliases are permanent, globally
          unique, and can be used instead of your address for transactions.
        </FormDescription>

        <WarningBox>
          <strong>⚠️ Important:</strong> Aliases are permanent and cannot be changed or deleted after
          registration. Make sure you choose a name you&apos;re happy with!
        </WarningBox>

        <form onSubmit={handleSubmit(onSubmit)}>
          <FormSection>
            <Input
              label="Alias Name"
              placeholder="myalias"
              {...register('alias')}
              error={errors.alias?.message}
              helperText="4-30 characters: lowercase letters, numbers, @, ., _, -"
              fullWidth
            />

            {aliasValue && !errors.alias && (
              <PreviewBox>
                <PreviewLabel>Full Alias Format:</PreviewLabel>
                <PreviewValue>{fullAlias}</PreviewValue>
              </PreviewBox>
            )}

            <InfoBox>
              <strong>💡 Alias Rules:</strong>
              <ExamplesList>
                <li>Must be 4-30 characters long</li>
                <li>Only lowercase letters (a-z), numbers (0-9), and symbols: @ . _ -</li>
                <li>Must start and end with a letter or number</li>
                <li>Unique across the entire network</li>
                <li>Default fee: 0.001 DCC</li>
              </ExamplesList>
              <br />
              <strong>Valid Examples:</strong>
              <br />
              john123, my-wallet, alice@example, bob_crypto
            </InfoBox>

            <Button type="submit" disabled={isSubmitting || !!errors.alias} fullWidth>
              {isSubmitting ? 'Registering...' : 'Register Alias'}
            </Button>
          </FormSection>
        </form>
      </FormCard>

      {showConfirmation && transactionParams && (
        <TransactionConfirmationFlow
          open={showConfirmation}
          transactionType="alias"
          params={transactionParams}
          onClose={handleConfirmationClose}
        />
      )}
    </>
  );
};

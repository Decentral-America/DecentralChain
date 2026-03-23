/**
 * Set Script Form
 * Attach smart contract scripts to accounts for advanced functionality
 * Enables programmable account rules and custom transaction validation
 */

import { type ISetScriptParams } from '@decentralchain/transactions';
import { zodResolver } from '@hookform/resolvers/zod';
import type React from 'react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import styled from 'styled-components';
import { z } from 'zod';
import { Button } from '@/components/atoms/Button';
import { Card } from '@/components/atoms/Card';
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

const FormSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.lg};
`;

const ScriptTextarea = styled.textarea<{ hasError?: boolean }>`
  width: 100%;
  min-height: 300px;
  padding: ${({ theme }) => theme.spacing.md};
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: 13px;
  line-height: 1.6;
  color: ${({ theme }) => theme.colors.text};
  background: ${({ theme }) => theme.colors.background};
  border: 1px solid
    ${({ hasError, theme }) => (hasError ? theme.colors.error : theme.colors.border)};
  border-radius: ${({ theme }) => theme.radii.md};
  resize: vertical;
  transition: ${({ theme }) => theme.transitions.fast};

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
    box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.primary}20;
  }

  &::placeholder {
    color: ${({ theme }) => theme.colors.disabled};
  }
`;

const Label = styled.label`
  display: block;
  margin-bottom: ${({ theme }) => theme.spacing.xs};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  color: ${({ theme }) => theme.colors.text};
`;

const HelperText = styled.div<{ error?: boolean }>`
  margin-top: ${({ theme }) => theme.spacing.xs};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ error, theme }) => (error ? theme.colors.error : theme.colors.disabled)};
`;

const WarningBox = styled.div`
  padding: ${({ theme }) => theme.spacing.md};
  background: ${({ theme }) => theme.colors.warning}10;
  border: 2px solid ${({ theme }) => theme.colors.warning};
  border-radius: ${({ theme }) => theme.radii.md};
  margin-bottom: ${({ theme }) => theme.spacing.xl};
`;

const WarningTitle = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.warning};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
`;

const WarningText = styled.div`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.text};
  line-height: 1.6;
`;

const WarningList = styled.ul`
  margin: ${({ theme }) => theme.spacing.sm} 0 0 0;
  padding-left: ${({ theme }) => theme.spacing.lg};

  li {
    margin-bottom: ${({ theme }) => theme.spacing.xs};
  }
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

const ButtonGroup = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.md};
  margin-top: ${({ theme }) => theme.spacing.xl};

  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const RemoveScriptButton = styled(Button as React.ComponentType<Record<string, unknown>>)`
  flex: 1;
`;

/**
 * Script schema
 */
const scriptSchema = z.object({
  script: z
    .string()
    .min(1, 'Script is required')
    .refine((val) => val.startsWith('base64:'), 'Script must be base64 encoded'),
});

type SetScriptFormData = z.infer<typeof scriptSchema>;

/**
 * SetScriptForm Component
 * Attach or remove smart contract scripts from accounts
 *
 * @example
 * ```tsx
 * <SetScriptForm />
 * ```
 */
export const SetScriptForm: React.FC = () => {
  const { user } = useAuth();
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [transactionParams, setTransactionParams] = useState<TxOmit<ISetScriptParams> | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<SetScriptFormData>({
    defaultValues: {
      script: '',
    },
    resolver: zodResolver(scriptSchema),
  });

  const onSubmit = async (formData: SetScriptFormData) => {
    if (!user) {
      alert('Please login first');
      return;
    }

    try {
      // Create setScript transaction parameters
      const params = {
        fee: 1000000, // 0.01 DCC
        script: formData.script || null,
      };

      setTransactionParams(params);
      setShowConfirmation(true);
    } catch (error) {
      logger.error('Error preparing setScript transaction:', error);
      alert('Failed to prepare setScript transaction');
    }
  };

  const handleRemoveScript = () => {
    setValue('script', '');
  };

  const handleConfirmationClose = () => {
    setShowConfirmation(false);
    setTransactionParams(null);
  };

  return (
    <>
      <FormCard elevation="lg">
        <FormTitle>Set Account Script</FormTitle>
        <FormDescription>
          Attach a smart contract script to your account to enable programmable transaction rules,
          multisig functionality, or custom validation logic. Advanced feature - use with caution.
        </FormDescription>

        <WarningBox>
          <WarningTitle>⚠️ Critical Warning</WarningTitle>
          <WarningText>
            Setting an account script is an advanced operation that can lock your account if done
            incorrectly:
            <WarningList>
              <li>
                <strong>Test thoroughly:</strong> Test your script on testnet before using on
                mainnet
              </li>
              <li>
                <strong>Backup verification:</strong> Ensure you have a way to verify transactions
              </li>
              <li>
                <strong>Account lockout risk:</strong> A faulty script can prevent all transactions
              </li>
              <li>
                <strong>Removal cost:</strong> Removing a script costs fees
              </li>
              <li>
                <strong>Expert only:</strong> Requires knowledge of RIDE language and blockchain
                logic
              </li>
            </WarningList>
          </WarningText>
        </WarningBox>

        <form onSubmit={handleSubmit(onSubmit)}>
          <FormSection>
            <div>
              <Label htmlFor="script">Script Code (Base64 Encoded)</Label>
              <ScriptTextarea
                id="script"
                placeholder="base64:AAIDAAAAAAAAAAYIARIAEgAAAAACAQAAAApyYW5kb21pemVyAAAAAQAAAANpbnYEAAAACGxhc3RQbGF5BAAAAAckbWF0Y2gwCQAEHAAAAAIFAAAABHRoaXMCAAAACGxhc3RQbGF5AwkAAAEAAAACBQAAAAckbWF0Y2gwAgAAAApCeXRlVmVjdG9yBAAAAAFzBQAAAAckbWF0Y2gwBQAAAAFzAwkAAAEAAAACBQAAAAckbWF0Y2gwAgAAAARVbml0BAAAAAFhBQAAAAckbWF0Y2gwAQAAAAFhAAAAAAAAAAA="
                {...register('script')}
                hasError={!!errors.script}
              />
              {errors.script && <HelperText error>{errors.script.message}</HelperText>}
              {!errors.script && (
                <HelperText>
                  Enter your compiled RIDE script in base64 format (starts with &quot;base64:&quot;)
                </HelperText>
              )}
            </div>

            <InfoBox>
              <strong>💡 Script Information:</strong>
              <br />• Scripts must be compiled RIDE code in base64 format
              <br />• Fee: 0.01 DCC (10x standard transaction fee)
              <br />• Scripts validate all outgoing transactions from your account
              <br />• Leave empty and submit to remove an existing script
              <br />• Learn more about RIDE at{' '}
              <a
                href="https://docs.decentralchain.io/en/ride/"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: 'inherit' }}
              >
                docs.decentralchain.io/en/ride/
              </a>
            </InfoBox>

            <ButtonGroup>
              <Button type="submit" disabled={isSubmitting} fullWidth>
                {isSubmitting ? 'Setting Script...' : 'Set Account Script'}
              </Button>

              <RemoveScriptButton
                type="button"
                variant="secondary"
                onClick={handleRemoveScript}
                fullWidth
              >
                Clear Script
              </RemoveScriptButton>
            </ButtonGroup>
          </FormSection>
        </form>
      </FormCard>

      {showConfirmation && transactionParams && (
        <TransactionConfirmationFlow
          open={showConfirmation}
          transactionType="setScript"
          params={transactionParams}
          onClose={handleConfirmationClose}
        />
      )}
    </>
  );
};

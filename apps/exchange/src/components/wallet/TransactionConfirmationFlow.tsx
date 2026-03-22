/**
 * Transaction Confirmation Flow
 * Multi-step confirmation component for reviewing and broadcasting transactions
 * Provides visual feedback through review → signing → broadcasting → success/error states
 */

import {
  type IAliasParams,
  type IBurnParams,
  type ICancelLeaseParams,
  type IDataParams,
  type IInvokeScriptParams,
  type IIssueParams,
  type ILeaseParams,
  type IMassTransferParams,
  type IReissueParams,
  type ISetAssetScriptParams,
  type ISetScriptParams,
  type ISponsorshipParams,
  type ITransferParams,
} from '@decentralchain/transactions';
import type React from 'react';
import { useCallback, useState } from 'react';
import styled from 'styled-components';
import { Button } from '@/components/atoms/Button';
import { Spinner } from '@/components/atoms/Spinner';
import { Modal } from '@/components/modals/Modal';
import { useTransactionSigning } from '@/hooks/useTransactionSigning';
import { type Transaction, transactionService } from '@/services/transactionService';

type TxParams = Record<string, unknown>;
const cast = <T,>(p: TxParams): T => p as unknown as T;

/**
 * Transaction Flow Steps
 */
type ConfirmationStep = 'review' | 'signing' | 'broadcasting' | 'confirming' | 'success' | 'error';

/**
 * Component Props
 * params is typed broadly because this component handles multiple transaction types;
 * the correct signer is chosen at runtime based on transactionType.
 */
export interface TransactionConfirmationProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: (transaction: Transaction) => void;
  params: Record<string, unknown>;
  transactionType?: string;
}

/**
 * Styled Components
 */
const Content = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  min-height: 300px;
`;

const ReviewSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px;
  background-color: ${({ theme }) => theme.colors.background};
  border-radius: 8px;
  border: 1px solid ${({ theme }) => theme.colors.border};
`;

const ReviewRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
`;

const Label = styled.span`
  font-size: 14px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.disabled};
`;

const Value = styled.span`
  font-size: 14px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text};
  word-break: break-all;
  text-align: right;
  max-width: 60%;
`;

const StatusContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 40px 20px;
`;

const StatusMessage = styled.p`
  font-size: 16px;
  color: ${({ theme }) => theme.colors.text};
  text-align: center;
  margin: 0;
`;

const ErrorMessage = styled.p`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.error};
  text-align: center;
  margin: 0;
  padding: 12px;
  background-color: ${({ theme }) => theme.colors.error}20;
  border-radius: 8px;
`;

const SuccessIcon = styled.div`
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background-color: ${({ theme }) => theme.colors.success}20;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  color: ${({ theme }) => theme.colors.success};
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 8px;
`;

/**
 * Transaction Confirmation Flow Component
 *
 * @example
 * ```tsx
 * const [confirmOpen, setConfirmOpen] = useState(false);
 *
 * <TransactionConfirmationFlow
 *   open={confirmOpen}
 *   onClose={() => setConfirmOpen(false)}
 *   params={{ recipient: '...', amount: 100000000 }}
 *   onSuccess={(tx) => logger.debug('Transaction sent:', tx.id)}
 * />
 * ```
 */
export const TransactionConfirmationFlow: React.FC<TransactionConfirmationProps> = ({
  open,
  onClose,
  onSuccess,
  params,
  transactionType = 'Transfer',
}) => {
  const [step, setStep] = useState<ConfirmationStep>('review');
  const [error, setError] = useState<string | null>(null);
  const [transactionId, setTransactionId] = useState<string | null>(null);
  const {
    signTransfer,
    signAlias,
    signData,
    signMassTransfer,
    signSetScript,
    signIssue,
    signLease,
    signCancelLease,
    signBurn,
    signSponsorship,
    signReissue,
    signSetAssetScript,
    signInvokeScript,
    isSigning,
  } = useTransactionSigning();

  /**
   * Reset flow state when modal closes
   */
  const handleClose = useCallback(() => {
    setStep('review');
    setError(null);
    setTransactionId(null);
    onClose();
  }, [onClose]);

  /**
   * Prevent close during processing
   */
  const handleModalClose = useCallback(() => {
    // Only allow closing in review, success, or error states
    if (step === 'review' || step === 'success' || step === 'error') {
      handleClose();
    }
  }, [step, handleClose]);

  /**
   * Dispatch signing to the correct builder based on the normalised type string.
   * Using a switch instead of a nested ternary keeps cyclomatic complexity low,
   * makes dead-code analysis tractable, and satisfies enterprise readability standards.
   */
  const signByType = useCallback(
    (type: string): Promise<unknown> => {
      switch (type) {
        case 'alias':
          return signAlias(cast<Omit<IAliasParams, 'chainId' | 'senderPublicKey'>>(params));
        case 'data':
          return signData(cast<Omit<IDataParams, 'chainId' | 'senderPublicKey'>>(params));
        case 'masstransfer':
        case 'mass-transfer':
          return signMassTransfer(
            cast<Omit<IMassTransferParams, 'chainId' | 'senderPublicKey'>>(params),
          );
        case 'setscript':
        case 'set-script':
          return signSetScript(cast<Omit<ISetScriptParams, 'chainId' | 'senderPublicKey'>>(params));
        case 'issue':
          return signIssue(cast<Omit<IIssueParams, 'chainId' | 'senderPublicKey'>>(params));
        case 'lease':
          return signLease(cast<Omit<ILeaseParams, 'chainId' | 'senderPublicKey'>>(params));
        case 'cancellease':
        case 'cancel-lease':
          return signCancelLease(
            cast<Omit<ICancelLeaseParams, 'chainId' | 'senderPublicKey'>>(params),
          );
        case 'burn':
          return signBurn(cast<Omit<IBurnParams, 'chainId' | 'senderPublicKey'>>(params));
        case 'sponsorship':
          return signSponsorship(
            cast<Omit<ISponsorshipParams, 'chainId' | 'senderPublicKey'>>(params),
          );
        case 'reissue':
          return signReissue(cast<Omit<IReissueParams, 'chainId' | 'senderPublicKey'>>(params));
        case 'setassetscript':
        case 'set-asset-script':
          return signSetAssetScript(
            cast<Omit<ISetAssetScriptParams, 'chainId' | 'senderPublicKey'>>(params),
          );
        case 'invokescript':
        case 'invoke-script':
          return signInvokeScript(
            cast<Omit<IInvokeScriptParams, 'chainId' | 'senderPublicKey'>>(params),
          );
        default:
          return signTransfer(cast<Omit<ITransferParams, 'chainId' | 'senderPublicKey'>>(params));
      }
    },
    [
      params,
      signAlias,
      signBurn,
      signCancelLease,
      signData,
      signInvokeScript,
      signIssue,
      signLease,
      signMassTransfer,
      signReissue,
      signSetAssetScript,
      signSetScript,
      signSponsorship,
      signTransfer,
    ],
  );

  /**
   * Execute transaction: sign → broadcast → wait for confirmation
   */
  const handleConfirm = useCallback(async () => {
    try {
      setError(null);

      // Step 1: Signing
      setStep('signing');
      const type = transactionType?.toLowerCase() ?? 'transfer';
      const signedTx = await signByType(type);

      // Step 2: Broadcasting
      setStep('broadcasting');
      const broadcastResult = await transactionService.broadcast(signedTx);

      if (broadcastResult.status === 'error') {
        throw new Error(broadcastResult.error || 'Broadcast failed');
      }

      setTransactionId(broadcastResult.id);

      // Step 3: Wait for confirmation (optional)
      setStep('confirming');
      const confirmedTx = await transactionService.waitForConfirmation(
        broadcastResult.id,
        60000, // 60 second timeout
      );

      // Step 4: Success
      setStep('success');
      if (onSuccess && confirmedTx) {
        onSuccess(confirmedTx);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      setStep('error');
    }
  }, [transactionType, signByType, onSuccess]);

  /**
   * Retry after error
   */
  const handleRetry = useCallback(() => {
    setStep('review');
    setError(null);
  }, []);

  /**
   * Render step content
   */
  const renderContent = () => {
    switch (step) {
      case 'review':
        return (
          <>
            <Content>
              <h3 style={{ margin: 0 }}>Review Transaction</h3>
              <ReviewSection>
                <ReviewRow>
                  <Label>Type</Label>
                  <Value>{transactionType}</Value>
                </ReviewRow>
                <ReviewRow>
                  <Label>Recipient</Label>
                  <Value>{String(params['recipient'] ?? '')}</Value>
                </ReviewRow>
                <ReviewRow>
                  <Label>Amount</Label>
                  <Value>{(Number(params['amount']) || 0) / 100000000} DCC</Value>
                </ReviewRow>
                {!!params['fee'] && (
                  <ReviewRow>
                    <Label>Fee</Label>
                    <Value>{(Number(params['fee']) || 0) / 100000000} DCC</Value>
                  </ReviewRow>
                )}
                {!!params['attachment'] && (
                  <ReviewRow>
                    <Label>Attachment</Label>
                    <Value>{String(params['attachment'] ?? '')}</Value>
                  </ReviewRow>
                )}
              </ReviewSection>
            </Content>
            <ButtonGroup>
              <Button variant="secondary" onClick={handleClose}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleConfirm} disabled={isSigning}>
                Confirm & Send
              </Button>
            </ButtonGroup>
          </>
        );

      case 'signing':
        return (
          <StatusContainer>
            <Spinner size="lg" />
            <StatusMessage>Signing transaction...</StatusMessage>
            <p style={{ color: '#666', fontSize: '14px', margin: 0 }}>
              Please wait while we sign your transaction
            </p>
          </StatusContainer>
        );

      case 'broadcasting':
        return (
          <StatusContainer>
            <Spinner size="lg" />
            <StatusMessage>Broadcasting to network...</StatusMessage>
            <p style={{ color: '#666', fontSize: '14px', margin: 0 }}>
              Sending transaction to blockchain
            </p>
          </StatusContainer>
        );

      case 'confirming':
        return (
          <StatusContainer>
            <Spinner size="lg" />
            <StatusMessage>Waiting for confirmation...</StatusMessage>
            <p style={{ color: '#666', fontSize: '14px', margin: 0 }}>
              Transaction ID: {transactionId?.slice(0, 16)}...
            </p>
          </StatusContainer>
        );

      case 'success':
        return (
          <>
            <StatusContainer>
              <SuccessIcon>✓</SuccessIcon>
              <StatusMessage>Transaction Successful!</StatusMessage>
              <p style={{ color: '#666', fontSize: '14px', margin: 0 }}>
                Your transaction has been confirmed on the blockchain
              </p>
              {transactionId && (
                <p
                  style={{
                    color: '#999',
                    fontFamily: 'monospace',
                    fontSize: '12px',
                    margin: '8px 0 0 0',
                  }}
                >
                  ID: {transactionId}
                </p>
              )}
            </StatusContainer>
            <ButtonGroup>
              <Button variant="primary" onClick={handleClose}>
                Close
              </Button>
            </ButtonGroup>
          </>
        );

      case 'error':
        return (
          <>
            <StatusContainer>
              <div
                style={{
                  alignItems: 'center',
                  backgroundColor: 'rgba(239, 68, 68, 0.2)',
                  borderRadius: '50%',
                  color: '#EF4444',
                  display: 'flex',
                  fontSize: '32px',
                  height: '64px',
                  justifyContent: 'center',
                  width: '64px',
                }}
              >
                ✕
              </div>
              <StatusMessage>Transaction Failed</StatusMessage>
              <ErrorMessage>{error}</ErrorMessage>
            </StatusContainer>
            <ButtonGroup>
              <Button variant="secondary" onClick={handleClose}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleRetry}>
                Retry
              </Button>
            </ButtonGroup>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <Modal
      open={open}
      onClose={handleModalClose}
      title={step === 'review' ? 'Confirm Transaction' : 'Processing Transaction'}
      size="medium"
    >
      {renderContent()}
    </Modal>
  );
};

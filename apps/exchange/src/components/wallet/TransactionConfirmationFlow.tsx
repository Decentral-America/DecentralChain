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

/**
 * Strips the network-specific fields that are injected by the signing layer.
 * All transaction param interfaces extend IBasicParams which carries these fields;
 * callers construct params without them and the signer fills them in at sign-time.
 */
export type TxOmit<T> = Omit<T, 'chainId' | 'senderPublicKey'>;

/**
 * Discriminated union that pairs each canonical transaction-type string with its
 * correctly-typed params object. TypeScript narrows params automatically when
 * transactionType is checked in a switch.
 */
export type TxVariant =
  | { transactionType: 'transfer'; params: TxOmit<ITransferParams> }
  | { transactionType: 'alias'; params: TxOmit<IAliasParams> }
  | { transactionType: 'data'; params: TxOmit<IDataParams> }
  | { transactionType: 'massTransfer'; params: TxOmit<IMassTransferParams> }
  | { transactionType: 'setScript'; params: TxOmit<ISetScriptParams> }
  | { transactionType: 'issue'; params: TxOmit<IIssueParams> }
  | { transactionType: 'lease'; params: TxOmit<ILeaseParams> }
  | { transactionType: 'cancelLease'; params: TxOmit<ICancelLeaseParams> }
  | { transactionType: 'burn'; params: TxOmit<IBurnParams> }
  | { transactionType: 'sponsorship'; params: TxOmit<ISponsorshipParams> }
  | { transactionType: 'reissue'; params: TxOmit<IReissueParams> }
  | { transactionType: 'setAssetScript'; params: TxOmit<ISetAssetScriptParams> }
  | { transactionType: 'invokeScript'; params: TxOmit<IInvokeScriptParams> };

type SignerMap = {
  signTransfer: (p: TxOmit<ITransferParams>) => Promise<unknown>;
  signAlias: (p: TxOmit<IAliasParams>) => Promise<unknown>;
  signData: (p: TxOmit<IDataParams>) => Promise<unknown>;
  signMassTransfer: (p: TxOmit<IMassTransferParams>) => Promise<unknown>;
  signSetScript: (p: TxOmit<ISetScriptParams>) => Promise<unknown>;
  signIssue: (p: TxOmit<IIssueParams>) => Promise<unknown>;
  signLease: (p: TxOmit<ILeaseParams>) => Promise<unknown>;
  signCancelLease: (p: TxOmit<ICancelLeaseParams>) => Promise<unknown>;
  signBurn: (p: TxOmit<IBurnParams>) => Promise<unknown>;
  signSponsorship: (p: TxOmit<ISponsorshipParams>) => Promise<unknown>;
  signReissue: (p: TxOmit<IReissueParams>) => Promise<unknown>;
  signSetAssetScript: (p: TxOmit<ISetAssetScriptParams>) => Promise<unknown>;
  signInvokeScript: (p: TxOmit<IInvokeScriptParams>) => Promise<unknown>;
};

/**
 * Pure dispatch function — maps each TxVariant member to its corresponding signer.
 * Resides at module scope so TypeScript can verify exhaustiveness and callers can
 * unit-test dispatch logic without mounting the component.
 */
function signVariant(variant: TxVariant, signers: SignerMap): Promise<unknown> {
  switch (variant.transactionType) {
    case 'transfer':
      return signers.signTransfer(variant.params);
    case 'alias':
      return signers.signAlias(variant.params);
    case 'data':
      return signers.signData(variant.params);
    case 'massTransfer':
      return signers.signMassTransfer(variant.params);
    case 'setScript':
      return signers.signSetScript(variant.params);
    case 'issue':
      return signers.signIssue(variant.params);
    case 'lease':
      return signers.signLease(variant.params);
    case 'cancelLease':
      return signers.signCancelLease(variant.params);
    case 'burn':
      return signers.signBurn(variant.params);
    case 'sponsorship':
      return signers.signSponsorship(variant.params);
    case 'reissue':
      return signers.signReissue(variant.params);
    case 'setAssetScript':
      return signers.signSetAssetScript(variant.params);
    case 'invokeScript':
      return signers.signInvokeScript(variant.params);
  }
}

const DCC_DECIMALS = 1e8;

/**
 * Renders the per-transaction-type review rows inside the confirmation modal.
 * Module-level so TypeScript can verify exhaustiveness independently of the render tree.
 */
// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: exhaustive discriminated-union renderer — complexity is proportional to the number of transaction types (13), not to implementation choices.
function renderReviewFields(variant: TxVariant): React.ReactNode {
  switch (variant.transactionType) {
    case 'transfer':
      return (
        <>
          <ReviewRow>
            <Label>Recipient</Label>
            <Value>{variant.params.recipient}</Value>
          </ReviewRow>
          <ReviewRow>
            <Label>Amount</Label>
            <Value>{(Number(variant.params.amount) || 0) / DCC_DECIMALS} DCC</Value>
          </ReviewRow>
          {variant.params.fee != null && (
            <ReviewRow>
              <Label>Fee</Label>
              <Value>{(Number(variant.params.fee) || 0) / DCC_DECIMALS} DCC</Value>
            </ReviewRow>
          )}
          {!!variant.params.attachment && (
            <ReviewRow>
              <Label>Attachment</Label>
              <Value>{String(variant.params.attachment)}</Value>
            </ReviewRow>
          )}
        </>
      );
    case 'alias':
      return (
        <>
          <ReviewRow>
            <Label>Alias</Label>
            <Value>{variant.params.alias}</Value>
          </ReviewRow>
          {variant.params.fee != null && (
            <ReviewRow>
              <Label>Fee</Label>
              <Value>{(Number(variant.params.fee) || 0) / DCC_DECIMALS} DCC</Value>
            </ReviewRow>
          )}
        </>
      );
    case 'data':
      return (
        <>
          <ReviewRow>
            <Label>Entries</Label>
            <Value>{variant.params.data.length} entry(ies)</Value>
          </ReviewRow>
          {variant.params.fee != null && (
            <ReviewRow>
              <Label>Fee</Label>
              <Value>{(Number(variant.params.fee) || 0) / DCC_DECIMALS} DCC</Value>
            </ReviewRow>
          )}
        </>
      );
    case 'massTransfer':
      return (
        <>
          <ReviewRow>
            <Label>Recipients</Label>
            <Value>{variant.params.transfers.length} transfer(s)</Value>
          </ReviewRow>
          {variant.params.assetId != null && (
            <ReviewRow>
              <Label>Asset ID</Label>
              <Value>{variant.params.assetId}</Value>
            </ReviewRow>
          )}
          {variant.params.fee != null && (
            <ReviewRow>
              <Label>Fee</Label>
              <Value>{(Number(variant.params.fee) || 0) / DCC_DECIMALS} DCC</Value>
            </ReviewRow>
          )}
        </>
      );
    case 'setScript':
      return (
        <>
          <ReviewRow>
            <Label>Script</Label>
            <Value>
              {variant.params.script
                ? `${variant.params.script.slice(0, 20)}\u2026`
                : 'Remove script'}
            </Value>
          </ReviewRow>
          {variant.params.fee != null && (
            <ReviewRow>
              <Label>Fee</Label>
              <Value>{(Number(variant.params.fee) || 0) / DCC_DECIMALS} DCC</Value>
            </ReviewRow>
          )}
        </>
      );
    case 'issue':
      return (
        <>
          <ReviewRow>
            <Label>Name</Label>
            <Value>{variant.params.name}</Value>
          </ReviewRow>
          <ReviewRow>
            <Label>Quantity</Label>
            <Value>{String(variant.params.quantity)}</Value>
          </ReviewRow>
          {variant.params.fee != null && (
            <ReviewRow>
              <Label>Fee</Label>
              <Value>{(Number(variant.params.fee) || 0) / DCC_DECIMALS} DCC</Value>
            </ReviewRow>
          )}
        </>
      );
    case 'lease':
      return (
        <>
          <ReviewRow>
            <Label>Recipient</Label>
            <Value>{variant.params.recipient}</Value>
          </ReviewRow>
          <ReviewRow>
            <Label>Amount</Label>
            <Value>{(Number(variant.params.amount) || 0) / DCC_DECIMALS} DCC</Value>
          </ReviewRow>
          {variant.params.fee != null && (
            <ReviewRow>
              <Label>Fee</Label>
              <Value>{(Number(variant.params.fee) || 0) / DCC_DECIMALS} DCC</Value>
            </ReviewRow>
          )}
        </>
      );
    case 'cancelLease':
      return (
        <>
          <ReviewRow>
            <Label>Lease ID</Label>
            <Value>{variant.params.leaseId}</Value>
          </ReviewRow>
          {variant.params.fee != null && (
            <ReviewRow>
              <Label>Fee</Label>
              <Value>{(Number(variant.params.fee) || 0) / DCC_DECIMALS} DCC</Value>
            </ReviewRow>
          )}
        </>
      );
    case 'burn':
      return (
        <>
          <ReviewRow>
            <Label>Asset ID</Label>
            <Value>{variant.params.assetId}</Value>
          </ReviewRow>
          <ReviewRow>
            <Label>Amount</Label>
            <Value>{String(variant.params.amount)}</Value>
          </ReviewRow>
          {variant.params.fee != null && (
            <ReviewRow>
              <Label>Fee</Label>
              <Value>{(Number(variant.params.fee) || 0) / DCC_DECIMALS} DCC</Value>
            </ReviewRow>
          )}
        </>
      );
    case 'reissue':
      return (
        <>
          <ReviewRow>
            <Label>Asset ID</Label>
            <Value>{variant.params.assetId}</Value>
          </ReviewRow>
          <ReviewRow>
            <Label>Quantity</Label>
            <Value>{String(variant.params.quantity)}</Value>
          </ReviewRow>
          {variant.params.fee != null && (
            <ReviewRow>
              <Label>Fee</Label>
              <Value>{(Number(variant.params.fee) || 0) / DCC_DECIMALS} DCC</Value>
            </ReviewRow>
          )}
        </>
      );
    case 'sponsorship':
      return (
        <>
          <ReviewRow>
            <Label>Asset ID</Label>
            <Value>{variant.params.assetId}</Value>
          </ReviewRow>
          <ReviewRow>
            <Label>Min Sponsored Fee</Label>
            <Value>
              {variant.params.minSponsoredAssetFee != null
                ? String(variant.params.minSponsoredAssetFee)
                : 'Disable sponsorship'}
            </Value>
          </ReviewRow>
          {variant.params.fee != null && (
            <ReviewRow>
              <Label>Fee</Label>
              <Value>{(Number(variant.params.fee) || 0) / DCC_DECIMALS} DCC</Value>
            </ReviewRow>
          )}
        </>
      );
    case 'setAssetScript':
      return (
        <>
          <ReviewRow>
            <Label>Asset ID</Label>
            <Value>{variant.params.assetId}</Value>
          </ReviewRow>
          <ReviewRow>
            <Label>Script</Label>
            <Value>
              {variant.params.script
                ? `${variant.params.script.slice(0, 20)}\u2026`
                : 'Remove script'}
            </Value>
          </ReviewRow>
          {variant.params.fee != null && (
            <ReviewRow>
              <Label>Fee</Label>
              <Value>{(Number(variant.params.fee) || 0) / DCC_DECIMALS} DCC</Value>
            </ReviewRow>
          )}
        </>
      );
    case 'invokeScript':
      return (
        <>
          <ReviewRow>
            <Label>dApp</Label>
            <Value>{variant.params.dApp}</Value>
          </ReviewRow>
          {variant.params.call != null && (
            <ReviewRow>
              <Label>Function</Label>
              <Value>{variant.params.call.function}</Value>
            </ReviewRow>
          )}
          {variant.params.fee != null && (
            <ReviewRow>
              <Label>Fee</Label>
              <Value>{(Number(variant.params.fee) || 0) / DCC_DECIMALS} DCC</Value>
            </ReviewRow>
          )}
        </>
      );
  }
}

/**
 * Transaction Flow Steps
 */
type ConfirmationStep = 'review' | 'signing' | 'broadcasting' | 'confirming' | 'success' | 'error';

type BaseProps = {
  open: boolean;
  onClose: () => void;
  onSuccess?: (transaction: Transaction) => void;
};

/**
 * Props are a discriminated union: transactionType narrows params to the exact
 * interface required by that transaction type. No runtime casting, no escape hatches.
 */
export type TransactionConfirmationProps = BaseProps & TxVariant;

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
 *   transactionType="transfer"
 *   params={{ recipient: '3N…', amount: 100000000 }}
 *   onSuccess={(tx) => console.log('Transaction sent:', tx.id)}
 * />
 * ```
 */
export const TransactionConfirmationFlow: React.FC<TransactionConfirmationProps> = (props) => {
  const { open, onClose, onSuccess } = props;
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
   * Execute transaction: sign → broadcast → wait for confirmation.
   * signVariant is a module-level pure function; TypeScript verifies exhaustiveness
   * at compile time — no runtime casts anywhere in this path.
   */
  const handleConfirm = useCallback(async () => {
    try {
      setError(null);

      // Step 1: Signing
      setStep('signing');
      // props is the discriminated-union type; narrowing in signVariant is compile-time verified
      const variant: TxVariant = props;
      const signedTx = await signVariant(variant, {
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
      });

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
  }, [
    props,
    onSuccess,
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
  ]);

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
      case 'review': {
        const variant: TxVariant = props;
        return (
          <>
            <Content>
              <h3 style={{ margin: 0 }}>Review Transaction</h3>
              <ReviewSection>
                <ReviewRow>
                  <Label>Type</Label>
                  <Value>{props.transactionType}</Value>
                </ReviewRow>
                {renderReviewFields(variant)}
              </ReviewSection>
            </Content>
            <ButtonGroup>
              <Button variant="secondary" onClick={handleClose}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleConfirm} disabled={isSigning}>
                Confirm &amp; Send
              </Button>
            </ButtonGroup>
          </>
        );
      }

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

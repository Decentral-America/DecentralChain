/**
 * Transaction Details Modal
 * Displays comprehensive transaction information in a formatted, readable view
 * Supports all 17 transaction types with type-specific field display
 */
import type React from 'react';
import styled from 'styled-components';
import { Modal } from '@/components/modals/Modal';
import {
  type Transaction,
  TransactionType,
  type TransferTransaction,
  transactionService,
  waveletsToCoins,
} from '@/services/transactionService';

/**
 * Component Props
 */
export interface TransactionDetailsModalProps {
  open: boolean;
  onClose: () => void;
  transaction: Transaction | null;
}

/**
 * Styled Components
 */
const DetailsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  max-height: 600px;
  overflow-y: auto;
`;

const Section = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const SectionTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text};
  margin: 0;
  padding-bottom: 8px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
`;

const DetailRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 8px 0;
`;

const Label = styled.span`
  font-size: 14px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.disabled};
  min-width: 120px;
`;

const Value = styled.span`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.text};
  text-align: right;
  word-break: break-all;
  flex: 1;
  font-family: 'Courier New', monospace;
`;

const StatusBadge = styled.span<{ status: string }>`
  display: inline-block;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  background-color: ${({ status, theme }) => {
    switch (status) {
      case 'confirmed':
        return `${theme.colors.success}20`;
      case 'unconfirmed':
        return `${theme.colors.warning}20`;
      case 'failed':
        return `${theme.colors.error}20`;
      default:
        return theme.colors.border;
    }
  }};
  color: ${({ status, theme }) => {
    switch (status) {
      case 'confirmed':
        return theme.colors.success;
      case 'unconfirmed':
        return theme.colors.warning;
      case 'failed':
        return theme.colors.error;
      default:
        return theme.colors.text;
    }
  }};
`;

const ProofsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-height: 150px;
  overflow-y: auto;
`;

const ProofItem = styled.div`
  font-size: 12px;
  font-family: 'Courier New', monospace;
  color: ${({ theme }) => theme.colors.disabled};
  padding: 4px;
  background-color: ${({ theme }) => theme.colors.background};
  border-radius: 4px;
`;

/**
 * Transaction Details Modal Component
 *
 * @example
 * ```tsx
 * const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
 *
 * <TransactionDetailsModal
 *   open={!!selectedTx}
 *   onClose={() => setSelectedTx(null)}
 *   transaction={selectedTx}
 * />
 * ```
 */
export const TransactionDetailsModal: React.FC<TransactionDetailsModalProps> = ({
  open,
  onClose,
  transaction,
}) => {
  if (!transaction) {
    return null;
  }

  // Get transaction status
  const status = transaction.height && transaction.height > 0 ? 'confirmed' : 'unconfirmed';

  // Get transaction type name
  const typeName = transactionService.getTypeName(transaction.type);

  // Format timestamp
  const formattedDate = new Date(transaction.timestamp).toLocaleString();

  // Convert fee from wavelets to DCC
  const feeInDCC = waveletsToCoins(transaction.fee);

  return (
    <Modal open={open} onClose={onClose} title="Transaction Details" size="medium">
      <DetailsContainer>
        {/* Status Section */}
        <Section>
          <SectionTitle>Status</SectionTitle>
          <DetailRow>
            <Label>Status</Label>
            <StatusBadge status={status}>{status}</StatusBadge>
          </DetailRow>
          {transaction.height && (
            <DetailRow>
              <Label>Block Height</Label>
              <Value>{transaction.height.toLocaleString()}</Value>
            </DetailRow>
          )}
          {transaction.applicationStatus && (
            <DetailRow>
              <Label>Script Status</Label>
              <StatusBadge status={transaction.applicationStatus}>
                {transaction.applicationStatus}
              </StatusBadge>
            </DetailRow>
          )}
        </Section>

        {/* Basic Information */}
        <Section>
          <SectionTitle>Basic Information</SectionTitle>
          <DetailRow>
            <Label>Transaction ID</Label>
            <Value>{transaction.id}</Value>
          </DetailRow>
          <DetailRow>
            <Label>Type</Label>
            <Value>
              {typeName} (Type {transaction.type})
            </Value>
          </DetailRow>
          <DetailRow>
            <Label>Timestamp</Label>
            <Value>{formattedDate}</Value>
          </DetailRow>
          <DetailRow>
            <Label>Sender</Label>
            <Value>{transaction.sender}</Value>
          </DetailRow>
          <DetailRow>
            <Label>Sender Public Key</Label>
            <Value>{transaction.senderPublicKey}</Value>
          </DetailRow>
        </Section>

        {/* Fee Information */}
        <Section>
          <SectionTitle>Fee</SectionTitle>
          <DetailRow>
            <Label>Fee Amount</Label>
            <Value>
              {feeInDCC} DCC ({transaction.fee.toLocaleString()} wavelets)
            </Value>
          </DetailRow>
          {transaction.feeAssetId && (
            <DetailRow>
              <Label>Fee Asset ID</Label>
              <Value>{transaction.feeAssetId}</Value>
            </DetailRow>
          )}
        </Section>

        {/* Type-Specific Fields */}
        {transaction.type === TransactionType.Transfer && 'recipient' in transaction && (
          <Section>
            <SectionTitle>Transfer Details</SectionTitle>
            <DetailRow>
              <Label>Recipient</Label>
              <Value>{(transaction as TransferTransaction).recipient}</Value>
            </DetailRow>
            <DetailRow>
              <Label>Amount</Label>
              <Value>{waveletsToCoins((transaction as TransferTransaction).amount)} DCC</Value>
            </DetailRow>
            {(transaction as TransferTransaction).assetId && (
              <DetailRow>
                <Label>Asset ID</Label>
                <Value>{(transaction as TransferTransaction).assetId}</Value>
              </DetailRow>
            )}
            {(transaction as TransferTransaction).attachment && (
              <DetailRow>
                <Label>Attachment</Label>
                <Value>{(transaction as TransferTransaction).attachment}</Value>
              </DetailRow>
            )}
          </Section>
        )}

        {/* Proofs Section */}
        <Section>
          <SectionTitle>Proofs ({transaction.proofs.length})</SectionTitle>
          <ProofsList>
            {transaction.proofs.map((proof, index) => (
              <ProofItem key={proof}>
                {index + 1}. {proof}
              </ProofItem>
            ))}
          </ProofsList>
        </Section>
      </DetailsContainer>
    </Modal>
  );
};

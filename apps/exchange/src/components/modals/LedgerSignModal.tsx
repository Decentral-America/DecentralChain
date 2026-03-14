/**
 * LedgerSignModal Component
 * Displays transaction details while waiting for user confirmation on Ledger device
 */

import styled, { keyframes } from 'styled-components';

interface LedgerSignModalProps {
  txType: string;
  amount?: string;
  recipient?: string;
  fee: string;
}

const LedgerSignModal: React.FC<LedgerSignModalProps> = ({ txType, amount, recipient, fee }) => {
  return (
    <Overlay>
      <Modal>
        <DeviceIcon>🔐</DeviceIcon>
        <Title>Confirm on Ledger</Title>
        <Subtitle>Please review and confirm the transaction on your device</Subtitle>

        <TxDetails>
          <DetailRow>
            <DetailLabel>Type:</DetailLabel>
            <DetailValue>{txType}</DetailValue>
          </DetailRow>

          {amount && (
            <DetailRow>
              <DetailLabel>Amount:</DetailLabel>
              <DetailValue>{amount}</DetailValue>
            </DetailRow>
          )}

          {recipient && (
            <DetailRow>
              <DetailLabel>Recipient:</DetailLabel>
              <DetailValue>{recipient}</DetailValue>
            </DetailRow>
          )}

          <DetailRow>
            <DetailLabel>Fee:</DetailLabel>
            <DetailValue>{fee}</DetailValue>
          </DetailRow>
        </TxDetails>

        <Instruction>Press both buttons on your Ledger to confirm</Instruction>

        <Loader />
      </Modal>
    </Overlay>
  );
};

export default LedgerSignModal;

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const Modal = styled.div`
  background: ${(p) => p.theme.colors.background};
  border-radius: ${(p) => p.theme.radii.lg};
  padding: 2rem;
  text-align: center;
  max-width: 500px;
  box-shadow: ${(p) => p.theme.shadows.xl};
`;

const DeviceIcon = styled.div`
  font-size: 3.5rem;
  margin-bottom: 1rem;
`;

const Title = styled.h2`
  font-size: ${(p) => p.theme.fontSizes.xl};
  margin-bottom: 0.5rem;
  color: ${(p) => p.theme.colors.text};
`;

const Subtitle = styled.p`
  color: ${(p) => p.theme.colors.text};
  opacity: 0.6;
  margin-bottom: 2rem;
  font-size: ${(p) => p.theme.fontSizes.sm};
`;

const TxDetails = styled.div`
  background: ${(p) => p.theme.colors.hover};
  border-radius: ${(p) => p.theme.radii.md};
  padding: 1.5rem;
  margin-bottom: 2rem;
  text-align: left;
`;

const DetailRow = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.75rem;

  &:last-child {
    margin-bottom: 0;
    padding-top: 0.75rem;
    border-top: 1px solid ${(p) => p.theme.colors.border};
    font-weight: ${(p) => p.theme.fontWeights.semibold};
  }
`;

const DetailLabel = styled.span`
  color: ${(p) => p.theme.colors.text};
  opacity: 0.6;
  font-size: ${(p) => p.theme.fontSizes.sm};
`;

const DetailValue = styled.span`
  font-weight: ${(p) => p.theme.fontWeights.medium};
  color: ${(p) => p.theme.colors.text};
  font-size: ${(p) => p.theme.fontSizes.sm};
`;

const Instruction = styled.p`
  color: ${(p) => p.theme.colors.primary};
  font-weight: ${(p) => p.theme.fontWeights.medium};
  margin-bottom: 1.5rem;
  font-size: ${(p) => p.theme.fontSizes.sm};
`;

const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

const Loader = styled.div`
  width: 40px;
  height: 40px;
  margin: 0 auto;
  border: 4px solid ${(p) => p.theme.colors.hover};
  border-top: 4px solid ${(p) => p.theme.colors.primary};
  border-radius: 50%;
  animation: ${spin} 1s linear infinite;
`;

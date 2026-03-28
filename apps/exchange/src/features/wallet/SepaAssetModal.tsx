/**
 * SEPA Asset Modal
 * Modal for SEPA bank transfers for fiat assets
 * Matches Angular modalManager.showSepaAsset functionality
 */

import styled from 'styled-components';
import { Modal } from '@/components/organisms/Modal';

interface SepaAssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  assetId: string;
  assetName?: string;
}

export function SepaAssetModal({ isOpen, onClose, assetId, assetName }: SepaAssetModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`SEPA Transfer - ${assetName ?? assetId}`}>
      <Content>
        <Warning>
          <WarningIcon>⚠️</WarningIcon>
          <WarningText>
            SEPA transfers are only available for Euro (EUR) deposits and withdrawals. Processing
            time may take 1-3 business days.
          </WarningText>
        </Warning>

        <Section>
          <SectionTitle>How to deposit via SEPA:</SectionTitle>
          <StepList>
            <Step>
              <StepNumber>1</StepNumber>
              <StepText>Login to your online banking or visit your bank</StepText>
            </Step>
            <Step>
              <StepNumber>2</StepNumber>
              <StepText>Create a new SEPA transfer with the bank details provided below</StepText>
            </Step>
            <Step>
              <StepNumber>3</StepNumber>
              <StepText>Include your DCC address in the payment reference field</StepText>
            </Step>
            <Step>
              <StepNumber>4</StepNumber>
              <StepText>Wait for the transfer to complete (typically 1-3 business days)</StepText>
            </Step>
          </StepList>
        </Section>

        <Section>
          <SectionTitle>Bank Details:</SectionTitle>
          <InfoGrid>
            <InfoRow>
              <InfoLabel>Bank Name:</InfoLabel>
              <InfoValue>Contact gateway provider for details</InfoValue>
            </InfoRow>
            <InfoRow>
              <InfoLabel>IBAN:</InfoLabel>
              <InfoValue>Contact gateway provider for details</InfoValue>
            </InfoRow>
            <InfoRow>
              <InfoLabel>BIC/SWIFT:</InfoLabel>
              <InfoValue>Contact gateway provider for details</InfoValue>
            </InfoRow>
            <InfoRow>
              <InfoLabel>Reference:</InfoLabel>
              <InfoValue>Your DCC address (required)</InfoValue>
            </InfoRow>
          </InfoGrid>
        </Section>

        <Note>
          Note: SEPA functionality requires gateway provider configuration. Please contact support
          for complete bank transfer details.
        </Note>
      </Content>
    </Modal>
  );
}

const Content = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${(p) => p.theme.spacing.lg};
  padding: ${(p) => p.theme.spacing.md};
`;

const Warning = styled.div`
  display: flex;
  gap: ${(p) => p.theme.spacing.sm};
  padding: ${(p) => p.theme.spacing.md};
  background: ${(p) => p.theme.colors.warning || '#fff3cd'};
  border: 1px solid #ffc107;
  border-radius: ${(p) => p.theme.radii.md};
`;

const WarningIcon = styled.div`
  font-size: 20px;
  flex-shrink: 0;
`;

const WarningText = styled.div`
  color: ${(p) => p.theme.colors.text};
  font-size: ${(p) => p.theme.fontSizes.sm};
  line-height: 1.5;
`;

const Section = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${(p) => p.theme.spacing.md};
`;

const SectionTitle = styled.h3`
  font-size: ${(p) => p.theme.fontSizes.lg};
  font-weight: ${(p) => p.theme.fontWeights.semibold};
  color: ${(p) => p.theme.colors.text};
  margin: 0;
`;

const StepList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${(p) => p.theme.spacing.md};
`;

const Step = styled.div`
  display: flex;
  gap: ${(p) => p.theme.spacing.sm};
  align-items: flex-start;
`;

const StepNumber = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  flex-shrink: 0;
  background: ${(p) => p.theme.colors.primary};
  color: white;
  border-radius: 50%;
  font-weight: ${(p) => p.theme.fontWeights.bold};
  font-size: ${(p) => p.theme.fontSizes.sm};
`;

const StepText = styled.div`
  flex: 1;
  color: ${(p) => p.theme.colors.text};
  line-height: 1.5;
  padding-top: 4px;
`;

const InfoGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${(p) => p.theme.spacing.sm};
`;

const InfoRow = styled.div`
  display: grid;
  grid-template-columns: 150px 1fr;
  gap: ${(p) => p.theme.spacing.md};
  padding: ${(p) => p.theme.spacing.sm} 0;
  border-bottom: 1px solid ${(p) => p.theme.colors.border};

  &:last-child {
    border-bottom: none;
  }
`;

const InfoLabel = styled.div`
  font-weight: ${(p) => p.theme.fontWeights.semibold};
  color: ${(p) => p.theme.colors.text};
  opacity: 0.7;
`;

const InfoValue = styled.div`
  color: ${(p) => p.theme.colors.text};
`;

const Note = styled.div`
  font-size: ${(p) => p.theme.fontSizes.sm};
  color: ${(p) => p.theme.colors.text};
  opacity: 0.7;
  padding: ${(p) => p.theme.spacing.sm};
  background: ${(p) => p.theme.colors.background};
  border-radius: ${(p) => p.theme.radii.sm};
  border-left: 3px solid ${(p) => p.theme.colors.primary};
`;

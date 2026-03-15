/**
 * LedgerErrorModal Component
 * Displays connection errors and troubleshooting instructions
 */

import styled from 'styled-components';
import { Button } from '@/components/atoms/Button';
import { Stack } from '@/components/atoms/Stack';

interface LedgerErrorModalProps {
  error: Error | null;
  onRetry: () => void;
  onCancel: () => void;
}

const LedgerErrorModal: React.FC<LedgerErrorModalProps> = ({ error, onRetry, onCancel }) => {
  return (
    <Overlay>
      <Modal>
        <ErrorIcon>⚠️</ErrorIcon>
        <Title>Connection Error</Title>
        <Message>{error?.message || 'Failed to connect to Ledger device'}</Message>

        <Instructions>
          <InstructionTitle>Please ensure:</InstructionTitle>
          <InstructionList>
            <li>Your Ledger device is connected via USB</li>
            <li>The device is unlocked (PIN entered)</li>
            <li>The DCC application is open on the device</li>
            <li>Browser support is enabled in DCC app Settings</li>
          </InstructionList>
        </Instructions>

        <SupportLink
          href="https://support.ledger.com/hc/en-us/articles/115005165269-Fix-connection-issues"
          target="_blank"
          rel="noopener noreferrer"
        >
          View troubleshooting guide →
        </SupportLink>

        <Stack gap="12px" direction="row">
          <Button variant="primary" onClick={onRetry} fullWidth>
            Retry Connection
          </Button>
          <Button variant="secondary" onClick={onCancel} fullWidth>
            Go Back
          </Button>
        </Stack>
      </Modal>
    </Overlay>
  );
};

export default LedgerErrorModal;

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
  max-width: 500px;
  text-align: center;
  box-shadow: ${(p) => p.theme.shadows.xl};
`;

const ErrorIcon = styled.div`
  font-size: 4rem;
  margin-bottom: 1rem;
`;

const Title = styled.h2`
  font-size: ${(p) => p.theme.fontSizes.xl};
  color: ${(p) => p.theme.colors.error};
  margin-bottom: 1rem;
`;

const Message = styled.p`
  color: ${(p) => p.theme.colors.text};
  opacity: 0.7;
  margin-bottom: 2rem;
  font-size: ${(p) => p.theme.fontSizes.sm};
`;

const Instructions = styled.div`
  background: ${(p) => p.theme.colors.hover};
  border-radius: ${(p) => p.theme.radii.md};
  padding: 1.5rem;
  text-align: left;
  margin-bottom: 1.5rem;
`;

const InstructionTitle = styled.h3`
  font-size: ${(p) => p.theme.fontSizes.md};
  margin-bottom: 1rem;
  color: ${(p) => p.theme.colors.text};
`;

const InstructionList = styled.ul`
  list-style-position: inside;
  padding: 0;

  li {
    margin-bottom: 0.5rem;
    color: ${(p) => p.theme.colors.text};
    opacity: 0.7;
    font-size: ${(p) => p.theme.fontSizes.sm};

    &:last-child {
      margin-bottom: 0;
    }
  }
`;

const SupportLink = styled.a`
  display: inline-block;
  color: ${(p) => p.theme.colors.primary};
  text-decoration: none;
  margin-bottom: 2rem;
  font-size: ${(p) => p.theme.fontSizes.sm};

  &:hover {
    text-decoration: underline;
  }
`;

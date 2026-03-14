/**
 * LedgerConnectModal Component
 * Displays animated connection flow while connecting to Ledger device
 */

import { useEffect, useState } from 'react';
import styled, { keyframes } from 'styled-components';

const STEPS = [
  {
    text: 'Connect your Ledger device via USB',
    duration: 3000,
  },
  {
    text: 'Enter your PIN code on the device',
    duration: 3000,
  },
  {
    text: 'Open the Waves application',
    duration: 3000,
  },
];

const LedgerConnectModal: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % STEPS.length);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const step = STEPS[currentStep];

  return (
    <Overlay>
      <Modal>
        <DeviceIcon>📱</DeviceIcon>
        <Title>Connecting to Ledger</Title>
        <StepText>{step.text}</StepText>
        <Dots>
          <Dot $delay="0s" />
          <Dot $delay="0.3s" />
          <Dot $delay="0.6s" />
        </Dots>
      </Modal>
    </Overlay>
  );
};

export default LedgerConnectModal;

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
  padding: 3rem 2rem;
  text-align: center;
  max-width: 400px;
  box-shadow: ${(p) => p.theme.shadows.xl};
`;

const DeviceIcon = styled.div`
  font-size: 4rem;
  margin-bottom: 1.5rem;
`;

const Title = styled.h2`
  font-size: ${(p) => p.theme.fontSizes.xl};
  margin-bottom: 1rem;
  color: ${(p) => p.theme.colors.text};
`;

const StepText = styled.p`
  color: ${(p) => p.theme.colors.text};
  opacity: 0.7;
  margin-bottom: 2rem;
  font-size: ${(p) => p.theme.fontSizes.sm};
`;

const pulse = keyframes`
  0%, 100% { opacity: 0.3; }
  50% { opacity: 1; }
`;

const Dots = styled.div`
  display: flex;
  justify-content: center;
  gap: 0.5rem;
`;

const Dot = styled.div<{ $delay: string }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${(p) => p.theme.colors.primary};
  animation: ${pulse} 1.5s ease-in-out infinite;
  animation-delay: ${(props) => props.$delay};
`;

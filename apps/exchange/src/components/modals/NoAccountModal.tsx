/**
 * NoAccountModal Component
 * Displayed when a user tries to sign in but has no wallet accounts.
 * Offers options to create a new wallet or import an existing one
 * via seed phrase or private key.
 */
import React, { useState } from 'react';
import styled from 'styled-components';
import { Modal } from './Modal';

interface NoAccountModalProps {
  open: boolean;
  onClose: () => void;
  onCreateWallet: () => void;
  onImportSeedPhrase: () => void;
  onImportPrivateKey: () => void;
  /** Optional z-index override (default 1000). Use higher values when rendering above overlays. */
  zIndex?: number;
}

type ModalView = 'main' | 'import';

const Content = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: ${(p) => p.theme.spacing.md} 0;
`;

const IconCircle = styled.div`
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: ${(p) => p.theme.colors.warning}18;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 30px;
  margin-bottom: ${(p) => p.theme.spacing.md};

  @media (min-width: 480px) {
    width: 72px;
    height: 72px;
    font-size: 36px;
    margin-bottom: ${(p) => p.theme.spacing.lg};
  }
`;

const Title = styled.h3`
  margin: 0 0 ${(p) => p.theme.spacing.sm} 0;
  font-size: ${(p) => p.theme.fontSizes.xl};
  font-weight: ${(p) => p.theme.fontWeights.bold};
  color: ${(p) => p.theme.colors.text};
`;

const Description = styled.p`
  margin: 0 0 ${(p) => p.theme.spacing.xl} 0;
  font-size: ${(p) => p.theme.fontSizes.md};
  color: ${(p) => p.theme.colors.disabled};
  line-height: 1.6;
  max-width: 380px;
`;

const Actions = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${(p) => p.theme.spacing.md};
  width: 100%;
  max-width: min(340px, 100%);
`;

const OptionCard = styled.button`
  display: flex;
  align-items: center;
  gap: ${(p) => p.theme.spacing.md};
  padding: ${(p) => p.theme.spacing.md} ${(p) => p.theme.spacing.lg};
  border: 2px solid ${(p) => p.theme.colors.border};
  border-radius: ${(p) => p.theme.radii.md};
  background: transparent;
  cursor: pointer;
  text-align: left;
  transition: all 0.2s ease;
  color: ${(p) => p.theme.colors.text};
  width: 100%;

  &:hover {
    border-color: ${(p) => p.theme.colors.primary};
    background: ${(p) => p.theme.colors.primary}08;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  }

  &:active {
    transform: translateY(0);
  }
`;

const OptionIcon = styled.span`
  font-size: 24px;
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: ${(p) => p.theme.radii.sm};
  background: ${(p) => p.theme.colors.primary}12;

  @media (min-width: 480px) {
    font-size: 28px;
    width: 44px;
    height: 44px;
  }
`;

const OptionText = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const OptionTitle = styled.span`
  font-size: ${(p) => p.theme.fontSizes.md};
  font-weight: ${(p) => p.theme.fontWeights.semibold};
  color: ${(p) => p.theme.colors.text};
`;

const OptionDesc = styled.span`
  font-size: ${(p) => p.theme.fontSizes.xs};
  color: ${(p) => p.theme.colors.disabled};
  line-height: 1.4;
`;

const BackButton = styled.button`
  background: none;
  border: none;
  color: ${(p) => p.theme.colors.primary};
  font-size: ${(p) => p.theme.fontSizes.sm};
  cursor: pointer;
  padding: ${(p) => p.theme.spacing.sm};
  margin-top: ${(p) => p.theme.spacing.sm};
  text-decoration: underline;
  opacity: 0.8;

  &:hover {
    opacity: 1;
  }
`;

export const NoAccountModal: React.FC<NoAccountModalProps> = ({
  open,
  onClose,
  onCreateWallet,
  onImportSeedPhrase,
  onImportPrivateKey,
  zIndex,
}) => {
  const [view, setView] = useState<ModalView>('main');

  const handleClose = () => {
    setView('main');
    onClose();
  };

  const handleBack = () => {
    setView('main');
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      size="small"
      showCloseButton
      testId="no-account-modal"
      zIndex={zIndex}
    >
      {view === 'main' ? (
        <Content>
          <IconCircle>🔐</IconCircle>
          <Title>No Wallet Found</Title>
          <Description>
            It looks like you don&apos;t have a wallet set up yet. Create a new wallet or import an
            existing one to get started.
          </Description>

          <Actions>
            <OptionCard
              onClick={onCreateWallet}
              data-testid="no-account-create"
            >
              <OptionIcon>✨</OptionIcon>
              <OptionText>
                <OptionTitle>Create New Wallet</OptionTitle>
                <OptionDesc>Generate a new seed phrase and set up your wallet</OptionDesc>
              </OptionText>
            </OptionCard>

            <OptionCard
              onClick={() => setView('import')}
              data-testid="no-account-import"
            >
              <OptionIcon>📥</OptionIcon>
              <OptionText>
                <OptionTitle>Import Existing Wallet</OptionTitle>
                <OptionDesc>Restore your wallet using a seed phrase or private key</OptionDesc>
              </OptionText>
            </OptionCard>
          </Actions>
        </Content>
      ) : (
        <Content>
          <IconCircle>📥</IconCircle>
          <Title>Import Wallet</Title>
          <Description>
            Choose how you&apos;d like to import your existing wallet.
          </Description>

          <Actions>
            <OptionCard
              onClick={onImportSeedPhrase}
              data-testid="no-account-import-seed"
            >
              <OptionIcon>📝</OptionIcon>
              <OptionText>
                <OptionTitle>Secret Phrase</OptionTitle>
                <OptionDesc>Import using your 15-word recovery seed phrase</OptionDesc>
              </OptionText>
            </OptionCard>

            <OptionCard
              onClick={onImportPrivateKey}
              data-testid="no-account-import-key"
            >
              <OptionIcon>🔑</OptionIcon>
              <OptionText>
                <OptionTitle>Private Key</OptionTitle>
                <OptionDesc>Import using your base58-encoded private key</OptionDesc>
              </OptionText>
            </OptionCard>

            <BackButton onClick={handleBack}>
              ← Back to options
            </BackButton>
          </Actions>
        </Content>
      )}
    </Modal>
  );
};

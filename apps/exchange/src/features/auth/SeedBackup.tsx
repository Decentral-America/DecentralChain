/**
 * SeedBackup Component
 * Displays seed phrase with copy and download functionality
 * Helps users securely backup their recovery phrase
 */
import { useState } from 'react';
import styled from 'styled-components';
import { Button } from '@/components/atoms/Button';
import { Card } from '@/components/atoms/Card';
import { CommonIcons, Icon } from '@/components/atoms/Icon';
import { Stack } from '@/components/atoms/Stack';
import { useClipboard } from '@/hooks/useClipboard';

interface SeedBackupProps {
  seedPhrase: string;
  onComplete?: () => void;
}

const BackupWrapper = styled.div`
  width: 100%;
  max-width: 700px;
  margin: 0 auto;
`;

const Title = styled.h2`
  margin: 0 0 ${(p) => p.theme.spacing.sm};
  font-size: ${(p) => p.theme.fontSizes.lg};
  font-weight: ${(p) => p.theme.fontWeights.semibold};
  color: ${(p) => p.theme.colors.text};

  @media (min-width: 481px) {
    font-size: ${(p) => p.theme.fontSizes.xl};
    margin: 0 0 ${(p) => p.theme.spacing.md};
  }
`;

const Description = styled.p`
  margin: 0 0 ${(p) => p.theme.spacing.md};
  font-size: ${(p) => p.theme.fontSizes.sm};
  color: ${(p) => p.theme.colors.secondary};
  line-height: 1.5;

  @media (min-width: 481px) {
    margin: 0 0 ${(p) => p.theme.spacing.lg};
    font-size: ${(p) => p.theme.fontSizes.md};
  }
`;

const WarningBox = styled.div`
  display: flex;
  align-items: flex-start;
  gap: ${(p) => p.theme.spacing.sm};
  padding: ${(p) => p.theme.spacing.sm} ${(p) => p.theme.spacing.md};
  border-left: 4px solid ${(p) => p.theme.colors.warning};
  background-color: ${(p) => `${p.theme.colors.warning}10`};
  border-radius: ${(p) => p.theme.radii.md};
  margin-bottom: ${(p) => p.theme.spacing.md};
`;

const WarningText = styled.div`
  flex: 1;
`;

const WarningTitle = styled.h4`
  margin: 0 0 ${(p) => p.theme.spacing.xs};
  font-size: ${(p) => p.theme.fontSizes.md};
  font-weight: ${(p) => p.theme.fontWeights.semibold};
  color: ${(p) => p.theme.colors.warning};
`;

const WarningDescription = styled.p`
  margin: 0;
  font-size: ${(p) => p.theme.fontSizes.sm};
  color: ${(p) => p.theme.colors.text};
  line-height: 1.5;
`;

const SeedPhraseContainer = styled.div`
  position: relative;
  margin-bottom: ${(p) => p.theme.spacing.lg};
`;

const SeedPhraseBox = styled.div<{ $revealed: boolean }>`
  position: relative;
  padding: ${(p) => p.theme.spacing.md};
  background-color: ${(p) => p.theme.colors.background};
  border: 2px solid ${(p) => p.theme.colors.border};
  border-radius: ${(p) => p.theme.radii.md};
  font-family: ${(p) => p.theme.fonts.mono};
  font-size: ${(p) => p.theme.fontSizes.md};
  line-height: 1.8;
  color: ${(p) => p.theme.colors.text};
  min-height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  filter: ${(p) => (p.$revealed ? 'none' : 'blur(8px)')};
  user-select: ${(p) => (p.$revealed ? 'text' : 'none')};
  transition: filter 0.3s ease;

  @media (min-width: 481px) {
    padding: ${(p) => p.theme.spacing.lg};
    min-height: 120px;
  }
`;

const SeedPhraseGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: ${(p) => p.theme.spacing.xs};

  @media (min-width: 481px) {
    gap: ${(p) => p.theme.spacing.md};
  }

  @media (max-width: 480px) {
    grid-template-columns: repeat(2, 1fr);
  }
`;

const SeedWord = styled.div`
  display: flex;
  align-items: center;
  gap: ${(p) => p.theme.spacing.xs};
  padding: ${(p) => p.theme.spacing.xs} ${(p) => p.theme.spacing.sm};
  background-color: ${(p) => p.theme.colors.hover};
  border-radius: ${(p) => p.theme.radii.sm};
  font-size: 0.8rem;

  @media (min-width: 481px) {
    padding: ${(p) => p.theme.spacing.sm};
    gap: ${(p) => p.theme.spacing.sm};
    font-size: inherit;
  }
`;

const WordNumber = styled.span`
  font-weight: ${(p) => p.theme.fontWeights.semibold};
  color: ${(p) => p.theme.colors.secondary};
  min-width: 24px;
`;

const WordText = styled.span`
  font-weight: ${(p) => p.theme.fontWeights.medium};
  color: ${(p) => p.theme.colors.text};
`;

const RevealButton = styled(Button as React.ComponentType<Record<string, unknown>>)`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 10;
`;

const ActionButtonGroup = styled.div`
  display: flex;
  gap: ${(p) => p.theme.spacing.md};
  flex-wrap: wrap;
`;

const InstructionsList = styled.ol`
  margin: ${(p) => p.theme.spacing.lg} 0;
  padding-left: ${(p) => p.theme.spacing.xl};
  color: ${(p) => p.theme.colors.text};
  line-height: 1.8;

  li {
    margin-bottom: ${(p) => p.theme.spacing.sm};
    font-size: ${(p) => p.theme.fontSizes.md};
  }
`;

const RevealPlaceholder = styled.div`
  text-align: center;
`;

const RevealHint = styled.p`
  color: inherit;
  margin-top: 12px;
`;

export const SeedBackup = ({ seedPhrase, onComplete }: SeedBackupProps) => {
  const [revealed, setRevealed] = useState(false);
  const { isCopied, copyToClipboard } = useClipboard();

  const words = seedPhrase.split(' ');

  const handleCopy = async () => {
    await copyToClipboard(seedPhrase);
  };

  const handleDownload = () => {
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `decentralchain-backup-${timestamp}.txt`;

    const content = `DecentralChain Wallet Backup
Generated: ${new Date().toLocaleString()}

SEED PHRASE:
${seedPhrase}

⚠️ IMPORTANT SECURITY WARNINGS:
- Never share this seed phrase with anyone
- Store this file in a secure location
- Do not upload to cloud storage or send via email
- Anyone with access to this seed phrase can access your funds
- Consider printing this backup and storing physically

For support, visit: https://decentralchain.io/support
`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleReveal = () => {
    setRevealed(true);
  };

  return (
    <BackupWrapper>
      <Card elevation="md">
        <Stack gap="16px">
          <div>
            <Title>Backup Your Seed Phrase</Title>
            <Description>
              Your seed phrase is the master key to your wallet. Write it down and store it
              securely. You&apos;ll need it to recover your wallet if you lose access to this
              device.
            </Description>
          </div>

          <WarningBox>
            <Icon name={CommonIcons.Warning} size={24} color="warning" />
            <WarningText>
              <WarningTitle>Keep Your Seed Phrase Safe</WarningTitle>
              <WarningDescription>
                Never share your seed phrase with anyone. DecentralChain support will never ask for
                your seed phrase. Anyone with your seed phrase can access and steal your funds.
              </WarningDescription>
            </WarningText>
          </WarningBox>

          <SeedPhraseContainer>
            <SeedPhraseBox $revealed={revealed}>
              {revealed ? (
                <SeedPhraseGrid>
                  {words.map((word, index) => (
                    // biome-ignore lint/suspicious/noArrayIndexKey: seed phrase position is semantically significant; words can repeat
                    <SeedWord key={`${index}-${word}`}>
                      <WordNumber>{index + 1}.</WordNumber>
                      <WordText>{word}</WordText>
                    </SeedWord>
                  ))}
                </SeedPhraseGrid>
              ) : (
                <RevealPlaceholder>
                  <Icon name={CommonIcons.Info} size={48} color="secondary" />
                  <RevealHint>Click below to reveal your seed phrase</RevealHint>
                </RevealPlaceholder>
              )}
            </SeedPhraseBox>

            {!revealed && (
              <RevealButton onClick={handleReveal} variant="primary" size="medium">
                <Icon name={CommonIcons.Check} size={16} />
                Reveal Seed Phrase
              </RevealButton>
            )}
          </SeedPhraseContainer>

          {revealed && (
            <>
              <ActionButtonGroup>
                <Button onClick={handleCopy} variant="secondary" disabled={isCopied}>
                  <Icon name={isCopied ? CommonIcons.Check : CommonIcons.Edit} size={16} />
                  {isCopied ? 'Copied!' : 'Copy to Clipboard'}
                </Button>
                <Button onClick={handleDownload} variant="secondary">
                  <Icon name={CommonIcons.Save} size={16} />
                  Download Backup File
                </Button>
              </ActionButtonGroup>

              <InstructionsList>
                <li>Write down your seed phrase on paper and store it in a secure location</li>
                <li>
                  Consider making multiple copies and storing them in different secure locations
                </li>
                <li>Never store your seed phrase digitally (photos, cloud storage, email, etc.)</li>
                <li>
                  Test your backup by restoring your wallet in a separate session before depositing
                  large amounts
                </li>
              </InstructionsList>

              {onComplete && (
                <Button
                  onClick={onComplete}
                  variant="primary"
                  size="large"
                  style={{ width: '100%' }}
                >
                  I&apos;ve Backed Up My Seed Phrase
                </Button>
              )}
            </>
          )}
        </Stack>
      </Card>
    </BackupWrapper>
  );
};

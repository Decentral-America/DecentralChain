/**
 * ImportAccount Component
 * Imports existing wallet via seed phrase
 */
import { type FormEvent, useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import styled from 'styled-components';
import { Button } from '@/components/atoms/Button';
import { Card, CardBody } from '@/components/atoms/Card';
import { CommonIcons, Icon } from '@/components/atoms/Icon';
import { Input } from '@/components/atoms/Input';
import { Stack } from '@/components/atoms/Stack';
import { useAuth } from '@/contexts/AuthContext';
import { logger } from '@/lib/logger';

function validateSecret(mode: string, privateKey: string, seedPhrase: string): string {
  if (mode === 'privatekey') {
    const trimmed = privateKey.trim();
    if (!trimmed) throw new Error('Please enter your private key');
    if (trimmed.length < 32 || trimmed.length > 64)
      throw new Error('Invalid private key format. Please check and try again.');
    return trimmed;
  }
  const trimmed = seedPhrase.trim();
  if (!trimmed) throw new Error('Please enter your seed phrase');
  if (trimmed.split(/\s+/).length !== 15)
    throw new Error('Seed phrase must contain exactly 15 words');
  return trimmed;
}

const FormContainer = styled.div`
  width: 100%;
`;

const Title = styled.h2`
  font-size: ${(p) => p.theme.fontSizes.xxl};
  font-weight: ${(p) => p.theme.fontWeights.bold};
  margin: 0 0 ${(p) => p.theme.spacing.md} 0;
  color: ${(p) => p.theme.colors.text};
`;

const Description = styled.p`
  font-size: ${(p) => p.theme.fontSizes.sm};
  color: ${(p) => p.theme.colors.text};
  opacity: 0.7;
  margin: 0 0 ${(p) => p.theme.spacing.lg} 0;
  line-height: 1.6;
`;

const InfoBox = styled.div`
  display: flex;
  gap: ${(p) => p.theme.spacing.md};
  padding: ${(p) => p.theme.spacing.md};
  background: ${(p) => p.theme.colors.primary};
  color: white;
  border-radius: ${(p) => p.theme.radii.md};
  margin-bottom: ${(p) => p.theme.spacing.lg};
  align-items: flex-start;
  font-size: ${(p) => p.theme.fontSizes.sm};
  line-height: 1.6;
`;

const InfoIcon = styled.div`
  flex-shrink: 0;
  font-size: 20px;
`;

const ErrorMessage = styled.div`
  padding: ${(p) => p.theme.spacing.sm} ${(p) => p.theme.spacing.md};
  background: ${(p) => p.theme.colors.error};
  color: white;
  border-radius: ${(p) => p.theme.radii.sm};
  font-size: ${(p) => p.theme.fontSizes.sm};
  margin-bottom: ${(p) => p.theme.spacing.md};
`;

const HelpText = styled.p`
  font-size: ${(p) => p.theme.fontSizes.xs};
  color: ${(p) => p.theme.colors.text};
  opacity: 0.6;
  margin-top: ${(p) => p.theme.spacing.sm};
  text-align: center;
`;

const StyledTextarea = styled.textarea`
  width: 100%;
  min-height: 120px;
  padding: ${(p) => p.theme.spacing.md};
  border: 2px solid ${(p) => p.theme.colors.border};
  border-radius: ${(p) => p.theme.radii.md};
  font-family: ${(p) => p.theme.fonts.mono};
  font-size: ${(p) => p.theme.fontSizes.sm};
  color: ${(p) => p.theme.colors.text};
  background: ${(p) => p.theme.colors.background};
  resize: vertical;
  transition: ${(p) => p.theme.transitions.fast};
  word-break: break-all;
  box-sizing: border-box;

  &:focus {
    outline: none;
    border-color: ${(p) => p.theme.colors.primary};
  }

  &::placeholder {
    color: ${(p) => p.theme.colors.disabled};
  }

  &:disabled {
    background: ${(p) => p.theme.colors.hover};
    cursor: not-allowed;
  }
`;

const Label = styled.label`
  display: block;
  font-size: ${(p) => p.theme.fontSizes.sm};
  font-weight: ${(p) => p.theme.fontWeights.medium};
  color: ${(p) => p.theme.colors.text};
  margin-bottom: ${(p) => p.theme.spacing.xs};
`;

const ModeToggle = styled.div`
  display: flex;
  border: 2px solid ${(p) => p.theme.colors.border};
  border-radius: ${(p) => p.theme.radii.md};
  overflow: hidden;
  margin-bottom: ${(p) => p.theme.spacing.lg};
`;

const ModeTab = styled.button<{ $active: boolean }>`
  flex: 1;
  padding: ${(p) => p.theme.spacing.sm} ${(p) => p.theme.spacing.md};
  border: none;
  background: ${(p) => (p.$active ? p.theme.colors.primary : 'transparent')};
  color: ${(p) => (p.$active ? 'white' : p.theme.colors.text)};
  font-size: ${(p) => p.theme.fontSizes.sm};
  font-weight: ${(p) => p.theme.fontWeights.semibold};
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: ${(p) => (p.$active ? p.theme.colors.primary : p.theme.colors.hover)};
  }
`;

type ImportMode = 'seed' | 'privatekey';

export const ImportAccount = () => {
  const [searchParams] = useSearchParams();
  const initialMode = searchParams.get('mode') === 'privatekey' ? 'privatekey' : 'seed';
  const [importMode, setImportMode] = useState<ImportMode>(initialMode);
  const [seedPhrase, setSeedPhrase] = useState('');
  const [privateKey, setPrivateKey] = useState('');
  const [password, setPassword] = useState('');
  const [accountName, setAccountName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFirstAccount, setIsFirstAccount] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState(false);
  const { login, create, addAccount, getActiveState, user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const navigationTarget = useRef<string>('/desktop/wallet');

  // Check if Ledger is supported (Electron desktop OR modern browser with WebHID)
  const isLedgerSupported =
    (typeof window !== 'undefined' &&
      (window as Window & { isDesktop?: boolean }).isDesktop === true) || // Electron
    (typeof navigator !== 'undefined' && 'hid' in navigator); // WebHID (Chrome/Edge)

  // Check if this is the first account on mount
  useEffect(() => {
    const multiAccountData = localStorage.getItem('multiAccountData');
    setIsFirstAccount(!multiAccountData);
  }, []);

  // Effect-based navigation: only navigate after user state has propagated
  useEffect(() => {
    if (pendingNavigation && isAuthenticated && user) {
      setPendingNavigation(false);
      void navigate(navigationTarget.current);
    }
  }, [pendingNavigation, isAuthenticated, user, navigate]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const secretInput = validateSecret(importMode, privateKey, seedPhrase);
      if (!password.trim()) throw new Error('Please enter a password');

      if (isFirstAccount) {
        if (!accountName.trim()) throw new Error('Please enter an account name');
        await create(secretInput, password, accountName.trim(), true);
      } else {
        const addedUser = await addAccount(secretInput, accountName.trim() || 'Imported Account');
        if (!addedUser) throw new Error('Failed to add account');
        await login(addedUser.hash, password);
      }

      navigationTarget.current = getActiveState('wallet');
      setPendingNavigation(true);
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : 'Invalid seed phrase or password. Please check and try again.';
      setError(errorMessage);
      logger.error('Import error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <FormContainer>
      <Card>
        <CardBody>
          <Title>{isFirstAccount ? 'Import Your Wallet' : 'Add Account'}</Title>
          <Description>
            {isFirstAccount
              ? 'Restore your wallet using a seed phrase or private key'
              : 'Add an account using a seed phrase or private key'}
          </Description>

          <InfoBox>
            <InfoIcon>
              <Icon name={CommonIcons.Info} size={20} color="white" />
            </InfoIcon>
            <span>Make sure you&apos;re in a private location before entering sensitive data</span>
          </InfoBox>

          {/* Import mode toggle */}
          <ModeToggle>
            <ModeTab $active={importMode === 'seed'} onClick={() => setImportMode('seed')}>
              📝 Seed Phrase
            </ModeTab>
            <ModeTab
              $active={importMode === 'privatekey'}
              onClick={() => setImportMode('privatekey')}
            >
              🔑 Private Key
            </ModeTab>
          </ModeToggle>

          <form onSubmit={handleSubmit}>
            <Stack gap="16px">
              {error && <ErrorMessage>{error}</ErrorMessage>}

              {isLedgerSupported && (
                <InfoBox>
                  <InfoIcon>
                    <Icon name={CommonIcons.Info} size={20} color="white" />
                  </InfoIcon>
                  <div>
                    Using a Ledger hardware wallet?{' '}
                    <a
                      href="/import/ledger"
                      style={{ color: 'white', fontWeight: 600, textDecoration: 'underline' }}
                      onClick={(e) => {
                        e.preventDefault();
                        void navigate('/import/ledger');
                      }}
                    >
                      Import from Ledger
                    </a>
                  </div>
                </InfoBox>
              )}

              {importMode === 'seed' ? (
                <div>
                  <Label htmlFor="seedPhrase">Seed Phrase</Label>
                  <StyledTextarea
                    id="seedPhrase"
                    value={seedPhrase}
                    onChange={(e) => setSeedPhrase(e.target.value)}
                    placeholder="word1 word2 word3 word4 word5 word6 word7 word8 word9 word10 word11 word12 word13 word14 word15"
                    disabled={isLoading}
                    autoFocus
                    spellCheck={false}
                    autoComplete="off"
                  />
                </div>
              ) : (
                <div>
                  <Label htmlFor="privateKey">Private Key</Label>
                  <StyledTextarea
                    id="privateKey"
                    value={privateKey}
                    onChange={(e) => setPrivateKey(e.target.value)}
                    placeholder="Enter your base58-encoded private key"
                    disabled={isLoading}
                    autoFocus
                    spellCheck={false}
                    autoComplete="off"
                    style={{ minHeight: '80px' }}
                  />
                </div>
              )}

              <Input
                type="password"
                label="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={
                  isFirstAccount ? 'Create a master password' : 'Enter your master password'
                }
                disabled={isLoading}
                autoComplete={isFirstAccount ? 'new-password' : 'current-password'}
                required
              />

              {isFirstAccount && (
                <Input
                  type="text"
                  label="Account Name"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  placeholder="e.g., My Main Wallet"
                  disabled={isLoading}
                  required
                />
              )}

              <Button
                type="submit"
                isLoading={isLoading}
                disabled={
                  isLoading ||
                  (importMode === 'seed' ? !seedPhrase.trim() : !privateKey.trim()) ||
                  !password.trim() ||
                  (isFirstAccount && !accountName.trim())
                }
                fullWidth
              >
                {isLoading ? 'Importing...' : isFirstAccount ? 'Import Wallet' : 'Import Account'}
              </Button>

              <HelpText>
                Don&apos;t have a wallet?{' '}
                <a
                  href="/signup"
                  style={{ color: 'inherit', cursor: 'pointer', textDecoration: 'underline' }}
                  onClick={(e) => {
                    e.preventDefault();
                    void navigate('/signup');
                  }}
                >
                  Create one
                </a>
              </HelpText>
            </Stack>
          </form>
        </CardBody>
      </Card>
    </FormContainer>
  );
};

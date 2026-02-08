/**
 * ImportAccount Component
 * Imports existing wallet via seed phrase
 */
import { useState, FormEvent, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/atoms/Button';
import { Card, CardBody } from '@/components/atoms/Card';
import { Stack } from '@/components/atoms/Stack';
import { Icon, CommonIcons } from '@/components/atoms/Icon';
import { Input } from '@/components/atoms/Input';

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

export const ImportAccount = () => {
  const [seedPhrase, setSeedPhrase] = useState('');
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
    (typeof window !== 'undefined' && (window as any).isDesktop === true) || // Electron
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
      navigate(navigationTarget.current);
    }
  }, [pendingNavigation, isAuthenticated, user, navigate]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Validate seed phrase format
      const trimmedSeed = seedPhrase.trim();
      if (!trimmedSeed) {
        throw new Error('Please enter your seed phrase');
      }

      // Split by spaces and count words
      const words = trimmedSeed.split(/\s+/);
      if (words.length !== 15) {
        throw new Error('Seed phrase must contain exactly 15 words');
      }

      // Validate password
      if (!password.trim()) {
        throw new Error('Please enter a password');
      }

      if (isFirstAccount) {
        // Validate account name for first account
        if (!accountName.trim()) {
          throw new Error('Please enter an account name');
        }

        // FIRST ACCOUNT: Use create() to initialize vault
        await create(trimmedSeed, password, accountName.trim(), true);

        // create() sets user state; navigate via effect once state propagates
        navigationTarget.current = getActiveState('wallet');
        setPendingNavigation(true);
      } else {
        // ADDITIONAL ACCOUNT: Use addAccount() to add to existing vault
        // This requires the vault password to decrypt and add new account
        const addedUser = await addAccount(trimmedSeed, accountName.trim() || 'Imported Account');

        if (!addedUser) {
          throw new Error('Failed to add account');
        }

        // Login with the newly added account
        await login(addedUser.hash, password);

        // login() sets user state; navigate via effect once state propagates
        navigationTarget.current = getActiveState('wallet');
        setPendingNavigation(true);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : 'Invalid seed phrase or password. Please check and try again.';
      setError(errorMessage);
      console.error('Import error:', err);
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
              ? 'Enter your 15-word seed phrase and create a master password'
              : 'Enter your 15-word seed phrase and master password to add this account'}
          </Description>

          <InfoBox>
            <InfoIcon>
              <Icon name={CommonIcons.Info} size={20} color="white" />
            </InfoIcon>
            <span>
              Make sure you&apos;re in a private location before entering your seed phrase
            </span>
          </InfoBox>

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
                      style={{ color: 'white', textDecoration: 'underline', fontWeight: 600 }}
                      onClick={(e) => {
                        e.preventDefault();
                        navigate('/import/ledger');
                      }}
                    >
                      Import from Ledger
                    </a>
                  </div>
                </InfoBox>
              )}

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

              <Input
                type="password"
                label="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={isFirstAccount ? "Create a master password" : "Enter your master password"}
                disabled={isLoading}
                autoComplete={isFirstAccount ? "new-password" : "current-password"}
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
                  !seedPhrase.trim() ||
                  !password.trim() ||
                  (isFirstAccount && !accountName.trim())
                }
                fullWidth
              >
                {isLoading ? 'Importing...' : isFirstAccount ? 'Create Wallet' : 'Import Account'}
              </Button>

              <HelpText>
                Don&apos;t have a wallet?{' '}
                <a
                  href="/signup"
                  style={{ color: 'inherit', textDecoration: 'underline', cursor: 'pointer' }}
                  onClick={(e) => {
                    e.preventDefault();
                    navigate('/signup');
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

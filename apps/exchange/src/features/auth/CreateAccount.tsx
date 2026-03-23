/**
 * CreateAccount Component
 * Generates new wallet with seed phrase display and backup confirmation
 */

// Import Seed from data-service (matches Angular: ds.Seed)
import { Seed } from 'data-service/classes/Seed';
import { type FormEvent, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { Button } from '@/components/atoms/Button';
import { Card, CardBody } from '@/components/atoms/Card';
import { Checkbox } from '@/components/atoms/Checkbox';
import { CommonIcons, Icon } from '@/components/atoms/Icon';
import { Input } from '@/components/atoms/Input';
import { Stack } from '@/components/atoms/Stack';
import { useAuth } from '@/contexts/AuthContext';
import { useClipboard } from '@/hooks/useClipboard';
import { logger } from '@/lib/logger';

const FormContainer = styled.div`
  width: 100%;
`;

const Title = styled.h2`
  font-size: ${(p) => p.theme.fontSizes.xl};
  font-weight: ${(p) => p.theme.fontWeights.bold};
  margin: 0 0 ${(p) => p.theme.spacing.sm} 0;
  color: ${(p) => p.theme.colors.text};

  @media (min-width: 481px) {
    font-size: ${(p) => p.theme.fontSizes.xxl};
    margin: 0 0 ${(p) => p.theme.spacing.md} 0;
  }
`;

const Description = styled.p`
  font-size: ${(p) => p.theme.fontSizes.sm};
  color: ${(p) => p.theme.colors.text};
  opacity: 0.7;
  margin: 0 0 ${(p) => p.theme.spacing.md} 0;
  line-height: 1.6;

  @media (min-width: 481px) {
    margin: 0 0 ${(p) => p.theme.spacing.lg} 0;
  }
`;

const WarningBox = styled.div`
  display: flex;
  gap: ${(p) => p.theme.spacing.sm};
  padding: ${(p) => p.theme.spacing.sm} ${(p) => p.theme.spacing.md};
  background: ${(p) => p.theme.colors.warning};
  color: white;
  border-radius: ${(p) => p.theme.radii.md};
  margin-bottom: ${(p) => p.theme.spacing.md};
  align-items: flex-start;
`;

const WarningIcon = styled.div`
  flex-shrink: 0;
  font-size: 24px;
`;

const WarningContent = styled.div`
  flex: 1;

  h3 {
    margin: 0 0 ${(p) => p.theme.spacing.xs} 0;
    font-size: ${(p) => p.theme.fontSizes.md};
    font-weight: ${(p) => p.theme.fontWeights.semibold};
  }

  p {
    margin: 0;
    font-size: ${(p) => p.theme.fontSizes.sm};
    line-height: 1.5;
  }
`;

const SeedPhraseBox = styled.div`
  background: ${(p) => p.theme.colors.background};
  border: 2px solid ${(p) => p.theme.colors.border};
  border-radius: ${(p) => p.theme.radii.md};
  padding: ${(p) => p.theme.spacing.md};
  margin-bottom: ${(p) => p.theme.spacing.md};
  position: relative;

  @media (min-width: 481px) {
    padding: ${(p) => p.theme.spacing.lg};
    margin-bottom: ${(p) => p.theme.spacing.lg};
  }
`;

const SeedPhraseGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: ${(p) => p.theme.spacing.sm};
  margin-bottom: ${(p) => p.theme.spacing.sm};

  @media (max-width: ${(p) => p.theme.breakpoints.tablet}) {
    grid-template-columns: repeat(3, 1fr);
  }

  @media (max-width: ${(p) => p.theme.breakpoints.mobile}) {
    grid-template-columns: repeat(2, 1fr);
    gap: ${(p) => p.theme.spacing.xs};
  }
`;

const SeedWord = styled.div`
  display: flex;
  align-items: center;
  gap: ${(p) => p.theme.spacing.xs};
  padding: ${(p) => p.theme.spacing.xs} ${(p) => p.theme.spacing.sm};
  background: ${(p) => p.theme.colors.hover};
  border-radius: ${(p) => p.theme.radii.sm};
  font-family: ${(p) => p.theme.fonts.mono};
  font-size: ${(p) => p.theme.fontSizes.xs};
  text-align: center;

  @media (min-width: 481px) {
    padding: ${(p) => p.theme.spacing.sm};
    font-size: ${(p) => p.theme.fontSizes.sm};
    gap: ${(p) => p.theme.spacing.sm};
  }

  span {
    opacity: 0.5;
    margin-right: ${(p) => p.theme.spacing.xs};
  }
`;

const CopyButton = styled(Button as React.ComponentType<Record<string, unknown>>)`
  position: absolute;
  top: ${(p) => p.theme.spacing.sm};
  right: ${(p) => p.theme.spacing.sm};
`;

const CheckboxLabel = styled.label`
  display: flex;
  align-items: flex-start;
  gap: ${(p) => p.theme.spacing.sm};
  cursor: pointer;
  font-size: ${(p) => p.theme.fontSizes.sm};
  line-height: 1.6;
`;

const InstructionsList = styled.ul`
  margin: ${(p) => p.theme.spacing.sm} 0;
  padding-left: ${(p) => p.theme.spacing.lg};
  font-size: ${(p) => p.theme.fontSizes.xs};
  line-height: 1.6;
  color: ${(p) => p.theme.colors.text};
  opacity: 0.8;

  li {
    margin-bottom: ${(p) => p.theme.spacing.xs};
  }

  @media (min-width: 481px) {
    margin: ${(p) => p.theme.spacing.md} 0;
    font-size: ${(p) => p.theme.fontSizes.sm};
    line-height: 1.8;
  }
`;

const Divider = styled.div`
  display: flex;
  align-items: center;
  gap: ${(p) => p.theme.spacing.md};
  margin: ${(p) => p.theme.spacing.md} 0;

  &::before,
  &::after {
    content: '';
    flex: 1;
    height: 1px;
    background: ${(p) => p.theme.colors.border};
  }

  span {
    font-size: ${(p) => p.theme.fontSizes.sm};
    color: ${(p) => p.theme.colors.text};
    opacity: 0.5;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
`;

const LedgerInfoBox = styled.div`
  display: flex;
  gap: ${(p) => p.theme.spacing.sm};
  padding: ${(p) => p.theme.spacing.md};
  background: ${(p) => p.theme.colors.primary};
  color: white;
  border-radius: ${(p) => p.theme.radii.md};
  margin-bottom: ${(p) => p.theme.spacing.md};
  align-items: flex-start;
  cursor: pointer;
  transition: ${(p) => p.theme.transitions.fast};

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  @media (max-width: ${(p) => p.theme.breakpoints.mobile}) {
    padding: ${(p) => p.theme.spacing.sm} ${(p) => p.theme.spacing.md};
    gap: ${(p) => p.theme.spacing.sm};
  }
`;

const LedgerIcon = styled.div`
  flex-shrink: 0;
  font-size: 24px;

  @media (min-width: 481px) {
    font-size: 32px;
  }
`;

const ImportLink = styled.p`
  font-size: ${(p) => p.theme.fontSizes.sm};
  color: ${(p) => p.theme.colors.text};
  opacity: 0.6;
  margin: 0 0 ${(p) => p.theme.spacing.md} 0;
  text-align: center;

  a {
    color: ${(p) => p.theme.colors.primary};
    text-decoration: underline;
    cursor: pointer;
    font-weight: ${(p) => p.theme.fontWeights.semibold};
    opacity: 1;

    &:hover {
      opacity: 0.85;
    }
  }
`;

export const CreateAccount = () => {
  const [seedPhrase] = useState<Seed>(() => Seed.create());
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');
  const { create, user, isAuthenticated, getActiveState } = useAuth();
  const { isCopied, copyToClipboard } = useClipboard();
  const navigate = useNavigate();

  // Check if Ledger is supported (Electron desktop OR modern browser with WebHID)
  const isLedgerSupported =
    (typeof window !== 'undefined' &&
      (window as Window & { isDesktop?: boolean }).isDesktop === true) || // Electron
    (typeof navigator !== 'undefined' && 'hid' in navigator); // WebHID (Chrome/Edge)

  const words = seedPhrase.phrase.split(' ');

  // Navigate to last active route or wallet default when authentication is successful
  // Only navigate if we're not in the middle of creating an account
  // Matches Angular: User.getActiveState('wallet') lines 587-595
  useEffect(() => {
    logger.debug('[CreateAccount] Navigation useEffect triggered:', {
      hasUser: !!user,
      isAuthenticated,
      isCreating,
      isLoading,
      willNavigate: isAuthenticated && user && !isLoading && !isCreating,
    });

    if (isAuthenticated && user && !isLoading && !isCreating) {
      const targetRoute = getActiveState('wallet');
      logger.debug('[CreateAccount] Navigating to:', targetRoute);
      void navigate(targetRoute, { replace: true });
    }
  }, [isAuthenticated, user, isLoading, isCreating, navigate, getActiveState]);

  const handleCopy = async () => {
    await copyToClipboard(seedPhrase.phrase);
  };

  const handleContinue = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate
    if (!confirmed) {
      setError('Please confirm you have backed up your seed phrase');
      return;
    }

    if (!password) {
      setError('Please enter a password');
      return;
    }

    if (password.length < 12) {
      setError('Password must be at least 12 characters');
      return;
    }

    // SECURITY: Enforce password complexity for financial application
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasDigit = /\d/.test(password);
    const hasSpecial = /[^A-Za-z0-9]/.test(password);
    if (!hasUppercase || !hasLowercase || !hasDigit || !hasSpecial) {
      setError('Password must contain uppercase, lowercase, a digit, and a special character');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    logger.debug('[CreateAccount] handleContinue: Starting account creation');
    setIsLoading(true);
    setIsCreating(true);
    try {
      // If user is already authenticated, they're adding an additional account
      // If not authenticated, treat as first account even if multiAccountData exists
      // (they may have logged out or cleared session)
      const isAddingAccount = isAuthenticated && user;
      logger.debug('[CreateAccount] handleContinue: isAddingAccount =', isAddingAccount);

      if (!isAddingAccount) {
        logger.debug('[CreateAccount] handleContinue: Creating account via create()');
        // First/fresh account - AuthContext.create() handles signUp or existing vault
        // hasBackup is true because user confirmed checkbox
        await create(seedPhrase.phrase, password, 'My Account', true);
        logger.debug(
          '[CreateAccount] handleContinue: create() completed, waiting for state to propagate',
        );
        // Wait for React state to fully propagate before allowing navigation
        // This ensures ProtectedRoute sees isAuthenticated=true
        await new Promise((resolve) => setTimeout(resolve, 100));
        logger.debug(
          '[CreateAccount] handleContinue: Setting isCreating=false to allow navigation',
        );
        // Navigation happens in useEffect when user state is set
        setIsCreating(false); // Allow navigation now
        setIsLoading(false);
      } else {
        logger.debug(
          '[CreateAccount] handleContinue: Navigating to /auth/import for additional account',
        );
        // Additional account - requires unlocking vault
        // SECURITY: Never pass seeds via router state (persists in browser history)
        // Instead, store the seed in a short-lived in-memory reference
        // that is cleared immediately after being read
        const { setSeedTransfer } = await import('@/lib/secureTransfer');
        setSeedTransfer(seedPhrase.phrase);
        setIsCreating(false); // Clear flag before navigation
        void navigate('/auth/import', {
          state: {
            hasBackup: true,
            hasSeedTransfer: true, // Signal that seed is in secure transfer
            name: 'My Account',
          },
        });
      }
    } catch (err) {
      logger.error('[CreateAccount] handleContinue: Error during account creation:', err);
      setError(err instanceof Error ? err.message : 'Failed to create account');
      setIsLoading(false);
      setIsCreating(false); // Clear flag on error
    }
  };

  return (
    <FormContainer>
      <Card>
        <CardBody>
          <Title>Create New Wallet</Title>
          <Description>
            Your seed phrase is the key to your wallet. Write it down and store it in a safe place.
          </Description>

          <ImportLink>
            Already have a wallet?{' '}
            <a
              href="/import-account"
              onClick={(e) => {
                e.preventDefault();
                void navigate('/import-account');
              }}
            >
              Import one instead
            </a>
          </ImportLink>

          {isLedgerSupported && (
            <>
              <LedgerInfoBox onClick={() => navigate('/import/ledger')}>
                <LedgerIcon>🔐</LedgerIcon>
                <div>
                  <h3 style={{ fontSize: '14px', fontWeight: 600, margin: '0 0 4px 0' }}>
                    Use Ledger Hardware Wallet
                  </h3>
                  <p style={{ fontSize: '13px', lineHeight: '1.4', margin: 0, opacity: 0.9 }}>
                    For maximum security, use your Ledger Nano device instead of a seed phrase. Your
                    private keys never leave the device.
                  </p>
                </div>
              </LedgerInfoBox>

              <Divider>
                <span>or continue with seed phrase</span>
              </Divider>
            </>
          )}

          <WarningBox>
            <WarningIcon>
              <Icon name={CommonIcons.Warning} size={24} color="white" />
            </WarningIcon>
            <WarningContent>
              <h3>Never share your seed phrase!</h3>
              <p>
                Anyone with your seed phrase can access your funds. DecentralChain will never ask
                for your seed phrase.
              </p>
            </WarningContent>
          </WarningBox>

          <SeedPhraseBox>
            <CopyButton variant="secondary" size="small" onClick={handleCopy}>
              {isCopied ? 'Copied!' : 'Copy'}
            </CopyButton>

            <SeedPhraseGrid>
              {words.map((word: string, index: number) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: seed phrase position is semantically significant; words can repeat
                <SeedWord key={`${index}-${word}`}>
                  <span>{index + 1}.</span>
                  {word}
                </SeedWord>
              ))}
            </SeedPhraseGrid>
          </SeedPhraseBox>

          <InstructionsList>
            <li>Write down your seed phrase on paper</li>
            <li>Store it in a secure location (safe, vault, etc.)</li>
            <li>Never store it digitally or take screenshots</li>
            <li>Never share it with anyone</li>
          </InstructionsList>

          <form onSubmit={handleContinue}>
            <Stack gap="16px">
              {error && (
                <div
                  style={{
                    background: '#f443361a',
                    border: '1px solid #f44336',
                    borderRadius: '8px',
                    color: '#f44336',
                    padding: '12px',
                  }}
                >
                  {error}
                </div>
              )}

              <Input
                label="Create Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 12 characters (upper, lower, digit, special)"
              />

              <Input
                label="Confirm Password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
                error={
                  confirmPassword && password !== confirmPassword
                    ? 'Passwords do not match'
                    : undefined
                }
              />

              <CheckboxLabel>
                <Checkbox checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} />
                <span>I have written down my seed phrase and stored it in a safe place</span>
              </CheckboxLabel>

              <Button
                type="submit"
                disabled={
                  !confirmed ||
                  !password ||
                  !confirmPassword ||
                  password !== confirmPassword ||
                  isLoading
                }
                isLoading={isLoading}
                fullWidth
              >
                {isLoading ? 'Creating Wallet...' : 'Create Wallet'}
              </Button>
            </Stack>
          </form>
        </CardBody>
      </Card>
    </FormContainer>
  );
};

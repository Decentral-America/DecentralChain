/**
 * LoginForm Component
 * Handles user authentication via PASSWORD (not seed phrase!)
 * Shows account selection if multiple accounts exist
 * Matches Angular's signInForm.js exactly
 */
import { type FormEvent, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { Button } from '@/components/atoms/Button';
import { Card, CardBody } from '@/components/atoms/Card';
import { Input } from '@/components/atoms/Input';
import { Stack } from '@/components/atoms/Stack';
import { NoAccountModal } from '@/components/modals/NoAccountModal';
import { useAuth } from '@/contexts/AuthContext';
import { logger } from '@/lib/logger';
import { multiAccount } from '@/services/multiAccount';
import { AccountSelectScreen } from './AccountSelectScreen';

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
    font-size: ${(p) => p.theme.fontSizes.xs};
    color: ${(p) => p.theme.colors.text};
    opacity: 0.5;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
`;

const LedgerButton = styled(Button as React.ComponentType<Record<string, unknown>>)`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${(p) => p.theme.spacing.sm};
  background: transparent;
  border: 2px solid ${(p) => p.theme.colors.primary};
  color: ${(p) => p.theme.colors.primary};

  &:hover:not(:disabled) {
    background: ${(p) => p.theme.colors.primary};
    color: white;
  }
`;

export const LoginForm = () => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutUntil, setLockoutUntil] = useState<number | null>(null);
  const [accounts, setAccounts] = useState<
    Array<{
      hash: string;
      name?: string | undefined;
      address: string;
      lastLogin?: number | undefined;
    }>
  >([]);
  const [showAccountSelect, setShowAccountSelect] = useState(false);
  const [showNoAccountModal, setShowNoAccountModal] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState(false);
  const { login, getActiveState, user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const navigationTarget = useRef<string>('/desktop/wallet');

  // Check if Ledger is supported (Electron desktop OR modern browser with WebHID)
  const isLedgerSupported =
    (typeof window !== 'undefined' &&
      (window as Window & { isDesktop?: boolean }).isDesktop === true) || // Electron
    (typeof navigator !== 'undefined' && 'hid' in navigator); // WebHID (Chrome/Edge)

  // Effect-based navigation: only navigate after user state has propagated
  useEffect(() => {
    if (pendingNavigation && isAuthenticated && user) {
      setPendingNavigation(false);
      navigate(navigationTarget.current);
    }
  }, [pendingNavigation, isAuthenticated, user, navigate]);

  // Check if accounts exist on mount — show modal if none found
  useEffect(() => {
    const multiAccountData = localStorage.getItem('multiAccountData');
    if (!multiAccountData) {
      logger.debug('[LoginForm] No accounts found, showing wallet options modal');
      setShowNoAccountModal(true);
    }
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    // Brute-force protection: exponential backoff after 3 failed attempts
    if (lockoutUntil && Date.now() < lockoutUntil) {
      const remainingSec = Math.ceil((lockoutUntil - Date.now()) / 1000);
      setError(`Too many failed attempts. Please wait ${remainingSec} seconds.`);
      return;
    }

    setIsLoading(true);

    try {
      // Get encrypted vault from storage
      const multiAccountData = localStorage.getItem('multiAccountData');
      const multiAccountHash = localStorage.getItem('multiAccountHash');
      const multiAccountUsers = localStorage.getItem('multiAccountUsers') || '{}';

      if (!multiAccountData || !multiAccountHash) {
        throw new Error('No accounts found. Please create an account first.');
      }

      // Decrypt vault with password (matches Angular signInForm.onSubmit)
      await multiAccount.signIn(multiAccountData, password, 600000, multiAccountHash);

      // Get account list with decrypted data
      const users = JSON.parse(multiAccountUsers);
      const accountList = multiAccount.toList(users);

      if (accountList.length === 0) {
        throw new Error('No accounts found in vault');
      }

      if (accountList.length === 1) {
        // Auto-login with single account
        const firstAccount = accountList[0];
        if (!firstAccount) throw new Error('No accounts found in vault');
        await login(firstAccount.hash, password);

        // Navigate via effect once user state propagates
        navigationTarget.current = getActiveState('wallet');
        setPendingNavigation(true);
      } else {
        // Show account selection for multiple accounts
        setAccounts(accountList);
        setShowAccountSelect(true);
        setIsLoading(false);
      }
    } catch (err) {
      logger.error('[LoginForm] Login error:', err);
      const newAttempts = failedAttempts + 1;
      setFailedAttempts(newAttempts);

      // Exponential backoff: 0, 0, 0, 5s, 15s, 30s, 60s, 120s...
      if (newAttempts >= 3) {
        const lockoutMs = Math.min(5000 * 2 ** (newAttempts - 3), 300000);
        setLockoutUntil(Date.now() + lockoutMs);
        const lockoutSec = Math.ceil(lockoutMs / 1000);
        setError(`Incorrect password. Account locked for ${lockoutSec} seconds.`);
      } else {
        setError('Incorrect password. Please try again.');
      }
      setPassword('');
      setIsLoading(false);
    }
  };

  const handleAccountSelect = async (userHash: string) => {
    try {
      await login(userHash, password);

      // Navigate via effect once user state propagates
      navigationTarget.current = getActiveState('wallet');
      setPendingNavigation(true);
    } catch (error) {
      logger.error('[LoginForm] Account select failed:', error);
      setError('Failed to login. Please try again.');
      setShowAccountSelect(false);
    }
  };

  const handleBack = () => {
    setShowAccountSelect(false);
    setAccounts([]);
    setPassword('');
  };

  // Show account selection screen if multiple accounts
  if (showAccountSelect) {
    return (
      <AccountSelectScreen accounts={accounts} onSelect={handleAccountSelect} onBack={handleBack} />
    );
  }

  return (
    <FormContainer>
      <Card>
        <CardBody>
          <Title>Welcome Back</Title>
          <Description>Enter your password to access your wallet</Description>

          <form onSubmit={handleSubmit}>
            <Stack gap="16px">
              {error && <ErrorMessage>{error}</ErrorMessage>}

              <Input
                type="password"
                label="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your master password"
                disabled={isLoading}
                autoComplete="current-password"
                autoFocus
              />

              <Button type="submit" isLoading={isLoading} disabled={isLoading} fullWidth>
                {isLoading ? 'Logging in...' : 'Login'}
              </Button>

              {isLedgerSupported && (
                <>
                  <Divider>
                    <span>or</span>
                  </Divider>

                  <LedgerButton
                    type="button"
                    onClick={() => navigate('/import/ledger')}
                    disabled={isLoading}
                    fullWidth
                  >
                    🔐 Import with Ledger Hardware Wallet
                  </LedgerButton>
                </>
              )}

              <HelpText>
                Don&apos;t have a wallet?{' '}
                <button
                  type="button"
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'inherit',
                    cursor: 'pointer',
                    font: 'inherit',
                    padding: 0,
                    textDecoration: 'underline',
                  }}
                  onClick={() => {
                    setShowNoAccountModal(true);
                  }}
                >
                  Create or import one
                </button>
              </HelpText>
            </Stack>
          </form>
        </CardBody>
      </Card>

      <NoAccountModal
        open={showNoAccountModal}
        onClose={() => setShowNoAccountModal(false)}
        onCreateWallet={() => navigate('/create-account')}
        onImportSeedPhrase={() => navigate('/import-account')}
        onImportPrivateKey={() => navigate('/import-account?mode=privatekey')}
        zIndex={1400}
      />
    </FormContainer>
  );
};

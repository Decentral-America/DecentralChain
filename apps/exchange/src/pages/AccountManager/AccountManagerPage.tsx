/**
 * AccountManagerPage
 * Manage multiple wallet accounts after authentication
 * Switch between accounts without re-entering password (vault remains unlocked)
 * Matches Angular's account management functionality
 */
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import styled from 'styled-components';
import { Button } from '@/components/atoms/Button';
import { useAuth } from '@/contexts/AuthContext';
import { logger } from '@/lib/logger';
import { multiAccount } from '@/services/multiAccount';

const PageContainer = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: ${(p) => p.theme.spacing.xl};
`;

const Header = styled.div`
  margin-bottom: ${(p) => p.theme.spacing.xl};
`;

const Title = styled.h1`
  font-size: ${(p) => p.theme.fontSizes.xxl};
  font-weight: ${(p) => p.theme.fontWeights.bold};
  margin: 0 0 ${(p) => p.theme.spacing.sm} 0;
  color: ${(p) => p.theme.colors.text};
`;

const Subtitle = styled.p`
  font-size: ${(p) => p.theme.fontSizes.md};
  color: ${(p) => p.theme.colors.text};
  opacity: 0.7;
  margin: 0;
`;

const Section = styled.div`
  margin-bottom: ${(p) => p.theme.spacing.xl};
`;

const SectionTitle = styled.h2`
  font-size: ${(p) => p.theme.fontSizes.lg};
  font-weight: ${(p) => p.theme.fontWeights.semibold};
  margin: 0 0 ${(p) => p.theme.spacing.md} 0;
  color: ${(p) => p.theme.colors.text};
`;

const AccountCard = styled.div<{ isActive?: boolean; clickable?: boolean }>`
  display: flex;
  align-items: center;
  gap: ${(p) => p.theme.spacing.md};
  padding: ${(p) => p.theme.spacing.md};
  background: ${(p) => p.theme.colors.background};
  border: 2px solid ${(p) => (p.isActive ? p.theme.colors.primary : p.theme.colors.border)};
  border-radius: ${(p) => p.theme.radii.md};
  margin-bottom: ${(p) => p.theme.spacing.md};
  cursor: ${(p) => (p.clickable ? 'pointer' : 'default')};
  transition: all 0.2s;

  ${(p) =>
    p.clickable &&
    `
    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      border-color: ${p.theme.colors.primary};
    }
  `}
`;

const AccountAvatar = styled.div`
  width: 56px;
  height: 56px;
  border-radius: ${(p) => p.theme.radii.full};
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: ${(p) => p.theme.fontSizes.xl};
  font-weight: ${(p) => p.theme.fontWeights.bold};
  flex-shrink: 0;
`;

const AccountInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const AccountName = styled.div`
  font-size: ${(p) => p.theme.fontSizes.md};
  font-weight: ${(p) => p.theme.fontWeights.semibold};
  color: ${(p) => p.theme.colors.text};
  margin-bottom: ${(p) => p.theme.spacing.xs};
`;

const AccountAddress = styled.div`
  font-size: ${(p) => p.theme.fontSizes.sm};
  color: ${(p) => p.theme.colors.text};
  opacity: 0.6;
  font-family: 'Monaco', 'Menlo', 'Courier New', monospace;
  margin-bottom: ${(p) => p.theme.spacing.xs};
  word-break: break-all;
`;

const ActiveBadge = styled.div`
  display: inline-block;
  padding: ${(p) => p.theme.spacing.xs} ${(p) => p.theme.spacing.sm};
  background: ${(p) => p.theme.colors.primary};
  color: white;
  border-radius: ${(p) => p.theme.radii.sm};
  font-size: ${(p) => p.theme.fontSizes.xs};
  font-weight: ${(p) => p.theme.fontWeights.semibold};
`;

const LastLogin = styled.div`
  font-size: ${(p) => p.theme.fontSizes.xs};
  color: ${(p) => p.theme.colors.text};
  opacity: 0.5;
`;

const SwitchIcon = styled.div`
  font-size: ${(p) => p.theme.fontSizes.xl};
  color: ${(p) => p.theme.colors.primary};
  opacity: 0.5;
  transition: opacity 0.2s;

  ${AccountCard}:hover & {
    opacity: 1;
  }
`;

const ActionsSection = styled.div`
  display: flex;
  gap: ${(p) => p.theme.spacing.md};
  padding-top: ${(p) => p.theme.spacing.lg};
  border-top: 1px solid ${(p) => p.theme.colors.border};

  @media (max-width: 640px) {
    flex-direction: column;
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: ${(p) => p.theme.spacing.xl};
  color: ${(p) => p.theme.colors.text};
  opacity: 0.6;
`;

/**
 * Format last login timestamp
 */
function formatLastLogin(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

/**
 * Generate initials from account name or address
 */
function getAccountInitials(account: { name?: string; address: string }): string {
  if (account.name) {
    return account.name
      .split(' ')
      .map((word) => word[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  }
  return account.address.substring(0, 2).toUpperCase();
}

/**
 * AccountManagerPage Component
 */
export const AccountManagerPage = () => {
  const { t } = useTranslation();
  const { user, accounts, switchAccount, logout, getActiveState } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // Check if multiAccount vault is unlocked
  useEffect(() => {
    if (!multiAccount.isSignedIn) {
      // Vault locked, need password. The sign-in screen is registered at
      // '/signin' (and its '/sign-in' alias); '/auth/login' is not a route, so
      // this used to fall through to the router's catch-all and drop the user
      // on the marketing landing page instead of the password prompt.
      logger.debug('[AccountManager] Vault locked, redirecting to login');
      void navigate('/signin');
    }
  }, [navigate]);

  const handleSwitchAccount = async (userHash: string) => {
    if (userHash === user?.hash) return; // Already active

    setIsLoading(true);
    try {
      // Switch account (no password needed - vault already unlocked)
      await switchAccount(userHash);

      // Navigate using getActiveState helper
      const targetRoute = getActiveState('wallet');
      void navigate(targetRoute);
    } catch (error) {
      logger.error('[AccountManager] Switch failed:', error);
      setIsLoading(false);
    }
  };

  const handleAddAccount = () => {
    // Navigate to import account flow. The screen is registered at
    // '/import-account'; '/auth/import' is not a route, so the router's
    // catch-all silently redirected the user to the landing page instead.
    void navigate('/import-account');
  };

  const handleLogoutAll = async () => {
    if (
      !confirm(
        'This will lock your vault and you will need your password to access any account. Continue?',
      )
    ) {
      return;
    }

    // Logout locks the vault. The confirm above promises the user they "will
    // need your password to access any account", so the sign-in screen — where
    // that password is entered — is the destination, not the landing page.
    // Same unregistered-route bug as the locked-vault redirect above.
    await logout();
    void navigate('/signin');
  };

  // Filter out current account from other accounts list
  const otherAccounts = accounts.filter((acc) => acc.hash !== user?.hash);

  return (
    <PageContainer>
      <Header>
        <Title>{t('app.accountManager.manageAccounts')}</Title>
        <Subtitle>
          {accounts.length} {accounts.length === 1 ? 'wallet' : 'wallets'} in your vault
        </Subtitle>
      </Header>

      {/* Current Account Section */}
      <Section>
        <SectionTitle>{t('app.accountManager.currentAccount')}</SectionTitle>
        {user && (
          <AccountCard isActive>
            <AccountAvatar>{getAccountInitials(user)}</AccountAvatar>
            <AccountInfo>
              <AccountName>{user.name || 'Account'}</AccountName>
              <AccountAddress>{user.address}</AccountAddress>
              <ActiveBadge>Active</ActiveBadge>
            </AccountInfo>
          </AccountCard>
        )}
      </Section>

      {/* Other Accounts Section */}
      {otherAccounts.length > 0 && (
        <Section>
          <SectionTitle>{t('app.accountManager.switchAccount')}</SectionTitle>
          {otherAccounts.map((account) => (
            <AccountCard
              key={account.hash}
              onClick={() => handleSwitchAccount(account.hash)}
              clickable
              style={{ opacity: isLoading ? 0.6 : 1 }}
            >
              <AccountAvatar>{getAccountInitials(account)}</AccountAvatar>
              <AccountInfo>
                <AccountName>{account.name || 'Account'}</AccountName>
                <AccountAddress>
                  {account.address.length > 30
                    ? `${account.address.substring(0, 12)}...${account.address.substring(account.address.length - 8)}`
                    : account.address}
                </AccountAddress>
                {account.lastLogin && (
                  <LastLogin>Last used {formatLastLogin(account.lastLogin)}</LastLogin>
                )}
              </AccountInfo>
              <SwitchIcon>→</SwitchIcon>
            </AccountCard>
          ))}
        </Section>
      )}

      {otherAccounts.length === 0 && (
        <Section>
          <EmptyState>No other accounts in your vault</EmptyState>
        </Section>
      )}

      {/* Actions Section */}
      <ActionsSection>
        <Button onClick={handleAddAccount} variant="secondary" fullWidth>
          + Add Account
        </Button>
        <Button onClick={handleLogoutAll} variant="secondary" fullWidth>
          Logout All Accounts
        </Button>
      </ActionsSection>
    </PageContainer>
  );
};

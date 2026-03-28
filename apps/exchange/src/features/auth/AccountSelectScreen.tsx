/**
 * AccountSelectScreen Component
 * Shows available accounts after password authentication
 * User selects which wallet to login with
 * Matches Angular's account selection UI
 */
import { useState } from 'react';
import styled from 'styled-components';
import { Button } from '@/components/atoms/Button';
import { Card } from '@/components/atoms/Card';
import { Stack } from '@/components/atoms/Stack';
import { logger } from '@/lib/logger';

// Account type - matches User from AuthContext
interface Account {
  hash: string;
  name?: string | undefined;
  address: string;
  lastLogin?: number | undefined;
  userType?: 'seed' | 'privateKey' | 'ledger' | 'keeper' | undefined; // Account type
  settings?: Record<string, unknown> | undefined;
}

interface AccountSelectScreenProps {
  accounts: Account[];
  onSelect: (userHash: string) => Promise<void>;
  onBack?: () => void;
}

const Container = styled.div`
  width: 100%;
  max-width: 500px;
  margin: 0 auto;
`;

const Header = styled.div`
  margin-bottom: ${(p) => p.theme.spacing.xl};
  text-align: center;
`;

const BackButton = styled.button`
  background: none;
  border: none;
  color: ${(p) => p.theme.colors.primary};
  font-size: ${(p) => p.theme.fontSizes.sm};
  cursor: pointer;
  padding: ${(p) => p.theme.spacing.sm};
  display: inline-flex;
  align-items: center;
  gap: ${(p) => p.theme.spacing.xs};
  margin-bottom: ${(p) => p.theme.spacing.md};
  transition: opacity 0.2s;

  &:hover {
    opacity: 0.7;
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`;

const Title = styled.h2`
  font-size: ${(p) => p.theme.fontSizes.xxl};
  font-weight: ${(p) => p.theme.fontWeights.bold};
  margin: 0 0 ${(p) => p.theme.spacing.sm} 0;
  color: ${(p) => p.theme.colors.text};
`;

const Subtitle = styled.p`
  font-size: ${(p) => p.theme.fontSizes.sm};
  color: ${(p) => p.theme.colors.text};
  opacity: 0.7;
  margin: 0;
`;

const AccountList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${(p) => p.theme.spacing.md};
`;

const AccountCard = styled(Card as React.ComponentType<Record<string, unknown>>).attrs<{
  $isSelected: boolean;
  $disabled?: boolean;
}>(() => ({}))<{
  $isSelected: boolean;
  $disabled?: boolean;
}>`
  cursor: pointer;
  transition: all 0.2s;
  border: 2px solid ${(p) => (p.$isSelected ? p.theme.colors.primary : 'transparent')};
  opacity: ${(p) => (p.$disabled ? 0.6 : 1)};

  &:hover {
    transform: ${(p) => (p.$disabled ? 'none' : 'translateY(-2px)')};
    box-shadow: ${(p) => (p.$disabled ? 'none' : '0 4px 12px rgba(0, 0, 0, 0.15)')};
  }

  &:active {
    transform: ${(p) => (p.$disabled ? 'none' : 'translateY(0)')};
  }
`;

const AccountCardInner = styled.div`
  display: flex;
  align-items: center;
  gap: ${(p) => p.theme.spacing.md};
  padding: ${(p) => p.theme.spacing.md};
  min-height: 80px;
`;

const AccountIcon = styled.div`
  width: 48px;
  height: 48px;
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
`;

const LastLogin = styled.div`
  font-size: ${(p) => p.theme.fontSizes.xs};
  color: ${(p) => p.theme.colors.text};
  opacity: 0.5;
`;

const LedgerBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
  color: white;
  border-radius: ${(p) => p.theme.radii.sm};
  font-size: ${(p) => p.theme.fontSizes.xs};
  font-weight: ${(p) => p.theme.fontWeights.semibold};
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-top: 4px;
`;

const LoadingSpinner = styled.div`
  width: 24px;
  height: 24px;
  border: 3px solid ${(p) => p.theme.colors.border};
  border-top-color: ${(p) => p.theme.colors.primary};
  border-radius: ${(p) => p.theme.radii.full};
  animation: spin 0.8s linear infinite;

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;

const Footer = styled.div`
  margin-top: ${(p) => p.theme.spacing.lg};
  text-align: center;
`;

const HelpText = styled.p`
  font-size: ${(p) => p.theme.fontSizes.xs};
  color: ${(p) => p.theme.colors.text};
  opacity: 0.6;
  margin: 0;
`;

const EmptyStateText = styled.p`
  opacity: 0.6;
  text-align: center;
  margin: 0;
`;

/**
 * Format timestamp as relative time
 */
function formatLastLogin(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

/**
 * Generate deterministic initials from account name or address
 */
function getAccountInitials(account: Account): string {
  if (account.name) {
    return account.name
      .split(' ')
      .map((word) => word[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  }
  // Use first 2 chars of address as fallback
  return account.address.substring(0, 2).toUpperCase();
}

/**
 * AccountSelectScreen Component
 */
export const AccountSelectScreen: React.FC<AccountSelectScreenProps> = ({
  accounts,
  onSelect,
  onBack,
}) => {
  const [selectedHash, setSelectedHash] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSelect = async (userHash: string) => {
    if (isLoading) return;

    setSelectedHash(userHash);
    setIsLoading(true);
    try {
      await onSelect(userHash);
    } catch (error) {
      logger.error('[AccountSelect] Login failed:', error);
      setIsLoading(false);
      setSelectedHash(null);
    }
  };

  // Sort by lastLogin descending (most recent first)
  const sortedAccounts = [...accounts].sort((a, b) => (b.lastLogin || 0) - (a.lastLogin || 0));

  return (
    <Container>
      <Header>
        {onBack && (
          <BackButton onClick={onBack} disabled={isLoading}>
            ← Back to password
          </BackButton>
        )}
        <Title>Select Account</Title>
        <Subtitle>Choose which wallet to access</Subtitle>
      </Header>

      <AccountList>
        {sortedAccounts.map((account) => (
          <AccountCard
            key={account.hash}
            onClick={() => handleSelect(account.hash)}
            $isSelected={selectedHash === account.hash}
            $disabled={isLoading}
          >
            <AccountCardInner>
              <AccountIcon>{getAccountInitials(account)}</AccountIcon>

              <AccountInfo>
                <AccountName>{account.name || 'Account'}</AccountName>
                <AccountAddress>
                  {account.address.substring(0, 10)}...
                  {account.address.substring(account.address.length - 8)}
                </AccountAddress>
                {account.userType === 'ledger' && <LedgerBadge>🔐 Ledger</LedgerBadge>}
                {account.lastLogin && (
                  <LastLogin>Last login: {formatLastLogin(account.lastLogin)}</LastLogin>
                )}
              </AccountInfo>

              {selectedHash === account.hash && isLoading && <LoadingSpinner />}
            </AccountCardInner>
          </AccountCard>
        ))}
      </AccountList>

      {sortedAccounts.length === 0 && (
        <Stack gap="16px">
          <EmptyStateText>No accounts found in vault</EmptyStateText>
          {onBack && (
            <Button onClick={onBack} variant="secondary" fullWidth>
              Go Back
            </Button>
          )}
        </Stack>
      )}

      <Footer>
        <HelpText>Can&apos;t find your account? Check your password or contact support.</HelpText>
      </Footer>
    </Container>
  );
};

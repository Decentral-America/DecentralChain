/**
 * AccountSwitcher Component
 * Allows users to switch between multiple stored accounts
 * Replaces Angular multi-account functionality
 */
import { useState } from 'react';
import styled from 'styled-components';
import { Avatar } from '@/components/atoms/Avatar';
import { Button } from '@/components/atoms/Button';
import { Card } from '@/components/atoms/Card';
import { CommonIcons, Icon } from '@/components/atoms/Icon';
import { Stack } from '@/components/atoms/Stack';
import { ConfirmDialog } from '@/components/modals/ConfirmDialog';
import { useAuth } from '@/contexts/AuthContext';

const AccountSwitcherWrapper = styled.div`
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
`;

const Title = styled.h2`
  margin: 0 0 ${(p) => p.theme.spacing.lg};
  font-size: ${(p) => p.theme.fontSizes.xl};
  font-weight: ${(p) => p.theme.fontWeights.semibold};
  color: ${(p) => p.theme.colors.text};
`;

const AccountListContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${(p) => p.theme.spacing.md};
  margin-bottom: ${(p) => p.theme.spacing.lg};
`;

const AccountItem = styled.div<{ $isActive: boolean }>`
  display: flex;
  align-items: center;
  gap: ${(p) => p.theme.spacing.md};
  padding: ${(p) => p.theme.spacing.md};
  border: 2px solid ${(p) => (p.$isActive ? p.theme.colors.primary : p.theme.colors.border)};
  border-radius: ${(p) => p.theme.radii.md};
  background-color: ${(p) =>
    p.$isActive ? `${p.theme.colors.primary}10` : p.theme.colors.background};
  cursor: pointer;
  transition: all 0.2s ease-in-out;

  &:hover {
    border-color: ${(p) => p.theme.colors.primary};
    background-color: ${(p) => `${p.theme.colors.primary}10`};
  }
`;

const AccountInfo = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: ${(p) => p.theme.spacing.xs};
`;

const AccountName = styled.span`
  font-size: ${(p) => p.theme.fontSizes.md};
  font-weight: ${(p) => p.theme.fontWeights.medium};
  color: ${(p) => p.theme.colors.text};
`;

const AccountAddress = styled.span`
  font-size: ${(p) => p.theme.fontSizes.sm};
  font-family: ${(p) => p.theme.fonts.mono};
  color: ${(p) => p.theme.colors.secondary};
`;

const ActiveBadge = styled.div`
  display: flex;
  align-items: center;
  gap: ${(p) => p.theme.spacing.xs};
  padding: ${(p) => p.theme.spacing.xs} ${(p) => p.theme.spacing.sm};
  border-radius: ${(p) => p.theme.radii.full};
  background-color: ${(p) => p.theme.colors.success};
  color: white;
  font-size: ${(p) => p.theme.fontSizes.xs};
  font-weight: ${(p) => p.theme.fontWeights.medium};
`;

const RemoveButton = styled.button`
  padding: ${(p) => p.theme.spacing.xs};
  border: none;
  background: transparent;
  color: ${(p) => p.theme.colors.error};
  cursor: pointer;
  border-radius: ${(p) => p.theme.radii.sm};
  transition: background-color 0.2s ease-in-out;

  &:hover {
    background-color: ${(p) => `${p.theme.colors.error}10`};
  }

  &:focus {
    outline: 2px solid ${(p) => p.theme.colors.error};
    outline-offset: 2px;
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: ${(p) => p.theme.spacing.xl};
  color: ${(p) => p.theme.colors.secondary};
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: ${(p) => p.theme.spacing.md};
  margin-top: ${(p) => p.theme.spacing.lg};
`;

export const AccountSwitcher = () => {
  const { user, accounts, switchAccount, removeAccount, logout } = useAuth();
  const [removingAddress, setRemovingAddress] = useState<string | null>(null);
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);
  const [confirmLogout, setConfirmLogout] = useState(false);

  const handleSwitch = (address: string) => {
    if (user?.address !== address) {
      switchAccount(address);
    }
  };

  const handleRemove = (address: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setConfirmRemove(address);
  };

  const handleConfirmRemove = () => {
    if (confirmRemove) {
      setRemovingAddress(confirmRemove);
      removeAccount(confirmRemove);
      setRemovingAddress(null);
    }
    setConfirmRemove(null);
  };

  const handleLogout = () => {
    setConfirmLogout(true);
  };

  const handleConfirmLogout = () => {
    logout();
    setConfirmLogout(false);
  };

  return (
    <AccountSwitcherWrapper>
      <Card elevation="md">
        <Stack gap="24px">
          <Title>Switch Account</Title>

          {accounts.length === 0 ? (
            <EmptyState>
              <Icon name={CommonIcons.Info} size={48} color="secondary" />
              <p>No accounts available. Please login or create a new account.</p>
            </EmptyState>
          ) : (
            <AccountListContainer>
              {accounts.map((account) => {
                const isActive = user?.address === account.address;
                const displayName = account.name || 'Unnamed Account';
                const shortAddress = `${account.address.slice(0, 8)}...${account.address.slice(-8)}`;

                return (
                  <AccountItem
                    key={account.address}
                    $isActive={isActive}
                    onClick={() => handleSwitch(account.address)}
                  >
                    <Avatar name={displayName} size="md" />

                    <AccountInfo>
                      <AccountName>{displayName}</AccountName>
                      <AccountAddress>{shortAddress}</AccountAddress>
                    </AccountInfo>

                    {isActive && (
                      <ActiveBadge>
                        <Icon name={CommonIcons.Check} size={12} />
                        Active
                      </ActiveBadge>
                    )}

                    {accounts.length > 1 && (
                      <RemoveButton
                        onClick={(e) => handleRemove(account.address, e)}
                        disabled={removingAddress === account.address}
                        aria-label="Remove account"
                      >
                        <Icon name={CommonIcons.Close} size={20} />
                      </RemoveButton>
                    )}
                  </AccountItem>
                );
              })}
            </AccountListContainer>
          )}

          <ButtonGroup>
            <Button variant="secondary" onClick={() => window.history.back()}>
              Back
            </Button>
            <Button variant="primary" onClick={() => (window.location.href = '/signup')}>
              Add Account
            </Button>
            {user && (
              <Button variant="text" onClick={handleLogout}>
                Logout
              </Button>
            )}
          </ButtonGroup>
        </Stack>
      </Card>

      <ConfirmDialog
        open={!!confirmRemove}
        onClose={() => setConfirmRemove(null)}
        onConfirm={handleConfirmRemove}
        title="Remove Account"
        message="Are you sure you want to remove this account? This will not delete the account from the blockchain, only from this app."
        confirmText="Remove"
        destructive
      />

      <ConfirmDialog
        open={confirmLogout}
        onClose={() => setConfirmLogout(false)}
        onConfirm={handleConfirmLogout}
        title="Logout"
        message="Are you sure you want to logout? You will need to import your account again to access your wallet."
        confirmText="Logout"
        destructive
      />
    </AccountSwitcherWrapper>
  );
};

import type React from 'react';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import styled from 'styled-components';
import { logger } from '@/lib/logger';
import { Button } from '../components/atoms/Button';
import { Card } from '../components/atoms/Card';
import { Input } from '../components/atoms/Input';
import { Spinner } from '../components/atoms/Spinner';

// Types
interface LegacyUser {
  address: string;
  name?: string;
  userType: 'seed' | 'privateKey' | 'ledger' | 'keeper';
  publicKey: string;
  encryptedSeed?: string;
  encryptedPrivateKey?: string;
  settings?: {
    encryptionRounds?: number;
  };
}

interface MigratedUser {
  address: string;
  name?: string | undefined;
  userType: string;
}

enum MigrationStep {
  AccountList = 0,
  UnlockAccount = 1,
}

// Styled Components
const Container = styled.div`
  width: 100%;
  padding: 40px;
  min-height: calc(100vh - 64px);
  display: flex;
  flex-direction: column;

  @media (max-width: 1024px) {
    padding: 32px;
  }

  @media (max-width: 768px) {
    padding: 24px 16px;
  }
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 48px;
  padding: 24px 0;
`;

const Title = styled.h1`
  font-size: 36px;
  font-weight: 700;
  color: ${(props) => props.theme.colors.text};
  margin: 0 0 20px 0;

  @media (max-width: 768px) {
    font-size: 28px;
  }
`;

const Description = styled.p`
  font-size: 16px;
  color: ${(props) => props.theme.colors.secondary};
  line-height: 1.6;
  margin: 0;
  max-width: 800px;
  margin: 0 auto;

  a {
    color: ${(props) => props.theme.colors.primary};
    cursor: pointer;
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }
`;

const Section = styled.div`
  margin-bottom: 40px;
`;

const SectionTitle = styled.h2`
  font-size: 14px;
  font-weight: 600;
  color: ${(props) => props.theme.colors.secondary};
  margin: 0 0 20px 0;
  text-transform: uppercase;
  letter-spacing: 0.8px;
`;

const AccountList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const AccountCard = styled(Card as React.ComponentType<Record<string, unknown>>)<{
  clickable?: boolean;
}>`
  display: flex;
  align-items: center;
  padding: 20px;
  cursor: ${(props) => (props.clickable ? 'pointer' : 'default')};
  transition: all 0.2s ease;

  ${(props) =>
    props.clickable &&
    `
    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      border-color: ${props.theme.colors.primary};
    }
  `}
`;

const AvatarContainer = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(
    135deg,
    ${(props) => props.theme.colors.primary} 0%,
    ${(props) => props.theme.colors.secondary} 100%
  );
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: 16px;
  margin-right: 16px;
  flex-shrink: 0;
`;

const AccountInfo = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const AccountName = styled.div`
  font-size: 16px;
  font-weight: 500;
  color: ${(props) => props.theme.colors.text};
`;

const AccountAddress = styled.div`
  font-size: 14px;
  color: ${(props) => props.theme.colors.secondary};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: 'Courier New', monospace;
`;

const LockIcon = styled.div<{ locked?: boolean }>`
  margin-left: 16px;
  font-size: 20px;
  color: ${(props) => (props.locked ? props.theme.colors.error : props.theme.colors.success)};

  &::before {
    content: '${(props) => (props.locked ? '🔒' : '🔓')}';
  }
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

const InputContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const ErrorMessage = styled.div`
  color: ${(props) => props.theme.colors.error};
  font-size: 14px;
  margin-top: 4px;
`;

const Footer = styled.div`
  margin-top: auto;
  padding-top: 32px;
  text-align: center;
`;

const FooterText = styled.p`
  font-size: 14px;
  color: ${(props) => props.theme.colors.secondary};
  margin: 0 0 8px 0;
`;

const FooterLink = styled.a`
  color: ${(props) => props.theme.colors.primary};
  cursor: pointer;
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;

  &:hover {
    text-decoration: underline;
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
`;

// Mock data for demonstration - in real implementation, this would come from storage
const mockLockedUsers: LegacyUser[] = [
  {
    address: '3P8JYPHrnXSfsWP1LVXySdzU1P83FE1ssDa',
    encryptedSeed: 'encrypted_seed_data',
    name: 'Main Wallet',
    publicKey: '5AzfA9UfpWVYiwFwvdr77k6LWupSTGLb14b24oVdEpMM',
    settings: { encryptionRounds: 5000 },
    userType: 'seed',
  },
  {
    address: '3PAWHmDyqzVWW4fYjzRiYgWiMVqxHdGqixy',
    encryptedSeed: 'encrypted_seed_data',
    name: 'Trading Account',
    publicKey: '7kPFrHDiGw1rCm7LPszuECwWYL3dMf6iMifLRDJQZMzy',
    userType: 'seed',
  },
];

const mockUnlockedUsers: MigratedUser[] = [
  {
    address: '3PMJ3yGPBEa1Sx9X4TSBFeJCMMaE3wvKR4N',
    name: 'Ledger Wallet',
    userType: 'ledger',
  },
];

export const MigratePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const migrationId = searchParams.get('id');

  const [activeStep, setActiveStep] = useState(MigrationStep.AccountList);
  const [lockedUsers, setLockedUsers] = useState<LegacyUser[]>([]);
  const [unlockedUsers, setUnlockedUsers] = useState<MigratedUser[]>([]);
  const [currentUser, setCurrentUser] = useState<LegacyUser | null>(null);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isMigrating, setIsMigrating] = useState(false);

  const hashAddress = useCallback((address: string): string => {
    // Simple hash for demonstration - in real implementation, use proper hashing
    return btoa(address).substring(0, 16);
  }, []);

  const handleStartMigrate = useCallback((user: LegacyUser) => {
    setCurrentUser(user);
    setPassword('');
    setPasswordError('');
    setActiveStep(MigrationStep.UnlockAccount);
  }, []);

  const migrateUserWithoutPassword = useCallback(async (_user: LegacyUser): Promise<void> => {
    // Simulate migration without password for Ledger/Keeper users
    await new Promise((resolve) => setTimeout(resolve, 200));
    // In real implementation, this would save to new storage format
  }, []);

  const loadUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      // In real implementation, this would fetch from storage
      // Simulating async operation
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Separate users that don't need password (Ledger, Keeper)
      const usersNeedingPassword = mockLockedUsers.filter(
        (user) => user.userType === 'seed' || user.userType === 'privateKey',
      );
      const usersWithoutPassword = mockLockedUsers.filter(
        (user) => user.userType !== 'seed' && user.userType !== 'privateKey',
      );

      // Auto-migrate users that don't need passwords
      for (const user of usersWithoutPassword) {
        await migrateUserWithoutPassword(user);
      }

      setLockedUsers(usersNeedingPassword);
      setUnlockedUsers([...mockUnlockedUsers]);

      // If no locked users, skip to wallet
      if (usersNeedingPassword.length === 0) {
        navigate('/wallet');
      }
    } catch (error) {
      logger.error('Failed to load users:', error);
    } finally {
      setIsLoading(false);
    }
  }, [navigate, migrateUserWithoutPassword]);

  // Load users on mount
  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // Auto-migrate user if ID is provided
  useEffect(() => {
    if (migrationId && lockedUsers.length > 0) {
      const userToMigrate = lockedUsers.find((user) => hashAddress(user.address) === migrationId);
      if (userToMigrate) {
        handleStartMigrate(userToMigrate);
      }
    }
  }, [migrationId, lockedUsers, handleStartMigrate, hashAddress]);

  const handleGoBack = () => {
    if (migrationId) {
      // If auto-migrating with ID, redirect to wallet
      const migratedUser = unlockedUsers.find((user) => hashAddress(user.address) === migrationId);
      if (migratedUser) {
        navigate('/wallet');
        return;
      }
    }
    setActiveStep(MigrationStep.AccountList);
    setCurrentUser(null);
    setPassword('');
    setPasswordError('');
  };

  const validateCredentials = (_user: LegacyUser, password: string): boolean => {
    // In real implementation, this would decrypt and verify the seed/privateKey
    // using @decentralchain/transactions libs.crypto functions
    if (!password || typeof password !== 'string') {
      return false;
    }

    // Enforce minimum password length consistent with vault requirements
    return password.length >= 8;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentUser || !password) {
      return;
    }

    setPasswordError('');
    setIsMigrating(true);

    try {
      // Validate password
      const isValid = validateCredentials(currentUser, password);

      if (!isValid) {
        setPasswordError('Incorrect password. Please try again.');
        setPassword('');
        setIsMigrating(false);
        return;
      }

      // Simulate migration process
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // In real implementation:
      // 1. Decrypt seed/privateKey with password
      // 2. Add to new multi-account storage
      // 3. Remove from old storage
      // 4. Update state

      // Update state
      setLockedUsers((prev) => prev.filter((user) => user.address !== currentUser.address));
      setUnlockedUsers((prev) => [
        ...prev,
        {
          address: currentUser.address,
          name: currentUser.name,
          userType: currentUser.userType,
        },
      ]);

      // Go back to account list
      setPassword('');
      setCurrentUser(null);
      setActiveStep(MigrationStep.AccountList);
    } catch (error) {
      logger.error('Migration failed:', error);
      setPasswordError('Migration failed. Please try again.');
      setPassword('');
    } finally {
      setIsMigrating(false);
    }
  };

  const handleFinish = () => {
    // In real implementation, log in with the first unlocked user
    if (unlockedUsers.length > 0) {
      navigate('/wallet');
    }
  };

  if (isLoading) {
    return (
      <Container>
        <LoadingContainer>
          <Spinner size="lg" />
        </LoadingContainer>
      </Container>
    );
  }

  return (
    <Container>
      {activeStep === MigrationStep.AccountList && (
        <>
          <Header>
            <Title>Unlock Your Accounts</Title>
            <Description>
              Click on each account to unlock it with your password. Accounts without passwords
              (Ledger, Keeper) are automatically unlocked.
            </Description>
          </Header>

          {lockedUsers.length > 0 && (
            <Section>
              <SectionTitle>Pending Migration</SectionTitle>
              <AccountList>
                {lockedUsers.map((user) => (
                  <AccountCard
                    key={user.address}
                    clickable
                    onClick={() => handleStartMigrate(user)}
                    elevation="sm"
                  >
                    <AvatarContainer>
                      {user.name ? user.name.charAt(0).toUpperCase() : user.address.charAt(0)}
                    </AvatarContainer>
                    <AccountInfo>
                      {user.name && <AccountName>{user.name}</AccountName>}
                      <AccountAddress>{user.address}</AccountAddress>
                    </AccountInfo>
                    <LockIcon locked />
                  </AccountCard>
                ))}
              </AccountList>
            </Section>
          )}

          {unlockedUsers.length > 0 && (
            <Section>
              <SectionTitle>Unlocked Accounts</SectionTitle>
              <AccountList>
                {unlockedUsers.map((user) => (
                  <AccountCard key={user.address} elevation="sm">
                    <AvatarContainer>
                      {user.name ? user.name.charAt(0).toUpperCase() : user.address.charAt(0)}
                    </AvatarContainer>
                    <AccountInfo>
                      {user.name && <AccountName>{user.name}</AccountName>}
                      <AccountAddress>{user.address}</AccountAddress>
                    </AccountInfo>
                    <LockIcon />
                  </AccountCard>
                ))}
              </AccountList>
            </Section>
          )}

          <Button
            onClick={handleFinish}
            disabled={unlockedUsers.length === 0}
            fullWidth
            size="large"
          >
            Continue
          </Button>

          <Footer>
            <FooterText>Don&apos;t have an account?</FooterText>
            <FooterLink onClick={() => navigate('/auth/signup')}>Create New Account</FooterLink>
          </Footer>
        </>
      )}

      {activeStep === MigrationStep.UnlockAccount && currentUser && (
        <>
          <Header>
            <Title>Unlock Account</Title>
            <Description>
              Enter your password to migrate this account.{' '}
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
                onClick={handleGoBack}
              >
                Go back
              </button>
            </Description>
          </Header>

          <Section>
            <SectionTitle>Account</SectionTitle>
            <AccountCard elevation="sm">
              <AvatarContainer>
                {currentUser.name
                  ? currentUser.name.charAt(0).toUpperCase()
                  : currentUser.address.charAt(0)}
              </AvatarContainer>
              <AccountInfo>
                {currentUser.name && <AccountName>{currentUser.name}</AccountName>}
                <AccountAddress>{currentUser.address}</AccountAddress>
              </AccountInfo>
              <LockIcon locked />
            </AccountCard>
          </Section>

          <Form onSubmit={handleSubmit}>
            <InputContainer>
              <SectionTitle>Password</SectionTitle>
              <Input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                disabled={isMigrating}
                autoFocus
              />
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? 'Hide' : 'Show'} Password
              </Button>
              {passwordError && <ErrorMessage>{passwordError}</ErrorMessage>}
            </InputContainer>

            <Button type="submit" disabled={!password || isMigrating} fullWidth size="large">
              {isMigrating ? (
                <>
                  <Spinner size="sm" /> Unlocking...
                </>
              ) : (
                'Unlock'
              )}
            </Button>
          </Form>
        </>
      )}
    </Container>
  );
};

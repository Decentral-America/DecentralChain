/**
 * ImportLedger Component
 * Imports wallet from Ledger hardware device
 * Desktop-only feature - requires Electron's Node.js integration
 */

import { type FormEvent, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { Button } from '@/components/atoms/Button';
import { Stack } from '@/components/atoms/Stack';
import LedgerConnectModal from '@/components/modals/LedgerConnectModal';
import LedgerErrorModal from '@/components/modals/LedgerErrorModal';
import { useAuth } from '@/contexts/AuthContext';
import { useConfig } from '@/contexts/ConfigContext';
import { useLedgerContext } from '@/contexts/LedgerContext';
import { type LedgerUser } from '@/hooks/useLedger';
import { logger } from '@/lib/logger';

const USERS_PER_PAGE = 5;

export const ImportLedger = () => {
  const navigate = useNavigate();
  const { login, getActiveState, addLedgerAccount } = useAuth();
  const { networkByte } = useConfig();
  const { isConnected, isLoading, error, connect, getUserList, isInitialized } = useLedgerContext();

  const [offset, setOffset] = useState(0);
  const [selectedUserId, setSelectedUserId] = useState<string>('0');
  const [customName, setCustomName] = useState('');
  const [useDefaultAddress, setUseDefaultAddress] = useState(false);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [visibleUsers, setVisibleUsers] = useState<LedgerUser[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initial connection
  useEffect(() => {
    const initConnection = async () => {
      setShowConnectModal(true);
      try {
        await connect();
        const users = await getUserList(0, USERS_PER_PAGE);
        setVisibleUsers(users);
        if (users.length > 0) {
          setSelectedUserId(users[0]?.id ?? '');
        }
        setShowConnectModal(false);
      } catch {
        setShowConnectModal(false);
        setShowErrorModal(true);
      }
    };

    if (!isInitialized) {
      void initConnection();
    }
  }, [isInitialized, connect, getUserList]);

  // Update visible users when offset changes
  useEffect(() => {
    const loadUsers = async () => {
      if (!isConnected) return;

      try {
        const userList = await getUserList(offset, USERS_PER_PAGE);
        setVisibleUsers(userList);

        if (useDefaultAddress && userList.length > 0) {
          setSelectedUserId(userList[0]?.id ?? '');
        }
      } catch {
        setShowErrorModal(true);
      }
    };

    void loadUsers();
  }, [offset, isConnected, getUserList, useDefaultAddress]);

  const handlePageLeft = () => {
    if (offset >= USERS_PER_PAGE && !isLoading) {
      setOffset((prev) => prev - USERS_PER_PAGE);
    }
  };

  const handlePageRight = () => {
    if (!isLoading) {
      setOffset((prev) => prev + USERS_PER_PAGE);
    }
  };

  const handleSelectUser = (userId: string) => {
    if (!useDefaultAddress) {
      setSelectedUserId(userId);
    }
  };

  const handleIdChange = async (value: string) => {
    const id = parseInt(value, 10);
    if (Number.isNaN(id) || id < 0) return;

    setSelectedUserId(value);

    // Calculate new offset to center on selected ID
    const newOffset = Math.max(0, id - Math.floor(USERS_PER_PAGE / 2));
    if (newOffset !== offset) {
      setOffset(newOffset);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const selectedUser = visibleUsers.find((u) => u.id === selectedUserId);
      if (!selectedUser) {
        throw new Error('Please select an address');
      }

      if (!customName.trim()) {
        throw new Error('Please enter an account name');
      }

      // Prepare Ledger data for account creation
      const ledgerData = {
        address: selectedUser.address,
        id: selectedUser.id,
        path: selectedUser.path,
        publicKey: selectedUser.publicKey,
      };

      // Add Ledger account to multiAccount vault
      // NOTE: User must already be signed in (have created an account with password)
      // Angular flow: user.create() → multiAccount.addUser() → login()
      const createdUser = await addLedgerAccount(ledgerData, customName.trim(), networkByte);

      // Log in with the created Ledger account
      // Ledger accounts don't need password (hardware device provides security)
      await login(createdUser.hash, '');

      // Navigate to wallet
      const targetRoute = getActiveState('wallet');
      void navigate(targetRoute);
    } catch (err) {
      logger.error('Ledger import error:', err);
      setShowErrorModal(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRetry = async () => {
    setShowErrorModal(false);
    setShowConnectModal(true);
    try {
      await connect();
      const users = await getUserList(offset, USERS_PER_PAGE);
      setVisibleUsers(users);
      setShowConnectModal(false);
    } catch {
      setShowConnectModal(false);
      setShowErrorModal(true);
    }
  };

  const handleCancel = () => {
    void navigate('/import');
  };

  if (showConnectModal) {
    return <LedgerConnectModal />;
  }

  if (showErrorModal) {
    return <LedgerErrorModal error={error} onRetry={handleRetry} onCancel={handleCancel} />;
  }

  return (
    <FormContainer>
      <Title>Import from Ledger</Title>
      <Subtitle>Choose an address from your Ledger device</Subtitle>

      <AddressCarousel>
        <NavButton onClick={handlePageLeft} disabled={offset === 0 || isLoading} type="button">
          ←
        </NavButton>

        <AddressList>
          {visibleUsers.map((user, index) => (
            <AddressCard
              key={user.id}
              $selected={user.id === selectedUserId}
              $disabled={useDefaultAddress && index !== 0}
              onClick={() => handleSelectUser(user.id)}
            >
              <Avatar $address={user.address} />
              <AddressText>{user.address}</AddressText>
              <AddressId>ID: {user.id}</AddressId>
            </AddressCard>
          ))}
        </AddressList>

        <NavButton onClick={handlePageRight} disabled={isLoading} type="button">
          →
        </NavButton>
      </AddressCarousel>

      <Form onSubmit={handleSubmit}>
        <Stack gap="16px">
          <FormGroup>
            <Label htmlFor="addressId">Address ID</Label>
            <Input
              id="addressId"
              type="number"
              value={useDefaultAddress ? '0' : selectedUserId}
              onChange={(e) => handleIdChange(e.target.value)}
              disabled={useDefaultAddress || isLoading}
              min="0"
            />
          </FormGroup>

          <CheckboxGroup>
            <Checkbox
              type="checkbox"
              checked={useDefaultAddress}
              onChange={(e) => {
                setUseDefaultAddress(e.target.checked);
                if (e.target.checked) {
                  setSelectedUserId('0');
                  setOffset(0);
                }
              }}
              id="default-address"
            />
            <CheckboxLabel htmlFor="default-address">Use default address (ID 0)</CheckboxLabel>
          </CheckboxGroup>

          <FormGroup>
            <Label htmlFor="accountName">Account Name</Label>
            <Input
              id="accountName"
              type="text"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder="My Ledger Account"
              maxLength={24}
              required
              disabled={isSubmitting}
            />
          </FormGroup>

          <Button
            type="submit"
            disabled={isLoading || !customName.trim() || isSubmitting}
            isLoading={isSubmitting}
            fullWidth
          >
            {isSubmitting ? 'Importing...' : 'Import Account'}
          </Button>
        </Stack>
      </Form>
    </FormContainer>
  );
};

const FormContainer = styled.div`
  width: 100%;
`;

const Title = styled.h2`
  font-size: ${(p) => p.theme.fontSizes.xxl};
  font-weight: ${(p) => p.theme.fontWeights.bold};
  margin: 0 0 ${(p) => p.theme.spacing.xs} 0;
  color: ${(p) => p.theme.colors.text};
`;

const Subtitle = styled.p`
  font-size: ${(p) => p.theme.fontSizes.sm};
  color: ${(p) => p.theme.colors.text};
  opacity: 0.7;
  margin: 0 0 ${(p) => p.theme.spacing.xl} 0;
  line-height: 1.6;
`;
const AddressCarousel = styled.div`
  display: flex;
  align-items: center;
  gap: ${(p) => p.theme.spacing.md};
  margin-bottom: ${(p) => p.theme.spacing.xl};
`;

const NavButton = styled.button`
  width: 44px;
  height: 44px;
  min-width: 44px;
  border-radius: 50%;
  border: 2px solid ${(p) => p.theme.colors.primary};
  background: ${(p) => p.theme.colors.background};
  color: ${(p) => p.theme.colors.primary};
  cursor: pointer;
  font-size: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: ${(p) => p.theme.transitions.fast};

  &:hover:not(:disabled) {
    background: ${(p) => p.theme.colors.primary};
    color: white;
  }

  &:disabled {
    opacity: 0.3;
    cursor: not-allowed;
    border-color: ${(p) => p.theme.colors.disabled};
    color: ${(p) => p.theme.colors.disabled};
  }
`;

const AddressList = styled.div`
  flex: 1;
  display: flex;
  gap: ${(p) => p.theme.spacing.md};
  overflow-x: auto;
  padding: ${(p) => p.theme.spacing.xs} 0;

  /* Hide scrollbar but keep functionality */
  scrollbar-width: none;
  &::-webkit-scrollbar {
    display: none;
  }
`;

const AddressCard = styled.div<{ $selected: boolean; $disabled: boolean }>`
  min-width: 140px;
  padding: ${(p) => p.theme.spacing.md};
  border: 2px solid ${(p) => (p.$selected ? p.theme.colors.primary : p.theme.colors.border)};
  border-radius: ${(p) => p.theme.radii.md};
  text-align: center;
  cursor: ${(p) => (p.$disabled ? 'not-allowed' : 'pointer')};
  opacity: ${(p) => (p.$disabled ? 0.5 : 1)};
  background: ${(p) => p.theme.colors.background};
  transition: ${(p) => p.theme.transitions.fast};

  &:hover {
    border-color: ${(p) => !p.$disabled && p.theme.colors.primary};
    transform: ${(p) => !p.$disabled && 'translateY(-2px)'};
  }
`;

const Avatar = styled.div<{ $address: string }>`
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  margin: 0 auto ${(p) => p.theme.spacing.sm};
`;

const AddressText = styled.div`
  font-size: ${(p) => p.theme.fontSizes.xs};
  word-break: break-all;
  margin-bottom: ${(p) => p.theme.spacing.xs};
  color: ${(p) => p.theme.colors.text};
  font-family: ${(p) => p.theme.fonts.mono};
`;

const AddressId = styled.div`
  font-size: ${(p) => p.theme.fontSizes.xs};
  color: ${(p) => p.theme.colors.text};
  opacity: 0.5;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${(p) => p.theme.spacing.xs};
`;

const Label = styled.label`
  font-weight: ${(p) => p.theme.fontWeights.semibold};
  color: ${(p) => p.theme.colors.text};
  font-size: ${(p) => p.theme.fontSizes.sm};
`;

const Input = styled.input`
  padding: ${(p) => p.theme.spacing.sm} ${(p) => p.theme.spacing.md};
  border: 2px solid ${(p) => p.theme.colors.border};
  border-radius: ${(p) => p.theme.radii.md};
  font-size: ${(p) => p.theme.fontSizes.md};
  color: ${(p) => p.theme.colors.text};
  background: ${(p) => p.theme.colors.background};
  transition: ${(p) => p.theme.transitions.fast};

  &:focus {
    outline: none;
    border-color: ${(p) => p.theme.colors.primary};
  }

  &:disabled {
    background: ${(p) => p.theme.colors.hover};
    cursor: not-allowed;
    opacity: 0.6;
  }
`;

const CheckboxGroup = styled.div`
  display: flex;
  align-items: center;
  gap: ${(p) => p.theme.spacing.sm};
`;

const Checkbox = styled.input`
  width: 20px;
  height: 20px;
  cursor: pointer;
`;

const CheckboxLabel = styled.label`
  cursor: pointer;
  color: ${(p) => p.theme.colors.text};
  font-size: ${(p) => p.theme.fontSizes.sm};
`;

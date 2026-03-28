/**
 * Delete Account Modal
 * Permanently delete account with confirmation
 * Matches Angular DeleteAccountModalCtrl functionality
 */
import type React from 'react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { Button } from '@/components/atoms/Button';
import { Modal } from '@/components/organisms/Modal';
import { useAuth } from '@/contexts/AuthContext';
import { logger } from '@/lib/logger';
import { multiAccount } from '@/services/multiAccount';

const ModalBody = styled.div`
  padding: 24px;
`;

const WarningBox = styled.div`
  padding: 16px;
  background-color: #fff3e0;
  border-left: 4px solid #ff9800;
  border-radius: 4px;
  margin-bottom: 20px;
`;

const WarningTitle = styled.div`
  font-size: 15px;
  font-weight: 600;
  color: #e65100;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 8px;

  &::before {
    content: '⚠️';
    font-size: 20px;
  }
`;

const WarningText = styled.p`
  margin: 0;
  font-size: 13px;
  color: #bf360c;
  line-height: 1.6;
`;

const CheckboxContainer = styled.label`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin: 20px 0;
  cursor: pointer;
  user-select: none;
`;

const Checkbox = styled.input`
  margin-top: 2px;
  cursor: pointer;
  flex-shrink: 0;
`;

const CheckboxLabel = styled.span`
  font-size: 14px;
  color: #424242;
  line-height: 1.5;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 24px;
`;

const DangerButton = styled(Button as React.ComponentType<Record<string, unknown>>)`
  background-color: #d32f2f !important;

  &:hover:not(:disabled) {
    background-color: #c62828 !important;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const FormError = styled.div`
  background-color: #ffebee;
  border: 1px solid #ef9a9a;
  border-radius: 4px;
  color: #c62828;
  font-size: 13px;
  line-height: 1.5;
  margin-bottom: 8px;
  padding: 12px;
`;

export interface DeleteAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DeleteAccountModal: React.FC<DeleteAccountModalProps> = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [confirmed, setConfirmed] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!confirmed || !user) return;

    setIsDeleting(true);
    setErrorMessage(null);

    try {
      const result = await multiAccount.deleteUser(user.hash);

      // Persist updated encrypted blob
      localStorage.setItem('multiAccountData', result.multiAccountData);
      localStorage.setItem('multiAccountHash', result.multiAccountHash);

      // Remove user from unencrypted metadata
      const storedUsers = JSON.parse(localStorage.getItem('multiAccountUsers') ?? '{}') as Record<
        string,
        unknown
      >;
      delete storedUsers[user.hash];
      localStorage.setItem('multiAccountUsers', JSON.stringify(storedUsers));

      await logout();
      void navigate('/');
    } catch (error) {
      logger.error('Delete account failed:', error);
      const msg =
        error instanceof Error ? error.message : 'Failed to delete account. Please try again.';
      setErrorMessage(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Delete Account"
      size="small"
      closeOnOverlayClick={false}
    >
      <ModalBody>
        <WarningBox>
          <WarningTitle>Permanent Action</WarningTitle>
          <WarningText>
            This action cannot be undone. Your account will be permanently removed from this device.
            <br />
            <br />
            Make sure you have backed up your seed phrase or private key before proceeding.
          </WarningText>
        </WarningBox>

        <CheckboxContainer>
          <Checkbox
            type="checkbox"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
            disabled={isDeleting}
          />
          <CheckboxLabel>
            I understand this will permanently delete my account and I have backed up my seed phrase
          </CheckboxLabel>
        </CheckboxContainer>

        {errorMessage && <FormError>{errorMessage}</FormError>}

        <ButtonGroup>
          <Button variant="text" onClick={onClose} disabled={isDeleting}>
            Cancel
          </Button>
          <DangerButton variant="danger" onClick={handleDelete} disabled={!confirmed || isDeleting}>
            {isDeleting ? 'Deleting...' : 'Delete Account'}
          </DangerButton>
        </ButtonGroup>
      </ModalBody>
    </Modal>
  );
};

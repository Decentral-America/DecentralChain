/**
 * Delete Account Modal
 * Permanently delete account with confirmation
 * Matches Angular DeleteAccountModalCtrl functionality
 */
import React, { useState } from 'react';
import { Modal } from '@/components/organisms/Modal';
import { Button } from '@/components/atoms/Button';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

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

const DangerButton = styled(Button)`
  background-color: #d32f2f !important;

  &:hover:not(:disabled) {
    background-color: #c62828 !important;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
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

  const handleDelete = async () => {
    if (!confirmed || !user) return;

    setIsDeleting(true);

    try {
      // TODO: Implement actual account deletion
      // This would use: user.resetAll() or similar service method
      // For now, we'll simulate the deletion process
      await new Promise((resolve) => setTimeout(resolve, 500));

      // In real implementation:
      // - Remove account from multi-account storage
      // - Clear localStorage data for this account
      // - Call user.resetAll() or removeAccount(user.hash)

      // Logout and navigate to welcome page
      await logout();
      navigate('/welcome');
    } catch (error) {
      console.error('Delete account failed:', error);
      // Show error notification
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

        <ButtonGroup>
          <Button variant="text" onClick={onClose} disabled={isDeleting}>
            Cancel
          </Button>
          <DangerButton
            variant="danger"
            onClick={handleDelete}
            disabled={!confirmed || isDeleting}
          >
            {isDeleting ? 'Deleting...' : 'Delete Account'}
          </DangerButton>
        </ButtonGroup>
      </ModalBody>
    </Modal>
  );
};

export default DeleteAccountModal;

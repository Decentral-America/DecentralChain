/**
 * Change Password Modal
 * Change encryption password for multi-account data
 * Matches Angular PasswordModalCtrl functionality
 */
import type React from 'react';
import { useState } from 'react';
import styled from 'styled-components';
import { Button } from '@/components/atoms/Button';
import { Modal } from '@/components/organisms/Modal';
import { multiAccount } from '@/services/multiAccount';

const ModalBody = styled.div`
  padding: 24px;
`;

const Description = styled.p`
  margin: 0 0 20px 0;
  font-size: 14px;
  color: #616161;
  line-height: 1.6;
`;

const InputGroup = styled.div`
  margin-bottom: 16px;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 8px;
  font-size: 13px;
  font-weight: 500;
  color: #424242;
`;

const Input = styled.input`
  width: 100%;
  padding: 12px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  font-size: 14px;
  font-family: inherit;
  box-sizing: border-box;

  &:focus {
    outline: none;
    border-color: #2196f3;
  }

  &:disabled {
    background-color: #f5f5f5;
    cursor: not-allowed;
  }
`;

const ErrorMessage = styled.div`
  margin-top: 8px;
  padding: 8px 12px;
  background-color: #ffebee;
  border-radius: 4px;
  font-size: 13px;
  color: #c62828;
`;

const SuccessMessage = styled.div`
  margin-top: 8px;
  padding: 8px 12px;
  background-color: #e8f5e9;
  border-radius: 4px;
  font-size: 13px;
  color: #2e7d32;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 24px;
`;

export interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ isOpen, onClose }) => {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    // Reset messages
    setError('');
    setSuccess(false);

    // Validation
    if (!oldPassword || !newPassword || !confirmPassword) {
      setError('All fields are required');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (newPassword.length < 12) {
      setError('New password must be at least 12 characters');
      return;
    }

    if (oldPassword === newPassword) {
      setError('New password must be different from current password');
      return;
    }

    setIsLoading(true);

    try {
      // Get current multi-account data
      const multiAccountData = localStorage.getItem('multiAccountData');
      const multiAccountHash = localStorage.getItem('multiAccountHash');

      if (!multiAccountData || !multiAccountHash) {
        throw new Error('Multi-account data not found');
      }

      // Re-encrypt all account data with the new password
      const result = await multiAccount.changePassword(
        multiAccountData,
        oldPassword,
        newPassword,
        600000, // OWASP 2024 PBKDF2-SHA256 recommendation
        multiAccountHash,
      );

      // Save re-encrypted data to storage
      localStorage.setItem('multiAccountData', result.multiAccountData);
      localStorage.setItem('multiAccountHash', result.multiAccountHash);

      setSuccess(true);
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');

      // Close modal after short delay
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch {
      setError('Incorrect password or unable to change password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Change Password"
      size="small"
      closeOnOverlayClick={false}
    >
      <ModalBody>
        <Description>
          Change the password used to encrypt your multi-account wallet data.
        </Description>

        <InputGroup>
          <Label htmlFor="oldPassword">Current Password</Label>
          <Input
            id="oldPassword"
            type="password"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            disabled={isLoading || success}
            placeholder="Enter current password"
          />
        </InputGroup>

        <InputGroup>
          <Label htmlFor="newPassword">New Password</Label>
          <Input
            id="newPassword"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            disabled={isLoading || success}
            placeholder="Enter new password (min 12 characters)"
          />
        </InputGroup>

        <InputGroup>
          <Label htmlFor="confirmPassword">Confirm New Password</Label>
          <Input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={isLoading || success}
            placeholder="Re-enter new password"
          />
        </InputGroup>

        {error && <ErrorMessage>{error}</ErrorMessage>}
        {success && <SuccessMessage>Password changed successfully!</SuccessMessage>}

        <ButtonGroup>
          <Button variant="text" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={isLoading || success}>
            {isLoading ? 'Changing...' : 'Change Password'}
          </Button>
        </ButtonGroup>
      </ModalBody>
    </Modal>
  );
};

export default ChangePasswordModal;

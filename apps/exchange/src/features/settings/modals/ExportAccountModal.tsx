/**
 * Export Account Modal
 * Download encrypted wallet backup as JSON file
 * Matches Angular ExportAccounts functionality
 */
import type React from 'react';
import { useEffect, useState } from 'react';
import styled from 'styled-components';
import { Button } from '@/components/atoms/Button';
import { Modal } from '@/components/organisms/Modal';
import { useAuth } from '@/contexts/AuthContext';
import { logger } from '@/lib/logger';

const ModalBody = styled.div`
  padding: 0;
`;

const Description = styled.p`
  margin: 0 0 20px 0;
  font-size: 15px;
  letter-spacing: -0.15px;
  color: ${(p) => p.theme.colors.textSecondary};
  line-height: 1.47;
`;

const UserList = styled.div`
  margin: 20px 0;
  max-height: 300px;
  overflow-y: auto;
  /* Keeps a scroll gesture inside the overlay instead of chaining to the page behind it. */
  overscroll-behavior: contain;
  border-radius: 12px;
  background: ${(p) => p.theme.colors.backgroundAlt};
`;

const UserItem = styled.div`
  display: flex;
  align-items: center;
  min-height: 44px;
  padding: 10px 16px;
  box-sizing: border-box;
  border-bottom: 1px solid ${(p) => p.theme.colors.border};
  cursor: pointer;
  transition: background-color 160ms cubic-bezier(0.32, 0.72, 0, 1);

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background-color: ${(p) => p.theme.colors.hover};
  }
`;

const Checkbox = styled.input`
  width: 18px;
  height: 18px;
  margin: 1px 12px 0 0;
  flex-shrink: 0;
  cursor: pointer;
  accent-color: ${(p) => p.theme.colors.primary};
`;

const UserInfo = styled.div`
  flex: 1;
`;

const UserAddress = styled.div`
  font-size: 13px;
  color: ${(p) => p.theme.colors.text};
  font-family: ${(p) => p.theme.fonts.mono};
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 20px;
`;
const SelectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
`;

const SelectionLabel = styled.span`
  color: ${(props) => props.theme.colors.textSecondary};
  font-size: 13px;
  font-weight: 400;
`;

const SelectionActions = styled.div`
  display: flex;
  gap: 12px;
`;

const TextButton = styled.button`
  background: none;
  border: none;
  color: ${(props) => props.theme.colors.primary};
  cursor: pointer;
  font: inherit;
  font-size: 13px;
  padding: 0;
`;
export interface ExportAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExportAccountModal: React.FC<ExportAccountModalProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [selectedAddresses, setSelectedAddresses] = useState<Set<string>>(new Set());
  const [userList, setUserList] = useState<{ address: string; [key: string]: unknown }[]>([]);

  useEffect(() => {
    if (isOpen && user) {
      // Get all multi-account users from localStorage
      const multiAccountUsers = localStorage.getItem('multiAccountUsers');
      if (multiAccountUsers) {
        try {
          const users = JSON.parse(multiAccountUsers);
          setUserList(Array.isArray(users) ? users : []);
          // Pre-select current user
          setSelectedAddresses(new Set([user.address]));
        } catch (error) {
          logger.error('Failed to parse multi-account users:', error);
          setUserList([]);
        }
      }
    }
  }, [isOpen, user]);

  const toggleSelect = (address: string) => {
    setSelectedAddresses((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(address)) {
        newSet.delete(address);
      } else {
        newSet.add(address);
      }
      return newSet;
    });
  };

  const selectAll = () => {
    setSelectedAddresses(new Set(userList.map((u) => u.address)));
  };

  const unselectAll = () => {
    setSelectedAddresses(new Set());
  };

  const handleExport = () => {
    try {
      // Get selected users
      const selectedUsers = userList.filter((u) => selectedAddresses.has(u.address));

      // Get multi-account settings
      const settingsStr = localStorage.getItem('multiAccountSettings');
      const settings = settingsStr ? JSON.parse(settingsStr) : { lastOpenVersion: null };

      // Create backup data matching Angular format
      const backupData = {
        data: selectedUsers,
        lastOpenVersion: settings.lastOpenVersion,
        time: Date.now(),
        type: 'dccBackup',
      };

      // Download as JSON file
      const blob = new Blob([JSON.stringify(backupData, null, 4)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `accountsBackup-${backupData.time}.json`;
      a.click();
      URL.revokeObjectURL(url);

      onClose();
    } catch (error) {
      logger.error('Export failed:', error);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Export Accounts"
      size="medium"
      closeOnOverlayClick={false}
    >
      <ModalBody>
        <Description>
          Download your encrypted wallet data as a JSON backup file. Keep this file safe and secure.
        </Description>

        {userList.length > 0 && (
          <>
            <SelectionHeader>
              <SelectionLabel>
                Select Accounts ({selectedAddresses.size} of {userList.length})
              </SelectionLabel>
              <SelectionActions>
                {selectedAddresses.size !== userList.length && (
                  <TextButton type="button" onClick={selectAll}>
                    Select All
                  </TextButton>
                )}
                {selectedAddresses.size > 0 && (
                  <TextButton type="button" onClick={unselectAll}>
                    Unselect All
                  </TextButton>
                )}
              </SelectionActions>
            </SelectionHeader>

            <UserList>
              {userList.map((userItem) => (
                <UserItem key={userItem.address} onClick={() => toggleSelect(userItem.address)}>
                  <Checkbox
                    type="checkbox"
                    checked={selectedAddresses.has(userItem.address)}
                    onChange={() => toggleSelect(userItem.address)}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <UserInfo>
                    <UserAddress>{userItem.address}</UserAddress>
                  </UserInfo>
                </UserItem>
              ))}
            </UserList>
          </>
        )}

        <ButtonGroup>
          <Button variant="text" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleExport} disabled={selectedAddresses.size === 0}>
            Download Backup
          </Button>
        </ButtonGroup>
      </ModalBody>
    </Modal>
  );
};

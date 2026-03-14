/**
 * Script Modal
 * Manage smart contract scripts for advanced users
 * Simplified placeholder - full implementation would match Angular ScriptModalCtrl
 */
import React, { useState } from 'react';
import { Modal } from '@/components/organisms/Modal';
import { Button } from '@/components/atoms/Button';
import styled from 'styled-components';

const ModalBody = styled.div`
  padding: 24px;
`;

const Description = styled.p`
  margin: 0 0 20px 0;
  font-size: 14px;
  color: #616161;
  line-height: 1.6;
`;

const InfoBox = styled.div`
  padding: 16px;
  background-color: #e3f2fd;
  border-left: 4px solid #2196f3;
  border-radius: 4px;
  margin-bottom: 20px;
`;

const InfoText = styled.p`
  margin: 0;
  font-size: 13px;
  color: #0d47a1;
  line-height: 1.6;
`;

const TextArea = styled.textarea`
  width: 100%;
  min-height: 200px;
  padding: 12px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  font-size: 13px;
  font-family: 'Roboto Mono', monospace;
  resize: vertical;
  box-sizing: border-box;

  &:focus {
    outline: none;
    border-color: #2196f3;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 20px;
`;

export interface ScriptModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ScriptModal: React.FC<ScriptModalProps> = ({ isOpen, onClose }) => {
  const [script, setScript] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    setIsLoading(true);

    try {
      // TODO: Implement actual script compilation and setting
      // This would involve:
      // 1. Compile RIDE script using waves-transactions
      // 2. Create setScript transaction
      // 3. Sign and broadcast to network
      // 4. Wait for confirmation
      await new Promise((resolve) => setTimeout(resolve, 500));

      console.log('Script would be set:', script);
      onClose();
    } catch (error) {
      console.error('Script setting failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Set Account Script"
      size="large"
      closeOnOverlayClick={false}
    >
      <ModalBody>
        <Description>Set a smart contract script for your account (advanced feature).</Description>

        <InfoBox>
          <InfoText>
            <strong>Note:</strong> This is an advanced feature. Setting a script will restrict how
            you can use your account. Scripts are written in RIDE language and must be carefully
            tested.
            <br />
            <br />
            Setting or changing a script requires a transaction fee. Once set, all transactions from
            this account must satisfy the script conditions.
          </InfoText>
        </InfoBox>

        <TextArea
          value={script}
          onChange={(e) => setScript(e.target.value)}
          placeholder="Enter your RIDE script here...

Example:
# Allow transactions only if timestamp is valid
match tx {
  case t:TransferTransaction => true
  case _ => false
}"
          disabled={isLoading}
        />

        <ButtonGroup>
          <Button variant="text" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSave} disabled={!script.trim() || isLoading}>
            {isLoading ? 'Setting Script...' : 'Set Script'}
          </Button>
        </ButtonGroup>
      </ModalBody>
    </Modal>
  );
};

export default ScriptModal;

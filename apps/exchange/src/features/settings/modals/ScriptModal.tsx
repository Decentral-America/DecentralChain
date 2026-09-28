/**
 * Script Modal
 * Manage smart contract scripts for advanced users
 * Set Script (tx type 13) for account scripts, Set Asset Script (tx type 15) for asset scripts.
 */

import * as ds from 'data-service';
import type React from 'react';
import { useState } from 'react';
import styled from 'styled-components';
import { Button } from '@/components/atoms/Button';
import { Modal } from '@/components/organisms/Modal';
import { fieldFocus, fieldSurface } from '@/components/premium/fieldStyles';
import { useTransactionSigning } from '@/hooks/useTransactionSigning';
import { logger } from '@/lib/logger';
import { noTouchZoom } from '@/styles/mixins';

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

const InfoBox = styled.div`
  padding: 14px 16px;
  border-radius: 12px;
  margin-bottom: 20px;
  background-color: ${(p) => p.theme.colors.primarySurface};
`;

const InfoText = styled.p`
  margin: 0;
  font-size: 13px;
  color: ${(p) => p.theme.colors.text};
  line-height: 1.5;
`;

const TextArea = styled.textarea<{ $invalid?: boolean }>`
  ${fieldSurface}
  width: 100%;
  min-height: 200px;
  padding: 12px 14px;
  font-size: 13px;
  font-family: ${(p) => p.theme.fonts.mono};
  line-height: 1.5;

  resize: vertical;

  /* iOS Safari zooms the page on focus below 16px; touch only. */
  ${noTouchZoom}

  &:focus {
    ${fieldFocus}
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 20px;
`;
const FormError = styled.div`
  background-color: ${(props) => `${props.theme.colors.error}10`};
  border: 1px solid ${(props) => props.theme.colors.error};
  border-radius: 4px;
  color: ${(props) => props.theme.colors.error};
  font-size: 13px;
  line-height: 1.5;
  margin-top: 8px;
  padding: 12px;
`;
export interface ScriptModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ScriptModal: React.FC<ScriptModalProps> = ({ isOpen, onClose }) => {
  const [script, setScript] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { signSetScript } = useTransactionSigning();

  const handleSave = async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const signedTx = await signSetScript({ script: script || null });
      await ds.broadcast(signedTx);
      logger.debug('[ScriptModal] Set script transaction broadcast');
      onClose();
    } catch (error) {
      logger.error('Script setting failed:', error);
      const msg =
        error instanceof Error ? error.message : 'Failed to set script. Please try again.';
      setErrorMessage(msg);
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

        {errorMessage && <FormError>{errorMessage}</FormError>}

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

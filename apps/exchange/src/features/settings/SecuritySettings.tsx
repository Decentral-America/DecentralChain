/**
 * SecuritySettings Component
 *
 * Displays security-related settings including:
 * - Backup phrase (seed) with show/hide and copy
 * - Base58 encoded seed with show/hide and copy
 * - Private key with show/hide and copy
 * - Public key display
 * - Address display
 * - Export account action
 * - Change password action
 * - Delete account action
 * - Script management (advanced mode only)
 *
 * Matches Angular's settings.html Security tab exactly
 */

import { base58Decode, stringToBytes } from '@decentralchain/ts-lib-crypto';
import * as ds from 'data-service';
import type React from 'react';
import { useEffect, useState } from 'react';
import styled from 'styled-components';
import { useAuth } from '@/contexts/AuthContext';
import { useSettings } from '@/contexts/SettingsContext';
import { useClipboard } from '@/hooks/useClipboard';
import { logger } from '@/lib/logger';
import { ChangePasswordModal, DeleteAccountModal, ExportAccountModal, ScriptModal } from './modals';

// ==================== Styled Components ====================

const SecuritySection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px 0;
`;

const Row = styled.div<{ $border?: boolean }>`
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px 0;
  ${({ $border }) =>
    $border &&
    `
    border-bottom: 1px solid #e0e0e0;
  `}
`;

const FlexRow = styled.div<{ $border?: boolean }>`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  ${({ $border }) =>
    $border &&
    `
    border-bottom: 1px solid #e0e0e0;
  `}
`;

const Label = styled.div`
  font-size: 12px;
  color: #757575;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const Value = styled.div`
  font-size: 12px;
  color: #212121;
  word-break: break-all;
`;

const DataField = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Pre = styled.pre`
  font-size: 12px;
  font-family: 'Courier New', monospace;
  color: #212121;
  word-break: break-all;
  white-space: pre-wrap;
  margin: 0;
  padding: 8px;
  background-color: #f5f5f5;
  border-radius: 4px;
`;

const Button = styled.button`
  padding: 6px 16px;
  font-size: 12px;
  color: #2196f3;
  background: white;
  border: 1px solid #2196f3;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  align-self: flex-start;

  &:hover {
    background-color: #e3f2fd;
  }

  &:active {
    background-color: #bbdefb;
  }
`;

const LinkButton = styled.button`
  background: none;
  border: none;
  color: #2196f3;
  font-size: 12px;
  cursor: pointer;
  padding: 0;
  text-decoration: none;
  transition: color 0.2s;

  &:hover {
    color: #1976d2;
    text-decoration: underline;
  }
`;

const DangerLink = styled(LinkButton)`
  color: #f44336;

  &:hover {
    color: #d32f2f;
  }
`;

const CopyLink = styled.button`
  background: none;
  border: none;
  color: #2196f3;
  font-size: 11px;
  cursor: pointer;
  padding: 0;
  text-decoration: none;
  transition: color 0.2s;

  &:hover {
    text-decoration: underline;
  }
`;

const ScriptButton = styled(Button)`
  background-color: #4caf50;
  color: white;
  border: none;

  &:hover {
    background-color: #45a049;
  }

  &:active {
    background-color: #3d8b40;
  }
`;

// ==================== Component ====================

export const SecuritySettings: React.FC = () => {
  const { user } = useAuth();
  const { commonSettings } = useSettings();
  const { copyToClipboard } = useClipboard();

  // State for show/hide toggles
  const [shownSeed, setShownSeed] = useState(false);
  const [shownEncodedSeed, setShownEncodedSeed] = useState(false);
  const [shownKey, setShownKey] = useState(false);

  // State for secret data
  const [phrase, setPhrase] = useState<string | null>(null);
  const [encodedSeed, setEncodedSeed] = useState<string | null>(null);
  const [privateKey, setPrivateKey] = useState<string | null>(null);
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [hasScript, setHasScript] = useState<boolean>(false);

  // Track which field was copied
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Modal states
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isScriptModalOpen, setIsScriptModalOpen] = useState(false);

  // Load secret data on mount
  useEffect(() => {
    const loadSecretData = async () => {
      try {
        const api = ds.signature.getSignatureApi();

        // Helper to catch errors and return null
        const catchProcessor = async (method: () => Promise<unknown>) => {
          try {
            return await method().catch(() => null);
          } catch {
            return null;
          }
        };

        // Load all data in parallel
        const [seed, privKey, pubKey, encoded] = await Promise.all([
          catchProcessor(() => api.getSeed()),
          catchProcessor(() => api.getPrivateKey()),
          catchProcessor(() => api.getPublicKey()),
          catchProcessor(() => api.getEncodedSeed()),
        ]);

        // Validate encoded seed matches actual seed (Angular validation logic)
        let canSeed = !!(encoded && seed && typeof seed === 'string');
        if (canSeed) {
          try {
            const seedBytes = stringToBytes(seed as string).join(',');
            const encodedBytes = base58Decode(encoded as string).join(',');
            canSeed = seedBytes === encodedBytes;
          } catch (e) {
            logger.error('[SecuritySettings] Seed validation error:', e);
            canSeed = false;
          }
        }

        // Set state with type assertions
        setPhrase(canSeed ? (seed as string) : null);
        setEncodedSeed(encoded as string);
        setPrivateKey(privKey as string);
        setPublicKey((pubKey as string) || user?.publicKey || null);
        setAddress(user?.address || null);

        // Check if account has script (would come from user data)
        setHasScript(user?.hasScript || false);
      } catch (error) {
        logger.error('[SecuritySettings] Failed to load secret data:', error);
      }
    };

    loadSecretData();
  }, [user]);

  // Handle copy with field tracking
  const handleCopy = async (text: string, field: string) => {
    await copyToClipboard(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Modal handlers
  const showExportAccountModal = () => setIsExportModalOpen(true);
  const showPasswordModal = () => setIsPasswordModalOpen(true);
  const showDeleteAccountModal = () => setIsDeleteModalOpen(true);
  const showScriptModal = () => setIsScriptModalOpen(true);

  return (
    <SecuritySection>
      {/* Backup Phrase */}
      {phrase && (
        <Row>
          <Label>
            Backup Phrase
            <CopyLink onClick={() => handleCopy(phrase, 'phrase')}>
              {copiedField === 'phrase' ? 'Copied!' : 'Copy'}
            </CopyLink>
          </Label>
          <DataField>
            {!shownSeed && <Button onClick={() => setShownSeed(true)}>Show</Button>}
            {shownSeed && <Pre>{phrase}</Pre>}
          </DataField>
        </Row>
      )}

      {/* Base58 Encoded Seed */}
      {encodedSeed && (
        <Row>
          <Label>
            Base58 Seed
            <CopyLink onClick={() => handleCopy(encodedSeed, 'encodedSeed')}>
              {copiedField === 'encodedSeed' ? 'Copied!' : 'Copy'}
            </CopyLink>
          </Label>
          <DataField>
            {!shownEncodedSeed && <Button onClick={() => setShownEncodedSeed(true)}>Show</Button>}
            {shownEncodedSeed && <Pre>{encodedSeed}</Pre>}
          </DataField>
        </Row>
      )}

      {/* Private Key */}
      {privateKey && (
        <Row>
          <Label>
            Private Key
            <CopyLink onClick={() => handleCopy(privateKey, 'privateKey')}>
              {copiedField === 'privateKey' ? 'Copied!' : 'Copy'}
            </CopyLink>
          </Label>
          <DataField>
            {!shownKey && <Button onClick={() => setShownKey(true)}>Show</Button>}
            {shownKey && <Value>{privateKey}</Value>}
          </DataField>
        </Row>
      )}

      {/* Public Key */}
      <FlexRow>
        <Label>Public Key</Label>
        <Value>{publicKey || 'N/A'}</Value>
      </FlexRow>

      {/* Address */}
      <FlexRow>
        <Label>Address</Label>
        <Value>{address || 'N/A'}</Value>
      </FlexRow>

      {/* Export Account */}
      <FlexRow>
        <Label>Export Account</Label>
        <LinkButton onClick={showExportAccountModal}>Save Account as JSON</LinkButton>
      </FlexRow>

      {/* Change Password */}
      <FlexRow>
        <Label>Password</Label>
        <LinkButton onClick={showPasswordModal}>Change Password</LinkButton>
      </FlexRow>

      {/* Delete Account */}
      <FlexRow $border>
        <Label>Account</Label>
        <DangerLink onClick={showDeleteAccountModal}>Delete Account</DangerLink>
      </FlexRow>

      {/* Script Management (Advanced Mode only) */}
      {commonSettings.advancedMode && (
        <FlexRow $border>
          <Label>Smart Contract</Label>
          <ScriptButton onClick={showScriptModal}>
            {hasScript ? 'Update Script' : 'Set Script'}
          </ScriptButton>
        </FlexRow>
      )}

      {/* Modals */}
      <ExportAccountModal isOpen={isExportModalOpen} onClose={() => setIsExportModalOpen(false)} />
      <ChangePasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
      />
      <DeleteAccountModal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} />
      <ScriptModal isOpen={isScriptModalOpen} onClose={() => setIsScriptModalOpen(false)} />
    </SecuritySection>
  );
};

export default SecuritySettings;

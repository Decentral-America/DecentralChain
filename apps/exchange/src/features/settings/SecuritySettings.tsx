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
import { ChevronRight } from 'lucide-react';
import type React from 'react';
import { useEffect, useState } from 'react';
import styled from 'styled-components';
import { SettingsGroup, SettingsRow } from '@/components/premium/SettingsList';
import { useAuth } from '@/contexts/AuthContext';
import { useSettings } from '@/contexts/SettingsContext';
import { useClipboard } from '@/hooks/useClipboard';
import { logger } from '@/lib/logger';
import { noTapHighlight } from '@/styles/mixins';
import { ChangePasswordModal, DeleteAccountModal, ExportAccountModal, ScriptModal } from './modals';
import { Pane } from './Pane';
import { CopyButton, MonoValue, MonoWell, RowButton } from './SettingsControls';

const EASE = 'cubic-bezier(0.32, 0.72, 0, 1)';

const Stack = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
`;

const End = styled.div`
  display: flex;
  justify-content: flex-end;
`;

/*
 * A whole-row action drawn like the kit's button rows (label and description
 * on the left, the current value and a chevron on the right) but on the
 * group's own opaque surface rather than a transparent fill, so the ink can be
 * held to AA against the button's own background (see
 * SecuritySettings.contrast.test.tsx). It always follows another row in its
 * group, so it always draws the inset hairline above itself.
 */
const RowAction = styled.button`
  position: relative;
  display: flex;
  align-items: center;
  gap: 16px;
  width: 100%;
  min-height: 52px;
  padding: 10px 16px;
  box-sizing: border-box;
  border: 0;
  font: inherit;
  text-align: left;
  color: ${({ theme }) => theme.colors.text};
  background: ${({ theme }) => theme.colors.surface};
  cursor: pointer;
  transition: background-color 160ms ${EASE};

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 16px;
    right: 0;
    height: 1px;
    background: ${({ theme }) => theme.colors.border};
  }

  &:hover {
    background: ${({ theme }) => theme.colors.hover};
  }

  &:active {
    background: ${({ theme }) => theme.colors.surfaceHover};
  }

  &:focus-visible {
    outline: none;
    box-shadow: inset 0 0 0 2px ${({ theme }) => theme.colors.primary};
  }

  /* Own press state above, so the grey tap flash is redundant. */
  ${noTapHighlight}
`;

const RowText = styled.span`
  display: flex;
  flex: 1 1 200px;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
`;

const RowLabel = styled.span`
  font-size: 15px;
  line-height: 1.33;
  letter-spacing: -0.15px;
`;

const RowDescription = styled.span`
  font-size: 13px;
  line-height: 1.4;
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const RowValue = styled.span`
  flex-shrink: 0;
  font-size: 15px;
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const RowChevron = styled(ChevronRight)`
  flex-shrink: 0;
  color: ${({ theme }) => theme.colors.textSubtle};
`;

/**
 * A secret row: hidden until asked, copyable either way. Revealing expands the
 * row with the value in a monospace well beneath its label.
 */
function SecretRow({
  label,
  value,
  shown,
  onShow,
  copied,
  onCopy,
}: {
  label: string;
  value: string;
  shown: boolean;
  onShow: () => void;
  copied: boolean;
  onCopy: () => void;
}) {
  return (
    <SettingsRow
      label={label}
      stack={shown}
      control={
        shown ? (
          <Stack>
            <MonoWell>{value}</MonoWell>
            <End>
              <CopyButton copied={copied} onCopy={onCopy} what={label} />
            </End>
          </Stack>
        ) : (
          <>
            <CopyButton copied={copied} onCopy={onCopy} what={label} />
            <RowButton onClick={onShow} aria-label={`Show ${label}`}>
              Show
            </RowButton>
          </>
        )
      }
    />
  );
}

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

    void loadSecretData();
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

  const hasSecrets = Boolean(phrase || encodedSeed || privateKey);

  return (
    <Pane>
      {hasSecrets ? (
        <SettingsGroup
          title="Recovery"
          footer="Anyone who has these can move your funds. Reveal them only where no one can see your screen."
        >
          {phrase && (
            <SecretRow
              label="Backup phrase"
              value={phrase}
              shown={shownSeed}
              onShow={() => setShownSeed(true)}
              copied={copiedField === 'phrase'}
              onCopy={() => handleCopy(phrase, 'phrase')}
            />
          )}
          {encodedSeed && (
            <SecretRow
              label="Base58 seed"
              value={encodedSeed}
              shown={shownEncodedSeed}
              onShow={() => setShownEncodedSeed(true)}
              copied={copiedField === 'encodedSeed'}
              onCopy={() => handleCopy(encodedSeed, 'encodedSeed')}
            />
          )}
          {privateKey && (
            <SecretRow
              label="Private key"
              value={privateKey}
              shown={shownKey}
              onShow={() => setShownKey(true)}
              copied={copiedField === 'privateKey'}
              onCopy={() => handleCopy(privateKey, 'privateKey')}
            />
          )}
        </SettingsGroup>
      ) : null}

      <SettingsGroup title="Identity">
        <SettingsRow
          label="Public key"
          stack
          control={<MonoValue>{publicKey || 'N/A'}</MonoValue>}
        />
        <SettingsRow label="Address" stack control={<MonoValue>{address || 'N/A'}</MonoValue>} />
      </SettingsGroup>

      <SettingsGroup title="Account">
        <SettingsRow
          label="Export account"
          description="Save this account as an encrypted JSON file."
          onClick={showExportAccountModal}
        />
        <SettingsRow label="Change password" onClick={showPasswordModal} />
        {/* Script Management (Advanced Mode only) */}
        {commonSettings.advancedMode && (
          <RowAction type="button" onClick={showScriptModal}>
            <RowText>
              <RowLabel>Smart contract</RowLabel>
              <RowDescription>
                Attach a script that validates this account's transactions.
              </RowDescription>
            </RowText>
            <RowValue>{hasScript ? 'Update script' : 'Set script'}</RowValue>
            <RowChevron size={16} strokeWidth={2} aria-hidden />
          </RowAction>
        )}
      </SettingsGroup>

      <SettingsGroup footer="Removes this account from this device. Without its backup phrase it cannot be restored.">
        <SettingsRow label="Delete account" tone="danger" onClick={showDeleteAccountModal} />
      </SettingsGroup>

      {/* Modals */}
      <ExportAccountModal isOpen={isExportModalOpen} onClose={() => setIsExportModalOpen(false)} />
      <ChangePasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
      />
      <DeleteAccountModal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} />
      <ScriptModal isOpen={isScriptModalOpen} onClose={() => setIsScriptModalOpen(false)} />
    </Pane>
  );
};

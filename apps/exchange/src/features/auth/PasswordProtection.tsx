/**
 * PasswordProtection Component
 * Encrypts seed phrase with user password for secure local storage
 * Uses AES-256-GCM encryption via Web Crypto API (PBKDF2 600K iterations)
 */
import { useState } from 'react';
import styled from 'styled-components';
import { Button } from '@/components/atoms/Button';
import { Card } from '@/components/atoms/Card';
import { CommonIcons, Icon } from '@/components/atoms/Icon';
import { Input } from '@/components/atoms/Input';
import { Stack } from '@/components/atoms/Stack';
import { decryptString, encryptString } from '@/lib/crypto';
import { logger } from '@/lib/logger';

interface PasswordProtectionProps {
  seedPhrase: string;
  onEncrypted: (encrypted: string, password: string) => void;
  onSkip?: () => void;
}

const ProtectionWrapper = styled.div`
  width: 100%;
  max-width: 500px;
  margin: 0 auto;
`;

const Title = styled.h2`
  margin: 0 0 ${(p) => p.theme.spacing.md};
  font-size: ${(p) => p.theme.fontSizes.xl};
  font-weight: ${(p) => p.theme.fontWeights.semibold};
  color: ${(p) => p.theme.colors.text};
`;

const Description = styled.p`
  margin: 0 0 ${(p) => p.theme.spacing.lg};
  font-size: ${(p) => p.theme.fontSizes.md};
  color: ${(p) => p.theme.colors.secondary};
  line-height: 1.5;
`;

const InfoBox = styled.div`
  display: flex;
  align-items: flex-start;
  gap: ${(p) => p.theme.spacing.md};
  padding: ${(p) => p.theme.spacing.md};
  border-left: 4px solid ${(p) => p.theme.colors.info};
  background-color: ${(p) => `${p.theme.colors.info}10`};
  border-radius: ${(p) => p.theme.radii.md};
  margin-bottom: ${(p) => p.theme.spacing.lg};
`;

const InfoText = styled.div`
  flex: 1;
  font-size: ${(p) => p.theme.fontSizes.sm};
  color: ${(p) => p.theme.colors.text};
  line-height: 1.6;
`;

const ErrorMessage = styled.div`
  padding: ${(p) => p.theme.spacing.sm} ${(p) => p.theme.spacing.md};
  background-color: ${(p) => `${p.theme.colors.error}10`};
  border: 1px solid ${(p) => p.theme.colors.error};
  border-radius: ${(p) => p.theme.radii.sm};
  color: ${(p) => p.theme.colors.error};
  font-size: ${(p) => p.theme.fontSizes.sm};
  display: flex;
  align-items: center;
  gap: ${(p) => p.theme.spacing.sm};
  margin-bottom: ${(p) => p.theme.spacing.md};
`;

const PasswordStrengthIndicator = styled.div<{ $strength: number }>`
  height: 4px;
  width: 100%;
  background-color: ${(p) => p.theme.colors.border};
  border-radius: ${(p) => p.theme.radii.full};
  margin-top: ${(p) => p.theme.spacing.xs};
  overflow: hidden;

  &::after {
    content: '';
    display: block;
    height: 100%;
    width: ${(p) => p.$strength}%;
    background-color: ${(p) => {
      if (p.$strength < 33) return p.theme.colors.error;
      if (p.$strength < 66) return p.theme.colors.warning;
      return p.theme.colors.success;
    }};
    transition:
      width 0.3s ease,
      background-color 0.3s ease;
  }
`;

const PasswordStrengthText = styled.p<{ $strength: number }>`
  margin: ${(p) => p.theme.spacing.xs} 0 0;
  font-size: ${(p) => p.theme.fontSizes.xs};
  color: ${(p) => {
    if (p.$strength < 33) return p.theme.colors.error;
    if (p.$strength < 66) return p.theme.colors.warning;
    return p.theme.colors.success;
  }};
  font-weight: ${(p) => p.theme.fontWeights.medium};
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: ${(p) => p.theme.spacing.md};
  margin-top: ${(p) => p.theme.spacing.lg};
`;

const RequirementsList = styled.ul`
  margin: ${(p) => p.theme.spacing.md} 0 0;
  padding-left: ${(p) => p.theme.spacing.lg};
  list-style: none;
`;

const RequirementItem = styled.li<{ $met: boolean }>`
  margin-bottom: ${(p) => p.theme.spacing.xs};
  font-size: ${(p) => p.theme.fontSizes.sm};
  color: ${(p) => (p.$met ? p.theme.colors.success : p.theme.colors.secondary)};
  display: flex;
  align-items: center;
  gap: ${(p) => p.theme.spacing.xs};

  &::before {
    content: ${(p) => (p.$met ? '"✓"' : '"○"')};
    font-weight: ${(p) => p.theme.fontWeights.bold};
  }
`;

/**
 * Calculate password strength (0-100)
 */
const calculatePasswordStrength = (password: string): number => {
  let strength = 0;

  // Length check
  if (password.length >= 8) strength += 25;
  if (password.length >= 12) strength += 15;
  if (password.length >= 16) strength += 10;

  // Character variety checks
  if (/[a-z]/.test(password)) strength += 15;
  if (/[A-Z]/.test(password)) strength += 15;
  if (/[0-9]/.test(password)) strength += 15;
  if (/[^a-zA-Z0-9]/.test(password)) strength += 15;

  return Math.min(strength, 100);
};

/**
 * Get password strength label
 */
const getStrengthLabel = (strength: number): string => {
  if (strength === 0) return 'Enter password';
  if (strength < 33) return 'Weak password';
  if (strength < 66) return 'Medium password';
  if (strength < 90) return 'Strong password';
  return 'Very strong password';
};

export const PasswordProtection = ({
  seedPhrase,
  onEncrypted,
  onSkip,
}: PasswordProtectionProps) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const passwordStrength = calculatePasswordStrength(password);
  const strengthLabel = getStrengthLabel(passwordStrength);

  // Password requirements
  const requirements = {
    length: password.length >= 12,
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^a-zA-Z0-9]/.test(password),
    uppercase: /[A-Z]/.test(password),
  };

  const handleEncrypt = async () => {
    setError('');

    // Validation
    if (password.length < 12) {
      setError('Password must be at least 12 characters long');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (passwordStrength < 33) {
      setError('Password is too weak. Please use a stronger password');
      return;
    }

    setIsLoading(true);

    try {
      // Encrypt seed phrase with AES-256-GCM (Web Crypto API)
      const encrypted = await encryptString(seedPhrase, password);

      // Verify encryption by attempting to decrypt
      const decrypted = await decryptString(encrypted, password);

      if (decrypted !== seedPhrase) {
        throw new Error('Encryption verification failed');
      }

      onEncrypted(encrypted, password);
    } catch (err) {
      logger.error('Encryption error:', err);
      setError('Failed to encrypt seed phrase. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    setError(''); // Clear error when user types
  };

  const handleConfirmChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConfirmPassword(e.target.value);
    setError(''); // Clear error when user types
  };

  return (
    <ProtectionWrapper>
      <Card elevation="md">
        <Stack gap="24px">
          <div>
            <Title>Password Protection</Title>
            <Description>
              Add an extra layer of security by encrypting your seed phrase with a password. This
              password will be required to access your wallet.
            </Description>
          </div>

          <InfoBox>
            <Icon name={CommonIcons.Info} size={24} color="info" />
            <InfoText>
              <strong>Important:</strong> If you forget this password, you won&apos;t be able to
              access your wallet. Make sure to store it securely or use a password manager.
            </InfoText>
          </InfoBox>

          {error && (
            <ErrorMessage>
              <Icon name={CommonIcons.Error} size={16} />
              {error}
            </ErrorMessage>
          )}

          <div>
            <Input
              type="password"
              label="Password"
              value={password}
              onChange={handlePasswordChange}
              placeholder="Enter a strong password"
              autoFocus
            />
            <PasswordStrengthIndicator $strength={passwordStrength} />
            <PasswordStrengthText $strength={passwordStrength}>
              {strengthLabel}
            </PasswordStrengthText>

            <RequirementsList>
              <RequirementItem $met={requirements.length}>At least 8 characters</RequirementItem>
              <RequirementItem $met={requirements.uppercase}>
                At least one uppercase letter
              </RequirementItem>
              <RequirementItem $met={requirements.lowercase}>
                At least one lowercase letter
              </RequirementItem>
              <RequirementItem $met={requirements.number}>At least one number</RequirementItem>
              <RequirementItem $met={requirements.special}>
                At least one special character
              </RequirementItem>
            </RequirementsList>
          </div>

          <Input
            type="password"
            label="Confirm Password"
            value={confirmPassword}
            onChange={handleConfirmChange}
            placeholder="Re-enter your password"
          />

          <ButtonGroup>
            <Button
              onClick={handleEncrypt}
              variant="primary"
              isLoading={isLoading}
              disabled={!password || !confirmPassword || passwordStrength < 33}
            >
              Encrypt & Continue
            </Button>
            {onSkip && (
              <Button onClick={onSkip} variant="text" disabled={isLoading}>
                Skip for Now
              </Button>
            )}
          </ButtonGroup>
        </Stack>
      </Card>
    </ProtectionWrapper>
  );
};

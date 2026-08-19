/**
 * Info Settings Component
 * Displays app information, version, support link, and legal links
 */
import type React from 'react';
import styled from 'styled-components';
import { NetworkConfig as networkConfig } from '@/config/networkConfig';

const InfoSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0;
  padding: 16px 0;
`;

const InfoRow = styled.div<{ $border?: boolean }>`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 0;
  border-bottom: 1px solid ${(props) => props.theme.colors.border};

  ${(props) =>
    props.$border &&
    `
    border-bottom: 2px solid ${props.theme.colors.border};
  `}
`;

const Label = styled.div`
  font-size: 12px;
  color: ${(props) => props.theme.colors.textMuted};
  font-weight: 500;
`;

const Value = styled.div`
  font-size: 13px;
  color: ${(props) => props.theme.colors.text};
`;

const Link = styled.a`
  font-size: 13px;
  color: ${(props) => props.theme.colors.primary};
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
`;

const LegalLinks = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: ${(props) => props.theme.colors.textMuted};
`;

const Copyright = styled.div`
  font-size: 12px;
  color: ${(props) => props.theme.colors.textMuted};
`;

const Logo = styled.div`
  font-size: 16px;
  font-weight: bold;
  color: ${(props) => props.theme.colors.primary};
`;

export const InfoSettings: React.FC = () => {
  // Injected at build time by Vite (see vite.config.ts define block)
  const appVersion = import.meta.env.VITE_APP_VERSION ?? '0.0.0';
  const appName = 'Decentral Exchange';

  // Get support link from mainnet.json
  const supportLink = networkConfig.support || 'https://support.decentralchain.io';
  const supportLinkName = supportLink.replace(/^https?:\/\//, '').replace(/\/$/, '');

  // Legal links — sourced from mainnet.json via networkConfig
  const termsLink =
    networkConfig.termsAndConditions || 'https://decentralchain.io/terms-and-conditions';
  const privacyLink = networkConfig.privacyPolicy || 'https://decentralchain.io/privacy-policy';

  return (
    <InfoSection>
      {/* Version */}
      <InfoRow>
        <Label>Version</Label>
        <Value>
          {appName} {appVersion}
        </Value>
      </InfoRow>

      {/* Support Link */}
      <InfoRow>
        <Label>Support</Label>
        <Link href={supportLink} target="_blank" rel="noopener noreferrer">
          {supportLinkName}
        </Link>
      </InfoRow>

      {/* Legal Links */}
      <InfoRow>
        <Label>Legal</Label>
        <LegalLinks>
          <Link href={termsLink} target="_blank" rel="noopener noreferrer">
            Terms & Conditions
          </Link>
          {' | '}
          <Link href={privacyLink} target="_blank" rel="noopener noreferrer">
            Privacy Policy
          </Link>
        </LegalLinks>
      </InfoRow>

      {/* Copyright */}
      <InfoRow $border>
        <Copyright>&copy; {new Date().getFullYear()} Blockchain Costa Rica</Copyright>
        <Logo>DecentralChain</Logo>
      </InfoRow>
    </InfoSection>
  );
};

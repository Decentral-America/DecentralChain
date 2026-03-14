/**
 * Info Settings Component
 * Displays app information, version, support link, and legal links
 */
import React from 'react';
import styled from 'styled-components';
import networkConfig from '@/config/networkConfig';

const InfoSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0;
  padding: 16px 0;
`;

const InfoRow = styled.div<{ border?: boolean }>`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 0;
  border-bottom: 1px solid #f0f0f0;

  ${(props) =>
    props.border &&
    `
    border-bottom: 2px solid #e0e0e0;
  `}
`;

const Label = styled.div`
  font-size: 12px;
  color: #757575;
  font-weight: 500;
`;

const Value = styled.div`
  font-size: 13px;
  color: #212121;
`;

const Link = styled.a`
  font-size: 13px;
  color: #2196f3;
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
  color: #757575;
`;

const Copyright = styled.div`
  font-size: 12px;
  color: #757575;
`;

const Logo = styled.div`
  font-size: 16px;
  font-weight: bold;
  color: #5a81ea;
`;

export const InfoSettings: React.FC = () => {
  // Get version from package.json
  const appVersion = '1.0.0'; // TODO: Import from package.json
  const appName = 'Decentral Exchange';

  // Get support link from mainnet.json
  const supportLink = networkConfig.support || 'https://support.decentralchain.io';
  const supportLinkName = supportLink.replace(/^https?:\/\//, '').replace(/\/$/, '');

  // Legal links
  const termsLink = 'https://decentralchain.io/terms';
  const privacyLink = 'https://decentralchain.io/privacy';

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
      <InfoRow border>
        <Copyright>&copy; 2021 Blockchain Costa Rica</Copyright>
        <Logo>DecentralChain</Logo>
      </InfoRow>
    </InfoSection>
  );
};

export default InfoSettings;

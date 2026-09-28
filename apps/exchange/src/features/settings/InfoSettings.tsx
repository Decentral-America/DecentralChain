/**
 * Info Settings Component
 * Displays app information, version, support link, and legal links
 */
import type React from 'react';
import styled from 'styled-components';
import { SettingsGroup, SettingsRow } from '@/components/premium/SettingsList';
import { NetworkConfig as networkConfig } from '@/config/networkConfig';
import { Pane } from './Pane';

const Link = styled.a`
  font-size: 15px;
  color: ${(p) => p.theme.colors.primary};
  text-decoration: none;
  text-underline-offset: 3px;

  &:hover {
    text-decoration: underline;
  }

  &:focus-visible {
    outline: none;
    border-radius: 4px;
    box-shadow: 0 0 0 2px ${(p) => p.theme.colors.primary};
  }
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
    <Pane>
      <SettingsGroup
        footer={`© ${new Date().getFullYear()} Blockchain Costa Rica · DecentralChain`}
      >
        <SettingsRow label="Version" control={`${appName} ${appVersion}`} />
        <SettingsRow
          label="Support"
          control={
            <Link href={supportLink} target="_blank" rel="noopener noreferrer">
              {supportLinkName}
            </Link>
          }
        />
        <SettingsRow
          label="Terms & Conditions"
          control={
            <Link
              href={termsLink}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Read the Terms & Conditions"
            >
              Read
            </Link>
          }
        />
        <SettingsRow
          label="Privacy Policy"
          control={
            <Link
              href={privacyLink}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Read the Privacy Policy"
            >
              Read
            </Link>
          }
        />
      </SettingsGroup>
    </Pane>
  );
};

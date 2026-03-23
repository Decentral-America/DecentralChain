/**
 * GeneralSettings Component
 * Matches Angular: settings.html General tab
 *
 * Features:
 * - Advanced Mode toggle
 * - Language selector
 * - Session Timeout dropdown (5/10/20/40/60 min)
 * - Theme selector (Light/Dark)
 * - Current Block Height display (polls every 5s)
 */

import * as ds from 'data-service';
import { useEffect, useState } from 'react';
import styled from 'styled-components';
import { useSettings } from '@/contexts/SettingsContext';
import { logger } from '@/lib/logger';

// ========== Styled Components ==========

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${(p) => p.theme.spacing.lg};
`;

const SettingRow = styled.div<{ $border?: boolean }>`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: ${(p) => p.theme.spacing.md} 0;
  border-bottom: ${(p) => (p.$border ? `1px solid ${p.theme.colors.border}` : 'none')};
  gap: ${(p) => p.theme.spacing.md};

  &:last-child {
    border-bottom: none;
  }
`;

const SettingLabel = styled.div`
  font-size: ${(p) => p.theme.fontSizes.sm};
  color: ${(p) => p.theme.colors.text};
  opacity: 0.7;
  flex-shrink: 0;
`;

const SettingValue = styled.div`
  font-size: ${(p) => p.theme.fontSizes.md};
  color: ${(p) => p.theme.colors.text};
  font-weight: ${(p) => p.theme.fontWeights.semibold};
`;

const CheckboxRow = styled.label`
  display: flex;
  align-items: center;
  gap: ${(p) => p.theme.spacing.sm};
  cursor: pointer;
  padding: ${(p) => p.theme.spacing.md} 0;
`;

const CheckboxInput = styled.input`
  width: 20px;
  height: 20px;
  cursor: pointer;
  accent-color: ${(p) => p.theme.colors.primary};
`;

const CheckboxLabel = styled.span`
  font-size: ${(p) => p.theme.fontSizes.sm};
  color: ${(p) => p.theme.colors.text};
`;

const Select = styled.select`
  padding: ${(p) => p.theme.spacing.sm} ${(p) => p.theme.spacing.md};
  border: 1px solid ${(p) => p.theme.colors.border};
  border-radius: ${(p) => p.theme.radii.sm};
  background: ${(p) => p.theme.colors.background};
  color: ${(p) => p.theme.colors.text};
  font-size: ${(p) => p.theme.fontSizes.sm};
  cursor: pointer;
  min-width: 150px;

  &:hover {
    border-color: ${(p) => p.theme.colors.primary};
  }

  &:focus {
    outline: none;
    border-color: ${(p) => p.theme.colors.primary};
    box-shadow: 0 0 0 2px ${(p) => p.theme.colors.primary}20;
  }
`;

// ========== Language Configuration ==========

const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Español' },
  { code: 'de', name: 'Deutsch' },
  { code: 'fr', name: 'Français' },
  { code: 'it', name: 'Italiano' },
  { code: 'ru', name: 'Русский' },
  { code: 'zh_CN', name: '中文' },
  { code: 'ja', name: '日本語' },
  { code: 'ko', name: '한국어' },
  { code: 'pt_BR', name: 'Português (BR)' },
  { code: 'pt_PT', name: 'Português (PT)' },
  { code: 'nl_NL', name: 'Nederlands' },
  { code: 'pl', name: 'Polski' },
  { code: 'tr', name: 'Türkçe' },
  { code: 'hi_IN', name: 'हिन्दी' },
  { code: 'id', name: 'Bahasa Indonesia' },
  { code: 'et_EE', name: 'Eesti' },
];

// ========== Component ==========

export const GeneralSettings = () => {
  const { commonSettings, setCommonSetting } = useSettings();
  const [blockHeight, setBlockHeight] = useState<number>(0);

  /**
   * Poll block height every 5 seconds
   * Matches Angular: createPoll in SettingsCtrl
   */
  useEffect(() => {
    const pollBlockHeight = async () => {
      try {
        const height = await ds.api.node.height();
        setBlockHeight(height);
      } catch (error) {
        logger.error('[GeneralSettings] Failed to fetch block height:', error);
      }
    };

    // Initial fetch
    void pollBlockHeight();

    // Poll every 5 seconds
    const interval = setInterval(pollBlockHeight, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <Container>
      {/* Advanced Mode Toggle */}
      <CheckboxRow>
        <CheckboxInput
          type="checkbox"
          id="advancedMode"
          checked={commonSettings.advancedMode}
          onChange={(e) => setCommonSetting('advancedMode', e.target.checked)}
        />
        <CheckboxLabel>Enable advanced features</CheckboxLabel>
      </CheckboxRow>

      {/* Language Selector */}
      <SettingRow>
        <SettingLabel>Language</SettingLabel>
        <Select
          value={commonSettings.lng}
          onChange={(e) => {
            setCommonSetting('lng', e.target.value);
            // Note: i18n integration would go here
            logger.debug('[GeneralSettings] Language changed to:', e.target.value);
          }}
        >
          {LANGUAGES.map((lang) => (
            <option key={lang.code} value={lang.code}>
              {lang.name}
            </option>
          ))}
        </Select>
      </SettingRow>

      {/* Session Timeout */}
      <SettingRow>
        <SettingLabel>Session Timeout</SettingLabel>
        <Select
          value={commonSettings.logoutAfterMin}
          onChange={(e) => setCommonSetting('logoutAfterMin', Number(e.target.value))}
        >
          <option value={5}>5 minutes</option>
          <option value={10}>10 minutes</option>
          <option value={20}>20 minutes</option>
          <option value={40}>40 minutes</option>
          <option value={60}>1 hour</option>
        </Select>
      </SettingRow>

      {/* Theme Selector */}
      <SettingRow>
        <SettingLabel>Theme</SettingLabel>
        <Select
          value={commonSettings.theme}
          onChange={(e) => setCommonSetting('theme', e.target.value as 'default' | 'black')}
        >
          <option value="default">● Light</option>
          <option value="black">● Dark</option>
        </Select>
      </SettingRow>

      {/* Current Block Height (read-only) */}
      <SettingRow $border>
        <SettingLabel>Current Block Height</SettingLabel>
        <SettingValue>{blockHeight > 0 ? blockHeight.toLocaleString() : 'Loading...'}</SettingValue>
      </SettingRow>
    </Container>
  );
};

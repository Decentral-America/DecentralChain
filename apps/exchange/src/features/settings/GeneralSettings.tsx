/**
 * GeneralSettings Component
 * Matches Angular: settings.html General tab
 *
 * Features:
 * - Advanced Mode toggle
 * - Language selector
 * - Session Timeout dropdown (5/10/20/40/60 min)
 * - Current Block Height display (polls every 5s)
 *
 * No theme control here by design: `ThemeSettings` (Settings → Theme tab)
 * is the one real theme control, wired to `ThemeContext`. A second,
 * independent "Theme" dropdown used to live here, bound to the inert
 * `commonSettings.theme` field — see fix round 1 of task-9-report.md.
 */

import { Skeleton, Switch } from '@mui/material';
import * as ds from 'data-service';
import { useEffect, useState } from 'react';
import { Select } from '@/components/atoms/Select';
import { AnimatedNumber } from '@/components/premium/AnimatedNumber';
import { SettingsGroup, SettingsRow } from '@/components/premium/SettingsList';
import { useSettings } from '@/contexts/SettingsContext';
import { logger } from '@/lib/logger';
import { Pane } from './Pane';

const TIMEOUTS = [
  { label: '5 minutes', value: '5' },
  { label: '10 minutes', value: '10' },
  { label: '20 minutes', value: '20' },
  { label: '40 minutes', value: '40' },
  { label: '1 hour', value: '60' },
];

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
    <Pane>
      <SettingsGroup
        title="Preferences"
        footer="Advanced features add data transactions, mass transfers and account scripts to the wallet."
      >
        <SettingsRow
          label="Advanced features"
          htmlFor="advancedMode"
          control={
            <Switch
              id="advancedMode"
              checked={commonSettings.advancedMode}
              onChange={(e) => setCommonSetting('advancedMode', e.target.checked)}
            />
          }
        />
        <SettingsRow
          label="Language"
          htmlFor="settings-language"
          control={
            <Select
              id="settings-language"
              selectSize="small"
              value={commonSettings.lng}
              options={LANGUAGES.map((lang) => ({ label: lang.name, value: lang.code }))}
              onChange={(e) => {
                setCommonSetting('lng', e.target.value);
                // Note: i18n integration would go here
                logger.debug('[GeneralSettings] Language changed to:', e.target.value);
              }}
            />
          }
        />
        <SettingsRow
          label="Session timeout"
          htmlFor="settings-timeout"
          control={
            <Select
              id="settings-timeout"
              selectSize="small"
              value={String(commonSettings.logoutAfterMin)}
              options={TIMEOUTS}
              onChange={(e) => setCommonSetting('logoutAfterMin', Number(e.target.value))}
            />
          }
        />
      </SettingsGroup>

      <SettingsGroup title="Network">
        <SettingsRow
          label="Current block height"
          description="Read from the node every five seconds."
          control={
            blockHeight > 0 ? (
              <AnimatedNumber value={blockHeight} decimals={0} />
            ) : (
              <Skeleton
                variant="rounded"
                width={88}
                height={16}
                aria-label="Loading block height"
              />
            )
          }
        />
      </SettingsGroup>
    </Pane>
  );
};

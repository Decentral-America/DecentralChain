/**
 * Settings Page
 *
 * Seven sections (General, Security, Backup, Network, Language, Theme, Info),
 * switched by the system's segmented control and laid out like macOS System
 * Settings: grouped inset lists on the page ground, each row a label on the
 * left and its control on the right. There is no card around the grouped
 * panes; the groups are the surfaces. Backup, which is not a grouped list,
 * keeps a card of its own, and Language and Theme bring theirs.
 */
import type React from 'react';
import { useMemo } from 'react';
import styled from 'styled-components';
import { Card } from '@/components/atoms/Card';
import { type Tab, Tabs } from '@/components/atoms/Tabs';
import { PageFrame } from '@/layouts/PageFrame';
import { BackupSettings } from './BackupSettings';
import { GeneralSettings } from './GeneralSettings';
import { InfoSettings } from './InfoSettings';
import { LanguageSettings } from './LanguageSettings';
import { NetworkSettings } from './NetworkSettings';
import { SecuritySettings } from './SecuritySettings';
import { ThemeSettings } from './ThemeSettings';

/* A readable settings column, the width System Settings gives its panes. */
const Column = styled.div`
  max-width: 720px;
`;

/**
 * Settings Page Component
 * Extends Angular's 4-tab structure with Backup, Language, and Theme tabs:
 * General, Security, Backup, Network, Language, Theme, Info
 *
 * @example
 * ```tsx
 * <SettingsPage />
 * ```
 */
export const SettingsPage: React.FC = () => {
  // Memoized: tab content is static — no state/props deps.
  // Prevents a new array + 7 JSX subtrees from being allocated on every render,
  // which would cause Tabs to receive a new `tabs` reference each time.
  const settingsTabs = useMemo<Tab[]>(
    () => [
      { content: <GeneralSettings />, id: 'general', label: 'General' },
      { content: <SecuritySettings />, id: 'security', label: 'Security' },
      {
        content: (
          <Card elevation="md">
            <BackupSettings />
          </Card>
        ),
        id: 'backup',
        label: 'Backup',
      },
      { content: <NetworkSettings />, id: 'network', label: 'Network' },
      { content: <LanguageSettings />, id: 'language', label: 'Language' },
      { content: <ThemeSettings />, id: 'theme', label: 'Theme' },
      { content: <InfoSettings />, id: 'info', label: 'Info' },
    ],
    [],
  );

  return (
    <PageFrame
      title="Settings"
      subtitle="Manage your application settings, network configuration, and preferences"
    >
      <Column>
        <Tabs tabs={settingsTabs} defaultActiveTab="general" label="Settings sections" />
      </Column>
    </PageFrame>
  );
};

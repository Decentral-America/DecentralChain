/**
 * Settings Page
 * Main settings interface with tabbed navigation matching Angular's structure
 * General, Security, Backup, Network, Language, Theme, and Info tabs
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

/**
 * Styled Components
 */
const PageContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
`;

const TabContent = styled(Card as React.ComponentType<Record<string, unknown>>)`
  min-height: 400px;
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
      {
        content: (
          <TabContent elevation="md">
            <GeneralSettings />
          </TabContent>
        ),
        id: 'general',
        label: 'General',
      },
      {
        content: (
          <TabContent elevation="md">
            <SecuritySettings />
          </TabContent>
        ),
        id: 'security',
        label: 'Security',
      },
      {
        content: (
          <TabContent elevation="md">
            <BackupSettings />
          </TabContent>
        ),
        id: 'backup',
        label: 'Backup',
      },
      {
        content: (
          <TabContent elevation="md">
            <NetworkSettings />
          </TabContent>
        ),
        id: 'network',
        label: 'Network',
      },
      {
        content: (
          <TabContent elevation="md">
            <LanguageSettings />
          </TabContent>
        ),
        id: 'language',
        label: 'Language',
      },
      {
        content: (
          <TabContent elevation="md">
            <ThemeSettings />
          </TabContent>
        ),
        id: 'theme',
        label: 'Theme',
      },
      {
        content: (
          <TabContent elevation="md">
            <InfoSettings />
          </TabContent>
        ),
        id: 'info',
        label: 'Info',
      },
    ],
    [],
  );

  return (
    <PageFrame
      title="Settings"
      subtitle="Manage your application settings, network configuration, and preferences"
    >
      <PageContainer>
        <Tabs tabs={settingsTabs} defaultActiveTab="general" variant="underline" />
      </PageContainer>
    </PageFrame>
  );
};

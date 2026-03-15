/**
 * Settings Page
 * Main settings interface with tabbed navigation matching Angular's structure
 * General, Security, Network, and Info tabs
 */
import type React from 'react';
import styled from 'styled-components';
import { Card } from '@/components/atoms/Card';
import { type Tab, Tabs } from '@/components/atoms/Tabs';
import { GeneralSettings } from './GeneralSettings';
import { InfoSettings } from './InfoSettings';
import { NetworkSettings } from './NetworkSettings';
import { SecuritySettings } from './SecuritySettings';

/**
 * Styled Components
 */
const PageContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: ${({ theme }) => theme.spacing.xl};
`;

const PageHeader = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing.xl};
`;

const PageTitle = styled.h1`
  margin: 0 0 ${({ theme }) => theme.spacing.sm};
  font-size: 32px;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.text};
`;

const PageDescription = styled.p`
  margin: 0;
  font-size: 16px;
  color: ${({ theme }) => theme.colors.disabled};
  line-height: 1.6;
`;

const TabContent = styled(Card as React.ComponentType<Record<string, unknown>>)`
  min-height: 400px;
`;

/**
 * Settings Page Component
 * Matches Angular's 4-tab structure: General, Security, Network, Info
 *
 * @example
 * ```tsx
 * <SettingsPage />
 * ```
 */
export const SettingsPage: React.FC = () => {
  const settingsTabs: Tab[] = [
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
          <NetworkSettings />
        </TabContent>
      ),
      id: 'network',
      label: 'Network',
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
  ];

  return (
    <PageContainer>
      <PageHeader>
        <PageTitle>Settings</PageTitle>
        <PageDescription>
          Manage your application settings, network configuration, and preferences
        </PageDescription>
      </PageHeader>

      <Tabs tabs={settingsTabs} defaultActiveTab="general" variant="underline" />
    </PageContainer>
  );
};

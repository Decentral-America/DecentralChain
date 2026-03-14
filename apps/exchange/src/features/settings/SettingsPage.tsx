/**
 * Settings Page
 * Main settings interface with tabbed navigation matching Angular's structure
 * General, Security, Network, and Info tabs
 */
import React from 'react';
import styled from 'styled-components';
import { Tabs, Tab } from '@/components/atoms/Tabs';
import { Card } from '@/components/atoms/Card';
import { GeneralSettings } from './GeneralSettings';
import { SecuritySettings } from './SecuritySettings';
import { NetworkSettings } from './NetworkSettings';
import { InfoSettings } from './InfoSettings';

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

const TabContent = styled(Card)`
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
      id: 'general',
      label: 'General',
      content: (
        <TabContent elevation="md">
          <GeneralSettings />
        </TabContent>
      ),
    },
    {
      id: 'security',
      label: 'Security',
      content: (
        <TabContent elevation="md">
          <SecuritySettings />
        </TabContent>
      ),
    },
    {
      id: 'network',
      label: 'Network',
      content: (
        <TabContent elevation="md">
          <NetworkSettings />
        </TabContent>
      ),
    },
    {
      id: 'info',
      label: 'Info',
      content: (
        <TabContent elevation="md">
          <InfoSettings />
        </TabContent>
      ),
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

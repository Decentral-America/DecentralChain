/**
 * Tabs Component
 * Tabbed interface for organizing content into sections
 * Provides accessible keyboard navigation and active state styling
 * Migrated to Material-UI Tabs
 */
import React, { useState } from 'react';
import MuiTabs from '@mui/material/Tabs';
import MuiTab from '@mui/material/Tab';
import Box from '@mui/material/Box';
import { styled } from '@mui/material/styles';

export interface Tab {
  id: string;
  label: string;
  content: React.ReactNode;
  disabled?: boolean;
}

export interface TabsProps {
  tabs: Tab[];
  defaultActiveTab?: string;
  onChange?: (tabId: string) => void;
  variant?: 'default' | 'pills' | 'underline';
}

const StyledTabs = styled(MuiTabs, {
  shouldForwardProp: (prop) => prop !== 'tabVariant',
})<{ tabVariant?: string }>(({ theme, tabVariant }) => ({
  borderBottom: tabVariant === 'underline' ? `2px solid ${theme.palette.divider}` : 'none',
  backgroundColor: tabVariant === 'default' ? theme.palette.background.paper : 'transparent',
  borderRadius: tabVariant === 'default' ? theme.shape.borderRadius : 0,
  padding: tabVariant === 'default' ? theme.spacing(0.5) : 0,
  marginBottom: theme.spacing(3),
  minHeight: tabVariant === 'pills' ? 40 : 48,
}));

const StyledTab = styled(MuiTab, {
  shouldForwardProp: (prop) => prop !== 'tabVariant',
})<{ tabVariant?: string }>(({ theme, tabVariant }) => ({
  padding: tabVariant === 'pills' ? '10px 20px' : '12px 16px',
  minHeight: tabVariant === 'pills' ? 40 : 48,
  borderRadius:
    tabVariant === 'pills'
      ? theme.shape.borderRadius * 4
      : tabVariant === 'default'
        ? theme.shape.borderRadius
        : 0,
  fontSize: '0.875rem',
  fontWeight: 500,
  textTransform: 'none',
  '&.Mui-selected': {
    fontWeight: 600,
    backgroundColor: tabVariant === 'pills' ? theme.palette.primary.main : 'transparent',
    color: tabVariant === 'pills' ? 'white' : theme.palette.primary.main,
  },
}));

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = ({ children, value, index }: TabPanelProps) => {
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box>{children}</Box>}
    </div>
  );
};

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  defaultActiveTab,
  onChange,
  variant = 'default',
}) => {
  const defaultIndex = defaultActiveTab ? tabs.findIndex((tab) => tab.id === defaultActiveTab) : 0;
  const [activeTab, setActiveTab] = useState(defaultIndex >= 0 ? defaultIndex : 0);

  const handleChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
    if (onChange && tabs[newValue]) {
      onChange(tabs[newValue].id);
    }
  };

  return (
    <div>
      <StyledTabs value={activeTab} onChange={handleChange} variant="standard">
        {tabs.map((tab) => (
          <StyledTab key={tab.id} label={tab.label} disabled={tab.disabled} tabVariant={variant} />
        ))}
      </StyledTabs>
      {tabs.map((tab, index) => (
        <TabPanel key={tab.id} value={activeTab} index={index}>
          {tab.content}
        </TabPanel>
      ))}
    </div>
  );
};

Tabs.displayName = 'Tabs';

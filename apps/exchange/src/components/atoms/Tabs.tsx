/**
 * Tabs Component
 *
 * Section switching drawn as the system's segmented control: a grey track with
 * a raised pill that springs to the chosen section, the same control used for
 * timeframes and buy/sell. The underline and pill variants of the old tab bar
 * are accepted for compatibility and all render this one look.
 */
import type React from 'react';
import { useId, useState } from 'react';
import styled from 'styled-components';
import { SegmentedControl } from '@/components/premium/SegmentedControl';

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
  /** Kept for existing call sites; every variant renders the segmented track. */
  variant?: 'default' | 'pills' | 'underline';
  /** Accessible name for the section switcher. */
  label?: string;
}

const Bar = styled.div`
  display: flex;
  margin-bottom: 24px;
  max-width: 100%;
  overflow-x: auto;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }
`;

const Panel = styled.div`
  &:focus-visible {
    outline: none;
  }
`;

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  defaultActiveTab,
  onChange,
  label = 'Sections',
}) => {
  const initial = tabs.find((tab) => tab.id === defaultActiveTab)?.id ?? tabs[0]?.id ?? '';
  const [active, setActive] = useState(initial);
  const panelId = useId();

  const select = (id: string) => {
    setActive(id);
    onChange?.(id);
  };

  const current = tabs.find((tab) => tab.id === active);

  return (
    <div>
      <Bar>
        <SegmentedControl
          label={label}
          value={active}
          onValueChange={select}
          options={tabs.map((tab) => ({
            label: tab.label,
            value: tab.id,
            ...(tab.disabled ? { disabled: true } : {}),
          }))}
        />
      </Bar>
      <Panel id={panelId} role="tabpanel" aria-label={current?.label}>
        {current?.content}
      </Panel>
    </div>
  );
};

Tabs.displayName = 'Tabs';

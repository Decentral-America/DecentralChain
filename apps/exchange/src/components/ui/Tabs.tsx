import React, { type ReactNode, useCallback, useState } from 'react';
import styled from 'styled-components';

/**
 * Tabs Component
 *
 * A tabbed interface for organizing content with:
 * - State management for active tab
 * - Keyboard navigation (Arrow keys, Home, End)
 * - Controlled and uncontrolled modes
 * - Icons support
 * - Disabled tabs
 * - Full accessibility (ARIA attributes)
 */

// Styled Components
const TabsContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
`;

const TabList = styled.div<{ variant?: 'line' | 'enclosed' | 'pills' }>`
  display: flex;
  gap: ${({ variant }) => (variant === 'pills' ? '8px' : '0')};
  border-bottom: ${({ theme, variant }) =>
    variant === 'line' ? `2px solid ${theme.colors.border}` : 'none'};
  background: ${({ theme, variant }) =>
    variant === 'enclosed' ? theme.colors.background : 'transparent'};
  padding: ${({ variant }) => (variant === 'enclosed' ? '8px' : '0')};
  border-radius: ${({ variant }) => (variant === 'enclosed' ? '8px 8px 0 0' : '0')};
`;

const Tab = styled.button<{
  $active: boolean;
  $variant?: 'line' | 'enclosed' | 'pills';
  $disabled?: boolean | undefined;
}>`
  position: relative;
  padding: 12px 24px;
  font-size: 14px;
  font-weight: ${({ $active }) => ($active ? 600 : 500)};
  color: ${({ theme, $active, $disabled }) => {
    if ($disabled) return `${theme.colors.text}40`;
    return $active ? theme.colors.primary : theme.colors.text;
  }};
  background: ${({ theme, $active, $variant }) => {
    if ($variant === 'pills') {
      return $active ? theme.colors.primary : 'transparent';
    }
    if ($variant === 'enclosed') {
      return $active ? theme.colors.background : 'transparent';
    }
    return 'transparent';
  }};
  border: none;
  border-bottom: ${({ theme, $active, $variant }) => {
    if ($variant === 'line') {
      return `2px solid ${$active ? theme.colors.primary : 'transparent'}`;
    }
    return 'none';
  }};
  border-radius: ${({ $variant }) => {
    if ($variant === 'pills') return '8px';
    if ($variant === 'enclosed') return '8px 8px 0 0';
    return '0';
  }};
  cursor: ${({ $disabled }) => ($disabled ? 'not-allowed' : 'pointer')};
  opacity: ${({ $disabled }) => ($disabled ? 0.5 : 1)};
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  white-space: nowrap;

  &:hover:not(:disabled) {
    background: ${({ theme, $variant, $active }) => {
      if ($variant === 'pills' && !$active) {
        return `${theme.colors.primary}20`;
      }
      if ($variant === 'enclosed' && !$active) {
        return `${theme.colors.border}40`;
      }
      return 'transparent';
    }};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.primary};
    outline-offset: 2px;
  }

  // Pills variant white text on active
  ${({ $variant, $active }) =>
    $variant === 'pills' &&
    $active &&
    `
    color: white;
  `}
`;

const TabIcon = styled.span`
  display: flex;
  align-items: center;
  font-size: 16px;
`;

const TabContent = styled.div<{ variant?: 'line' | 'enclosed' | 'pills' }>`
  padding: ${({ variant }) => (variant === 'enclosed' ? '24px' : '16px 0')};
  background: ${({ theme, variant }) =>
    variant === 'enclosed' ? theme.colors.background : 'transparent'};
  border-radius: ${({ variant }) => (variant === 'enclosed' ? '0 8px 8px 8px' : '0')};
`;

// Interfaces
export interface TabItem {
  /** Tab label */
  label: string;

  /** Tab content */
  content: ReactNode;

  /** Optional icon */
  icon?: ReactNode;

  /** Disabled state */
  disabled?: boolean;

  /** Optional key for controlled mode */
  key?: string;
}

export interface TabsProps {
  /** Array of tab items */
  tabs: TabItem[];

  /** Default active tab index (uncontrolled) */
  defaultTab?: number;

  /** Active tab index (controlled) */
  activeTab?: number;

  /** Callback when tab changes (controlled) */
  onChange?: (index: number) => void;

  /** Visual variant */
  variant?: 'line' | 'enclosed' | 'pills';

  /** Custom className */
  className?: string;

  /** Custom style */
  style?: React.CSSProperties;

  /** Enable keyboard navigation */
  keyboardNavigation?: boolean;
}

/**
 * Tabs Component
 *
 * Tabbed interface for organizing content
 */
export const Tabs: React.FC<TabsProps> = ({
  tabs,
  defaultTab = 0,
  activeTab: controlledActiveTab,
  onChange,
  variant = 'line',
  className,
  style,
  keyboardNavigation = true,
}) => {
  const [internalActiveTab, setInternalActiveTab] = useState(defaultTab);

  // Determine if controlled or uncontrolled
  const isControlled = controlledActiveTab !== undefined;
  const activeTab = isControlled ? controlledActiveTab : internalActiveTab;

  // Handle tab change
  const handleTabChange = useCallback(
    (index: number) => {
      if (tabs[index]?.disabled) return;

      if (!isControlled) {
        setInternalActiveTab(index);
      }

      onChange?.(index);
    },
    [isControlled, onChange, tabs],
  );

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, currentIndex: number) => {
      if (!keyboardNavigation) return;

      const findEnabled = (start: number, end: number, step: number): number => {
        for (let i = start; step > 0 ? i < end : i >= end; i += step) {
          if (!tabs[i]?.disabled) return i;
        }
        return currentIndex;
      };

      const keyMap: Record<string, () => number> = {
        ArrowDown: () => findEnabled(currentIndex + 1, tabs.length, 1),
        ArrowLeft: () => findEnabled(currentIndex - 1, -1, -1),
        ArrowRight: () => findEnabled(currentIndex + 1, tabs.length, 1),
        ArrowUp: () => findEnabled(currentIndex - 1, -1, -1),
        End: () => findEnabled(tabs.length - 1, -1, -1),
        Home: () => findEnabled(0, tabs.length, 1),
      };

      const resolver = keyMap[e.key];
      if (!resolver) return;

      e.preventDefault();
      const nextIndex = resolver();

      if (nextIndex !== currentIndex) {
        handleTabChange(nextIndex);
      }
    },
    [keyboardNavigation, tabs, handleTabChange],
  );

  return (
    <TabsContainer className={className} style={style}>
      <TabList role="tablist" variant={variant}>
        {tabs.map((tab, index) => (
          <Tab
            key={tab.key || index}
            role="tab"
            aria-selected={activeTab === index}
            aria-controls={`tabpanel-${index}`}
            id={`tab-${index}`}
            tabIndex={activeTab === index ? 0 : -1}
            $active={activeTab === index}
            $variant={variant}
            $disabled={tab.disabled}
            disabled={tab.disabled}
            onClick={() => handleTabChange(index)}
            onKeyDown={(e) => handleKeyDown(e, index)}
          >
            {tab.icon && <TabIcon>{tab.icon}</TabIcon>}
            {tab.label}
          </Tab>
        ))}
      </TabList>

      <TabContent
        role="tabpanel"
        id={`tabpanel-${activeTab}`}
        aria-labelledby={`tab-${activeTab}`}
        variant={variant}
      >
        {tabs[activeTab]?.content}
      </TabContent>
    </TabsContainer>
  );
};

// Convenience exports for different variants
export const LineTabs: React.FC<Omit<TabsProps, 'variant'>> = (props) => (
  <Tabs {...props} variant="line" />
);

export const EnclosedTabs: React.FC<Omit<TabsProps, 'variant'>> = (props) => (
  <Tabs {...props} variant="enclosed" />
);

export const PillTabs: React.FC<Omit<TabsProps, 'variant'>> = (props) => (
  <Tabs {...props} variant="pills" />
);

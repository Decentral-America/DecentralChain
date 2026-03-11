import clsx from 'clsx';
import { Children, cloneElement, isValidElement, useState } from 'react';
import invariant from 'tiny-invariant';

import * as styles from './tabs.styl';

interface TabProps {
  className?: string | undefined;
  children: React.ReactNode;
  isActive?: boolean | undefined;
  onActivate?: (() => void) | undefined;
}

export function Tab({ className, children, isActive, onActivate }: TabProps) {
  return (
    <li
      // biome-ignore lint/a11y/noNoninteractiveElementToInteractiveRole: li with role="tab" is a standard tabs pattern
      role="tab"
      className={clsx(styles.tabListItem, { [styles.tabListActive]: isActive }, className)}
      onClick={onActivate}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onActivate?.();
        }
      }}
      tabIndex={0}
    >
      {children}
    </li>
  );
}

interface TabListProps {
  activeIndex?: number | undefined;
  children:
    | Array<
        | React.ReactElement<React.ComponentProps<typeof Tab>, typeof Tab>
        | boolean
        | number
        | string
        | null
        | undefined
      >
    | React.ReactElement<React.ComponentProps<typeof Tab>, typeof Tab>
    | boolean
    | number
    | string
    | null
    | undefined;
  className?: string | undefined;
  onActiveTab?: ((index: number) => void) | undefined;
}

export function TabList({ activeIndex, children, className, onActiveTab }: TabListProps) {
  return (
    <ol className={clsx(styles.tabList, className)}>
      {Children.map(
        children,
        (child, index) =>
          isValidElement<React.ComponentProps<typeof Tab>>(child) &&
          cloneElement(child, {
            isActive: index === activeIndex,
            onActivate: () => onActiveTab?.(index),
          }),
      )}
    </ol>
  );
}

interface TabPanelsProps {
  activeIndex?: number | undefined;
  children: React.ReactNode;
  className?: string | undefined;
}

export function TabPanels({ activeIndex, children, className }: TabPanelsProps) {
  invariant(typeof activeIndex === 'number');

  return <div className={className}>{Children.toArray(children)[activeIndex]}</div>;
}

interface TabPanelProps {
  children: React.ReactNode;
  className?: string | undefined;
}

export function TabPanel({ children, className }: TabPanelProps) {
  return <div className={className}>{children}</div>;
}

interface TabsProps {
  activeTab?: number | null | undefined;
  children: [React.ReactElement, React.ReactElement];
  onTabChange?: ((activeIndex: number) => void) | undefined;
}

export function Tabs({ children, activeTab: activeTabProp, onTabChange }: TabsProps) {
  const [activeTabState, setActiveTabState] = useState(activeTabProp ?? 0);

  const activeTab = activeTabProp ?? activeTabState;

  return (
    <>
      {Children.map(children, child => {
        switch (child.type) {
          case TabPanels:
            return cloneElement(child as React.ReactElement<any>, { activeIndex: activeTab });
          case TabList:
            return cloneElement(child as React.ReactElement<any>, {
              activeIndex: activeTab,
              onActiveTab: (activeIndex: number) => {
                if (onTabChange) {
                  onTabChange(activeIndex);
                }

                setActiveTabState(activeIndex);
              },
            });
          default:
            return child;
        }
      })}
    </>
  );
}

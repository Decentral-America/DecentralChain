import clsx from 'clsx';

import * as styles from './index.module.styl';

interface IProps extends React.ComponentProps<'div'> {
  tabs: Array<{ item: React.ReactElement | string; name: string }>;
  currentTab: string;
  className?: string | undefined;
  onSelectTab: (tab: string) => void;
}

export function Tabs({ tabs, currentTab, className, onSelectTab }: IProps) {
  const tabsClassName = clsx(styles.tabs, className);

  return (
    <div className={tabsClassName}>
      {tabs.map(({ item, name }) => {
        function handleSelect() {
          if (currentTab !== name) {
            onSelectTab(name);
          }
        }

        return (
          <div
            key={name}
            id={`${name}Tab`}
            onClick={handleSelect}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleSelect();
              }
            }}
            role="tab"
            tabIndex={0}
            className={clsx(styles.tab, currentTab === name && styles.selected)}
          >
            <span>{item}</span>
          </div>
        );
      })}
    </div>
  );
}

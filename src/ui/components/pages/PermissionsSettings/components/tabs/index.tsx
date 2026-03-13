import clsx from 'clsx';
import { PureComponent } from 'react';

import * as styles from './index.module.styl';

export class Tabs extends PureComponent<IProps> {
  selectHandler = (name: string) => () => {
    if (this.props.currentTab !== name) {
      this.props.onSelectTab(name);
    }
  };

  render() {
    const className = clsx(styles.tabs, this.props.className);
    const selected = this.props.currentTab;

    return (
      <div className={className}>
        {this.props.tabs.map(({ item, name }) => (
          <div
            key={name}
            id={`${name}Tab`}
            onClick={this.selectHandler(name)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.selectHandler(name)();
              }
            }}
            role="tab"
            tabIndex={0}
            className={clsx(styles.tab, {
              [styles.selected]: selected === name,
            })}
          >
            <span>{item}</span>
          </div>
        ))}
      </div>
    );
  }
}

interface IProps extends React.ComponentProps<'div'> {
  tabs: Array<{ item: React.ReactElement | string; name: string }>;
  currentTab: string;
  className?: string | undefined;
  onSelectTab: (tab: string) => void;
}

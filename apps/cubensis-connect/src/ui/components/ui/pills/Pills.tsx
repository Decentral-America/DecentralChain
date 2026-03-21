import clsx from 'clsx';
import { CSSTransition, TransitionGroup } from 'react-transition-group';

import { Pill } from './Pill';
import * as styles from './pills.module.styl';

export interface PillsListItem {
  id: number;
  text: string;
  selected?: boolean | undefined;
  hidden?: boolean | undefined;
}

interface Props {
  className?: string | undefined;
  id?: number | undefined;
  selected?: boolean | undefined;
  list: PillsListItem[];
  onSelect: (item: PillsListItem) => void;
}

export function Pills({ className, onSelect, list, ...props }: Props) {
  const myClassName = clsx(styles.pills, className);
  return (
    <TransitionGroup className={myClassName}>
      {list.map((item) => (
        <CSSTransition key={item.id} classNames="animated" timeout={200}>
          <Pill
            onSelect={() => onSelect(item)}
            text={item.text}
            hidden={item.hidden}
            selected={item.selected}
            key={item.id}
            {...props}
          />
        </CSSTransition>
      ))}
    </TransitionGroup>
  );
}

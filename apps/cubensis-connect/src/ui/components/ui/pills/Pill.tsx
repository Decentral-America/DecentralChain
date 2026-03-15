import clsx from 'clsx';

import * as styles from './pills.module.styl';

const _onClick = (cb: (...args: unknown[]) => unknown) => (id: number | undefined) => cb?.(id);

interface Props {
  className?: string | undefined;
  id?: number | undefined;
  text?: string | undefined;
  hidden?: boolean | undefined;
  selected?: boolean | undefined;
  onSelect: (...args: unknown[]) => unknown;
}

export function Pill({ id, text, selected, hidden, className, onSelect }: Props) {
  const newClassName = clsx(
    styles.pill,
    className,
    selected && styles.selectedPill,
    hidden && styles.hiddenPill,
  );

  const onClick = _onClick(onSelect);
  return (
    <div className={newClassName}>
      <div>{text}</div>
      <button type="button" className={styles.text} onClick={() => onClick(id)}>
        {text}
      </button>
    </div>
  );
}

import clsx from 'clsx';

import * as styles from './powerBtn.module.styl';

export function PowerButton({ className, onClick, enabled, children, ...props }: IProps) {
  const btnClassName = clsx(className, styles.powerBtn, {
    [styles.powerBtnOn]: enabled,
  });

  return (
    <button onClick={onClick} className={btnClassName} {...props}>
      {children}
    </button>
  );
}

interface IProps {
  className?: string | undefined;
  onClick?: ((...args: unknown[]) => void) | undefined;
  enabled?: boolean | undefined;
  children?: React.ReactNode | undefined;
  disabled?: boolean | undefined;
}

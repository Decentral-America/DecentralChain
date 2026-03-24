import clsx from 'clsx';
import { Spinner } from '#_core/spinner';

import * as styles from './Button.module.css';

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean | undefined;
  view?: 'custom' | 'icon' | 'submit' | 'submitTiny' | 'transparent' | 'warning' | undefined;
}

export function Button({
  children,
  className,
  loading,
  type = 'button',
  view,
  ...otherProps
}: Props) {
  return (
    <button
      className={clsx(
        className,
        styles.button,
        view === 'custom' && styles.custom,
        !view && styles.defaultView,
        view === 'icon' && styles.icon,
        loading && styles.loading,
        view === 'submitTiny' && styles.submitTiny,
        view === 'submit' && styles.submit,
        view === 'transparent' && styles.transparent,
        view === 'warning' && styles.warning,
      )}
      type={type}
      {...otherProps}
    >
      {children}
      {loading && (
        <span className={styles.spinner}>
          <Spinner size={16} />
        </span>
      )}
    </button>
  );
}

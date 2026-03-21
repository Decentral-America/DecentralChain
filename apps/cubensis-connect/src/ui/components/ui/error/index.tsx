import clsx from 'clsx';
import { useTranslation } from 'react-i18next';

import * as styles from './error.module.styl';

const Errors = ({
  errors,
  show,
}: {
  errors: Array<{ key: string; msg: string }> | undefined;
  show: unknown;
}) => {
  const { t } = useTranslation();

  if (!show || !errors || !errors.length) {
    return null;
  }

  return (
    <>
      {errors.map(({ key, msg }) => {
        key = key.replace(/\s/g, '');
        return t(key, { defaultValue: msg, key });
      })}
    </>
  );
};

interface Props {
  type?: string | undefined;
  show?: unknown | undefined;
  children?: React.ReactNode | undefined;
  className?: string | undefined;
  hideByClick?: boolean | undefined;
  onClick?: ((...args: unknown[]) => void) | undefined;
  errors?: Array<{ code: number; key: string; msg: string }> | undefined;
}

export function ErrorMessage({
  children,
  className = '',
  errors,
  type,
  show,
  hideByClick: _hideByClick,
  onClick,
  ...otherProps
}: Props) {
  if (type === 'modal') {
    return null;
  }

  function handleClick(e: unknown) {
    if (onClick) {
      onClick(e);
    }
    // hideByClick had no measurable effect in the original (state.hidden was never read in render)
  }

  return (
    <button
      type="button"
      className={clsx(styles.error, className)}
      onClick={handleClick}
      {...otherProps}
    >
      <Errors errors={errors} show={show} />
      {show ? children : null}
    </button>
  );
}

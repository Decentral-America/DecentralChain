import { useTranslation } from 'react-i18next';

import * as styles from './DateFormat.module.css';

const DEFAULT_OPTIONS: Intl.DateTimeFormatOptions = {
  day: '2-digit',
  hour: 'numeric',
  minute: 'numeric',
  month: '2-digit',
  year: 'numeric',
};

interface Props {
  className?: string | undefined;
  date: number | Date;
  options?: Intl.DateTimeFormatOptions | undefined;
  showRaw?: boolean | undefined;
}

export const DateFormat = ({ className, date, options = DEFAULT_OPTIONS, showRaw }: Props) => {
  const { i18n } = useTranslation();

  return (
    <div className={className}>
      <span>{new Intl.DateTimeFormat(i18n.language, options).format(new Date(date))}</span>{' '}
      {showRaw ? <span className={styles.timestamp}>{date.toString()}</span> : undefined}
    </div>
  );
};

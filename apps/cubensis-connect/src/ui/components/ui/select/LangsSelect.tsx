import clsx from 'clsx';
import { SUPPORTED_LANGUAGES } from '#i18n/constants';
import { setLocale } from '#popup/store/actions';
import { usePopupSelector } from '#popup/store/react';
import * as styles from './LangsSelect.module.css';
import { Select } from './Select';

export function LangsSelect() {
  const currentLocale = usePopupSelector((state) => state.currentLocale);

  return (
    <Select
      fill
      listPlacement="top"
      selectList={SUPPORTED_LANGUAGES.map(({ id, name }) => ({
        icon: (
          <i
            className={clsx(
              styles.flagIcon,
              `flag-${id}-icon`,
              currentLocale === id && styles.selected,
            )}
          />
        ),
        id,
        text: name,
        value: id,
      }))}
      selected={currentLocale}
      onSelectItem={(locale) => {
        if (currentLocale === locale) {
          return;
        }

        setLocale(locale as string);
      }}
    />
  );
}

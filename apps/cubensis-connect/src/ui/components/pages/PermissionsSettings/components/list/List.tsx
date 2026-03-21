import { type TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';
import { type TTabTypes } from 'ui/components/pages/PermissionsSettings/PermissionSettings';

import { type TAutoAuth } from '../originSettings';
import { ListItem } from './ListItem';
import * as styles from './list.module.styl';

function getPermissionsText(
  t: TFunction<'translation', undefined>,
  perms: Array<string | TAutoAuth>,
): React.ReactElement {
  let hasApproved = false;
  let hasAuto: string | boolean | TAutoAuth | undefined = false;

  if (perms.length) {
    hasApproved = perms.includes('approved');
    hasAuto =
      hasApproved &&
      perms.find((item) => (typeof item !== 'object' ? false : item.type === 'allowAutoSign'));
  }

  return (
    <>
      {t(hasApproved ? 'permissionsSettings.approvedOrigin' : 'permissionsSettings.rejectedOrigin')}
      {hasAuto ? <span>{t('permissionsSettings.automaticOrigin')}</span> : null}
    </>
  );
}

const getFilteredOrigins = (
  origins: Record<string, Array<string | TAutoAuth>>,
  attr: TTabTypes,
) => {
  return Object.keys(origins)
    .filter((name) => {
      const permissions = origins[name] || [];

      if (attr !== 'customList') {
        return permissions.includes(attr);
      }

      return !permissions.includes('whiteList');
    })
    .reduce(
      (acc, name) => {
        acc[name] = origins[name] || [];
        return acc;
      },
      Object.create(null) as Record<string, Array<string | TAutoAuth>>,
    );
};

interface IProps {
  origins: Record<string, Array<string | TAutoAuth>>;
  showType: TTabTypes;
  showSettings: (origin: string) => void;
  toggleApprove: (origin: string, enable: boolean) => void;
}

export function List({ origins, showType, showSettings, toggleApprove }: IProps) {
  const { t } = useTranslation();
  const originsNames = Object.keys(getFilteredOrigins(origins, showType));

  if (originsNames.length === 0) {
    return (
      <div className={styles.emptyBlock}>
        <div className={styles.icon} />
        <div className="body3 margin-main-top basic500 center">
          {t('permissionsSettings.empty')}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.permissionList}>
      {originsNames.sort().map((name) => (
        <ListItem
          key={name}
          originName={name}
          permissions={origins[name]!}
          permissionsText={getPermissionsText(t, origins[name]!)}
          showSettings={showSettings}
          toggleApprove={toggleApprove}
        />
      ))}
    </div>
  );
}

import { BigNumber } from '@decentralchain/bignumber';
import clsx from 'clsx';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { usePopupDispatch, usePopupSelector } from '#popup/store/react';
import { setShowNotification } from '#store/actions/notifications';
import {
  allowOrigin,
  deleteOrigin,
  disableOrigin,
  setAutoOrigin,
} from '#store/actions/permissions';
import { Loader, Modal } from '#ui/components/ui';

import { List, OriginSettings, type TAutoAuth, Tabs, type TPermission } from './components';
import * as styles from './permissionsSettings.module.styl';

export function PermissionsSettings() {
  const { t } = useTranslation();
  const dispatch = usePopupDispatch();
  const origins = usePopupSelector((s) => s.origins);
  const storePerms = usePopupSelector((s) => (s as any).permissions) as
    | { pending?: boolean; allowed?: boolean; disallowed?: boolean; deleted?: boolean }
    | undefined;
  const pending = storePerms?.pending;
  const allowed = storePerms?.allowed;
  const disallowed = storePerms?.disallowed;
  const deleted = storePerms?.deleted;

  const [showSettings, setShowSettings] = useState(false);
  const [originsList, setOriginsList] = useState<TTabTypes>('customList');
  const [origin, setOrigin] = useState<string | null>(null);
  const [permissions, setPermissions] = useState<TPermission[]>([]);
  const [autoSign, setAutoSign] = useState<TAutoAuth | null>(null);
  const [originalAutoSign, setOriginalAutoSign] = useState<TAutoAuth | null>(null);

  function handleDelete(originName: string) {
    dispatch(deleteOrigin(originName));
    handleCloseSettings();
  }

  function handleShowSettings(originName: string) {
    const originsMap = origins ?? {};
    const entry = Object.entries(originsMap).find(([name]) => name === originName);
    if (!entry) return;
    const [, perms] = entry;
    const autoSignEntry: TAutoAuth =
      ((perms || []) as any[]).find((p) => typeof p === 'object' && p?.type === 'allowAutoSign') ??
      Object.create(null);
    const amount = new BigNumber(autoSignEntry.totalAmount ?? '0').div(10 ** 8);
    autoSignEntry.totalAmount = amount.isNaN() ? 0 : (amount.toFormat() as any);
    setAutoSign(autoSignEntry);
    setOrigin(originName);
    setOriginalAutoSign(autoSignEntry);
    setPermissions(perms as TPermission[]);
    setShowSettings(true);
  }

  function handleToggleApprove(originName: string, enable: boolean) {
    if (enable) {
      dispatch(allowOrigin(originName));
    } else {
      dispatch(disableOrigin(originName));
    }
  }

  function handleChangeOriginSettings(newAutoSign: TAutoAuth) {
    setAutoSign(newAutoSign);
  }

  function handleSaveSettings(
    params: Partial<TAutoAuth>,
    originName: string,
    canShowNotifications: boolean | null,
  ) {
    dispatch(setAutoOrigin({ origin: originName, params: params as any }));
    dispatch(setShowNotification({ canUse: canShowNotifications, origin: originName }));
    handleCloseSettings();
  }

  function handleCloseSettings() {
    setShowSettings(false);
  }

  function handleResetSettings() {
    setOrigin(null);
    setPermissions([]);
  }

  const tabs = ['customList', 'whiteList'].map((name) => ({
    item: t(`permission.${name}`),
    name,
  }));

  return (
    <div className={clsx(styles.content)}>
      <h2 className="title1 center margin-main-big">{t('permissionsSettings.title')}</h2>

      <Loader hide={!pending} />

      <Tabs
        tabs={tabs}
        currentTab={originsList}
        onSelectTab={(tab) => setOriginsList(tab as TTabTypes)}
      />

      <List
        origins={(origins ?? {}) as any}
        showType={originsList as TTabTypes}
        showSettings={handleShowSettings}
        toggleApprove={handleToggleApprove}
      />

      <Modal
        showModal={showSettings}
        animation={Modal.ANIMATION.FLASH}
        onExited={handleResetSettings}
      >
        {showSettings && origin && autoSign && originalAutoSign && (
          <OriginSettings
            originName={origin}
            permissions={permissions}
            origins={(origins ?? {}) as any}
            autoSign={autoSign}
            originalAutoSign={originalAutoSign}
            onSave={handleSaveSettings}
            onChangePerms={handleChangeOriginSettings}
            onClose={handleCloseSettings}
            onDelete={handleDelete}
          />
        )}
      </Modal>

      <Modal animation={Modal.ANIMATION.FLASH_SCALE} showModal={allowed || disallowed || deleted}>
        <div className="modal notification">
          {allowed ? t('permissionsSettings.notify.allowed') : null}
          {disallowed ? t('permissionsSettings.notify.disallowed') : null}
          {deleted ? t('permissionsSettings.notify.deleted') : null}
        </div>
      </Modal>
    </div>
  );
}

export type TTabTypes = 'customList' | 'whiteList';

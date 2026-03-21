import { BigNumber } from '@decentralchain/bignumber';
import clsx from 'clsx';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Input, Select } from 'ui/components/ui';

import * as styles from './settings.module.styl';

const CONFIG = {
  list: [
    {
      i18nKey: 'permissionSettings.modal.timeOff',
      id: '0m',
      text: "Don't automatically sign",
      value: null,
    },
    {
      i18nKey: 'permissionSettings.modal.time15m',
      id: '15m',
      text: 'For 15 minutes',
      value: 15 * 60 * 1000,
    },
    {
      i18nKey: 'permissionSettings.modal.time30m',
      id: '30m',
      text: 'For 30 minutes',
      value: 30 * 60 * 1000,
    },
    {
      i18nKey: 'permissionSettings.modal.time60m',
      id: '60m',
      text: 'For 1 hour',
      value: 60 * 60 * 1000,
    },
  ],
};

function getAutoSign(autoSign: TAutoAuth): TAutoAuth {
  if (!autoSign || typeof autoSign === 'string') {
    return { interval: null, totalAmount: null, type: 'allowAutoSign' };
  }
  return autoSign;
}

function deriveInitialState(
  autoSign: TAutoAuth,
  permissions: TPermission[],
  origins: Record<string, unknown[]>,
  originName: string,
) {
  const { interval = null, totalAmount } = getAutoSign(autoSign);
  const selected = CONFIG.list.find(({ value }) => value === interval)?.id ?? null;
  const notifications = permissions.find(
    (item) => item && (item as TNotification).type === 'useNotifications',
  ) as TNotification | undefined;
  const inWhiteList = (origins[originName] || []).includes('whiteList');
  const canUse = notifications?.canUse;
  const canUseNotify = canUse || (canUse == null && inWhiteList);
  const canShowNotifications = canUseNotify ? true : null;
  return {
    canShowNotifications,
    interval,
    notifications,
    selected,
    totalAmount: totalAmount ?? null,
  };
}

export interface IProps {
  origins: Record<string, unknown[]>;
  autoSign: TAutoAuth;
  originalAutoSign: TAutoAuth;
  permissions: TPermission[];
  originName: string;
  onSave: (
    params: Partial<TAutoAuth>,
    origin: string,
    canShowNotifications: boolean | null,
  ) => void;
  onClose: () => void;
  onDelete: (origin: string) => void;
  onChangePerms: (permission: TAutoAuth) => void;
}

export function OriginSettings({
  origins,
  autoSign,
  originalAutoSign,
  permissions,
  originName,
  onSave,
  onClose,
  onDelete,
  onChangePerms,
}: IProps) {
  const { t } = useTranslation();

  const [interval, setInterval] = useState<number | null>(() => getAutoSign(autoSign).interval);
  const [totalAmount, setTotalAmount] = useState<string | null>(
    () => getAutoSign(autoSign).totalAmount ?? null,
  );
  const [selected, setSelected] = useState<string | null>(
    () => CONFIG.list.find(({ value }) => value === getAutoSign(autoSign).interval)?.id ?? null,
  );
  const [canSave, setCanSave] = useState(false);
  const [canShowNotifications, setCanShowNotifications] = useState<boolean | null>(() => {
    const init = deriveInitialState(autoSign, permissions, origins, originName);
    return init.canShowNotifications;
  });

  // Re-initialize when a different origin is opened (component reused without unmount).
  // Intentionally omits autoSign/permissions/origins from deps: those reflect live-edit state
  // and must NOT reset the form mid-interaction. originName change = new modal session.
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional — only re-init on new origin session
  useEffect(() => {
    const init = deriveInitialState(autoSign, permissions, origins, originName);
    setInterval(init.interval);
    setTotalAmount(init.totalAmount);
    setSelected(init.selected);
    setCanShowNotifications(init.canShowNotifications);
    setCanSave(false);
  }, [originName]);

  const notifications = permissions.find(
    (item) => item && (item as TNotification).type === 'useNotifications',
  ) as TNotification | undefined;

  function calculateCanSave(
    newInterval: number | null,
    newTotalAmount: string | null,
    newCanShowNotifications: boolean | null,
  ) {
    const sign = getAutoSign(originalAutoSign);
    const effectiveTotalAmount = newInterval ? newTotalAmount : '';
    let save = false;

    if (newCanShowNotifications !== !!notifications) save = true;
    if (Number(sign.interval) !== Number(newInterval)) save = true;
    if (Number(sign.totalAmount || 0) !== Number(effectiveTotalAmount || 0)) save = true;
    if (!Number(effectiveTotalAmount) && Number(newInterval)) save = false;

    setCanSave(save);
    onChangePerms({
      interval: newInterval,
      totalAmount: effectiveTotalAmount ?? null,
      type: 'allowAutoSign',
    });
  }

  function handleClose() {
    setCanSave(false);
    setCanShowNotifications(null);
    setInterval(null);
    setSelected(null);
    setTotalAmount(null);
    onClose();
  }

  function handleSelectTime(time: number | string) {
    const found = CONFIG.list.find(({ id }) => id === time);
    if (!found) return;
    setInterval(found.value);
    setSelected(time as string);
    calculateCanSave(found.value, totalAmount, canShowNotifications);
  }

  function handleAmountChange(event: React.ChangeEvent<HTMLInputElement>) {
    const { value } = event.target;
    const parsedValue = value
      .replace(/[^0-9.]/g, '')
      .split('.')
      .slice(0, 2);
    if (parsedValue[1]) {
      parsedValue[1] = parsedValue[1].slice(0, 8);
    }
    const newValue = parsedValue.join('.');
    setTotalAmount(newValue);
    calculateCanSave(interval, newValue, canShowNotifications);
  }

  function handleNotificationsChange(e: React.ChangeEvent<HTMLInputElement>) {
    setCanShowNotifications(e.target.checked);
    calculateCanSave(interval, totalAmount, e.target.checked);
  }

  function handleSave() {
    const res = new BigNumber(totalAmount ?? '0').mul(10 ** 8);
    onSave(
      {
        interval: Number(interval) || null,
        totalAmount: res.isNaN() ? null : res.toFixed(0),
      },
      originName,
      canShowNotifications,
    );
  }

  const inWhiteList = permissions.includes('whiteList');
  const effectiveTotalAmount = interval ? (totalAmount ?? '') : '';

  const timeList = CONFIG.list.map((item) => ({
    id: item.id,
    text: t(item.i18nKey, { key: item.id }),
    value: item.value,
  }));

  return (
    <div className="modal cover">
      <div id="originSettings" className="modal-form">
        <h2 className={clsx(styles.title)}>{t('permissionSettings.modal.title')}</h2>

        <div className={styles.description}>
          {t('permissionSettings.modal.description', { originName })}
        </div>

        <Select
          className={styles.selectTime}
          fill
          selectList={timeList}
          selected={(selected ?? '') as any}
          description={t('permissionSettings.modal.time')}
          onSelectItem={handleSelectTime}
        />

        <div className={clsx(styles.amount)}>
          <div className="left input-title basic500 tag1">
            {t('permissionSettings.modal.amount')}
          </div>
          <Input
            disabled={!interval}
            onChange={handleAmountChange}
            className={styles.amountInput}
            value={effectiveTotalAmount}
            placeholder="0"
          />
          <div className={styles.dcc}>DCC</div>
        </div>

        <div className="flex margin-main-big margin-main-big-top">
          <Input
            id="checkbox_noshow"
            type="checkbox"
            checked={canShowNotifications ?? false}
            onChange={handleNotificationsChange}
          />
          <label htmlFor="checkbox_noshow">{t('notifications.allowSending')}</label>
        </div>

        {!inWhiteList ? (
          <div className="buttons-wrapper">
            <Button id="delete" type="button" onClick={() => onDelete(originName)} view="warning">
              {t('permissionSettings.modal.delete')}
            </Button>
            <Button id="save" type="submit" view="submit" disabled={!canSave} onClick={handleSave}>
              {t('permissionSettings.modal.save')}
            </Button>
          </div>
        ) : (
          <Button id="save" type="submit" view="submit" disabled={!canSave} onClick={handleSave}>
            {t('permissionSettings.modal.save')}
          </Button>
        )}

        <Button
          id="cancel"
          className={styles.cancelBtn}
          type="button"
          view="transparent"
          onClick={handleClose}
        >
          {t('permissionSettings.modal.cancel')}
        </Button>

        <Button className="modal-close" onClick={onClose} type="button" view="transparent" />
      </div>
    </div>
  );
}

export type TPermission = string | TAutoAuth | TNotification;

export type TAutoAuth = {
  type: 'allowAutoSign';
  totalAmount: string | null;
  interval: number | null;
  approved?: unknown[] | undefined;
};

type TNotification = {
  type: 'useNotifications';
  time: number;
  canUse: boolean;
};

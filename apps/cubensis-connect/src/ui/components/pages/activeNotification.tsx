import clsx from 'clsx';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import invariant from 'tiny-invariant';
import { usePopupDispatch, usePopupSelector } from '#popup/store/react';
import { Button, DateFormat, Input } from '#ui/components/ui';
import Background from '#ui/services/Background';

import { MessageWallet } from '../../../messages/_common/wallet';
import { deleteNotifications, setShowNotification } from '../../../store/actions/notifications';
import * as styles from './activeNotification.module.css';

export function ActiveNotificationPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = usePopupDispatch();

  const activeNotification = usePopupSelector((state) => state.activePopup?.notify);
  invariant(activeNotification);

  const firstNotification = activeNotification[0];
  invariant(firstNotification);

  const messageCount = usePopupSelector((state) => state.messages.length);
  const notifications = usePopupSelector((state) => state.notifications);

  const otherOriginNotifications = notifications.filter(
    ([item]) => item != null && item.origin !== firstNotification.origin,
  );

  const permissions = usePopupSelector((state) => state.origins[firstNotification.origin]);

  const selectedAccount = usePopupSelector((state) => state.selectedAccount);
  invariant(selectedAccount);

  return (
    <div className={styles.messageList}>
      <div className={styles.walletWrapper}>
        <MessageWallet account={selectedAccount} />
      </div>

      <div className={clsx(styles.messageListScrollBox)}>
        {activeNotification.map((notification) => (
          <div key={notification.id} className="margin-main-big">
            <div className={clsx(styles.messageItemInner, 'margin-2')}>
              <div className="flex">
                <div className={styles.messageIcon} />

                <div className={styles.messageTitle}>
                  <div className="basic500">{notification.origin}</div>
                  <h2>{notification.title}</h2>
                </div>
              </div>

              <div className={styles.messageText}>{notification.message}</div>
            </div>

            <div className={styles.timestamp}>
              <div className="basic500 margin-min">{t('notifications.time')}</div>

              <DateFormat date={notification.timestamp} />
            </div>
          </div>
        ))}

        <label htmlFor="allow-notifications" className={styles.allowNotification}>
          <Input
            id="allow-notifications"
            checked={
              permissions?.some(
                (item) =>
                  typeof item === 'object' && item.type === 'useNotifications' && item.canUse,
              ) ?? false
            }
            type="checkbox"
            onChange={(event) => {
              dispatch(
                setShowNotification({
                  canUse: event.target.checked,
                  origin: firstNotification.origin,
                }),
              );
            }}
          />

          {t('notifications.allowSending')}
        </label>
      </div>

      <div className={styles.notificationButtons}>
        {(messageCount > 0 ||
          (otherOriginNotifications.length !== 0 && notifications.length > 2)) && (
          <Button
            type="button"
            onClick={() => {
              dispatch(deleteNotifications(activeNotification.map((x) => x.id))).then(() =>
                navigate('/messages-and-notifications'),
              );
            }}
          >
            {t('notifications.toListBtn')}
          </Button>
        )}

        {otherOriginNotifications.length === 0 ? (
          <Button
            id="closeNotification"
            type="button"
            onClick={() => {
              dispatch(deleteNotifications(activeNotification.map(({ id }) => id)));

              Background.closeNotificationWindow();
            }}
          >
            {t('notifications.closeBtn')}
          </Button>
        ) : (
          <Button
            type="submit"
            view="submit"
            onClick={() => {
              dispatch(
                deleteNotifications(
                  activeNotification.map(({ id }) => id),
                  notifications.find(
                    ([item]) => item != null && item.origin !== firstNotification.origin,
                  ),
                ),
              );
            }}
          >
            {t('notifications.nextBtn')}
          </Button>
        )}
      </div>
    </div>
  );
}

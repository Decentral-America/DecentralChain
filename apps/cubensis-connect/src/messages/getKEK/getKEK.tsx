import clsx from 'clsx';
import { MessageFinal } from 'messages/_common/final';
import { MessageHeader } from 'messages/_common/header';
import { MessageIcon } from 'messages/_common/icon';
import { type PreferencesAccount } from 'preferences/types';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import invariant from 'tiny-invariant';
import Background from 'ui/services/Background';

import * as transactionsStyles from '../../ui/components/pages/styles/transactions.module.css';
import { ApproveBtn } from '../../ui/components/ui/buttons/ApproveBtn';
import { Button } from '../../ui/components/ui/buttons/Button';
import { type MessageOfType } from '../types';
import * as styles from './getKEK.module.css';

export function GetKEKCard({
  className,
  collapsed,
  message,
}: {
  className?: string;
  collapsed?: boolean;
  message: MessageOfType<'getKEK'>;
}) {
  const { t } = useTranslation();

  return (
    <div className={clsx(transactionsStyles.transactionCard, className)}>
      {collapsed ? (
        <div className={styles.smallCardContent}>
          <MessageIcon className={styles.icon} type="getKEK" small />

          <div>
            <div className={styles.origin}>{message.origin}</div>

            <h1 className={styles.title}>{t('getKEK.title')}</h1>
          </div>
        </div>
      ) : (
        <div className={transactionsStyles.txIconBig}>
          <MessageIcon type="getKEK" />
        </div>
      )}
    </div>
  );
}

export function GetKEKScreen({
  message,
  selectedAccount,
}: {
  message: MessageOfType<'getKEK'>;
  selectedAccount: PreferencesAccount;
}) {
  const { t } = useTranslation();
  const [isPending, setIsPending] = useState(false);

  invariant(message.origin);

  return (
    <div className={transactionsStyles.transaction}>
      <MessageHeader message={message} selectedAccount={selectedAccount} />

      <div className={clsx(transactionsStyles.txScrollBox, 'transactionContent')}>
        <GetKEKCard message={message} />

        <div className={styles.infoBlock}>
          <div className={styles.infoBlockText}>
            {t('getKEK.description', { origin: message.origin })}
          </div>
        </div>

        <div className={styles.keyBlock}>
          <div className={styles.keyLabel}>{t('getKEK.publicKey')}</div>
          <div className={styles.keyValue}>{message.data.publicKey}</div>
        </div>
      </div>

      <div className={clsx(transactionsStyles.txButtonsWrapper, 'buttons-wrapper')}>
        <Button
          id="reject"
          type="button"
          view="warning"
          onClick={() => {
            Background.reject(message.id);
          }}
        >
          {t('sign.reject')}
        </Button>

        <ApproveBtn
          disabled={isPending}
          id="approve"
          loading={isPending}
          type="button"
          view="submit"
          onClick={async () => {
            try {
              setIsPending(true);
              await Background.approve(message.id);
              setIsPending(false);
            } catch {
              setIsPending(false);
            }
          }}
        >
          {t('getKEK.approve')}
        </ApproveBtn>
      </div>
    </div>
  );
}

export function GetKEKFinal({
  isApprove,
  isReject,
  isSend,
}: {
  isApprove: boolean;
  isReject: boolean;
  isSend: boolean | undefined;
}) {
  const { t } = useTranslation();

  return (
    <MessageFinal
      isApprove={isApprove}
      isReject={isReject}
      isSend={isSend}
      messages={{
        approve: t('getKEK.approved'),
        reject: t('getKEK.rejected'),
        send: t('getKEK.approved'),
      }}
    />
  );
}

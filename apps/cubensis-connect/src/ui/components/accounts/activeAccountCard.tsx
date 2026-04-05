import type { BigNumber } from '@decentralchain/bignumber';
import type { Money } from '@decentralchain/data-entities';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';
import { usePopupSelector } from '#popup/store/react';
import type { PreferencesAccount } from '#preferences/types';

import { Avatar } from '../ui/avatar/Avatar';
import { Balance } from '../ui/balance/Balance';
import { Copy } from '../ui/copy/Copy';
import { Loader } from '../ui/loader';
import { Tooltip } from '../ui/tooltip';
import * as styles from './activeAccountCard.module.css';

const UsdAmount = ({ amount }: { amount: BigNumber | null }) =>
  amount !== null ? <p className={styles.accountAmount}>{`$${amount.toFixed(2)}`}</p> : <Loader />;

interface Props {
  account: PreferencesAccount;
  amountInUsd: BigNumber | null;
  dccBalance?: Money | undefined;
  onClick: (account: PreferencesAccount) => void;
  onCopy: () => void;
  onOtherAccountsClick: () => void;
  onShowQr: () => void;
}

export function ActiveAccountCard({
  account,
  dccBalance,
  amountInUsd,
  onClick,
  onCopy,
  onOtherAccountsClick,
  onShowQr,
}: Props) {
  const { t } = useTranslation();
  const currentNetwork = usePopupSelector((state) => state.currentNetwork);
  const isMainnet = currentNetwork === 'mainnet';

  return (
    <div className={styles.root} data-testid="activeAccountCard">
      <div className={styles.accountInfo}>
        <Avatar size={40} address={account.address} type={account.type} />

        <div className={styles.accountInfoText}>
          <div className={styles.accountName} data-testid="accountName">
            {account.name}
          </div>

          {isMainnet ? (
            <UsdAmount amount={amountInUsd} />
          ) : (
            <Balance balance={dccBalance} isShortFormat={false} showAsset split />
          )}
        </div>

        <Tooltip content={t('assets.inStorage')}>
          {(props) => (
            <button
              className={clsx(styles.iconButton, styles.otherAccountsButton)}
              data-testid="otherAccountsButton"
              type="button"
              onClick={onOtherAccountsClick}
              {...props}
            />
          )}
        </Tooltip>
      </div>

      <button
        type="button"
        className={styles.selectableOverlay}
        onClick={() => {
          onClick(account);
        }}
      />

      <div className={styles.controls}>
        <span className={styles.controlsExpand} />

        <Tooltip content={t('copyAddress')}>
          {(props) => (
            <Copy text={account.address} onCopy={onCopy}>
              <button className={clsx(styles.iconButton, 'copyIconBlack')} {...props} />
            </Copy>
          )}
        </Tooltip>

        <Tooltip content={t('showQR')} placement="bottom-end">
          {(props) => (
            <button
              className={clsx(styles.iconButton, 'showQrIcon')}
              onClick={onShowQr}
              {...props}
            />
          )}
        </Tooltip>
      </div>
    </div>
  );
}

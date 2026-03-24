import { Asset, Money } from '@decentralchain/data-entities';
import { captureException, withScope } from '@sentry/browser';
import clsx from 'clsx';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { NetworkName } from '#networks/types';
import { usePopupSelector } from '#popup/store/react';
import { Balance } from '#ui/components/ui/balance/Balance';
import { Button } from '#ui/components/ui/buttons/Button';

import { NETWORK_CONFIG } from '../../../../constants';
import { SwapLayout } from './layout';
import * as styles from './result.module.css';

interface Props {
  fromMoney: Money;
  transactionId: string;
  onClose: () => void;
}

enum SwapStatus {
  Pending,
  Succeeded,
  Failed,
}

type TxStatus =
  | { status: 'not_found'; id: string }
  | { status: 'unconfirmed'; id: string }
  | {
      status: 'confirmed';
      height: number;
      confirmations: number;
      applicationStatus: 'succeeded' | 'failed';
      spentComplexity: number;
      id: string;
    };

const explorerBaseUrlsByNetwork = {
  [NetworkName.Mainnet]: 'explorer.decentralchain.io',
  [NetworkName.Testnet]: 'testnet.explorer.decentralchain.io',
  [NetworkName.Stagenet]: 'stagenet.explorer.decentralchain.io',
  [NetworkName.Custom]: undefined,
};

export function SwapResult({ fromMoney, transactionId, onClose }: Props) {
  const { t } = useTranslation();
  const assets = usePopupSelector((state) => state.assets);
  const currentNetwork = usePopupSelector((state) => state.currentNetwork);
  const selectedAccount = usePopupSelector((state) => state.selectedAccount);

  const { nodeBaseUrl } = NETWORK_CONFIG[currentNetwork];

  const [swapStatus, setSwapStatus] = useState(SwapStatus.Pending);
  const [receivedMoney, setReceivedMoney] = useState<Money | null>(null);

  useEffect(() => {
    let cancelled = false;

    const txStatusUrl = new URL('/transactions/status', nodeBaseUrl);
    txStatusUrl.searchParams.set('id', transactionId);

    let timeout: number;
    let txInfoAttempts = 0;

    async function updateStatus(prevTxStatus: TxStatus | null) {
      const [txStatus] = (await fetch(txStatusUrl.toString()).then((res) =>
        res.json(),
      )) as TxStatus[];

      if (cancelled) {
        return;
      }

      if (!txStatus) {
        timeout = window.setTimeout(() => updateStatus(prevTxStatus), 5000);
        return;
      }

      if (txStatus.status === 'confirmed') {
        if (txStatus.applicationStatus === 'succeeded') {
          const txInfoUrl = new URL(`/transactions/info/${transactionId}`, nodeBaseUrl);

          try {
            const txInfoResponse = await fetch(txInfoUrl.toString());
            if (!txInfoResponse.ok) {
              throw new Error(await txInfoResponse.text());
            }
            const txInfo = (await txInfoResponse.json()) as {
              stateChanges: {
                transfers: Array<{
                  address: string;
                  asset: string | null;
                  amount: number;
                }>;
              };
            };

            const transfer = txInfo.stateChanges.transfers.find(
              (t) => t.address === selectedAccount?.address,
            );

            if (!transfer) {
              throw new Error('Transfer not found in state changes');
            }

            const receivedAsset = assets[transfer.asset || 'WAVES'];
            if (!receivedAsset) {
              throw new Error('Received asset not found');
            }

            setReceivedMoney(new Money(transfer.amount, new Asset(receivedAsset)));
            setSwapStatus(SwapStatus.Succeeded);
          } catch (err) {
            txInfoAttempts++;

            if (txInfoAttempts < 5) {
              timeout = window.setTimeout(() => updateStatus(txStatus), 5000);
            } else {
              setSwapStatus(SwapStatus.Failed);

              withScope((scope) => {
                scope.setExtra('transactionId', transactionId);
                captureException(err);
              });
            }
          }
        } else {
          setSwapStatus(SwapStatus.Failed);

          withScope((scope) => {
            scope.setExtra('transactionId', transactionId);
            captureException(new Error('Swap transaction failed'));
          });
        }
      } else if (
        txStatus.status === 'not_found' &&
        prevTxStatus &&
        prevTxStatus.status === 'unconfirmed'
      ) {
        setSwapStatus(SwapStatus.Failed);

        withScope((scope) => {
          scope.setExtra('transactionId', transactionId);
          captureException(new Error('Swap transaction failed'));
        });
      } else {
        timeout = window.setTimeout(() => updateStatus(txStatus), 5000);
      }
    }

    void updateStatus(null);

    return () => {
      cancelled = true;

      if (timeout != null) {
        window.clearTimeout(timeout);
      }
    };
  }, [selectedAccount?.address, nodeBaseUrl, transactionId, assets]);

  const explorerBaseUrl = explorerBaseUrlsByNetwork[currentNetwork];

  return (
    <SwapLayout>
      <div className={styles.root}>
        <div className={styles.content}>
          <div className={styles.statusBox}>
            {swapStatus === SwapStatus.Pending ? (
              <>
                <div className={clsx(styles.statusIcon, 'tx-waiting-icon')} />

                <div className="margin-main-top margin-main-big headline2 center">
                  {t('swap.statusInProgress')}
                </div>
              </>
            ) : swapStatus === SwapStatus.Failed ? (
              <>
                <div className={clsx(styles.statusIcon, 'tx-reject-icon')} />

                <div className="margin-main-top margin-main-big headline2 center">
                  {t('swap.statusFailed')}
                </div>
              </>
            ) : (
              <>
                <div className={clsx(styles.statusIcon, 'tx-approve-icon')} />

                <div className="margin-main-top margin-main-big headline2 center">
                  {t('swap.statusSucceeded')}
                </div>
              </>
            )}
          </div>

          <div className={styles.main}>
            <div className={styles.card}>
              <div className={clsx(styles.cardIcon, 'create-order-transaction-icon')} />

              <div className={styles.cardText}>
                <Balance addSign="-" split showAsset balance={fromMoney} />

                {[SwapStatus.Pending, SwapStatus.Succeeded].includes(swapStatus) && (
                  <Balance addSign="+" split showAsset balance={receivedMoney ?? undefined} />
                )}
              </div>
            </div>

            {explorerBaseUrl && (
              <div className="center margin-main-big-top">
                <a
                  className="link black"
                  href={`https://${explorerBaseUrl}/tx/${transactionId}`}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  {t('swap.viewTransaction')}
                </a>
              </div>
            )}
          </div>

          <Button type="button" onClick={onClose}>
            {t('swap.closeBtnText')}
          </Button>
        </div>
      </div>
    </SwapLayout>
  );
}

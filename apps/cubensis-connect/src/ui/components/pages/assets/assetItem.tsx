import type { Money } from '@decentralchain/data-entities';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';
import Background from '#ui/services/Background';

import { usePopupSelector } from '../../../../popup/store/react';
import { Balance, Loader } from '../../ui';
import { Tooltip } from '../../ui/tooltip';
import * as styles from './assetItem.module.css';
import { AssetLogo } from './assetLogo';
import { MoreActions } from './moreActions';

interface Props {
  balance: Money | undefined;
  assetId: string;
  className?: string | undefined;
  onInfoClick: (assetId: string) => void;
  onSendClick: (assetId: string) => void;
}

export function AssetItem({ balance, assetId, className, onInfoClick, onSendClick }: Props) {
  const { t } = useTranslation();
  const assets = usePopupSelector((state) => state.assets);
  const asset = assets[assetId];

  const displayName = asset?.displayName;
  const isFavorite = asset?.isFavorite;
  const isLoading = !asset;

  return (
    <div className={clsx(styles.assetCard, className, 'flex', 'relative')} data-testid={assetId}>
      <AssetLogo
        className={clsx(styles.assetIcon, isLoading && 'skeleton-glow')}
        assetId={assetId}
        name={displayName}
        hasSponsorship={balance?.asset?.minSponsoredFee?.isPositive()}
        hasScript={balance?.asset?.hasScript}
      />

      <div className={clsx('body1', styles.assetData)}>
        <div className={clsx('basic500', styles.assetTitle)}>
          <div className={styles.assetName}>{displayName || <Loader />}</div>
          {asset?.isFavorite && (
            <svg
              aria-hidden="true"
              className={styles.assetStatusIcon}
              fill={isFavorite ? 'var(--color-submit400)' : 'none'}
              stroke={isFavorite ? 'var(--color-submit400)' : 'var(--color-submit200)'}
              width="18"
              height="18"
              viewBox="0 0 18 18"
            >
              <path d="M10.6472 6.66036L10.7648 6.9373L11.0645 6.96315L15.2801 7.32666L12.0848 10.0999L11.8574 10.2972L11.9254 10.5904L12.8808 14.7108L9.25837 12.5244L9 12.3685L8.74163 12.5244L5.12113 14.7096L6.08193 10.5911L6.15049 10.2972L5.92239 10.0996L2.72308 7.32803L6.93477 6.97071L7.2352 6.94522L7.35286 6.66761L9.00035 2.78048L10.6472 6.66036Z" />
            </svg>
          )}
        </div>

        <div>
          <Balance balance={balance} isShortFormat={false} showUsdAmount split />
        </div>
      </div>

      {!isLoading && (
        <MoreActions>
          {assetId !== 'WAVES' && (
            <Tooltip content={t('assetInfo.infoTooltip')}>
              {(props) => (
                <button
                  className={styles.infoBtn}
                  type="button"
                  onClick={() => onInfoClick(assetId)}
                  {...props}
                >
                  <svg aria-hidden="true" className={styles.infoIcon} viewBox="0 0 28 26">
                    <path d="M25 13c0 6.075-4.925 11-11 11S3 19.075 3 13 7.925 2 14 2s11 4.925 11 11ZM4 13c0 5.523 4.477 10 10 10s10-4.477 10-10S19.523 3 14 3 4 7.477 4 13Z" />
                    <path d="M14 10a1 1 0 1 0 0-2 1 1 0 0 0 0 2Zm0 1a.75.75 0 0 0-.75.75v5.5a.75.75 0 0 0 1.5 0v-5.5A.75.75 0 0 0 14 11Z" />
                  </svg>
                </button>
              )}
            </Tooltip>
          )}
          <Tooltip
            content={t(isFavorite ? 'assetInfo.favRemoveTooltip' : 'assetInfo.favAddTooltip')}
          >
            {(props) => (
              <button
                className={styles.favBtn}
                type="button"
                onClick={() => {
                  Background.toggleAssetFavorite(assetId);
                }}
                {...props}
              >
                <svg
                  aria-hidden="true"
                  className={styles.favIcon}
                  fill={isFavorite ? 'var(--color-submit400)' : 'none'}
                  stroke={isFavorite ? 'var(--color-submit400)' : 'var(--color-basic200)'}
                  width="26"
                  height="26"
                  viewBox="0 0 18 18"
                >
                  <path d="M10.6472 6.66036L10.7648 6.9373L11.0645 6.96315L15.2801 7.32666L12.0848 10.0999L11.8574 10.2972L11.9254 10.5904L12.8808 14.7108L9.25837 12.5244L9 12.3685L8.74163 12.5244L5.12113 14.7096L6.08193 10.5911L6.15049 10.2972L5.92239 10.0996L2.72308 7.32803L6.93477 6.97071L7.2352 6.94522L7.35286 6.66761L9.00035 2.78048L10.6472 6.66036Z" />
                </svg>
              </button>
            )}
          </Tooltip>

          <Tooltip content={t('assetInfo.sendAssetTooltip')}>
            {(props) => (
              <button
                className={styles.sendBtn}
                type="button"
                onClick={() => onSendClick(assetId)}
                {...props}
                data-testid="sendBtn"
              >
                <svg
                  aria-hidden="true"
                  className={styles.sendIcon}
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                >
                  <path d="M15.19 7.77178L4.08117 18.8806L5.46862 20.2681L16.5774 9.15923L18.6586 11.2404L19.5743 4.77489L13.1088 5.69061L15.19 7.77178Z" />
                </svg>
              </button>
            )}
          </Tooltip>
        </MoreActions>
      )}
    </div>
  );
}

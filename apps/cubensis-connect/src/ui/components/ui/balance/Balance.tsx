import { type Money } from '@decentralchain/data-entities';
import clsx from 'clsx';

import { Loader } from '../loader';
import { UsdAmount } from '../UsdAmount';
import * as styles from './Balance.module.css';

interface Props {
  addSign?: string | undefined;
  balance: Money | undefined;
  children?: React.ReactNode | undefined;
  className?: string | undefined;
  isShortFormat?: boolean | undefined;
  showAsset?: boolean | undefined;
  showUsdAmount?: boolean | undefined;
  split?: boolean | undefined;
}

export function Balance({
  addSign,
  balance,
  children,
  className,
  isShortFormat,
  showAsset,
  showUsdAmount,
  split,
  ...props
}: Props) {
  if (!balance) {
    return (
      <div>
        <Loader />
        {children}
      </div>
    );
  }

  if (balance.getTokens().isNaN()) {
    return <div>N/A</div>;
  }

  const tokens = (isShortFormat ? balance.toFormat() : balance.toTokens()).split('.');

  const assetName = showAsset ? balance.asset.displayName : null;

  if (!split) {
    return (
      <>
        <div {...props} className={`${styles.amount} ${className}`}>
          {tokens.join('.')} {assetName} {children}
        </div>
        {showUsdAmount && (
          <UsdAmount
            className={styles.usdAmountNote}
            id={balance.asset.id}
            tokens={balance.getTokens()}
          />
        )}
      </>
    );
  }

  return (
    <>
      <div {...props} className={clsx(className, styles.amount)}>
        <span className="font700">
          {addSign}
          {tokens[0]}
        </span>
        {tokens[1] ? <span className="font400">.{tokens[1]}</span> : null}
        &nbsp;
        <span className="font400">{assetName}</span>
        {children}
      </div>

      {showUsdAmount && (
        <UsdAmount
          className={styles.usdAmount}
          id={balance.asset.id}
          tokens={balance.getTokens()}
        />
      )}
    </>
  );
}

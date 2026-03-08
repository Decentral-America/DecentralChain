import PropTypes from 'prop-types';
import React from 'react';
import FailedBrick from '../../components/FailedBrick';
import TransactionArrow from '../../components/TransactionArrow';
import TransactionBadge from '../../components/TransactionBadge';
import TransactionRef from '../../components/TransactionRef';
import { DirectionalEndpoints } from './DirectionalEndpoints.view';

export class TransactionListItem extends React.PureComponent {
  static propTypes = {
    tx: PropTypes.object.isRequired,
  };

  conventAmount = (v) => {
    if (!v) return null;
    if (Array.isArray(v))
      return v.map(({ amount, currency }) => (
        <p key={`${currency}-${amount}`} className="line">
          {amount} {currency}
        </p>
      ));
    else
      return (
        <div className="line">
          {v.amount} {v.currency}
        </div>
      );
  };

  dappBadgeOrNothing = (tx) => {
    if (tx.type === 16 && typeof this.props.dApps[tx.recipient] !== 'undefined') {
      return <div className="badge dapp">{this.props.dApps[tx.recipient]}</div>;
    }
  };

  render() {
    const { tx } = this.props;
    const rowClassName = tx.isSpam ? 'spam' : '';

    return (
      <tr className={rowClassName}>
        <td data-label="ID / Type">
          <div className="line no-wrap">
            {(tx.applicationStatus === 'script_execution_failed' ||
              tx.applicationStatus === 'elided') && <FailedBrick />}
            <TransactionRef txId={tx.id} />
          </div>
          <div style={{ display: 'flex', float: 'left' }}>
            <div className="line no-wrap">
              <TransactionBadge type={tx.type} direction={tx.direction} />
            </div>
            <div>{this.dappBadgeOrNothing(tx)}</div>
          </div>
        </td>
        <td data-label="Timestamp" className="timestamp">
          <div className="line">
            <span>{tx.timestamp.date}</span>
          </div>
          <div className="line">
            <span>{tx.timestamp.time}</span>
          </div>
        </td>
        <td data-label="Sender / Receiver">
          <TransactionArrow type={tx.type} direction={tx.direction} />
          <DirectionalEndpoints transaction={tx} />
        </td>
        <td data-label="Amount in / out">
          {this.conventAmount(tx.in)}
          {this.conventAmount(tx.out)}
        </td>
        <td data-label="Price">
          {tx.type === 16 ? (
            <div className="line" title={tx.call.function}>
              {tx.call.function.length >= 16
                ? tx.call.function.slice(0, 13).concat('...')
                : tx.call.function}
            </div>
          ) : null}
          {tx.price && (
            <React.Fragment>
              <div className="line">{tx.price.amount}</div>
              <div className="line">
                <span>{tx.price.currency}</span>
              </div>
            </React.Fragment>
          )}
        </td>
      </tr>
    );
  }
}

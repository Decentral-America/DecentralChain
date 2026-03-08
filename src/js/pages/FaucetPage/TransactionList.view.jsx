import PropTypes from 'prop-types';
import React from 'react';

import { TransactionListItem } from './TransactionListItem.view';

export class TransactionList extends React.Component {
  static propTypes = {
    transactions: PropTypes.arrayOf(PropTypes.object).isRequired,
  };

  render() {
    return (
      <table className="address-tr-list table-sm-transform">
        <thead>
          <tr>
            <th>ID / Type</th>
            <th className="timestamp">Timestamp</th>
            <th>Sender / Receiver</th>
            <th className="amount">Amount in / out</th>
          </tr>
        </thead>
        <tbody>
          {this.props.transactions.map((tx) => {
            return <TransactionListItem key={tx.id} tx={tx} />;
          })}
        </tbody>
      </table>
    );
  }
}

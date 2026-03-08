import PropTypes from 'prop-types';
import React from 'react';

import EndpointRef from '../../components/EndpointRef';

export class UnconfirmedTxListItem extends React.PureComponent {
  static propTypes = {
    transaction: PropTypes.object.isRequired,
  };

  render() {
    const tx = this.props.transaction;
    const amount = tx.amount || tx.totalAmount;

    return (
      <div className="grid panel-row">
        <div className="divider divider-utx grid-item-fixed"></div>
        <div>
          <div className="line no-wrap">{tx.id}</div>
          <div className="line">
            {amount ? (
              <>
                <span>Amount</span>
                {` ${amount.toString()}`}
                <div className="link-spacer"></div>
              </>
            ) : (
              ''
            )}

            <span className="nowrap">Fee {tx.fee.toString()}</span>
          </div>
          <div className="line wide">
            <EndpointRef endpoint={tx.sender} appearance="regular" title="Sender" />
            <div className="link-spacer"></div>
            {tx.recipient && (
              <EndpointRef endpoint={tx.recipient} appearance="regular" title="Recipient" />
            )}
          </div>
        </div>
        <div className="divider divider-dashed md-hide sm-show grid-item-fixed"></div>
        <div className="md-hide sm-show grid-item-fixed">
          <div className="line">
            <span>{tx.timestamp.time}</span>
          </div>
          <div className="line">
            <span>{tx.timestamp.date}</span>
          </div>
          <div className="line wide">
            <span>Type {tx.type}</span>
          </div>
        </div>
      </div>
    );
  }
}

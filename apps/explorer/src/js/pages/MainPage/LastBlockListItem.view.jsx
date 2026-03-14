import PropTypes from 'prop-types';
import React from 'react';

import BlockRef from '../../components/BlockRef';

export class LastBlockListItem extends React.PureComponent {
  static propTypes = {
    block: PropTypes.object.isRequired,
  };

  render() {
    const block = this.props.block;
    const emptyClassName = block.transactions > 0 ? '' : ' empty-block';
    const rowClassName = `grid panel-row block-img-handler${emptyClassName}`;

    return (
      <div className={rowClassName}>
        <div className="block-img grid-item-fixed"></div>
        <div>
          <div className="line">
            Block <BlockRef height={block.height} /> contains{' '}
            <span className="bold">{block.transactions}</span> transactions
          </div>
          <div className="line no-wrap">
            <span>{block.id ? `ID: ${block.id}` : `Signature: ${block.signature}`}</span>
          </div>
        </div>
        <div className="divider divider-dashed md-hide sm-show grid-item-fixed"></div>
        <div className="md-hide sm-show grid-item-fixed">
          <div className="line">
            <span>{block.timestamp.time}</span>
          </div>
          <div className="line">
            <span>{block.timestamp.date}</span>
          </div>
        </div>
      </div>
    );
  }
}

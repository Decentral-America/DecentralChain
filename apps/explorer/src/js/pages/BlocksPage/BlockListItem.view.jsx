import PropTypes from 'prop-types';
import React from 'react';
import BlockRef from '../../components/BlockRef';
import EndpointRef from '../../components/EndpointRef';

export class BlockListItem extends React.Component {
  static propTypes = {
    block: PropTypes.object.isRequired,
  };

  render() {
    const { block } = this.props;
    const rowClassName = block.transactions > 0 ? '' : 'empty-block';

    return (
      <tr className={rowClassName}>
        <td data-label="№ / Timestamp" className="block-img-handler nowrap">
          <div className="block-img sm-hide"></div>
          <div className="line no-wrap">
            <BlockRef height={block.height} />
          </div>
          <div className="line no-break">
            <span>
              {block.timestamp.time}, {block.timestamp.date}
            </span>
          </div>
        </td>
        <td data-label="Base Target">
          <div className="line bold">{block.baseTarget}</div>
        </td>
        <td data-label="Block ID / Generator">
          <div className="line no-wrap">
            <span>{block.id || block.signature}</span>
          </div>
          <div className="line no-wrap">
            <EndpointRef endpoint={block.generator} />
          </div>
        </td>
        <td data-label="TXs">
          <div className="line">{block.transactions}</div>
        </td>
      </tr>
    );
  }
}

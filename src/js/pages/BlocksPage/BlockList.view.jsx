import PropTypes from 'prop-types';
import React from 'react';

import { BlockListItem } from './BlockListItem.view';

export class BlockList extends React.Component {
  static propTypes = {
    blocks: PropTypes.arrayOf(PropTypes.object).isRequired,
  };

  render() {
    return (
      <table className="blocks table-sm-transform">
        <thead>
          <tr>
            <th className="timestamp">№ / Timestamp</th>
            <th className="target nowrap">Base Target</th>
            <th>Block ID / Generator</th>
            <th className="txs">TXs</th>
          </tr>
        </thead>
        <tbody>
          {this.props.blocks.map((block) => {
            return <BlockListItem key={block.height} block={block} />;
          })}
        </tbody>
      </table>
    );
  }
}

import PropTypes from 'prop-types';
import React from 'react';

import { PeerListItem } from './PeerListItem.view';

export class PeerList extends React.Component {
  static propTypes = {
    peers: PropTypes.arrayOf(PropTypes.object).isRequired,
  };

  render() {
    return (
      <table className="table-sm-transform">
        <thead>
          <tr>
            <th>Address</th>
            <th>Declared address</th>
            <th>Node name</th>
            <th>Node nonce</th>
          </tr>
        </thead>
        <tbody>
          {this.props.peers.map((peer) => {
            return <PeerListItem key={peer.address.toString()} peer={peer} />;
          })}
        </tbody>
      </table>
    );
  }
}

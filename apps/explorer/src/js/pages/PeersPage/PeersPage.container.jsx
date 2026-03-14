import React from 'react';
import Loader from '../../components/Loader';
import ServiceFactory from '../../services/ServiceFactory';
import EventBuilder from '../../shared/analytics/EventBuilder';
import { withRouter } from '../../withRouter';
import { PeerList } from './PeerList.view';

class PeersPage extends React.Component {
  state = {
    peers: [],
  };

  componentDidMount() {
    const event = new EventBuilder().peers().events().show().build();
    ServiceFactory.global().analyticsService().sendEvent(event);
  }

  componentDidUpdate(prevProps) {
    if (this.props.params.networkId !== prevProps.params.networkId) {
      this.fetchData();
    }
  }

  fetchData = () => {
    const { networkId } = this.props.params;

    return ServiceFactory.forNetwork(networkId)
      .peersService()
      .loadPeers()
      .then((peers) => this.setState({ peers }));
  };

  render() {
    return (
      <div className="loaderWrapper">
        <Loader fetchData={this.fetchData} errorTitle="Failed to load peer details">
          <div className="content card">
            <div className="headline">
              <span className="title large">Peers</span>
              <span className="right">
                <span>Connected </span>
                <span className="bold">{this.state.peers.length}</span>
              </span>
            </div>
            {this.state.peers.length && <PeerList peers={this.state.peers} />}
          </div>
        </Loader>
      </div>
    );
  }
}

export const RoutedPeersPage = withRouter(PeersPage);

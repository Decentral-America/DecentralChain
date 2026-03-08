import React from 'react';
import Loader from '../../components/Loader';
import ServiceFactory from '../../services/ServiceFactory';
import { withRouter } from '../../withRouter';
import { GroupedAliasList } from './GroupedAliasList.view';

class GroupedAliasListContainer extends React.Component {
  state = {
    aliases: [],
  };

  fetchData = () => {
    const { address, networkId } = this.props.params;
    const addressService = ServiceFactory.forNetwork(networkId).addressService();

    return addressService.loadAliases(address).then((aliases) => this.setState({ aliases }));
  };

  render() {
    return (
      <Loader fetchData={this.fetchData} errorTitle="Failed to load aliases">
        <GroupedAliasList aliases={this.state.aliases} />
      </Loader>
    );
  }
}

const RoutedGroupedAliasListContainer = withRouter(GroupedAliasListContainer);

export default RoutedGroupedAliasListContainer;

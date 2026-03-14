import PropTypes from 'prop-types';
import React from 'react';

import EndpointRef from '../../components/EndpointRef';
import { withRouter } from '../../withRouter';

class Address extends React.PureComponent {
  static propTypes = {
    address: PropTypes.string,
  };

  render() {
    const currentAddress = this.props.params.address;
    const { address } = this.props;

    if (!address) return null;

    if (address === currentAddress) return <span>{address}</span>;

    return <EndpointRef endpoint={address} appearance="regular" />;
  }
}

export default withRouter(Address);

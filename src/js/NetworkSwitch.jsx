import PropTypes from 'prop-types';
import React from 'react';
import Modal from 'react-modal';
import ConfigurationForm from './ConfigurationForm';
import ServiceFactory from './services/ServiceFactory';
import EventBuilder from './shared/analytics/EventBuilder';

const Network = ({ networkId, displayName, onSwitchNetwork }) => {
  return (
    <button type="button" onClick={() => onSwitchNetwork(networkId)}>
      {displayName}
    </button>
  );
};

const extractEditableConfiguration = (configuration) =>
  (({ apiBaseUrl }) => ({ apiBaseUrl }))(configuration);

const NetworkShape = PropTypes.shape({
  networkId: PropTypes.string,
  displayName: PropTypes.string,
  url: PropTypes.string,
  apiBaseUrl: PropTypes.string,
  spamListUrl: PropTypes.string,
});

export default class NetworkSwitch extends React.PureComponent {
  static propTypes = {
    current: NetworkShape.isRequired,
    networks: PropTypes.arrayOf(NetworkShape).isRequired,
    custom: NetworkShape,
    onSwitchNetwork: PropTypes.func,
    onUpdateCustomNetwork: PropTypes.func,
  };

  static defaultProps = {
    onSwitchNetwork: () => {},
    onUpdateCustomNetwork: () => {},
  };

  state = {
    showNetworks: false,
    showModal: false,
  };

  toggleModal = () => {
    const showModal = !this.state.showModal;
    if (showModal) {
      const event = new EventBuilder().settings().events().show().build();
      ServiceFactory.global().analyticsService().sendEvent(event);
    }

    this.setState({ showModal });
  };

  toggleNetworks = () => {
    this.setState({ showNetworks: !this.state.showNetworks });
  };

  switchNetwork = (networkId) => {
    this.setState({ showNetworks: false });

    this.props.onSwitchNetwork(networkId);
  };

  render() {
    const { current, networks } = this.props;
    const listClassName = `network-list${this.state.showNetworks ? ' expanded' : ''}`;

    const custom = this.props.custom || {
      apiBaseUrl: '',
    };
    const configuration = extractEditableConfiguration(custom);

    return (
      <div>
        <div className="network-switcher">
          <div className="current-network">
            <i className="network-icon-active"></i>
            <button type="button" className={listClassName} onClick={this.toggleNetworks}>
              {current.displayName}
            </button>
            <div className="network-list-expanded">
              {networks
                .filter((item) => item.networkId !== current.networkId)
                .map((item) => {
                  return (
                    <Network key={item.networkId} {...item} onSwitchNetwork={this.switchNetwork} />
                  );
                })}
            </div>
          </div>
          <button type="button" className="settings-button" onClick={this.toggleModal}></button>
        </div>
        <Modal
          className="modal-content"
          isOpen={this.state.showModal}
          onRequestClose={this.toggleModal}
          contentLabel="Modal example"
          overlayClassName="modal-overlay"
        >
          <ConfigurationForm
            onClose={this.toggleModal}
            title="Custom"
            onSubmit={this.props.onUpdateCustomNetwork}
            values={configuration}
          />
        </Modal>
      </div>
    );
  }
}

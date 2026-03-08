import React from 'react';
import Headline from '../../components/Headline';
import Loader from '../../components/Loader';
import ServiceFactory from '../../services/ServiceFactory';
import { withRouter } from '../../withRouter';
import transactionMapper from '../SingleAddressPage/TransactionMapper';
import { TransactionList } from './TransactionList.view';

class TransactionCardContainer extends React.Component {
  state = {
    tx: [],
  };

  componentDidUpdate(prevProps) {
    if (this.props.params.networkId !== prevProps.params.networkId) {
      this.fetchData();
    }
  }

  componentWillUnmount() {
    this.removeRefreshInterval();
  }

  initialFetch = () => {
    return this.fetchData().then(this.setRefreshInterval);
  };

  fetchData = () => {
    const { networkId } = this.props.params;
    const faucet = ServiceFactory.global().configurationService().get(networkId).faucet;

    if (!faucet) return Promise.reject(new Error('Faucet is not configured for current network'));

    return ServiceFactory.forNetwork(networkId)
      .faucetService()
      .loadTransactions()
      .then((transactions) => transactionMapper(transactions, faucet.address))
      .then((tx) => this.setState({ tx }));
  };

  setRefreshInterval = () => {
    this.interval = setInterval(() => this.fetchData(), 5000);
  };

  removeRefreshInterval = () => {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  };

  render() {
    return (
      <Loader fetchData={this.initialFetch} errorTitle="Failed to load faucet transactions">
        <div className="card">
          <Headline title="Faucet Transactions" copyVisible={false} />
          <TransactionList transactions={this.state.tx} />
        </div>
      </Loader>
    );
  }
}

export const RoutedTransactionCardContainer = withRouter(TransactionCardContainer);

import { dccAddress2eth, dccAsset2Eth, ethAddress2dcc } from '@decentralchain/node-api-js';
import React from 'react';
import ServiceFactory from '../../services/ServiceFactory';
import { getNetworkByte } from '../../shared/utils';
import { ConverterItem } from './ConverterItem';

export class ConvertEthPage extends React.Component {
  state = {
    address: '',
    asset: '',
  };

  convertW2EAddress = (value) => dccAddress2eth(value);
  convertE2WAddress = (value) => {
    const { networkId } = ServiceFactory.global()
      .configurationService()
      .get(this.props.params.networkId);
    return ethAddress2dcc(value, getNetworkByte(networkId));
  };

  convertW2EAsset = (value) => dccAsset2Eth(value);
  convertE2WAsset = async (value) => {
    const { networkId } = ServiceFactory.global()
      .configurationService()
      .get(this.props.params.networkId);
    return await ServiceFactory.forNetwork(networkId).assetService().convertEth2Dcc(value);
  };

  render() {
    return (
      <div className="loaderWrapper">
        <div className="content card">
          <ConverterItem
            title="Address"
            convertW2E={this.convertW2EAddress}
            convertE2W={this.convertE2WAddress}
            key="address"
          />
          <ConverterItem
            title="Asset"
            convertW2E={this.convertW2EAsset}
            convertE2W={this.convertE2WAsset}
            key="asset"
          />
        </div>
      </div>
    );
  }
}

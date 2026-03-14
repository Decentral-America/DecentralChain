const nodeUrl = 'https://testnet-node.decentralchain.io';

export default {
  networkId: 'testnet',
  displayName: 'Testnet',
  apiBaseUrl: nodeUrl,
  useCustomRequestConfig: true,
  dataServicesBaseUrl: 'https://data-service.decentralchain.io/v0',
  nodes: [
    { url: nodeUrl, maintainer: 'DCC', showAsLink: true },
    { url: 'https://testnet-node1.decentralchain.io', maintainer: 'DCC', showAsLink: true },
    { url: 'https://testnet-node2.decentralchain.io', maintainer: 'DCC', showAsLink: true },
  ],
};

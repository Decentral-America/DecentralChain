const nodeUrl = 'https://stagenet-node.decentralchain.io';

export default {
  networkId: 'stagenet',
  displayName: 'Stagenet',
  apiBaseUrl: nodeUrl,
  useCustomRequestConfig: true,
  dataServicesBaseUrl: 'https://data-service.decentralchain.io/v0',
  nodes: [{ url: nodeUrl, maintainer: 'DCC', showAsLink: true }],
};

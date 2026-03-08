const nodeUrl = 'https://devnet-node.decentralchain.io';
export default {
  networkId: 'devnet',
  displayName: 'Devnet',
  apiBaseUrl: nodeUrl,
  useCustomRequestConfig: false,
  nodes: [{ url: nodeUrl, maintainer: 'DCC', showAsLink: true }],
};

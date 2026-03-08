import devnet from './config.devnet';
import mainnet from './config.mainnet';
import stagenet from './config.stagenet';
import testnet from './config.testnet';

const configuredNetworks = [mainnet, stagenet, testnet, devnet].filter((item) =>
  __NETWORKS__.includes(item.networkId),
);

export default configuredNetworks;

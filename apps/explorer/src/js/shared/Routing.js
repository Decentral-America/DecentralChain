import { ethAddress2dcc, ethTxId2dcc } from '@decentralchain/node-api-js';
import { getNetworkByte } from './utils';

export const routeParamsBuilder = (networks) => {
  const _regex = networks.map((network) => network.networkId).join('|');

  return {
    networkId: `:networkId?`,
    blockHeight: ':height',
    transactionId: ':transactionId',
    leaseId: ':leaseId',
    address: ':address',
    alias: ':alias',
    assetId: ':assetId',
    tab: ':tab',
  };
};

export const routeBuilder = (networkId) => {
  const root = networkId ? `/${networkId}` : '';
  const blocks = `${root}/blocks`;

  return {
    root,
    nodes: {
      list: `${root}/nodes`,
    },
    peers: {
      list: `${root}/peers`,
    },
    blocks: {
      list: blocks,
      one: (height) => `${blocks}/${height}`,
    },
    transactions: {
      one: (id) => {
        const txId = id.startsWith('0x') && id.length === 66 ? ethTxId2dcc(id) : id;
        return `${root}/tx/${txId}`;
      },
    },
    leases: {
      one: (id) => `${root}/leases/${id}`,
    },
    addresses: {
      one: (address, tab) => {
        if (address.startsWith('0x') && address.length === 42)
          address = ethAddress2dcc(address, getNetworkByte(networkId));

        let result = `${root}/address/${address}`;

        if (tab) result += `/${tab}`;

        return result;
      },
    },
    aliases: {
      one: (alias) => `${root}/aliases/${alias}`,
    },
    assets: {
      one: (assetId) => `${root}/assets/${assetId}`,
    },
    faucet: `${root}/faucet`,
    converters: `${root}/converters`,
  };
};

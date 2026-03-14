import {
  data,
  fetchAddresses,
  fetchBalanceDetails,
  fetchScriptInfo,
  fetchScriptInfoMeta,
  fetchValidate,
} from '@decentralchain/node-api-js/api-node/addresses';
import { fetchByAddress, fetchByAlias } from '@decentralchain/node-api-js/api-node/alias';
import {
  fetchAssetsAddressLimit,
  fetchAssetsBalance,
  fetchDetails,
} from '@decentralchain/node-api-js/api-node/assets';
import {
  fetchBlockAt,
  fetchDelay,
  fetchHeadersAt,
  fetchHeadersLast,
  fetchHeadersSeq,
  fetchHeight,
  fetchHeightById,
} from '@decentralchain/node-api-js/api-node/blocks';
import { fetchLeasingInfo } from '@decentralchain/node-api-js/api-node/leasing';
import { fetchNodeVersion } from '@decentralchain/node-api-js/api-node/node';
import { fetchConnected } from '@decentralchain/node-api-js/api-node/peers';
import {
  fetchInfo,
  fetchTransactions,
  fetchUnconfirmed,
  fetchUnconfirmedSize,
} from '@decentralchain/node-api-js/api-node/transactions';
import DateTime from '../DateTime';
import Strings from '../Strings';

const TRANSACTIONS_BY_ADDRESS_LIMIT = 100;
const ASSETS_PER_PAGE = 100;

const postJson = async (url, body) => {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return res.json();
};

const replaceTimestampWithDateTime = (obj) => {
  if (obj.timestamp) {
    obj.timestamp = new DateTime(obj.timestamp);
  }

  return obj;
};

const transformTimestampToDateTime = (responseData) => {
  if (Array.isArray(responseData)) {
    responseData.forEach(replaceTimestampWithDateTime);
  } else {
    replaceTimestampWithDateTime(responseData);
  }

  return responseData;
};

const toArray = (x) => (Array.isArray(x) ? x : [x]);

export const nodeApi = (baseUrl) => {
  const trimmedUrl = Strings.trimEnd(baseUrl, '/');

  return {
    version: () => fetchNodeVersion(baseUrl),
    baseTarget: () =>
      fetchHeadersLast(baseUrl).then((resp) => resp['nxt-consensus']['base-target']),
    addresses: {
      details: (address) => fetchBalanceDetails(baseUrl, address),
      aliases: (address) => fetchByAddress(baseUrl, address),
      validate: (address) => fetchValidate(baseUrl, address),
      data: (address) => data(baseUrl, address),
      scriptInfo: (address) => fetchScriptInfo(baseUrl, address),
      scriptMeta: (address) => fetchScriptInfoMeta(baseUrl, address),
      wallet: () => fetchAddresses(baseUrl),
    },
    blocks: {
      height: () => fetchHeight(baseUrl),
      heightById: (id) => fetchHeightById(baseUrl, id),
      delay: (id, blockNum) => fetchDelay(baseUrl, id, blockNum),
      at: (height) =>
        fetchBlockAt(baseUrl, height).then((response) => transformTimestampToDateTime(response)),
      headers: {
        last: () =>
          fetchHeadersLast(baseUrl).then((response) => transformTimestampToDateTime(response)),
        at: (height) =>
          fetchHeadersAt(baseUrl, height).then((response) =>
            transformTimestampToDateTime(response),
          ),
        sequence: (from, to) =>
          fetchHeadersSeq(baseUrl, from, to).then((response) =>
            transformTimestampToDateTime(response),
          ),
      },
    },
    transactions: {
      unconfirmed: () => fetchUnconfirmed(baseUrl),
      utxSize: () => fetchUnconfirmedSize(baseUrl),
      info: (id) => fetchInfo(baseUrl, id),
      leaseInfo: (ids) => fetchLeasingInfo(baseUrl, ids),
      status: async (idsArray) => {
        const limit = 1000;
        const subarray = [];
        for (let i = 0; i < Math.ceil(idsArray.length / limit); i++) {
          subarray[i] = idsArray.slice(i * limit, i * limit + limit);
        }

        const res = await Promise.all(
          subarray.map(async (ids) => postJson(`${trimmedUrl}/transactions/status`, { ids })),
        );

        return [].concat(...res);
      },
      address: (address, limit = TRANSACTIONS_BY_ADDRESS_LIMIT, after) =>
        fetchTransactions(baseUrl, address, limit, after),
    },
    aliases: {
      address: (alias) => fetchByAlias(baseUrl, alias),
    },
    assets: {
      balance: (address) => fetchAssetsBalance(baseUrl, address),
      details: (assetId) => fetchDetails(baseUrl, assetId),
      detailsMultiple: async (idsArray) => {
        const limit = 100;
        const subarray = [];
        for (let i = 0; i < Math.ceil(idsArray.length / limit); i++) {
          subarray[i] = idsArray.slice(i * limit, i * limit + limit);
        }

        const res = await Promise.all(
          subarray.map(async (ids) => postJson(`${trimmedUrl}/assets/details`, { ids })),
        );

        return [].concat(...res);
      },
      nft: (address, limit = ASSETS_PER_PAGE, after) =>
        fetchAssetsAddressLimit(
          baseUrl,
          address,
          limit,
          after ? { body: new URLSearchParams({ after: after }) } : undefined,
        ),
      convertEth2Dcc: (id) => fetch(`${trimmedUrl}/eth/assets?id=${id}`).then((res) => res.json()),
    },
    leasing: {
      info: (id) => fetchLeasingInfo(baseUrl, toArray(id)),
    },
    peers: () => fetchConnected(baseUrl),
  };
};

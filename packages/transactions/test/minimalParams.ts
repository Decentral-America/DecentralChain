import { TRANSACTION_TYPE } from '@decentralchain/ts-types';
import {
  type IAliasParams,
  type IBurnParams,
  type ICancelLeaseParams,
  type ICancelOrderParams,
  type IDataParams,
  type IInvokeScriptParams,
  type IIssueParams,
  type ILeaseParams,
  type IMassTransferParams,
  type IOrderParams,
  type IReissueParams,
  type ISetAssetScriptParams,
  type ISetScriptParams,
  type ISponsorshipParams,
  type ITransferParams,
  type IUpdateAssetInfoParams,
} from '../src/transactions';

export const aliasMinimalParams: IAliasParams = {
  alias: 'mytestalias',
};

export const burnMinimalParams: IBurnParams = {
  amount: 10000,
  assetId: 'DT5bC1S6XfpH7s4hcQQkLj897xnnXQPNgYbohX7zZKcr',
};

export const leaseMinimalParams: ILeaseParams = {
  amount: 1,
  recipient: '3N3Cn2pYtqzj7N9pviSesNe8KG9Cmb718Y1',
};

export const cancelLeaseMinimalParams: ICancelLeaseParams = {
  leaseId: 'DT5bC1S6XfpH7s4hcQQkLj897xnnXQPNgYbohX7zZKcr',
};

export const invokeScriptMinimalParams: IInvokeScriptParams = {
  call: {
    args: [
      {
        type: 'binary',
        value: 'base64:AQa3b8tH',
      },
      {
        type: 'list',
        value: [
          {
            type: 'string',
            value: 'aaa',
          },
          {
            type: 'string',
            value: 'bbb',
          },
        ],
      },
    ],
    function: 'foo',
  },
  dApp: '3N3Cn2pYtqzj7N9pviSesNe8KG9Cmb718Y1',
};

export const massTransferMinimalParams: IMassTransferParams = {
  transfers: [
    {
      amount: 1,
      recipient: '3N3Cn2pYtqzj7N9pviSesNe8KG9Cmb718Y1',
    },
  ],
};

export const orderMinimalParams: IOrderParams = {
  amount: 1233,
  amountAsset: null,
  matcherPublicKey: 'DT5bC1S6XfpH7s4hcQQkLj897xnnXQPNgYbohX7zZKcr',
  orderType: 'buy',
  price: 10000,
  priceAsset: '474jTeYx2r2Va35794tCScAXWJG9hU2HcgxzMowaZUnu',
};

export const cancelOrderMinimalParams: ICancelOrderParams = {
  orderId: '47YGqHdHtNPjcjE69E9EX9aD9bpC8PRKr4kp5AcZKHFq',
};

export const dataMinimalParams: IDataParams = {
  data: [
    {
      key: 'someparam',
      value: Uint8Array.from([1, 2, 3, 4]),
    },
    {
      key: 'someparam2',
      type: 'binary',
      value: 'base64:YXNkYQ==',
    },
    {
      key: 'someparam3',
      value: true,
    },
  ],
} as any;

export const reissueMinimalParams: IReissueParams = {
  assetId: 'DT5bC1S6XfpH7s4hcQQkLj897xnnXQPNgYbohX7zZKcr',
  quantity: 1,
  reissuable: false,
};

export const issueMinimalParams: IIssueParams = {
  description: '',
  name: 'test',
  quantity: 1,
};

export const transferMinimalParams: ITransferParams = {
  amount: 1,
  recipient: '3N3Cn2pYtqzj7N9pviSesNe8KG9Cmb718Y1',
};

const setScriptMinimalParams: ISetScriptParams = {
  script: 'AQa3b8tH',
};

export const setAssetScriptMinimalParams: ISetAssetScriptParams = {
  assetId: 'syXBywr2HVY7wxqkaci1jKY73KMpoLh46cp1peJAZNJ',
  script: 'base64:AQa3b8tH',
};

export const sponsorshipMinimalParams: ISponsorshipParams = {
  assetId: 'syXBywr2HVY7wxqkaci1jKY73KMpoLh46cp1peJAZNJ',
  minSponsoredAssetFee: 100,
};

export const updateAssetInfoMinimalParams: IUpdateAssetInfoParams = {
  assetId: 'syXBywr2HVY7wxqkaci1jKY73KMpoLh46cp1peJAZNJ',
  description: '',
  name: 'xxxx',
};

const _minimalParams = {
  [TRANSACTION_TYPE.ISSUE]: issueMinimalParams,
  [TRANSACTION_TYPE.TRANSFER]: transferMinimalParams,
  [TRANSACTION_TYPE.REISSUE]: reissueMinimalParams,
  [TRANSACTION_TYPE.BURN]: burnMinimalParams,
  [TRANSACTION_TYPE.LEASE]: leaseMinimalParams,
  [TRANSACTION_TYPE.CANCEL_LEASE]: cancelLeaseMinimalParams,
  [TRANSACTION_TYPE.ALIAS]: aliasMinimalParams,
  [TRANSACTION_TYPE.MASS_TRANSFER]: massTransferMinimalParams,
  [TRANSACTION_TYPE.DATA]: dataMinimalParams,
  [TRANSACTION_TYPE.SET_SCRIPT]: setScriptMinimalParams,
  [TRANSACTION_TYPE.SET_ASSET_SCRIPT]: setAssetScriptMinimalParams,
  [TRANSACTION_TYPE.INVOKE_SCRIPT]: invokeScriptMinimalParams,
  [TRANSACTION_TYPE.SPONSORSHIP]: sponsorshipMinimalParams,
  [TRANSACTION_TYPE.UPDATE_ASSET_INFO]: updateAssetInfoMinimalParams,
};

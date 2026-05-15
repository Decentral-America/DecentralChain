import {
  type SignerAliasTx,
  type SignerBurnTx,
  type SignerCancelLeaseTx,
  type SignerDataTx,
  type SignerInvokeTx,
  type SignerIssueTx,
  type SignerLeaseTx,
  type SignerMassTransferTx,
  type SignerReissueTx,
  type SignerSetAssetScriptTx,
  type SignerSetScriptTx,
  type SignerSponsorshipTx,
  type SignerTransferTx,
} from '@decentralchain/signer';
import { TRANSACTION_TYPE } from '../../src/transaction-type';

const assetId = '7sP5abE9nGRwZxkgaEXgkQDZ3ERBcm9PLHixaUE5SYoT';
const leaseId = '6r2u8Bf3WTqJw4HQvPTsWs8Zak5PLwjzjjGU76nXph1u';
const aliasStr = 'merry';
const recipient = '3N5HNJz5otiUavvoPrxMBrXBVv5HhYLdhiD';
const script = 'base64:BQbtKNoM';
const attachment = 'base64:BQbtKNoM';
const amount = 123456790;
const longMax = '9223372036854775807';
const dApp = '3My2kBJaGfeM2koiZroaYdd3y8rAgfV2EAx';

export const ISSUE: SignerIssueTx = {
  decimals: 8,
  description: 'Full description of ShortToken',
  name: 'ShortToken',
  quantity: longMax,
  reissuable: true,
  script: script,
  type: TRANSACTION_TYPE.ISSUE,
};

export const TRANSFER: SignerTransferTx = {
  amount: amount,
  assetId: assetId,
  attachment: attachment,
  recipient,
  type: TRANSACTION_TYPE.TRANSFER,
};

export const REISSUE: SignerReissueTx = {
  assetId: assetId,
  quantity: amount,
  reissuable: true,
  type: TRANSACTION_TYPE.REISSUE,
};

export const BURN: SignerBurnTx = {
  amount: amount,
  assetId: assetId,
  type: TRANSACTION_TYPE.BURN,
};

export const LEASE: SignerLeaseTx = {
  amount: amount,
  recipient: recipient,
  type: TRANSACTION_TYPE.LEASE,
};

export const CANCEL_LEASE: SignerCancelLeaseTx = {
  leaseId: leaseId,
  type: TRANSACTION_TYPE.CANCEL_LEASE,
};

export const ALIAS: SignerAliasTx = {
  alias: aliasStr,
  type: TRANSACTION_TYPE.ALIAS,
};

export const MASS_TRANSFER: SignerMassTransferTx = {
  assetId: assetId,
  attachment: attachment,
  transfers: [
    {
      amount: 1,
      recipient: 'testy',
    },
    {
      amount: 1,
      recipient: 'merry',
    },
  ],
  type: TRANSACTION_TYPE.MASS_TRANSFER,
};

export const DATA: SignerDataTx = {
  data: [
    { key: 'stringValue', type: 'string', value: 'Lorem ipsum dolor sit amet' },
    { key: 'longMaxValue', type: 'integer', value: longMax },
    { key: 'flagValue', type: 'boolean', value: true },
    { key: 'base64', type: 'binary', value: script },
  ],
  type: TRANSACTION_TYPE.DATA,
};

export const SET_SCRIPT: SignerSetScriptTx = {
  script: script,
  type: TRANSACTION_TYPE.SET_SCRIPT,
};

export const SPONSORSHIP: SignerSponsorshipTx = {
  assetId: assetId,
  minSponsoredAssetFee: amount,
  type: TRANSACTION_TYPE.SPONSORSHIP,
};

export const SET_ASSET_SCRIPT: SignerSetAssetScriptTx = {
  assetId: assetId,
  script: script,
  type: TRANSACTION_TYPE.SET_ASSET_SCRIPT,
};

export const INVOKE: SignerInvokeTx = {
  call: {
    args: [
      { type: 'binary', value: 'base64:BQbtKNoM' },
      { type: 'boolean', value: true },
      { type: 'integer', value: longMax },
      { type: 'string', value: 'Lorem ipsum dolor sit amet' },
    ],
    function: 'someFunctionToCall',
  },
  dApp: dApp,
  payment: [
    {
      amount: 1,
      assetId: null,
    },
    {
      amount: 1,
      assetId: assetId,
    },
  ],
  type: TRANSACTION_TYPE.INVOKE_SCRIPT,
};

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
const longMin = '-9223372036854775808';
const dApp = '3My2kBJaGfeM2koiZroaYdd3y8rAgfV2EAx';
const dAppMinFee = 1000000;
const scriptTrue = 'base64:BQbtKNoM';
// compiled version of `scriptTest.ride`
const scriptTest =
  'base64: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';

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

export const INVOKE_DEFAULT_CALL: SignerInvokeTx = {
  call: {
    args: [],
    function: 'default',
  },
  dApp: dApp,
  fee: dAppMinFee,
  payment: [],
  type: TRANSACTION_TYPE.INVOKE_SCRIPT,
};

export const INVOKE_NO_ARGS_SINGLE_PAYMENTS: SignerInvokeTx = {
  call: {
    args: [],
    function: 'callWithPaymentsButNoArgs',
  },
  dApp: dApp,
  fee: dAppMinFee,
  payment: [
    {
      amount: longMax,
      assetId: 'DCC',
    },
  ],
  type: TRANSACTION_TYPE.INVOKE_SCRIPT,
};

export const INVOKE_NO_ARGS_MANY_PAYMENTS: SignerInvokeTx = {
  call: {
    args: [],
    function: 'callWithPaymentsButNoArgs',
  },
  dApp: dApp,
  fee: dAppMinFee,
  payment: [
    {
      amount: 1,
      assetId: 'DCC',
    },
    {
      amount: 1,
      assetId: 'DCC',
    },
    {
      amount: 1,
      assetId: 'DCC',
    },
    {
      amount: 1,
      assetId: 'DCC',
    },
    {
      amount: 1,
      assetId: 'DCC',
    },
    {
      amount: 1,
      assetId: 'DCC',
    },
    {
      amount: 1,
      assetId: 'DCC',
    },
    {
      amount: 1,
      assetId: 'DCC',
    },
    {
      amount: 1,
      assetId: 'DCC',
    },
    {
      amount: 1,
      assetId: 'DCC',
    },
  ],
  type: TRANSACTION_TYPE.INVOKE_SCRIPT,
};

export const INVOKE_NATIVE_ARGS_NO_PAYMENTS: SignerInvokeTx = {
  call: {
    args: [
      { type: 'binary', value: 'base64:BQbtKNoM' },
      { type: 'boolean', value: true },
      { type: 'integer', value: longMax },
      { type: 'string', value: 'Lorem ipsum dolor sit amet' },
    ],
    function: 'callWithNativeArgsAndNoPayments',
  },
  dApp: dApp,
  fee: dAppMinFee,
  payment: [],
  type: TRANSACTION_TYPE.INVOKE_SCRIPT,
};

export const INVOKE_LIST_ARGS_NO_PAYMENTS: SignerInvokeTx = {
  call: {
    args: [
      {
        type: 'list',
        value: [
          { type: 'binary', value: scriptTrue },
          { type: 'binary', value: scriptTest },
        ],
      },
      {
        type: 'list',
        value: [
          { type: 'boolean', value: true },
          { type: 'boolean', value: false },
        ],
      },
      {
        type: 'list',
        value: [
          { type: 'integer', value: longMax },
          { type: 'integer', value: longMin },
        ],
      },
      {
        type: 'list',
        value: [
          { type: 'string', value: 'Lorem ipsum' },
          { type: 'string', value: 'dolor sit amet' },
        ],
      },
    ],
    function: 'callWithListArgsAndNoPayments',
  },
  dApp: dApp,
  fee: dAppMinFee,
  payment: [],
  type: TRANSACTION_TYPE.INVOKE_SCRIPT,
};

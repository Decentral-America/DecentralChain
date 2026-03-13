import { BigNumber } from '@decentralchain/bignumber';
import { Asset, Money } from '@decentralchain/data-entities';
import { libs, seedUtils } from '@decentralchain/transactions';
import { type IExchangeTransactionOrder } from '@decentralchain/ts-types';
import {
  currentCreateOrderFactory,
  SeedAdapter,
  SIGN_TYPE,
  Signable,
  type TSignData,
} from '../src';

const Seed = seedUtils.Seed;

const seed = Seed.create();
const seedAddress = libs.crypto.address(seed.phrase, 'W');

const CONFIG = {
  calculate_fee_rules: {
    '3': {
      fee: new BigNumber(100000000),
    },
    '5': {
      fee: new BigNumber(100000000),
    },
    '7': {
      add_smart_account_fee: false,
      fee: new BigNumber(300000),
    },
    '11': {
      price_per_transfer: new BigNumber(50000),
    },
    '12': {
      price_per_kb: new BigNumber(100000),
    },
    '13': {
      fee: new BigNumber(1000000),
    },
    '14': {
      fee: new BigNumber(100000000),
    },
    '15': {
      fee: new BigNumber(100000000),
    },
    default: {
      add_smart_account_fee: true,
      add_smart_asset_fee: true,
      fee: new BigNumber(100000),
      min_price_step: new BigNumber(100000),
      nftFee: new BigNumber(100000),
    },
  },
  smart_account_extra_fee: new BigNumber(400000),
  smart_asset_extra_fee: new BigNumber(400000),
};

const DCC_ASSET = new Asset({
  description: 'DecentralCoin',
  height: 0,
  id: 'DCC',
  name: 'DecentralCoin',
  precision: 8,
  quantity: new BigNumber('1000000000000000'),
  reissuable: false,
  sender: seedAddress,
  ticker: 'DCC',
  timestamp: new Date(),
});

const TEST_ASSET = new Asset({
  description: 'Some text',
  height: 100,
  id: 'Gtb1WRznfchDnTh37ezoDTJ4wcoKaRsKqKjJjy7nm2zU',
  name: 'Test',
  precision: 5,
  quantity: new BigNumber(10000),
  reissuable: false,
  sender: seedAddress,
  ticker: undefined,
  timestamp: new Date(),
});

const TEST_LIST: Array<ITestItem> = [
  {
    data: {
      data: {
        amount: new Money(1, TEST_ASSET),
        fee: new Money(CONFIG.calculate_fee_rules.default.fee, DCC_ASSET),
        recipient: seedAddress,
        timestamp: Date.now(),
      },
      type: SIGN_TYPE.TRANSFER,
    },
    fee: new BigNumber(500000),
    hasScript: true,
    smartAssetIdList: undefined,
  },
  {
    data: {
      data: {
        amount: new Money(1, TEST_ASSET),
        fee: new Money(CONFIG.calculate_fee_rules.default.fee, DCC_ASSET),
        recipient: seedAddress,
        timestamp: Date.now(),
      },
      type: SIGN_TYPE.TRANSFER,
    },
    fee: new BigNumber(100000),
    hasScript: false,
    smartAssetIdList: [],
  },
  {
    data: {
      data: {
        amount: new Money(1, TEST_ASSET),
        fee: new Money(CONFIG.calculate_fee_rules.default.fee, DCC_ASSET),
        recipient: seedAddress,
        timestamp: Date.now(),
      },
      type: SIGN_TYPE.TRANSFER,
    },
    fee: new BigNumber(900000),
    hasScript: true,
    smartAssetIdList: [TEST_ASSET.id],
  },
  {
    data: {
      data: {
        description: 'My asset description',
        fee: new Money(CONFIG.calculate_fee_rules['3'].fee, DCC_ASSET),
        name: 'My Asset',
        precision: 1,
        quantity: new BigNumber(500),
        reissuable: true,
        timestamp: Date.now(),
        version: 2,
      },
      type: SIGN_TYPE.ISSUE,
    },
    fee: new BigNumber(100000000),
    hasScript: false,
    smartAssetIdList: undefined,
  },
  {
    data: {
      data: {
        description: 'My asset description',
        fee: new Money(CONFIG.calculate_fee_rules['3'].fee, DCC_ASSET),
        name: 'My Asset',
        precision: 1,
        quantity: new BigNumber(500),
        reissuable: true,
        timestamp: Date.now(),
        version: 2,
      },
      type: SIGN_TYPE.ISSUE,
    },
    fee: new BigNumber(100400000),
    hasScript: true,
    smartAssetIdList: undefined,
  },
  {
    data: {
      data: {
        assetId: TEST_ASSET.id,
        fee: new Money(CONFIG.calculate_fee_rules['5'].fee, DCC_ASSET),
        quantity: new BigNumber(500),
        reissuable: true,
        timestamp: Date.now(),
        version: 2,
      },
      type: SIGN_TYPE.REISSUE,
    },
    fee: new BigNumber(100400000),
    hasScript: true,
    smartAssetIdList: undefined,
  },
  {
    data: {
      data: {
        assetId: TEST_ASSET.id,
        fee: new Money(CONFIG.calculate_fee_rules['5'].fee, DCC_ASSET),
        quantity: new BigNumber(500),
        reissuable: true,
        timestamp: Date.now(),
        version: 2,
      },
      type: SIGN_TYPE.REISSUE,
    },
    fee: new BigNumber(100000000),
    hasScript: false,
    smartAssetIdList: undefined,
  },
  {
    data: {
      data: {
        assetId: TEST_ASSET.id,
        fee: new Money(CONFIG.calculate_fee_rules['5'].fee, DCC_ASSET),
        quantity: new BigNumber(500),
        reissuable: true,
        timestamp: Date.now(),
        version: 2,
      },
      type: SIGN_TYPE.REISSUE,
    },
    fee: new BigNumber(100800000),
    hasScript: true,
    smartAssetIdList: [TEST_ASSET.id],
  },
  {
    data: {
      data: {
        amount: new BigNumber(500),
        assetId: TEST_ASSET.id,
        fee: new Money(CONFIG.calculate_fee_rules.default.fee, DCC_ASSET),
        timestamp: Date.now(),
        version: 2,
      },
      type: SIGN_TYPE.BURN,
    },
    fee: new BigNumber(100000),
    hasScript: false,
    smartAssetIdList: undefined,
  },
  {
    data: {
      data: {
        amount: new BigNumber(500),
        assetId: TEST_ASSET.id,
        fee: new Money(CONFIG.calculate_fee_rules.default.fee, DCC_ASSET),
        timestamp: Date.now(),
        version: 2,
      },
      type: SIGN_TYPE.BURN,
    },
    fee: new BigNumber(500000),
    hasScript: true,
    smartAssetIdList: undefined,
  },
  {
    data: {
      data: {
        amount: new BigNumber(500),
        assetId: TEST_ASSET.id,
        fee: new Money(CONFIG.calculate_fee_rules.default.fee, DCC_ASSET),
        timestamp: Date.now(),
        version: 2,
      },
      type: SIGN_TYPE.BURN,
    },
    fee: new BigNumber(900000),
    hasScript: true,
    smartAssetIdList: [TEST_ASSET.id],
  },
  {
    data: {
      data: {
        amount: new BigNumber(500),
        fee: new Money(CONFIG.calculate_fee_rules.default.fee, DCC_ASSET),
        recipient: seedAddress,
        timestamp: Date.now(),
        version: 2,
      },
      type: SIGN_TYPE.LEASE,
    },
    fee: new BigNumber(100000),
    hasScript: false,
    smartAssetIdList: [TEST_ASSET.id],
  },
  {
    data: {
      data: {
        amount: new BigNumber(500),
        fee: new Money(CONFIG.calculate_fee_rules.default.fee, DCC_ASSET),
        recipient: seedAddress,
        timestamp: Date.now(),
        version: 2,
      },
      type: SIGN_TYPE.LEASE,
    },
    fee: new BigNumber(500000),
    hasScript: true,
    smartAssetIdList: [TEST_ASSET.id],
  },
  {
    data: {
      data: {
        fee: new Money(CONFIG.calculate_fee_rules.default.fee, DCC_ASSET),
        leaseId: TEST_ASSET.id,
        timestamp: Date.now(),
        version: 2,
      },
      type: SIGN_TYPE.CANCEL_LEASING,
    },
    fee: new BigNumber(100000),
    hasScript: false,
    smartAssetIdList: [TEST_ASSET.id],
  },
  {
    data: {
      data: {
        fee: new Money(CONFIG.calculate_fee_rules.default.fee, DCC_ASSET),
        leaseId: TEST_ASSET.id,
        timestamp: Date.now(),
        version: 2,
      },
      type: SIGN_TYPE.CANCEL_LEASING,
    },
    fee: new BigNumber(500000),
    hasScript: true,
    smartAssetIdList: [TEST_ASSET.id],
  },
  {
    data: {
      data: {
        alias: 'some',
        fee: new Money(CONFIG.calculate_fee_rules.default.fee, DCC_ASSET),
        timestamp: Date.now(),
        version: 2,
      },
      type: SIGN_TYPE.CREATE_ALIAS,
    },
    fee: new BigNumber(100000),
    hasScript: false,
    smartAssetIdList: [TEST_ASSET.id],
  },
  {
    data: {
      data: {
        alias: '123123123123123123123123123343',
        fee: new Money(CONFIG.calculate_fee_rules.default.fee, DCC_ASSET),
        timestamp: Date.now(),
        version: 2,
      },
      type: SIGN_TYPE.CREATE_ALIAS,
    },
    fee: new BigNumber(500000),
    hasScript: true,
    smartAssetIdList: [TEST_ASSET.id],
  },
  {
    data: {
      data: {
        assetId: TEST_ASSET.id,
        fee: new Money(CONFIG.calculate_fee_rules.default.fee, DCC_ASSET),
        timestamp: Date.now(),
        totalAmount: new Money(1, TEST_ASSET),
        transfers: [
          {
            amount: 1,
            recipient: seedAddress,
          },
        ],
      },
      type: SIGN_TYPE.MASS_TRANSFER,
    },
    fee: new BigNumber(200000),
    hasScript: false,
    smartAssetIdList: [],
  },
  {
    data: {
      data: {
        assetId: TEST_ASSET.id,
        fee: new Money(CONFIG.calculate_fee_rules.default.fee, DCC_ASSET),
        timestamp: Date.now(),
        totalAmount: new Money(1, TEST_ASSET),
        transfers: [
          {
            amount: 1,
            recipient: seedAddress,
          },
        ],
      },
      type: SIGN_TYPE.MASS_TRANSFER,
    },
    fee: new BigNumber(600000),
    hasScript: false,
    smartAssetIdList: [TEST_ASSET.id],
  },
  {
    data: {
      data: {
        assetId: TEST_ASSET.id,
        fee: new Money(CONFIG.calculate_fee_rules.default.fee, DCC_ASSET),
        timestamp: Date.now(),
        totalAmount: new Money(1, TEST_ASSET),
        transfers: [
          {
            amount: 1,
            recipient: seedAddress,
          },
        ],
      },
      type: SIGN_TYPE.MASS_TRANSFER,
    },
    fee: new BigNumber(1000000),
    hasScript: true,
    smartAssetIdList: [TEST_ASSET.id],
  },
  {
    data: {
      data: {
        assetId: TEST_ASSET.id,
        fee: new Money(CONFIG.calculate_fee_rules.default.fee, DCC_ASSET),
        timestamp: Date.now(),
        totalAmount: new Money(1, TEST_ASSET),
        transfers: [
          {
            amount: 1,
            recipient: seedAddress,
          },
          {
            amount: 1,
            recipient: seedAddress,
          },
        ],
      },
      type: SIGN_TYPE.MASS_TRANSFER,
    },
    fee: new BigNumber(200000),
    hasScript: false,
    smartAssetIdList: [],
  },
  {
    data: {
      data: {
        assetId: TEST_ASSET.id,
        fee: new Money(CONFIG.calculate_fee_rules.default.fee, DCC_ASSET),
        timestamp: Date.now(),
        totalAmount: new Money(1, TEST_ASSET),
        transfers: [
          {
            amount: 1,
            recipient: seedAddress,
          },
          {
            amount: 1,
            recipient: seedAddress,
          },
        ],
      },
      type: SIGN_TYPE.MASS_TRANSFER,
    },
    fee: new BigNumber(600000),
    hasScript: false,
    smartAssetIdList: [TEST_ASSET.id],
  },
  {
    data: {
      data: {
        assetId: TEST_ASSET.id,
        fee: new Money(CONFIG.calculate_fee_rules.default.fee, DCC_ASSET),
        timestamp: Date.now(),
        totalAmount: new Money(1, TEST_ASSET),
        transfers: [
          {
            amount: 1,
            recipient: seedAddress,
          },
          {
            amount: 1,
            recipient: seedAddress,
          },
        ],
      },
      type: SIGN_TYPE.MASS_TRANSFER,
    },
    fee: new BigNumber(1000000),
    hasScript: true,
    smartAssetIdList: [TEST_ASSET.id],
  },
  {
    data: {
      data: {
        assetId: TEST_ASSET.id,
        fee: new Money(CONFIG.calculate_fee_rules.default.fee, DCC_ASSET),
        timestamp: Date.now(),
        totalAmount: new Money(1, TEST_ASSET),
        transfers: [
          {
            amount: 1,
            recipient: seedAddress,
          },
          {
            amount: 1,
            recipient: seedAddress,
          },
          {
            amount: 1,
            recipient: seedAddress,
          },
        ],
      },
      type: SIGN_TYPE.MASS_TRANSFER,
    },
    fee: new BigNumber(300000),
    hasScript: false,
    smartAssetIdList: [],
  },
  {
    data: {
      data: {
        assetId: TEST_ASSET.id,
        fee: new Money(CONFIG.calculate_fee_rules.default.fee, DCC_ASSET),
        timestamp: Date.now(),
        totalAmount: new Money(1, TEST_ASSET),
        transfers: [
          {
            amount: 1,
            recipient: seedAddress,
          },
          {
            amount: 1,
            recipient: seedAddress,
          },
          {
            amount: 1,
            recipient: seedAddress,
          },
        ],
      },
      type: SIGN_TYPE.MASS_TRANSFER,
    },
    fee: new BigNumber(700000),
    hasScript: false,
    smartAssetIdList: [TEST_ASSET.id],
  },
  {
    data: {
      data: {
        assetId: TEST_ASSET.id,
        fee: new Money(CONFIG.calculate_fee_rules.default.fee, DCC_ASSET),
        timestamp: Date.now(),
        totalAmount: new Money(1, TEST_ASSET),
        transfers: [
          {
            amount: 1,
            recipient: seedAddress,
          },
          {
            amount: 1,
            recipient: seedAddress,
          },
          {
            amount: 1,
            recipient: seedAddress,
          },
        ],
      },
      type: SIGN_TYPE.MASS_TRANSFER,
    },
    fee: new BigNumber(1100000),
    hasScript: true,
    smartAssetIdList: [TEST_ASSET.id],
  },
  {
    data: {
      data: {
        data: [{ key: 'test', type: 'string', value: '123' }],
        fee: new Money(1, DCC_ASSET),
        timestamp: Date.now(),
        version: 1,
      },
      type: SIGN_TYPE.DATA,
    },
    fee: new BigNumber(100000),
    hasScript: false,
    smartAssetIdList: [TEST_ASSET.id],
  },
  {
    data: {
      data: {
        data: [{ key: 'test', type: 'string', value: '123' }],
        fee: new Money(1, DCC_ASSET),
        timestamp: Date.now(),
        version: 1,
      },
      type: SIGN_TYPE.DATA,
    },
    fee: new BigNumber(500000),
    hasScript: true,
    smartAssetIdList: [TEST_ASSET.id],
  },
  {
    data: {
      data: {
        fee: new Money(1, DCC_ASSET),
        script: '',
        timestamp: Date.now(),
        version: 1,
      },
      type: SIGN_TYPE.SET_SCRIPT,
    },
    fee: new BigNumber(1000000),
    hasScript: false,
    smartAssetIdList: [TEST_ASSET.id],
  },
  {
    data: {
      data: {
        fee: new Money(1, DCC_ASSET),
        script: '',
        timestamp: Date.now(),
        version: 1,
      },
      type: SIGN_TYPE.SET_SCRIPT,
    },
    fee: new BigNumber(1400000),
    hasScript: true,
    smartAssetIdList: [TEST_ASSET.id],
  },
  {
    data: {
      data: {
        fee: new Money(1, DCC_ASSET),
        minSponsoredAssetFee: new Money(1, TEST_ASSET),
        timestamp: Date.now(),
        version: 1,
      },
      type: SIGN_TYPE.SPONSORSHIP,
    },
    fee: new BigNumber(100000000),
    hasScript: false,
    smartAssetIdList: [TEST_ASSET.id],
  },
  {
    data: {
      data: {
        fee: new Money(1, DCC_ASSET),
        minSponsoredAssetFee: new Money(1, TEST_ASSET),
        timestamp: Date.now(),
        version: 1,
      },
      type: SIGN_TYPE.SPONSORSHIP,
    },
    fee: new BigNumber(100400000),
    hasScript: true,
    smartAssetIdList: [TEST_ASSET.id],
  },
  {
    data: {
      data: {
        assetId: TEST_ASSET.id,
        fee: new Money(1, DCC_ASSET),
        script: 'base64:AQa3b8tH',
        timestamp: Date.now(),
        version: 1,
      },
      type: SIGN_TYPE.SET_ASSET_SCRIPT,
    },
    fee: new BigNumber(100000000),
    hasScript: false,
    smartAssetIdList: [TEST_ASSET.id],
  },
  {
    data: {
      data: {
        assetId: TEST_ASSET.id,
        fee: new Money(1, DCC_ASSET),
        script: 'base64:AQa3b8tH',
        timestamp: Date.now(),
        version: 1,
      },
      type: SIGN_TYPE.SET_ASSET_SCRIPT,
    },
    fee: new BigNumber(100400000),
    hasScript: true,
    smartAssetIdList: [TEST_ASSET.id],
  },
];

const ORDER: IExchangeTransactionOrder<BigNumber> = {
  amount: new BigNumber(10),
  assetPair: {
    amountAsset: TEST_ASSET.id,
    priceAsset: 'DWgwcZTMhSvnyYCoWLRUXXSH1RSkzThXLJhww9gwkqdn',
  },
  expiration: Date.now() + 1000 * 60 * 60,
  matcherFee: new BigNumber(300000),
  matcherPublicKey: '7kPFrHDiGw1rCm7LPszuECwWYL3dMf6iMifLRDJQZMzy',
  orderType: 'sell',
  price: new BigNumber(5),
  timestamp: Date.now(),
} as any;

interface ITestItem {
  data: TSignData;
  hasScript: boolean;
  smartAssetIdList: Array<string> | undefined;
  fee: BigNumber;
}

describe('Current fee list', () => {
  TEST_LIST.forEach((item, index) => {
    const scriptInfo = item.hasScript ? 'with script' : 'without script';

    it(`Test item with type ${item.data.type}, ${scriptInfo}, № ${index + 1}`, async () => {
      const signable = new Signable(item.data, new SeedAdapter('dsafsdaf dsa fsdf sa', 'W'));
      const fee = await signable.getFee(CONFIG, item.hasScript, item.smartAssetIdList);
      expect(fee.toFixed()).toBe(item.fee.toFixed());
    });
  });

  describe('Create order', () => {
    const currentOrderFee = currentCreateOrderFactory(CONFIG, new BigNumber(300000));

    it('Simple', () => {
      const fee = currentOrderFee(ORDER);
      expect(fee).toEqual(new BigNumber(300000));
    });

    it('With matcher script', () => {
      const fee = currentOrderFee(ORDER, true);
      expect(fee).toEqual(new BigNumber(700000));
    });

    it('With script and one smart asset', () => {
      const fee = currentOrderFee(ORDER, true, [TEST_ASSET.id]);
      expect(fee).toEqual(new BigNumber(1100000));
    });

    it('Without script and two smart asset', () => {
      const fee = currentOrderFee(ORDER, false, [
        ORDER.assetPair.amountAsset,
        ORDER.assetPair.priceAsset,
      ]);
      expect(fee).toEqual(new BigNumber(1100000));
    });

    it('With script and two smart asset', () => {
      const fee = currentOrderFee(ORDER, true, [
        ORDER.assetPair.amountAsset,
        ORDER.assetPair.priceAsset,
      ]);
      expect(fee).toEqual(new BigNumber(1500000));
    });
  });
});

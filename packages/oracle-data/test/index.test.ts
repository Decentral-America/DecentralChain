import { describe, expect, it } from 'vitest';
import {
  getProviderData,
  getProviderAssets,
  getFields,
  getDifferenceByData,
} from '../src/index.js';
import type { IErrorResponse, IProviderData, TDataTxField, TScamAsset } from '../src/interface.js';
import {
  DATA_ENTRY_TYPES,
  DATA_PROVIDER_KEYS,
  DATA_PROVIDER_VERSIONS,
  RESPONSE_STATUSES,
  STATUS_LIST,
} from '../src/constants.js';
import { toHash } from '../src/utils/index.js';

const PROVIDER_DATA = {
  version: DATA_PROVIDER_VERSIONS.BETA,
  name: 'Provider name',
  link: 'https://some.provider.com',
  email: 'provider@mail.ru',
  description: {
    en: 'Some en description!',
  },
};

const VERIFIED_ASSET = {
  id: '8LQW8f7P5d5PZM7GtZEBgaqRPGSzS3DfPuiXrURJ4AJS',
  version: DATA_PROVIDER_VERSIONS.BETA,
  status: STATUS_LIST.VERIFIED,
  ticker: 'BTC',
  link: 'https://btc.com',
  email: 'support@btc.com',
  logo: 'some-logo',
  description: {
    en: 'Some BTC en description',
  },
};

const SCAM_ASSET: TScamAsset = {
  id: '9M1wcQwS2XvpbeWALsE5n3j4s97nuipZJzVZ1wXJAqdJ',
  version: DATA_PROVIDER_VERSIONS.BETA,
  status: STATUS_LIST.SCAM,
};

const SCAM_ASSET_FIELDS: Array<TDataTxField> = [
  {
    key: 'version_<9M1wcQwS2XvpbeWALsE5n3j4s97nuipZJzVZ1wXJAqdJ>',
    type: DATA_ENTRY_TYPES.INTEGER,
    value: SCAM_ASSET.version,
  },
  {
    key: 'status_<9M1wcQwS2XvpbeWALsE5n3j4s97nuipZJzVZ1wXJAqdJ>',
    type: DATA_ENTRY_TYPES.INTEGER,
    value: SCAM_ASSET.status,
  },
];

const VERIFIED_ASSET_FIELDS: Array<TDataTxField> = [
  {
    key: 'version_<8LQW8f7P5d5PZM7GtZEBgaqRPGSzS3DfPuiXrURJ4AJS>',
    type: DATA_ENTRY_TYPES.INTEGER,
    value: VERIFIED_ASSET.version,
  },
  {
    key: 'status_<8LQW8f7P5d5PZM7GtZEBgaqRPGSzS3DfPuiXrURJ4AJS>',
    type: DATA_ENTRY_TYPES.INTEGER,
    value: VERIFIED_ASSET.status,
  },
  {
    key: 'logo_<8LQW8f7P5d5PZM7GtZEBgaqRPGSzS3DfPuiXrURJ4AJS>',
    type: DATA_ENTRY_TYPES.STRING,
    value: VERIFIED_ASSET.logo,
  },
  {
    key: 'link_<8LQW8f7P5d5PZM7GtZEBgaqRPGSzS3DfPuiXrURJ4AJS>',
    type: DATA_ENTRY_TYPES.STRING,
    value: VERIFIED_ASSET.link,
  },
  {
    key: 'ticker_<8LQW8f7P5d5PZM7GtZEBgaqRPGSzS3DfPuiXrURJ4AJS>',
    type: DATA_ENTRY_TYPES.STRING,
    value: VERIFIED_ASSET.ticker,
  },
  {
    key: 'email_<8LQW8f7P5d5PZM7GtZEBgaqRPGSzS3DfPuiXrURJ4AJS>',
    type: DATA_ENTRY_TYPES.STRING,
    value: VERIFIED_ASSET.email,
  },
  {
    key: 'description_<en>_<8LQW8f7P5d5PZM7GtZEBgaqRPGSzS3DfPuiXrURJ4AJS>',
    type: DATA_ENTRY_TYPES.STRING,
    value: VERIFIED_ASSET.description.en,
  },
];

const PROVIDER_FIELDS: Array<TDataTxField> = [
  {
    key: DATA_PROVIDER_KEYS.VERSION,
    type: DATA_ENTRY_TYPES.INTEGER,
    value: DATA_PROVIDER_VERSIONS.BETA,
  },
  { key: DATA_PROVIDER_KEYS.NAME, type: DATA_ENTRY_TYPES.STRING, value: PROVIDER_DATA.name },
  { key: DATA_PROVIDER_KEYS.LINK, type: DATA_ENTRY_TYPES.STRING, value: PROVIDER_DATA.link },
  { key: DATA_PROVIDER_KEYS.EMAIL, type: DATA_ENTRY_TYPES.STRING, value: PROVIDER_DATA.email },
  { key: DATA_PROVIDER_KEYS.LANG_LIST, type: DATA_ENTRY_TYPES.STRING, value: 'en' },
  {
    key: 'data_provider_description_<en>',
    type: DATA_ENTRY_TYPES.STRING,
    value: PROVIDER_DATA.description.en,
  },
];

const compareFields: (a: TDataTxField[], b: TDataTxField[]) => void = (a, b) => {
  const hashable = toHash<TDataTxField>('key');
  expect(hashable(a)).toEqual(hashable(b));
};

describe('Data provider tests', () => {
  describe('Get data from data transaction fields', () => {
    describe('Provider Data', () => {
      it('Get full provider data from fields', () => {
        const result = getProviderData(PROVIDER_FIELDS);
        expect(result.status).toEqual(RESPONSE_STATUSES.OK);
        expect(result.content).toEqual(PROVIDER_DATA);
      });

      it('Get data from empty fields', () => {
        const result = getProviderData([]) as IErrorResponse<IProviderData>;
        expect(result.status).toEqual(RESPONSE_STATUSES.ERROR);
        expect(result.errors.length).toEqual(1);
        expect(result.errors[0].path).toEqual('version');
      });

      it('Get data from fields without email', () => {
        const fieldsWithoutEmail = PROVIDER_FIELDS.filter(
          (item) => item.key !== DATA_PROVIDER_KEYS.EMAIL,
        );
        const result = getProviderData(fieldsWithoutEmail) as IErrorResponse<IProviderData>;
        expect(result.status).toEqual(RESPONSE_STATUSES.ERROR);
        expect(result.errors.length).toEqual(1);
        expect(result.errors[0].path).toEqual('email');

        const content: Record<string, unknown> = { ...PROVIDER_DATA };
        delete content.email;

        expect(result.content).toEqual(content);
      });

      it('Get fields from provider data', () => {
        compareFields(getFields(PROVIDER_DATA), PROVIDER_FIELDS);
      });

      it('Get diff for transaction', () => {
        const provider = { ...PROVIDER_DATA, name: 'Better provider!' };
        const diff = getDifferenceByData(PROVIDER_DATA, provider);
        expect(diff.length).toEqual(1);
        const [field] = diff;
        expect(field.key).toEqual(DATA_PROVIDER_KEYS.NAME);
        expect(field.type).toEqual(DATA_ENTRY_TYPES.STRING);
        expect(field.value).toEqual('Better provider!');
      });
    });

    describe('Asset data', () => {
      it('Get verified asset data', () => {
        const fields = PROVIDER_FIELDS.concat(VERIFIED_ASSET_FIELDS);
        const result = getProviderAssets(fields);
        expect(result.length).toEqual(1);
        const [item] = result;
        expect(item.status).toEqual(RESPONSE_STATUSES.OK);
        expect(item.content).toEqual(VERIFIED_ASSET);
      });

      it('Get scam asset data', () => {
        const fields = PROVIDER_FIELDS.concat(SCAM_ASSET_FIELDS);
        const result = getProviderAssets(fields);
        expect(result.length).toEqual(1);
        const [item] = result;
        expect(item.status).toEqual(RESPONSE_STATUSES.OK);
        expect(item.content).toEqual(SCAM_ASSET);
      });

      it('Get fields from verified asset', () => {
        compareFields(getFields(VERIFIED_ASSET), VERIFIED_ASSET_FIELDS);
      });

      it('Get fields from scam asset', () => {
        compareFields(getFields(SCAM_ASSET), SCAM_ASSET_FIELDS);
      });
    });
  });
});

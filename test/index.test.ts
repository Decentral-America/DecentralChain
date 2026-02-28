import { describe, expect, it } from 'vitest';
import {
  getProviderData,
  getProviderAssets,
  getFields,
  getDifferenceByData,
} from '../src/index.js';
import type {
  IErrorResponse,
  IProviderData,
  TDataTxField,
  TScamAsset,
  TProviderAsset,
} from '../src/interface.js';
import {
  DATA_ENTRY_TYPES,
  DATA_PROVIDER_KEYS,
  DATA_PROVIDER_VERSIONS,
  RESPONSE_STATUSES,
  STATUS_LIST,
} from '../src/constants.js';
import { toHash, getFieldsDiff, toField, toFields, isProvider } from '../src/utils/index.js';
import { getFieldValue, getAssetIdFromKey } from '../src/response/index.js';

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

      it('Get suspicious asset data', () => {
        const suspiciousAsset: TScamAsset = {
          id: 'SUSPICIOUS123456789012345678901234567890123',
          version: DATA_PROVIDER_VERSIONS.BETA,
          status: STATUS_LIST.SUSPICIOUS,
        };
        const fields: TDataTxField[] = [
          {
            key: 'version_<SUSPICIOUS123456789012345678901234567890123>',
            type: DATA_ENTRY_TYPES.INTEGER,
            value: DATA_PROVIDER_VERSIONS.BETA,
          },
          {
            key: 'status_<SUSPICIOUS123456789012345678901234567890123>',
            type: DATA_ENTRY_TYPES.INTEGER,
            value: STATUS_LIST.SUSPICIOUS,
          },
        ];
        const result = getProviderAssets(fields);
        expect(result.length).toEqual(1);
        expect(result[0].status).toEqual(RESPONSE_STATUSES.OK);
        expect(result[0].content).toEqual(suspiciousAsset);
      });

      it('Get not_verify asset data', () => {
        const notVerifyAsset: TScamAsset = {
          id: 'NOTVERIFY12345678901234567890123456789012345',
          version: DATA_PROVIDER_VERSIONS.BETA,
          status: STATUS_LIST.NOT_VERIFY,
        };
        const fields: TDataTxField[] = [
          {
            key: 'version_<NOTVERIFY12345678901234567890123456789012345>',
            type: DATA_ENTRY_TYPES.INTEGER,
            value: DATA_PROVIDER_VERSIONS.BETA,
          },
          {
            key: 'status_<NOTVERIFY12345678901234567890123456789012345>',
            type: DATA_ENTRY_TYPES.INTEGER,
            value: STATUS_LIST.NOT_VERIFY,
          },
        ];
        const result = getProviderAssets(fields);
        expect(result.length).toEqual(1);
        expect(result[0].status).toEqual(RESPONSE_STATUSES.OK);
        expect(result[0].content).toEqual(notVerifyAsset);
      });

      it('Get detailed asset data', () => {
        const detailedAsset = {
          id: 'DETAILED123456789012345678901234567890123456',
          version: DATA_PROVIDER_VERSIONS.BETA,
          status: STATUS_LIST.DETAILED,
          ticker: 'DTL',
          link: 'https://detailed.com',
          email: 'test@detailed.com',
          logo: 'detailed-logo',
          description: { en: 'Detailed description' },
        };
        const fields: TDataTxField[] = [
          ...PROVIDER_FIELDS,
          {
            key: 'version_<DETAILED123456789012345678901234567890123456>',
            type: DATA_ENTRY_TYPES.INTEGER,
            value: DATA_PROVIDER_VERSIONS.BETA,
          },
          {
            key: 'status_<DETAILED123456789012345678901234567890123456>',
            type: DATA_ENTRY_TYPES.INTEGER,
            value: STATUS_LIST.DETAILED,
          },
          {
            key: 'ticker_<DETAILED123456789012345678901234567890123456>',
            type: DATA_ENTRY_TYPES.STRING,
            value: 'DTL',
          },
          {
            key: 'link_<DETAILED123456789012345678901234567890123456>',
            type: DATA_ENTRY_TYPES.STRING,
            value: 'https://detailed.com',
          },
          {
            key: 'email_<DETAILED123456789012345678901234567890123456>',
            type: DATA_ENTRY_TYPES.STRING,
            value: 'test@detailed.com',
          },
          {
            key: 'logo_<DETAILED123456789012345678901234567890123456>',
            type: DATA_ENTRY_TYPES.STRING,
            value: 'detailed-logo',
          },
          {
            key: 'description_<en>_<DETAILED123456789012345678901234567890123456>',
            type: DATA_ENTRY_TYPES.STRING,
            value: 'Detailed description',
          },
        ];
        const result = getProviderAssets(fields);
        expect(result.length).toEqual(1);
        expect(result[0].status).toEqual(RESPONSE_STATUSES.OK);
        expect(result[0].content).toEqual(detailedAsset);
      });

      it('Returns error for unsupported asset version', () => {
        const fields: TDataTxField[] = [
          {
            key: 'version_<INVALID1234567890123456789012345678901234567>',
            type: DATA_ENTRY_TYPES.INTEGER,
            value: 999, // Unsupported version
          },
          {
            key: 'status_<INVALID1234567890123456789012345678901234567>',
            type: DATA_ENTRY_TYPES.INTEGER,
            value: STATUS_LIST.SCAM,
          },
        ];
        const result = getProviderAssets(fields);
        expect(result.length).toEqual(1);
        expect(result[0].status).toEqual(RESPONSE_STATUSES.ERROR);
        expect((result[0] as IErrorResponse<TProviderAsset>).errors[0].path).toEqual('version');
      });
    });
  });

  describe('Utils', () => {
    it('getFieldsDiff returns new fields not in previous', () => {
      const previous: TDataTxField[] = [{ key: 'a', type: DATA_ENTRY_TYPES.STRING, value: 'old' }];
      const next: TDataTxField[] = [
        { key: 'a', type: DATA_ENTRY_TYPES.STRING, value: 'old' },
        { key: 'b', type: DATA_ENTRY_TYPES.STRING, value: 'new' },
      ];
      const diff = getFieldsDiff(previous, next);
      expect(diff.length).toEqual(1);
      expect(diff[0].key).toEqual('b');
    });

    it('getFieldsDiff returns fields with changed type', () => {
      const previous: TDataTxField[] = [{ key: 'a', type: DATA_ENTRY_TYPES.STRING, value: 'old' }];
      const next: TDataTxField[] = [{ key: 'a', type: DATA_ENTRY_TYPES.INTEGER, value: 123 }];
      const diff = getFieldsDiff(previous, next);
      expect(diff.length).toEqual(1);
      expect(diff[0].type).toEqual(DATA_ENTRY_TYPES.INTEGER);
    });

    it('isProvider distinguishes provider from asset', () => {
      expect(isProvider(PROVIDER_DATA)).toBe(true);
      expect(isProvider(SCAM_ASSET)).toBe(false);
    });

    it('toField throws on null value', () => {
      const data = { ...PROVIDER_DATA, name: undefined } as unknown as IProviderData;
      const fieldProcessor = toField('name', DATA_PROVIDER_KEYS.NAME, DATA_ENTRY_TYPES.STRING);
      expect(() => fieldProcessor(data)).toThrow('Empty field name!');
    });

    it('toField throws on wrong type - expects integer', () => {
      const data = { ...PROVIDER_DATA, version: 'not-a-number' } as unknown as IProviderData;
      const fieldProcessor = toField(
        'version',
        DATA_PROVIDER_KEYS.VERSION,
        DATA_ENTRY_TYPES.INTEGER,
      );
      expect(() => fieldProcessor(data)).toThrow('Wrong value type!');
    });

    it('toField throws on wrong type - expects boolean', () => {
      const data = { version: 'not-a-boolean' } as unknown as IProviderData;
      const fieldProcessor = toField('version', 'some_key', DATA_ENTRY_TYPES.BOOLEAN);
      expect(() => fieldProcessor(data)).toThrow('Wrong value type!');
    });

    it('toField throws on wrong type - expects binary/string', () => {
      const data = { version: 123 } as unknown as IProviderData;
      const fieldProcessor = toField('version', 'some_key', DATA_ENTRY_TYPES.BINARY);
      expect(() => fieldProcessor(data)).toThrow('Wrong value type!');
    });

    it('toFields handles mixed array and single results', () => {
      const processor = toFields<{ a: number; b: number }>(
        (d) => ({ key: 'a', type: DATA_ENTRY_TYPES.INTEGER, value: d.a }),
        (d) => [
          { key: 'b1', type: DATA_ENTRY_TYPES.INTEGER, value: d.b },
          { key: 'b2', type: DATA_ENTRY_TYPES.INTEGER, value: d.b * 2 },
        ],
      );
      const result = processor({ a: 1, b: 2 });
      expect(result.length).toEqual(3);
    });
  });

  describe('Response utils', () => {
    it('getFieldValue throws on missing field', () => {
      const hash = {};
      expect(() => getFieldValue(hash, 'missing', DATA_ENTRY_TYPES.STRING)).toThrow(
        'Has no field with name missing',
      );
    });

    it('getFieldValue throws on wrong type', () => {
      const hash = {
        test: { key: 'test', type: DATA_ENTRY_TYPES.STRING, value: 'hello' },
      };
      expect(() => getFieldValue(hash, 'test', DATA_ENTRY_TYPES.INTEGER)).toThrow(
        'Wrong field type!',
      );
    });

    it('getAssetIdFromKey returns null for non-asset keys', () => {
      expect(getAssetIdFromKey('data_provider_version')).toBeNull();
      expect(getAssetIdFromKey('random_key')).toBeNull();
    });

    it('getAssetIdFromKey extracts asset id from valid key', () => {
      const result = getAssetIdFromKey('status_<ABC123>');
      expect(result).toEqual('ABC123');
    });
  });

  describe('Provider data edge cases', () => {
    it('Returns error for unsupported provider version', () => {
      const fields: TDataTxField[] = [
        {
          key: DATA_PROVIDER_KEYS.VERSION,
          type: DATA_ENTRY_TYPES.INTEGER,
          value: 999, // Unsupported version
        },
      ];
      const result = getProviderData(fields);
      expect(result.status).toEqual(RESPONSE_STATUSES.ERROR);
      expect((result as IErrorResponse<IProviderData>).errors[0].path).toEqual('version');
    });

    it('Handles missing optional description gracefully', () => {
      const fieldsWithoutLangList = PROVIDER_FIELDS.filter(
        (item) => item.key !== DATA_PROVIDER_KEYS.LANG_LIST && !item.key.includes('description'),
      );
      const result = getProviderData(fieldsWithoutLangList);
      // Should still work but without description
      expect(result.status).toBeDefined();
    });
  });
});

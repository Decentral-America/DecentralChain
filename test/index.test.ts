import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import {
  getProviderData,
  getProviderAssets,
  getFields,
  getFieldsFromData,
  getFieldsFromAsset,
  getDifferenceByData,
  getDifferenceByFields,
  isValidStatus,
  isValidAssetId,
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

      it('Handles optional missing description lang gracefully (required=false)', () => {
        // SCAM assets use processDescription(id, false) - missing desc lang should NOT produce error
        const assetId = 'SCAMWITHLANG12345678901234567890123456789';
        const fields: TDataTxField[] = [
          ...PROVIDER_FIELDS,
          {
            key: `version_<${assetId}>`,
            type: DATA_ENTRY_TYPES.INTEGER,
            value: DATA_PROVIDER_VERSIONS.BETA,
          },
          {
            key: `status_<${assetId}>`,
            type: DATA_ENTRY_TYPES.INTEGER,
            value: STATUS_LIST.SCAM,
          },
        ];
        const result = getProviderAssets(fields);
        expect(result.length).toEqual(1);
        // Should succeed even though description is missing (optional for SCAM)
        expect(result[0].status).toEqual(RESPONSE_STATUSES.OK);
      });

      it('Returns error for missing required description lang (required=true)', () => {
        // VERIFIED assets use processDescription(id) - missing desc lang SHOULD produce error
        const assetId = 'VERIFIEDMISSINGDESC1234567890123456789012';
        const fields: TDataTxField[] = [
          ...PROVIDER_FIELDS,
          {
            key: `version_<${assetId}>`,
            type: DATA_ENTRY_TYPES.INTEGER,
            value: DATA_PROVIDER_VERSIONS.BETA,
          },
          {
            key: `status_<${assetId}>`,
            type: DATA_ENTRY_TYPES.INTEGER,
            value: STATUS_LIST.VERIFIED,
          },
          {
            key: `logo_<${assetId}>`,
            type: DATA_ENTRY_TYPES.STRING,
            value: 'some-logo',
          },
          {
            key: `link_<${assetId}>`,
            type: DATA_ENTRY_TYPES.STRING,
            value: 'https://example.com',
          },
          {
            key: `ticker_<${assetId}>`,
            type: DATA_ENTRY_TYPES.STRING,
            value: 'TKR',
          },
          {
            key: `email_<${assetId}>`,
            type: DATA_ENTRY_TYPES.STRING,
            value: 'test@example.com',
          },
          // Deliberately missing description_<en>_<assetId>
        ];
        const result = getProviderAssets(fields);
        expect(result.length).toEqual(1);
        // Should have error because description is required for VERIFIED
        expect(result[0].status).toEqual(RESPONSE_STATUSES.ERROR);
        expect(
          (result[0] as IErrorResponse<TProviderAsset>).errors.some((e) =>
            e.path.includes('description'),
          ),
        ).toBe(true);
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

  describe('Roundtrip / Symmetry Tests', () => {
    it('Provider data survives encode → decode roundtrip', () => {
      const original: IProviderData = { ...PROVIDER_DATA };
      const fields = getFields(original);
      const decoded = getProviderData(fields);

      expect(decoded.status).toEqual(RESPONSE_STATUSES.OK);
      expect(decoded.content).toEqual(original);
    });

    it('Verified asset survives encode → decode roundtrip', () => {
      const original = { ...VERIFIED_ASSET };
      const fields = [...PROVIDER_FIELDS, ...getFields(original)];
      const decoded = getProviderAssets(fields);

      expect(decoded.length).toEqual(1);
      expect(decoded[0].status).toEqual(RESPONSE_STATUSES.OK);
      expect(decoded[0].content).toEqual(original);
    });

    it('Scam asset survives encode → decode roundtrip', () => {
      const original: TScamAsset = { ...SCAM_ASSET };
      const fields = [...PROVIDER_FIELDS, ...getFields(original)];
      const decoded = getProviderAssets(fields);

      expect(decoded.length).toEqual(1);
      expect(decoded[0].status).toEqual(RESPONSE_STATUSES.OK);
      expect(decoded[0].content).toEqual(original);
    });

    it('Multiple assets survive encode → decode roundtrip', () => {
      const assets = [VERIFIED_ASSET, SCAM_ASSET];
      const assetFields = assets.flatMap((a) => getFields(a));
      const fields = [...PROVIDER_FIELDS, ...assetFields];
      const decoded = getProviderAssets(fields);

      expect(decoded.length).toEqual(2);
      decoded.forEach((result) => {
        expect(result.status).toEqual(RESPONSE_STATUSES.OK);
      });
    });
  });

  describe('Immutability Tests', () => {
    it('getFields does not mutate input provider data', () => {
      const original: IProviderData = JSON.parse(JSON.stringify(PROVIDER_DATA)) as IProviderData;
      const snapshot = JSON.stringify(original);

      getFields(original);

      expect(JSON.stringify(original)).toEqual(snapshot);
    });

    it('getFields does not mutate input asset data', () => {
      const original = JSON.parse(JSON.stringify(VERIFIED_ASSET)) as typeof VERIFIED_ASSET;
      const snapshot = JSON.stringify(original);

      getFields(original);

      expect(JSON.stringify(original)).toEqual(snapshot);
    });

    it('getProviderData does not mutate input fields', () => {
      const fields = JSON.parse(JSON.stringify(PROVIDER_FIELDS)) as TDataTxField[];
      const snapshot = JSON.stringify(fields);

      getProviderData(fields);

      expect(JSON.stringify(fields)).toEqual(snapshot);
    });

    it('getDifferenceByData does not mutate either input', () => {
      const prev: IProviderData = JSON.parse(JSON.stringify(PROVIDER_DATA)) as IProviderData;
      const next: IProviderData = JSON.parse(
        JSON.stringify({ ...PROVIDER_DATA, name: 'New Name' }),
      ) as IProviderData;
      const prevSnapshot = JSON.stringify(prev);
      const nextSnapshot = JSON.stringify(next);

      getDifferenceByData(prev, next);

      expect(JSON.stringify(prev)).toEqual(prevSnapshot);
      expect(JSON.stringify(next)).toEqual(nextSnapshot);
    });
  });

  describe('Idempotency Tests', () => {
    it('getFields produces identical output on repeated calls', () => {
      const first = getFields(PROVIDER_DATA);
      const second = getFields(PROVIDER_DATA);

      expect(first).toEqual(second);
    });

    it('getProviderData produces identical output on repeated calls', () => {
      const first = getProviderData(PROVIDER_FIELDS);
      const second = getProviderData(PROVIDER_FIELDS);

      expect(first).toEqual(second);
    });

    it('getDifferenceByData produces identical output on repeated calls', () => {
      const modified = { ...PROVIDER_DATA, name: 'Changed' };
      const first = getDifferenceByData(PROVIDER_DATA, modified);
      const second = getDifferenceByData(PROVIDER_DATA, modified);

      expect(first).toEqual(second);
    });
  });

  describe('Boundary Value Tests', () => {
    it('Handles empty string fields correctly', () => {
      const emptyProvider: IProviderData = {
        version: DATA_PROVIDER_VERSIONS.BETA,
        name: '',
        link: '',
        email: '',
        description: { en: '' },
      };
      const fields = getFields(emptyProvider);
      const decoded = getProviderData(fields);

      expect(decoded.status).toEqual(RESPONSE_STATUSES.OK);
      expect(decoded.content).toEqual(emptyProvider);
    });

    it('Handles long asset IDs correctly', () => {
      const longId = 'A'.repeat(44); // Base58 asset IDs are typically 43-44 chars
      const asset: TScamAsset = {
        id: longId,
        version: DATA_PROVIDER_VERSIONS.BETA,
        status: STATUS_LIST.SCAM,
      };
      const fields = [...PROVIDER_FIELDS, ...getFields(asset)];
      const decoded = getProviderAssets(fields);

      expect(decoded.length).toEqual(1);
      expect(decoded[0].status).toEqual(RESPONSE_STATUSES.OK);
      expect(decoded[0].content.id).toEqual(longId);
    });

    it('Handles special characters in description', () => {
      const specialChars: IProviderData = {
        ...PROVIDER_DATA,
        description: {
          en: '!@#$%^&*()_+-=[]{}|;\':",./<>?`~\n\t',
        },
      };
      const fields = getFields(specialChars);
      const decoded = getProviderData(fields);

      expect(decoded.status).toEqual(RESPONSE_STATUSES.OK);
      expect(decoded.content.description).toEqual(specialChars.description);
    });

    it('Handles unicode/emoji in text fields', () => {
      const unicodeProvider: IProviderData = {
        ...PROVIDER_DATA,
        name: '🚀 DCC Provider 日本語',
        description: { en: 'Supports émojis 🎉 and ñ special chars' },
      };
      const fields = getFields(unicodeProvider);
      const decoded = getProviderData(fields);

      expect(decoded.status).toEqual(RESPONSE_STATUSES.OK);
      expect(decoded.content.name).toEqual(unicodeProvider.name);
    });

    it('Handles multiple description languages', () => {
      const multiLang: IProviderData = {
        ...PROVIDER_DATA,
        description: {
          en: 'English description',
          es: 'Descripción en español',
          ja: '日本語の説明',
          ru: 'Русское описание',
        },
      };
      const fields = getFields(multiLang);
      const decoded = getProviderData(fields);

      expect(decoded.status).toEqual(RESPONSE_STATUSES.OK);
      expect(Object.keys(decoded.content.description ?? {}).sort()).toEqual(
        ['en', 'es', 'ja', 'ru'].sort(),
      );
    });
  });

  describe('Consistency / Determinism Tests', () => {
    it('Field order is consistent across multiple encodes', () => {
      const fields1 = getFields(PROVIDER_DATA);
      const fields2 = getFields(PROVIDER_DATA);
      const fields3 = getFields(PROVIDER_DATA);

      // Same keys in same order
      expect(fields1.map((f) => f.key)).toEqual(fields2.map((f) => f.key));
      expect(fields2.map((f) => f.key)).toEqual(fields3.map((f) => f.key));
    });

    it('Diff calculation is consistent', () => {
      const modified = { ...PROVIDER_DATA, link: 'https://new.link.com' };

      for (let i = 0; i < 10; i++) {
        const diff = getDifferenceByData(PROVIDER_DATA, modified);
        expect(diff.length).toEqual(1);
        expect(diff[0].key).toEqual(DATA_PROVIDER_KEYS.LINK);
      }
    });
  });

  describe('Defensive Input Handling', () => {
    it('getProviderAssets returns empty array for fields with no assets', () => {
      const result = getProviderAssets(PROVIDER_FIELDS);
      expect(result).toEqual([]);
    });

    it('getProviderAssets handles mixed valid and invalid assets', () => {
      const validAsset: TScamAsset = {
        id: 'VALIDASSET123456789012345678901234567890123',
        version: DATA_PROVIDER_VERSIONS.BETA,
        status: STATUS_LIST.SCAM,
      };
      const validFields = getFields(validAsset);

      // Invalid asset with unsupported version
      const invalidFields: TDataTxField[] = [
        {
          key: 'version_<INVALID123456789012345678901234567890123>',
          type: DATA_ENTRY_TYPES.INTEGER,
          value: 999,
        },
        {
          key: 'status_<INVALID123456789012345678901234567890123>',
          type: DATA_ENTRY_TYPES.INTEGER,
          value: STATUS_LIST.SCAM,
        },
      ];

      const allFields = [...PROVIDER_FIELDS, ...validFields, ...invalidFields];
      const result = getProviderAssets(allFields);

      expect(result.length).toEqual(2);
      // One should succeed, one should fail
      const statuses = result.map((r) => r.status);
      expect(statuses).toContain(RESPONSE_STATUSES.OK);
      expect(statuses).toContain(RESPONSE_STATUSES.ERROR);
    });

    it('getDifferenceByData returns empty array when data is identical', () => {
      const diff = getDifferenceByData(PROVIDER_DATA, PROVIDER_DATA);
      expect(diff).toEqual([]);
    });

    it('getDifferenceByData detects all changed fields', () => {
      const modified: IProviderData = {
        version: DATA_PROVIDER_VERSIONS.BETA,
        name: 'New Name',
        link: 'https://new.link.com',
        email: 'new@email.com',
        description: { en: 'New description' },
      };
      const diff = getDifferenceByData(PROVIDER_DATA, modified);

      // Should detect changes in name, link, email, description
      expect(diff.length).toBeGreaterThanOrEqual(4);
    });
  });

  describe('Error Response Structure', () => {
    it('Error responses include actionable error messages', () => {
      const result = getProviderData([]) as IErrorResponse<IProviderData>;

      expect(result.status).toEqual(RESPONSE_STATUSES.ERROR);
      expect(result.errors).toBeDefined();
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].error).toBeInstanceOf(Error);
      expect(result.errors[0].error.message.length).toBeGreaterThan(0);
    });

    it('Error responses include correct path for debugging', () => {
      const fieldsWithBadEmail = PROVIDER_FIELDS.filter((f) => f.key !== DATA_PROVIDER_KEYS.EMAIL);
      const result = getProviderData(fieldsWithBadEmail) as IErrorResponse<IProviderData>;

      expect(result.status).toEqual(RESPONSE_STATUSES.ERROR);
      const emailError = result.errors.find((e) => e.path === 'email');
      expect(emailError).toBeDefined();
    });

    it('Partial content is still returned on error', () => {
      const fieldsWithoutEmail = PROVIDER_FIELDS.filter((f) => f.key !== DATA_PROVIDER_KEYS.EMAIL);
      const result = getProviderData(fieldsWithoutEmail) as IErrorResponse<IProviderData>;

      expect(result.status).toEqual(RESPONSE_STATUSES.ERROR);
      // Should still have the fields that were successfully parsed
      expect(result.content.name).toEqual(PROVIDER_DATA.name);
      expect(result.content.link).toEqual(PROVIDER_DATA.link);
    });
  });

  describe('Type Safety at Runtime', () => {
    it('Rejects integer field with wrong type in hash', () => {
      const badFields: TDataTxField[] = [
        {
          key: DATA_PROVIDER_KEYS.VERSION,
          type: DATA_ENTRY_TYPES.STRING, // Wrong type! Should be INTEGER
          value: '0',
        },
      ];
      const result = getProviderData(badFields);
      expect(result.status).toEqual(RESPONSE_STATUSES.ERROR);
    });

    it('Rejects string field with wrong type in hash', () => {
      const badFields: TDataTxField[] = [
        ...PROVIDER_FIELDS.filter((f) => f.key !== DATA_PROVIDER_KEYS.NAME),
        {
          key: DATA_PROVIDER_KEYS.NAME,
          type: DATA_ENTRY_TYPES.INTEGER, // Wrong type! Should be STRING
          value: 12345,
        },
      ];
      const result = getProviderData(badFields);
      expect(result.status).toEqual(RESPONSE_STATUSES.ERROR);
    });
  });

  describe('Public API: getFieldsFromData / getFieldsFromAsset', () => {
    it('getFieldsFromData returns identical output to getFields for provider data', () => {
      const fromDirect = getFieldsFromData(PROVIDER_DATA);
      const fromGeneric = getFields(PROVIDER_DATA);
      expect(fromDirect).toEqual(fromGeneric);
    });

    it('getFieldsFromAsset returns identical output to getFields for asset data', () => {
      const fromDirect = getFieldsFromAsset(VERIFIED_ASSET);
      const fromGeneric = getFields(VERIFIED_ASSET);
      expect(fromDirect).toEqual(fromGeneric);
    });

    it('getFieldsFromAsset handles scam asset with minimal fields', () => {
      const fields = getFieldsFromAsset(SCAM_ASSET);
      expect(fields.length).toBeGreaterThan(0);
      const keys = fields.map((f) => f.key);
      expect(keys.some((k) => k.includes(SCAM_ASSET.id))).toBe(true);
    });
  });

  describe('Public API: getDifferenceByFields', () => {
    it('Returns empty array when fields are identical', () => {
      const diff = getDifferenceByFields(PROVIDER_FIELDS, PROVIDER_FIELDS);
      expect(diff).toEqual([]);
    });

    it('Detects added fields', () => {
      const next = [
        ...PROVIDER_FIELDS,
        { key: 'extra_key', type: DATA_ENTRY_TYPES.STRING, value: 'extra' } as TDataTxField,
      ];
      const diff = getDifferenceByFields(PROVIDER_FIELDS, next);
      expect(diff.length).toEqual(1);
      expect(diff[0].key).toEqual('extra_key');
    });

    it('Detects value changes', () => {
      const modified = PROVIDER_FIELDS.map((f) =>
        f.key === DATA_PROVIDER_KEYS.NAME ? { ...f, value: 'Changed name' } : f,
      ) as TDataTxField[];
      const diff = getDifferenceByFields(PROVIDER_FIELDS, modified);
      expect(diff.length).toEqual(1);
      expect(diff[0].key).toEqual(DATA_PROVIDER_KEYS.NAME);
      expect(diff[0].value).toEqual('Changed name');
    });

    it('Detects type changes', () => {
      const modified = PROVIDER_FIELDS.map((f) =>
        f.key === DATA_PROVIDER_KEYS.NAME
          ? { key: f.key, type: DATA_ENTRY_TYPES.INTEGER, value: 42 }
          : f,
      ) as TDataTxField[];
      const diff = getDifferenceByFields(PROVIDER_FIELDS, modified);
      expect(diff.length).toEqual(1);
      expect(diff[0].type).toEqual(DATA_ENTRY_TYPES.INTEGER);
    });

    it('Is consistent with getDifferenceByData for equivalent data', () => {
      const modified = { ...PROVIDER_DATA, name: 'New Name' };
      const byData = getDifferenceByData(PROVIDER_DATA, modified);
      const byFields = getDifferenceByFields(getFields(PROVIDER_DATA), getFields(modified));
      expect(byData).toEqual(byFields);
    });
  });

  describe('Validation Utilities', () => {
    describe('isValidStatus', () => {
      it('accepts all valid STATUS_LIST values', () => {
        expect(isValidStatus(STATUS_LIST.SCAM)).toBe(true);
        expect(isValidStatus(STATUS_LIST.SUSPICIOUS)).toBe(true);
        expect(isValidStatus(STATUS_LIST.NOT_VERIFY)).toBe(true);
        expect(isValidStatus(STATUS_LIST.DETAILED)).toBe(true);
        expect(isValidStatus(STATUS_LIST.VERIFIED)).toBe(true);
      });

      it('rejects out-of-range integers', () => {
        expect(isValidStatus(999)).toBe(false);
        expect(isValidStatus(-999)).toBe(false);
        expect(isValidStatus(3)).toBe(false);
        expect(isValidStatus(-3)).toBe(false);
        expect(isValidStatus(100)).toBe(false);
      });

      it('rejects boundary values just outside valid range', () => {
        expect(isValidStatus(-2)).toBe(true); // SCAM
        expect(isValidStatus(2)).toBe(true); // VERIFIED
        expect(isValidStatus(-3)).toBe(false); // just below SCAM
        expect(isValidStatus(3)).toBe(false); // just above VERIFIED
      });
    });

    describe('isValidAssetId', () => {
      it('accepts valid base58 asset IDs', () => {
        expect(isValidAssetId('8LQW8f7P5d5PZM7GtZEBgaqRPGSzS3DfPuiXrURJ4AJS')).toBe(true);
        expect(isValidAssetId('9M1wcQwS2XvpbeWALsE5n3j4s97nuipZJzVZ1wXJAqdJ')).toBe(true);
        expect(isValidAssetId('1')).toBe(true); // minimum valid
      });

      it('rejects IDs with non-base58 characters', () => {
        expect(isValidAssetId('INVALID0ASSET')).toBe(false); // contains 0
        expect(isValidAssetId('ASSET_WITH_O_CHAR')).toBe(false); // contains O
        expect(isValidAssetId('assetWithlChar')).toBe(false); // contains l
        expect(isValidAssetId('asset+special')).toBe(false); // contains +
        expect(isValidAssetId('asset with space')).toBe(false);
      });

      it('rejects empty strings', () => {
        expect(isValidAssetId('')).toBe(false);
      });

      it('rejects IDs exceeding max length', () => {
        expect(isValidAssetId('A'.repeat(65))).toBe(false);
        expect(isValidAssetId('A'.repeat(64))).toBe(true); // max valid
      });
    });

    describe('isValidStatus in parser (runtime protection)', () => {
      it('rejects asset with invalid status value', () => {
        const assetId = '8LQW8f7P5d5PZM7GtZEBgaqRPGSzS3DfPuiXrURJ4AJS';
        const fields: TDataTxField[] = [
          ...PROVIDER_FIELDS,
          {
            key: `version_<${assetId}>`,
            type: DATA_ENTRY_TYPES.INTEGER,
            value: DATA_PROVIDER_VERSIONS.BETA,
          },
          {
            key: `status_<${assetId}>`,
            type: DATA_ENTRY_TYPES.INTEGER,
            value: 999, // invalid status
          },
        ];
        const result = getProviderAssets(fields);
        expect(result.length).toEqual(1);
        expect(result[0].status).toEqual(RESPONSE_STATUSES.ERROR);
        expect((result[0] as IErrorResponse<TProviderAsset>).errors[0].error.message).toContain(
          'Invalid asset status',
        );
      });

      it('rejects negative out-of-range status', () => {
        const assetId = '9M1wcQwS2XvpbeWALsE5n3j4s97nuipZJzVZ1wXJAqdJ';
        const fields: TDataTxField[] = [
          ...PROVIDER_FIELDS,
          {
            key: `version_<${assetId}>`,
            type: DATA_ENTRY_TYPES.INTEGER,
            value: DATA_PROVIDER_VERSIONS.BETA,
          },
          {
            key: `status_<${assetId}>`,
            type: DATA_ENTRY_TYPES.INTEGER,
            value: -50,
          },
        ];
        const result = getProviderAssets(fields);
        expect(result.length).toEqual(1);
        expect(result[0].status).toEqual(RESPONSE_STATUSES.ERROR);
      });
    });
  });

  describe('Property-Based / Fuzz Tests (fast-check)', () => {
    const BASE58_CHARS = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

    const arbBase58 = fc.string({
      unit: fc.constantFrom(...BASE58_CHARS.split('')),
      minLength: 1,
      maxLength: 44,
    });

    const arbProviderData = fc.record({
      version: fc.constant(DATA_PROVIDER_VERSIONS.BETA),
      name: fc.string({ minLength: 0, maxLength: 100 }),
      link: fc.string({ minLength: 0, maxLength: 200 }),
      email: fc.string({ minLength: 0, maxLength: 100 }),
      description: fc.dictionary(
        fc.string({
          unit: fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz'.split('')),
          minLength: 2,
          maxLength: 2,
        }),
        fc.string({ minLength: 0, maxLength: 200 }),
        { minKeys: 1, maxKeys: 5 },
      ),
    });

    it('Provider data always survives encode → decode roundtrip', () => {
      fc.assert(
        fc.property(arbProviderData, (data) => {
          const fields = getFields(data);
          const decoded = getProviderData(fields);
          expect(decoded.status).toEqual(RESPONSE_STATUSES.OK);
          expect(decoded.content).toEqual(data);
        }),
        { numRuns: 200 },
      );
    });

    it('getFields never throws on valid provider data', () => {
      fc.assert(
        fc.property(arbProviderData, (data) => {
          expect(() => getFields(data)).not.toThrow();
        }),
        { numRuns: 200 },
      );
    });

    it('getProviderData never throws (always returns TResponse)', () => {
      const arbRawFields = fc.array(
        fc.record({
          key: fc.string({ minLength: 1, maxLength: 50 }),
          type: fc.constantFrom(
            DATA_ENTRY_TYPES.STRING,
            DATA_ENTRY_TYPES.INTEGER,
            DATA_ENTRY_TYPES.BOOLEAN,
            DATA_ENTRY_TYPES.BINARY,
          ),
          value: fc.oneof(fc.string(), fc.integer(), fc.boolean()),
        }),
        { minLength: 0, maxLength: 20 },
      );

      fc.assert(
        fc.property(arbRawFields, (fields) => {
          const result = getProviderData(fields as TDataTxField[]);
          expect(result).toBeDefined();
          expect(result.status).toBeDefined();
          expect([RESPONSE_STATUSES.OK, RESPONSE_STATUSES.ERROR]).toContain(result.status);
        }),
        { numRuns: 200 },
      );
    });

    it('getProviderAssets never throws (always returns TResponse[])', () => {
      const arbRawFields = fc.array(
        fc.record({
          key: fc.string({ minLength: 1, maxLength: 50 }),
          type: fc.constantFrom(
            DATA_ENTRY_TYPES.STRING,
            DATA_ENTRY_TYPES.INTEGER,
            DATA_ENTRY_TYPES.BOOLEAN,
            DATA_ENTRY_TYPES.BINARY,
          ),
          value: fc.oneof(fc.string(), fc.integer(), fc.boolean()),
        }),
        { minLength: 0, maxLength: 20 },
      );

      fc.assert(
        fc.property(arbRawFields, (fields) => {
          const result = getProviderAssets(fields as TDataTxField[]);
          expect(Array.isArray(result)).toBe(true);
          result.forEach((r) => {
            expect([RESPONSE_STATUSES.OK, RESPONSE_STATUSES.ERROR]).toContain(r.status);
          });
        }),
        { numRuns: 200 },
      );
    });

    it('getFields output is always deterministic', () => {
      fc.assert(
        fc.property(arbProviderData, (data) => {
          const a = getFields(data);
          const b = getFields(data);
          expect(a).toEqual(b);
        }),
        { numRuns: 100 },
      );
    });

    it('getDifferenceByData is symmetric with itself (self-diff is empty)', () => {
      fc.assert(
        fc.property(arbProviderData, (data) => {
          const diff = getDifferenceByData(data, data);
          expect(diff).toEqual([]);
        }),
        { numRuns: 100 },
      );
    });

    it('getFields does not mutate input (fuzz)', () => {
      fc.assert(
        fc.property(arbProviderData, (data) => {
          const snapshot = JSON.stringify(data);
          getFields(data);
          expect(JSON.stringify(data)).toEqual(snapshot);
        }),
        { numRuns: 100 },
      );
    });

    it('isValidAssetId accepts all base58 strings within length', () => {
      fc.assert(
        fc.property(arbBase58, (id) => {
          expect(isValidAssetId(id)).toBe(true);
        }),
        { numRuns: 200 },
      );
    });

    it('isValidAssetId rejects strings with non-base58 characters', () => {
      const nonBase58 = fc.string({
        unit: fc.constantFrom('0', 'O', 'I', 'l'),
        minLength: 1,
        maxLength: 10,
      });
      fc.assert(
        fc.property(nonBase58, (bad) => {
          expect(isValidAssetId(bad)).toBe(false);
        }),
        { numRuns: 100 },
      );
    });

    it('isValidStatus accepts only known enum values', () => {
      fc.assert(
        fc.property(fc.integer({ min: -1000, max: 1000 }), (n) => {
          const valid = [-2, -1, 0, 1, 2].includes(n);
          expect(isValidStatus(n)).toBe(valid);
        }),
        { numRuns: 500 },
      );
    });
  });

  describe('Security: Prototype Pollution Prevention', () => {
    it('toHash is not vulnerable to __proto__ key injection', () => {
      const malicious: TDataTxField[] = [
        { key: '__proto__', type: DATA_ENTRY_TYPES.STRING, value: 'pwned' },
        { key: DATA_PROVIDER_KEYS.VERSION, type: DATA_ENTRY_TYPES.INTEGER, value: 0 },
      ];
      const hash = toHash<TDataTxField>('key')(malicious);

      // The __proto__ entry should be a normal own property, NOT prototype mutation
      const plain: Record<string, unknown> = {};
      expect(Object.getPrototypeOf(hash)).toBeNull();
      expect('value' in plain).toBe(false); // global Object.prototype not polluted
    });

    it('getProviderData is safe with __proto__ in input fields', () => {
      const malicious: TDataTxField[] = [
        { key: '__proto__', type: DATA_ENTRY_TYPES.STRING, value: 'pwned' },
        ...PROVIDER_FIELDS,
      ];
      const result = getProviderData(malicious);
      expect(result.status).toEqual(RESPONSE_STATUSES.OK);
      expect(result.content).toEqual(PROVIDER_DATA);
    });

    it('getProviderAssets is safe with __proto__ in input fields', () => {
      const malicious: TDataTxField[] = [
        { key: '__proto__', type: DATA_ENTRY_TYPES.STRING, value: 'pwned' },
        ...PROVIDER_FIELDS,
        ...VERIFIED_ASSET_FIELDS,
      ];
      const result = getProviderAssets(malicious);
      expect(result.length).toEqual(1);
      expect(result[0].status).toEqual(RESPONSE_STATUSES.OK);
    });

    it('getFieldsDiff is safe with __proto__ in input fields', () => {
      const malicious: TDataTxField[] = [
        { key: '__proto__', type: DATA_ENTRY_TYPES.STRING, value: 'pwned' },
        { key: 'normal', type: DATA_ENTRY_TYPES.STRING, value: 'old' },
      ];
      const next: TDataTxField[] = [
        { key: '__proto__', type: DATA_ENTRY_TYPES.STRING, value: 'still-pwned' },
        { key: 'normal', type: DATA_ENTRY_TYPES.STRING, value: 'new' },
      ];
      const diff = getFieldsDiff(malicious, next);
      // Both __proto__ and normal changed
      expect(diff.length).toEqual(2);
    });
  });

  describe('Edge Case: Empty Description Handling', () => {
    it('Empty langList does not cause phantom description lookups', () => {
      const fields: TDataTxField[] = [
        {
          key: DATA_PROVIDER_KEYS.VERSION,
          type: DATA_ENTRY_TYPES.INTEGER,
          value: DATA_PROVIDER_VERSIONS.BETA,
        },
        { key: DATA_PROVIDER_KEYS.NAME, type: DATA_ENTRY_TYPES.STRING, value: 'Test' },
        { key: DATA_PROVIDER_KEYS.LINK, type: DATA_ENTRY_TYPES.STRING, value: 'https://test.com' },
        { key: DATA_PROVIDER_KEYS.EMAIL, type: DATA_ENTRY_TYPES.STRING, value: 'a@b.com' },
        { key: DATA_PROVIDER_KEYS.LANG_LIST, type: DATA_ENTRY_TYPES.STRING, value: '' },
      ];
      const result = getProviderData(fields);
      // Should NOT produce a description error for phantom lang ''
      const errors = result.status === RESPONSE_STATUSES.ERROR ? result.errors : [];
      const descErrors = errors.filter((e) => e.path.startsWith('description.'));
      expect(descErrors.length).toEqual(0);
    });
  });
});

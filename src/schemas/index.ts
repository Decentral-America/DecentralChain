import {
  DATA_ENTRY_TYPES,
  DATA_PROVIDER_KEYS,
  DATA_PROVIDER_VERSIONS,
  ORACLE_ASSET_FIELD_PATTERN,
  STATUS_LIST,
} from '../constants.js';
import type { IProviderData, TProviderAsset } from '../interface.js';
import { addAssetId, processDescription, processField, schema } from '../response/index.js';
import {
  addAssetVersion,
  addVersion,
  descriptionToField,
  replaceKey,
  toAssetDescription,
  toAssetField,
  toField,
  toFields,
} from '../utils/index.js';

export const DATA_PROVIDER_VERSION_MAP = {
  [DATA_PROVIDER_VERSIONS.BETA]: schema<IProviderData>(
    processField(DATA_PROVIDER_KEYS.VERSION, 'version', DATA_ENTRY_TYPES.INTEGER),
    processField(DATA_PROVIDER_KEYS.NAME, 'name', DATA_ENTRY_TYPES.STRING),
    processField(DATA_PROVIDER_KEYS.LINK, 'link', DATA_ENTRY_TYPES.STRING),
    processField(DATA_PROVIDER_KEYS.EMAIL, 'email', DATA_ENTRY_TYPES.STRING),
    processDescription(),
  ),
} as const;

export const ASSETS_VERSION_MAP = {
  [DATA_PROVIDER_VERSIONS.BETA]: (id: string, status: STATUS_LIST) => {
    const replacer = replaceKey(id);
    switch (status) {
      case STATUS_LIST.SCAM:
      case STATUS_LIST.SUSPICIOUS:
      case STATUS_LIST.NOT_VERIFY:
        return schema<TProviderAsset>(
          processField(
            replacer(ORACLE_ASSET_FIELD_PATTERN.VERSION as string),
            'version',
            DATA_ENTRY_TYPES.INTEGER,
          ),
          addAssetId(id),
          processField(
            replacer(ORACLE_ASSET_FIELD_PATTERN.STATUS as string),
            'status',
            DATA_ENTRY_TYPES.INTEGER,
          ),
          processField(
            replacer(ORACLE_ASSET_FIELD_PATTERN.LINK as string),
            'link',
            DATA_ENTRY_TYPES.STRING,
            false,
          ),
          processField(
            replacer(ORACLE_ASSET_FIELD_PATTERN.TICKER as string),
            'ticker',
            DATA_ENTRY_TYPES.STRING,
            false,
          ),
          processField(
            replacer(ORACLE_ASSET_FIELD_PATTERN.EMAIL as string),
            'email',
            DATA_ENTRY_TYPES.STRING,
            false,
          ),
          processDescription(id, false),
        );
      case STATUS_LIST.DETAILED:
      case STATUS_LIST.VERIFIED:
        return schema<TProviderAsset>(
          processField(
            replacer(ORACLE_ASSET_FIELD_PATTERN.VERSION as string),
            'version',
            DATA_ENTRY_TYPES.INTEGER,
          ),
          addAssetId(id),
          processField(
            replacer(ORACLE_ASSET_FIELD_PATTERN.STATUS as string),
            'status',
            DATA_ENTRY_TYPES.INTEGER,
          ),
          processField(
            replacer(ORACLE_ASSET_FIELD_PATTERN.LOGO as string),
            'logo',
            DATA_ENTRY_TYPES.STRING,
          ),
          processField(
            replacer(ORACLE_ASSET_FIELD_PATTERN.LINK as string),
            'link',
            DATA_ENTRY_TYPES.STRING,
          ),
          processField(
            replacer(ORACLE_ASSET_FIELD_PATTERN.TICKER as string),
            'ticker',
            DATA_ENTRY_TYPES.STRING,
          ),
          processField(
            replacer(ORACLE_ASSET_FIELD_PATTERN.EMAIL as string),
            'email',
            DATA_ENTRY_TYPES.STRING,
          ),
          processDescription(id),
        );
    }
  },
} as const;

export const DATA_TO_FIELDS = {
  PROVIDER: toFields(
    addVersion(DATA_PROVIDER_VERSIONS.BETA),
    toField('name', DATA_PROVIDER_KEYS.NAME, DATA_ENTRY_TYPES.STRING),
    toField('link', DATA_PROVIDER_KEYS.LINK, DATA_ENTRY_TYPES.STRING),
    toField('email', DATA_PROVIDER_KEYS.EMAIL, DATA_ENTRY_TYPES.STRING),
    descriptionToField(),
  ),
  ASSET: toFields(
    addAssetVersion(DATA_PROVIDER_VERSIONS.BETA),
    toAssetField('status', ORACLE_ASSET_FIELD_PATTERN.STATUS, DATA_ENTRY_TYPES.INTEGER),
    toAssetField('logo', ORACLE_ASSET_FIELD_PATTERN.LOGO, DATA_ENTRY_TYPES.STRING),
    toAssetField('link', ORACLE_ASSET_FIELD_PATTERN.LINK, DATA_ENTRY_TYPES.STRING),
    toAssetField('ticker', ORACLE_ASSET_FIELD_PATTERN.TICKER, DATA_ENTRY_TYPES.STRING),
    toAssetField('email', ORACLE_ASSET_FIELD_PATTERN.EMAIL, DATA_ENTRY_TYPES.STRING),
    toAssetDescription(),
  ),
};

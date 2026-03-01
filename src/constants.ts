/** Asset verification status levels. */
export enum STATUS_LIST {
  SCAM = -2,
  SUSPICIOUS = -1,
  NOT_VERIFY = 0,
  DETAILED = 1,
  VERIFIED = 2,
}

/** Data provider protocol versions. */
export enum DATA_PROVIDER_VERSIONS {
  BETA,
}

/** Response status codes. */
export enum RESPONSE_STATUSES {
  ERROR = 'error',
  OK = 'ok',
}

/** Data entry type identifiers. */
export enum DATA_ENTRY_TYPES {
  INTEGER = 'integer',
  STRING = 'string',
  BINARY = 'binary',
  BOOLEAN = 'boolean',
}

/** Standard data provider key names. */
export enum DATA_PROVIDER_KEYS {
  VERSION = 'data_provider_version',
  NAME = 'data_provider_name',
  LINK = 'data_provider_link',
  EMAIL = 'data_provider_email',
  LANG_LIST = 'data_provider_lang_list',
  LOGO = 'data_provider_logo',
}

/** Pattern for provider description keys. */
export const DATA_PROVIDER_DESCRIPTION_PATTERN = 'data_provider_description_<LANG>';

/** Pattern templates for oracle asset field keys. */
export const enum ORACLE_ASSET_FIELD_PATTERN {
  VERSION = 'version_<ASSET_ID>',
  STATUS = 'status_<ASSET_ID>',
  LOGO = 'logo_<ASSET_ID>',
  DESCRIPTION = 'description_<LANG>_<ASSET_ID>',
  LINK = 'link_<ASSET_ID>',
  TICKER = 'ticker_<ASSET_ID>',
  EMAIL = 'email_<ASSET_ID>',
}

/** Placeholder tokens used in key patterns. */
export const PATTERNS = Object.freeze({
  ASSET_ID: '<ASSET_ID>',
  LANG: '<LANG>',
});

/** Set of valid STATUS_LIST values for runtime validation. */
const VALID_STATUSES: ReadonlySet<number> = new Set(
  Object.values(STATUS_LIST).filter((v): v is number => typeof v === 'number'),
);

/** Validate that a numeric value is a known STATUS_LIST member. */
export function isValidStatus(value: number): value is STATUS_LIST {
  return VALID_STATUSES.has(value);
}

/** Base58 character set used by DecentralChain asset IDs. */
const BASE58_PATTERN = /^[1-9A-HJ-NP-Za-km-z]+$/;

/** Validate that a string looks like a plausible DecentralChain asset ID. */
export function isValidAssetId(id: string): boolean {
  return id.length >= 1 && id.length <= 64 && BASE58_PATTERN.test(id);
}

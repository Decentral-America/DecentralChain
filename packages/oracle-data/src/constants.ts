/** Asset verification status levels. */
export const STATUS_LIST = {
  DETAILED: 1,
  NOT_VERIFY: 0,
  SCAM: -2,
  SUSPICIOUS: -1,
  VERIFIED: 2,
} as const;
export type STATUS_LIST = (typeof STATUS_LIST)[keyof typeof STATUS_LIST];

/** Data provider protocol versions. */
export const DATA_PROVIDER_VERSIONS = {
  BETA: 0,
} as const;
export type DATA_PROVIDER_VERSIONS =
  (typeof DATA_PROVIDER_VERSIONS)[keyof typeof DATA_PROVIDER_VERSIONS];

/** Response status codes. */
export const RESPONSE_STATUSES = {
  ERROR: 'error',
  OK: 'ok',
} as const;
export type RESPONSE_STATUSES = (typeof RESPONSE_STATUSES)[keyof typeof RESPONSE_STATUSES];

/** Data entry type identifiers. */
export const DATA_ENTRY_TYPES = {
  BINARY: 'binary',
  BOOLEAN: 'boolean',
  INTEGER: 'integer',
  STRING: 'string',
} as const;
export type DATA_ENTRY_TYPES = (typeof DATA_ENTRY_TYPES)[keyof typeof DATA_ENTRY_TYPES];

/** Standard data provider key names. */
export const DATA_PROVIDER_KEYS = {
  EMAIL: 'data_provider_email',
  LANG_LIST: 'data_provider_lang_list',
  LINK: 'data_provider_link',
  NAME: 'data_provider_name',
  VERSION: 'data_provider_version',
} as const;
export type DATA_PROVIDER_KEYS = (typeof DATA_PROVIDER_KEYS)[keyof typeof DATA_PROVIDER_KEYS];

/** Pattern for provider description keys. */
export const DATA_PROVIDER_DESCRIPTION_PATTERN = 'data_provider_description_<LANG>';

/** Pattern templates for oracle asset field keys. */
export const ORACLE_ASSET_FIELD_PATTERN = {
  DESCRIPTION: 'description_<LANG>_<ASSET_ID>',
  EMAIL: 'email_<ASSET_ID>',
  LINK: 'link_<ASSET_ID>',
  LOGO: 'logo_<ASSET_ID>',
  STATUS: 'status_<ASSET_ID>',
  TICKER: 'ticker_<ASSET_ID>',
  VERSION: 'version_<ASSET_ID>',
} as const;
export type ORACLE_ASSET_FIELD_PATTERN =
  (typeof ORACLE_ASSET_FIELD_PATTERN)[keyof typeof ORACLE_ASSET_FIELD_PATTERN];

/** Placeholder tokens used in key patterns. */
export const PATTERNS = Object.freeze({
  ASSET_ID: '<ASSET_ID>',
  LANG: '<LANG>',
});

/** Set of valid STATUS_LIST values for runtime validation. */
const VALID_STATUSES: ReadonlySet<number> = new Set(Object.values(STATUS_LIST));

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

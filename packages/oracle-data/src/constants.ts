export enum STATUS_LIST {
    SCAM = 1,
    SUSPICIOUS = 2,
    DETAILED = 4,
    VERIFIED = 5
}

export enum DATA_PROVIDER_VERSIONS {
    BETA
}

export enum RESPONSE_STATUSES {
    ERROR = 'error',
    OK = 'ok',
    EMPTY = 'empty'
}

export enum DATA_ENTRY_TYPES {
    INTEGER = 'integer',
    STRING = 'string',
    BINARY = 'binary',
    BOOLEAN = 'boolean'
}

export enum DATA_PROVIDER_KEYS {
    VERSION = 'data_provider_version',
    NAME = 'data_provider_name',
    LINK = 'data_provider_link',
    EMAIL = 'data_provider_email',
    LANG_LIST = 'data_provider_lang_list',
    LOGO = 'data_provider_logo',
}

export const DATA_PROVIDER_DESCRIPTION_PATTERN = 'data_provider_description_<LANG>';

export const enum ORACLE_ASSET_FIELD_PATTERN {
    VERSION = 'version_<ASSET_ID>',
    STATUS = 'status_<ASSET_ID>',
    LOGO = 'logo_<ASSET_ID>',
    DESCRIPTION = 'description_<LANG>_<ASSET_ID>',
    LINK = 'link_<ASSET_ID>',
    TICKER = 'ticker_<ASSET_ID>',
    EMAIL = 'email_<ASSET_ID>'
}

export const PATTERNS = {
    ASSET_ID: '<ASSET_ID>',
    LANG: '<LANG>'
};

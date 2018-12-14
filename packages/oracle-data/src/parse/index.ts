import {
    IErrorResponse,
    IProviderData,
    TDataTxField,
    TProviderAsset,
    TResponse
} from '../interface';
import {
    getAssetIdFromKey,
    getFieldValue,
    isString
} from '../response';
import {
    DATA_ENTRY_TYPES,
    DATA_PROVIDER_KEYS,
    DATA_PROVIDER_VERSIONS,
    ORACLE_ASSET_FIELD_PATTERN, PATTERNS,
    RESPONSE_STATUSES, STATUS_LIST
} from '../constants';
import {
    ASSETS_VERSION_MAP,
    DATA_PROVIDER_VERSION_MAP
} from '../schemas';


export function parseOracleData(hash: Record<string, TDataTxField>): TResponse<IProviderData> {
    try {
        const version = getFieldValue(hash, DATA_PROVIDER_KEYS.VERSION, DATA_ENTRY_TYPES.INTEGER) as DATA_PROVIDER_VERSIONS.BETA;
        return DATA_PROVIDER_VERSION_MAP[version](hash);
    } catch (e) {
        return {
            status: RESPONSE_STATUSES.ERROR,
            content: {},
            errors: [{
                path: 'version',
                error: e
            }]
        };
    }
}

export function parseAssetData(hash: Record<string, TDataTxField>): Array<TResponse<TProviderAsset>> {
    return Object.keys(hash)
        .map(getAssetIdFromKey)
        .filter(isString)
        .map(id => {
            try {
                const version = getFieldValue(hash, getDataName(ORACLE_ASSET_FIELD_PATTERN.VERSION, id), DATA_ENTRY_TYPES.INTEGER) as DATA_PROVIDER_VERSIONS.BETA;
                const status = getFieldValue(hash, getDataName(ORACLE_ASSET_FIELD_PATTERN.STATUS, id), DATA_ENTRY_TYPES.INTEGER) as STATUS_LIST;
                return ASSETS_VERSION_MAP[version](id, status)(hash);
            } catch (e) {
                return {
                    status: RESPONSE_STATUSES.ERROR,
                    content: { id },
                    errors: [{
                        path: 'version',
                        error: e
                    }]
                } as IErrorResponse<TProviderAsset>;
            }
        });
}

function getDataName(name: string, id: string): string {
    return name.replace(PATTERNS.ASSET_ID, `<${id}>`);
}

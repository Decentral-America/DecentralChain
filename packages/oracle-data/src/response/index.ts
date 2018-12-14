import { IProviderAsset, IResponseError, TDataTxField, TResponse } from '../interface';
import {
    DATA_ENTRY_TYPES,
    DATA_PROVIDER_DESCRIPTION_PATTERN,
    DATA_PROVIDER_KEYS,
    ORACLE_ASSET_FIELD_PATTERN,
    PATTERNS,
    RESPONSE_STATUSES
} from '../constants';


export function schema<T extends object>(...processors: Array<TProcessor<Partial<T>>>): (hash: THash) => TResponse<T> {
    const errors: Array<IResponseError> = [];
    return (hash: THash) => {
        const store: Partial<T> = Object.create(null);
        const content = processors.reduce((acc, item) => item(errors)(acc, hash), store) as T;
        if (!errors.length) {
            return {
                content,
                status: RESPONSE_STATUSES.OK
            };
        } else {
            return {
                content,
                errors,
                status: RESPONSE_STATUSES.ERROR
            };
        }
    };
}

export function processField<T>(from: string, to: keyof T, type: DATA_ENTRY_TYPES, required?: boolean): TProcessor<T> {
    return (errors: Array<IResponseError>) => {
        return (store, hash) => {
            try {
                store[to] = getFieldValue(hash, from, type);
                return store;
            } catch (e) {
                if (required || required == null) {
                    errors.push({
                        path: to as string,
                        error: e
                    });
                }
            }
            return store;
        };
    };
}

export function addAssetId(id: string) {
    return (errors: Array<IResponseError>) => {
        return (store: Partial<IProviderAsset>) => {
            store.id = id;
            return store;
        };
    };
}

export function processDescription(id?: string, required?: boolean) {
    return (errors: Array<IResponseError>) => (store: any, hash: THash) => {
        try {
            const langList = getFieldValue(hash, DATA_PROVIDER_KEYS.LANG_LIST, DATA_ENTRY_TYPES.STRING) as string;
            const description = Object.create(null);

            langList.split(',').forEach(lang => {
                const key = getDescriptionKey(lang, id);
                try {
                    description[lang] = getFieldValue(hash, key, DATA_ENTRY_TYPES.STRING);
                } catch (e) {
                    if (required || required == null) {
                        errors.push({
                            path: `description.${lang}`,
                            error: e
                        });
                    }
                }
            });

            if (Object.keys(description).length) {
                store.description = description;
            }

        } catch (e) {
            if (required || required == null) {
                errors.push({
                    path: 'description',
                    error: e
                });
            }
        }
        return store;
    };
}

export function getFieldValue(hash: THash, fieldName: string, type: DATA_ENTRY_TYPES): any {
    const item = hash[fieldName];

    if (!item) {
        throw new Error(`Has no field with name ${fieldName}`);
    }

    if (item.type !== type) {
        throw new Error(`Wrong field type! ${item.type} is not equal to ${type}`);
    }

    return item.value;
}

function getDescriptionKey(lang: string, id?: string): string {
    return id ?
        (ORACLE_ASSET_FIELD_PATTERN.DESCRIPTION as string)
            .replace(PATTERNS.LANG, `<${lang}>`)
            .replace(PATTERNS.ASSET_ID, `<${id}>`) :
        DATA_PROVIDER_DESCRIPTION_PATTERN
            .replace(PATTERNS.LANG, `<${lang}>`);
}

export function getAssetIdFromKey(key: string): string | null {
    const start = ORACLE_ASSET_FIELD_PATTERN.STATUS.replace(PATTERNS.ASSET_ID, '');
    if (key.indexOf(start) !== 0) {
        return null;
    }
    const id = (key.match(/<(.+)?>/) || [])[1];

    return id && ORACLE_ASSET_FIELD_PATTERN.STATUS.replace(PATTERNS.ASSET_ID, `<${id}>`) === key ? id : null;
}

export function isString(some: string | null): some is string {
    return typeof some === 'string';
}

export type TProcessor<R> = (errors: Array<IResponseError>) => (store: R, hash: THash) => R;
export type THash = Record<string, TDataTxField>;

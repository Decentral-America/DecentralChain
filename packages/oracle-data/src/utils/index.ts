import {
    IIntegerDataTXField,
    IProviderAsset,
    IProviderData,
    IStringDataTXField,
    TDataTxField,
    TProviderAsset
} from '../interface';
import {
    DATA_ENTRY_TYPES,
    DATA_PROVIDER_DESCRIPTION_PATTERN,
    DATA_PROVIDER_KEYS,
    ORACLE_ASSET_FIELD_PATTERN,
    PATTERNS
} from '../constants';


export function getFieldsDiff(previous: Array<TDataTxField>, next: Array<TDataTxField>): Array<TDataTxField> {
    const hashable = toHash<TDataTxField>('key');
    const previousHash = hashable(previous);
    return next.filter(item => {

        if (!previousHash[item.key]) {
            return true;
        }

        return previousHash[item.key].type !== item.type || previousHash[item.key].value !== item.value;
    });
}

export function isProvider(data: TProviderAsset | IProviderData): data is IProviderData {
    const onlyAssetFields: Array<keyof TProviderAsset> = ['id', 'status'];
    return !onlyAssetFields.every(propName => (propName in data));
}

export function toHash<T>(key: keyof T): (list: Array<T>) => Record<string, T> {
    return list => list.reduce((acc, item) => {
        acc[item[key]] = item;
        return acc;
    }, Object.create(null));
}

export function toFields<T>(...processors: Array<(data: T) => TItemOrList<TDataTxField>>): (data: T) => Array<TDataTxField> {
    return data => {
        return processors.reduce((acc, processor) => {
            const result = processor(data);
            Array.isArray(result) ? acc.push(...result) : acc.push(result);
            return acc;
        }, [] as Array<TDataTxField>);
    };
}

export function toField(dataName: keyof IProviderData, key: string, type: DATA_ENTRY_TYPES): (data: IProviderData) => TDataTxField {
    return data => {
        const value = data[dataName];

        if (value == null) {
            throw new Error(`Empty field ${dataName}!`);
        }

        checkType(value as any, type);

        return {
            value,
            type,
            key
        } as TDataTxField;
    };
}

export function descriptionToField(): (data: IProviderData) => IStringDataTXField[] {
    return data => {
        const langList = Object.keys(data.description || {}).join(',');
        const fields = Object.keys(data.description || {}).map(lang => {
            return {
                key: DATA_PROVIDER_DESCRIPTION_PATTERN.replace(PATTERNS.LANG, `<${lang}>`),
                type: DATA_ENTRY_TYPES.STRING as DATA_ENTRY_TYPES.STRING,
                value: data.description[lang]
            };
        });
        fields.push({
            key: DATA_PROVIDER_KEYS.LANG_LIST,
            type: DATA_ENTRY_TYPES.STRING,
            value: langList
        });
        return fields;
    };
}

export function addVersion(version: number): () => IIntegerDataTXField {
    return () => ({
        key: DATA_PROVIDER_KEYS.VERSION,
        type: DATA_ENTRY_TYPES.INTEGER,
        value: version
    });
}

function checkType(value: string | number | boolean, type: DATA_ENTRY_TYPES): void | never {
    const valueType = typeof value;
    switch (type) {
        case DATA_ENTRY_TYPES.INTEGER:
            if (typeof value !== 'number') {
                throw new Error(`Wrong value type! ${valueType} is not assignable to type number!`);
            }
            break;
        case DATA_ENTRY_TYPES.STRING:
        case DATA_ENTRY_TYPES.BINARY:
            if (typeof value !== 'string') {
                throw new Error(`Wrong value type! ${valueType} is not assignable to type string!`);
            }
            break;
        case DATA_ENTRY_TYPES.BOOLEAN:
            if (typeof value !== 'boolean') {
                throw new Error(`Wrong value type! ${valueType} is not assignable to type boolean!`);
            }
            break;
    }
}

export function addAssetVersion(version: number): (data: TProviderAsset) => TDataTxField {
    return data => ({
        key: replaceKey(data.id)(ORACLE_ASSET_FIELD_PATTERN.VERSION),
        type: DATA_ENTRY_TYPES.INTEGER,
        value: version
    });
}

export function toAssetField(from: keyof IProviderAsset, key: string, type: DATA_ENTRY_TYPES): (data: TProviderAsset) => TItemOrList<TDataTxField> {
    return data => {
        const value = data[from];

        if (value == null) {
            return [] as Array<TDataTxField>;
        }

        checkType(value as any, type);

        return {
            key: replaceKey(data.id)(key),
            type,
            value
        } as TDataTxField;
    };
}

export function toAssetDescription(): (data: TProviderAsset) => Array<TDataTxField> {
    return data => Object.keys(data.description || {}).map(lang => {
        const replacer = replaceKey(data.id, lang);
        return {
            key: replacer(ORACLE_ASSET_FIELD_PATTERN.DESCRIPTION),
            type: DATA_ENTRY_TYPES.STRING as DATA_ENTRY_TYPES.STRING,
            value: (data.description as Record<string, string>)[lang]
        };
    });
}

export function replaceKey(id: string, lang?: string): (key: string) => string {
    return key => lang ?
        key.replace(PATTERNS.ASSET_ID, `<${id}>`)
            .replace(PATTERNS.LANG, `<${lang}>`) :
        key.replace(PATTERNS.ASSET_ID, `<${id}>`);

}

export type TItemOrList<T> = T | Array<T>;

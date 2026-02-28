import type {
  IIntegerDataTXField,
  IProviderAsset,
  IProviderData,
  IStringDataTXField,
  TDataTxField,
  TProviderAsset,
} from '../interface.js';
import {
  DATA_ENTRY_TYPES,
  DATA_PROVIDER_DESCRIPTION_PATTERN,
  DATA_PROVIDER_KEYS,
  ORACLE_ASSET_FIELD_PATTERN,
  PATTERNS,
} from '../constants.js';

/** Compute the diff between two arrays of data transaction fields. */
export function getFieldsDiff(previous: TDataTxField[], next: TDataTxField[]): TDataTxField[] {
  const hashable = toHash<TDataTxField>('key');
  const previousHash = hashable(previous);
  return next.filter((item) => {
    const prev = previousHash[item.key];
    if (!prev) {
      return true;
    }

    return prev.type !== item.type || prev.value !== item.value;
  });
}

/** Type guard: returns true if the data is provider data (not asset data). */
export function isProvider(data: TProviderAsset | IProviderData): data is IProviderData {
  const onlyAssetFields: (keyof TProviderAsset)[] = ['id', 'status'];
  return !onlyAssetFields.every((propName) => propName in data);
}

/** Convert an array to a hash keyed by a specific property. */
export function toHash<T extends object>(key: keyof T): (list: T[]) => Record<string, T> {
  return (list) =>
    list.reduce<Record<string, T>>((acc, item) => {
      acc[String(item[key])] = item;
      return acc;
    }, {});
}

/** Build an array of data transaction fields from processors. */
export function toFields<T>(
  ...processors: ((data: T) => TItemOrList<TDataTxField>)[]
): (data: T) => TDataTxField[] {
  return (data) => {
    return processors.reduce<TDataTxField[]>((acc, processor) => {
      const result = processor(data);
      if (Array.isArray(result)) {
        acc.push(...result);
      } else {
        acc.push(result);
      }
      return acc;
    }, []);
  };
}

/** Convert a single provider data field to a data transaction field. */
export function toField(
  dataName: keyof IProviderData,
  key: string,
  type: DATA_ENTRY_TYPES,
): (data: IProviderData) => TDataTxField {
  return (data) => {
    const value = data[dataName];

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- defensive runtime check
    if (value == null) {
      throw new Error(`Empty field ${dataName}!`);
    }

    checkType(value as string | number | boolean, type);

    return {
      value,
      type,
      key,
    } as TDataTxField;
  };
}

/** Convert provider description fields to data transaction fields. */
export function descriptionToField(): (data: IProviderData) => IStringDataTXField[] {
  return (data) => {
    const desc = data.description;
    const langList = Object.keys(desc).join(',');
    const fields = Object.keys(desc).map((lang) => {
      return {
        key: DATA_PROVIDER_DESCRIPTION_PATTERN.replace(PATTERNS.LANG, `<${lang}>`),
        type: DATA_ENTRY_TYPES.STRING as DATA_ENTRY_TYPES.STRING,
        value: desc[lang] ?? '',
      };
    });
    fields.push({
      key: DATA_PROVIDER_KEYS.LANG_LIST,
      type: DATA_ENTRY_TYPES.STRING,
      value: langList,
    });
    return fields;
  };
}

/** Create a version field for provider data. */
export function addVersion(version: number): () => IIntegerDataTXField {
  return () => ({
    key: DATA_PROVIDER_KEYS.VERSION,
    type: DATA_ENTRY_TYPES.INTEGER,
    value: version,
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

/** Create a version field for an asset. */
export function addAssetVersion(version: number): (data: TProviderAsset) => TDataTxField {
  return (data) => ({
    key: replaceKey(data.id)(ORACLE_ASSET_FIELD_PATTERN.VERSION as string),
    type: DATA_ENTRY_TYPES.INTEGER,
    value: version,
  });
}

/** Convert an asset field to a data transaction field. */
export function toAssetField(
  from: keyof IProviderAsset,
  key: string,
  type: DATA_ENTRY_TYPES,
): (data: TProviderAsset) => TItemOrList<TDataTxField> {
  return (data) => {
    const value = data[from];

    if (value == null) {
      return [] as TDataTxField[];
    }

    checkType(value as string | number | boolean, type);

    return {
      key: replaceKey(data.id)(key),
      type,
      value,
    } as TDataTxField;
  };
}

/** Convert asset description fields to data transaction fields. */
export function toAssetDescription(): (data: TProviderAsset) => TDataTxField[] {
  return (data) =>
    Object.keys(data.description ?? {}).map((lang) => {
      const replacer = replaceKey(data.id, lang);
      return {
        key: replacer(ORACLE_ASSET_FIELD_PATTERN.DESCRIPTION as string),
        type: DATA_ENTRY_TYPES.STRING as DATA_ENTRY_TYPES.STRING,
        value: data.description?.[lang] ?? '',
      };
    });
}

/** Replace asset ID (and optionally lang) in a key pattern. */
export function replaceKey(id: string, lang?: string): (key: string) => string {
  return (key) =>
    lang
      ? key.replace(PATTERNS.ASSET_ID, `<${id}>`).replace(PATTERNS.LANG, `<${lang}>`)
      : key.replace(PATTERNS.ASSET_ID, `<${id}>`);
}

export type TItemOrList<T> = T | T[];

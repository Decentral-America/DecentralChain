import type { IProviderAsset, IResponseError, TDataTxField, TResponse } from '../interface.js';
import {
  DATA_ENTRY_TYPES,
  DATA_PROVIDER_DESCRIPTION_PATTERN,
  DATA_PROVIDER_KEYS,
  ORACLE_ASSET_FIELD_PATTERN,
  PATTERNS,
  RESPONSE_STATUSES,
} from '../constants.js';

/** Build a schema parser from a series of field processors. */
export function schema<T extends object>(
  ...processors: TProcessor<Partial<T>>[]
): (hash: THash) => TResponse<T> {
  return (hash: THash) => {
    const errors: IResponseError[] = [];
    const store: Partial<T> = Object.create(null) as Partial<T>;
    const content = processors.reduce((acc, item) => item(errors)(acc, hash), store) as T;
    if (errors.length === 0) {
      return {
        content,
        status: RESPONSE_STATUSES.OK,
      };
    } else {
      return {
        content,
        errors,
        status: RESPONSE_STATUSES.ERROR,
      };
    }
  };
}

/** Process a single field from the hash into the store. */
export function processField<T>(
  from: string,
  to: keyof T,
  type: DATA_ENTRY_TYPES,
  required?: boolean,
): TProcessor<T> {
  return (errors: IResponseError[]) => {
    return (store, hash) => {
      try {
        const value = getFieldValue(hash, from, type);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any -- runtime-validated field assignment
        (store as any)[to] = value;
        return store;
      } catch (e: unknown) {
        if (required ?? true) {
          errors.push({
            path: to as string,
            /* v8 ignore next */
            error: e instanceof Error ? e : new Error(String(e)),
          });
        }
      }
      return store;
    };
  };
}

/** Add the asset ID into the store. */
export function addAssetId(id: string) {
  return (_errors: IResponseError[]) => {
    return (store: Partial<IProviderAsset>) => {
      store.id = id;
      return store;
    };
  };
}

/** Process description fields from the hash into the store. */
export function processDescription(id?: string, required?: boolean) {
  return (errors: IResponseError[]) => (store: Record<string, unknown>, hash: THash) => {
    try {
      const langList = getFieldValue(
        hash,
        DATA_PROVIDER_KEYS.LANG_LIST,
        DATA_ENTRY_TYPES.STRING,
      ) as string;
      const description: Record<string, string> = Object.create(null) as Record<string, string>;

      langList.split(',').forEach((lang) => {
        const key = getDescriptionKey(lang, id);
        try {
          description[lang] = getFieldValue(hash, key, DATA_ENTRY_TYPES.STRING) as string;
        } catch (e: unknown) {
          if (required ?? true) {
            errors.push({
              path: `description.${lang}`,
              /* v8 ignore next */
              error: e instanceof Error ? e : new Error(String(e)),
            });
          }
        }
      });

      if (Object.keys(description).length > 0) {
        store['description'] = description;
      }
    } catch (e: unknown) {
      if (required ?? true) {
        errors.push({
          path: 'description',
          /* v8 ignore next */
          error: e instanceof Error ? e : new Error(String(e)),
        });
      }
    }
    return store;
  };
}

/** Extract a field value from the hash, throwing if missing or wrong type. */
export function getFieldValue(
  hash: THash,
  fieldName: string,
  type: DATA_ENTRY_TYPES,
): string | number | boolean {
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
  return id
    ? (ORACLE_ASSET_FIELD_PATTERN.DESCRIPTION as string)
        .replace(PATTERNS.LANG, `<${lang}>`)
        .replace(PATTERNS.ASSET_ID, `<${id}>`)
    : DATA_PROVIDER_DESCRIPTION_PATTERN.replace(PATTERNS.LANG, `<${lang}>`);
}

/** Extract an asset ID from a data key string. */
export function getAssetIdFromKey(key: string): string | null {
  const start = (ORACLE_ASSET_FIELD_PATTERN.STATUS as string).replace(PATTERNS.ASSET_ID, '');
  if (!key.startsWith(start)) {
    return null;
  }
  const match = /<(.+?)>/.exec(key);
  const id = match?.[1];

  return id &&
    (ORACLE_ASSET_FIELD_PATTERN.STATUS as string).replace(PATTERNS.ASSET_ID, `<${id}>`) === key
    ? id
    : null;
}

/** Type guard to check if a value is a non-null string. */
export function isString(some: string | null): some is string {
  return typeof some === 'string';
}

export type TProcessor<R> = (errors: IResponseError[]) => (store: R, hash: THash) => R;
export type THash = Record<string, TDataTxField>;

import type {
  IErrorResponse,
  IProviderData,
  TDataTxField,
  TProviderAsset,
  TResponse,
} from '../interface.js';
import { getAssetIdFromKey, getFieldValue, isString } from '../response/index.js';
import {
  DATA_ENTRY_TYPES,
  DATA_PROVIDER_KEYS,
  type DATA_PROVIDER_VERSIONS,
  ORACLE_ASSET_FIELD_PATTERN,
  PATTERNS,
  RESPONSE_STATUSES,
  type STATUS_LIST,
} from '../constants.js';
import { ASSETS_VERSION_MAP, DATA_PROVIDER_VERSION_MAP } from '../schemas/index.js';

/** Parse oracle provider data from a hash of data transaction fields. */
export function parseOracleData(hash: Record<string, TDataTxField>): TResponse<IProviderData> {
  try {
    const version = getFieldValue(
      hash,
      DATA_PROVIDER_KEYS.VERSION,
      DATA_ENTRY_TYPES.INTEGER,
    ) as DATA_PROVIDER_VERSIONS;
    const parser = DATA_PROVIDER_VERSION_MAP[version];
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- defensive runtime check
    if (!parser) {
      throw new Error(`Unsupported provider version: ${String(version)}`);
    }
    return parser(hash);
  } catch (e: unknown) {
    return {
      status: RESPONSE_STATUSES.ERROR,
      content: {},
      errors: [
        {
          path: 'version',
          /* v8 ignore next */
          error: e instanceof Error ? e : new Error(String(e)),
        },
      ],
    };
  }
}

/** Parse oracle asset data from a hash of data transaction fields. */
export function parseAssetData(hash: Record<string, TDataTxField>): TResponse<TProviderAsset>[] {
  return Object.keys(hash)
    .map(getAssetIdFromKey)
    .filter(isString)
    .map((id) => {
      try {
        const version = getFieldValue(
          hash,
          getDataName(ORACLE_ASSET_FIELD_PATTERN.VERSION, id),
          DATA_ENTRY_TYPES.INTEGER,
        ) as DATA_PROVIDER_VERSIONS;
        const status = getFieldValue(
          hash,
          getDataName(ORACLE_ASSET_FIELD_PATTERN.STATUS, id),
          DATA_ENTRY_TYPES.INTEGER,
        ) as STATUS_LIST;
        const parser = ASSETS_VERSION_MAP[version];
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- defensive runtime check
        if (!parser) {
          throw new Error(`Unsupported asset version: ${String(version)}`);
        }
        return parser(id, status)(hash);
      } catch (e: unknown) {
        return {
          status: RESPONSE_STATUSES.ERROR,
          content: { id },
          errors: [
            {
              path: 'version',
              /* v8 ignore next */
              error: e instanceof Error ? e : new Error(String(e)),
            },
          ],
        } as IErrorResponse<TProviderAsset>;
      }
    });
}

function getDataName(name: string, id: string): string {
  return name.replace(PATTERNS.ASSET_ID, `<${id}>`);
}

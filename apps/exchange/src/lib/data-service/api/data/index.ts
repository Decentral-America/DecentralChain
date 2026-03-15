import {
  getProviderAssets,
  getProviderData,
  type IProviderData,
  RESPONSE_STATUSES,
  type TDataTxField,
  type TProviderAsset,
} from '@decentralchain/oracle-data';
import { indexBy, prop } from 'ramda';
import { get } from '../../config';
import { request } from '../../utils/request';

export function getDataFields(address: string): Promise<Array<TDataTxField>> {
  return request({ url: `${get('node')}/addresses/data/${address}` });
}

export function getOracleData(address: string): Promise<IOracleData | null> {
  return getDataFields(address).then((fields) => {
    const oracle = getProviderData(fields);
    if (oracle.status === RESPONSE_STATUSES.ERROR) {
      return null;
    }

    const assets = getProviderAssets(fields)
      .filter((item) => item.status === RESPONSE_STATUSES.OK)
      .map((item) => item.content) as Array<TProviderAsset>;

    return {
      assets: indexBy<TProviderAsset>(prop('id'), assets),
      oracle: oracle.content,
    };
  });
}

export interface IOracleData {
  oracle: IProviderData;
  assets: Record<string, TProviderAsset>;
}

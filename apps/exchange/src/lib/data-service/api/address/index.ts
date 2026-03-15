import { Money } from '@decentralchain/data-entities';
import { get as configGet } from '../../config';
import { request } from '../../utils/request';
import { get } from '../assets/assets';

export function getScriptInfo(address: string): Promise<IScriptInfo<Money>> {
  return Promise.all([
    get('DCC'),
    request<IScriptInfo<number | string>>({
      url: `${configGet('node')}/addresses/scriptInfo/${address}`,
    }),
  ]).then(([asset, info]) => {
    return { ...info, extraFee: new Money(info.extraFee, asset) };
  });
}

export interface IScriptInfo<LONG> {
  address: string;
  script?: string;
  scriptText?: string;
  complexity: number;
  extraFee: LONG;
}

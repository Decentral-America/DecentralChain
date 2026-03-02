import request from '../../tools/request';
import { pathSegment } from '../../tools/utils';

export function fetchByAlias(base: string, alias: string): Promise<IByAlias> {
  return request({
    base,
    url: `/alias/by-alias/${pathSegment(alias)}`,
  });
}

export function fetchByAddress(base: string, address: string): Promise<IByAddress> {
  return request({
    base,
    url: `/alias/by-address/${pathSegment(address)}`,
  });
}

export interface IByAlias {
  address: string;
}

export type IByAddress = string[];

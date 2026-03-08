import { get } from '../../config';
import { request } from '../../utils/request';

export function getFeeRates() {
  return request({
    url: `${get('matcher')}/settings/rates`,
  });
}

export function getSettings() {
  return request({
    url: `${get('matcher')}/settings`,
  });
}

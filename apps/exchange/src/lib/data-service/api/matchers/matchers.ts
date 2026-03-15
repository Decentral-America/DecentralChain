import { get } from '../../config';
import { request } from '../../utils/request';
import { stringifyJSON } from '../../utils/utils';

export function getRates(matcherAddress: string, pairs: string[][]) {
  return request({
    fetchOptions: {
      body: stringifyJSON({
        pairs: pairs.map((pair) => pair.join('/')),
      }),
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json;charset=UTF-8',
      },
      method: 'POST',
    },
    url: `${get('api')}/${get('apiVersion')}/matchers/${matcherAddress}/rates`,
  });
}

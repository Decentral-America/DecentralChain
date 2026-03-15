import { parse } from '../api/matcher/getOrders';
import { get } from '../config';
import { addOrderToStore, removeAllOrdersFromStore, removeOrderFromStore } from '../store';
import { request } from '../utils/request';
import { stringifyJSON } from '../utils/utils';

export function broadcast(data) {
  return request({
    fetchOptions: {
      body: stringifyJSON(data),
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json;charset=UTF-8',
      },
      method: 'POST',
    },
    url: `${get('node')}/transactions/broadcast`,
  });
}

export function createOrderSend(txData) {
  return request({
    fetchOptions: {
      body: stringifyJSON(txData),
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json;charset=UTF-8',
      },
      method: 'POST',
    },
    url: `${get('matcher')}/orderbook`,
  })
    .then((data: { message: Record<string, unknown> & { orderType: string } }) => {
      return parse([
        {
          ...data.message,
          filled: 0,
          status: 'Accepted',
          type: data.message.orderType,
        },
      ]);
    })
    .then(addOrderToStore);
}

export function cancelOrderSend(txData, amountId, priceId, type: 'cancel' | 'delete' = 'cancel') {
  return request({
    fetchOptions: {
      body: stringifyJSON(txData),
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json;charset=UTF-8',
      },
      method: 'POST',
    },
    url: `${get('matcher')}/orderbook/${amountId}/${priceId}/${type}`,
  }).then((data) => {
    removeOrderFromStore({ id: txData.orderId });
    return data;
  });
}

export function cancelAllOrdersSend(txData) {
  return request({
    fetchOptions: {
      body: stringifyJSON(txData),
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json;charset=UTF-8',
      },
      method: 'POST',
    },
    url: `${get('matcher')}/orderbook/cancel`,
  }).then((data) => {
    removeAllOrdersFromStore();
    return data;
  });
}

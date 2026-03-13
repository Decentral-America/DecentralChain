import { type TLong } from '../../interface';
import request from '../../tools/request';
import { pathSegment } from '../../tools/utils';

/**
 * GET /leasing/active/{address}
 * Get all active leases for an address
 */
export function fetchActive(
  base: string,
  address: string,
  options: RequestInit = {},
): Promise<ILeaseInfo[]> {
  return request({ base, options, url: `/leasing/active/${pathSegment(address)}` });
}

/**
 * GET /leasing/info/
 * Get lease transactions info.
 */
export function fetchLeasingInfo(
  base: string,
  ids: string[],
  options: RequestInit = {},
): Promise<ILeaseInfo[]> {
  // Use JSON.stringify to prevent injection via malicious id values
  const body = JSON.stringify({ ids });

  return request({
    base,
    options: {
      ...options,
      body,
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
    },
    url: `/leasing/info/`,
  });
}

export interface ILeaseInfo {
  id: string;
  originTransactionId: string;
  sender: string;
  recipient: string;
  amount: TLong;
  height: number;
  status: string;
  cancelHeight: number | null;
  cancelTransactionId: string | null;
}

/**
 * useTransferStatus Hook
 * Settlement progress for one transfer, and an honest answer when there isn't any.
 */
import { useQuery } from '@tanstack/react-query';
import { useRef } from 'react';
import { getTransfer, isSettledStatus, isUnknownTransfer } from '@/services/bridge/api';
import { type Transfer } from '@/services/bridge/types';

const POLL_MS = 5_000;

/**
 * How long a transfer may look like the API's placeholder before we stop
 * calling it "pending".
 *
 * The transfer id is derived client-side and submitted with the deposit, so
 * there is always a window where the API has legitimately not seen it yet and
 * answers with the placeholder. `GET /deposit/limits` reports a mint time of
 * roughly 75 seconds for SOL; three minutes is comfortably past that without
 * being so long the user has given up first.
 */
const UNKNOWN_GRACE_MS = 180_000;

export interface TransferProgress {
  error: Error | null;
  isLoading: boolean;
  /** Terminal — no further polling. */
  isSettled: boolean;
  /**
   * The API has answered with its placeholder for longer than the grace
   * window. Either the id is wrong or the deposit never reached the bridge;
   * either way it is not going to progress on its own, and showing a
   * progress bar would be a lie.
   */
  isStranded: boolean;
  transfer: Transfer | undefined;
}

export const transferQueryKey = (transferId: string) => ['bridge', 'transfer', transferId] as const;

/**
 * `GET /transfer/:id` answers 200 `{success: true}` for an id it has never
 * seen, synthesising a `pending_confirmation` record with an empty sender and
 * a zero amount. Nothing in the response says "unknown". Polled naively, a
 * typo'd or stale id produces a spinner that spins forever, which is how a
 * stranded deposit gets mistaken for a slow one.
 */
export const useTransferStatus = (transferId: string | null): TransferProgress => {
  const firstUnknownAt = useRef<number | null>(null);

  const query = useQuery({
    enabled: Boolean(transferId),
    queryFn: () => getTransfer(transferId as string),
    queryKey: transferQueryKey(transferId ?? ''),
    refetchInterval: (q) => {
      const status = q.state.data?.status;
      return status && isSettledStatus(status) ? false : POLL_MS;
    },
  });

  const transfer = query.data;
  const looksUnknown = transfer ? isUnknownTransfer(transfer) : false;

  if (!looksUnknown) {
    firstUnknownAt.current = null;
  } else if (firstUnknownAt.current === null) {
    firstUnknownAt.current = Date.now();
  }

  const isStranded =
    looksUnknown &&
    firstUnknownAt.current !== null &&
    Date.now() - firstUnknownAt.current > UNKNOWN_GRACE_MS;

  return {
    error: query.error,
    isLoading: query.isLoading,
    isSettled: Boolean(transfer?.status && isSettledStatus(transfer.status)),
    isStranded,
    transfer,
  };
};

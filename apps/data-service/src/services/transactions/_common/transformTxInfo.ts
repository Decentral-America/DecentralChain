import { omit, renameKeys } from 'ramda';

type TxRow = Record<string, unknown>;

const hasNullSig = (row: TxRow): boolean => row['signature'] === null;
const hasZeroProofs = (row: TxRow): boolean =>
  ((row['proofs'] as unknown[] | undefined)?.length ?? -1) === 0;

const processProofsAndSignature = (row: TxRow): TxRow => {
  if (hasNullSig(row)) return omit(['signature'], row);
  if (hasZeroProofs(row)) return omit(['proofs'], row);
  return row;
};

const _transformTxInfo = (obj: TxRow): TxRow => {
  const renamed: TxRow = renameKeys<TxRow>(
    {
      sender_public_key: 'senderPublicKey',
      status: 'applicationStatus',
      time_stamp: 'timestamp',
      tx_type: 'type',
      tx_version: 'version',
    },
    omit(['uid'], obj),
  );
  // remove version if it is null
  const withVersion = renamed['version'] === null ? omit(['version'], renamed) : renamed;
  return processProofsAndSignature(withVersion);
};

/** transformTxInfo:: RawTxInfo -> TxInfo
 * Dynamic DB row transform — output shape is determined by the caller's generic type context. */
export const transformTxInfo: (obj: TxRow) => any = _transformTxInfo;

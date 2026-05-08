import { compose, identity, ifElse, omit, pathEq, propEq, renameKeys } from 'ramda';

const hasNullSig = (propEq as any)(null, 'signature');
const hasZeroProofs = (pathEq as any)(0, ['proofs', 'length']);

const processProofsAndSignature = (ifElse as any)(
  hasNullSig,
  omit(['signature']),
  (ifElse as any)(hasZeroProofs, omit(['proofs']), identity),
);

/** transformTxInfo:: RawTxInfo -> TxInfo */
export const transformTxInfo = (compose as any)(
  processProofsAndSignature,
  // remove version if it is null
  (ifElse as any)((propEq as any)(null, 'version'), omit(['version']), identity),
  renameKeys({
    sender_public_key: 'senderPublicKey',
    status: 'applicationStatus',
    time_stamp: 'timestamp',
    tx_type: 'type',
    tx_version: 'version',
  }),
  omit(['uid']),
) as (obj: any) => any;

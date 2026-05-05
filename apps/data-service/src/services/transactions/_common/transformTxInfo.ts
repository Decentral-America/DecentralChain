// @ts-nocheck
import { compose, identity, ifElse, omit, pathEq, propEq } from 'ramda';
import { renameKeys } from 'ramda-adjunct';

const hasNullSig = (propEq as any)(null, 'signature');
const hasZeroProofs = (pathEq as any)(0, ['proofs', 'length']);

const processProofsAndSignature = ifElse(
  hasNullSig,
  omit(['signature']),
  ifElse(hasZeroProofs, omit(['proofs']), identity),
);

/** transformTxInfo:: RawTxInfo -> TxInfo */
export const transformTxInfo = compose(
  processProofsAndSignature,
  // remove version if it is null
  ifElse((propEq as any)(null, 'version'), omit(['version']), identity),
  renameKeys({
    sender_public_key: 'senderPublicKey',
    status: 'applicationStatus',
    time_stamp: 'timestamp',
    tx_type: 'type',
    tx_version: 'version',
  }),
  omit(['uid']),
);

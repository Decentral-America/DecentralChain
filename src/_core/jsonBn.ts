import BigNumber from '@decentralchain/bignumber';
import { create } from '@decentralchain/parse-json-bignumber';

export const JSONbn = create({
  isInstance: BigNumber.isBigNumber,
  parse: v => {
    const bn = new BigNumber(v);

    return bn.gt(Number.MAX_SAFE_INTEGER) ? bn : Number(v);
  },
  strict: true,
  stringify: v => String(v),
});

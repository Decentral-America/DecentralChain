import { type BigNumber } from '@decentralchain/data-entities';
import pgPromise, { type IMain } from 'pg-promise';
import { compose, init, split, tail } from 'ramda';

import { toBigNumber } from '../../utils/bigNumber';

const pgp: IMain = pgPromise();

const parsePgArray = (s: string): string[] =>
  (compose(split(',') as (s: string) => string[], init, tail) as any)(s) as string[];

const toBigNumberAll = (s: string): BigNumber[] => parsePgArray(s).map(toBigNumber);

const types = pgp.pg.types;

types.setTypeParser(20 as any, toBigNumber); // bigint
types.setTypeParser(701 as any, toBigNumber); // double precision/float8
types.setTypeParser(1700 as any, toBigNumber); // numeric

types.setTypeParser(1016 as any, toBigNumberAll); // array/bigint
types.setTypeParser(1022 as any, toBigNumberAll); // array/double precision
types.setTypeParser(1231 as any, toBigNumberAll); // array/numeric

// @hack
// for some reason float4/real does not matter to pg-promise
// as it seems to parse it with 'double precision' parser anyway
// If they change it upstream, our integration test will fail and indicate.

// types.setTypeParser(700, toBigNumber); // real/float4
// types.setTypeParser(1021, toBigNumberAll); // array/float

export const pgpConnect = pgp;

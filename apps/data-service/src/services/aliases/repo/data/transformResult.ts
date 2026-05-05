import { type AliasInfo } from '../../../../types';

export type AliasDbResponse = {
  alias: string;
  address: string;
  duplicates: number;
};

export const transformDbResponse = (result: AliasDbResponse): AliasInfo => ({
  address: result.duplicates > 1 ? null : result.address,
  alias: result.alias,
});

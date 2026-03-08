import { getDataService } from '../../config';
import { request } from '../../utils/request';

export function getAliasesByAddress(address: string): Promise<Array<string>> {
  const ds = getDataService();
  return request({ method: () => ds.aliases.getByAddress(address) }).then((r) =>
    r.data.map((alias) => alias.alias),
  );
}

export function getAddressByAlias(alias: string): Promise<{ address: string }> {
  const ds = getDataService();
  return request({
    method: () => ds.aliases.getById(alias).then((r) => r.data as { address: string }),
  });
}

export function getAliasesByIdList(ids: Array<string>): Promise<Array<string>> {
  const ds = getDataService();
  return request({ method: () => ds.aliases.getByIdList(ids) }).then(
    (r) => r.data as Array<string>,
  );
}

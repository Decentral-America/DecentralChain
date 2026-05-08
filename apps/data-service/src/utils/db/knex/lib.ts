import { concat, curryN, findIndex, slice, type } from 'ramda';

const hasMethod: ((method: string, x: any) => boolean) & ((method: string) => (x: any) => boolean) =
  curryN(
    2,
    (method: string, x: any): boolean => (x?.[method] && type(x[method]) === 'Function') || false,
  ) as any;

const createPointfree =
  (method: string) =>
  (...args: any[]) => {
    const instanceIdx = findIndex((x: any) => hasMethod(method, x), args);

    if (instanceIdx !== -1) {
      return args[instanceIdx].clone()[method](...slice(0, instanceIdx, args));
    } else {
      return (...args2: any[]) => createPointfree(method)(...concat(args, args2));
    }
  };

export { hasMethod };
export const limit = createPointfree('limit');
export const orderBy = createPointfree('orderBy');
export const orWhere = createPointfree('orWhere');
export const raw = createPointfree('raw');
export const where = createPointfree('where');
export const whereIn = createPointfree('whereIn');
export const whereNotNull = createPointfree('whereNotNull');
export const whereNull = createPointfree('whereNull');
export const whereRaw = createPointfree('whereRaw');

const defaultExport: any = {
  hasMethod,
  limit,
  orderBy,
  orWhere,
  raw,
  where,
  whereIn,
  whereNotNull,
  whereNull,
  whereRaw,
};
export default defaultExport;

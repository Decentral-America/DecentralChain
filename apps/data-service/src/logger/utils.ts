import { identity, ifElse } from 'ramda';

const colorize = (s: string): string => s; // was json-colorizer

const bindedStringify = JSON.stringify.bind(JSON);

const isDev = (obj: NodeJS.Process): boolean => obj.env['NODE_ENV'] === 'development';
const stringifyMetaInProd = ifElse(
  isDev,
  () => identity,
  () => bindedStringify,
)(process);
const separator = () => new Array(64).fill('-').join('');

const stringify = ifElse(
  isDev,
  () => (json: any) => `${colorize(JSON.stringify(json, null, 2))}\n${separator()}`,
  () => (json: any) => JSON.stringify(json),
)(process);

export default {
  isDev,
  stringify,
  stringifyMetaInProd,
};
export { isDev, stringify, stringifyMetaInProd };

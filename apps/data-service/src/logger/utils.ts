import { identity, pathEq, ifElse } from 'ramda';
const colorize = (s: string): string => s; // was json-colorizer

const bindedStringify = JSON.stringify.bind(JSON);

const isDev = pathEq(['env', 'NODE_ENV'], 'development');
const stringifyMetaInProd = ifElse(
  isDev,
  () => identity,
  () => bindedStringify,
)(process);
const separator = () => new Array(64).fill('-').join('');

const stringify = ifElse(
  isDev,
  () => (json) => `${colorize(JSON.stringify(json, null, 2))}\n${separator()}`,
  () => (json) => JSON.stringify(json),
)(process);

export default {
  isDev,
  stringify,
  stringifyMetaInProd,
};

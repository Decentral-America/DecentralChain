import { config } from '../../config/index.js';
import { keys } from '../utils/index.js';

/* v8 ignore start -- runtime feature detection: only one branch taken per environment */
const consoleModule = (function (root: { console: Console }) {
  return root.console;
})(typeof self !== 'undefined' ? self : globalThis);
/* v8 ignore stop */

const storage: Record<string, unknown[][]> = Object.create(null) as Record<string, unknown[][]>;

function addNamespace(type: string) {
  storage[type] ??= [];
}

function saveEvent(type: string, args: unknown[]) {
  const bucket = storage[type];
  if (bucket) {
    bucket.push(args);
  }
}

function generateConsole(): Record<config.console.TConsoleMethods, (...args: unknown[]) => void> {
  const result: Record<config.console.TConsoleMethods, (...args: unknown[]) => void> =
    Object.create(null) as Record<config.console.TConsoleMethods, (...args: unknown[]) => void>;
  for (const method of keys(config.console.methodsData)) {
    result[method] = (...args: unknown[]) => {
      if (config.console.logLevel < config.console.methodsData[method].logLevel) {
        if (config.console.methodsData[method].save) {
          addNamespace(method);
          saveEvent(method, args);
        }
      } else {
        (consoleModule[method] as (...a: unknown[]) => void)(...args);
      }
    };
  }
  return result;
}

export const console = {
  ...generateConsole(),
  getSavedMessages(type: config.console.TConsoleMethods): unknown[][] {
    return storage[type] ?? [];
  },
};

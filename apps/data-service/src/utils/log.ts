import { compose, map, tap, curryN } from 'ramda';

const log = curryN(2, (logFn, message, level = 'info') => logFn({ level, message }));
const tapLog = (logFn, messageFn) => tap(compose(log(logFn), messageFn));
const mapTapLog = compose(map, tapLog);

export { log, mapTapLog, tapLog };

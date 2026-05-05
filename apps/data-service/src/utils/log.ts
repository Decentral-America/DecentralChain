// @ts-nocheck
import { compose, curryN, map, tap } from 'ramda';

const log = curryN(2, (logFn: any, message: any, level = 'info') => logFn({ level, message }));
const tapLog = (logFn: any, messageFn: any) => tap(compose(log(logFn), messageFn));
const mapTapLog = (compose as any)(map, tapLog);

export { log, mapTapLog, tapLog };

import { EventEmitter } from 'node:events';
import { always, memoizeWith } from 'ramda';

const createEventBus = () => new EventEmitter();

export default memoizeWith(always('eventBus'), createEventBus);

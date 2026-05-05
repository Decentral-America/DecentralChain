import { EventEmitter } from 'events';
import { always, memoizeWith } from 'ramda';

const createEventBus = () => new EventEmitter();

export default memoizeWith(always('eventBus'), createEventBus);

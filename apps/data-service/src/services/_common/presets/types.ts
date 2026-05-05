import { type PgDriver } from 'db/driver';
import { type EmitEvent } from '../createResolver/types';

export type RepoPresetInitOptions = {
  pg: PgDriver;
  emitEvent: EmitEvent;
};

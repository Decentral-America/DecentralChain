import { prop, propIs } from 'ramda';

const timeRepository: Record<string, Date> = {};

export const timeStart = (name: string): void => {
  timeRepository[name] = new Date();
};

export const timeEnd = (name: string): number | null =>
  propIs(Date, name, timeRepository) ? Date.now() - prop(name, timeRepository).getTime() : null;

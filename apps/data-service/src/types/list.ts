export type List<T> = {
  __type: 'list';
  data: T[];
  [key: string]: unknown;
};

export const list = <T>(items: T[] = [], meta: Record<string, unknown> = {}): List<T> => ({
  __type: 'list',
  ...meta,
  data: items,
});

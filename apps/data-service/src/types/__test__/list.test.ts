import { list } from '../list';

const items = [
  { f: 0, id: 'qwe' },
  { f: 1, id: 'asd' },
];

describe('List type should be', () => {
  it('constructed from array', () => {
    expect(list(items)).toEqual({
      __type: 'list',
      data: items,
    });
  });
  it('adds meta', () => {
    expect(list(items, { someValue: true })).toEqual({
      __type: 'list',
      data: items,
      someValue: true,
    });
  });
});

import { Ok as ok } from 'folktale/result';
import { SortOrder } from '../../../../services/_common';
import { parseFilterValues } from '..';

describe('Filter values parsing', () => {
  const parseQuery = parseFilterValues({});

  const query = {
    after: 'AFTER',
    ids: ['id1', 'id2'],
    limit: '10',
    sort: SortOrder.Ascending,
    timeEnd: '2018-10-01',
    timeStart: '2018-01-01',
  };

  describe('all common filter', () => {
    it('values are parsed correctly provided correct values are given', () => {
      expect(parseQuery(query)).toEqual(
        ok({
          ...query,
          limit: 10,
          timeEnd: new Date(query.timeEnd),
          timeStart: new Date(query.timeStart),
        }),
      );
    });
    it('correct default values are given ', () => {
      expect(parseQuery({})).toEqual(ok({}));
    });

    it('ids are parsed correctly in any form', () => {
      expect(parseQuery({ ids: 'someValue' })).toEqual(
        ok({
          ids: ['someValue'],
        }),
      );

      expect(parseQuery({ ids: '' })).toEqual(
        ok({
          ids: [],
        }),
      );

      expect(parseQuery({ ids: 'qwe,asd' })).toEqual(
        ok({
          ids: ['qwe', 'asd'],
        }),
      );
    });
  });

  it('extra input values are ignored', () => {
    expect(parseQuery({ badKey: 'badValue' } as any)).toEqual(ok({}));
  });
});

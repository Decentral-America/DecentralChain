import { Either } from 'effect';
import { ParseError } from '../../../errorHandling';
import { parseBool } from '../parseBool';

const ok = <T>(v: T) => Either.right(v);
const err = <E>(v: E) => Either.left(v);

const invalidValueError = err(new ParseError(new Error('Invalid boolean value')));

describe('parseBool should correctly parse', () => {
  it('boolean values', () => {
    expect((parseBool as any)(false)).toEqual(ok(false));
    expect((parseBool as any)(true)).toEqual(ok(true));
  });

  it('falsy string values', () => {
    expect(parseBool('')).toEqual(invalidValueError);
    expect(parseBool('false')).toEqual(ok(false));
    expect(parseBool('FALSE')).toEqual(ok(false));
    expect(parseBool('False')).toEqual(ok(false));
    expect(parseBool('0')).toEqual(invalidValueError);

    expect(parseBool('null')).toEqual(invalidValueError);
    expect(parseBool('NULL')).toEqual(invalidValueError);
    expect(parseBool('Null')).toEqual(invalidValueError);

    expect(parseBool('undefined')).toEqual(invalidValueError);
    expect(parseBool('NaN')).toEqual(invalidValueError);
  });

  it('any other string values', () => {
    expect(parseBool('true')).toEqual(ok(true));
    expect(parseBool('1')).toEqual(invalidValueError);
    expect(parseBool('some string')).toEqual(invalidValueError);
  });

  it('non-string truthy values', () => {
    expect((parseBool as any)(1)).toEqual(invalidValueError);
    expect((parseBool as any)([])).toEqual(invalidValueError);
    expect((parseBool as any)({})).toEqual(invalidValueError);
  });

  it('non-string falsy values', () => {
    expect((parseBool as any)(null)).toEqual(ok(undefined));
    expect(parseBool()).toEqual(ok(undefined));
    expect((parseBool as any)(NaN)).toEqual(invalidValueError);
  });
});

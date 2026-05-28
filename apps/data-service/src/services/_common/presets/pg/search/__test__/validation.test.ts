import { Either, Schema } from 'effect';
import { describe, expect, it } from 'vitest';
import { validateResult } from '../../../validation';

describe('search preset validation', () => {
  it('passes if correct object is provided', () => {
    const schema = Schema.String;
    const validate = validateResult<string>(schema, 'test_search');

    const result = validate('hello');
    expect(Either.isRight(result)).toBe(true);
    if (Either.isRight(result)) {
      expect(result.right).toBe('hello');
    }
  });

  it('applies schema correctly — rejects invalid values', () => {
    const strictSchema = Schema.Literal('allowed');
    const validate = validateResult<string>(strictSchema, 'test_search');

    const result = validate('not-allowed');
    expect(Either.isLeft(result)).toBe(true);
  });
});

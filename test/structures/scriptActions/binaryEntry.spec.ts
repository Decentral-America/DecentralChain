import { describe, expect, test } from 'vitest';
import compiler from '../../../src/index.js';
import * as data from '../../testData/data';

describe('binaryEntry', () => {
  test.each([
    [data.STDLIB_VERSION_4],
    [data.STDLIB_VERSION_5],
  ])('invalid BinaryEntry', (version) => {
    const contract = `
            {-# STDLIB_VERSION ${version} #-}
            {-# CONTENT_TYPE DAPP #-}
            {-# SCRIPT_TYPE ACCOUNT #-}
    
            @Callable(i)
            func binary() = {
                [
                    BinaryEntry(binValue)
                ]
            }
        `;
    const compiled = compiler.compile(contract);
    expect(compiled.error).toContain(
      `Compilation failed: [Function 'BinaryEntry' requires 2 arguments, but 1 are provided in`,
    );
  });
});

import { describe, expect, test } from 'vitest';
import compiler from '../../../src/index.js';
import * as data from '../../testData/data';

describe('dataEntry', () => {
  test('invalid DataEntry', () => {
    const contract = `
        {-# STDLIB_VERSION ${data.STDLIB_VERSION_3} #-}
        {-# CONTENT_TYPE DAPP #-}
        {-# SCRIPT_TYPE ACCOUNT #-}

        @Callable(i)
        func binary() = {
            WriteSet([
                DataEntry("binaryValue")
            ])
        }`;
    const compiled = compiler.compile(contract);
    expect(compiled.error).toContain(
      `Compilation failed: [Function 'DataEntry' requires 2 arguments, but 1 are provided in`,
    );
  });
});

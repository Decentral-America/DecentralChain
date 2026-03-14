import { expect } from 'vitest';
import compiler from '../../src/index.js';
import * as data from '../testData/data';

export const checkCompileResult = (contract, testType) => {
  const compiled = compiler.compile(contract);
  if (testType === data.positiveTestType) {
    expect(compiled.error).toBeUndefined();
  } else if (testType === data.negativeTestType) {
    expect(compiled.error).toBeDefined();
    // biome-ignore lint/suspicious/noConsole: test diagnostic output
    console.log(compiled.error);
  }
};

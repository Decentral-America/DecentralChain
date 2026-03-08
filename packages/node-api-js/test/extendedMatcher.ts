import { expect } from 'vitest';

interface CustomMatchers<R = unknown> {
  isStringOrNumber(): R;
  isNullableString(): R;
  isNullableNumber(): R;
  isNullableStringOrNumber(): R;
}

declare module 'vitest' {
  interface Assertion<T = any> extends CustomMatchers<T> {}
  interface AsymmetricMatchersContaining extends CustomMatchers {}
}

function formatReceived(received: unknown): string {
  return String(received);
}

export function isStringOrNumber(received: any) {
  return {
    pass:
      typeof received === 'string' ||
      received instanceof String ||
      typeof received === 'number' ||
      received instanceof Number,
    message: () =>
      `expected null or instance of 'number' or 'string', but received ${formatReceived(received)}`,
  };
}

export function isNullableString(received: any) {
  return {
    pass: received === null || typeof received === 'string' || received instanceof String,
    message: () =>
      `expected null or instance of 'string', but received ${formatReceived(received)}`,
  };
}

export function isNullableNumber(received: any) {
  return {
    pass: received === null || typeof received === 'number' || received instanceof Number,
    message: () =>
      `expected null or instance of 'number', but received ${formatReceived(received)}`,
  };
}

export function isNullableStringOrNumber(received: any) {
  return {
    pass:
      received === null ||
      typeof received === 'string' ||
      received instanceof String ||
      typeof received === 'number' ||
      received instanceof Number,
    message: () =>
      `expected null or instance of 'number' or 'string', but received ${formatReceived(received)}`,
  };
}

expect.extend({
  isNullableStringOrNumber,
  isStringOrNumber,
  isNullableString,
  isNullableNumber,
});

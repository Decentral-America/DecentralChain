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
    message: () =>
      `expected null or instance of 'number' or 'string', but received ${formatReceived(received)}`,
    pass:
      typeof received === 'string' ||
      received instanceof String ||
      typeof received === 'number' ||
      received instanceof Number,
  };
}

export function isNullableString(received: any) {
  return {
    message: () =>
      `expected null or instance of 'string', but received ${formatReceived(received)}`,
    pass: received === null || typeof received === 'string' || received instanceof String,
  };
}

export function isNullableNumber(received: any) {
  return {
    message: () =>
      `expected null or instance of 'number', but received ${formatReceived(received)}`,
    pass: received === null || typeof received === 'number' || received instanceof Number,
  };
}

export function isNullableStringOrNumber(received: any) {
  return {
    message: () =>
      `expected null or instance of 'number' or 'string', but received ${formatReceived(received)}`,
    pass:
      received === null ||
      typeof received === 'string' ||
      received instanceof String ||
      typeof received === 'number' ||
      received instanceof Number,
  };
}

expect.extend({
  isNullableNumber,
  isNullableString,
  isNullableStringOrNumber,
  isStringOrNumber,
});

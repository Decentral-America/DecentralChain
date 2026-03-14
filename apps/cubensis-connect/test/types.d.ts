/// <reference types="@wdio/globals/types" />
/// <reference types="expect-webdriverio" />

// WebdriverIO provides beforeAll/afterAll at runtime (jest-style hooks)
// but @types/mocha only declares before/after. Declare the aliases here.
declare function beforeAll(fn: (this: Mocha.Context) => void | Promise<void>): void;
declare function afterAll(fn: (this: Mocha.Context) => void | Promise<void>): void;

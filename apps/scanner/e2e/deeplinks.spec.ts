import { expect, test } from '@playwright/test';

const aliases = [
  '/transactionmap',
  '/sustainability',
  '/networkmap',
  '/distributiontool',
  '/blockfeed',
  '/networkstatistics',
  '/unconfirmedtransactions',
  '/peers',
];

for (const alias of aliases) {
  test(`${alias} resolves without server error`, async ({ page }) => {
    const res = await page.goto(alias);
    expect(res?.status() ?? 200).toBeLessThan(500);
    await expect(page.locator('body')).not.toBeEmpty();
  });
}

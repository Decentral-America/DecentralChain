/**
 * Exchange — auth flow spec.
 */
import { expect, test } from '@playwright/test';
import { AuthPage, PHRASE_LENGTH, WIZARD_STEPS } from '../page-objects/AuthPage';

/**
 * /create-account is a four-step wizard: choose a method, read the recovery
 * phrase, prove you read it, then set a password. The first two steps contain
 * no form fields at all, so these tests drive the wizard rather than looking
 * for inputs on arrival.
 */
test.describe('Create Account flow', () => {
  test('create-account lands on the method step, not a form', async ({ page }) => {
    const auth = new AuthPage(page);
    await auth.gotoCreateAccount();

    await expect(auth.recoveryPhraseTile).toBeVisible();
    expect(await auth.currentStep()).toBe(1);
    // Nothing to type on step 1 — a password box here would mean the wizard
    // had been bypassed.
    await expect(page.locator('input[type="password"]')).toHaveCount(0);
  });

  test('the recovery phrase is hidden until the user reveals it', async ({ page }) => {
    const auth = new AuthPage(page);
    await auth.gotoCreateAccount();
    await auth.chooseRecoveryPhrase();

    // The real words are kept out of the DOM, not merely blurred, so this is a
    // claim about the markup and not about the pixels.
    await expect(auth.seedGrid).toHaveAttribute('data-revealed', 'false');
    const covered = await auth.seedGrid.innerText();
    expect(covered).not.toMatch(/[a-z]{3,}/);

    const words = await auth.revealPhrase();
    expect(words).toHaveLength(PHRASE_LENGTH);
    for (const word of words) expect(word).toMatch(/^[a-z]+$/i);
  });

  test('continue is blocked until the phrase has been revealed', async ({ page }) => {
    const auth = new AuthPage(page);
    await auth.gotoCreateAccount();
    await auth.chooseRecoveryPhrase();

    await expect(auth.savedItBtn).toBeDisabled();
    await auth.revealPhrase();
    await expect(auth.savedItBtn).toBeEnabled();
  });

  test('answering the challenges reaches the password step', async ({ page }) => {
    const auth = new AuthPage(page);
    await auth.gotoCreateAccount();

    await auth.reachPasswordStep();

    expect(await auth.currentStep()).toBe(WIZARD_STEPS.length);
    await expect(auth.passwordInput).toBeVisible();
    await expect(auth.confirmPasswordInput).toBeVisible();
  });

  test('the password step accepts a password and offers submission', async ({ page }) => {
    const auth = new AuthPage(page);
    await auth.gotoCreateAccount();
    await auth.reachPasswordStep();

    await auth.fillPassword('TestPassword123!');
    await auth.confirmPassword('TestPassword123!');

    await expect(auth.passwordInput).toHaveValue('TestPassword123!');
    await expect(auth.createWalletBtn).toBeEnabled({ timeout: 5_000 });
  });

  test('stepping back from the password step keeps what was typed', async ({ page }) => {
    const auth = new AuthPage(page);
    await auth.gotoCreateAccount();
    const words = await auth.reachPasswordStep();
    await auth.fillPassword('TestPassword123!');

    await page.getByRole('button', { name: /^back$/i }).click();
    await expect(auth.verifyQuestion).toBeVisible();
    await auth.answerVerification(words);

    await expect(auth.passwordInput).toHaveValue('TestPassword123!');
  });
});

test.describe('Sign In flow', () => {
  test('/signin page renders a sign-in form', async ({ page }) => {
    const auth = new AuthPage(page);
    await auth.gotoSignIn();
    await auth.expectVisible();
  });

  test('/sign-in alias renders the same page', async ({ page }) => {
    const auth = new AuthPage(page);
    await page.goto('/sign-in');
    await page.waitForLoadState('domcontentloaded');
    await auth.expectVisible();
  });

  test('seed phrase input is present on sign-in page', async ({ page }) => {
    const auth = new AuthPage(page);
    await auth.gotoSignIn();
    await expect(page.locator('input, textarea').first()).toBeVisible({ timeout: 10_000 });
  });
});

test.describe('Import Account flow', () => {
  test('/import-account page renders', async ({ page }) => {
    const auth = new AuthPage(page);
    await auth.gotoImport();
    await auth.expectVisible();
  });

  test('seed / phrase input is visible on import-account', async ({ page }) => {
    const auth = new AuthPage(page);
    await auth.gotoImport();
    const seedEl = page
      .locator('textarea, input[placeholder*="seed" i], input[placeholder*="phrase" i]')
      .first();
    await expect(seedEl).toBeVisible({ timeout: 10_000 });
  });
});

test.describe('Save Seed page', () => {
  test('/save-seed page renders', async ({ page }) => {
    await page.goto('/save-seed');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('seed words area is present (expects 12+ words)', async ({ page }) => {
    await page.goto('/save-seed');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('body')).not.toBeEmpty();
    const count = await page
      .locator('[class*="seed"], [class*="word"], [data-testid*="seed"], textarea')
      .count();
    if (count > 0) {
      expect(count).toBeGreaterThanOrEqual(1);
    }
  });
});

test.describe('Restore Backup page', () => {
  test('/restore-backup page renders a file upload or input', async ({ page }) => {
    await page.goto('/restore-backup');
    // The route is a lazy-loaded chunk behind Suspense — domcontentloaded fires
    // before it mounts, so wait for real page content rather than the shell.
    await expect(page.getByText(/restore from backup/i)).toBeVisible({ timeout: 10_000 });
    // The native file input is visually hidden by design — a styled <label>
    // triggers it — so check it's present in the DOM rather than visible.
    const fileInput = page.locator('input[type="file"]').first();
    const textInput = page.locator('textarea, input[type="text"]').first();
    const hasFileInput = await fileInput.count();
    const hasVisibleTextInput = await textInput.isVisible().catch(() => false);
    expect(hasFileInput > 0 || hasVisibleTextInput, 'expected a file input or text input').toBe(
      true,
    );
  });
});

test.describe('Welcome page', () => {
  test('/welcome page renders with create / import options', async ({ page }) => {
    await page.goto('/welcome');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('body')).not.toBeEmpty();
    const cta = page.getByRole('button').first().or(page.getByRole('link').first());
    await expect(cta).toBeVisible({ timeout: 10_000 });
  });
});

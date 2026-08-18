import { expect, type Locator, type Page } from '@playwright/test';

/** Steps the create-wallet wizard walks, in order. */
export const WIZARD_STEPS = ['Start', 'Phrase', 'Secure'] as const;

/** Mirrors the phrase length Seed.create() produces. */
export const PHRASE_LENGTH = 15;

/**
 * Page Object Model for all authentication flows.
 *
 * `/create-account` is a three-step wizard, not a single form: read the intro,
 * reveal and save the recovery phrase, then set a password. Nothing on the
 * first two steps is an `<input>`, so the wizard is driven through the helpers
 * below rather than by reaching for form fields.
 *
 * Selectors prefer test ids and accessible names over structure or copy, so a
 * reworded heading does not red the suite.
 */
export class AuthPage {
  readonly page: Page;
  readonly passwordInput: Locator;
  readonly confirmPasswordInput: Locator;
  readonly nextBtn: Locator;
  readonly importBtn: Locator;
  readonly seedInput: Locator;

  /* ── create-wallet wizard ── */
  readonly stepArea: Locator;
  readonly introContinueBtn: Locator;
  readonly ledgerTile: Locator;
  readonly revealBtn: Locator;
  readonly seedGrid: Locator;
  readonly seedWords: Locator;
  readonly savedItBtn: Locator;
  readonly createWalletBtn: Locator;

  constructor(page: Page) {
    this.page = page;
    this.passwordInput = page.locator('input[type="password"]').first();
    this.confirmPasswordInput = page.locator('input[type="password"]').nth(1);
    this.nextBtn = page.getByRole('button', { name: /next|continue|proceed/i }).first();
    this.importBtn = page.getByRole('button', { name: /import|restore|confirm/i }).first();
    this.seedInput = page
      .locator(
        'textarea, input[placeholder*="seed"], input[placeholder*="phrase"], input[placeholder*="word"]',
      )
      .first();

    this.stepArea = page.getByTestId('wizard-step-area');
    this.introContinueBtn = page.getByRole('button', { name: /^continue$/i }).first();
    // Hidden unless VITE_LEDGER_ENABLED is on *and* the browser speaks WebHID.
    this.ledgerTile = page.getByRole('button', { name: /ledger/i }).first();
    this.revealBtn = page.getByRole('button', { name: /reveal/i }).first();
    this.seedGrid = page.getByTestId('seed-grid');
    this.seedWords = page.getByTestId('seed-word');
    this.savedItBtn = page.getByRole('button', { name: /saved it/i }).first();
    this.createWalletBtn = page.getByRole('button', { name: /^create wallet$/i }).first();
  }

  async gotoCreateAccount(): Promise<void> {
    await this.page.goto('/create-account');
    await this.page.waitForLoadState('domcontentloaded');
    // The route is a lazy chunk behind Suspense — domcontentloaded fires before
    // it mounts, so wait for the wizard itself.
    await expect(this.stepArea).toBeVisible({ timeout: 10_000 });
  }

  async gotoSignIn(): Promise<void> {
    await this.page.goto('/signin');
    await this.page.waitForLoadState('domcontentloaded');
  }

  async gotoImport(): Promise<void> {
    await this.page.goto('/import-account');
    await this.page.waitForLoadState('domcontentloaded');
  }

  async fillPassword(pw: string): Promise<void> {
    await this.passwordInput.fill(pw);
  }

  async confirmPassword(pw: string): Promise<void> {
    await this.confirmPasswordInput.fill(pw);
  }

  async clickNext(): Promise<void> {
    await this.nextBtn.click();
  }

  async fillSeedWords(words: string[]): Promise<void> {
    const wordInputs = await this.page
      .locator('input[name*="word"], input[placeholder*="word"]')
      .all();
    if (wordInputs.length >= words.length) {
      for (let i = 0; i < words.length; i++) {
        await wordInputs[i].fill(words[i]);
      }
    } else {
      await this.seedInput.fill(words.join(' '));
    }
  }

  async clickImport(): Promise<void> {
    await this.importBtn.click();
  }

  async expectVisible(): Promise<void> {
    await expect(this.page.locator('body')).not.toBeEmpty();
    const formElement = this.page.locator('input, textarea, form').first();
    await expect(formElement).toBeVisible({ timeout: 10_000 });
  }

  /* ────────── create-wallet wizard ────────── */

  /** Which step the rail reports, 1-based, matching WIZARD_STEPS. */
  async currentStep(): Promise<number> {
    const rail = this.page.getByRole('progressbar').first();
    return Number(await rail.getAttribute('aria-valuenow'));
  }

  /** Step 1 → step 2. */
  async continueFromIntro(): Promise<void> {
    await this.introContinueBtn.click();
    await expect(this.seedGrid).toBeVisible({ timeout: 10_000 });
  }

  /**
   * Step 2: uncover the phrase and read it back.
   *
   * The words are deliberately absent from the DOM until revealed, so this has
   * to click before it can read — that ordering is the guarantee under test.
   */
  async revealPhrase(): Promise<string[]> {
    await expect(this.seedGrid).toHaveAttribute('data-revealed', 'false');
    await this.revealBtn.click();
    await expect(this.seedGrid).toHaveAttribute('data-revealed', 'true');

    const slots = await this.seedWords.all();
    const words: string[] = [];
    for (const slot of slots) {
      const text = (await slot.innerText()).trim();
      // Each slot reads "<position> <word>"; the word is the last token.
      words.push(text.split(/\s+/).pop() ?? '');
    }
    return words;
  }

  /**
   * Step 2 → step 3. Only enabled once the phrase has been revealed — that
   * reveal is the whole of the evidence behind the wallet's `hasBackup` flag.
   */
  async confirmPhraseSaved(): Promise<void> {
    await expect(this.savedItBtn).toBeEnabled();
    await this.savedItBtn.click();
    await expect(this.passwordInput).toBeVisible({ timeout: 10_000 });
  }

  /** The whole wizard up to, but not including, submitting the password step. */
  async reachPasswordStep(): Promise<string[]> {
    await this.continueFromIntro();
    const words = await this.revealPhrase();
    await this.confirmPhraseSaved();
    return words;
  }
}

import { expect, type Locator, type Page } from '@playwright/test';

/** Steps the create-wallet wizard walks, in order. */
export const WIZARD_STEPS = ['Method', 'Phrase', 'Verify', 'Secure'] as const;

/** Mirrors CHALLENGE_COUNT in src/features/auth/create-wallet/verification.ts. */
export const CHALLENGE_COUNT = 3;

/** Mirrors the phrase length Seed.create() produces. */
export const PHRASE_LENGTH = 15;

/**
 * Page Object Model for all authentication flows.
 *
 * `/create-account` is a four-step wizard, not a single form: choose a method,
 * read the recovery phrase, answer three "which word was at position N"
 * challenges, then set a password. Nothing on the first two steps is an
 * `<input>`, so the wizard is driven through the helpers below rather than by
 * reaching for form fields.
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
  readonly recoveryPhraseTile: Locator;
  readonly revealBtn: Locator;
  readonly seedGrid: Locator;
  readonly seedWords: Locator;
  readonly savedItBtn: Locator;
  readonly verifyQuestion: Locator;
  readonly verifyChoices: Locator;
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
    this.recoveryPhraseTile = page.getByRole('button', { name: /recovery phrase/i }).first();
    this.revealBtn = page.getByRole('button', { name: /reveal/i }).first();
    this.seedGrid = page.getByTestId('seed-grid');
    this.seedWords = page.getByTestId('seed-word');
    this.savedItBtn = page.getByRole('button', { name: /saved it/i }).first();
    this.verifyQuestion = page.getByTestId('verify-question');
    this.verifyChoices = page.getByTestId('verify-choice');
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
  async chooseRecoveryPhrase(): Promise<void> {
    await this.recoveryPhraseTile.click();
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

  /** Step 2 → step 3. Only enabled once the phrase has been revealed. */
  async confirmPhraseSaved(): Promise<void> {
    await expect(this.savedItBtn).toBeEnabled();
    await this.savedItBtn.click();
    await expect(this.verifyQuestion).toBeVisible({ timeout: 10_000 });
  }

  /**
   * Step 3 → step 4: answer every challenge from the phrase just read.
   *
   * The position comes off `data-position` rather than out of the sentence, so
   * rewording the question does not break the suite. Positions never repeat
   * within a set, so waiting for `data-position` to change is a reliable way to
   * know the next question has actually rendered.
   */
  async answerVerification(words: string[], count = CHALLENGE_COUNT): Promise<void> {
    let previous: string | null = null;

    for (let asked = 0; asked < count; asked++) {
      await expect(this.verifyQuestion).toBeVisible({ timeout: 10_000 });
      if (previous !== null) {
        await expect(this.verifyQuestion).not.toHaveAttribute('data-position', previous);
      }

      const position = await this.verifyQuestion.getAttribute('data-position');
      previous = position;
      const answer = words[Number(position) - 1];
      await this.verifyChoices
        .filter({ hasText: new RegExp(`^${answer}$`) })
        .first()
        .click();
    }

    await expect(this.passwordInput).toBeVisible({ timeout: 10_000 });
  }

  /** The whole wizard up to, but not including, submitting the password step. */
  async reachPasswordStep(): Promise<string[]> {
    await this.chooseRecoveryPhrase();
    const words = await this.revealPhrase();
    await this.confirmPhraseSaved();
    await this.answerVerification(words);
    return words;
  }
}

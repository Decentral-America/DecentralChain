/**
 * Clipboard utilities for WebDriverIO E2E tests.
 *
 * Reads from the system clipboard via the Clipboard API inside the browser context.
 * Requires the Chrome `--use-fake-ui-for-media-stream` flag or the Selenium
 * container permission policy that grants `clipboard-read` automatically.
 */

/**
 * Reads the current text content of the system clipboard.
 * Falls back to a focused textarea paste if Clipboard API is unavailable.
 */
export async function readClipboardText(): Promise<string> {
  return browser.executeAsync(async (done: (result: string) => void) => {
    try {
      const text = await navigator.clipboard.readText();
      done(text);
    } catch {
      // Fallback: create a textarea, focus and paste
      const textarea = document.createElement('textarea');
      document.body.appendChild(textarea);
      textarea.focus();
      document.execCommand('paste');
      const text = textarea.value;
      document.body.removeChild(textarea);
      done(text);
    }
  });
}

/**
 * Writes text to the system clipboard.
 */
export async function writeClipboardText(text: string): Promise<void> {
  await browser.execute(async (t: string) => {
    await navigator.clipboard.writeText(t);
  }, text);
}

/**
 * Clears the clipboard by writing an empty string.
 */
export async function clearClipboard(): Promise<void> {
  await writeClipboardText('');
}

/**
 * Asserts that the clipboard contains the expected text.
 * Uses waitUntil for timing-safe assertion (copy may be async).
 */
export async function expectClipboardToBe(expected: string): Promise<void> {
  await browser.waitUntil(
    async () => {
      const text = await readClipboardText();
      return text === expected;
    },
    {
      timeout: 5000,
      timeoutMsg: `Expected clipboard to contain "${expected}"`,
    },
  );
}

/**
 * Asserts that the clipboard contains text matching a pattern.
 */
export async function expectClipboardToMatch(pattern: RegExp): Promise<void> {
  await browser.waitUntil(
    async () => {
      const text = await readClipboardText();
      return pattern.test(text);
    },
    {
      timeout: 5000,
      timeoutMsg: `Expected clipboard to match ${pattern}`,
    },
  );
}

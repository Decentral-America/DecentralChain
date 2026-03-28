import type { ChainablePromiseElement } from 'webdriverio';

const PasswordModal = (wrapped: ChainablePromiseElement) => ({
  get cancelButton() {
    return wrapped.$('#passwordCancel');
  },
  get passwordInput() {
    return wrapped.$("[class*='password@Input']");
  },
});

export const AccountInfoScreen = {
  get address() {
    return this.root.$("#accountInfoAddress [class*='copyTextOverflow@copy']");
  },

  get backupPhrase() {
    return this.root.$("#accountInfoBackupPhrase [class*='copyTextOverflow@copy']");
  },

  get backupPhraseCopyButton() {
    return this.root.$("#accountInfoBackupPhrase [class*='lastIcon@copy']");
  },

  get deleteAccountButton() {
    return this.root.findByText$('Delete account');
  },

  get name() {
    return this.root.$("[class*='accountName@accountInfo']");
  },

  get notification() {
    return $('.modal.notification');
  },

  get passwordModal() {
    return PasswordModal($("[class*='modalWrapper@modal']"));
  },

  get privateKey() {
    return this.root.$("#accountInfoPublicKey [class*='copyTextOverflow@copy']");
  },

  get privateKeyCopyButton() {
    return this.root.$("#accountInfoPrivateKey [class*='lastIcon@copy']");
  },

  get publicKey() {
    return this.root.$("#accountInfoPublicKey [class*='copyTextOverflow@copy']");
  },
  get root() {
    return $("[class*='content@accountInfo']");
  },
};

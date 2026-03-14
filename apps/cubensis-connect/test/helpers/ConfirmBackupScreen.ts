import { type ChainablePromiseElement } from 'webdriverio';

const PillsContainer = (wrapped: ChainablePromiseElement) => ({
  getAllPills: async () => {
    return wrapped.$$("[class*='pill@pills']:not([class*='hiddenPill@pills'])");
  },
  getPillByText: async (text: string) => {
    return wrapped.$(
      `.//*[contains(@class, 'pill@pills') and not(contains(@class, 'hiddenPill@pills')) and contains(., '${text}')]`,
    );
  },
});

export const ConfirmBackupScreen = {
  get clearLink() {
    return this.root.findByText$('Clear');
  },

  get confirmButton() {
    return this.root.findByText$('Confirm');
  },

  get errorMessage() {
    return this.root.$("[class*='error@error']");
  },
  get root() {
    return $("[class*='content@confirmBackup']");
  },

  get selectedPillsContainer() {
    return PillsContainer(this.root.$("[class*='readSeed@confirmBackup']"));
  },

  get suggestedPillsContainer() {
    return PillsContainer(this.root.$("[class*='writeSeed@confirmBackup']"));
  },
};

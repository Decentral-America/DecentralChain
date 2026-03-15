export const BackupSeedScreen = {
  get continueButton() {
    return this.root.findByText$('Continue');
  },
  get root() {
    return $("[class*='content@backupSeed']");
  },

  get seed() {
    return this.root.$("[class*='plateMargin@backupSeed']");
  },
};

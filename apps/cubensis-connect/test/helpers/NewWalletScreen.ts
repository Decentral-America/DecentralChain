export const NewWalletScreen = {
  get accountAddress() {
    return this.root.$("[class*='greyLine@newwallet']");
  },

  get avatars() {
    return this.root.$$("[class*='avatar@avatar']");
  },

  get continueButton() {
    return this.root.findByText$('Continue');
  },
  get root() {
    return $("[class*='content@newwallet']");
  },
};

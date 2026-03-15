export const ImportViaSeedScreen = {
  get address() {
    return this.root.findByTestId$('address');
  },

  get errorMessage() {
    return this.root.findByTestId$('validationError');
  },

  get importAccountButton() {
    return this.root.findByText$('Import Account');
  },
  get root() {
    return $("[class*='content@importSeed']");
  },

  get seedInput() {
    return this.root.$("[class*='input@Input']");
  },

  get switchAccountButton() {
    return this.root.findByText$('Switch account');
  },
};

export const ChangeAccountNameScreen = {
  get currentName() {
    return this.root.$('#currentAccountName');
  },

  get error() {
    return this.root.findByTestId$('newAccountNameError');
  },

  get newNameInput() {
    return this.root.$('#newAccountName');
  },
  get root() {
    return $("[class*='content@changeName']");
  },

  get saveButton() {
    return this.root.$('#save');
  },
};

export const ChangePasswordScreen = {
  get newPasswordError() {
    return this.root.findByTestId$('firstError');
  },

  get newPasswordInput() {
    return this.root.$('#first');
  },

  get notification() {
    return $('.modal.notification');
  },

  get oldPasswordError() {
    return this.root.findByTestId$('oldError');
  },

  get oldPasswordInput() {
    return this.root.$('#old');
  },

  get passwordConfirmationError() {
    return this.root.findByTestId$('secondError');
  },

  get passwordConfirmationInput() {
    return this.root.$('#second');
  },
  get root() {
    return $("[class*='newPassword@changePassword']");
  },

  get saveButton() {
    return this.root.findByText$('Save');
  },
};

export const LoginScreen = {
  get enterButton() {
    return this.root.$('#loginEnter');
  },

  get forgotPasswordLink() {
    return this.root.findByText$('I forgot password');
  },

  get passwordError() {
    return this.root.findByTestId$('loginPasswordError');
  },

  get passwordInput() {
    return this.root.$('#loginPassword');
  },
  get root() {
    return $("[class*='content@login']");
  },
};

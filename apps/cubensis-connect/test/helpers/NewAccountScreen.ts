export const NewAccountScreen = {
  get continueButton() {
    return this.root.findByText$('Continue');
  },

  get passwordConfirmationError() {
    return this.root.findByTestId$('secondError');
  },

  get passwordConfirmationInput() {
    return this.root.$('#second');
  },

  get passwordError() {
    return this.root.findByTestId$('firstError');
  },

  get passwordInput() {
    return this.root.$('#first');
  },

  get privacyPolicyCheckbox() {
    return this.root.findByLabelText$('I have read and agree with the Privacy Policy');
  },
  get root() {
    return browser.findByTestId$('newAccountForm');
  },

  get termsAndConditionsCheckbox() {
    return this.root.findByLabelText$('I have read and agree with the Terms and Conditions');
  },
};

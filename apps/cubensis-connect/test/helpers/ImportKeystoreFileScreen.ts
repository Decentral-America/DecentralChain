export const ImportKeystoreFileScreen = {
  get continueButton() {
    return this.root.findByTestId$('submitButton');
  },

  get fileInput() {
    return this.root.findByTestId$('fileInput');
  },

  get passwordInput() {
    return this.root.findByTestId$('passwordInput');
  },
  get root() {
    return $("[class*='root@chooseFile']");
  },
};

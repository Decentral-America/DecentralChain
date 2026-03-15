export const DeleteAccountScreen = {
  get deleteAccountButton() {
    return this.root.findByText$('Delete account');
  },
  get root() {
    return $("[class*='content@deleteAccount']");
  },
};

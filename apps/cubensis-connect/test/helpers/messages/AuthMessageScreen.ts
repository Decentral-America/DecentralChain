export const AuthMessageScreen = {
  get addToBlacklistButton() {
    return this.root.$('#rejectForever');
  },

  get allowMessagesCheckbox() {
    return this.root.findByText$('Allow sending messages');
  },

  get authButton() {
    return this.root.findByText$('Auth');
  },

  get permissionDetailsButton() {
    return this.root.findByText$('Permission details');
  },

  get rejectArrowButton() {
    return this.root.$("[class*='arrowButton@dropdownButton']");
  },
  get root() {
    return $("[class*='transaction@']");
  },

  async setResolutionTime(time: string) {
    await this.root.$("[class*='trigger@Select']").click();
    await this.root.findByText$(time, { selector: "[class*='item@Select']" }).click();
  },

  get spendingLimitInput() {
    return this.root.$("[class*='amountInput@']");
  },
};

export const GeneralSettingsScreen = {
  get changePasswordLink() {
    return this.root.$('#changePassword');
  },

  get root() {
    return $("[class*='content@settings']");
  },
  setSessionTimeoutByName: async (name: string) => {
    const currentValue = await browser.$("[class*='trigger@Select-module']").getText();
    if (currentValue === name) return;
    await $("[class*='trigger@Select-module']").click();
    await browser.findByText$(name, { selector: "[class*='item@Select-module']" }).click();
  },
};

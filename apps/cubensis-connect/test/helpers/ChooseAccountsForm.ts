const Account = (wrapped: any) => ({
  get checkbox() {
    return wrapped.$("[name='selected']");
  },

  async getAddress() {
    return await wrapped.getAttribute('title');
  },

  async isSelected() {
    const checkbox = await this.checkbox;
    if (!(await checkbox.isExisting())) return null;
    return await checkbox.isSelected();
  },
  get name() {
    return wrapped.findByTestId$('accountName');
  },
});

const AccountsGroup = (wrapped: any) => ({
  get accounts() {
    return wrapped.findAllByTestId$('accountCard').map((it: any) => Account(it));
  },
  get label() {
    return wrapped.findByTestId$('accountsGroupLabel');
  },
});

export const ChooseAccountsForm = {
  get accounts() {
    return this.root.findAllByTestId$('accountCard').map((it: any) => Account(it));
  },

  get accountsGroups() {
    return this.root.findAllByTestId$('accountsGroup').map((it: any) => AccountsGroup(it));
  },

  get exportButton() {
    return this.root.findByTestId$('exportButton');
  },

  async getAccountByAddress(address: string) {
    return Account(
      await this.root.$(
        `[data-testid='accountCard'][title='${address}'], [class*='accountListItem@chooseItems'][title='${address}']`,
      ),
    );
  },

  get importButton() {
    return this.root.findByTestId$('submitButton');
  },

  get modalEnterButton() {
    return browser.findByTestId$('verifyButton');
  },

  get modalPasswordInput() {
    return browser.findByTestId$('passwordInput');
  },
  get root() {
    return $("[class*='root@chooseItems'],[class*='root@chooseAccounts']");
  },

  get skipButton() {
    return this.root.findByText$('Skip');
  },
};

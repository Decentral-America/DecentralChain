const Account = (wrapped: any) => ({
  get accountInfoButton() {
    return wrapped.findByTestId$('accountInfoButton');
  },

  get name() {
    return wrapped.findByTestId$('accountName');
  },
  get root() {
    return wrapped;
  },
});

export const OtherAccountsScreen = {
  get accounts() {
    return this.root.queryAllByTestId$('accountCard').map((it: any) => Account(it));
  },

  get accountsNote() {
    return this.root.findByTestId$('accountsNote');
  },

  get addAccountButton() {
    return this.root.findByText$('Add account');
  },

  async getAccountByName(accountName: string) {
    return Account(
      await this.root.$(`.//*[@data-testid='accountCard' and contains(., '${accountName}')]`),
    );
  },
  get root() {
    return browser.findByTestId$('otherAccountsPage');
  },

  get searchClearButton() {
    return this.root.findByTestId$('searchClear');
  },

  get searchInput() {
    return this.root.findByTestId$('accountsSearchInput');
  },
};

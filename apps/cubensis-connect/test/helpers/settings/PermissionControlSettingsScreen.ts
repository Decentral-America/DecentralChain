import { type ChainablePromiseElement } from 'webdriverio';

const Permission = (wrapped: any) => ({
  get detailsIcon() {
    return wrapped.$("[class*='settings@list']");
  },

  get enableCheckbox() {
    return wrapped.$('button');
  },

  get origin() {
    return wrapped.$('div');
  },
  get root() {
    return wrapped;
  },

  get status() {
    return wrapped.$("[class*='statusColor@list']");
  },
});

const PermissionDetailsModal = (wrapped: ChainablePromiseElement) => ({
  get allowMessagesCheckbox() {
    return browser.$("[class*='modalWrapper@modal']").findByText$('Allow sending messages');
  },

  get deleteButton() {
    return wrapped.$('#delete');
  },
  get root() {
    return wrapped;
  },

  get saveButton() {
    return wrapped.$('#save');
  },

  async setResolutionTime(time: string) {
    await wrapped.$("[class*='trigger@Select']").click();
    await browser.findByText$(time, { selector: "[class*='item@Select']" }).click();
  },

  get spendingLimitInput() {
    return wrapped.$("[class*='amountInput@settings']");
  },
});

export const PermissionControlSettingsScreen = {
  async getPermissionByOrigin(origin: string) {
    return Permission(await this.root.findByText$(origin).parentElement());
  },

  get permissionDetailsModal() {
    return PermissionDetailsModal($("[class*='modalWrapper@modal']"));
  },

  get permissionItems() {
    return this.root.$$("[class*='permissionItem@list']").map((it: any) => Permission(it));
  },
  get root() {
    return $("[class*='content@permissionsSettings']");
  },

  get whiteListLink() {
    return this.root.findByText$('White list');
  },
};

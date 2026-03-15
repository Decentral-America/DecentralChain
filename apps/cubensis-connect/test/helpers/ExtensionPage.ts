export const ExtensionPage = {
  get devModeToggle() {
    return this.toolbar.shadow$('#devMode');
  },

  get enableToggle() {
    return this.extensionDetails.shadow$('#enableToggle');
  },

  get extensionDetails() {
    return this.root.shadow$('extensions-detail-view');
  },
  get root() {
    return browser.$('extensions-manager');
  },

  get toolbar() {
    return this.root.shadow$('extensions-toolbar');
  },

  get updateButton() {
    return this.toolbar.shadow$('#updateNow');
  },
};

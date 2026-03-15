export const NetworksMenu = {
  get editButton() {
    return this.root.$("[class*='editButton@bottomPanel']");
  },

  networkByName(network: string) {
    return this.root.findByText$(network, {
      selector: "[class*='dropdownItem@bottomPanel']",
    });
  },

  get networkMenuButton() {
    return this.root.$("[class*='dropdownButton@bottomPanel']");
  },
  get root() {
    return $("[class*='network@bottomPanel']");
  },
};

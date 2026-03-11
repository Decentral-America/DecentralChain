export const ContentScript = {
  waitForCubensisConnect() {
    return browser.executeAsync((done: () => void) => {
      (function poll() {
        if (typeof CubensisConnect !== 'undefined') done();
        else setTimeout(() => poll(), 100);
      })();
    });
  },
};

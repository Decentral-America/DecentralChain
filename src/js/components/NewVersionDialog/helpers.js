export const isDialogEnabled = () => {
  const url = new URL(window.location);

  return !/faucet/.test(url.pathname);
  // return url.searchParams.has('new_version');
};

export const setRedirectCookie = () => {
  const cookieName = 'new_version_url';
  const newVersionUrl = 'https://decentralscan.com';
  const expires = new Date(2023, 11, 31);

  if (globalThis.cookieStore) {
    cookieStore.set({ name: cookieName, value: newVersionUrl, path: '/', expires });
  } else {
    const cookie = `${cookieName}=${encodeURIComponent(newVersionUrl)};path=/;expires=${expires.toUTCString()};`;
    // Fallback: direct cookie access required for browsers without Cookie Store API
    Object.getOwnPropertyDescriptor(Document.prototype, 'cookie').set.call(document, cookie);
  }
};

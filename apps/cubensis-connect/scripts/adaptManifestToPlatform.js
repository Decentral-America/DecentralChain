const action = {
  default_icon: {
    16: 'icons/icon_16.png',
    24: 'icons/icon_24.png',
    32: 'icons/icon_32.png',
    48: 'icons/icon_48.png',
    64: 'icons/icon_64.png',
    96: 'icons/icon_96.png',
    128: 'icons/icon_128.png',
    192: 'icons/icon_192.png',
    256: 'icons/icon_256.png',
    512: 'icons/icon_512.png',
  },
  default_popup: 'popup.html',
  default_title: 'Cubensis Connect',
};

const contentSecurityPolicy =
  "default-src 'self'; object-src 'self'; script-src 'self' 'wasm-unsafe-eval'; style-src 'self'; img-src 'self' data:; connect-src 'self' https://*.decentralchain.io";

const commandsMV2 = {
  _execute_browser_action: {
    suggested_key: {
      chromeos: 'Alt+Shift+K',
      linux: 'Alt+Shift+K',
      mac: 'Alt+Shift+K',
      windows: 'Alt+Shift+K',
    },
  },
};

const commandsMV3 = {
  _execute_action: {
    suggested_key: {
      chromeos: 'Alt+Shift+K',
      linux: 'Alt+Shift+K',
      mac: 'Alt+Shift+K',
      windows: 'Alt+Shift+K',
    },
  },
};

const manifestV2 = {
  background: {
    scripts: ['background.js'],
  },
  browser_action: action,
  commands: commandsMV2,
  content_security_policy: contentSecurityPolicy,
  manifest_version: 2,
  web_accessible_resources: ['inpage.js'],
};

const manifestV3 = {
  action,
  background: {
    service_worker: 'background.js',
  },
  commands: commandsMV3,
  content_security_policy: {
    extension_pages: contentSecurityPolicy,
  },
  host_permissions: ['http://*/*', 'https://*/*'],
  manifest_version: 3,
  web_accessible_resources: [
    { matches: ['<all_urls>'], resources: ['inpage.js'], use_dynamic_url: true },
  ],
};

const platformValues = {
  chrome: manifestV3,
  edge: manifestV3,
  firefox: {
    ...manifestV2,
    browser_specific_settings: {
      gecko: {
        id: 'soporte@decentralchain.io',
      },
    },
  },
  opera: manifestV2,
};

export default (buffer, platformName) => ({
  ...JSON.parse(buffer.toString('utf-8')),
  version: process.env.CUBENSIS_VERSION,
  ...platformValues[platformName],
});

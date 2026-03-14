# Electron Auto-Update Configuration

## Overview

The DCC Wallet desktop application uses `electron-updater` to automatically check for and install updates. This ensures users always have the latest features and security patches.

## How It Works

1. **Check for Updates**: On app startup (production only), the app checks GitHub releases for updates
2. **Download**: If an update is available, it's automatically downloaded in the background
3. **Notify**: User is notified when update is downloaded and ready to install
4. **Install**: User can install immediately or defer until next app quit

## Architecture

### Main Process (electron/main.ts)

```typescript
import { autoUpdater } from 'electron-updater';

// Configure
autoUpdater.autoDownload = true; // Auto-download updates
autoUpdater.autoInstallOnAppQuit = true; // Install on quit

// Check for updates (production only)
app.whenReady().then(() => {
  if (process.env.NODE_ENV === 'production') {
    autoUpdater.checkForUpdatesAndNotify();
  }
});

// Event handlers
autoUpdater.on('update-available', (info) => {
  mainWindow?.webContents.send('app:update-available', info);
});

autoUpdater.on('update-downloaded', (info) => {
  mainWindow?.webContents.send('app:update-downloaded', info);
});
```

### Preload Script (electron/preload.ts)

Exposes safe IPC channels to renderer:

```typescript
const electronAPI = {
  on: (channel, callback) => {
    // Listen for update events
    // Channels: app:update-available, app:update-downloaded, etc.
  },
  invoke: async (channel, ...args) => {
    // Call update functions
    // Channels: app:check-for-updates, app:install-update, etc.
  },
};
```

### Renderer Process (React App)

```typescript
// Listen for updates
useEffect(() => {
  if (!window.electron) return;
  
  const unsubscribeAvailable = window.electron.on('app:update-available', (info) => {
    console.log('Update available:', info.version);
    // Show notification to user
  });
  
  const unsubscribeDownloaded = window.electron.on('app:update-downloaded', (info) => {
    console.log('Update downloaded:', info.version);
    // Show "Install Now" button
  });
  
  return () => {
    unsubscribeAvailable();
    unsubscribeDownloaded();
  };
}, []);

// Install update
const installUpdate = async () => {
  await window.electron.invoke('app:install-update');
};
```

## IPC Channels

### Events (Main → Renderer)

| Channel | Payload | Description |
|---------|---------|-------------|
| `app:update-available` | `{ version, releaseDate, releaseNotes }` | New version available |
| `app:update-progress` | `{ percent, transferred, total }` | Download progress |
| `app:update-downloaded` | `{ version, releaseDate }` | Update ready to install |
| `app:update-error` | `{ message }` | Update error occurred |

### Handlers (Renderer → Main)

| Channel | Args | Returns | Description |
|---------|------|---------|-------------|
| `app:check-for-updates` | - | `{ success, updateInfo }` | Manually check for updates |
| `app:install-update` | - | void | Install update and restart |
| `app:get-version` | - | string | Get current app version |
| `app:get-path` | name | string | Get app directory path |

## Publishing Updates

### 1. GitHub Releases

The app is configured to check GitHub releases for updates:

```json
// package.json
{
  "build": {
    "publish": {
      "provider": "github",
      "owner": "decentralchain",
      "repo": "dcc-wallet"
    }
  }
}
```

### 2. Build and Release

```bash
# Build for all platforms
npm run electron:build

# Or platform-specific
npm run electron:build:mac
npm run electron:build:win
npm run electron:build:linux
```

### 3. Upload to GitHub

1. Create a new GitHub release with a version tag (e.g., `v1.2.0`)
2. Upload the built files from `release/` directory:
   - macOS: `DCC-Wallet-1.2.0.dmg`, `DCC-Wallet-1.2.0-mac.zip`
   - Windows: `DCC-Wallet-Setup-1.2.0.exe`, `DCC-Wallet-1.2.0.exe` (portable)
   - Linux: `DCC-Wallet-1.2.0.AppImage`, `dcc-wallet_1.2.0_amd64.deb`
3. Include `latest.yml` (macOS), `latest-mac.yml`, or `latest-linux.yml` for auto-updater metadata

### 4. Automated Publishing (CI/CD)

```yaml
# .github/workflows/release.yml
name: Release

on:
  push:
    tags:
      - 'v*'

jobs:
  release:
    runs-on: ${{ matrix.os }}
    strategy:
      matrix:
        os: [macos-latest, ubuntu-latest, windows-latest]
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build React app
        run: npm run build
      
      - name: Build Electron app
        run: npm run electron:build
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
      
      - name: Upload artifacts
        uses: actions/upload-artifact@v3
        with:
          name: ${{ matrix.os }}-build
          path: release/
```

## Version Management

### Versioning Strategy

Follow [Semantic Versioning](https://semver.org/):

- **Major** (1.0.0 → 2.0.0): Breaking changes
- **Minor** (1.0.0 → 1.1.0): New features
- **Patch** (1.0.0 → 1.0.1): Bug fixes

### Update package.json Version

```bash
# Patch (1.0.0 → 1.0.1)
npm version patch

# Minor (1.0.0 → 1.1.0)
npm version minor

# Major (1.0.0 → 2.0.0)
npm version major
```

This automatically:
1. Updates `package.json` version
2. Creates a git commit
3. Creates a git tag
4. Runs `preversion` and `postversion` scripts

## Code Signing

### macOS

```json
// package.json
{
  "build": {
    "mac": {
      "hardenedRuntime": true,
      "gatekeeperAssess": false,
      "entitlements": "electron/entitlements.mac.plist"
    }
  }
}
```

**Steps**:
1. Get Apple Developer account
2. Create a Developer ID Application certificate
3. Set environment variables:
   ```bash
   export CSC_LINK=/path/to/certificate.p12
   export CSC_KEY_PASSWORD=your-password
   export APPLEID=your-apple-id
   export APPLEID_PASSWORD=app-specific-password
   ```
4. Build: `npm run electron:build:mac`

### Windows

```json
// package.json
{
  "build": {
    "win": {
      "certificateFile": "path/to/certificate.pfx",
      "certificatePassword": "env:CERTIFICATE_PASSWORD"
    }
  }
}
```

**Steps**:
1. Purchase a code signing certificate
2. Set environment variable:
   ```bash
   export CERTIFICATE_PASSWORD=your-password
   ```
3. Build: `npm run electron:build:win`

## Testing Updates

### Local Testing

1. **Build v1.0.0**:
   ```bash
   npm version 1.0.0
   npm run electron:build
   ```

2. **Install v1.0.0** on your machine

3. **Build v1.0.1**:
   ```bash
   npm version 1.0.1
   npm run electron:build
   ```

4. **Create local server**:
   ```bash
   cd release
   npx http-server -p 8080
   ```

5. **Update electron-builder.dev.yml**:
   ```yaml
   provider: generic
   url: http://localhost:8080
   ```

6. **Launch v1.0.0** and check if it detects v1.0.1

### Development Mode

Auto-updates are disabled in development mode:

```typescript
if (process.env.NODE_ENV === 'production') {
  autoUpdater.checkForUpdatesAndNotify();
}
```

To test in development, remove this check temporarily.

## Troubleshooting

### Update Not Detected

**Check**:
1. App is running in production mode
2. GitHub release is published (not draft)
3. `latest.yml` is uploaded to release
4. Version in `latest.yml` is higher than current

**Debug**:
```typescript
autoUpdater.on('checking-for-update', () => {
  console.log('Checking for updates...');
});

autoUpdater.on('update-not-available', (info) => {
  console.log('No update available:', info);
});
```

### Download Fails

**Check**:
1. Release assets are publicly accessible
2. Network connectivity
3. Firewall settings

**Debug**:
```typescript
autoUpdater.on('error', (error) => {
  console.error('Update error:', error);
});

autoUpdater.on('download-progress', (progress) => {
  console.log(`Downloaded ${progress.percent}%`);
});
```

### Install Fails

**Check**:
1. App has write permissions
2. App is not running from read-only location (macOS DMG)
3. Enough disk space

### Code Signing Issues

**macOS Notarization Failed**:
```bash
# Check notarization status
xcrun altool --notarization-info <request-uuid> -u your-apple-id

# Staple ticket to app
xcrun stapler staple "DCC Wallet.app"
```

**Windows SmartScreen**:
- Purchase EV certificate for instant SmartScreen reputation
- Or accumulate reputation over time (users need to click "More Info" → "Run Anyway")

## Best Practices

### 1. Test Thoroughly

- Test update flow on all platforms
- Test rollback scenarios
- Test update during active operations

### 2. Communicate Changes

- Include detailed release notes
- Highlight breaking changes
- Provide migration guides

### 3. Gradual Rollout

- Release to beta testers first
- Monitor error rates
- Gradually increase rollout percentage

### 4. Backup User Data

Before major updates:
```typescript
autoUpdater.on('update-downloaded', async () => {
  // Backup user data
  await backupUserData();
  
  // Then install
  autoUpdater.quitAndInstall();
});
```

### 5. Handle Update Failures

```typescript
let updateCheckAttempts = 0;
const MAX_ATTEMPTS = 3;

autoUpdater.on('error', (error) => {
  updateCheckAttempts++;
  
  if (updateCheckAttempts < MAX_ATTEMPTS) {
    // Retry after delay
    setTimeout(() => {
      autoUpdater.checkForUpdates();
    }, 60000); // 1 minute
  }
});
```

### 6. User Control

Always let users:
- Skip updates
- Install later
- Check for updates manually

```typescript
// Allow manual check
ipcMain.handle('app:check-for-updates', async () => {
  return await autoUpdater.checkForUpdates();
});

// Don't force quit - let user choose when to install
autoUpdater.autoInstallOnAppQuit = false;
```

## Security Considerations

### 1. HTTPS Only

electron-updater only accepts HTTPS URLs for security.

### 2. Code Signature Verification

Always verify signatures:
```typescript
autoUpdater.on('update-downloaded', (info) => {
  // Verify signature before installing
  if (!verifySignature(info)) {
    console.error('Invalid update signature!');
    return;
  }
  
  autoUpdater.quitAndInstall();
});
```

### 3. Checksum Validation

electron-updater automatically verifies SHA-512 checksums.

### 4. Secure Storage

Never store credentials in code:
```bash
# Use environment variables
export GH_TOKEN=your-github-token
export CSC_KEY_PASSWORD=your-cert-password
```

## Resources

- [electron-updater Documentation](https://www.electron.build/auto-update)
- [electron-builder Publishing](https://www.electron.build/configuration/publish)
- [GitHub Releases API](https://docs.github.com/en/rest/releases)
- [Code Signing Guide](https://www.electron.build/code-signing)

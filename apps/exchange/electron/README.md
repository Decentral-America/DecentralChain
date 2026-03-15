# Electron Desktop Application

This directory contains the Electron main process and configuration for packaging the DecentralExchange as a desktop application.

## Files

- **main.ts** - Electron main process entry point
- **preload.ts** - Preload script for secure IPC communication
- **electron.d.ts** - TypeScript type definitions for window.electron API
- **tsconfig.json** - TypeScript configuration for Electron code

## Development

### Run in Development Mode

```bash
# Terminal 1: Start Vite dev server
npm run dev

# Terminal 2: Start Electron
npm run electron:dev
```

The Electron app will load from the Vite dev server (http://localhost:5173) with hot-reload support.

### Build for Production

```bash
# Build React app
npm run build

# Build Electron app (all platforms)
npm run electron:build

# Build for specific platform
npm run electron:build:mac
npm run electron:build:win
npm run electron:build:linux
```

Built applications will be in the `release/` directory.

## Architecture

### Main Process (main.ts)

- Creates and manages the BrowserWindow
- Loads the React app (dev server or built files)
- Handles window lifecycle (create, close, activate)
- Prevents navigation to external URLs
- Blocks new window creation for security

### Preload Script (preload.ts)

- Safely exposes Electron APIs to renderer via `contextBridge`
- Provides whitelisted IPC channels for:
  - `send()` - One-way messages to main process
  - `on()` - Listen for messages from main process
  - `invoke()` - Request/response pattern with main process
- Includes platform and version information

### Security Features

- **nodeIntegration: false** - Disables Node.js in renderer
- **contextIsolation: true** - Isolates Electron APIs
- **sandbox: true** - Sandboxed renderer process
- **Whitelisted IPC channels** - Only specific channels allowed
- **Navigation blocking** - Prevents loading external URLs
- **Window open prevention** - Blocks popup windows

## Configuration

### package.json

```json
{
  "main": "electron/main.js",
  "build": {
    "appId": "com.decentralchain.exchange",
    "productName": "DecentralExchange",
    "files": ["dist/**/*", "electron/**/*"],
    "mac": { "category": "public.app-category.finance" },
    "win": { "target": ["nsis", "portable"] },
    "linux": { "target": ["AppImage", "deb"] }
  }
}
```

### Window Options

- **Default size**: 80% of screen (1024x768 minimum)
- **Centered**: Automatically positioned in screen center
- **Min size**: 1024x768
- **Background**: White
- **DevTools**: Enabled in development mode

## Usage in React App

Access Electron APIs via `window.electron`:

```typescript
// Check if running in Electron
if (window.electron) {
  console.log('Running in Electron');
  console.log('Platform:', window.electron.platform);
  console.log('Versions:', window.electron.versions);
  
  // Send message to main process
  window.electron.send('app:quit');
  
  // Listen for messages from main process
  const unsubscribe = window.electron.on('app:update-available', (version) => {
    console.log('Update available:', version);
  });
  
  // Cleanup listener
  unsubscribe();
  
  // Invoke main process function
  const version = await window.electron.invoke('app:get-version');
}
```

## Build Artifacts

After building, you'll find installers in `release/`:

### macOS
- `DecentralExchange-x.x.x.dmg` - Disk image installer
- `DecentralExchange-x.x.x-mac.zip` - Zipped application

### Windows
- `DecentralExchange Setup x.x.x.exe` - NSIS installer
- `DecentralExchange x.x.x.exe` - Portable executable

### Linux
- `dcc-exchange-x.x.x.AppImage` - AppImage bundle
- `dcc-exchange_x.x.x_amd64.deb` - Debian package

## Troubleshooting

### Electron fails to start

**Issue**: Electron window doesn't open

**Solution**: Make sure Vite dev server is running first:
```bash
npm run dev  # Start this first
npm run electron:dev  # Then start Electron
```

### White screen in production

**Issue**: Blank white screen after building

**Solution**: Make sure to build React app before Electron:
```bash
npm run build  # Build React first
npm run electron:build  # Then build Electron
```

### IPC communication not working

**Issue**: `window.electron` is undefined

**Solution**: Check that preload script is being loaded:
- Verify `preload.js` exists in `electron/` directory
- Check path in `main.ts` matches: `join(__dirname, 'preload.js')`
- Rebuild Electron TypeScript: `npx tsc -p electron`

### Build errors on Linux

**Issue**: electron-builder fails on Linux

**Solution**: Install required dependencies:
```bash
sudo apt-get install -y rpm  # For .rpm packages
sudo apt-get install -y fakeroot dpkg  # For .deb packages
```

## Next Steps

1. **Add IPC Handlers** - Implement custom IPC communication
2. **App Menu** - Create native application menu
3. **Auto Updates** - Implement automatic update checking
4. **Crash Reporting** - Add crash reporter for production
5. **Code Signing** - Set up certificates for distribution
6. **CI/CD** - Automate builds with GitHub Actions

## Resources

- [Electron Documentation](https://www.electronjs.org/docs)
- [electron-builder](https://www.electron.build/)
- [Security Best Practices](https://www.electronjs.org/docs/tutorial/security)

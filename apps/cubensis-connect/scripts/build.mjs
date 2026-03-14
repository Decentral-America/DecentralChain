/**
 * Production build orchestrator for the Cubensis Connect browser extension.
 *
 * Runs multiple Vite builds to produce the final extension output:
 *   1. UI pages    — popup.html, accounts.html, notification.html (ES modules, code-split)
 *   2. Background  — background.js (single self-contained IIFE for service worker)
 *   3. Scripts     — contentscript.js, inpage.js (single self-contained IIFEs)
 *   4. Post-build  — copies icons, generates per-platform dirs with adapted manifests
 */

import { cpSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'vite';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const root = resolve(__dirname, '..');
const distBuild = resolve(root, 'dist/build');
const distRoot = resolve(root, 'dist');

const mode = process.env.NODE_ENV === 'development' ? 'development' : 'production';
const isDev = mode === 'development';

console.log(`\n🔨 Building Cubensis Connect (${mode})...\n`);

// ── Step 1: Build UI pages ────────────────────────────────────────
console.log('  [1/4] Building UI pages...');
await build({
  configFile: resolve(root, 'vite.config.ts'),
  mode,
  build: {
    outDir: distBuild,
    emptyOutDir: true,
    sourcemap: isDev ? 'inline' : 'hidden',
    minify: !isDev,
    target: 'esnext',
    rollupOptions: {
      input: {
        popup: resolve(root, 'popup.html'),
        notification: resolve(root, 'notification.html'),
        accounts: resolve(root, 'accounts.html'),
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: '[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
      },
    },
  },
});

// ── Step 2: Build background (service worker) ─────────────────────
console.log('  [2/4] Building background script...');
await build({
  configFile: resolve(root, 'vite.config.ts'),
  mode,
  build: {
    outDir: distBuild,
    emptyOutDir: false,
    sourcemap: isDev ? 'inline' : 'hidden',
    minify: !isDev,
    target: 'esnext',
    lib: {
      entry: resolve(root, 'src/background.ts'),
      formats: ['iife'],
      name: 'CubensisBackground',
      fileName: () => 'background.js',
    },
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
      },
    },
  },
});

// ── Step 3: Build content scripts ─────────────────────────────────
console.log('  [3/4] Building content scripts...');
for (const entry of ['contentscript', 'inpage']) {
  await build({
    configFile: resolve(root, 'vite.config.ts'),
    mode,
    build: {
      outDir: distBuild,
      emptyOutDir: false,
      sourcemap: isDev ? 'inline' : 'hidden',
      minify: !isDev,
      target: 'esnext',
      lib: {
        entry: resolve(root, `src/${entry}.ts`),
        formats: ['iife'],
        name: `Cubensis_${entry}`,
        fileName: () => `${entry}.js`,
      },
      rollupOptions: {
        output: {
          inlineDynamicImports: true,
        },
      },
    },
  });
}

// ── Step 4: Post-build — static assets + platform manifests ──────
console.log('  [4/4] Generating platform builds...');

// Copy icons to build dir
const iconsDir = resolve(root, 'src/copied/icons');
const buildIconsDir = join(distBuild, 'icons');
mkdirSync(buildIconsDir, { recursive: true });
for (const icon of readdirSync(iconsDir)) {
  cpSync(join(iconsDir, icon), join(buildIconsDir, icon));
}

// Read platforms and manifest template
const platforms = JSON.parse(readFileSync(resolve(root, 'scripts/platforms.json'), 'utf8'));
const manifestBuffer = readFileSync(resolve(root, 'src/copied/manifest.json'));

// Dynamic import of the manifest adapter (ESM)
const { default: adaptManifestToPlatform } = await import(
  resolve(root, 'scripts/adaptManifestToPlatform.js')
);

// Copy build dir to each platform dir with adapted manifest
for (const platform of platforms) {
  const platformDir = join(distRoot, platform);
  rmSync(platformDir, { recursive: true, force: true });
  cpSync(distBuild, platformDir, { recursive: true });

  // Write platform-adapted manifest
  writeFileSync(
    join(platformDir, 'manifest.json'),
    JSON.stringify(adaptManifestToPlatform(manifestBuffer, platform), null, 2),
    'utf-8',
  );
}

console.log('\n✅ Build complete!\n');
console.log(`  Platform dirs: ${platforms.join(', ')}`);
console.log(`  Output: dist/\n`);

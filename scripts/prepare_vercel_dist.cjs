const fs = require('fs');
const path = require('path');

const webDist = path.resolve(__dirname, '..', 'web', 'dist');
const appDist = path.resolve(__dirname, '..', 'app', 'dist');
const targetAppFolder = path.join(webDist, 'app');
const webAssetsFolder = path.join(webDist, 'assets');
const appAssetsFolder = path.join(appDist, 'assets');

if (fs.existsSync(webDist) && fs.existsSync(appDist)) {
  // 1. Copy app build into /app subfolder
  fs.cpSync(appDist, targetAppFolder, { recursive: true });
  console.log('✓ Successfully copied @duragrit/app dist into web/dist/app for unified Vercel deployment!');

  // 2. Also mirror app/assets into web/assets so relative script tags never 404
  if (fs.existsSync(appAssetsFolder) && fs.existsSync(webAssetsFolder)) {
    fs.cpSync(appAssetsFolder, webAssetsFolder, { recursive: true });
    console.log('✓ Successfully mirrored @duragrit/app assets into web/dist/assets for root fallback!');
  }

  // 3. Ensure apk directory is mirrored into web/dist/apk and web/dist/app/apk
  const rootApkFolder = path.resolve(__dirname, '..', 'public', 'apk');
  const webDistApk = path.join(webDist, 'apk');
  const appDistApk = path.join(targetAppFolder, 'apk');
  if (fs.existsSync(rootApkFolder)) {
    fs.cpSync(rootApkFolder, webDistApk, { recursive: true });
    fs.cpSync(rootApkFolder, appDistApk, { recursive: true });
    console.log('✓ Successfully mirrored APK packages into web/dist/apk and web/dist/app/apk!');
  }

  // 4. Ensure dedicated PWA manifests and Service Workers are mirrored into root and app subfolder
  const publicDir = path.resolve(__dirname, '..', 'public');
  ['manifest.json', 'manifest-vendor.json', 'manifest-admin.json', 'download.html', 'verify.html', 'version.json', 'sw.js', 'sw-vendor.js', 'icon-admin-512.png', 'icon-admin-192.png', 'icon.svg', 'icon-512.png', 'icon-192.png', 'vendor-app-icon.png', 'vendor-icon-512.png', 'vendor-icon-192.png', 'apple-touch-icon.png', 'favicon-32x32.png'].forEach((file) => {
    const srcFile = path.join(publicDir, file);
    if (fs.existsSync(srcFile)) {
      fs.copyFileSync(srcFile, path.join(webDist, file));
      fs.copyFileSync(srcFile, path.join(targetAppFolder, file));
    }
  });

  // Ensure /app/manifest.json is explicitly the dedicated Vendor Manifest
  const vendorManifest = path.join(publicDir, 'manifest-vendor.json');
  if (fs.existsSync(vendorManifest)) {
    fs.copyFileSync(vendorManifest, path.join(targetAppFolder, 'manifest.json'));
    console.log('✓ Successfully mirrored dedicated Vendor PWA Manifests into web/dist!');
  }
} else {
  console.log('Dist directories not found yet. Run builds first.');
}

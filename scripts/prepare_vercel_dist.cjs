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
} else {
  console.log('Dist directories not found yet. Run builds first.');
}

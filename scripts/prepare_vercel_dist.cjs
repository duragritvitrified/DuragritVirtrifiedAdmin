const fs = require('fs');
const path = require('path');

const webDist = path.resolve(__dirname, '..', 'web', 'dist');
const appDist = path.resolve(__dirname, '..', 'app', 'dist');
const targetAppFolder = path.join(webDist, 'app');

if (fs.existsSync(webDist) && fs.existsSync(appDist)) {
  fs.cpSync(appDist, targetAppFolder, { recursive: true });
  console.log('✓ Successfully copied @duragrit/app dist into web/dist/app for unified Vercel deployment!');
} else {
  console.log('Dist directories not found yet. Run builds first.');
}


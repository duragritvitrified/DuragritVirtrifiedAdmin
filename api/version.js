// DuraGrit Vitrified — Live Version & OTA Update API
export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  const buildTime = new Date().toISOString();
  return res.status(200).json({
    version: '4.9.3',
    buildNumber: 163,
    timestamp: buildTime,
    adminVersion: '4.9.3',
    adminBuildNumber: 163,
    vendorVersion: '4.9.3',
    vendorBuildNumber: 163,
    apkUrl: 'https://duragrit-virtrified-admin.vercel.app/apk/duragrit-admin-command-v2.apk',
    pwaUrl: 'https://duragrit-virtrified-admin.vercel.app/app/?app=admin',
    changelog: 'Stabilized Vendor QR optical scanner (15 FPS, jitter elimination, buzz debouncing) + instant catalog SKU resolution for DA 777 & all DuraGrit QR batches v4.9.3.'
  });
}

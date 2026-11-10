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
    version: '4.9.9',
    buildNumber: 169,
    timestamp: buildTime,
    adminVersion: '4.9.9',
    adminBuildNumber: 169,
    vendorVersion: '4.9.9',
    vendorBuildNumber: 169,
    apkUrl: 'https://duragrit-virtrified-admin.vercel.app/apk/duragrit-admin-command-v2.apk',
    pwaUrl: 'https://duragrit-virtrified-admin.vercel.app/app/?app=admin',
    changelog: 'Product inspection modal with SKU, packing size, category, MRP, and photo on Web Admin Cashback Requests page v4.9.9.'
  });
}

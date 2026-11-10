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
    version: '4.9.8',
    buildNumber: 168,
    timestamp: buildTime,
    adminVersion: '4.9.8',
    adminBuildNumber: 168,
    vendorVersion: '4.9.8',
    vendorBuildNumber: 168,
    apkUrl: 'https://duragrit-virtrified-admin.vercel.app/apk/duragrit-admin-command-v2.apk',
    pwaUrl: 'https://duragrit-virtrified-admin.vercel.app/app/?app=admin',
    changelog: 'Dedicated Release Payment tab in Admin Mobile App with full disbursal redemption popup, payment mode selection, UTR auto-generator, proof screenshot attachment, and instant bidirectional Supabase cloud sync v4.9.8.'
  });
}

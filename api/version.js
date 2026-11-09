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
    version: '4.9.4',
    buildNumber: 164,
    timestamp: buildTime,
    adminVersion: '4.9.4',
    adminBuildNumber: 164,
    vendorVersion: '4.9.4',
    vendorBuildNumber: 164,
    apkUrl: 'https://duragrit-virtrified-admin.vercel.app/apk/duragrit-admin-command-v2.apk',
    pwaUrl: 'https://duragrit-virtrified-admin.vercel.app/app/?app=admin',
    changelog: 'Clean QR stickers with dedicated unique serial code (Ready to Scan text removed), full live Supabase management, and direct /qr deep-link claim support v4.9.4.'
  });
}

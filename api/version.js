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
    version: '4.8.9',
    buildNumber: 159,
    timestamp: buildTime,
    adminVersion: '4.8.9',
    adminBuildNumber: 159,
    vendorVersion: '4.8.9',
    vendorBuildNumber: 159,
    apkUrl: 'https://duragrit-virtrified-admin.vercel.app/apk/duragrit-admin-command-v2.apk',
    pwaUrl: 'https://duragrit-virtrified-admin.vercel.app/app/?app=admin',
    changelog: 'Pure live Supabase & Vercel sync across Admin Web ERP, Admin Mobile App & Vendor Partner Mobile App with instant OTA hot-reload and DA-777 catalog synchronization v4.8.9.'
  });
}

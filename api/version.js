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
    version: '4.8.6',
    buildNumber: 156,
    timestamp: buildTime,
    apkUrl: 'https://duragrit-virtrified-admin.vercel.app/apk/duragrit-admin-command-v2.apk',
    pwaUrl: 'https://duragrit-virtrified-admin.vercel.app/app/?app=admin',
    changelog: 'Real-time bidirectional Supabase sync for Product Catalog (duragrit DA 777), QR Batches & Claim Moderation across Admin Web & Mobile App v4.8.6.'
  });
}

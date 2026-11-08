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
    version: '4.8.5',
    buildNumber: 155,
    timestamp: buildTime,
    apkUrl: 'https://duragrit-virtrified-admin.vercel.app/apk/duragrit-vendor-v4.8.5.apk',
    pwaUrl: 'https://duragrit-virtrified-admin.vercel.app/app/?app=vendor',
    changelog: 'Instant vendor login for 8826021114 with Dura#4905, automated cache purging & real-time live sync v4.8.5.'
  });
}

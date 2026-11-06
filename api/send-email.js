import { sendSmtpMail } from '../smtpClient.js';

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const payload = req.body || {};
    const config = payload.config || {};
    const { to, subject, html, text, from } = payload;
    const result = await sendSmtpMail(config, { to, subject, html, text, from });
    return res.status(200).json(result);
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message || String(err) });
  }
}


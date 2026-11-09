import { sendSmtpMail } from '../smtpClient.js';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://fykxjzvdslvxablmjlfw.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ5a3hqenZkc2x2eGFibG1qbGZ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM0NDczMTcsImV4cCI6MjEwOTAyMzMxN30.bmMUQ6vcRZorX_b2YOuvgrtfWCWYwRxxlaQTj5QhQxY';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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
    let config = { ...(payload.config || {}) };

    // 1. If password or host missing in payload, check Supabase persistent configuration
    if (!config.smtpPassword || config.smtpPassword.includes('•••') || !config.smtpHost) {
      try {
        const { data: smtpRow } = await supabase
          .from('cashback_requests')
          .select('flag_reason')
          .eq('qr_serial', 'DURAGRIT_SMTP_CONFIG')
          .order('timestamp', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (smtpRow?.flag_reason) {
          const dbConfig = JSON.parse(smtpRow.flag_reason);
          config = { ...dbConfig, ...config };
          if (!config.smtpPassword && dbConfig.smtpPassword) {
            config.smtpPassword = dbConfig.smtpPassword;
          }
        }
      } catch (_) {}
    }
    
    // 2. Fallback to server environment variables if client password is still missing
    if (!config.smtpPassword || config.smtpPassword.includes('•••')) {
      config.smtpPassword = process.env.GMAIL_APP_PASSWORD || process.env.SMTP_PASSWORD || '';
    }
    if (!config.smtpUser) {
      config.smtpUser = process.env.GMAIL_USER || process.env.SMTP_USER || config.senderEmail || 'duragrit07@gmail.com';
    }

    const { to, subject, html, text, from } = payload;
    const result = await sendSmtpMail(config, { to, subject, html, text, from });
    return res.status(200).json(result);
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message || String(err) });
  }
}


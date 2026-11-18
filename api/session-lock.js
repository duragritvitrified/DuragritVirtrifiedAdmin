import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://bzvmsuctrdlqnfccejtr.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_9Wwxgg5w8vuh6L7QnO6sCA_56L5Ccou';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const LOCK_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours max idle lock

function makeLockRequestId(portal, userKey) {
  const cleanPortal = String(portal || 'APP').replace(/[^a-zA-Z0-9]/g, '_').toUpperCase();
  const cleanUser = String(userKey || 'USER').replace(/[^a-zA-Z0-9@._-]/g, '_').toUpperCase();
  return `LOCK_${cleanPortal}_${cleanUser}`.slice(0, 95);
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ success: false, message: 'Method not allowed' });

  try {
    const { action = 'acquire', portal = 'APP', userKey, deviceId, deviceLabel = 'Unknown Device', force = false } = req.body || {};

    if (!userKey || !deviceId) {
      return res.status(400).json({ success: false, message: 'Missing userKey or deviceId' });
    }

    const lockReqId = makeLockRequestId(portal, userKey);

    const { data: existingRow } = await supabase
      .from('cashback_requests')
      .select('id, status, flag_reason, timestamp')
      .eq('request_id', lockReqId)
      .maybeSingle();

    let existingMeta = {};
    if (existingRow?.flag_reason && existingRow.flag_reason.startsWith('{')) {
      try {
        existingMeta = JSON.parse(existingRow.flag_reason);
      } catch (_) {}
    }

    if (action === 'acquire') {
      const isLockedActive = existingRow?.status === 'Approved';
      const lastBeat = Number(existingMeta.lastHeartbeat || existingMeta.loginTimestamp || 0);
      const isFresh = lastBeat > 0 && (Date.now() - lastBeat < LOCK_TTL_MS);

      if (isLockedActive && isFresh && existingMeta.deviceId && existingMeta.deviceId !== deviceId) {
        const loginTimeStr = existingMeta.loginAt
          ? new Date(existingMeta.loginAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true })
          : 'recently';
        return res.status(200).json({
          success: false,
          locked: true,
          lockedByDevice: existingMeta.deviceLabel || 'Another Device',
          lockedAt: existingMeta.loginAt || null,
          message: `Yeh User ID pehle se kisi aur device (${existingMeta.deviceLabel || 'Another Device'}) par login hai (${loginTimeStr} se). Ek time par ek User ID sirf ek hi device/mobile par login ho sakti hai — pehle us device se Sign Out karein.`,
        });
      }

      const nowIso = new Date().toISOString();
      const newMeta = {
        userKey,
        portal,
        deviceId,
        deviceLabel,
        loginAt: nowIso,
        loginTimestamp: Date.now(),
        lastHeartbeat: Date.now(),
      };

      const { error } = await supabase
        .from('cashback_requests')
        .upsert(
          {
            request_id: lockReqId,
            qr_serial: 'DURAGRIT_SESSION_LOCK',
            claim_value: 1,
            status: 'Approved',
            payout_method: 'UPI',
            flag_reason: JSON.stringify(newMeta),
            timestamp: nowIso,
          },
          { onConflict: 'request_id' }
        );

      if (error) {
        return res.status(500).json({ success: false, message: error.message });
      }
      return res.status(200).json({ success: true, lockReqId, deviceId });
    }

    if (action === 'heartbeat' || action === 'verify') {
      if (existingRow?.status === 'Approved' && existingMeta.deviceId && existingMeta.deviceId !== deviceId) {
        return res.status(200).json({
          success: true,
          valid: false,
          message: `Session closed: Yeh User ID ab kisi aur device par active hai.`,
        });
      }
      if (existingRow?.status === 'Rejected') {
        return res.status(200).json({
          success: true,
          valid: false,
          message: 'Session signed out.',
        });
      }

      const nowIso = new Date().toISOString();
      const updatedMeta = {
        ...existingMeta,
        userKey,
        portal,
        deviceId,
        deviceLabel,
        loginAt: existingMeta.loginAt || nowIso,
        loginTimestamp: existingMeta.loginTimestamp || Date.now(),
        lastHeartbeat: Date.now(),
      };

      await supabase
        .from('cashback_requests')
        .upsert(
          {
            request_id: lockReqId,
            qr_serial: 'DURAGRIT_SESSION_LOCK',
            claim_value: 1,
            status: 'Approved',
            payout_method: 'UPI',
            flag_reason: JSON.stringify(updatedMeta),
            timestamp: nowIso,
          },
          { onConflict: 'request_id' }
        );

      return res.status(200).json({ success: true, valid: true });
    }

    if (action === 'release') {
      if (!existingRow || force || !existingMeta.deviceId || existingMeta.deviceId === deviceId) {
        await supabase
          .from('cashback_requests')
          .upsert(
            {
              request_id: lockReqId,
              qr_serial: 'DURAGRIT_SESSION_LOCK',
              claim_value: 1,
              status: 'Rejected',
              payout_method: 'UPI',
              flag_reason: JSON.stringify({
                ...existingMeta,
                releasedAt: new Date().toISOString(),
                releasedByDevice: deviceId,
              }),
              timestamp: new Date().toISOString(),
            },
            { onConflict: 'request_id' }
          );
      }
      return res.status(200).json({ success: true, released: true });
    }

    return res.status(400).json({ success: false, message: 'Unknown action' });
  } catch (err) {
    console.error('api/session-lock error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
}

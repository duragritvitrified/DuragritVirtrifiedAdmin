const DEVICE_ID_KEY = 'duragrit_device_lock_id_v1';
const LIVE_LOCK_URL = 'https://duragrit-virtrified-admin-khaki.vercel.app/api/session-lock';

function getLockEndpoint() {
  if (typeof window !== 'undefined') {
    const h = window.location.hostname;
    if (h.endsWith('.vercel.app') || h === 'localhost' || h === '127.0.0.1') {
      return '/api/session-lock';
    }
  }
  return LIVE_LOCK_URL;
}

export function getOrCreateDeviceId() {
  try {
    let id = localStorage.getItem(DEVICE_ID_KEY);
    if (!id) {
      id = `DEV-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
      localStorage.setItem(DEVICE_ID_KEY, id);
    }
    return id;
  } catch (_) {
    return `DEV-TEMP-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  }
}

export function getDeviceLabel() {
  try {
    const ua = navigator.userAgent || '';
    if (/Android/i.test(ua)) return 'Android Mobile';
    if (/iPhone|iPad|iPod/i.test(ua)) return 'iPhone / iOS';
    if (/Windows/i.test(ua)) return 'Windows PC';
    if (/Mac/i.test(ua)) return 'Mac Desktop';
    if (/Linux/i.test(ua)) return 'Linux PC';
    return 'Web Browser';
  } catch (_) {
    return 'Registered Device';
  }
}

export async function acquireSessionLock(portal, userKey) {
  if (!userKey) return { success: true };
  try {
    const res = await fetch(getLockEndpoint(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'acquire',
        portal,
        userKey: String(userKey).trim().toUpperCase(),
        deviceId: getOrCreateDeviceId(),
        deviceLabel: getDeviceLabel(),
      }),
    });
    if (!res.ok) return { success: true };
    return await res.json();
  } catch (_) {
    return { success: true };
  }
}

export async function heartbeatSessionLock(portal, userKey) {
  if (!userKey) return { success: true, valid: true };
  try {
    const res = await fetch(getLockEndpoint(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'heartbeat',
        portal,
        userKey: String(userKey).trim().toUpperCase(),
        deviceId: getOrCreateDeviceId(),
        deviceLabel: getDeviceLabel(),
      }),
    });
    if (!res.ok) return { success: true, valid: true };
    return await res.json();
  } catch (_) {
    return { success: true, valid: true };
  }
}

export async function releaseSessionLock(portal, userKey) {
  if (!userKey) return { success: true };
  try {
    const res = await fetch(getLockEndpoint(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'release',
        portal,
        userKey: String(userKey).trim().toUpperCase(),
        deviceId: getOrCreateDeviceId(),
        deviceLabel: getDeviceLabel(),
      }),
    });
    if (!res.ok) return { success: true };
    return await res.json();
  } catch (_) {
    return { success: true };
  }
}

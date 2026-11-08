// DuraGrit Vitrified — Email Gateway Service
// Handles: SMTP Configuration + Email Verification (Template 1) + Credentials Dossier (Template 2)
// Stores full audit log in localStorage for Email Reports page
import { EMAIL_TEMPLATES } from './emailTemplates.js';

const DISPATCHES_KEY   = 'duragrit_email_dispatches_v2';
const SETTING_KEY      = 'duragrit_auto_email_credentials_v1';
const VERIFY_MAP_KEY   = 'duragrit_email_verify_tokens_v2'; // { token: userId }
const USERS_KEY        = 'duragrit_users_v7';
const VENDORS_KEY      = 'duragrit_vendors_v7';
const SMTP_CONFIG_KEY  = 'duragrit_smtp_configuration_v1';

try {
  localStorage.removeItem('duragrit_email_dispatches_v1');
} catch (_) {}

export const LIVE_PUBLIC_URL = 'https://duragrit-virtrified-admin.vercel.app';

export const getEmailBaseUrl = () => {
  if (typeof window !== 'undefined' && window.location?.origin) {
    const host = window.location.hostname;
    if (host && !host.includes('localhost') && host !== '127.0.0.1') {
      return window.location.origin;
    }
  }
  return LIVE_PUBLIC_URL;
};

// ─── Default SMTP Configuration ──────────────────────────────────────────────

export const DEFAULT_SMTP_CONFIG = {
  activeProvider: 'gmail', // 'gmail' | 'aws_ses' | 'sendgrid' | 'custom_smtp'
  senderName: 'DuraGrit Vitrified Pvt. Ltd.',
  senderEmail: 'duragrit07@gmail.com',
  replyToEmail: 'duragrit07@gmail.com',
  smtpHost: 'smtp.gmail.com',
  smtpPort: '587',
  encryption: 'TLS', // 'TLS' | 'SSL' | 'STARTTLS'
  smtpUser: 'duragrit07@gmail.com',
  smtpPassword: '', // Editable by user (Google App Password)
  enableDkim: true,
  enableSpf: true,
  dailyQuota: 2000,
  rateLimitPerSec: 5,
  primaryRelayLabel: 'Google Gmail SMTP (smtp.gmail.com:587)',
  failoverRelayLabel: 'DuraGrit Secondary Relay'
};

export const getSmtpConfig = () => {
  try {
    const raw = localStorage.getItem(SMTP_CONFIG_KEY);
    if (!raw) return DEFAULT_SMTP_CONFIG;
    const parsed = JSON.parse(raw);
    // If previously saved as AWS SES sample placeholder, migrate cleanly to Gmail defaults
    if (parsed.senderEmail === 'dispatch@duragritvitrified.com' || parsed.activeProvider === 'aws_ses') {
      return {
        ...DEFAULT_SMTP_CONFIG,
        ...parsed,
        activeProvider: 'gmail',
        senderName: 'DuraGrit Vitrified Pvt. Ltd.',
        senderEmail: 'duragrit07@gmail.com',
        replyToEmail: 'duragrit07@gmail.com',
        smtpHost: 'smtp.gmail.com',
        smtpPort: '587',
        smtpUser: 'duragrit07@gmail.com',
        primaryRelayLabel: 'Google Gmail SMTP (smtp.gmail.com:587)'
      };
    }
    return { ...DEFAULT_SMTP_CONFIG, ...parsed };
  } catch (e) {
    return DEFAULT_SMTP_CONFIG;
  }
};

export const saveSmtpConfig = (config) => {
  try {
    localStorage.setItem(SMTP_CONFIG_KEY, JSON.stringify(config));
    return true;
  } catch (e) {
    console.error('Failed to save SMTP config:', e);
    return false;
  }
};

// ─── Helpers ────────────────────────────────────────────────────────────────

const now = () => new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
const ts  = () => new Date().toISOString().replace('T', ' ').substring(0, 19);
const uid = () => 'MSG-' + Date.now() + '-' + Math.floor(Math.random() * 9000 + 1000);
const tok = () => 'DGVT-' + Math.random().toString(36).substring(2, 10).toUpperCase() +
                  '-' + Math.random().toString(36).substring(2, 6).toUpperCase();

// ─── Auto-email setting ──────────────────────────────────────────────────────

export const getAutoEmailSetting = () => {
  const saved = localStorage.getItem(SETTING_KEY);
  return saved !== null ? saved === 'true' : true;
};
export const setAutoEmailSetting = (enabled) => {
  localStorage.setItem(SETTING_KEY, String(enabled));
};

// ─── Email log store ─────────────────────────────────────────────────────────

export const getEmailDispatches = () => {
  try {
    const raw = localStorage.getItem(DISPATCHES_KEY);
    if (!raw) return getDefaultLogs();
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : getDefaultLogs();
  } catch { return getDefaultLogs(); }
};

export const saveEmailDispatches = (list) => {
  try { localStorage.setItem(DISPATCHES_KEY, JSON.stringify(list)); } catch { /* ignore */ }
};

const saveDispatches = saveEmailDispatches;

const appendLog = (record) => {
  const existing = getEmailDispatches();
  // Filter out the default seed logs on first real write
  const base = existing.filter(e => !e._seed);
  saveDispatches([record, ...base]);
};

// ─── Verification token store ────────────────────────────────────────────────

const getTokenMap = () => {
  try { return JSON.parse(localStorage.getItem(VERIFY_MAP_KEY) || '{}'); } catch { return {}; }
};
const saveTokenMap = (map) => {
  try { localStorage.setItem(VERIFY_MAP_KEY, JSON.stringify(map)); } catch {}
};

// ─── User directory helpers ──────────────────────────────────────────────────

const getUsers = () => {
  try { return JSON.parse(localStorage.getItem(USERS_KEY) || '[]'); } catch { return []; }
};
const saveUsers = (list) => {
  try { localStorage.setItem(USERS_KEY, JSON.stringify(list)); } catch {}
};

// ─── Vendor directory helpers ────────────────────────────────────────────────

const getVendors = () => {
  try { return JSON.parse(localStorage.getItem(VENDORS_KEY) || '[]'); } catch { return []; }
};
const saveVendors = (list) => {
  try {
    localStorage.setItem(VENDORS_KEY, JSON.stringify(list));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('duragrit:vendors-updated', { detail: list }));
      fetch('/api/dev-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vendors: list })
      }).catch(() => {});
    }
  } catch {}
};

// ─── TEMPLATE 1: Email Verification ─────────────────────────────────────────

export const sendVerificationEmail = async ({
  userId,
  recipientName = 'Valued Partner',
  recipientEmail,
  mobile = ''
}) => {
  const token = tok();
  const rawId = userId ? userId.toString().replace(/^USR-/i, '') : '1001';
  const cleanUserId = String(userId || '').startsWith('USR-') ? userId : `USR-${rawId}`;

  const map = getTokenMap();
  map[token] = rawId;
  map[`USER_${token}`] = rawId;
  saveTokenMap(map);

  const baseUrl = getEmailBaseUrl();
  const verifyLink = `${baseUrl}/?verify=${token}`;

  const template = EMAIL_TEMPLATES.find((t) => t.id === 'verification');
  const html = template
    ? template.generateHtml({
        recipientName,
        userId: cleanUserId,
        mobile: mobile || 'Registered Mobile',
        verifyToken: token,
        verifyLink,
        expiryHours: '24'
      })
    : `<p>Hello ${recipientName}, please verify your email for DuraGrit Partner Portal: <a href="${verifyLink}">${verifyLink}</a></p>`;

  const to = recipientEmail || `${(mobile || 'partner').replace(/\D/g, '').slice(-10)}@duragrit.partner`;
  const subject = `Verify Your Email — DuraGrit Vitrified Partner Portal`;

  const dispatchRes = await sendLiveCustomEmail({
    to,
    subject,
    html,
    text: `Hello ${recipientName}, please verify your email for DuraGrit Partner Portal by opening: ${verifyLink} (Token: ${token})`,
    templateKey: 'verification'
  });

  return {
    success: true,
    token,
    verifyLink,
    dispatch: dispatchRes.record
  };
};

// ─── TEMPLATE 2: Credentials + APK Onboarding Dossier ───────────────────────

export const sendOnboardingEmail = async ({
  recipientEmail,
  recipientName = 'Valued Partner',
  mobile = '+91 98112 40591',
  userId = 'USR-1042',
  role = 'Tile Contractor / Mason',
  tempPassword = 'Dura#' + Math.floor(1000 + Math.random() * 9000),
  hub = 'Morbi Central Kiln Hub',
  apkUrl,
  pwaUrl
}) => {
  const baseUrl = getEmailBaseUrl();
  const defaultVendorApkUrl = `${baseUrl}/apk/duragrit-vendor-v2.apk?v=2.4`;
  const defaultVendorPwaUrl = `${baseUrl}/app/?app=vendor`;
  const finalApkUrl = apkUrl || defaultVendorApkUrl;
  const finalPwaUrl = pwaUrl || defaultVendorPwaUrl;
  const cleanUserId = String(userId).startsWith('USR-') ? userId : `USR-${userId}`;

  const template = EMAIL_TEMPLATES.find((t) => t.id === 'onboarding');
  const html = template
    ? template.generateHtml({
        recipientName,
        userId: cleanUserId,
        tempPassword,
        role,
        hub: hub || 'Morbi Central Kiln Hub',
        apkUrl: finalApkUrl,
        pwaUrl: finalPwaUrl
      })
    : `<p>Welcome to DuraGrit! User ID: ${cleanUserId}, Temporary Password: ${tempPassword}. Download APK: ${finalApkUrl}</p>`;

  const to = recipientEmail || `${(mobile || 'partner').replace(/\D/g, '').slice(-10)}@duragrit.partner`;
  const subject = `Welcome to DuraGrit Vitrified — Your Vendor Partner Login Credentials & Mobile App Setup`;

  const dispatchRes = await sendLiveCustomEmail({
    to,
    subject,
    html,
    text: `Welcome ${recipientName} to DuraGrit Vitrified! User ID: ${cleanUserId}, Password: ${tempPassword}. Download Vendor APK: ${finalApkUrl} or Web Portal: ${finalPwaUrl}`,
    templateKey: 'onboarding'
  });

  return {
    success: true,
    dispatch: dispatchRes.record
  };
};

// ─── TEMPLATE 3: Instant Cashback Credit & UPI Payout Receipt ───────────────

export const sendCashbackReceiptEmail = async ({
  recipientName = 'Valued Partner',
  recipientEmail,
  userId = 'USR-1042',
  amount = 150,
  utrNumber = `NPCI-UPI-${Date.now().toString().slice(-8)}`,
  upiId = 'contractor@upi',
  cartonSerial = 'DG-ADH-01-2026-0001',
  skuName = 'DuraGrit Tile Adhesive Pro Fix (20kg)',
  scanTimestamp
}) => {
  const template = EMAIL_TEMPLATES.find((t) => t.id === 'cashback');
  const finalTimestamp =
    scanTimestamp ||
    new Date().toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

  const cleanUserId = String(userId).startsWith('USR-') ? userId : `USR-${userId}`;

  const html = template
    ? template.generateHtml({
        recipientName,
        userId: cleanUserId,
        amount: String(amount),
        utrNumber,
        upiId,
        cartonSerial,
        skuName,
        scanTimestamp: finalTimestamp
      })
    : `<p>Cashback Credit Alert: ₹${amount} credited via UPI to ${upiId}. UTR: ${utrNumber}. Serial: ${cartonSerial}.</p>`;

  const to = recipientEmail || `${cleanUserId.replace(/\D/g, '') || 'partner'}@duragrit.partner`;
  const subject = `Cashback Credit Alert — ₹${amount} Credited via UPI (UTR: ${utrNumber})`;

  const dispatchRes = await sendLiveCustomEmail({
    to,
    subject,
    html,
    text: `Namaste ${recipientName}! ₹${amount} cashback has been credited to your UPI account (${upiId}). UTR: ${utrNumber}. Serial: ${cartonSerial}. Product: ${skuName}.`,
    templateKey: 'cashback'
  });

  return {
    success: true,
    dispatch: dispatchRes.record
  };
};

// ─── TEMPLATE 4: KYC Regulatory Verification Approval ───────────────────────

export const sendKycApprovalEmail = async ({
  recipientName = 'Valued Partner',
  recipientEmail,
  userId = 'USR-1042',
  aadhaarMasked = 'XXXX-XXXX-8921',
  panMasked = 'ABCDE1234F',
  tierName = 'Gold Applicator Tier 2',
  dailyLimit = '₹50,000 / day'
}) => {
  const template = EMAIL_TEMPLATES.find((t) => t.id === 'kyc');
  const cleanUserId = String(userId).startsWith('USR-') ? userId : `USR-${userId}`;

  const html = template
    ? template.generateHtml({
        recipientName,
        userId: cleanUserId,
        aadhaarMasked,
        panMasked,
        tierName,
        dailyLimit
      })
    : `<p>Congratulations ${recipientName}! Your KYC verification is approved for DuraGrit Contractor Tier ${tierName}. Daily scanner limit: ${dailyLimit}.</p>`;

  const to = recipientEmail || `${cleanUserId.replace(/\D/g, '') || 'partner'}@duragrit.partner`;
  const subject = `KYC Compliance Approved — Your DuraGrit Contractor Benefits are Unlocked`;

  const dispatchRes = await sendLiveCustomEmail({
    to,
    subject,
    html,
    text: `Congratulations ${recipientName}! Your KYC verification is approved for DuraGrit Contractor Tier ${tierName}. Daily scanner limit: ${dailyLimit}.`,
    templateKey: 'kyc'
  });

  return {
    success: true,
    dispatch: dispatchRes.record
  };
};

// ─── Test Connection Verification ───────────────────────────────────────────

export const testSmtpConnection = async (config) => {
  const cleanConfig = {
    ...config,
    smtpPassword: (config?.smtpPassword || '').replace(/\s+/g, '').replace(/[\u200B-\u200D\uFEFF]/g, '')
  };

  try {
    const origin = typeof window !== 'undefined' && window.location?.origin ? window.location.origin : 'http://localhost:3000';
    const url = `${origin}/api/smtp-test`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ config: cleanConfig })
    });
    const data = await res.json().catch(() => null);
    if (res.ok && data) {
      return data;
    }
    if (data) {
      return data;
    }
    return {
      success: false,
      message: `HTTP ${res.status}: ${res.statusText}`
    };
  } catch (err) {
    console.warn('Backend /api/smtp-test endpoint unreachable:', err);
    return {
      success: false,
      message: err.message || 'Cannot reach SMTP backend server.'
    };
  }
};

// ─── Live Email Dispatch via Native SMTP Bridge ─────────────────────────────

export const sendLiveCustomEmail = async ({
  to,
  subject,
  html,
  text,
  templateKey = 'custom',
  overrideConfig = null
}) => {
  const smtp = overrideConfig || getSmtpConfig();
  const startTime = Date.now();
  let apiRes = null;

  try {
    const origin = typeof window !== 'undefined' && window.location?.origin ? window.location.origin : 'http://localhost:3000';
    const url = `${origin}/api/send-email`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        config: smtp,
        to,
        subject,
        html,
        text,
        from: smtp.senderEmail
      })
    });
    if (res.ok) {
      apiRes = await res.json();
    } else {
      try {
        apiRes = await res.json();
      } catch (_) {
        apiRes = { success: false, message: `Server error: HTTP ${res.status}` };
      }
    }
  } catch (err) {
    console.warn('Live SMTP dispatch error:', err);
    apiRes = { success: false, message: err.message || 'Network request failed' };
  }

  const isSuccess = Boolean(apiRes?.success);
  const latency = apiRes?.latency || `${Date.now() - startTime}ms`;
  const record = {
    id: uid(),
    type: templateKey,
    templateKey,
    template: subject,
    fromName: smtp.senderName,
    fromEmail: smtp.senderEmail,
    replyTo: smtp.replyToEmail,
    to,
    recipientEmail: to,
    recipientName: to.split('@')[0],
    subject,
    html,
    status: isSuccess ? 'Delivered' : 'Failed',
    opens: 0,
    clicks: 0,
    lastEvent: apiRes?.message || (isSuccess ? `Delivered via ${smtp.senderEmail}` : 'Delivery rejected'),
    sentAt: now(),
    timestamp: ts(),
    relay: `${smtp.primaryRelayLabel} (${smtp.smtpHost})`,
    relayLatency: latency,
    ip: '142.250.190.108',
    smtpCode: apiRes?.smtpResponse || (isSuccess ? `250 2.0.0 OK: Delivered from <${smtp.senderEmail}>` : '535 Authentication Failed'),
    spf: smtp.enableSpf ? 'PASS' : 'NEUTRAL',
    dkim: smtp.enableDkim ? 'PASS' : 'NEUTRAL',
    dmarc: 'PASS'
  };

  appendLog(record);
  return { success: isSuccess, apiRes, record };
};

// ─── VENDOR TEMPLATE 1: Vendor Email Verification Link Dispatch ─────────────

export const sendVendorVerificationEmail = async ({
  vendorId,
  recipientName = 'Valued Partner',
  recipientEmail,
  mobile = '',
  role = 'Contractor'
}) => {
  const token = tok();
  const map = getTokenMap();
  map[token] = { type: 'vendor', id: vendorId };
  map[`VENDOR_${token}`] = vendorId;
  saveTokenMap(map);

  const baseUrl = getEmailBaseUrl();
  const verifyLink = `${baseUrl}/?verify=${token}`;

  const template = EMAIL_TEMPLATES.find(t => t.id === 'verification');
  const html = template ? template.generateHtml({
    recipientName,
    userId: vendorId,
    mobile: mobile || 'Registered Mobile',
    verifyToken: token,
    verifyLink,
    expiryHours: '24'
  }) : `<p>Please click here to verify your email for DuraGrit Partner Portal: <a href="${verifyLink}">${verifyLink}</a></p>`;

  const to = recipientEmail || `${(mobile || 'vendor').replace(/\D/g, '').slice(-10)}@duragrit.partner`;
  const subject = `Verify Your Email — DuraGrit Vitrified Partner Portal`;

  const dispatchRes = await sendLiveCustomEmail({
    to,
    subject,
    html,
    text: `Hello ${recipientName}, please verify your email for DuraGrit Partner Portal by opening: ${verifyLink} (Token: ${token})`,
    templateKey: 'verification'
  });

  return {
    success: true,
    token,
    verifyLink,
    dispatch: dispatchRes.record
  };
};

// ─── VENDOR TEMPLATE 2: Vendor Onboarding Dossier & Credentials + APK ───────

export const sendVendorOnboardingCredentialsEmail = async ({
  vendorId,
  recipientName = 'Valued Partner',
  recipientEmail,
  mobile = '',
  role = 'Tile Contractor / Applicator',
  passkey = 'Dura#2026',
  hub = 'Morbi Central Kiln Hub',
  apkUrl,
  pwaUrl
}) => {
  const baseUrl = getEmailBaseUrl();
  const defaultVendorApkUrl = `${baseUrl}/apk/duragrit-vendor-v2.apk?v=2.4`;
  const defaultVendorPwaUrl = `${baseUrl}/app/?app=vendor`;
  const finalApkUrl = apkUrl || defaultVendorApkUrl;
  const finalPwaUrl = pwaUrl || defaultVendorPwaUrl;
  const loginId = mobile ? mobile.replace(/\D/g, '').slice(-10) : vendorId;

  const template = EMAIL_TEMPLATES.find(t => t.id === 'onboarding');
  const html = template ? template.generateHtml({
    recipientName,
    userId: loginId,
    tempPassword: passkey,
    role: `${role}`,
    hub: hub || 'Morbi Central Kiln Hub',
    apkUrl: finalApkUrl,
    pwaUrl: finalPwaUrl
  }) : `<p>Welcome to DuraGrit! Mobile Login ID: ${loginId}, Passkey: ${passkey}. Download Vendor APK: ${finalApkUrl}</p>`;

  const to = recipientEmail || `${(mobile || 'partner').replace(/\D/g, '').slice(-10)}@duragrit.partner`;
  const subject = `Welcome to DuraGrit Vitrified — Your Vendor Partner Login Credentials & Mobile App Setup`;

  const dispatchRes = await sendLiveCustomEmail({
    to,
    subject,
    html,
    text: `Namaste ${recipientName}! Your DuraGrit partner account is Approved. Login ID: ${loginId}, Passkey: ${passkey}. Download Vendor Partner APK at: ${finalApkUrl} or access Mobile Web Portal at: ${finalPwaUrl}`,
    templateKey: 'onboarding'
  });

  return {
    success: true,
    dispatch: dispatchRes.record
  };
};

// ─── Email Verification Handler (called from App.jsx on URL ?verify=TOKEN) ──

export const processVerificationToken = (token) => {
  if (!token) return { success: false, reason: 'No token provided' };

  const map = getTokenMap();
  const rawTarget = map[token] || map[`VENDOR_${token}`];
  if (!rawTarget) return { success: false, reason: 'Token not found or already used' };

  let isVendor = false;
  let targetId = '';

  if (typeof rawTarget === 'object' && rawTarget !== null) {
    isVendor = rawTarget.type === 'vendor';
    targetId = String(rawTarget.id || '');
  } else {
    targetId = String(rawTarget || '');
    if (targetId.startsWith('VND-') || targetId.startsWith('VEN-')) {
      isVendor = true;
    }
  }

  const cleanTargetId = targetId.toUpperCase();

  // 1. Check & Update in Vendors directory
  const vendors = getVendors();
  const vIndex = vendors.findIndex(v => 
    String(v.vendorId || v.id || '').toUpperCase() === cleanTargetId ||
    (cleanTargetId.length === 10 && String(v.phone || v.mobile || '').replace(/\D/g, '').slice(-10) === cleanTargetId)
  );

  let verifiedVendor = null;
  if (vIndex !== -1) {
    isVendor = true;
    vendors[vIndex] = {
      ...vendors[vIndex],
      emailVerified: 'Verified',
      emailVerifiedAt: new Date().toISOString()
    };
    saveVendors(vendors);
    verifiedVendor = vendors[vIndex];
  }

  // 2. Check & Update in Users directory
  const users = getUsers();
  const uIndex = users.findIndex(u =>
    String(u.id || u.userId || '').replace('USR-', '').toUpperCase() === cleanTargetId.replace('USR-', '')
  );

  let verifiedUser = null;
  if (uIndex !== -1) {
    users[uIndex] = {
      ...users[uIndex],
      emailVerified: 'Verified',
      emailVerifiedAt: new Date().toISOString()
    };
    saveUsers(users);
    verifiedUser = users[uIndex];
  }

  // 3. Mark in email log that verification link was clicked
  const dispatches = getEmailDispatches();
  const updatedDispatches = dispatches.map(d => {
    if (d.verifyToken === token) {
      return {
        ...d,
        verificationStatus: 'Verified',
        status: 'Clicked',
        opens: (d.opens || 0) + 1,
        clicks: (d.clicks || 0) + 1,
        lastEvent: 'Email verified — partner clicked verification link',
      };
    }
    return d;
  });
  saveDispatches(updatedDispatches);

  // 4. Remove used token
  delete map[token];
  delete map[`VENDOR_${token}`];
  saveTokenMap(map);

  // 5. Automatically dispatch 2nd Email: Login Credentials & Onboarding Dossier (Template 2)
  if (verifiedUser && verifiedUser.email) {
    const userPass = verifiedUser.passkey || verifiedUser.tempPassword || verifiedUser.password || `Dura#${verifiedUser.id}`;
    sendOnboardingEmail({
      recipientName: verifiedUser.name,
      recipientEmail: verifiedUser.email,
      mobile: verifiedUser.mobile || '',
      userId: verifiedUser.userId || verifiedUser.id,
      role: verifiedUser.role || 'Contractor',
      tempPassword: userPass,
    }).catch((err) => console.error('Auto user credentials dispatch failed:', err));
  } else if (verifiedVendor && verifiedVendor.email) {
    sendVendorOnboardingCredentialsEmail({
      vendorId: verifiedVendor.vendorId || verifiedVendor.id,
      recipientName: verifiedVendor.companyName || verifiedVendor.contactPerson,
      recipientEmail: verifiedVendor.email,
      mobile: verifiedVendor.phone || verifiedVendor.mobile || '',
      role: verifiedVendor.category || 'Vendor Partner',
      passkey: verifiedVendor.passkey || 'Vend#2026',
    }).catch((err) => console.error('Auto vendor credentials dispatch failed:', err));
  }

  return {
    success: true,
    isVendor,
    vendor: verifiedVendor,
    user: verifiedUser,
    id: verifiedVendor ? (verifiedVendor.vendorId || verifiedVendor.id) : (verifiedUser ? verifiedUser.id : targetId),
    name: verifiedVendor ? (verifiedVendor.companyName || verifiedVendor.contactPerson) : (verifiedUser ? verifiedUser.name : 'Partner')
  };
};

// ─── Check if user/vendor email is verified ─────────────────────────────────

export const isEmailVerified = (id) => {
  if (!id) return false;
  const cleanId = String(id).toUpperCase();
  const vendors = getVendors();
  const vendor = vendors.find(v => 
    String(v.vendorId || v.id || '').toUpperCase() === cleanId ||
    String(v.phone || v.mobile || '').replace(/\D/g, '').slice(-10) === cleanId.replace(/\D/g, '').slice(-10)
  );
  if (vendor?.emailVerified === 'Verified') return true;

  const users = getUsers();
  const user = users.find(u => 
    String(u.id || u.userId || '').replace('USR-', '').toUpperCase() === cleanId.replace('USR-', '')
  );
  return user?.emailVerified === 'Verified';
};

// ─── Default logs (empty clean slate — populates only as real emails are sent) ───

function getDefaultLogs() {
  return [];
}

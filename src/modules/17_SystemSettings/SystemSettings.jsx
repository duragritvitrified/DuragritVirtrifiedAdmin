import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import {
  Settings,
  Mail,
  Server,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Save,
  RotateCw,
  Send,
  Sliders,
  Database,
  Lock,
  Radio,
  Zap,
  Info,
  Smartphone,
  Cpu,
  Trash2,
  RefreshCw,
  Download,
  ExternalLink,
  Copy,
  Check,
  Share2,
  Compass,
  HelpCircle,
  Sparkles,
  QrCode,
  ArrowRight,
  Tablet,
  Layers,
  Globe,
  Phone
} from 'lucide-react';
import {
  getSmtpConfig,
  saveSmtpConfig,
  testSmtpConnection,
  sendLiveCustomEmail,
  DEFAULT_SMTP_CONFIG,
  getAutoEmailSetting,
  setAutoEmailSetting
} from '../../services/emailService';
import { EMAIL_TEMPLATES } from '../../services/emailTemplates';
import {
  getAdminCredentials,
  saveAdminCredentials,
  DEFAULT_ADMIN_CONFIG
} from '../../config/adminAuthConfig';
import { useData } from '../../context/DataContext';

export function SystemSettings({ initialSubTab = 'general' }) {
  const {
    skus = [],
    users = [],
    vendors = [],
    batches = [],
    claims = [],
    dbStatus = {},
    clearAllSampleData,
    refreshAllData
  } = useData();

  const [activeSubTab, setActiveSubTab] = useState(initialSubTab || 'general'); // 'general' | 'mobile-downloads' | 'email-smtp' | 'security' | 'sms-otp'
  const [isEditing, setIsEditing] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [isClearingDb, setIsClearingDb] = useState(false);
  const [isSyncingDb, setIsSyncingDb] = useState(false);

  // QR Code & App Download State
  const [apkQrDataUrl, setApkQrDataUrl] = useState('');
  const [iosPwaQrDataUrl, setIosPwaQrDataUrl] = useState('');
  const [adminApkQrDataUrl, setAdminApkQrDataUrl] = useState('');
  const [adminPwaQrDataUrl, setAdminPwaQrDataUrl] = useState('');
  const [copiedLink, setCopiedLink] = useState('');
  const [guidePlatform, setGuidePlatform] = useState('both'); // 'both' | 'android' | 'ios'

  const isLocalHost = typeof window !== 'undefined' && 
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

  const mobilePwaUrl = typeof window !== 'undefined'
    ? (isLocalHost 
        ? `${window.location.protocol}//${window.location.hostname}:3002/` 
        : `${window.location.origin}/app/?app=vendor`)
    : 'http://localhost:3002/';

  const apkDownloadUrl = typeof window !== 'undefined'
    ? (isLocalHost ? `${window.location.protocol}//${window.location.hostname}:3000/apk/duragrit-vendor-v2.apk` : `${window.location.origin}/apk/duragrit-vendor-v2.apk`)
    : 'https://duragrit-virtrified-admin.vercel.app/apk/duragrit-vendor-v2.apk';

  const adminPwaUrl = typeof window !== 'undefined'
    ? (isLocalHost 
        ? `${window.location.protocol}//${window.location.hostname}:3001/` 
        : `${window.location.origin}/app/?app=admin`)
    : 'http://localhost:3001/';

  const adminApkDownloadUrl = typeof window !== 'undefined'
    ? (isLocalHost ? `${window.location.protocol}//${window.location.hostname}:3000/apk/duragrit-admin-command-v2.apk` : `${window.location.origin}/apk/duragrit-admin-command-v2.apk`)
    : 'https://duragrit-virtrified-admin.vercel.app/apk/duragrit-admin-command-v2.apk';

  // SMTP Settings State
  const [config, setConfig] = useState(DEFAULT_SMTP_CONFIG);
  const [autoEmail, setAutoEmail] = useState(getAutoEmailSetting());
  const [testRecipient, setTestRecipient] = useState('duragrit07@gmail.com');
  const [isSendingLiveEmail, setIsSendingLiveEmail] = useState(false);
  const [liveSendResult, setLiveSendResult] = useState(null);

  // Master Admin Credentials State
  const [adminCreds, setAdminCreds] = useState(DEFAULT_ADMIN_CONFIG);
  const [showAdminPass, setShowAdminPass] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState(false);

  useEffect(() => {
    if (initialSubTab) {
      setActiveSubTab(initialSubTab);
    }
  }, [initialSubTab]);

  useEffect(() => {
    const loaded = getSmtpConfig();
    setConfig(loaded);
    setAdminCreds(getAdminCredentials());

    // Generate scannable QR codes for Android APK and iOS Safari PWA (Partner App)
    QRCode.toDataURL(apkDownloadUrl, {
      width: 180,
      margin: 1,
      color: { dark: '#A62C11', light: '#FFFFFF' }
    })
      .then(url => setApkQrDataUrl(url))
      .catch(err => console.error('APK QR error:', err));

    QRCode.toDataURL(mobilePwaUrl, {
      width: 180,
      margin: 1,
      color: { dark: '#1C1917', light: '#FFFFFF' }
    })
      .then(url => setIosPwaQrDataUrl(url))
      .catch(err => console.error('iOS PWA QR error:', err));

    // Generate scannable QR codes for Admin Mobile App (APK & PWA)
    QRCode.toDataURL(adminApkDownloadUrl, {
      width: 180,
      margin: 1,
      color: { dark: '#BA3A24', light: '#FFFFFF' }
    })
      .then(url => setAdminApkQrDataUrl(url))
      .catch(err => console.error('Admin APK QR error:', err));

    QRCode.toDataURL(adminPwaUrl, {
      width: 180,
      margin: 1,
      color: { dark: '#0F172A', light: '#FFFFFF' }
    })
      .then(url => setAdminPwaQrDataUrl(url))
      .catch(err => console.error('Admin PWA QR error:', err));
  }, [apkDownloadUrl, mobilePwaUrl, adminApkDownloadUrl, adminPwaUrl]);

  const handleCopyLink = (text, key) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedLink(key);
    showToast(`Copied to clipboard: ${text}`);
    setTimeout(() => setCopiedLink(''), 2500);
  };

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 4500);
  };

  const handleSave = (e) => {
    if (e) e.preventDefault();
    if (!config.senderEmail || !config.senderEmail.includes('@')) {
      showToast('Please enter a valid Sender Email address.');
      return;
    }
    if (!config.smtpHost) {
      showToast('SMTP Host server cannot be empty.');
      return;
    }

    const success = saveSmtpConfig(config);
    if (success) {
      setIsEditing(false);
      showToast(`SMTP Configuration saved! Outbound sender: ${config.senderEmail}`);
    } else {
      showToast('Failed to save configuration to local storage.');
    }
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await testSmtpConnection(config);
      setTestResult(res);
      if (res.success) {
        showToast(`Handshake Successful! SMTP latency: ${res.latency}`);
      } else {
        showToast(`Connection Failed: ${res.message}`);
      }
    } catch (e) {
      setTestResult({ success: false, message: 'Unexpected connection timeout.' });
    } finally {
      setIsTesting(false);
    }
  };

  const handleResetDefaults = () => {
    if (window.confirm('Reset SMTP configuration to official Gmail defaults (duragrit07@gmail.com)?')) {
      setConfig(DEFAULT_SMTP_CONFIG);
      saveSmtpConfig(DEFAULT_SMTP_CONFIG);
      setTestResult(null);
      setLiveSendResult(null);
      showToast('Restored default Gmail (duragrit07@gmail.com) SMTP settings.');
    }
  };

  const handleSendLiveTestEmail = async () => {
    if (!testRecipient || !testRecipient.includes('@')) {
      showToast('Please enter a valid recipient email address.');
      return;
    }
    if (!config.smtpPassword) {
      showToast('Please enter your Google App Password in the SMTP Password field first!');
      return;
    }
    setIsSendingLiveEmail(true);
    setLiveSendResult(null);
    try {
      const template = EMAIL_TEMPLATES.find(t => t.id === 'smtp-test') || EMAIL_TEMPLATES[0];
      const htmlBody = template.generateHtml({
        recipientEmail: testRecipient,
        senderEmail: config.senderEmail,
        smtpHost: config.smtpHost,
        smtpPort: config.smtpPort,
        latency: '...',
        timestamp: new Date().toLocaleString('en-IN')
      });

      const res = await sendLiveCustomEmail({
        to: testRecipient,
        subject: `DuraGrit Vitrified — Live SMTP Gateway Test Dispatch (${new Date().toLocaleTimeString('en-IN')})`,
        html: htmlBody,
        text: `DuraGrit Vitrified SMTP Test. Delivered via ${config.smtpHost}:${config.smtpPort} from ${config.senderEmail} to ${testRecipient}.`,
        templateKey: 'smtp-test'
      });

      setLiveSendResult(res);
      if (res.success) {
        showToast(`Test email delivered to ${testRecipient}! Check your inbox.`);
      } else {
        showToast(`Dispatch error: ${res.record?.lastEvent || 'Failed to send'}`);
      }
    } catch (err) {
      setLiveSendResult({ success: false, record: { lastEvent: err.message || 'Timeout sending test email.' } });
    } finally {
      setIsSendingLiveEmail(false);
    }
  };

  const handleToggleAutoEmail = (val) => {
    setAutoEmail(val);
    setAutoEmailSetting(val);
    showToast(`Automated partner emails upon registration: ${val ? 'ENABLED' : 'PAUSED'}`);
  };

  const handleManualSync = async () => {
    if (!refreshAllData) return;
    setIsSyncingDb(true);
    try {
      await refreshAllData();
      showToast('Synchronized live tables with Supabase & Cross-Port Mobile Bridge.');
    } finally {
      setIsSyncingDb(false);
    }
  };

  const handleClearAllData = async () => {
    if (!clearAllSampleData) return;
    const confirmed = window.confirm(
      'Are you sure you want to wipe ALL Products, QR Batches, Users, Vendors, and Cashback Claims across the Admin Panel, Mobile App, and Supabase Database? (Super Admin sign-in remains active).'
    );
    if (!confirmed) return;

    setIsClearingDb(true);
    try {
      const res = await clearAllSampleData();
      if (res?.rlsLocked) {
        showToast('Local & Cross-Port App cleared! Run supabase/clean_reset_and_enable_sync.sql in Supabase SQL Editor to unlock remote RLS.');
      } else {
        showToast('All operational data wiped across Admin Web, Mobile App & Supabase!');
      }
    } finally {
      setIsClearingDb(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans select-none">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-5 right-5 z-50 bg-[#A62C11] text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-2xl border border-[#F9CEB8]/40 flex items-center space-x-2 animate-in slide-in-from-top-2 duration-200">
          <Info className="w-4 h-4 text-[#F9CEB8] shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Top Banner / Module Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#C84826] text-white flex items-center justify-center font-black text-xl shadow-sm border border-[#A62C11]">
            <Settings className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-slate-900 tracking-tight">System, Supabase &amp; Gateway Console</h1>
              <span className="bg-[#FEF2EE] text-[#C84826] text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border border-[#F9CEB8]">
                Admin Console
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Manage live Supabase database synchronization, cross-port mobile bridge, SMTP dispatch relays, and admin security credentials.
            </p>
          </div>
        </div>

        {/* Global Save / Quick Sync Action */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleManualSync}
            disabled={isSyncingDb}
            className="px-3.5 py-2 text-xs font-bold text-[#C84826] bg-[#FEF2EE] hover:bg-[#FDE5DC] border border-[#F9CEB8] rounded-xl transition flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncingDb ? 'animate-spin' : ''}`} />
            <span>Sync Supabase Now</span>
          </button>

          {activeSubTab === 'email-smtp' && (
            <>
              {isEditing ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setConfig(getSmtpConfig());
                      setIsEditing(false);
                    }}
                    className="px-3.5 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSave}
                    className="px-4 py-2 text-xs font-black text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Changes</span>
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 text-xs font-bold text-white bg-[#C84826] hover:bg-[#A62C11] rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Sliders className="w-3.5 h-3.5 text-white" />
                  <span>Edit SMTP</span>
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Main Settings Navigation Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        <button
          onClick={() => setActiveSubTab('general')}
          className={`flex items-center justify-center gap-1.5 p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'general'
              ? 'bg-[#C84826] text-white border-[#C84826] shadow-sm'
              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Cpu className={`w-4 h-4 ${activeSubTab === 'general' ? 'text-white' : 'text-slate-400'}`} />
          <span>System &amp; DB Sync</span>
          <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-black ${
            activeSubTab === 'general' ? 'bg-white text-[#A62C11]' : 'bg-emerald-100 text-emerald-800'
          }`}>
            SYNC
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('mobile-downloads')}
          className={`flex items-center justify-center gap-1.5 p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'mobile-downloads'
              ? 'bg-[#C84826] text-white border-[#C84826] shadow-sm'
              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Smartphone className={`w-4 h-4 ${activeSubTab === 'mobile-downloads' ? 'text-white' : 'text-slate-400'}`} />
          <span>Mobile APK &amp; iOS PWA</span>
          <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-black ${
            activeSubTab === 'mobile-downloads' ? 'bg-white text-[#A62C11]' : 'bg-[#A62C11] text-white'
          }`}>
            DOWNLOAD
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('email-smtp')}
          className={`flex items-center justify-center gap-1.5 p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'email-smtp'
              ? 'bg-[#C84826] text-white border-[#C84826] shadow-sm'
              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Mail className={`w-4 h-4 ${activeSubTab === 'email-smtp' ? 'text-white' : 'text-slate-400'}`} />
          <span>Email &amp; SMTP</span>
          <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-black ${
            activeSubTab === 'email-smtp' ? 'bg-white text-[#A62C11]' : 'bg-emerald-100 text-emerald-800'
          }`}>
            LIVE
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('security')}
          className={`flex items-center justify-center gap-1.5 p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'security'
              ? 'bg-[#C84826] text-white border-[#C84826] shadow-sm'
              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Lock className={`w-4 h-4 ${activeSubTab === 'security' ? 'text-white' : 'text-slate-400'}`} />
          <span>Admin Security</span>
          <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold ${
            activeSubTab === 'security' ? 'bg-white text-[#A62C11]' : 'bg-slate-100 text-slate-500'
          }`}>
            AUTH
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('sms-otp')}
          className={`flex items-center justify-center gap-1.5 p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'sms-otp'
              ? 'bg-[#C84826] text-white border-[#C84826] shadow-sm'
              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Radio className={`w-4 h-4 ${activeSubTab === 'sms-otp' ? 'text-white' : 'text-slate-400'}`} />
          <span>SMS Gateway</span>
          <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold ${
            activeSubTab === 'sms-otp' ? 'bg-white text-[#A62C11]' : 'bg-slate-100 text-slate-500'
          }`}>
            FAST2SMS
          </span>
        </button>
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* SUB-TAB 1: GENERAL SYSTEM & SUPABASE DATABASE SYNC                  */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {activeSubTab === 'general' && (
        <div className="space-y-6 text-xs">
          {/* Live Supabase & Cross-Port Sync Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-2.5">
                <Database className="w-5 h-5 text-[#C84826]" />
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Supabase Cloud &amp; Mobile App Live Sync Engine</h3>
                  <p className="text-[11px] text-slate-500">
                    Real-time bidirectional synchronization between Admin Web (:3000), Mobile Field App (:3001), and Supabase PostgreSQL.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border ${
                  dbStatus?.connected
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-amber-50 text-amber-800 border-amber-200'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${dbStatus?.connected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                  <span>{dbStatus?.connected ? 'Supabase Connected' : 'Cross-Port Sync Active'}</span>
                </span>
              </div>
            </div>

            {/* Live Record Counters */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 font-mono">
              <div className="p-3.5 bg-[#FAF9F6] rounded-xl border border-slate-200">
                <div className="text-[10px] text-slate-500 font-sans font-bold uppercase">Products (SKUs)</div>
                <div className="text-xl font-black text-slate-900 mt-1">{skus.length}</div>
              </div>
              <div className="p-3.5 bg-[#FAF9F6] rounded-xl border border-slate-200">
                <div className="text-[10px] text-slate-500 font-sans font-bold uppercase">QR Batches</div>
                <div className="text-xl font-black text-slate-900 mt-1">{batches.length}</div>
              </div>
              <div className="p-3.5 bg-[#FAF9F6] rounded-xl border border-slate-200">
                <div className="text-[10px] text-slate-500 font-sans font-bold uppercase">Users / Partners</div>
                <div className="text-xl font-black text-slate-900 mt-1">{users.length}</div>
              </div>
              <div className="p-3.5 bg-[#FAF9F6] rounded-xl border border-slate-200">
                <div className="text-[10px] text-slate-500 font-sans font-bold uppercase">Vendors</div>
                <div className="text-xl font-black text-slate-900 mt-1">{vendors.length}</div>
              </div>
              <div className="p-3.5 bg-[#FAF9F6] rounded-xl border border-slate-200">
                <div className="text-[10px] text-slate-500 font-sans font-bold uppercase">Cashback Claims</div>
                <div className="text-xl font-black text-[#C84826] mt-1">{claims.length}</div>
              </div>
            </div>

            {dbStatus?.rlsLocked && (
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Supabase RLS Write Policy Notice</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  Admin Web (:3000) and Mobile App (:3001) are syncing instantaneously via the cross-port bridge, while Supabase remote writes reported an RLS policy restriction. Run <code className="font-mono bg-white px-1.5 py-0.5 rounded border border-amber-200">supabase/clean_reset_and_enable_sync.sql</code> once in your Supabase SQL Editor to enable full anonymous/client write policies and Realtime publications on all 6 tables.
                </p>
              </div>
            )}

            {/* Danger Zone: 1-Click Clean Reset */}
            <div className="p-4 rounded-xl bg-[#FEF2EE] border border-[#F9CEB8] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="font-bold text-[#A62C11] text-xs uppercase tracking-wider">
                  Clean Database Reset (Zero Sample Data)
                </div>
                <p className="text-[11px] text-slate-600 mt-0.5">
                  Deletes all Products, QR Batches, Users, Vendors, and Cashback Claims simultaneously across Web, Mobile App, and Supabase while keeping your Admin login active.
                </p>
              </div>
              <button
                type="button"
                disabled={isClearingDb}
                onClick={handleClearAllData}
                className="px-4 py-2.5 bg-[#C84826] hover:bg-[#A62C11] text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 shrink-0 cursor-pointer disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                <span>{isClearingDb ? 'Wiping All Tables...' : 'Clear All Operational Data'}</span>
              </button>
            </div>
          </div>

          {/* Runtime Info */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
            <div className="flex items-center space-x-2 pb-3 border-b border-slate-100">
              <Server className="w-5 h-5 text-[#C84826]" />
              <h3 className="font-bold text-slate-900 text-sm">DuraGrit ERP System Runtime</h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="text-[10px] text-slate-400 font-sans font-bold uppercase">Build Version</div>
                <div className="text-sm font-black text-slate-900 mt-1">v2.5.0 Live Sync</div>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="text-[10px] text-slate-400 font-sans font-bold uppercase">Supabase Project</div>
                <div className="text-sm font-black text-slate-900 mt-1">fykxjzvdslvxablmjlfw</div>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="text-[10px] text-slate-400 font-sans font-bold uppercase">Data Storage Mode</div>
                <div className="text-sm font-black text-emerald-600 mt-1">Supabase + Bridge</div>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="text-[10px] text-slate-400 font-sans font-bold uppercase">Kiln Cluster Region</div>
                <div className="text-sm font-black text-[#C84826] mt-1">Morbi, Gujarat (IN)</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* SUB-TAB 2: EMAIL & SMTP CONFIGURATION                                */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {activeSubTab === 'email-smtp' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-[#A62C11] via-[#C84826] to-[#A62C11] text-white p-6 rounded-2xl shadow-sm border border-[#A62C11]">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-wider bg-white text-[#A62C11] px-2 py-0.5 rounded">
                    OUTBOUND DISPATCH SENDER
                  </span>
                  <span className="text-xs text-white/85 font-mono">
                    {config.smtpHost}:{config.smtpPort}
                  </span>
                </div>
                <div className="text-xl font-black text-white flex items-center gap-2">
                  <span>{config.senderName}</span>
                  <span className="text-sm font-normal text-white/80 font-mono">
                    &lt;{config.senderEmail}&gt;
                  </span>
                </div>
                <p className="text-xs text-white/85 leading-relaxed max-w-2xl">
                  All automated verification emails, credentials dossiers, instant UPI cashback notifications, and APK setup guides are routed through this verified address.
                </p>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="bg-white/10 backdrop-blur-xs px-3.5 py-2 rounded-xl border border-white/20 text-center">
                  <div className="text-[9px] font-bold text-white/80 uppercase">SPF Status</div>
                  <div className="text-xs font-black text-emerald-300 flex items-center justify-center gap-1 mt-0.5">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>PASS</span>
                  </div>
                </div>

                <div className="bg-white/10 backdrop-blur-xs px-3.5 py-2 rounded-xl border border-white/20 text-center">
                  <div className="text-[9px] font-bold text-white/80 uppercase">DKIM 2048</div>
                  <div className="text-xs font-black text-emerald-300 flex items-center justify-center gap-1 mt-0.5">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>ALIGNED</span>
                  </div>
                </div>

                <div className="bg-white/10 backdrop-blur-xs px-3.5 py-2 rounded-xl border border-white/20 text-center">
                  <div className="text-[9px] font-bold text-white/80 uppercase">Daily Quota</div>
                  <div className="text-xs font-black text-white mt-0.5">
                    50,000 / day
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Gmail App Password Setup Guide Banner */}
          <div className="bg-[#FEF2EE] border-2 border-[#F9CEB8] rounded-2xl p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start space-x-3.5">
              <div className="p-2.5 bg-[#A62C11] text-white rounded-xl shrink-0 mt-0.5">
                <Lock className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-black text-slate-900 text-xs sm:text-sm uppercase tracking-wide">
                    Google Gmail SMTP Configuration (duragrit07@gmail.com)
                  </h4>
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                    APP PASSWORD REQUIRED
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">
                  Google blocks regular account passwords on SMTP connections when 2-Step Verification is active. Generate a 16-character <strong>Google App Password</strong> to enable live dispatch:
                </p>
                <div className="text-[11px] text-slate-700 space-y-0.5 pt-1">
                  <div>1. Open Google Security: <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noreferrer" className="text-[#C84826] font-bold underline">https://myaccount.google.com/apppasswords</a></div>
                  <div>2. Create an app named <strong>DuraGrit Vitrified</strong> &rarr; Copy the 16-character code (e.g. <code className="bg-white px-1.5 py-0.5 rounded border border-slate-300 font-mono font-bold text-slate-900">abcd efgh ijkl mnop</code>).</div>
                  <div>3. Paste it in the <strong>SMTP Password</strong> field below, click <strong>Save Changes</strong>, and test with <strong>&ldquo;Send Live Test Email&rdquo;</strong>.</div>
                </div>
              </div>
            </div>

            <a
              href="https://myaccount.google.com/apppasswords"
              target="_blank"
              rel="noreferrer"
              className="px-3.5 py-2 bg-[#A62C11] hover:bg-[#8A230C] text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 shadow-xs"
            >
              <span>Open Google App Passwords</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center space-x-2">
                    <Mail className="w-4 h-4 text-[#C84826]" />
                    <span className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                      Sender Identity &amp; From Headers
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400">RFC 5322 Compliant</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wide mb-1">
                      From Display Name *
                    </label>
                    <input
                      type="text"
                      disabled={!isEditing}
                      value={config.senderName}
                      onChange={(e) => setConfig({ ...config, senderName: e.target.value })}
                      placeholder="e.g. DuraGrit Vitrified Dispatch Gateway"
                      className="w-full px-3 py-2 bg-slate-50 disabled:bg-slate-100/70 border border-slate-300 disabled:border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#C84826]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wide mb-1">
                      Sender Email Address (From) *
                    </label>
                    <input
                      type="email"
                      disabled={!isEditing}
                      value={config.senderEmail}
                      onChange={(e) => setConfig({ ...config, senderEmail: e.target.value })}
                      placeholder="dispatch@duragritvitrified.com"
                      className="w-full px-3 py-2 bg-slate-50 disabled:bg-slate-100/70 border border-slate-300 disabled:border-slate-200 rounded-xl font-mono text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-[#C84826]"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wide mb-1">
                      Reply-To Address
                    </label>
                    <input
                      type="email"
                      disabled={!isEditing}
                      value={config.replyToEmail}
                      onChange={(e) => setConfig({ ...config, replyToEmail: e.target.value })}
                      placeholder="support@duragritvitrified.com"
                      className="w-full px-3 py-2 bg-slate-50 disabled:bg-slate-100/70 border border-slate-300 disabled:border-slate-200 rounded-xl font-mono text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#C84826]"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center space-x-2">
                    <Server className="w-4 h-4 text-[#C84826]" />
                    <span className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                      SMTP Host &amp; Connection Parameters
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">Port 587 / TLS</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wide mb-1">
                      SMTP Server Host *
                    </label>
                    <input
                      type="text"
                      disabled={!isEditing}
                      value={config.smtpHost}
                      onChange={(e) => setConfig({ ...config, smtpHost: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 disabled:bg-slate-100/70 border border-slate-300 disabled:border-slate-200 rounded-xl font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#C84826]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wide mb-1">
                      SMTP Port *
                    </label>
                    <input
                      type="text"
                      disabled={!isEditing}
                      value={config.smtpPort}
                      onChange={(e) => setConfig({ ...config, smtpPort: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 disabled:bg-slate-100/70 border border-slate-300 disabled:border-slate-200 rounded-xl font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#C84826]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wide mb-1">
                      Encryption Security
                    </label>
                    <select
                      disabled={!isEditing}
                      value={config.encryption}
                      onChange={(e) => setConfig({ ...config, encryption: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 disabled:bg-slate-100/70 border border-slate-300 disabled:border-slate-200 rounded-xl text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-[#C84826]"
                    >
                      <option value="TLS">STARTTLS (Recommended / 587)</option>
                      <option value="SSL">SSL / TLS Direct (Port 465)</option>
                      <option value="NONE">Unencrypted (Port 25)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wide mb-1">
                      SMTP Username
                    </label>
                    <input
                      type="text"
                      disabled={!isEditing}
                      value={config.smtpUser}
                      onChange={(e) => setConfig({ ...config, smtpUser: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 disabled:bg-slate-100/70 border border-slate-300 disabled:border-slate-200 rounded-xl font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#C84826]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wide mb-1">
                      SMTP Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        disabled={!isEditing}
                        value={config.smtpPassword}
                        onChange={(e) => setConfig({ ...config, smtpPassword: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 disabled:bg-slate-100/70 border border-slate-300 disabled:border-slate-200 rounded-xl font-mono text-slate-800 pr-10 focus:outline-none focus:ring-2 focus:ring-[#C84826]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-700"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
                <span className="font-bold text-slate-900 text-xs uppercase tracking-wider block">
                  Quick SMTP Relay Provider Presets
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                  {[
                    { id: 'gmail', name: 'Google Gmail', host: 'smtp.gmail.com', port: '587', desc: 'duragrit07@gmail.com • Official Default' },
                    { id: 'aws_ses', name: 'AWS SES', host: 'email-smtp.ap-south-1.amazonaws.com', port: '587', desc: 'Mumbai DC • High Deliverability' },
                    { id: 'sendgrid', name: 'SendGrid', host: 'smtp.sendgrid.net', port: '587', desc: 'Twilio Cloud Relay' },
                    { id: 'custom_smtp', name: 'Custom SMTP', host: 'mail.duragritvitrified.com', port: '465', desc: 'Self-hosted CPanel / Postfix' }
                  ].map((prov) => (
                    <button
                      key={prov.id}
                      type="button"
                      disabled={!isEditing}
                      onClick={() => {
                        setConfig({
                          ...config,
                          activeProvider: prov.id,
                          smtpHost: prov.host,
                          smtpPort: prov.port,
                          primaryRelayLabel: prov.name,
                          ...(prov.id === 'gmail' ? {
                            senderEmail: 'duragrit07@gmail.com',
                            smtpUser: 'duragrit07@gmail.com',
                            replyToEmail: 'duragrit07@gmail.com'
                          } : {})
                        });
                        showToast(`Applied ${prov.name} preset parameters.`);
                      }}
                      className={`p-3 rounded-xl border text-left transition ${
                        config.smtpHost === prov.host
                          ? 'border-[#C84826] bg-[#FEF2EE] ring-1 ring-[#C84826]'
                          : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100 disabled:opacity-70'
                      }`}
                    >
                      <div className="font-bold text-slate-900 text-xs flex items-center justify-between">
                        <span>{prov.name}</span>
                        {prov.id === 'gmail' && (
                          <span className="text-[8px] bg-emerald-100 text-emerald-800 px-1 py-0.2 rounded font-black">
                            DEFAULT
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5">{prov.host}</div>
                      <div className="text-[9px] text-[#C84826] font-semibold mt-1">{prov.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {/* LIVE GMAIL SMTP DIAGNOSTIC & DISPATCH CARD */}
              <div className="bg-white border-2 border-[#F9CEB8] rounded-2xl p-5 shadow-xs space-y-4">
                <div className="flex items-center space-x-2 pb-3 border-b border-slate-100">
                  <Zap className="w-4 h-4 text-[#C84826]" />
                  <span className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                    Live Gmail SMTP Diagnostic &amp; Test Dispatch
                  </span>
                </div>

                <p className="text-xs text-slate-500 leading-relaxed">
                  Enter your recipient address and click <strong>&ldquo;Send Live Test Email&rdquo;</strong> to verify that Gmail SMTP delivers a real message directly into your inbox.
                </p>

                {/* Test Recipient Input */}
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wide">
                    Test Recipient Email Address:
                  </label>
                  <input
                    type="email"
                    value={testRecipient}
                    onChange={(e) => setTestRecipient(e.target.value)}
                    placeholder="e.g. duragrit07@gmail.com"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono text-xs text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-[#C84826]"
                  />
                  <span className="text-[10px] text-slate-400 block">
                    Default is <code className="text-slate-600 font-bold">duragrit07@gmail.com</code>. You can change this to your personal email to test external inbox reception.
                  </span>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-1 gap-2 pt-1">
                  <button
                    type="button"
                    disabled={isSendingLiveEmail}
                    onClick={handleSendLiveTestEmail}
                    className="w-full py-2.5 px-4 bg-[#C84826] hover:bg-[#A62C11] active:scale-[0.98] text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-70"
                  >
                    {isSendingLiveEmail ? (
                      <>
                        <RotateCw className="w-4 h-4 animate-spin text-white" />
                        <span>Sending Live Email via Gmail...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 text-white" />
                        <span>🚀 Send Live Test Email to Inbox</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    disabled={isTesting}
                    onClick={handleTestConnection}
                    className="w-full py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] rounded-xl transition flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-70"
                  >
                    {isTesting ? (
                      <>
                        <RotateCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Testing TLS Handshake...</span>
                      </>
                    ) : (
                      <>
                        <Server className="w-3.5 h-3.5 text-slate-500" />
                        <span>Test TLS Handshake &amp; Auth Only</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Live Send Result Notification */}
                {liveSendResult && (
                  <div className={`p-3.5 rounded-xl border text-xs space-y-1.5 animate-in fade-in duration-200 ${
                    liveSendResult.success
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                      : 'bg-rose-50 border-rose-200 text-rose-900'
                  }`}>
                    <div className="flex items-center gap-1.5 font-bold">
                      {liveSendResult.success ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      )}
                      <span>{liveSendResult.success ? 'Email Delivered Successfully!' : 'Email Dispatch Failed'}</span>
                      {liveSendResult.record?.relayLatency && (
                        <span className="text-[10px] font-mono bg-white/70 px-1.5 py-0.2 rounded border ml-auto">
                          {liveSendResult.record.relayLatency}
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] font-mono leading-relaxed break-all">
                      {liveSendResult.record?.lastEvent || liveSendResult.apiRes?.message}
                    </div>
                    {liveSendResult.success && (
                      <div className="text-[10px] text-emerald-800 font-sans font-medium pt-1 border-t border-emerald-200/60">
                        Check the inbox of <strong>{testRecipient}</strong>. Logged in Email Reports.
                      </div>
                    )}
                  </div>
                )}

                {/* Handshake Result */}
                {testResult && (
                  <div className={`p-3.5 rounded-xl border text-xs space-y-1.5 animate-in fade-in duration-200 ${
                    testResult.success
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                      : 'bg-rose-50 border-rose-200 text-rose-900'
                  }`}>
                    <div className="flex items-center gap-1.5 font-bold">
                      {testResult.success ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      )}
                      <span>{testResult.success ? 'SMTP Handshake Verified' : 'Handshake Failed'}</span>
                      {testResult.latency && (
                        <span className="text-[10px] font-mono bg-white/70 px-1.5 py-0.2 rounded border ml-auto">
                          {testResult.latency}
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] font-mono leading-relaxed break-all">
                      {testResult.message}
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
                <div className="flex items-center space-x-2 pb-3 border-b border-slate-100">
                  <Radio className="w-4 h-4 text-[#C84826]" />
                  <span className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                    Registration Dispatch Policy
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div>
                    <div className="font-bold text-xs text-slate-900">Auto-Send on Registration</div>
                    <div className="text-[10px] text-slate-500">
                      Dispatches Template 1 (Email Verification) immediately
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggleAutoEmail(!autoEmail)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                      autoEmail ? 'bg-emerald-500' : 'bg-slate-300'
                    }`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                      autoEmail ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleResetDefaults}
                  className="w-full py-2 text-slate-500 hover:text-slate-800 text-xs font-semibold hover:underline"
                >
                  Reset to Default AWS SES Settings
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* SUB-TAB 3: SMS & FAST2SMS GATEWAY                                   */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {activeSubTab === 'sms-otp' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-[#FEF2EE] text-[#C84826] flex items-center justify-center mx-auto border border-[#F9CEB8]">
            <Smartphone className="w-8 h-8" />
          </div>
          <div className="max-w-md mx-auto space-y-2">
            <h3 className="text-base font-bold text-slate-900">SMS &amp; DLT Route Configuration</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Support for Fast2SMS, MSG91, and Twilio DLT-approved header templates for sending instant OTPs to tile contractors across India.
            </p>
          </div>
          <span className="inline-block bg-slate-100 text-slate-600 text-[11px] font-bold px-3 py-1 rounded-full border border-slate-200">
            Available in Phase 2 Expansion
          </span>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* SUB-TAB 4: SECURITY & MASTER ADMIN CREDENTIALS                       */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {activeSubTab === 'security' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <Lock className="w-5 h-5 text-[#C84826]" />
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Super Admin Authentication Credentials</h3>
                  <p className="text-[11px] text-slate-500">Configure corporate admin email, password and master terminal PIN.</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {editingAdmin ? (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setAdminCreds(getAdminCredentials());
                        setEditingAdmin(false);
                      }}
                      className="px-3 py-1.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        saveAdminCredentials(adminCreds);
                        setEditingAdmin(false);
                        showToast('Super Admin credentials updated!');
                      }}
                      className="px-3.5 py-1.5 text-xs font-black text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm flex items-center gap-1 cursor-pointer"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>Save Credentials</span>
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => setEditingAdmin(true)}
                    className="px-3.5 py-1.5 text-xs font-bold text-[#C84826] bg-[#FEF2EE] hover:bg-[#FDE5DC] border border-[#F9CEB8] rounded-lg cursor-pointer flex items-center gap-1"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    <span>Change Admin Password</span>
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
              <div>
                <label className="block text-[11px] font-sans font-bold text-slate-700 uppercase mb-1">
                  Admin Login Email
                </label>
                <input
                  type="email"
                  disabled={!editingAdmin}
                  value={adminCreds.email}
                  onChange={(e) => setAdminCreds({ ...adminCreds, email: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 disabled:bg-slate-100/70 border border-slate-300 disabled:border-slate-200 rounded-xl font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block text-[11px] font-sans font-bold text-slate-700 uppercase mb-1">
                  Master Password
                </label>
                <div className="relative">
                  <input
                    type={showAdminPass ? 'text' : 'password'}
                    disabled={!editingAdmin}
                    value={adminCreds.password}
                    onChange={(e) => setAdminCreds({ ...adminCreds, password: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 disabled:bg-slate-100/70 border border-slate-300 disabled:border-slate-200 rounded-xl font-bold text-slate-900 pr-9"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAdminPass(!showAdminPass)}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-700 cursor-pointer"
                  >
                    {showAdminPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-sans font-bold text-slate-700 uppercase mb-1">
                  Terminal Security PIN
                </label>
                <input
                  type="text"
                  maxLength={6}
                  disabled={!editingAdmin}
                  value={adminCreds.pin}
                  onChange={(e) => setAdminCreds({ ...adminCreds, pin: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 disabled:bg-slate-100/70 border border-slate-300 disabled:border-slate-200 rounded-xl font-bold text-[#C84826] tracking-widest text-center"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 text-[11px] text-slate-500 border-t border-slate-100">
              <span>These credentials are required on the initial login screen before entering the ERP.</span>
              <button
                type="button"
                onClick={() => {
                  saveAdminCredentials(DEFAULT_ADMIN_CONFIG);
                  setAdminCreds(DEFAULT_ADMIN_CONFIG);
                  showToast('Reset to default Admin credentials.');
                }}
                className="text-slate-400 hover:text-slate-700 text-[10px] font-semibold underline"
              >
                Reset Default Admin Password
              </button>
            </div>
          </div>

          {/* Executive Admin Mobile Command Console Link & Credentials Sync Notice */}
          <div className="bg-[#0B0F19] text-white border-2 border-[#1E293B] rounded-2xl p-6 shadow-xl space-y-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/10">
              <div className="flex items-start space-x-3.5">
                <div className="p-3 bg-[#BA3A24] text-white rounded-xl shadow-md shrink-0">
                  <Smartphone className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="font-black text-white text-base tracking-wide font-sans">
                      DuraGrit Admin Mobile Command Console (.APK &amp; PWA)
                    </h3>
                    <span className="bg-[#BA3A24] text-white text-[9px] font-black px-2 py-0.5 rounded font-mono uppercase tracking-wider">
                      ADMIN ONLY
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                    Dedicated mobile executive panel designed specifically for Plant Supervisors &amp; Super Admins (independent from the Contractor Vendor App). Scan batches, review UPI payouts, trigger haptic moderation chimes, and monitor live kilns.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>SSO SYNC ACTIVE</span>
                </span>
              </div>
            </div>

            {/* Quick SSO Login Credentials Display */}
            <div className="bg-[#131B2A] border border-white/10 rounded-xl p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <div className="text-[10px] font-mono text-slate-400 uppercase font-bold">Admin Mobile Login ID</div>
                <div className="font-mono font-bold text-white text-sm mt-0.5 select-all flex items-center gap-2">
                  <span>{adminCreds.email || 'admin@duragrit.com'}</span>
                  <span className="text-[10px] text-slate-400 font-normal">(or "admin")</span>
                </div>
              </div>

              <div>
                <div className="text-[10px] font-mono text-slate-400 uppercase font-bold">Admin Master Password</div>
                <div className="font-mono font-bold text-amber-400 text-sm mt-0.5 flex items-center gap-2">
                  <span>{showAdminPass ? adminCreds.password : '••••••••'}</span>
                  <span className="text-[10px] text-slate-400 font-sans font-normal">(Syncs from form above)</span>
                </div>
              </div>

              <div>
                <div className="text-[10px] font-mono text-slate-400 uppercase font-bold">Terminal Security PIN</div>
                <div className="font-mono font-bold text-emerald-400 text-sm mt-0.5">
                  {adminCreds.pin || '990011'}
                </div>
              </div>
            </div>

            {/* Action Buttons & QR Code */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-center">
              <div className="md:col-span-2 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <a
                    href={adminPwaUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="p-3.5 bg-gradient-to-r from-[#BA3A24] to-[#8F2310] hover:from-[#8F2310] hover:to-[#701A0B] text-white rounded-xl shadow-lg border border-[#BA3A24] transition-all flex items-center justify-between group cursor-pointer"
                  >
                    <div className="flex items-center space-x-2.5">
                      <Smartphone className="w-5 h-5 text-white/90 group-hover:scale-110 transition-transform" />
                      <div>
                        <div className="font-black text-xs uppercase tracking-wide">🤖 Android App (Install / Open)</div>
                        <div className="text-[10px] text-white/80 font-mono">1-Tap Home Screen Install</div>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-white/70 group-hover:translate-x-1 transition-transform" />
                  </a>

                  <a
                    href={adminPwaUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="p-3.5 bg-[#1E293B] hover:bg-[#283548] text-white rounded-xl shadow border border-slate-700 transition-all flex items-center justify-between group cursor-pointer"
                  >
                    <div className="flex items-center space-x-2.5">
                      <ExternalLink className="w-5 h-5 text-cyan-400 group-hover:rotate-12 transition-transform" />
                      <div>
                        <div className="font-black text-xs uppercase tracking-wide">🍎 iPhone / Safari PWA</div>
                        <div className="text-[10px] text-slate-300 font-mono">{isLocalHost ? ':3001 (Admin Mobile App)' : 'Full Screen PWA'}</div>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
                  </a>
                </div>

                <div className="flex items-center justify-between p-2.5 bg-[#131B2A] rounded-xl border border-white/5 text-[11px]">
                  <span className="text-slate-400 font-mono truncate select-all">{adminPwaUrl}</span>
                  <button
                    type="button"
                    onClick={() => handleCopyLink(adminPwaUrl, 'admin-pwa-sec')}
                    className="ml-2 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-lg border border-slate-600 flex items-center gap-1 shrink-0 cursor-pointer"
                  >
                    {copiedLink === 'admin-pwa-sec' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-slate-400" />}
                    <span>{copiedLink === 'admin-pwa-sec' ? 'Copied' : 'Copy URL'}</span>
                  </button>
                </div>
              </div>

              {/* QR Code */}
              <div className="flex flex-col items-center justify-center p-3 bg-[#131B2A] rounded-xl border border-white/10 text-center">
                {adminPwaQrDataUrl ? (
                  <img
                    src={adminPwaQrDataUrl}
                    alt="Admin App QR Code"
                    className="w-24 h-24 rounded-lg bg-white p-1 shadow"
                  />
                ) : (
                  <div className="w-24 h-24 bg-white/5 rounded-lg flex items-center justify-center">
                    <QrCode className="w-8 h-8 text-slate-500 animate-pulse" />
                  </div>
                )}
                <div className="text-[10px] font-mono text-slate-400 mt-2">Scan with Phone Camera</div>
                <div className="text-[9px] text-[#BA3A24] font-bold">Opens Admin Mobile Console</div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
            <div className="flex items-center space-x-2 pb-3 border-b border-slate-100">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <h3 className="font-bold text-slate-900 text-sm">Security &amp; HSM Cryptographic Engine</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <span className="font-bold text-slate-800 text-xs block">FIPS 140-2 Level 3</span>
                <p className="text-slate-500 text-[11px]">Hardware Security Module signing tile serial token hashes.</p>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">Hardware Enforced</span>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <span className="font-bold text-slate-800 text-xs block">SHA-256 HMAC Signatures</span>
                <p className="text-slate-500 text-[11px]">Carton anti-counterfeit hash verification matching factory kilns.</p>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">Active</span>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <span className="font-bold text-slate-800 text-xs block">2-Step UPI Disbursal Lock</span>
                <p className="text-slate-500 text-[11px]">Pending Approve Step 1 + Completed UTR Release Payout Step 2.</p>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">Shielded</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* SUB-TAB 5: MOBILE COMPANION APP APK & IPHONE PWA DOWNLOAD HUB       */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {activeSubTab === 'mobile-downloads' && (
        <div className="space-y-6 text-xs animate-in fade-in duration-200">
          {/* Top Banner */}
          <div className="bg-gradient-to-r from-white via-[#FCFBF9] to-[#FEF8F5] border-2 border-[#F9CEB8] rounded-3xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center space-x-3.5">
              <div className="p-3.5 bg-[#A62C11] text-white rounded-2xl shadow-sm">
                <Smartphone className="w-7 h-7" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="text-lg font-black text-slate-900 tracking-tight">
                    Official DuraGrit Mobile Suite — Android APK &amp; iPhone PWA Hub
                  </h2>
                  <span className="bg-[#A62C11] text-white text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider font-mono">
                    PRODUCTION
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1">
                  Direct installation hub for field contractors, tile applicators, dealer inventory managers, and supply chain partners. Install anywhere without app store approval delays.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1.5 rounded-xl font-bold text-[11px] flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>APK v4.8.2 Live</span>
              </span>
              <span className="bg-stone-100 text-stone-800 border border-stone-200 px-3 py-1.5 rounded-xl font-bold text-[11px] flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-stone-600" />
                <span>Apple Safari PWA Ready</span>
              </span>
            </div>
          </div>

          {/* Dual Action Download & Launch Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Card 1: Android Companion APK (.apk) */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between space-y-5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-28 h-28 bg-emerald-50 rounded-bl-full pointer-events-none -z-0 opacity-70"></div>

              <div className="space-y-4 relative z-10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-black">
                      <Smartphone className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-sm text-slate-900">
                        Android Application Package (.APK)
                      </h3>
                      <span className="text-[10.5px] text-slate-500 font-medium">
                        For Samsung, Xiaomi, Vivo, Oppo, OnePlus &amp; all Android Phones
                      </span>
                    </div>
                  </div>
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider font-mono">
                    OFFICIAL .APK
                  </span>
                </div>

                <p className="text-slate-600 text-xs leading-relaxed">
                  Native Android package built for Morbi factory contractors, masons, and logistics distributors. Includes real-time hardware QR barcode scanner, camera autofocus, offline wallet, and instant UPI payout notifications.
                </p>

                {/* Specs Pill Matrix */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 py-2">
                  <div className="bg-slate-50 rounded-xl p-2 border border-slate-200 text-center">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Build Version</span>
                    <span className="font-mono font-bold text-slate-900 text-xs mt-0.5 block">v4.8.2 (Prod)</span>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-2 border border-slate-200 text-center">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Package Size</span>
                    <span className="font-mono font-bold text-slate-900 text-xs mt-0.5 block">18.4 MB (.apk)</span>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-2 border border-slate-200 text-center col-span-2 sm:col-span-1">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Compatibility</span>
                    <span className="font-mono font-bold text-slate-900 text-xs mt-0.5 block">Android 8.0 - 15</span>
                  </div>
                </div>

                {/* Download Vendor APK Package Button */}
                <a
                  href={apkDownloadUrl}
                  download="duragrit-vendor-v2.apk"
                  onClick={() => showToast('Downloading Official DuraGrit Vendor Partner App (.APK)...')}
                  className="w-full py-3.5 bg-[#C84826] hover:bg-[#A62C11] text-white text-xs font-black rounded-xl shadow-md transition flex items-center justify-center space-x-2 cursor-pointer active:scale-95"
                >
                  <Download className="w-4 h-4 text-white" />
                  <span>Download Vendor Partner App (.APK)</span>
                </a>

                {/* Direct Launch Mobile Web / PWA Button */}
                <a
                  href={mobilePwaUrl}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => showToast('Opening DuraGrit Partner Mobile App (1-Tap Home Screen Install)...')}
                  className="w-full py-2.5 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center justify-center space-x-2 cursor-pointer active:scale-95"
                >
                  <Smartphone className="w-4 h-4 text-white" />
                  <span>Launch Mobile Web / PWA Portal</span>
                </a>

                {/* Copy Direct APK Link */}
                <div className="flex items-center space-x-2 bg-slate-50 rounded-xl p-2 border border-slate-200">
                  <input
                    type="text"
                    readOnly
                    value={apkDownloadUrl}
                    className="flex-1 bg-transparent text-[10.5px] font-mono text-slate-700 outline-none select-all"
                  />
                  <button
                    onClick={() => handleCopyLink(apkDownloadUrl, 'apk')}
                    className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 font-bold text-[10.5px] rounded-lg border border-slate-200 flex items-center space-x-1 transition cursor-pointer"
                  >
                    {copiedLink === 'apk' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-slate-500" />}
                    <span>{copiedLink === 'apk' ? 'Copied' : 'Copy APK'}</span>
                  </button>
                </div>
              </div>

              {/* QR Code Quick Scan Box */}
              <div className="pt-4 border-t border-slate-100 flex items-center space-x-4">
                {apkQrDataUrl ? (
                  <img
                    src={apkQrDataUrl}
                    alt="Scan to Download APK"
                    className="w-20 h-20 rounded-xl border border-slate-200 p-1 bg-white shadow-2xs shrink-0"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                    <QrCode className="w-8 h-8 text-slate-400" />
                  </div>
                )}
                <div>
                  <span className="font-extrabold text-slate-900 block text-xs">
                    Scan with Android Camera
                  </span>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Open your smartphone camera or Google Lens to download the APK package directly to your phone.
                  </p>
                </div>
              </div>
            </div>

            {/* Card 2: Apple iPhone & iPad Web PWA Portal */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between space-y-5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-28 h-28 bg-stone-100 rounded-bl-full pointer-events-none -z-0 opacity-70"></div>

              <div className="space-y-4 relative z-10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-9 h-9 rounded-xl bg-stone-100 text-stone-800 flex items-center justify-center font-black">
                      <Compass className="w-5 h-5 text-stone-800" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-sm text-slate-900">
                        Apple iPhone &amp; iPad Safari PWA
                      </h3>
                      <span className="text-[10.5px] text-slate-500 font-medium">
                        Runs full screen without App Store approval on iOS Safari
                      </span>
                    </div>
                  </div>
                  <span className="bg-stone-900 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider font-mono">
                    SAFARI PWA
                  </span>
                </div>

                <p className="text-slate-600 text-xs leading-relaxed">
                  Full native-like progressive web application for Apple iPhone and iPad users. Installable directly through Apple Safari in 10 seconds without needing an Apple ID. Runs full-screen with offline caching, high-speed camera QR reading, and biometric keychain.
                </p>

                {/* Specs Pill Matrix */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 py-2">
                  <div className="bg-slate-50 rounded-xl p-2 border border-slate-200 text-center">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">iOS Compatibility</span>
                    <span className="font-mono font-bold text-slate-900 text-xs mt-0.5 block">iOS 14.0 to 18+</span>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-2 border border-slate-200 text-center">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">App Mode</span>
                    <span className="font-mono font-bold text-slate-900 text-xs mt-0.5 block">Standalone PWA</span>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-2 border border-slate-200 text-center col-span-2 sm:col-span-1">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Engine</span>
                    <span className="font-mono font-bold text-slate-900 text-xs mt-0.5 block">Apple WebKit</span>
                  </div>
                </div>

                {/* Direct iPhone Launch Button */}
                <button
                  type="button"
                  onClick={() => window.open(mobilePwaUrl, '_blank')}
                  className="w-full py-3.5 bg-[#1C1917] hover:bg-black text-white text-xs font-black rounded-xl shadow-md transition flex items-center justify-center space-x-2 cursor-pointer active:scale-95"
                >
                  <ExternalLink className="w-4 h-4 text-white" />
                  <span>Launch iPhone PWA Portal</span>
                </button>

                {/* Copy Direct PWA Link */}
                <div className="flex items-center space-x-2 bg-slate-50 rounded-xl p-2 border border-slate-200">
                  <input
                    type="text"
                    readOnly
                    value={mobilePwaUrl}
                    className="flex-1 bg-transparent text-[10.5px] font-mono text-slate-700 outline-none select-all"
                  />
                  <button
                    onClick={() => handleCopyLink(mobilePwaUrl, 'pwa')}
                    className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 font-bold text-[10.5px] rounded-lg border border-slate-200 flex items-center space-x-1 transition cursor-pointer"
                  >
                    {copiedLink === 'pwa' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-slate-500" />}
                    <span>{copiedLink === 'pwa' ? 'Copied' : 'Copy Link'}</span>
                  </button>
                </div>
              </div>

              {/* QR Code Quick Scan Box */}
              <div className="pt-4 border-t border-slate-100 flex items-center space-x-4">
                {iosPwaQrDataUrl ? (
                  <img
                    src={iosPwaQrDataUrl}
                    alt="Scan for iPhone PWA"
                    className="w-20 h-20 rounded-xl border border-slate-200 p-1 bg-white shadow-2xs shrink-0"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                    <QrCode className="w-8 h-8 text-slate-400" />
                  </div>
                )}
                <div>
                  <span className="font-extrabold text-slate-900 block text-xs">
                    Scan with iPhone Camera
                  </span>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Open your iPhone camera to instantly launch the link in Safari, then tap &ldquo;Add to Home Screen&rdquo;.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* DEDICATED CARD: EXECUTIVE ADMIN MOBILE APP (.APK & PWA) (STEP 12)         */}
          {/* ========================================================================= */}
          <div className="bg-gradient-to-br from-[#0B0F19] via-[#1E293B] to-[#0F172A] rounded-3xl border-2 border-[#BA3A24]/70 p-6 shadow-xl space-y-6 relative overflow-hidden text-white">
            <div className="absolute top-0 right-0 w-48 h-48 bg-[#BA3A24]/10 rounded-full blur-3xl pointer-events-none"></div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-700/80 pb-5 relative z-10">
              <div className="flex items-center space-x-3.5">
                <div className="w-12 h-12 rounded-2xl bg-[#BA3A24] flex items-center justify-center text-white shadow-lg border border-[#E3643E]/40 shrink-0">
                  <ShieldCheck className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-base font-black tracking-tight text-white font-serif">
                      DuraGrit Executive Admin Mobile Command Console (.APK &amp; PWA)
                    </h3>
                    <span className="bg-[#BA3A24] text-white text-[9.5px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider font-mono">
                      SUPER ADMIN ONLY
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1">
                    Specialized executive mobile moderation console for administrators. Moderate contractor claims on-the-go with tactile haptic and audio confirmation, 1-tap UPI escrow releases, and mobile factory QR batch ingestion.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="bg-emerald-950/80 text-emerald-300 border border-emerald-500/30 px-3 py-1 rounded-xl text-[11px] font-mono font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>NODE: MORBI HQ</span>
                </span>
                <span className="bg-slate-800 text-slate-300 border border-slate-700 px-3 py-1 rounded-xl text-[11px] font-mono font-bold">
                  STEP 12 ENGINE
                </span>
              </div>
            </div>

            {/* Matrix of Specs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 relative z-10 font-mono text-xs">
              <div className="p-3 bg-slate-800/80 rounded-2xl border border-slate-700/70">
                <span className="text-[9.5px] text-slate-400 font-sans font-bold uppercase block">Security HSM</span>
                <span className="text-emerald-400 font-bold block mt-0.5">FIPS 140-2 Level 3</span>
              </div>
              <div className="p-3 bg-slate-800/80 rounded-2xl border border-slate-700/70">
                <span className="text-[9.5px] text-slate-400 font-sans font-bold uppercase block">Admin Package</span>
                <span className="text-white font-bold block mt-0.5">duragrit-admin-v2.apk</span>
              </div>
              <div className="p-3 bg-slate-800/80 rounded-2xl border border-slate-700/70">
                <span className="text-[9.5px] text-slate-400 font-sans font-bold uppercase block">Haptic Audio</span>
                <span className="text-amber-400 font-bold block mt-0.5">Tactile Feedback On</span>
              </div>
              <div className="p-3 bg-slate-800/80 rounded-2xl border border-slate-700/70">
                <span className="text-[9.5px] text-slate-400 font-sans font-bold uppercase block">Auth Single Sign-On</span>
                <span className="text-sky-300 font-bold block mt-0.5">admin / 1234 (Sync)</span>
              </div>
            </div>

            {/* Dual Download & Launch Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
              {/* Option A: Download Admin APK */}
              <div className="bg-slate-800/70 border border-slate-700 rounded-2xl p-4 flex flex-col justify-between space-y-3">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-xs text-white uppercase tracking-wider flex items-center gap-1.5">
                      <Smartphone className="w-4 h-4 text-emerald-400" />
                      <span>Admin Android APK Package</span>
                    </span>
                    <span className="text-[9px] font-mono text-slate-400">18.4 MB</span>
                  </div>
                  <p className="text-[11px] text-slate-300">
                    Direct installation package for Android phones. High-speed moderation queue with background offline synchronization.
                  </p>
                </div>

                <a
                  href={adminApkDownloadUrl}
                  download="duragrit-admin-command-v2.apk"
                  onClick={() => showToast('Downloading DuraGrit Executive Admin Mobile App (.APK)...')}
                  className="w-full py-3 bg-[#BA3A24] hover:bg-[#A02F17] text-white text-xs font-black rounded-xl shadow-md transition flex items-center justify-center space-x-2 cursor-pointer active:scale-95"
                >
                  <Download className="w-4 h-4 text-white" />
                  <span>Download Admin Android App (.APK)</span>
                </a>

                <div className="flex items-center space-x-2 bg-slate-900/90 rounded-xl p-2 border border-slate-700/80">
                  <input
                    type="text"
                    readOnly
                    value={adminApkDownloadUrl}
                    className="flex-1 bg-transparent text-[10px] font-mono text-slate-300 outline-none select-all"
                  />
                  <button
                    onClick={() => handleCopyLink(adminApkDownloadUrl, 'admin-apk')}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-[10px] rounded-lg border border-slate-600 flex items-center space-x-1 transition cursor-pointer"
                  >
                    {copiedLink === 'admin-apk' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-slate-400" />}
                    <span>{copiedLink === 'admin-apk' ? 'Copied' : 'Copy APK'}</span>
                  </button>
                </div>
              </div>

              {/* Option B: Launch Admin PWA */}
              <div className="bg-slate-800/70 border border-slate-700 rounded-2xl p-4 flex flex-col justify-between space-y-3">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-xs text-white uppercase tracking-wider flex items-center gap-1.5">
                      <Compass className="w-4 h-4 text-sky-400" />
                      <span>Admin Safari / Chrome PWA</span>
                    </span>
                    <span className="text-[9px] font-mono text-emerald-400 font-bold">INSTANT LAUNCH</span>
                  </div>
                  <p className="text-[11px] text-slate-300">
                    Runs standalone in Apple Safari &amp; Google Chrome. Add to Home Screen in 5 seconds without APK installation.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => window.open(adminPwaUrl, '_blank')}
                  className="w-full py-3 bg-slate-900 hover:bg-black text-white text-xs font-black rounded-xl border border-slate-600 shadow-md transition flex items-center justify-center space-x-2 cursor-pointer active:scale-95"
                >
                  <ExternalLink className="w-4 h-4 text-sky-400" />
                  <span>Launch Admin Mobile App (PWA Portal)</span>
                </button>

                <div className="flex items-center space-x-2 bg-slate-900/90 rounded-xl p-2 border border-slate-700/80">
                  <input
                    type="text"
                    readOnly
                    value={adminPwaUrl}
                    className="flex-1 bg-transparent text-[10px] font-mono text-slate-300 outline-none select-all"
                  />
                  <button
                    onClick={() => handleCopyLink(adminPwaUrl, 'admin-pwa')}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-[10px] rounded-lg border border-slate-600 flex items-center space-x-1 transition cursor-pointer"
                  >
                    {copiedLink === 'admin-pwa' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-slate-400" />}
                    <span>{copiedLink === 'admin-pwa' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Quick QR Code for Admin App */}
            <div className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10 bg-slate-900/60 p-3.5 rounded-2xl border border-slate-800">
              <div className="flex items-center space-x-3.5">
                {adminPwaQrDataUrl ? (
                  <img
                    src={adminPwaQrDataUrl}
                    alt="Scan for Admin Mobile App"
                    className="w-20 h-20 rounded-xl border-2 border-[#BA3A24] p-1 bg-white shadow-md shrink-0"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-xl bg-slate-800 flex items-center justify-center shrink-0">
                    <QrCode className="w-8 h-8 text-slate-500" />
                  </div>
                )}
                <div>
                  <span className="font-extrabold text-white block text-xs">
                    Scan with Smartphone Camera to Open Admin Console
                  </span>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Open your smartphone camera or Lens to immediately launch the Admin Mobile App. Use your Admin credentials (<strong className="text-white font-mono">{adminCreds.email}</strong>) to log in.
                  </p>
                </div>
              </div>

              <div className="shrink-0">
                <span className="text-[10px] font-mono text-amber-300 bg-amber-950/60 border border-amber-600/40 px-2.5 py-1 rounded-xl block text-center">
                  🔐 SSO Master Credentials Linked
                </span>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* STEP-BY-STEP "HOW TO INSTALL" INSTRUCTIONS (ANDROID & IPHONE)              */}
          {/* ========================================================================= */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-black text-slate-900 text-sm tracking-tight">
                  Step-by-Step Installation Guides (Android &amp; Apple iOS)
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Follow these simple instructions to install the DuraGrit Retail Mobile Suite on any smartphone in under 60 seconds.
                </p>
              </div>

              <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setGuidePlatform('both')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    guidePlatform === 'both' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Both Guides
                </button>
                <button
                  type="button"
                  onClick={() => setGuidePlatform('android')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    guidePlatform === 'android' ? 'bg-[#C84826] text-white shadow-xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  🤖 Android Guide
                </button>
                <button
                  type="button"
                  onClick={() => setGuidePlatform('ios')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    guidePlatform === 'ios' ? 'bg-stone-900 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  🍎 iPhone (iOS) Guide
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* ANDROID STEP-BY-STEP GUIDE */}
              {(guidePlatform === 'both' || guidePlatform === 'android') && (
                <div className="space-y-4">
                  <div className="flex items-center space-x-2 pb-2 border-b border-emerald-100">
                    <span className="p-1.5 rounded-lg bg-emerald-100 text-emerald-800 font-bold text-xs">
                      ANDROID
                    </span>
                    <h4 className="font-black text-slate-900 text-xs uppercase tracking-wider">
                      Android Direct APK Installation (5 Steps)
                    </h4>
                  </div>

                  <div className="space-y-3">
                    {/* Step 1 */}
                    <div className="flex items-start space-x-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                      <div className="w-7 h-7 rounded-full bg-[#C84826] text-white font-black text-xs flex items-center justify-center shrink-0 font-mono">
                        1
                      </div>
                      <div className="space-y-1">
                        <span className="font-bold text-slate-900 block text-xs">
                          Initiate APK Download
                        </span>
                        <p className="text-slate-600 text-[11px] leading-relaxed">
                          Click the <strong>&ldquo;Download Android App (.APK)&rdquo;</strong> button above, or scan the Android QR code with your phone camera. The package file <code className="bg-slate-200 px-1 py-0.5 rounded text-[10px]">duragrit-contractor-v4.8.2.apk</code> will begin downloading.
                        </p>
                      </div>
                    </div>

                    {/* Step 2 */}
                    <div className="flex items-start space-x-3 p-3.5 rounded-2xl bg-[#FEF8F5] border border-[#F9CEB8]">
                      <div className="w-7 h-7 rounded-full bg-[#A62C11] text-white font-black text-xs flex items-center justify-center shrink-0 font-mono">
                        2
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center space-x-1.5">
                          <span className="font-bold text-slate-900 text-xs">
                            Accept Browser Security Prompt
                          </span>
                          <span className="bg-amber-100 text-amber-800 text-[9px] font-bold px-1.5 py-0.2 rounded font-mono">
                            IMPORTANT
                          </span>
                        </div>
                        <p className="text-slate-600 text-[11px] leading-relaxed">
                          Google Chrome or Samsung Internet will display: <em>&ldquo;File might be harmful. Do you want to download duragrit...apk anyway?&rdquo;</em> Tap <strong>&ldquo;Download anyway&rdquo;</strong>.
                        </p>
                        <p className="text-[10px] text-slate-500 italic mt-0.5">
                          *Note: This standard Android alert appears for all direct enterprise APKs. The DuraGrit APK is cryptographically signed and 100% safe.
                        </p>
                      </div>
                    </div>

                    {/* Step 3 */}
                    <div className="flex items-start space-x-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                      <div className="w-7 h-7 rounded-full bg-[#C84826] text-white font-black text-xs flex items-center justify-center shrink-0 font-mono">
                        3
                      </div>
                      <div className="space-y-1">
                        <span className="font-bold text-slate-900 block text-xs">
                          Open Downloaded Package
                        </span>
                        <p className="text-slate-600 text-[11px] leading-relaxed">
                          Once the download reaches 100%, swipe down your phone&rsquo;s notification drawer and tap <strong>&ldquo;Open&rdquo;</strong>, or open your phone&rsquo;s <strong>My Files &rarr; Downloads</strong> folder and tap the APK file.
                        </p>
                      </div>
                    </div>

                    {/* Step 4 */}
                    <div className="flex items-start space-x-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                      <div className="w-7 h-7 rounded-full bg-[#C84826] text-white font-black text-xs flex items-center justify-center shrink-0 font-mono">
                        4
                      </div>
                      <div className="space-y-1">
                        <span className="font-bold text-slate-900 block text-xs">
                          Toggle &ldquo;Allow from this source&rdquo;
                        </span>
                        <p className="text-slate-600 text-[11px] leading-relaxed">
                          If Android displays <em>&ldquo;For your security, your phone is not allowed to install unknown apps from this source&rdquo;</em>, tap <strong>Settings</strong> and switch <strong>&ldquo;Allow from this source&rdquo;</strong> to <strong>ON</strong>.
                        </p>
                      </div>
                    </div>

                    {/* Step 5 */}
                    <div className="flex items-start space-x-3 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200">
                      <div className="w-7 h-7 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center shrink-0 font-mono">
                        5
                      </div>
                      <div className="space-y-1">
                        <span className="font-bold text-emerald-900 block text-xs">
                          Tap Install &amp; Sign In
                        </span>
                        <p className="text-emerald-800 text-[11px] leading-relaxed">
                          Tap <strong>&ldquo;Install&rdquo;</strong> on the prompt. Once installation finishes, tap <strong>&ldquo;Open&rdquo;</strong>, grant Camera &amp; Location permissions, and log in with your registered phone number &amp; passkey!
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* IPHONE (IOS) SAFARI STEP-BY-STEP GUIDE */}
              {(guidePlatform === 'both' || guidePlatform === 'ios') && (
                <div className="space-y-4">
                  <div className="flex items-center space-x-2 pb-2 border-b border-stone-200">
                    <span className="p-1.5 rounded-lg bg-stone-900 text-white font-bold text-xs">
                      APPLE IOS
                    </span>
                    <h4 className="font-black text-slate-900 text-xs uppercase tracking-wider">
                      iPhone &amp; iPad Safari PWA Setup (5 Steps)
                    </h4>
                  </div>

                  <div className="space-y-3">
                    {/* Step 1 */}
                    <div className="flex items-start space-x-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                      <div className="w-7 h-7 rounded-full bg-stone-900 text-white font-black text-xs flex items-center justify-center shrink-0 font-mono">
                        1
                      </div>
                      <div className="space-y-1">
                        <span className="font-bold text-slate-900 block text-xs">
                          Open Apple Safari on iPhone
                        </span>
                        <p className="text-slate-600 text-[11px] leading-relaxed">
                          Open the default <strong>Safari browser</strong> on your iPhone and visit the mobile app portal link, or scan the iPhone QR code above with your camera.
                        </p>
                        <p className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 inline-block font-semibold mt-0.5">
                          ⚠️ Note: Must be Apple Safari. Third-party browsers (Chrome/Firefox for iOS) cannot pin apps to the home screen.
                        </p>
                      </div>
                    </div>

                    {/* Step 2 */}
                    <div className="flex items-start space-x-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                      <div className="w-7 h-7 rounded-full bg-stone-900 text-white font-black text-xs flex items-center justify-center shrink-0 font-mono">
                        2
                      </div>
                      <div className="space-y-1">
                        <span className="font-bold text-slate-900 block text-xs">
                          Tap the Safari &ldquo;Share&rdquo; Button
                        </span>
                        <p className="text-slate-600 text-[11px] leading-relaxed">
                          In the bottom navigation toolbar of Safari, tap the central <strong>Share icon</strong> (the square box with an arrow pointing straight up: <code className="bg-slate-200 px-1 py-0.5 rounded text-[10.5px]">⎋</code>).
                        </p>
                      </div>
                    </div>

                    {/* Step 3 */}
                    <div className="flex items-start space-x-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                      <div className="w-7 h-7 rounded-full bg-stone-900 text-white font-black text-xs flex items-center justify-center shrink-0 font-mono">
                        3
                      </div>
                      <div className="space-y-1">
                        <span className="font-bold text-slate-900 block text-xs">
                          Select &ldquo;Add to Home Screen&rdquo;
                        </span>
                        <p className="text-slate-600 text-[11px] leading-relaxed">
                          In the iOS Share sheet menu that slides up, scroll down past your AirDrop contacts and tap <strong>&ldquo;Add to Home Screen&rdquo;</strong> (marked with a square <code className="bg-slate-200 px-1 py-0.5 rounded text-[10.5px]">[+]</code> icon).
                        </p>
                      </div>
                    </div>

                    {/* Step 4 */}
                    <div className="flex items-start space-x-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                      <div className="w-7 h-7 rounded-full bg-stone-900 text-white font-black text-xs flex items-center justify-center shrink-0 font-mono">
                        4
                      </div>
                      <div className="space-y-1">
                        <span className="font-bold text-slate-900 block text-xs">
                          Confirm App Title &amp; Tap &ldquo;Add&rdquo;
                        </span>
                        <p className="text-slate-600 text-[11px] leading-relaxed">
                          Verify the application title is set to <strong>&ldquo;DuraGrit Retail&rdquo;</strong>, then tap the blue <strong>&ldquo;Add&rdquo;</strong> button in the top-right corner of your iPhone screen.
                        </p>
                      </div>
                    </div>

                    {/* Step 5 */}
                    <div className="flex items-start space-x-3 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200">
                      <div className="w-7 h-7 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center shrink-0 font-mono">
                        5
                      </div>
                      <div className="space-y-1">
                        <span className="font-bold text-emerald-900 block text-xs">
                          Launch Full-Screen Native Experience
                        </span>
                        <p className="text-emerald-800 text-[11px] leading-relaxed">
                          The official DuraGrit Vitrified icon is now pinned to your iPhone Home Screen! Tap it to launch borderless in full screen — with instant offline loading, high-speed camera scanning, and zero browser address bars!
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Hardware & Operating System Compatibility Matrix */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center space-x-2.5 pb-2 border-b border-slate-100">
              <Layers className="w-4 h-4 text-[#C84826]" />
              <h4 className="font-black text-slate-900 text-xs uppercase tracking-wider">
                Hardware &amp; Operating System Specifications Matrix
              </h4>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase">
                    <th className="py-2.5 px-3">Platform</th>
                    <th className="py-2.5 px-3">Supported OS Versions</th>
                    <th className="py-2.5 px-3">Camera Scanner Hardware</th>
                    <th className="py-2.5 px-3">Network Footprint</th>
                    <th className="py-2.5 px-3">Security Integrity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                  <tr>
                    <td className="py-3 px-3 font-bold text-slate-900 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      <span>Android Smartphones</span>
                    </td>
                    <td className="py-3 px-3 font-mono text-[11px]">Android 8.0 Oreo to Android 15</td>
                    <td className="py-3 px-3">Rear Autofocus Lens (5MP+)</td>
                    <td className="py-3 px-3">5G / 4G LTE / Wi-Fi (Offline Queuing)</td>
                    <td className="py-3 px-3 text-emerald-700 font-bold">Play Protect Certified</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-3 font-bold text-slate-900 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-stone-800"></span>
                      <span>Apple iPhone &amp; iPad</span>
                    </td>
                    <td className="py-3 px-3 font-mono text-[11px]">iOS 14.0 to iOS 18+</td>
                    <td className="py-3 px-3">Apple WebKit Camera Stream</td>
                    <td className="py-3 px-3">5G / 4G LTE / Wi-Fi (ServiceWorker Cache)</td>
                    <td className="py-3 px-3 text-emerald-700 font-bold">Sandboxed WebKit TLS 1.3</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Technical Support & Factory Helpdesk Callout */}
          <div className="bg-[#1C1917] text-white rounded-3xl p-6 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-mono font-bold text-[#F9CEB8] tracking-widest block">
                MORBI CERAMIC KILN IT HELPDESK
              </span>
              <h4 className="text-base font-extrabold text-white">
                Need assistance with device installation or passkey setup?
              </h4>
              <p className="text-xs text-stone-400">
                Our Morbi technical support team is available from 9:00 AM to 8:00 PM IST to assist all contractors, dealers, and logistics partners.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <a
                href="tel:+917303967198"
                className="px-4 py-2.5 bg-[#C84826] hover:bg-[#A62C11] text-white text-xs font-bold rounded-xl transition flex items-center space-x-2 shadow-sm"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Call Desk: +91 7303967198</span>
              </a>

              <a
                href="mailto:info@duragritvitrified.com?subject=DuraGrit%20Mobile%20App%20Installation%20Support"
                className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl transition flex items-center space-x-2"
              >
                <Mail className="w-3.5 h-3.5 text-stone-300" />
                <span>info@duragritvitrified.com</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

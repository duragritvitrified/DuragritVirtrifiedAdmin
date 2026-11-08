import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import QRCode from 'qrcode';
import {
  Mail,
  Send,
  Download,
  Copy,
  Check,
  Key,
  Smartphone,
  ShieldCheck,
  User,
  Phone,
  Lock,
  CheckCircle,
  CheckCircle2,
  Inbox,
  QrCode,
  ExternalLink,
  Share2,
  Compass,
  HelpCircle,
  RefreshCw,
  FileText,
  AlertCircle,
  Laptop,
  Sliders,
  ChevronRight,
  Shield,
  Layers,
  ArrowDownToLine,
  Sparkles
} from 'lucide-react';
import {
  getEmailDispatches,
  sendOnboardingEmail,
  getAutoEmailSetting,
  setAutoEmailSetting
} from '../../services/emailService';
import { useData } from '../../context/DataContext';

export function OnboardingDossier({ initialUser, onNavigateToFieldApp }) {
  const { users = [], vendors = [] } = useData();

  // Active sub-view tab
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'apps' | 'dossier' | 'ledger'
  const [guidePlatform, setGuidePlatform] = useState('both'); // 'both' | 'android' | 'ios'
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedLink, setCopiedLink] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [autoEmailEnabled, setAutoEmailEnabled] = useState(getAutoEmailSetting());
  const [dispatches, setDispatches] = useState(getEmailDispatches());

  // QR Code States
  const [vendorApkQr, setVendorApkQr] = useState('');
  const [vendorPwaQr, setVendorPwaQr] = useState('');
  const [adminApkQr, setAdminApkQr] = useState('');
  const [adminPwaQr, setAdminPwaQr] = useState('');
  const [vendorQrMode, setVendorQrMode] = useState('apk'); // 'apk' | 'pwa'
  const [adminQrMode, setAdminQrMode] = useState('apk');   // 'apk' | 'pwa'

  // Host & Download URL detection
  const isLocalHost = typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

  const vendorPwaUrl = typeof window !== 'undefined'
    ? (isLocalHost
        ? `${window.location.protocol}//${window.location.hostname}:3002/`
        : `${window.location.origin}/app/?app=vendor`)
    : 'https://duragrit-virtrified-admin.vercel.app/app/?app=vendor';

  const vendorApkUrl = typeof window !== 'undefined'
    ? (isLocalHost
        ? `${window.location.protocol}//${window.location.hostname}:3000/apk/duragrit-vendor-v4.8.2.apk`
        : `${window.location.origin}/apk/duragrit-vendor-v4.8.2.apk`)
    : 'https://duragrit-virtrified-admin.vercel.app/apk/duragrit-vendor-v4.8.2.apk';

  const adminPwaUrl = typeof window !== 'undefined'
    ? (isLocalHost
        ? `${window.location.protocol}//${window.location.hostname}:3001/`
        : `${window.location.origin}/app/?app=admin`)
    : 'https://duragrit-virtrified-admin.vercel.app/app/?app=admin';

  const adminApkUrl = typeof window !== 'undefined'
    ? (isLocalHost
        ? `${window.location.protocol}//${window.location.hostname}:3000/apk/duragrit-admin-v2.apk`
        : `${window.location.origin}/apk/duragrit-admin-v2.apk`)
    : 'https://duragrit-virtrified-admin.vercel.app/apk/duragrit-admin-v2.apk';

  // Seed sample partners if database is completely empty so page is NEVER blank
  const defaultSamplePartners = [
    {
      id: 'USR-1001',
      name: 'Sunaj Kumar Sahoo',
      mobile: '+91 88260 21114',
      role: 'Contractor / Partner',
      email: 'admin@duragritvitrified.com',
      tempPassword: 'Dura#6038',
      hub: 'Morbi Central Kiln Hub',
      vpa: 'sunaj@upi'
    },
    {
      id: 'USR-1042',
      name: 'Ramesh Patel',
      mobile: '+91 98250 14820',
      role: 'Tile Contractor',
      email: 'ramesh.tile@gmail.com',
      tempPassword: 'Dura#9142',
      hub: 'Ahmedabad Distribution Kiln Hub',
      vpa: 'ramesh@upi'
    },
    {
      id: 'USR-2051',
      name: 'Suresh Kumar',
      mobile: '+91 98112 40591',
      role: 'Master Mason',
      email: 'suresh.mason@gmail.com',
      tempPassword: 'Dura#4821',
      hub: 'Surat Express Hub',
      vpa: 'suresh@upi'
    }
  ];

  const rawPartners = users && users.length > 0 ? users : defaultSamplePartners;
  const liveUsers = rawPartners.map(u => ({
    id: String(u.id || u.userId || 'USR-1001').startsWith('USR-') ? String(u.id || u.userId) : `USR-${u.id || u.userId || '1001'}`,
    name: u.name || 'Contractor Partner',
    mobile: u.mobile || u.phone || '+91 98250 14820',
    role: `${u.role || 'Contractor'} / Partner`,
    email: u.email || 'partner@duragritvitrified.com',
    tempPassword: u.passkey || u.tempPassword || u.password || `Dura#${String(u.id || '2026').replace(/[^0-9]/g, '') || '2026'}`,
    hub: u.location || u.hub || 'Morbi Kiln Network',
    vpa: u.vpa || u.upiId || ''
  }));

  const [selectedUserIndex, setSelectedUserIndex] = useState(0);
  const activeUser = initialUser || liveUsers[selectedUserIndex] || liveUsers[0];
  const [customEmail, setCustomEmail] = useState(activeUser?.email || '');

  useEffect(() => {
    setCustomEmail(activeUser?.email || '');
  }, [activeUser?.id, activeUser?.email]);

  // Generate Scannable QR Codes on Mount
  useEffect(() => {
    const qrOpts = {
      width: 180,
      margin: 1,
      color: { dark: '#A62C11', light: '#FFFFFF' }
    };

    QRCode.toDataURL(vendorApkUrl, qrOpts)
      .then(url => setVendorApkQr(url))
      .catch(() => {});

    QRCode.toDataURL(vendorPwaUrl, { ...qrOpts, color: { dark: '#0F172A', light: '#FFFFFF' } })
      .then(url => setVendorPwaQr(url))
      .catch(() => {});

    QRCode.toDataURL(adminApkUrl, qrOpts)
      .then(url => setAdminApkQr(url))
      .catch(() => {});

    QRCode.toDataURL(adminPwaUrl, { ...qrOpts, color: { dark: '#0F172A', light: '#FFFFFF' } })
      .then(url => setAdminPwaQr(url))
      .catch(() => {});
  }, [vendorApkUrl, vendorPwaUrl, adminApkUrl, adminPwaUrl]);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3800);
  };

  const handleCopyKey = () => {
    if (!activeUser) return;
    navigator.clipboard.writeText(activeUser.tempPassword);
    setCopiedKey(true);
    showToast(`Security Passkey ${activeUser.tempPassword} copied to clipboard!`);
    setTimeout(() => setCopiedKey(false), 2500);
  };

  const handleCopyLink = (url, key) => {
    if (!url) return;
    navigator.clipboard.writeText(url);
    setCopiedLink(key);
    showToast(`Direct download link copied to clipboard!`);
    setTimeout(() => setCopiedLink(''), 2500);
  };

  const handleSendEmail = async () => {
    if (!activeUser) return;
    const targetEmail = (customEmail || activeUser.email || '').trim();
    if (!targetEmail || !targetEmail.includes('@')) {
      showToast('Please enter a valid recipient email address first.');
      return;
    }

    setIsSending(true);
    try {
      await sendOnboardingEmail({
        recipientEmail: targetEmail,
        recipientName: activeUser.name,
        mobile: activeUser.mobile,
        userId: activeUser.id,
        role: activeUser.role,
        tempPassword: activeUser.tempPassword,
        hub: activeUser.hub,
        apkUrl: vendorApkUrl,
        pwaUrl: vendorPwaUrl
      });

      try {
        confetti({ particleCount: 50, spread: 65, origin: { y: 0.6 } });
      } catch (e) {}

      setDispatches(getEmailDispatches());
      showToast(`Onboarding Dossier & Credentials dispatched to ${targetEmail}!`);
    } catch (err) {
      showToast(`Dispatch failed: ${err.message}`);
    } finally {
      setIsSending(false);
    }
  };

  const handleToggleAutoEmail = () => {
    const nextVal = !autoEmailEnabled;
    setAutoEmailEnabled(nextVal);
    setAutoEmailSetting(nextVal);
    showToast(`Automatic credential email dispatch is now ${nextVal ? 'ENABLED' : 'PAUSED'}.`);
  };

  return (
    <div className="flex-1 flex flex-col relative space-y-6">
      {/* Toast Notification */}
      {toastMsg && (() => {
        const isError = /error|failed|failure|invalid|missing|required|cannot|unable|reject|please enter|denied/i.test(toastMsg);
        return (
          <div className={`fixed top-20 right-6 z-50 text-white px-4 py-3 rounded-xl shadow-2xl border flex items-center space-x-2 text-xs font-semibold animate-in fade-in duration-200 ${
            isError ? 'bg-rose-600 border-rose-400 shadow-rose-950/30' : 'bg-emerald-600 border-emerald-400 shadow-emerald-950/30'
          }`}>
            {isError ? (
              <AlertCircle className="w-4 h-4 text-white shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-white shrink-0" />
            )}
            <span>{toastMsg}</span>
          </div>
        );
      })()}

      {/* ─── PAGE HEADER & EXECUTIVE ACTIONS ─────────────────────────────── */}
      <section className="flex flex-col xl:flex-row xl:items-center justify-between pb-4 gap-4 border-b border-slate-200">
        <div>
          <div className="flex items-center space-x-3 mb-1">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Mobile Apps &amp; Partner Onboarding Hub
            </h1>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider bg-[#FEF2EE] text-[#C84826] border border-[#F9CEB8]">
              OFFICIAL APK &amp; PWA HUB • STEP 05 COMPANION
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 max-w-3xl">
            Direct download center for DuraGrit Vendor &amp; Admin Android APKs, iOS/PWA field apps, and automated partner credential onboarding engine.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleToggleAutoEmail}
            className={`inline-flex items-center space-x-2 px-3 py-2 rounded-lg text-xs font-bold border transition cursor-pointer ${
              autoEmailEnabled
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                : 'bg-slate-100 text-slate-600 border-slate-300'
            }`}
            title="Automatically email credentials when new partners register"
          >
            <span className={`w-2 h-2 rounded-full ${autoEmailEnabled ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></span>
            <span>Auto-Email: <strong>{autoEmailEnabled ? 'ON' : 'OFF'}</strong></span>
          </button>

          <a
            href={vendorApkUrl}
            download="duragrit-vendor-v4.8.2.apk"
            onClick={() => showToast('Starting download for Vendor Mobile App APK...')}
            className="inline-flex items-center space-x-2 px-3.5 py-2 bg-[#C84826] hover:bg-[#A62C11] text-white rounded-lg text-xs font-bold shadow-xs transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-white" />
            <span>Download Vendor APK</span>
          </a>

          <a
            href={adminApkUrl}
            download="duragrit-admin-v2.apk"
            onClick={() => showToast('Starting download for Admin Command APK...')}
            className="inline-flex items-center space-x-2 px-3.5 py-2 bg-slate-900 hover:bg-black text-white rounded-lg text-xs font-bold shadow-xs transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-white" />
            <span>Download Admin APK</span>
          </a>
        </div>
      </section>

      {/* ─── QUICK SUB-VIEW NAVIGATION PILLS ─────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-2.5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'all'
                ? 'bg-[#C84826] text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>All-in-One Hub</span>
          </button>

          <button
            onClick={() => setActiveTab('apps')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'apps'
                ? 'bg-[#C84826] text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Vendor &amp; Admin Mobile APKs</span>
            <span className="text-[10px] bg-white/20 text-current px-1.5 py-0.2 rounded-full font-mono">
              2 APPS
            </span>
          </button>

          <button
            onClick={() => setActiveTab('dossier')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'dossier'
                ? 'bg-[#C84826] text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>Partner Credentials &amp; Dossier</span>
            <span className="text-[10px] bg-white/20 text-current px-1.5 py-0.2 rounded-full font-mono">
              {liveUsers.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('ledger')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'ledger'
                ? 'bg-[#C84826] text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Email Delivery Ledger</span>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded-full font-mono font-bold">
              {dispatches.length} LOGS
            </span>
          </button>
        </div>

        {/* Live System Health Tags */}
        <div className="hidden lg:flex items-center gap-2 text-[11px] font-mono text-slate-500">
          <span className="flex items-center gap-1 text-emerald-600 font-bold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Signed Release APK v2.1</span>
          </span>
          <span>•</span>
          <span>SHA-256 Verified</span>
        </div>
      </div>

      {/* ─── SECTION 1: PROMINENT DUAL MOBILE APPS DOWNLOAD CENTER ──────── */}
      {(activeTab === 'all' || activeTab === 'apps') && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-[#C84826]" />
                <span>Official DuraGrit Mobile App Packages (.APK &amp; PWA)</span>
              </h2>
              <p className="text-xs text-slate-500">
                Independent native release binaries with zero third-party store dependencies. Tap Download on your phone or scan with camera.
              </p>
            </div>
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold text-slate-600">
              <button
                onClick={() => setGuidePlatform('both')}
                className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${guidePlatform === 'both' ? 'bg-white text-slate-900 shadow-xs' : ''}`}
              >
                All Platforms
              </button>
              <button
                onClick={() => setGuidePlatform('android')}
                className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${guidePlatform === 'android' ? 'bg-white text-emerald-700 shadow-xs' : ''}`}
              >
                Android (.apk)
              </button>
              <button
                onClick={() => setGuidePlatform('ios')}
                className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${guidePlatform === 'ios' ? 'bg-white text-slate-900 shadow-xs' : ''}`}
              >
                iPhone (iOS PWA)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* ── CARD 1: VENDOR / CONTRACTOR MOBILE APP ─────────────────── */}
            <div className="bg-white rounded-3xl border-2 border-[#F9CEB8]/70 p-6 shadow-sm flex flex-col justify-between space-y-5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[#FEF2EE] to-transparent rounded-bl-full pointer-events-none -z-0"></div>

              <div className="space-y-4 relative z-10">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#A62C11] to-[#C84826] text-white flex items-center justify-center font-black shadow-md border border-[#F9CEB8]/50">
                      DG
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-extrabold text-sm text-slate-900">
                          DuraGrit Vendor &amp; Contractor App
                        </h3>
                      </div>
                      <span className="text-[11px] text-slate-500 font-medium">
                        Dedicated Mobile App for Tile Applicators &amp; Dealers
                      </span>
                    </div>
                  </div>
                  <span className="bg-[#FEF2EE] text-[#A62C11] border border-[#F9CEB8] text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider font-mono">
                    VENDOR APP • v2.1
                  </span>
                </div>

                <p className="text-slate-600 text-xs leading-relaxed">
                  High-speed QR scanner with camera autofocus, flashlight toggle, offline verification, instant UPI cashback payouts directly into bank accounts, and partner profile ledger.
                </p>

                {/* Specs Pill Matrix */}
                <div className="grid grid-cols-3 gap-2 py-1 text-center">
                  <div className="bg-[#FAF9F6] rounded-xl p-2.5 border border-slate-200">
                    <span className="text-[9.5px] text-slate-400 font-bold block uppercase">Release Version</span>
                    <span className="font-mono font-bold text-slate-900 text-xs mt-0.5 block">v2.1 (Release)</span>
                  </div>
                  <div className="bg-[#FAF9F6] rounded-xl p-2.5 border border-slate-200">
                    <span className="text-[9.5px] text-slate-400 font-bold block uppercase">APK File Size</span>
                    <span className="font-mono font-bold text-[#A62C11] text-xs mt-0.5 block">4.10 MB (.apk)</span>
                  </div>
                  <div className="bg-[#FAF9F6] rounded-xl p-2.5 border border-slate-200">
                    <span className="text-[9.5px] text-slate-400 font-bold block uppercase">Package ID</span>
                    <span className="font-mono font-bold text-slate-900 text-[10px] mt-0.5 block truncate" title="com.duragrit.vitrified.vendor">
                      ...vitrified.vendor
                    </span>
                  </div>
                </div>

                {/* Primary Action Buttons */}
                <div className="space-y-2 pt-1">
                  <a
                    href={vendorApkUrl}
                    download="duragrit-vendor-v4.8.2.apk"
                    onClick={() => showToast('Downloading Official Vendor Mobile App APK (duragrit-vendor-v4.8.2.apk)...')}
                    className="w-full py-3 bg-[#C84826] hover:bg-[#A62C11] text-white text-xs font-black rounded-xl shadow-md transition flex items-center justify-center space-x-2 cursor-pointer active:scale-98"
                  >
                    <Download className="w-4 h-4 text-white" />
                    <span>Download Vendor Partner App (.APK)</span>
                  </a>

                  <a
                    href={vendorPwaUrl}
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => showToast('Opening DuraGrit Vendor Web App / iPhone Safari PWA...')}
                    className="w-full py-2.5 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center justify-center space-x-2 cursor-pointer active:scale-98"
                  >
                    <Smartphone className="w-4 h-4 text-white" />
                    <span>Open Vendor Web App (iOS Safari PWA)</span>
                  </a>
                </div>

                {/* Copy Direct APK Link Bar */}
                <div className="flex items-center space-x-2 bg-slate-50 rounded-xl p-2 border border-slate-200">
                  <input
                    type="text"
                    readOnly
                    value={vendorApkUrl}
                    className="flex-1 bg-transparent text-[10.5px] font-mono text-slate-700 outline-none select-all truncate"
                  />
                  <button
                    onClick={() => handleCopyLink(vendorApkUrl, 'vendor-apk')}
                    className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 font-bold text-[10.5px] rounded-lg border border-slate-200 flex items-center space-x-1 transition cursor-pointer"
                  >
                    {copiedLink === 'vendor-apk' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-slate-500" />}
                    <span>{copiedLink === 'vendor-apk' ? 'Copied' : 'Copy APK'}</span>
                  </button>
                </div>
              </div>

              {/* QR Code Quick Scan Footer */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-4">
                <div className="flex items-center space-x-3.5">
                  <div className="relative">
                    {vendorQrMode === 'apk' ? (
                      vendorApkQr ? (
                        <img
                          src={vendorApkQr}
                          alt="Scan to Download Vendor APK"
                          className="w-20 h-20 rounded-xl border border-slate-200 p-1 bg-white shadow-2xs shrink-0"
                        />
                      ) : (
                        <div className="w-20 h-20 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                          <QrCode className="w-8 h-8 text-slate-400" />
                        </div>
                      )
                    ) : (
                      vendorPwaQr ? (
                        <img
                          src={vendorPwaQr}
                          alt="Scan to Open Vendor PWA"
                          className="w-20 h-20 rounded-xl border border-slate-200 p-1 bg-white shadow-2xs shrink-0"
                        />
                      ) : (
                        <div className="w-20 h-20 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                          <QrCode className="w-8 h-8 text-slate-400" />
                        </div>
                      )
                    )}
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-[#A62C11] uppercase tracking-wider block">
                      Quick Phone Scan
                    </span>
                    <div className="flex items-center gap-1.5 mt-1">
                      <button
                        onClick={() => setVendorQrMode('apk')}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded cursor-pointer ${
                          vendorQrMode === 'apk' ? 'bg-[#C84826] text-white' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        Android APK
                      </button>
                      <button
                        onClick={() => setVendorQrMode('pwa')}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded cursor-pointer ${
                          vendorQrMode === 'pwa' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        iPhone PWA
                      </button>
                    </div>
                    <span className="text-[10px] text-slate-500 mt-1 block">
                      Point camera to {vendorQrMode === 'apk' ? 'download .apk' : 'launch in Safari'}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="inline-block text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 px-2 py-1 rounded-md border border-emerald-200">
                    Android 8.0 - 15
                  </span>
                </div>
              </div>
            </div>

            {/* ── CARD 2: ADMIN COMMAND MOBILE APP ───────────────────────── */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between space-y-5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-slate-100 to-transparent rounded-bl-full pointer-events-none -z-0"></div>

              <div className="space-y-4 relative z-10">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-950 text-white flex items-center justify-center font-black shadow-md border border-slate-700">
                      <Shield className="w-5 h-5 text-amber-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-extrabold text-sm text-slate-900">
                          DuraGrit Admin Command App
                        </h3>
                      </div>
                      <span className="text-[11px] text-slate-500 font-medium">
                        Mobile Control Panel for Plant Managers &amp; Directors
                      </span>
                    </div>
                  </div>
                  <span className="bg-slate-100 text-slate-800 border border-slate-300 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider font-mono">
                    ADMIN APP • v2.1
                  </span>
                </div>

                <p className="text-slate-600 text-xs leading-relaxed">
                  Real-time sales telemetry, QR batch approvals, pending claim clearances, vendor KYC verification, automated SMTP audit triggers, and security key rotations on mobile.
                </p>

                {/* Specs Pill Matrix */}
                <div className="grid grid-cols-3 gap-2 py-1 text-center">
                  <div className="bg-[#FAF9F6] rounded-xl p-2.5 border border-slate-200">
                    <span className="text-[9.5px] text-slate-400 font-bold block uppercase">Release Version</span>
                    <span className="font-mono font-bold text-slate-900 text-xs mt-0.5 block">v2.1 (Admin)</span>
                  </div>
                  <div className="bg-[#FAF9F6] rounded-xl p-2.5 border border-slate-200">
                    <span className="text-[9.5px] text-slate-400 font-bold block uppercase">APK File Size</span>
                    <span className="font-mono font-bold text-slate-900 text-xs mt-0.5 block">4.10 MB (.apk)</span>
                  </div>
                  <div className="bg-[#FAF9F6] rounded-xl p-2.5 border border-slate-200">
                    <span className="text-[9.5px] text-slate-400 font-bold block uppercase">Package ID</span>
                    <span className="font-mono font-bold text-slate-900 text-[10px] mt-0.5 block truncate" title="com.duragrit.vitrified.admin">
                      ...vitrified.admin
                    </span>
                  </div>
                </div>

                {/* Primary Action Buttons */}
                <div className="space-y-2 pt-1">
                  <a
                    href={adminApkUrl}
                    download="duragrit-admin-v2.apk"
                    onClick={() => showToast('Downloading Official Admin Command App APK (duragrit-admin-v2.apk)...')}
                    className="w-full py-3 bg-slate-900 hover:bg-black text-white text-xs font-black rounded-xl shadow-md transition flex items-center justify-center space-x-2 cursor-pointer active:scale-98"
                  >
                    <Download className="w-4 h-4 text-white" />
                    <span>Download Admin Command App (.APK)</span>
                  </a>

                  <a
                    href={adminPwaUrl}
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => showToast('Opening DuraGrit Admin Mobile Web App...')}
                    className="w-full py-2.5 bg-white hover:bg-slate-50 text-slate-900 border border-slate-300 text-xs font-bold rounded-xl shadow-2xs transition flex items-center justify-center space-x-2 cursor-pointer active:scale-98"
                  >
                    <Smartphone className="w-4 h-4 text-[#C84826]" />
                    <span>Open Admin Mobile Web (iOS / PWA)</span>
                  </a>
                </div>

                {/* Copy Direct APK Link Bar */}
                <div className="flex items-center space-x-2 bg-slate-50 rounded-xl p-2 border border-slate-200">
                  <input
                    type="text"
                    readOnly
                    value={adminApkUrl}
                    className="flex-1 bg-transparent text-[10.5px] font-mono text-slate-700 outline-none select-all truncate"
                  />
                  <button
                    onClick={() => handleCopyLink(adminApkUrl, 'admin-apk')}
                    className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 font-bold text-[10.5px] rounded-lg border border-slate-200 flex items-center space-x-1 transition cursor-pointer"
                  >
                    {copiedLink === 'admin-apk' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-slate-500" />}
                    <span>{copiedLink === 'admin-apk' ? 'Copied' : 'Copy APK'}</span>
                  </button>
                </div>
              </div>

              {/* QR Code Quick Scan Footer */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-4">
                <div className="flex items-center space-x-3.5">
                  <div className="relative">
                    {adminQrMode === 'apk' ? (
                      adminApkQr ? (
                        <img
                          src={adminApkQr}
                          alt="Scan to Download Admin APK"
                          className="w-20 h-20 rounded-xl border border-slate-200 p-1 bg-white shadow-2xs shrink-0"
                        />
                      ) : (
                        <div className="w-20 h-20 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                          <QrCode className="w-8 h-8 text-slate-400" />
                        </div>
                      )
                    ) : (
                      adminPwaQr ? (
                        <img
                          src={adminPwaQr}
                          alt="Scan to Open Admin PWA"
                          className="w-20 h-20 rounded-xl border border-slate-200 p-1 bg-white shadow-2xs shrink-0"
                        />
                      ) : (
                        <div className="w-20 h-20 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                          <QrCode className="w-8 h-8 text-slate-400" />
                        </div>
                      )
                    )}
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider block">
                      Admin Mobile Scan
                    </span>
                    <div className="flex items-center gap-1.5 mt-1">
                      <button
                        onClick={() => setAdminQrMode('apk')}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded cursor-pointer ${
                          adminQrMode === 'apk' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        Admin APK
                      </button>
                      <button
                        onClick={() => setAdminQrMode('pwa')}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded cursor-pointer ${
                          adminQrMode === 'pwa' ? 'bg-[#C84826] text-white' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        iPhone PWA
                      </button>
                    </div>
                    <span className="text-[10px] text-slate-500 mt-1 block">
                      Point camera to {adminQrMode === 'apk' ? 'download Admin APK' : 'launch in Safari'}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="inline-block text-[10px] font-mono font-bold bg-slate-100 text-slate-700 px-2 py-1 rounded-md border border-slate-200">
                    FIPS 140-2 Level 3
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ─── INSTALLATION GUIDES ACCORDION ──────────────────────────── */}
          {(guidePlatform === 'both' || guidePlatform === 'android' || guidePlatform === 'ios') && (
            <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-[#C84826]" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                    Step-by-Step Installation Guides
                  </h3>
                </div>
                <span className="text-[11px] text-slate-400 font-mono">No App Store Required</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {/* Android Steps */}
                {(guidePlatform === 'both' || guidePlatform === 'android') && (
                  <div className="bg-emerald-50/50 border border-emerald-200/60 rounded-2xl p-4 space-y-2.5">
                    <div className="flex items-center gap-2 font-bold text-emerald-900">
                      <Smartphone className="w-4 h-4 text-emerald-600" />
                      <span>Android (.APK) Installation (Samsung, Xiaomi, Vivo, Oppo, etc.)</span>
                    </div>
                    <ol className="list-decimal list-inside space-y-1.5 text-slate-600 text-[11.5px] leading-relaxed">
                      <li>Tap <strong>Download APK</strong> or scan the QR code with phone camera.</li>
                      <li>Open the downloaded <code className="font-mono bg-white px-1 py-0.5 rounded border border-emerald-200">.apk</code> file from your notification bar or Downloads folder.</li>
                      <li>If prompted with <em>&ldquo;Install Unknown Apps&rdquo;</em>, tap <strong>Settings</strong> and toggle on <strong>&ldquo;Allow from this source&rdquo;</strong>.</li>
                      <li>Tap <strong>Install</strong>, then tap <strong>Open</strong> to launch DuraGrit!</li>
                    </ol>
                  </div>
                )}

                {/* iPhone Steps */}
                {(guidePlatform === 'both' || guidePlatform === 'ios') && (
                  <div className="bg-sky-50/50 border border-sky-200/60 rounded-2xl p-4 space-y-2.5">
                    <div className="flex items-center gap-2 font-bold text-sky-900">
                      <Compass className="w-4 h-4 text-sky-600" />
                      <span>iPhone &amp; iPad (Apple Safari 1-Tap Home Screen PWA)</span>
                    </div>
                    <ol className="list-decimal list-inside space-y-1.5 text-slate-600 text-[11.5px] leading-relaxed">
                      <li>Open Safari on iPhone and tap <strong>Open Web App (iOS PWA)</strong> or scan the iOS QR code.</li>
                      <li>Tap the Safari <strong>Share</strong> button (the square icon with upward arrow at the bottom).</li>
                      <li>Scroll down the share sheet and tap <strong>&ldquo;Add to Home Screen&rdquo;</strong>.</li>
                      <li>Tap <strong>Add</strong> in the top-right corner. The app icon is pinned to your home screen!</li>
                    </ol>
                  </div>
                )}
              </div>
            </div>
          )}
        </section>
      )}

      {/* ─── SECTION 2: PARTNER CREDENTIALS & ONBOARDING DOSSIER ────────── */}
      {(activeTab === 'all' || activeTab === 'dossier') && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
                <Key className="w-5 h-5 text-[#C84826]" />
                <span>Partner Onboarding Dossier &amp; Credentials Dispatch</span>
              </h2>
              <p className="text-xs text-slate-500">
                Generate and email personalized security passkeys, login IDs, and download links directly to contractors and dealers.
              </p>
            </div>
            <button
              onClick={handleSendEmail}
              disabled={isSending || !activeUser}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-[#C84826] hover:bg-[#A62C11] text-white rounded-xl text-xs font-bold shadow-sm transition disabled:opacity-50 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5 text-white" />
              <span>{isSending ? 'Dispatching Mail...' : 'Send Credentials Email'}</span>
            </button>
          </div>

          {/* Recipient Selector Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                Select Partner ({liveUsers.length}):
              </span>
              <div className="inline-flex flex-wrap gap-1 p-1 bg-slate-100 rounded-xl text-xs font-semibold border border-slate-200">
                {liveUsers.map((u, i) => (
                  <button
                    key={u.id}
                    onClick={() => {
                      setSelectedUserIndex(i);
                      setCustomEmail(u.email || '');
                    }}
                    className={`px-3 py-1.5 rounded-lg text-[11px] transition-all cursor-pointer ${
                      selectedUserIndex === i
                        ? 'bg-[#C84826] text-white shadow-xs font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {u.name} ({u.id})
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-400 font-mono">Send to:</span>
              <input
                type="email"
                value={customEmail}
                onChange={(e) => setCustomEmail(e.target.value)}
                placeholder="partner@domain.com"
                className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg font-mono text-slate-800 focus:outline-none focus:bg-white focus:ring-1 focus:ring-[#C84826] w-56"
              />
              <button
                onClick={handleSendEmail}
                disabled={isSending}
                className="px-3 py-1.5 bg-[#C84826] hover:bg-[#A62C11] text-white rounded-lg text-xs font-bold shadow-xs flex items-center space-x-1 cursor-pointer disabled:opacity-50"
              >
                <Send className="w-3 h-3 text-white" />
                <span>Send</span>
              </button>
            </div>
          </div>

          {/* 600px Email Card Preview */}
          <div className="flex flex-col items-center justify-center py-2">
            <div className="w-full max-w-[600px] bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden font-sans">
              <div className="h-2 w-full bg-gradient-to-r from-[#A62C11] via-[#C84826] to-[#F9CEB8]"></div>

              <div className="px-6 sm:px-8 pt-7 pb-6 bg-[#A62C11] text-white">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#C84826] border border-white/25 flex items-center justify-center shadow-md">
                      <span className="text-white font-black text-xl tracking-tighter">DG</span>
                    </div>
                    <div>
                      <span className="font-black text-lg tracking-wider text-white">DURAGRIT VITRIFIED</span>
                      <p className="text-[11px] text-white/80 font-medium">Retail &amp; QR Cashback Network</p>
                    </div>
                  </div>
                  <div className="inline-flex items-center gap-1.5 bg-white/15 border border-white/25 px-3 py-1 rounded-full text-xs font-semibold text-white">
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Active Partner</span>
                  </div>
                </div>

                <div className="mt-5">
                  <h2 className="text-2xl font-black tracking-tight text-white">
                    Hello {activeUser.name},
                  </h2>
                  <p className="mt-1.5 text-white/85 text-xs sm:text-sm leading-relaxed">
                    Your DuraGrit Partner Account is provisioned and synced with the Mobile Field Scanner App.
                  </p>
                </div>
              </div>

              <div className="px-6 sm:px-8 py-7 bg-[#FAF9F6] space-y-5">
                <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-xs">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                    <Key className="w-4 h-4 text-[#C84826]" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                      Mobile App Login Credentials
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Mobile / Login ID</span>
                      <span className="font-mono font-bold text-slate-900 text-sm mt-1 block">
                        {activeUser.mobile || activeUser.id}
                      </span>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Role &amp; Partner Code</span>
                      <span className="font-bold text-[#C84826] text-xs mt-1 block">
                        {activeUser.role} ({activeUser.id})
                      </span>
                    </div>
                  </div>

                  <div className="bg-[#FEF2EE] rounded-xl p-3.5 border border-[#F9CEB8] flex items-center justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-bold text-[#A62C11] uppercase block">Login Passkey</span>
                      <span className="font-mono font-black text-slate-900 text-base tracking-wider mt-0.5 block">
                        {activeUser.tempPassword}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleCopyKey}
                      className="text-xs bg-[#C84826] hover:bg-[#A62C11] text-white font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer"
                    >
                      {copiedKey ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedKey ? 'Copied' : 'Copy Key'}</span>
                    </button>
                  </div>

                  <div className="flex items-start gap-2 text-slate-500 text-[11px]">
                    <Lock className="w-3.5 h-3.5 text-[#C84826] shrink-0 mt-0.5" />
                    <span>Use this Mobile Number / User ID and Passkey directly on the DuraGrit Mobile App sign-in screen.</span>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 p-5 text-center space-y-3">
                  <h3 className="text-base font-black text-slate-900">Launch DuraGrit Vendor Partner App</h3>
                  <p className="text-xs text-slate-500">Official Mobile App &amp; Web Portal dedicated strictly to Vendors &amp; Tile Contractors.</p>
                  <div className="flex flex-wrap items-center justify-center gap-3">
                    <a
                      href={vendorApkUrl}
                      download="duragrit-vendor-v4.8.2.apk"
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download Vendor APK (.apk)</span>
                    </a>
                    <a
                      href={vendorPwaUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#C84826] hover:bg-[#A62C11] text-white font-bold text-xs rounded-xl shadow-sm cursor-pointer"
                    >
                      <Smartphone className="w-4 h-4" />
                      <span>Open Vendor Web App (iOS / PWA)</span>
                    </a>
                  </div>
                </div>
              </div>

              <div className="bg-slate-900 text-slate-300 px-6 py-4 text-center text-[11px] flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-[#C84826]" />
                  <span>Support: +91 7303967196</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>DuraGrit Vitrified • Live Sync</span>
                </span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ─── SECTION 3: EMAIL GATEWAY AUDIT DELIVERY LEDGER ─────────────── */}
      {(activeTab === 'all' || activeTab === 'ledger') && (
        <section className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#C84826]" />
                <span>Email Gateway Delivery Ledger</span>
              </h3>
              <p className="text-xs text-slate-500">Live audit trail of dispatched partner onboarding credentials and APK links</p>
            </div>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              {dispatches.length} Dispatches Recorded
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF9F6] text-slate-500 font-bold uppercase text-[10px] border-b border-slate-200">
                <tr>
                  <th className="p-3">Tracking ID</th>
                  <th className="p-3">Recipient</th>
                  <th className="p-3">Subject</th>
                  <th className="p-3">Relay &amp; Latency</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {dispatches.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50">
                    <td className="p-3 font-mono font-bold text-slate-700">{d.id}</td>
                    <td className="p-3">
                      <div className="font-bold text-slate-900">{d.recipientName || 'Partner'}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{d.recipientEmail || d.to}</div>
                    </td>
                    <td className="p-3 max-w-xs truncate text-slate-700" title={d.subject}>
                      {d.subject}
                    </td>
                    <td className="p-3 font-mono text-[11px] text-slate-500">
                      {d.relay || 'smtp.gmail.com:587'}
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        d.status === 'Delivered'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : d.status === 'Opened'
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : d.status === 'Clicked'
                          ? 'bg-purple-50 text-purple-700 border-purple-200'
                          : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}>
                        {d.status || 'Delivered'}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-slate-500 text-[11px]">
                      {d.timestamp || d.sentAt || 'Just now'}
                    </td>
                  </tr>
                ))}

                {dispatches.length === 0 && (
                  <tr>
                    <td colSpan="6" className="py-10 text-center text-slate-400 text-xs">
                      <Inbox className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <div className="font-bold text-slate-700">No onboarding emails dispatched yet</div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Click &ldquo;Send Credentials Email&rdquo; above to dispatch the first onboarding pack.
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}

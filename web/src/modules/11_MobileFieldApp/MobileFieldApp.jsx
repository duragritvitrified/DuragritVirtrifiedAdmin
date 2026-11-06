import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import {
  Home,
  QrCode,
  MapPin,
  CheckCircle,
  ArrowLeft,
  RefreshCw,
  ShieldCheck,
  Zap,
  Building2,
  AlertCircle,
  Laptop,
  Smartphone,
  Maximize2,
  User,
  Wallet,
  ExternalLink,
  Key,
  Copy,
  Check,
  FileText,
  LogIn,
  LogOut,
  UploadCloud,
  Paperclip,
  X
} from 'lucide-react';
import { useData } from '../../context/DataContext';

export function MobileFieldApp({ onSwitchToDesktop }) {
  const {
    users = [],
    vendors = [],
    batches = [],
    claims = [],
    dbStatus = {},
    submitScannedCode,
    refreshAllData
  } = useData();

  // Partner Auth State inside simulator
  const [portalMode, setPortalMode] = useState('contractor'); // 'contractor' | 'vendor'
  const [activePartner, setActivePartner] = useState(null);
  const [loginId, setLoginId] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Navigation State: 'signin' | 'home' | 'scan' | 'claims' | 'profile'
  const [activeTab, setActiveTab] = useState('signin');
  const [viewFormat, setViewFormat] = useState('phone'); // 'phone' | 'fullscreen'

  // Scanner State
  const [manualSerial, setManualSerial] = useState('');
  const [proofImage, setProofImage] = useState(null);
  const [proofName, setProofName] = useState('');
  const [scanResultMsg, setScanResultMsg] = useState(null);
  const [isScanning, setIsScanning] = useState(false);

  // Claims Filter State
  const [claimsFilter, setClaimsFilter] = useState('all');
  const [receiptModal, setReceiptModal] = useState(null);
  const [toastMsg, setToastMsg] = useState('');
  const [copiedKey, setCopiedKey] = useState(false);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3200);
  };

  // Match live user / vendor record from DataContext so wallet & PO balances stay real-time
  const livePartner = activePartner
    ? activePartner.role === 'Vendor'
      ? vendors.find(v => String(v.vendorId || v.id) === String(activePartner.vendorId || activePartner.id)) || activePartner
      : users.find(u =>
        String(u.id) === String(activePartner.id) ||
        (activePartner.mobile && String(u.mobile || '').replace(/\D/g, '').slice(-10) === String(activePartner.mobile).replace(/\D/g, '').slice(-10))
      ) || activePartner
    : null;

  // Claims belonging to the active partner
  const partnerClaims = livePartner
    ? claims.filter(c => {
      const pDigits = String(livePartner.mobile || livePartner.phone || '').replace(/\D/g, '').slice(-10);
      const cDigits = String(c.userMobile || c.contractorPhone || c.mobile || '').replace(/\D/g, '').slice(-10);
      const pId = String(livePartner.userId || livePartner.id || '').replace(/^USR-/i, '');
      const cId = String(c.userId || c.contractorId || '').replace(/^USR-/i, '');
      return (
        (pId && cId && pId === cId) ||
        (pDigits.length === 10 && cDigits === pDigits) ||
        (livePartner.name && String(c.userName || c.contractorName || '').toLowerCase() === livePartner.name.toLowerCase())
      );
    })
    : [];

  const getBucket = (c) => {
    if (c.status === 'Disbursed' || c.payoutStatus === 'Disbursed') return 'completed';
    if (c.status === 'Approved') return 'inprocess';
    if (c.status === 'Rejected' || c.status === 'Flagged') return 'rejected';
    return 'pending';
  };

  const disbursedSum = partnerClaims
    .filter(c => getBucket(c) === 'completed')
    .reduce((s, c) => s + (Number(c.disbursedAmount || c.amount || c.claimValue) || 0), 0);

  const pendingSum = partnerClaims
    .filter(c => getBucket(c) === 'pending' || getBucket(c) === 'inprocess')
    .reduce((s, c) => s + (Number(c.amount || c.claimValue) || 0), 0);

  const handlePartnerLogin = (e) => {
    if (e) e.preventDefault();
    setLoginError('');
    const rawId = loginId.trim();
    const rawPass = loginPassword.trim();
    if (!rawId || !rawPass) {
      setLoginError('Enter your registered Mobile / Partner ID and Passkey.');
      return;
    }

    const cleanLower = rawId.toLowerCase();
    const cleanNoPrefix = cleanLower.replace(/^usr-/, '').replace(/^vnd-/, '');
    const cleanDigits = rawId.replace(/\D/g, '').slice(-10);

    if (portalMode === 'vendor' || cleanLower.startsWith('vnd-')) {
      const matchedVendor = vendors.find(v => {
        const vid = String(v.vendorId || v.id || '').toLowerCase();
        const vDigits = String(v.phone || '').replace(/\D/g, '').slice(-10);
        return (
          vid === cleanLower ||
          vid.replace(/^vnd-/, '') === cleanNoPrefix ||
          (cleanDigits.length === 10 && vDigits === cleanDigits)
        );
      });

      if (!matchedVendor) {
        setLoginError('Vendor not found. Add a Vendor in Vendor Directory first.');
        return;
      }
      if (matchedVendor.status === 'INACTIVE') {
        setLoginError('This vendor account is currently disabled.');
        return;
      }
      const validKeys = [matchedVendor.passkey, matchedVendor.tempPassword, matchedVendor.password].filter(Boolean);
      if (validKeys.length > 0 && !validKeys.some(k => String(k).trim() === rawPass)) {
        setLoginError('Invalid vendor passkey.');
        return;
      }

      setActivePartner({ ...matchedVendor, name: matchedVendor.companyName, role: 'Vendor' });
      setActiveTab('home');
      showToast(`Signed in as Vendor: ${matchedVendor.companyName}`);
      return;
    }

    const matchedUser = users.find(u => {
      const uid = String(u.id || '').toLowerCase();
      const uDigits = String(u.mobile || u.phone || '').replace(/\D/g, '').slice(-10);
      const uEmail = String(u.email || '').toLowerCase();
      return (
        uid === cleanLower ||
        `usr-${uid.replace(/^usr-/, '')}` === cleanLower ||
        uid.replace(/^usr-/, '') === cleanNoPrefix ||
        (cleanDigits.length === 10 && uDigits === cleanDigits) ||
        (uEmail && uEmail === cleanLower)
      );
    });

    if (!matchedUser) {
      setLoginError('User not found. Register a Contractor/Dealer in User Management first.');
      return;
    }
    if (matchedUser.active === false || matchedUser.isActive === false) {
      setLoginError(`Account ${matchedUser.name} is deactivated by Admin.`);
      return;
    }
    const validUserKeys = [matchedUser.passkey, matchedUser.tempPassword, matchedUser.password].filter(Boolean);
    if (validUserKeys.length > 0 && !validUserKeys.some(k => String(k).trim() === rawPass)) {
      setLoginError('Incorrect passkey. Check User Management for assigned passkey.');
      return;
    }

    setActivePartner(matchedUser);
    setActiveTab('home');
    showToast(`Signed in as ${matchedUser.name}`);
  };

  const handlePartnerLogout = () => {
    setActivePartner(null);
    setActiveTab('signin');
    setLoginPassword('');
    setScanResultMsg(null);
    showToast('Signed out of Mobile Field App.');
  };

  const getNextAvailableSerial = () => {
    const claimedSet = new Set(
      claims.map(c => String(c.serialKey || c.qrSerial || c.batchCode || '').trim().toUpperCase())
    );
    for (const b of batches) {
      const tokens = b.tokens || b.codes || [];
      for (const t of tokens) {
        const key = String(t.serialKey || t.serial || '').trim().toUpperCase();
        if (key && !t.isScanned && !claimedSet.has(key)) {
          return key;
        }
      }
    }
    return '';
  };

  const handleSubmitQR = async (serialToScan) => {
    if (!livePartner) {
      showToast('Please sign in with a registered partner account first.');
      setActiveTab('signin');
      return;
    }

    const key = (serialToScan || manualSerial || '').trim();
    if (!key) {
      setScanResultMsg({ type: 'error', text: 'Enter or scan a valid QR serial from a generated batch.' });
      return;
    }

    setIsScanning(true);
    setScanResultMsg(null);
    try {
      const res = await submitScannedCode({
        serialKey: key,
        user: livePartner,
        proofImage
      });
      setIsScanning(false);

      if (!res?.success) {
        setScanResultMsg({ type: 'error', text: res?.message || 'QR validation failed.' });
        return;
      }

      try {
        confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
      } catch (_) { }

      setManualSerial('');
      setProofImage(null);
      setProofName('');
      setScanResultMsg({
        type: 'success',
        text: `Verified! Claim ${res.claim?.requestId} (₹${res.claim?.amount || 0}) sent to Admin Cashback Pending List & Supabase.`
      });
      showToast(`Claim ${res.claim?.requestId} created!`);
    } catch (err) {
      setIsScanning(false);
      setScanResultMsg({ type: 'error', text: 'Failed to submit QR scan.' });
    }
  };

  const handleQuickScanFromBatch = () => {
    const nextSerial = getNextAvailableSerial();
    if (!nextSerial) {
      setScanResultMsg({
        type: 'error',
        text: batches.length === 0
          ? 'No QR batches exist yet! Generate a QR Batch in Admin Panel first.'
          : 'All QR codes in existing batches have already been scanned!'
      });
      return;
    }
    setManualSerial(nextSerial);
    handleSubmitQR(nextSerial);
  };

  const handleProofUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setProofName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => setProofImage(ev.target?.result || null);
    reader.readAsDataURL(file);
  };

  const handleCopy = (val) => {
    if (!val) return;
    navigator.clipboard.writeText(val);
    setCopiedKey(true);
    showToast(`Copied: ${val}`);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const totalSerialized = batches.reduce(
    (s, b) => s + Number(b.batchSize || b.totalTokens || b.tokens?.length || 0),
    0
  );

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-stone-900 font-sans select-none">
      {toastMsg && (
        <div className="fixed top-16 z-50 left-1/2 -translate-x-1/2 bg-[#A62C11] text-white px-4 py-2.5 rounded-xl shadow-2xl border border-[#F9CEB8]/40 flex items-center space-x-2 text-xs font-semibold">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Top Laptop Simulator Control Strip */}
      <div className="w-full bg-[#A62C11] px-4 py-2 border-b border-[#8B230C] flex flex-wrap items-center justify-between gap-2 text-xs shrink-0 z-10 shadow-sm">
        <div className="flex items-center space-x-2.5">
          <div className="w-7 h-7 rounded-lg bg-white text-[#A62C11] flex items-center justify-center font-black text-xs shadow-xs">
            DG
          </div>
          <div className="flex items-center space-x-2">
            <span className="font-extrabold text-white text-xs">Mobile Field App (Live Sync)</span>
            <span className="text-[9px] bg-white/15 text-white border border-white/25 font-bold px-1.5 py-0.2 rounded font-mono">
              {dbStatus?.connected ? 'SUPABASE LIVE' : 'SYNCED'}
            </span>
          </div>
        </div>

        {/* Screen Quick Jumper Pills */}
        <div className="flex items-center gap-1 bg-black/25 p-1 rounded-xl border border-white/15 overflow-x-auto text-[11px]">
          <button
            onClick={() => setActiveTab('signin')}
            className={`px-2.5 py-1 rounded-lg font-bold transition flex items-center gap-1 cursor-pointer ${activeTab === 'signin' ? 'bg-white text-[#A62C11]' : 'text-white/85 hover:text-white hover:bg-white/10'
              }`}
          >
            <LogIn className="w-3 h-3" />
            <span>Sign In</span>
          </button>
          <button
            onClick={() => livePartner ? setActiveTab('home') : showToast('Sign in first to view Partner Dashboard.')}
            className={`px-2.5 py-1 rounded-lg font-bold transition flex items-center gap-1 cursor-pointer ${activeTab === 'home' ? 'bg-white text-[#A62C11]' : 'text-white/85 hover:text-white hover:bg-white/10'
              }`}
          >
            <Home className="w-3 h-3" />
            <span>Dashboard</span>
          </button>
          {livePartner?.role !== 'Vendor' && (
            <button
              onClick={() => livePartner ? setActiveTab('scan') : showToast('Sign in first to scan QR codes.')}
              className={`px-2.5 py-1 rounded-lg font-bold transition flex items-center gap-1 cursor-pointer ${activeTab === 'scan' ? 'bg-white text-[#A62C11]' : 'text-white/85 hover:text-white hover:bg-white/10'
                }`}
            >
              <QrCode className="w-3 h-3" />
              <span>QR Scanner</span>
            </button>
          )}
          <button
            onClick={() => livePartner ? setActiveTab('claims') : showToast('Sign in first to view Cashback Claims.')}
            className={`px-2.5 py-1 rounded-lg font-bold transition flex items-center gap-1 cursor-pointer ${activeTab === 'claims' ? 'bg-white text-[#A62C11]' : 'text-white/85 hover:text-white hover:bg-white/10'
              }`}
          >
            <Wallet className="w-3 h-3" />
            <span>Cashback ({partnerClaims.length})</span>
          </button>
          <button
            onClick={() => livePartner ? setActiveTab('profile') : showToast('Sign in first to view Account Profile.')}
            className={`px-2.5 py-1 rounded-lg font-bold transition flex items-center gap-1 cursor-pointer ${activeTab === 'profile' ? 'bg-white text-[#A62C11]' : 'text-white/85 hover:text-white hover:bg-white/10'
              }`}
          >
            <User className="w-3 h-3" />
            <span>Account</span>
          </button>
        </div>

        {/* View Mode & Exit Actions */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setViewFormat(viewFormat === 'phone' ? 'fullscreen' : 'phone')}
            className="px-2.5 py-1 bg-white/15 hover:bg-white/25 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
          >
            {viewFormat === 'phone' ? <Maximize2 className="w-3.5 h-3.5" /> : <Smartphone className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{viewFormat === 'phone' ? 'Full View' : 'Phone Frame'}</span>
          </button>

          <a
            href="http://localhost:3001"
            target="_blank"
            rel="noreferrer"
            className="px-2.5 py-1 bg-white text-[#A62C11] hover:bg-[#FEF2EE] rounded-lg text-xs font-bold flex items-center space-x-1 transition"
          >
            <ExternalLink className="w-3 h-3" />
            <span className="hidden md:inline">Standalone (:3001)</span>
          </a>

          <button
            onClick={onSwitchToDesktop}
            className="px-3 py-1 bg-stone-950 hover:bg-stone-800 text-white rounded-lg text-xs font-bold shadow-xs flex items-center space-x-1.5 transition cursor-pointer"
          >
            <Laptop className="w-3.5 h-3.5" />
            <span>Desktop ERP</span>
          </button>
        </div>
      </div>

      {/* Laptop-Fitted Smartphone Viewport */}
      <div className="flex-1 overflow-y-auto flex items-start justify-center p-3 sm:p-5">
        <div
          className={`bg-[#FAF9F6] text-stone-800 shadow-2xl border border-stone-700/40 flex flex-col overflow-hidden transition-all ${viewFormat === 'phone'
            ? 'w-full max-w-[410px] h-[min(740px,calc(100vh-140px))] rounded-2xl sm:rounded-[32px]'
            : 'w-full max-w-3xl h-[min(740px,calc(100vh-140px))] rounded-2xl'
            }`}
        >
          {/* Phone Header when signed in (Sticky pinned at top) */}
          {livePartner && activeTab !== 'signin' && (
            <div className="bg-[#A62C11] px-4 py-2.5 text-white flex items-center justify-between text-xs shrink-0 sticky top-0 z-30 shadow-xs">
              <div className="flex items-center gap-2">
                <img
                  src="/logo-white.png"
                  alt="DuraGrit Vitrified"
                  className="h-5 w-auto object-contain"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
                <div>
                  <span className="font-bold text-white block leading-tight text-[11px]">{livePartner.name}</span>
                  <span className="text-[9.5px] text-white/80 font-mono">
                    {livePartner.role || 'Contractor'} • {livePartner.mobile || livePartner.vendorId || livePartner.id}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => refreshAllData && refreshAllData()}
                  className="p-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-white cursor-pointer"
                  title="Sync Data"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={handlePartnerLogout}
                  className="px-2 py-1 rounded-lg bg-white/15 hover:bg-white/25 text-white text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                >
                  <LogOut className="w-3 h-3" />
                  <span>Out</span>
                </button>
              </div>
            </div>
          )}

          {/* Screen Body */}
          <div className="flex-1 min-h-0 p-4 space-y-4 overflow-y-auto">
            {/* 1. SIGN IN SCREEN */}
            {activeTab === 'signin' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <img
                      src="/logo.png"
                      alt="DuraGrit Vitrified"
                      className="h-9 w-auto object-contain"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-1.5 bg-stone-200/70 p-1 rounded-xl text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => { setPortalMode('contractor'); setLoginError(''); }}
                    className={`py-2 rounded-lg cursor-pointer ${portalMode === 'contractor' ? 'bg-[#C84826] text-white' : 'text-stone-600'
                      }`}
                  >
                    Contractor ({users.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => { setPortalMode('vendor'); setLoginError(''); }}
                    className={`py-2 rounded-lg cursor-pointer ${portalMode === 'vendor' ? 'bg-[#C84826] text-white' : 'text-stone-600'
                      }`}
                  >
                    Vendor ({vendors.length})
                  </button>
                </div>

                <div className="bg-white rounded-3xl p-5 border border-stone-200 shadow-xs space-y-3.5 relative overflow-hidden">
                  <div className="absolute top-0 inset-x-0 h-1 bg-[#C84826]"></div>
                  <h2 className="text-xl font-black text-stone-900 font-serif">
                    {portalMode === 'vendor' ? 'Vendor Sign In' : 'Contractor Sign In'}
                  </h2>

                  <form onSubmit={handlePartnerLogin} className="space-y-3 text-xs">
                    <div>
                      <label className="block font-bold text-stone-700 mb-1">
                        {portalMode === 'vendor' ? 'Vendor ID or Mobile *' : 'Mobile Number or User ID *'}
                      </label>
                      <input
                        type="text"
                        value={loginId}
                        onChange={(e) => setLoginId(e.target.value)}
                        placeholder={portalMode === 'vendor' ? 'e.g. VND-101' : 'e.g. 98XXXXXXXX'}
                        className="w-full px-3 py-2.5 rounded-xl border border-stone-200 font-mono text-stone-900 focus:outline-none focus:border-[#C84826]"
                        required
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-stone-700 mb-1">Passkey *</label>
                      <div className="relative flex items-center">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          placeholder="Enter assigned passkey"
                          className="w-full px-3 pr-14 py-2.5 rounded-xl border border-stone-200 font-mono text-stone-900 focus:outline-none focus:border-[#C84826]"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 text-[11px] font-bold text-stone-500 cursor-pointer"
                        >
                          {showPassword ? 'Hide' : 'Show'}
                        </button>
                      </div>
                    </div>

                    {loginError && (
                      <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-1.5">
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>{loginError}</span>
                      </div>
                    )}

                    <button
                      type="submit"
                      className="w-full py-3 bg-[#C84826] hover:bg-[#A62C11] text-white font-bold rounded-xl shadow-sm transition cursor-pointer"
                    >
                      Sign In →
                    </button>
                  </form>
                </div>

                {/* Live Telemetry */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="bg-white rounded-2xl p-3 border border-stone-200">
                    <span className="text-[9.5px] font-bold text-stone-400 uppercase block">SERIALIZED PCS</span>
                    <span className="text-sm font-black font-mono text-stone-900">{totalSerialized.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="bg-white rounded-2xl p-3 border border-stone-200">
                    <span className="text-[9.5px] font-bold text-stone-400 uppercase block">QR BATCHES</span>
                    <span className="text-sm font-black font-mono text-stone-900">{batches.length}</span>
                  </div>
                </div>

                {/* Synced Partner Quick Chips */}
                <div className="bg-white rounded-2xl p-3.5 border border-stone-200 text-xs space-y-2">
                  <div className="text-[10px] font-bold uppercase text-stone-500">
                    Synced Accounts ({portalMode === 'vendor' ? vendors.length : users.length})
                  </div>
                  {portalMode === 'vendor' ? (
                    vendors.length === 0 ? (
                      <p className="text-[11px] text-stone-400">No vendors yet. Add one in Desktop ERP → Vendor Directory.</p>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {vendors.map(v => (
                          <button
                            key={v.id || v.vendorId}
                            type="button"
                            onClick={() => {
                              setLoginId(v.vendorId || v.phone || v.id);
                              setLoginPassword(v.passkey || v.tempPassword || v.password || '');
                            }}
                            className="px-2.5 py-1 rounded-lg bg-[#FEF2EE] text-[#A62C11] border border-[#F9CEB8] text-[10.5px] font-bold cursor-pointer"
                          >
                            {v.companyName}
                          </button>
                        ))}
                      </div>
                    )
                  ) : users.length === 0 ? (
                    <p className="text-[11px] text-stone-400">No partners yet. Register a user in Desktop ERP → User Management.</p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {users.map(u => (
                        <button
                          key={u.id}
                          type="button"
                          onClick={() => {
                            setLoginId(String(u.mobile || '').replace(/\D/g, '').slice(-10) || String(u.id));
                            setLoginPassword(u.passkey || u.tempPassword || u.password || '');
                          }}
                          className="px-2.5 py-1 rounded-lg bg-[#FEF2EE] text-[#A62C11] border border-[#F9CEB8] text-[10.5px] font-bold cursor-pointer"
                        >
                          {u.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 2. DASHBOARD SCREEN */}
            {activeTab === 'home' && livePartner && (
              livePartner.role === 'Vendor' ? (
                <div className="space-y-3.5">
                  <div className="bg-white rounded-2xl p-4 border border-stone-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black uppercase text-stone-800">Vendor PO &amp; Escrow</span>
                      <span className="text-[10px] font-bold text-[#C84826] bg-[#FEF2EE] px-2 py-0.5 rounded border border-[#F9CEB8]">
                        {livePartner.vendorId || livePartner.id}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center font-mono">
                      <div className="p-2.5 bg-stone-50 rounded-xl border border-stone-200">
                        <span className="text-[9px] text-stone-400 block uppercase font-sans font-bold">Total PO</span>
                        <span className="font-black text-sm text-stone-900">₹{Number(livePartner.totalPayoutLakhs || 0).toFixed(1)}L</span>
                      </div>
                      <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-200">
                        <span className="text-[9px] text-emerald-700 block uppercase font-sans font-bold">Released</span>
                        <span className="font-black text-sm text-emerald-700">₹{Number(livePartner.releasedPayoutLakhs || 0).toFixed(1)}L</span>
                      </div>
                      <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200">
                        <span className="text-[9px] text-amber-800 block uppercase font-sans font-bold">Pending</span>
                        <span className="font-black text-sm text-amber-800">
                          ₹{Math.max(0, Number(livePartner.totalPayoutLakhs || 0) - Number(livePartner.releasedPayoutLakhs || 0)).toFixed(1)}L
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3.5">
                  <div className="bg-white rounded-2xl p-4 border border-stone-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-extrabold uppercase text-stone-700">TOTAL DISBURSED WALLET</span>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        Active
                      </span>
                    </div>
                    <div>
                      <div className="text-3xl font-black text-stone-900 font-serif">
                        ₹{disbursedSum.toLocaleString('en-IN')}
                      </div>
                      <div className="text-xs font-bold text-[#C84826] mt-0.5">
                        {Math.round(disbursedSum * 4).toLocaleString('en-IN')} Points (1 Pt = ₹0.25)
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-stone-100 text-center font-mono text-xs">
                      <div className="bg-stone-50 p-2 rounded-xl border border-stone-200">
                        <span className="text-[9.5px] font-sans text-stone-500 block">Pending/Appr</span>
                        <span className="font-bold text-amber-700">₹{pendingSum.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="bg-stone-50 p-2 rounded-xl border border-stone-200">
                        <span className="text-[9.5px] font-sans text-stone-500 block">Disbursed</span>
                        <span className="font-bold text-emerald-700">₹{disbursedSum.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="bg-stone-50 p-2 rounded-xl border border-stone-200">
                        <span className="text-[9.5px] font-sans text-stone-500 block">Scans</span>
                        <span className="font-bold text-stone-900">{partnerClaims.length}</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      onClick={() => setActiveTab('scan')}
                      className="py-3 bg-[#C84826] hover:bg-[#A62C11] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <QrCode className="w-4 h-4" />
                      <span>Scan QR &amp; Claim</span>
                    </button>
                    <button
                      onClick={() => setActiveTab('claims')}
                      className="py-3 bg-white border border-stone-300 text-stone-800 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <FileText className="w-4 h-4 text-[#C84826]" />
                      <span>My Requests ({partnerClaims.length})</span>
                    </button>
                  </div>

                  <div className="bg-white rounded-2xl p-4 border border-stone-200 space-y-2 text-xs">
                    <div className="font-bold text-stone-900 pb-1 border-b border-stone-100">Recent QR Scans</div>
                    {partnerClaims.length === 0 ? (
                      <p className="text-stone-400 text-center py-4">No QR scans yet.</p>
                    ) : (
                      partnerClaims.slice(0, 4).map(c => (
                        <div key={c.id} className="py-2 flex items-center justify-between border-b border-stone-100 last:border-0">
                          <div>
                            <div className="font-mono font-bold text-stone-900">{c.qrSerial || c.serialKey}</div>
                            <div className="text-[10.5px] text-stone-500">{c.productName}</div>
                          </div>
                          <span className="font-mono font-bold text-[#C84826]">
                            {c.status} (₹{c.amount})
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )
            )}

            {/* 3. QR SCANNER SCREEN */}
            {activeTab === 'scan' && livePartner && (
              <div className="space-y-3.5">
                <div className="bg-[#141414] rounded-3xl p-4 text-white space-y-4">
                  <div className="flex items-center justify-between text-[10px] font-mono">
                    <span className="text-emerald-400">● OPTIC SCANNER READY</span>
                    <span>{batches.length} BATCHES ACTIVE</span>
                  </div>

                  <div className="h-40 border-2 border-dashed border-[#C84826]/40 rounded-2xl flex items-center justify-center relative">
                    <div className="w-32 h-32 border-2 border-[#C84826] rounded-xl flex items-center justify-center">
                      <QrCode className="w-10 h-10 text-[#C84826]" />
                    </div>
                  </div>

                  <button
                    onClick={handleQuickScanFromBatch}
                    disabled={isScanning}
                    className="w-full py-2.5 bg-white text-stone-900 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <QrCode className="w-4 h-4 text-[#C84826]" />
                    <span>{isScanning ? 'Validating...' : 'Tap to Scan Next Available Batch QR'}</span>
                  </button>
                </div>

                {scanResultMsg && (
                  <div className={`p-3 rounded-xl text-xs font-semibold border ${scanResultMsg.type === 'success'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : 'bg-rose-50 border-rose-200 text-rose-900'
                    }`}>
                    {scanResultMsg.text}
                  </div>
                )}

                <div className="bg-white rounded-2xl p-4 border border-stone-200 space-y-3 text-xs">
                  <div className="font-bold text-stone-900">Manual Serial &amp; Site Proof</div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={manualSerial}
                      onChange={(e) => setManualSerial(e.target.value)}
                      placeholder="Paste batch serial key..."
                      className="flex-1 px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl font-mono text-xs focus:outline-none focus:border-[#C84826]"
                    />
                    <button
                      type="button"
                      onClick={() => handleSubmitQR(manualSerial)}
                      disabled={isScanning}
                      className="px-4 py-2 bg-[#C84826] hover:bg-[#A62C11] text-white font-bold rounded-xl cursor-pointer"
                    >
                      Claim
                    </button>
                  </div>

                  <label className="w-full py-2 px-3 border border-dashed border-stone-300 rounded-xl text-[11px] font-bold text-stone-600 flex items-center justify-center gap-1.5 cursor-pointer hover:border-[#C84826]">
                    <UploadCloud className="w-3.5 h-3.5 text-[#C84826]" />
                    <span>{proofName ? `Attached: ${proofName}` : 'Attach Site / Bag Photo (Optional)'}</span>
                    <input type="file" accept="image/*" onChange={handleProofUpload} className="hidden" />
                  </label>
                </div>
              </div>
            )}

            {/* 4. CASHBACK CLAIMS SCREEN */}
            {activeTab === 'claims' && livePartner && (
              <div className="space-y-3">
                <div className="flex items-center gap-1.5 overflow-x-auto text-[11px] font-bold">
                  {[
                    { id: 'all', label: `All (${partnerClaims.length})` },
                    { id: 'pending', label: `Pending (${partnerClaims.filter(c => getBucket(c) === 'pending').length})` },
                    { id: 'inprocess', label: `Approved (${partnerClaims.filter(c => getBucket(c) === 'inprocess').length})` },
                    { id: 'completed', label: `Disbursed (${partnerClaims.filter(c => getBucket(c) === 'completed').length})` }
                  ].map(t => (
                    <button
                      key={t.id}
                      onClick={() => setClaimsFilter(t.id)}
                      className={`px-3 py-1.5 rounded-full whitespace-nowrap cursor-pointer ${claimsFilter === t.id ? 'bg-[#C84826] text-white' : 'bg-white border border-stone-200 text-stone-600'
                        }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>

                {partnerClaims.filter(c => claimsFilter === 'all' || getBucket(c) === claimsFilter).length === 0 ? (
                  <div className="bg-white rounded-2xl p-8 border border-stone-200 text-center text-xs text-stone-400">
                    No claims found in this status tab.
                  </div>
                ) : (
                  partnerClaims
                    .filter(c => claimsFilter === 'all' || getBucket(c) === claimsFilter)
                    .map(c => {
                      const b = getBucket(c);
                      const utr = c.transactionId || c.npciRrn || '';
                      return (
                        <div key={c.id} className="bg-white rounded-2xl p-3.5 border border-stone-200 space-y-2 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-mono font-bold text-stone-900">{c.requestId || c.id}</span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${b === 'completed'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : b === 'inprocess'
                                ? 'bg-blue-50 text-blue-800 border-blue-200'
                                : 'bg-amber-50 text-amber-800 border-amber-200'
                              }`}>
                              {b === 'completed' ? 'Disbursed' : b === 'inprocess' ? 'Approved (Awaiting Release)' : c.status}
                            </span>
                          </div>
                          <div className="font-mono text-[11px] text-stone-600">
                            {c.productName} • {c.qrSerial || c.serialKey}
                          </div>
                          <div className="flex items-center justify-between pt-1 border-t border-stone-100">
                            <span className="text-base font-black text-stone-900">
                              ₹{Number(c.disbursedAmount || c.amount || 0).toLocaleString('en-IN')}
                            </span>
                            {utr && <span className="font-mono text-[10.5px] text-emerald-700 font-bold">UTR: {utr}</span>}
                          </div>
                          {(c.paymentProofUrl || c.paymentScreenshot) && (
                            <button
                              type="button"
                              onClick={() => setReceiptModal({ url: c.paymentProofUrl || c.paymentScreenshot, utr, remarks: c.remarks })}
                              className="text-[11px] font-bold text-[#C84826] hover:underline flex items-center gap-1 cursor-pointer"
                            >
                              <Paperclip className="w-3 h-3" />
                              <span>View Disbursal Receipt</span>
                            </button>
                          )}
                        </div>
                      );
                    })
                )}
              </div>
            )}

            {/* 5. PROFILE / DOSSIER SCREEN */}
            {activeTab === 'profile' && livePartner && (
              <div className="bg-white rounded-2xl p-4 border border-stone-200 space-y-3 text-xs">
                <div className="flex items-center gap-3 pb-3 border-b border-stone-100">
                  <div className="w-10 h-10 rounded-xl bg-[#C84826] text-white font-black flex items-center justify-center">
                    {(livePartner.name || 'DG').slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-black text-sm text-stone-900">{livePartner.name}</div>
                    <div className="text-[11px] text-stone-500">{livePartner.role || 'Contractor'} • {livePartner.location || 'India'}</div>
                  </div>
                </div>
                <div className="space-y-2 font-mono text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-stone-400 font-sans">Mobile / ID:</span>
                    <span className="font-bold text-stone-900">{livePartner.mobile || livePartner.vendorId || livePartner.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-400 font-sans">UPI / VPA:</span>
                    <span className="font-bold text-stone-900">{livePartner.upiId || livePartner.vpa || 'Not Linked'}</span>
                  </div>
                  <div className="flex justify-between items-center bg-[#FEF2EE] p-2.5 rounded-xl border border-[#F9CEB8]">
                    <span className="text-[#A62C11] font-sans font-bold">Passkey:</span>
                    <button
                      onClick={() => handleCopy(livePartner.passkey || livePartner.tempPassword || '')}
                      className="flex items-center gap-1 font-bold text-[#C84826] cursor-pointer"
                    >
                      <span>{livePartner.passkey || livePartner.tempPassword || 'Active'}</span>
                      {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Phone Bottom Tab Bar (Pinned at bottom, never hides) */}
          {livePartner && activeTab !== 'signin' && (
            <div className="bg-white border-t border-stone-200 px-3 py-2 flex items-center justify-around text-[10px] font-bold shrink-0 sticky bottom-0 z-30 shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
              <button
                onClick={() => setActiveTab('home')}
                className={`flex flex-col items-center gap-0.5 cursor-pointer ${activeTab === 'home' ? 'text-[#C84826]' : 'text-stone-500'}`}
              >
                <Home className="w-4 h-4" />
                <span>Overview</span>
              </button>
              {livePartner.role !== 'Vendor' && (
                <button
                  onClick={() => setActiveTab('scan')}
                  className={`flex flex-col items-center gap-0.5 cursor-pointer ${activeTab === 'scan' ? 'text-[#C84826]' : 'text-stone-500'}`}
                >
                  <QrCode className="w-4 h-4" />
                  <span>Scan QR</span>
                </button>
              )}
              <button
                onClick={() => setActiveTab('claims')}
                className={`flex flex-col items-center gap-0.5 cursor-pointer ${activeTab === 'claims' ? 'text-[#C84826]' : 'text-stone-500'}`}
              >
                <Wallet className="w-4 h-4" />
                <span>Registry</span>
              </button>
              <button
                onClick={() => setActiveTab('profile')}
                className={`flex flex-col items-center gap-0.5 cursor-pointer ${activeTab === 'profile' ? 'text-[#C84826]' : 'text-stone-500'}`}
              >
                <User className="w-4 h-4" />
                <span>Account</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Receipt Preview Modal */}
      {receiptModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full overflow-hidden shadow-2xl">
            <div className="bg-[#A62C11] px-4 py-3 text-white flex items-center justify-between text-xs font-bold">
              <span>Disbursal Payment Receipt</span>
              <button onClick={() => setReceiptModal(null)} className="cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-4 space-y-2 text-xs">
              <img src={receiptModal.url} alt="Payment proof" className="w-full max-h-64 object-contain rounded-xl border border-stone-200" />
              {receiptModal.utr && <div className="font-mono"><strong>UTR:</strong> {receiptModal.utr}</div>}
              {receiptModal.remarks && <div><strong>Remarks:</strong> {receiptModal.remarks}</div>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

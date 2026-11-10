import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import {
  checkClientUpdateStatus,
  applyClientAppUpdate,
  isVersionHigher
} from '../services/appInstallService';
import {
  Key,
  Copy,
  Check,
  Download,
  Phone,
  CheckCircle,
  Lock,
  ArrowLeft,
  Rocket,
  Building2,
  Mail,
  ShieldCheck
} from 'lucide-react';

export function Step13_WelcomeDossier({ onBack }) {
  const { currentUser } = useAuth();
  const { users = [], vendors = [] } = useData();
  const [copiedKey, setCopiedKey] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [updateStatus, setUpdateStatus] = useState(() => checkClientUpdateStatus());
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    const handleSync = () => setUpdateStatus(checkClientUpdateStatus());
    window.addEventListener('storage', handleSync);
    window.addEventListener('duragrit:ota-release-pushed', handleSync);
    window.addEventListener('duragrit:ota-update-applied', handleSync);
    return () => {
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('duragrit:ota-release-pushed', handleSync);
      window.removeEventListener('duragrit:ota-update-applied', handleSync);
    };
  }, []);

  const handleApplyUpdate = () => {
    setIsUpdating(true);
    showToast(`Downloading & applying OTA update ${updateStatus.latestVersion}...`);
    setTimeout(() => {
      const res = applyClientAppUpdate(updateStatus.latestVersion);
      setUpdateStatus(checkClientUpdateStatus());
      setIsUpdating(false);
      showToast(`✓ Updated to ${res.version}! All new features are active.`);
    }, 1200);
  };

  const myDigits = String(currentUser?.mobile || currentUser?.phone || '').replace(/\D/g, '').slice(-10);
  const myId = String(currentUser?.vendorId || currentUser?.id || currentUser?.userId || '').toLowerCase();
  const myEmail = String(currentUser?.email || '').toLowerCase().trim();
  const myName = String(currentUser?.companyName || currentUser?.name || '').toLowerCase().trim();

  const livePartner = vendors.find((v) => {
    const vDigits = String(v.phone || v.mobile || '').replace(/\D/g, '').slice(-10);
    const vId = String(v.vendorId || v.id || '').toLowerCase();
    const vEmail = String(v.email || '').toLowerCase().trim();
    const vName = String(v.companyName || v.name || '').toLowerCase().trim();
    const vContact = String(v.contactPerson || '').toLowerCase().trim();
    return (
      (vId && myId && (vId === myId || myId.includes(vId) || vId.includes(myId))) ||
      (myDigits.length === 10 && vDigits === myDigits) ||
      (myEmail && vEmail === myEmail) ||
      (myName && vName && (myName === vName || myName.includes(vName) || vName.includes(myName))) ||
      (myName && vContact && (myName === vContact || myName.includes(vContact) || vContact.includes(myName)))
    );
  }) || (vendors.length > 0 ? (myDigits === '8826021114' ? vendors.find(v => String(v.phone || v.mobile || '').includes('8826021114')) : null) || vendors[0] : null);

  const vendorCompanyName =
    currentUser?.companyName ||
    currentUser?.name ||
    livePartner?.companyName ||
    livePartner?.name ||
    (myDigits === '8826021114' ? 'DuraGrit Authorized Partner' : 'Verified Vendor Partner');

  const vendorId =
    currentUser?.vendorId ||
    currentUser?.id ||
    livePartner?.vendorId ||
    livePartner?.id ||
    (myDigits === '8826021114' ? 'VND-101' : 'VND-101');

  const contactPerson =
    livePartner?.contactPerson ||
    currentUser?.contactPerson ||
    currentUser?.name ||
    vendorCompanyName;

  const partnerMobile =
    livePartner?.phone ||
    livePartner?.mobile ||
    currentUser?.mobile ||
    currentUser?.phone ||
    (myDigits || '8826021114');

  const vendorCategory =
    livePartner?.category ||
    currentUser?.category ||
    currentUser?.role ||
    'Vendor Partner';

  const partnerPasskey =
    livePartner?.passkey ||
    livePartner?.tempPassword ||
    livePartner?.password ||
    currentUser?.passkey ||
    currentUser?.tempPassword ||
    (myDigits === '8826021114' ? 'Dura#4905' : '1234');

  const partnerUpi =
    livePartner?.upi ||
    livePartner?.upiId ||
    currentUser?.upi ||
    'duragrit07@okaxis';

  const partnerEmail =
    livePartner?.email ||
    currentUser?.email ||
    (myDigits === '8826021114' ? 'duragrit07@gmail.com' : 'partner@duragrit.com');

  const partnerBankName =
    livePartner?.bankName ||
    currentUser?.bankName ||
    'Direct UPI / IMPS';

  const partnerAccountNumber =
    livePartner?.accountNumber ||
    currentUser?.accountNumber;

  const avatarSrc =
    livePartner?.avatarUrl ||
    livePartner?.profileImage ||
    currentUser?.avatarUrl ||
    currentUser?.profileImage;

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  };

  const handleCopyKey = () => {
    navigator.clipboard.writeText(partnerPasskey);
    setCopiedKey(true);
    showToast('Security key copied to clipboard!');
    setTimeout(() => setCopiedKey(false), 2500);
  };

  const handleCopyText = (text, label) => {
    if (!text) return;
    navigator.clipboard.writeText(String(text));
    showToast(`${label} copied to clipboard!`);
  };

  return (
    <div className="flex-1 flex flex-col bg-[#FAF9F6] text-stone-800 p-3.5 pb-4 relative font-sans">
      {toastMsg && (
        <div className="fixed top-4 inset-x-4 z-50 bg-[#A62C11] text-white px-4 py-2.5 rounded-xl shadow-2xl border border-[#F9CEB8]/40 flex items-center space-x-2 text-xs font-semibold">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Top Mobile Bar */}
      <div className="flex items-center justify-between pb-3 text-xs">
        {onBack ? (
          <button
            onClick={onBack}
            className="px-2.5 py-1.5 rounded-xl bg-white border border-stone-200 text-stone-700 hover:text-[#C84826] flex items-center space-x-1 text-xs font-bold cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
        ) : (
          <span className="text-[10px] text-stone-500 font-mono">DuraGrit Account Dossier</span>
        )}
        <span className="bg-[#FEF2EE] text-[#C84826] text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-[#F9CEB8]">
          Partner Account
        </span>
      </div>

      {/* Main Partner Card Container */}
      <div className="w-full bg-white rounded-3xl shadow-sm border border-stone-200 overflow-hidden text-xs">
        <div className="h-2 w-full bg-gradient-to-r from-[#A62C11] via-[#C84826] to-[#F9CEB8]"></div>

        {/* Header Banner */}
        <div className="px-5 py-5 bg-[#A62C11] text-white space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-11 h-11 rounded-xl bg-[#C84826] border border-white/25 flex items-center justify-center shadow-sm overflow-hidden shrink-0">
                {avatarSrc ? (
                  <img
                    src={avatarSrc}
                    alt={vendorCompanyName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-white font-black text-base tracking-tighter">DG</span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <span className="font-black text-xs sm:text-sm tracking-wider text-white block uppercase truncate">DURAGRIT VITRIFIED</span>
                <p className="text-[10px] text-white/80 font-medium truncate">Partner &amp; Vendor Portal</p>
              </div>
            </div>
            <span className="text-[10px] bg-white/15 border border-white/25 text-white font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1 shrink-0">
              <CheckCircle className="w-3 h-3 text-emerald-300" />
              <span>Active</span>
            </span>
          </div>

          <div className="pt-1 border-t border-white/15">
            <span className="text-[10px] uppercase font-bold tracking-wider text-amber-200 block">
              Verified Vendor Account
            </span>
            <h3 className="text-lg sm:text-xl font-black tracking-tight text-white mt-0.5 leading-snug">
              {vendorCompanyName}
            </h3>
            <div className="inline-flex items-center gap-1.5 bg-black/30 border border-white/20 px-2.5 py-0.5 rounded-lg text-white font-mono font-black text-xs mt-2">
              <span className="text-amber-300 text-[10px] font-sans font-bold uppercase">Vendor ID:</span>
              <span className="tracking-wider">{vendorId}</span>
            </div>
          </div>
        </div>

        {/* Credentials & Dossier Body */}
        <div className="p-4 bg-[#FAF9F6] space-y-4">
          {/* Colorful yet simple professional border on Vendor Account & Credentials section */}
          <div className="bg-white rounded-2xl border-2 border-[#C84826]/70 border-l-4 border-l-[#C84826] shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-orange-50 via-amber-50/70 to-rose-50/40 px-4 py-2.5 border-b border-orange-200/70 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-[#FEF2EE] text-[#C84826] border border-[#F9CEB8] flex items-center justify-center font-bold">
                  <Key className="w-3.5 h-3.5" />
                </div>
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-stone-900">Vendor Account &amp; Credentials</h4>
              </div>
              <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Verified
              </span>
            </div>

            <div className="p-3.5 space-y-2.5">
              {/* Primary Vendor Identity Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {/* 1. Vendor Name */}
                <div className="bg-stone-50 rounded-xl p-2.5 border border-stone-100">
                  <span className="text-[9px] font-bold text-stone-400 uppercase tracking-wider block">Vendor Name / Company</span>
                  <span className="font-extrabold text-stone-900 text-xs sm:text-[13px] block mt-0.5 leading-tight">{vendorCompanyName}</span>
                </div>
                {/* 2. Vendor ID */}
                <div className="bg-[#FEF2EE] rounded-xl p-2.5 border border-[#F9CEB8] flex items-center justify-between">
                  <div>
                    <span className="text-[9px] font-bold text-[#A62C11] uppercase tracking-wider block">Vendor ID</span>
                    <span className="font-mono font-black text-[#A62C11] text-xs sm:text-sm block mt-0.5 tracking-wider">{vendorId}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopyText(vendorId, 'Vendor ID')}
                    className="p-1 hover:bg-white/80 rounded text-[#A62C11] cursor-pointer"
                    title="Copy Vendor ID"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Secondary Details Row: Contact & Mobile */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-stone-50 rounded-xl p-2.5 border border-stone-100">
                  <span className="text-[9px] font-bold text-stone-400 uppercase tracking-wider block">Authorized Contact</span>
                  <span className="font-bold text-stone-900 text-xs block mt-0.5 truncate">{contactPerson}</span>
                </div>
                <div className="bg-stone-50 rounded-xl p-2.5 border border-stone-100 flex items-center justify-between">
                  <div>
                    <span className="text-[9px] font-bold text-stone-400 uppercase tracking-wider block">Registered Mobile</span>
                    <span className="font-mono font-bold text-stone-900 text-xs block mt-0.5">{partnerMobile}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopyText(partnerMobile, 'Registered Mobile')}
                    className="p-1 hover:bg-stone-200/60 rounded text-stone-400 hover:text-stone-700 cursor-pointer"
                    title="Copy Mobile"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Profile Dossier Row: Email & Category */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-stone-50 rounded-xl p-2.5 border border-stone-100 flex items-center justify-between">
                  <div className="min-w-0 flex-1 truncate pr-1">
                    <span className="text-[9px] font-bold text-stone-400 uppercase tracking-wider block">Business Email</span>
                    <span className="font-mono font-semibold text-stone-900 text-[11px] block mt-0.5 truncate">{partnerEmail}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopyText(partnerEmail, 'Email')}
                    className="p-1 hover:bg-stone-200/60 rounded text-stone-400 hover:text-stone-700 cursor-pointer shrink-0"
                    title="Copy Email"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                </div>
                <div className="bg-stone-50 rounded-xl p-2.5 border border-stone-100">
                  <span className="text-[9px] font-bold text-stone-400 uppercase tracking-wider block">Partner Category</span>
                  <span className="font-bold text-[#A62C11] bg-[#FEF2EE] px-2 py-0.5 rounded border border-[#F9CEB8] text-[10.5px] inline-block mt-0.5 truncate">
                    {vendorCategory}
                  </span>
                </div>
              </div>

              {/* Profile Dossier Row: Payout Account & KYC Status */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-stone-50 rounded-xl p-2.5 border border-stone-100">
                  <span className="text-[9px] font-bold text-stone-400 uppercase tracking-wider block">Settlement Payout Account</span>
                  <span className="font-mono font-bold text-stone-800 text-[11px] block mt-0.5 truncate">{partnerUpi || partnerBankName}</span>
                  {partnerAccountNumber && (
                    <span className="text-stone-400 font-sans block text-[9.5px]">
                      (A/C ••{String(partnerAccountNumber).slice(-4)})
                    </span>
                  )}
                </div>
                <div className="bg-stone-50 rounded-xl p-2.5 border border-stone-100">
                  <span className="text-[9px] font-bold text-stone-400 uppercase tracking-wider block">KYC &amp; Auth Status</span>
                  <span className="font-bold text-[10.5px] text-emerald-700 flex items-center gap-1 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Active Verified ✓</span>
                  </span>
                </div>
              </div>

              {/* Passkey Card */}
              <div className="bg-[#FEF2EE] rounded-xl p-3 border border-[#F9CEB8] flex items-center justify-between gap-2">
                <div>
                  <span className="text-[9px] font-bold text-[#A62C11] uppercase tracking-wider block">
                    Assigned Security Passkey
                  </span>
                  <span className="font-mono font-black text-stone-900 text-sm tracking-wider mt-0.5 block">
                    {partnerPasskey}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleCopyKey}
                  className="text-[10px] bg-[#C84826] hover:bg-[#A62C11] text-white font-bold px-2.5 py-1.5 rounded-lg transition flex items-center gap-1 cursor-pointer"
                >
                  {copiedKey ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedKey ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

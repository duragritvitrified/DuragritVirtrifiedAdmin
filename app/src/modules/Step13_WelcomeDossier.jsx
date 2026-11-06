import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import {
  checkClientUpdateStatus,
  applyClientAppUpdate
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
  Rocket
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

  const myDigits = String(currentUser?.mobile || '').replace(/\D/g, '').slice(-10);
  const livePartner = vendors.find((v) => {
    const vDigits = String(v.phone || v.mobile || '').replace(/\D/g, '').slice(-10);
    const vId = String(v.vendorId || v.id || '').toLowerCase();
    const myId = String(currentUser?.vendorId || currentUser?.id || '').toLowerCase();
    return (vId && vId === myId) || (myDigits.length === 10 && vDigits === myDigits);
  });

  const liveUser = livePartner
    ? {
        ...livePartner,
        name: livePartner.contactPerson || livePartner.companyName || livePartner.name,
        mobile: livePartner.phone || livePartner.mobile,
        role: livePartner.category || 'Contractor',
        id: livePartner.vendorId || livePartner.id,
        passkey: livePartner.passkey || livePartner.tempPassword,
        upiId: livePartner.upi,
      }
    : users.find((u) => {
        const uDigits = String(u.mobile || u.phone || '').replace(/\D/g, '').slice(-10);
        return String(u.id) === String(currentUser?.id) || (myDigits.length === 10 && uDigits === myDigits);
      }) || currentUser || {};

  const partnerName = liveUser?.name || 'Partner';
  const partnerMobile = liveUser?.mobile || liveUser?.phone || 'Not Set';
  const partnerRole = liveUser?.role || 'Contractor';
  const partnerId = liveUser?.id
    ? (String(liveUser.id).startsWith('USR-') || String(liveUser.id).startsWith('VND-')
        ? String(liveUser.id)
        : `USR-${liveUser.id}`)
    : 'PARTNER';
  const partnerPasskey = liveUser?.passkey || liveUser?.tempPassword || liveUser?.password || 'Active';
  const partnerUpi = liveUser?.upiId || liveUser?.vpa || 'Not Linked';

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

  return (
    <div className="flex-1 flex flex-col bg-[#FAF9F6] text-stone-800 p-3.5 pb-24 relative font-sans">
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
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-[#C84826] border border-white/25 flex items-center justify-center shadow-sm overflow-hidden shrink-0">
                {liveUser?.avatarUrl || liveUser?.profileImage ? (
                  <img
                    src={liveUser.avatarUrl || liveUser.profileImage}
                    alt={partnerName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-white font-black text-base tracking-tighter">DG</span>
                )}
              </div>
              <div>
                <span className="font-black text-sm tracking-wider text-white block">DURAGRIT VITRIFIED</span>
                <p className="text-[10px] text-white/80 font-medium">Retail &amp; QR Cashback Network</p>
              </div>
            </div>
            <span className="text-[10px] bg-white/15 border border-white/25 text-white font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
              <CheckCircle className="w-3 h-3" />
              <span>Active</span>
            </span>
          </div>

          <div>
            <h3 className="text-xl font-black tracking-tight text-white">
              Hello {partnerName},
            </h3>
            <p className="text-[11px] text-white/85 leading-relaxed mt-1">
              Your DuraGrit Partner Account is synced with the live Admin ERP &amp; Supabase ledger.
            </p>
          </div>
        </div>

        {/* Credentials Body */}
        <div className="p-4 bg-[#FAF9F6] space-y-4">
          <div className="bg-white rounded-2xl border border-stone-200 shadow-2xs overflow-hidden">
            <div className="bg-stone-50 px-4 py-2.5 border-b border-stone-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-[#FEF2EE] text-[#C84826] flex items-center justify-center font-bold">
                  <Key className="w-3.5 h-3.5" />
                </div>
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-stone-900">Your Login Credentials</h4>
              </div>
              <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded">
                Synced
              </span>
            </div>

            <div className="p-3.5 space-y-3">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-stone-50 rounded-xl p-2.5 border border-stone-100">
                  <span className="text-[9px] font-bold text-stone-400 uppercase tracking-wider block">Mobile / Login ID</span>
                  <span className="font-mono font-bold text-stone-900 text-xs block mt-0.5">{partnerMobile}</span>
                </div>
                <div className="bg-stone-50 rounded-xl p-2.5 border border-stone-100">
                  <span className="text-[9px] font-bold text-stone-400 uppercase tracking-wider block">Role &amp; Code</span>
                  <span className="font-bold text-[#C84826] text-xs block mt-0.5">{partnerRole} ({partnerId})</span>
                </div>
              </div>

              <div className="bg-stone-50 rounded-xl p-2.5 border border-stone-100">
                <span className="text-[9px] font-bold text-stone-400 uppercase tracking-wider block">Linked Payout UPI / VPA</span>
                <span className="font-mono font-bold text-stone-800 text-xs block mt-0.5">{partnerUpi}</span>
              </div>

              <div className="bg-[#FEF2EE] rounded-xl p-3 border border-[#F9CEB8] flex items-center justify-between gap-2">
                <div>
                  <span className="text-[9px] font-bold text-[#A62C11] uppercase tracking-wider block">
                    Assigned Passkey
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

              <div className="flex items-start gap-1.5 text-stone-500 text-[10px]">
                <Lock className="w-3 h-3 text-[#C84826] shrink-0 mt-0.5" />
                <p>Keep your passkey secure to protect your UPI cashback redemptions.</p>
              </div>
            </div>
          </div>

          {/* App Download & Version Management CTA */}
          <div className="bg-white rounded-2xl border border-stone-200 p-4 text-center space-y-2.5 shadow-2xs font-sans">
            <div className="flex items-center justify-between">
              <span className="inline-block bg-[#FEF2EE] text-[#C84826] text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider border border-[#F9CEB8]">
                Official DuraGrit Mobile Suite
              </span>
              <span className="text-[10px] font-mono font-bold text-stone-500">
                v{updateStatus.installedVersion}
              </span>
            </div>

            {updateStatus.hasUpdate ? (
              <div className="bg-[#FEF2EE] border border-[#F9CEB8] rounded-xl p-3 text-left space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-xs text-[#A62C11] flex items-center gap-1.5">
                    <Rocket className="w-3.5 h-3.5 text-[#C84826] animate-pulse" />
                    <span>OTA Update {updateStatus.latestVersion} Ready</span>
                  </span>
                  <span className="bg-[#A62C11] text-white text-[8.5px] font-bold px-1.5 py-0.2 rounded font-mono">
                    NEW RELEASE
                  </span>
                </div>
                <p className="text-[10.5px] text-stone-600 leading-snug">
                  {updateStatus.changelog}
                </p>
                <button
                  onClick={handleApplyUpdate}
                  disabled={isUpdating}
                  className="w-full py-2 bg-[#A62C11] hover:bg-[#8B230C] text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center justify-center space-x-1.5 cursor-pointer active:scale-95 disabled:opacity-50"
                >
                  <Rocket className="w-3.5 h-3.5 text-white" />
                  <span>{isUpdating ? 'Applying Bundle...' : `Update Now to ${updateStatus.latestVersion}`}</span>
                </button>
              </div>
            ) : (
              <div className="py-1 px-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10.5px] font-bold rounded-lg flex items-center justify-center gap-1">
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>Running Latest Production Version ({updateStatus.installedVersion})</span>
              </div>
            )}

            <h4 className="text-sm font-black text-stone-900 leading-snug">
              Download Companion Android APK
            </h4>
            <a
              href="/apk/duragrit-contractor-v2.apk"
              download="duragrit-contractor-v2.apk"
              onClick={() => showToast('Downloading Official DuraGrit Android APK...')}
              className="inline-flex items-center justify-center gap-2 w-full py-2.5 bg-[#C84826] hover:bg-[#A62C11] text-white font-bold text-xs rounded-xl shadow-sm transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-white" />
              <span>Download DuraGrit Android App (.APK)</span>
            </a>
          </div>

          {/* Support */}
          <div className="bg-white border border-stone-200 rounded-xl p-3 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-[#C84826] shrink-0" />
              <div>
                <span className="font-bold text-stone-900 block text-[11px]">Need Support?</span>
                <span className="text-[10px] text-stone-500">Morbi IT Desk Helpline</span>
              </div>
            </div>
            <a href="tel:+917303967198" className="text-[10px] font-bold bg-[#C84826] text-white px-2.5 py-1.5 rounded-lg">
              Call Desk
            </a>
          </div>
        </div>

        <div className="bg-stone-900 text-stone-300 p-4 text-center text-[10px] space-y-0.5">
          <p>© 2026 DuraGrit Vitrified Pvt. Ltd. All rights reserved.</p>
          <p className="text-stone-400">Morbi Kiln Cluster, Gujarat • info@duragritvitrified.com</p>
        </div>
      </div>
    </div>
  );
}

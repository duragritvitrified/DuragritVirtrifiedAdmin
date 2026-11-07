import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
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
  Inbox
} from 'lucide-react';
import {
  getEmailDispatches,
  sendOnboardingEmail,
  getAutoEmailSetting,
  setAutoEmailSetting
} from '../../services/emailService';
import { useData } from '../../context/DataContext';

export function OnboardingDossier({ initialUser, onNavigateToFieldApp }) {
  const { users = [] } = useData();

  const liveUsers = users.map(u => ({
    id: String(u.id).startsWith('USR-') ? String(u.id) : `USR-${u.id}`,
    name: u.name,
    mobile: u.mobile || '',
    role: `${u.role || 'Contractor'} / Partner`,
    email: u.email || '',
    tempPassword: u.passkey || u.tempPassword || u.password || `Dura#${String(u.id).replace(/[^0-9]/g, '') || '2026'}`,
    hub: u.location || 'Morbi Kiln Network',
    vpa: u.vpa || u.upiId || ''
  }));

  const [selectedUserIndex, setSelectedUserIndex] = useState(0);
  const activeUser = initialUser || liveUsers[selectedUserIndex] || liveUsers[0] || null;

  const [copiedKey, setCopiedKey] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [autoEmailEnabled, setAutoEmailEnabled] = useState(getAutoEmailSetting());
  const [dispatches, setDispatches] = useState(getEmailDispatches());
  const [customEmail, setCustomEmail] = useState(activeUser?.email || '');

  useEffect(() => {
    setCustomEmail(activeUser?.email || '');
  }, [activeUser?.id, activeUser?.email]);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3500);
  };

  const handleCopyKey = () => {
    if (!activeUser) return;
    navigator.clipboard.writeText(activeUser.tempPassword);
    setCopiedKey(true);
    showToast(`Security Key ${activeUser.tempPassword} copied to clipboard!`);
    setTimeout(() => setCopiedKey(false), 2500);
  };

  const handleSendEmail = async () => {
    if (!activeUser) return;
    const targetEmail = (customEmail || activeUser.email || '').trim();
    if (!targetEmail) {
      showToast('Please enter a recipient email address first.');
      return;
    }

    setIsSending(true);
    await sendOnboardingEmail({
      recipientEmail: targetEmail,
      recipientName: activeUser.name,
      mobile: activeUser.mobile,
      userId: activeUser.id,
      role: activeUser.role,
      tempPassword: activeUser.tempPassword,
      hub: activeUser.hub
    });
    setIsSending(false);

    try {
      confetti({ particleCount: 50, spread: 65, origin: { y: 0.6 } });
    } catch (e) {}

    setDispatches(getEmailDispatches());
    showToast(`Credentials dossier dispatched to ${targetEmail}!`);
  };

  const handleToggleAutoEmail = () => {
    const nextVal = !autoEmailEnabled;
    setAutoEmailEnabled(nextVal);
    setAutoEmailSetting(nextVal);
    showToast(`Automatic credential email dispatch is now ${nextVal ? 'ENABLED' : 'PAUSED'}.`);
  };

  return (
    <div className="flex-1 flex flex-col relative">
      {toastMsg && (
        <div className="fixed top-20 right-6 z-50 bg-[#A62C11] text-white px-4 py-3 rounded-xl shadow-2xl border border-[#F9CEB8]/40 flex items-center space-x-2 text-xs font-semibold">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>{toastMsg}</span>
        </div>
      )}

      <main className="flex-1 space-y-6">
        {/* Header */}
        <section className="flex flex-col xl:flex-row xl:items-center justify-between pb-6 gap-4 border-b border-slate-200">
          <div>
            <div className="flex items-center space-x-3 mb-1">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                Partner Onboarding Dossier &amp; Credentials Dispatch
              </h1>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider bg-[#FEF2EE] text-[#C84826] border border-[#F9CEB8]">
                MAIL GATEWAY • STEP 05 COMPANION
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 max-w-3xl">
              Automated delivery engine for issuing login credentials, temporary security keys, setup guides, and APK download links to registered contractors and dealers.
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
            >
              <span className={`w-2 h-2 rounded-full ${autoEmailEnabled ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></span>
              <span>Auto-Email: <strong>{autoEmailEnabled ? 'ON' : 'OFF'}</strong></span>
            </button>

            <button
              onClick={handleSendEmail}
              disabled={isSending || !activeUser}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-[#C84826] hover:bg-[#A62C11] text-white rounded-lg text-xs font-bold shadow-sm transition disabled:opacity-50 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5 text-white" />
              <span>{isSending ? 'Dispatching Mail...' : 'Send Credentials Email'}</span>
            </button>

            <a
              href={typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') ? 'http://localhost:3002/' : `${typeof window !== 'undefined' ? window.location.origin : ''}/app/?app=vendor`}
              target="_blank"
              rel="noreferrer"
              onClick={() => showToast('Opening DuraGrit Partner Mobile App...')}
              className="inline-flex items-center space-x-2 px-3.5 py-2 bg-[#FEF2EE] hover:bg-[#FDE5DC] text-[#A62C11] border border-[#F9CEB8] rounded-lg text-xs font-black shadow-xs transition cursor-pointer"
            >
              <Smartphone className="w-3.5 h-3.5 text-[#C84826]" />
              <span>Open Partner App</span>
            </a>
          </div>
        </section>

        {!activeUser ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3 shadow-xs">
            <User className="w-10 h-10 text-[#C84826] mx-auto opacity-80" />
            <h3 className="text-base font-black text-slate-900">No Registered Partners Yet</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Add a Contractor, Mason, Dealer, or Distributor in <strong>User Management</strong> first. Their live login credentials and onboarding dossier will appear here automatically.
            </p>
          </div>
        ) : (
          <>
            {/* Recipient Selector */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Registered Partners ({liveUsers.length}):
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
                      {u.name}
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
                  className="px-3 py-1.5 bg-[#C84826] hover:bg-[#A62C11] text-white rounded-lg text-xs font-bold shadow-xs flex items-center space-x-1 cursor-pointer"
                >
                  <Send className="w-3 h-3 text-white" />
                  <span>Send</span>
                </button>
              </div>
            </div>

            {/* 600px Email Card Preview */}
            <div className="flex flex-col items-center justify-center">
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
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">Mobile App Login Credentials</h3>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">Mobile / Login ID</span>
                        <span className="font-mono font-bold text-slate-900 text-sm mt-1 block">{activeUser.mobile || activeUser.id}</span>
                      </div>
                      <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">Role &amp; Partner Code</span>
                        <span className="font-bold text-[#C84826] text-xs mt-1 block">{activeUser.role} ({activeUser.id})</span>
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
                    <h3 className="text-base font-black text-slate-900">Launch DuraGrit Mobile Scanner</h3>
                    <div className="flex flex-wrap items-center justify-center gap-3">
                      <a
                        href={typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') ? 'http://localhost:3002/' : `${typeof window !== 'undefined' ? window.location.origin : ''}/app/?app=vendor`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#C84826] hover:bg-[#A62C11] text-white font-bold text-xs rounded-xl shadow-sm cursor-pointer"
                      >
                        <Smartphone className="w-4 h-4" />
                        <span>Open Partner App (Android / iOS)</span>
                      </a>
                      {onNavigateToFieldApp && (
                        <button
                          type="button"
                          onClick={onNavigateToFieldApp}
                          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#FEF2EE] hover:bg-[#FDE5DC] text-[#A62C11] border border-[#F9CEB8] font-bold text-xs rounded-xl cursor-pointer"
                        >
                          <Smartphone className="w-4 h-4" />
                          <span>Open Mobile App Preview →</span>
                        </button>
                      )}
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
          </>
        )}

        {/* Email Gateway Audit Log Table */}
        <section className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-black text-slate-900">Email Gateway Delivery Ledger</h3>
              <p className="text-xs text-slate-500">Live audit trail of dispatched partner credentials</p>
            </div>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              {dispatches.length} Delivered
            </span>
          </div>

          <div className="overflow-x-auto mt-3">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-slate-50 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">DISPATCH ID</th>
                  <th className="py-2.5 px-3">RECIPIENT</th>
                  <th className="py-2.5 px-3">EMAIL</th>
                  <th className="py-2.5 px-3">ROLE &amp; ID</th>
                  <th className="py-2.5 px-3">STATUS</th>
                  <th className="py-2.5 px-3 text-right">TIMESTAMP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {dispatches.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      <Inbox className="w-6 h-6 mx-auto mb-1 text-slate-300" />
                      <span>No onboarding emails dispatched yet.</span>
                    </td>
                  </tr>
                ) : (
                  dispatches.map((d) => (
                    <tr key={d.id} className="hover:bg-slate-50/70">
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{d.id}</td>
                      <td className="py-2.5 px-3 font-bold text-slate-900">{d.recipientName}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-700">{d.to || d.recipientEmail}</td>
                      <td className="py-2.5 px-3">
                        <span className="bg-[#FEF2EE] text-[#C84826] border border-[#F9CEB8] px-2 py-0.5 rounded text-[10px] font-semibold">
                          {d.role} ({d.userId})
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="inline-flex items-center text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          <Check className="w-3 h-3 text-emerald-600 mr-1" />
                          {d.status || 'Delivered'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-400 font-mono text-[10px]">{d.sentAt}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}

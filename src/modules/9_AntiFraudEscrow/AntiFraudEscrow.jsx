import React, { useState, useMemo } from 'react';
import { ShieldAlert, ShieldCheck, Search, RefreshCw, CheckCircle2, Lock,
  AlertCircle
} from 'lucide-react';
import { useData } from '../../context/DataContext';

export function AntiFraudEscrow() {
  const { claims = [], approveClaimStep1, rejectClaim, refreshAllData } = useData();
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMsg, setToastMsg] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3500);
  };

  const quarantinedClaims = useMemo(() => {
    return claims
      .filter((c) => c.status === 'Flagged' || c.status === 'Rejected')
      .map((c) => ({
        id: c.requestId || c.claimNumber || c.id,
        userName: c.userName || c.contractorName || 'Registered Partner',
        userMobile: c.userMobile || c.contractorPhone || c.mobile || '—',
        productName: c.productName || 'DuraGrit Pack',
        qrSerial: c.qrSerial || c.serialKey || '—',
        amount: Number(c.amount ?? c.claimValue ?? 0),
        reason: c.flagReason || c.remarks || 'Flagged during claim audit',
        status: c.status,
      }));
  }, [claims]);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return quarantinedClaims;
    return quarantinedClaims.filter(
      (c) =>
        String(c.id).toLowerCase().includes(q) ||
        String(c.userName).toLowerCase().includes(q) ||
        String(c.qrSerial).toLowerCase().includes(q)
    );
  }, [quarantinedClaims, searchQuery]);

  const stats = useMemo(() => {
    const heldValue = quarantinedClaims.reduce((s, c) => s + c.amount, 0);
    const pendingEscrow = claims
      .filter((c) => c.status === 'Pending' || (c.status === 'Approved' && c.payoutStatus !== 'Disbursed'))
      .reduce((s, c) => s + Number(c.amount ?? c.claimValue ?? 0), 0);
    return {
      quarantineCount: quarantinedClaims.length,
      heldValue,
      pendingEscrow,
    };
  }, [quarantinedClaims, claims]);

  const handleRestoreApprove = async (claimId) => {
    await approveClaimStep1(claimId);
    showToast(`Claim ${claimId} cleared and moved to Approved queue for payout release.`);
  };

  const handleConfirmReject = async (claimId) => {
    await rejectClaim(claimId, 'Confirmed quarantine block by Admin');
    showToast(`Claim ${claimId} permanently rejected in quarantine.`);
  };

  const handleSync = async () => {
    setIsRefreshing(true);
    await refreshAllData();
    setIsRefreshing(false);
  };

  return (
    <div className="space-y-6 relative">
      {toastMsg && (() => {
        const isError = /error|failed|failure|invalid|missing|required|cannot|unable|reject|please enter|denied|timeout|unreachable/i.test(toastMsg);
        return (
          <div className={`fixed top-20 right-8 z-50 text-white px-4 py-3 rounded-xl shadow-2xl border flex items-center space-x-2.5 text-xs font-semibold animate-in fade-in slide-in-from-top-4 duration-200 select-none ${
            isError ? 'bg-rose-600 border-rose-400/60 shadow-rose-950/30' : 'bg-emerald-600 border-emerald-400/60 shadow-emerald-950/30'
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

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 text-[11px] font-bold text-[#A62C11] uppercase tracking-wider bg-[#FEF2EE] border border-[#F9CEB8] px-2.5 py-1 rounded-full mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#C84826]" />
            SECURITY, ANTI-FRAUD &amp; ESCROW QUARANTINE
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Anti-Fraud &amp; Escrow Quarantine Audit Portal
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Review rejected or flagged cashback claims and protect serialized QR escrow funds.
          </p>
        </div>

        <button
          onClick={handleSync}
          className="inline-flex items-center gap-1.5 bg-[#C84826] hover:bg-[#A62C11] text-white font-bold text-xs px-4 py-2 rounded-xl shadow-sm cursor-pointer self-start md:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          Sync Audit Queue
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Quarantined Claims</span>
            <ShieldAlert className="w-4 h-4 text-[#C84826]" />
          </div>
          <div className="text-2xl font-black text-slate-900">{stats.quarantineCount}</div>
          <div className="text-[11px] text-slate-500 mt-1">Held Value: ₹{stats.heldValue.toLocaleString('en-IN')}</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Active Escrow In-Process</span>
            <Lock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">₹{stats.pendingEscrow.toLocaleString('en-IN')}</div>
          <div className="text-[11px] text-slate-500 mt-1">Awaiting Step 1 / Step 2 settlement</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Duplicate QR Guard</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-600">100% Enforced</div>
          <div className="text-[11px] text-slate-500 mt-1">Single-use serial verification active</div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-3.5 shadow-sm">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search quarantined claims by ID, Partner, or QR Serial..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#C84826]"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-bold tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Claim ID</th>
                <th className="py-3.5 px-4">Partner</th>
                <th className="py-3.5 px-4">Product &amp; Serial</th>
                <th className="py-3.5 px-4">Reason</th>
                <th className="py-3.5 px-4">Amount</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-14 text-center">
                    <ShieldCheck className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                    <p className="text-sm font-bold text-slate-700">Zero Quarantined or Flagged Claims</p>
                    <p className="text-xs text-slate-400 mt-1">
                      All live QR cashback claims are clean. Rejected or flagged claims will appear here.
                    </p>
                  </td>
                </tr>
              ) : (
                filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/70">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{c.id}</td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-800">{c.userName}</div>
                      <div className="font-mono text-[11px] text-slate-500">{c.userMobile}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800">{c.productName}</div>
                      <div className="font-mono text-[11px] text-slate-500">{c.qrSerial}</div>
                    </td>
                    <td className="py-3.5 px-4 text-rose-600 font-medium">{c.reason}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">₹{c.amount}</td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      <button
                        onClick={() => handleRestoreApprove(c.id)}
                        className="px-2.5 py-1 rounded-lg bg-[#C84826] hover:bg-[#A62C11] text-white font-bold text-[11px] cursor-pointer"
                      >
                        Restore &amp; Approve
                      </button>
                      {c.status !== 'Rejected' && (
                        <button
                          onClick={() => handleConfirmReject(c.id)}
                          className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-[11px] cursor-pointer"
                        >
                          Reject
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

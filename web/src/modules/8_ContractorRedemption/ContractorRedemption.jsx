import React, { useState, useMemo } from 'react';
import { QrCode, Search, Download, RefreshCw, CheckCircle2, Users, ShieldAlert, Wallet } from 'lucide-react';
import { useData } from '../../context/DataContext';

export function ContractorRedemption() {
  const { claims = [], users = [], refreshAllData } = useData();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusTab, setStatusTab] = useState('All');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const normalizedClaims = useMemo(() => {
    return claims.map((c) => {
      const amount = Number(c.amount ?? c.claimValue ?? 0);
      const isDisbursed = c.status === 'Disbursed' || c.payoutStatus === 'Disbursed';
      const statusLabel = isDisbursed ? 'Disbursed' : c.status || 'Pending';
      return {
        id: c.requestId || c.claimNumber || c.id,
        userName: c.userName || c.contractorName || 'Registered Partner',
        userMobile: c.userMobile || c.contractorPhone || c.mobile || '—',
        productName: c.productName || 'DuraGrit Pack',
        qrSerial: c.qrSerial || c.serialKey || '—',
        amount,
        disbursedAmount: isDisbursed ? Number(c.disbursedAmount ?? amount) : 0,
        paymentMode: c.paymentMode || c.payoutMethod || 'UPI',
        utr: c.transactionId || c.npciRrn || '—',
        status: statusLabel,
        date:
          c.date ||
          (c.submittedAt
            ? new Date(c.submittedAt).toLocaleString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })
            : 'Just now'),
      };
    });
  }, [claims]);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return normalizedClaims.filter((c) => {
      const matchTab = statusTab === 'All' || c.status === statusTab;
      const matchQ =
        !q ||
        String(c.id).toLowerCase().includes(q) ||
        String(c.userName).toLowerCase().includes(q) ||
        String(c.userMobile).toLowerCase().includes(q) ||
        String(c.qrSerial).toLowerCase().includes(q);
      return matchTab && matchQ;
    });
  }, [normalizedClaims, statusTab, searchQuery]);

  const stats = useMemo(() => {
    const disbursed = normalizedClaims.filter((c) => c.status === 'Disbursed');
    const flagged = normalizedClaims.filter((c) => c.status === 'Rejected' || c.status === 'Flagged');
    return {
      totalRedeemedInr: disbursed.reduce((s, c) => s + (c.disbursedAmount || c.amount), 0),
      totalClaims: normalizedClaims.length,
      disbursedCount: disbursed.length,
      flaggedCount: flagged.length,
      contractorsCount: users.length,
    };
  }, [normalizedClaims, users]);

  const handleExportCSV = () => {
    if (normalizedClaims.length === 0) return;
    const rows = [
      ['Claim ID', 'Contractor', 'Mobile', 'Product', 'QR Serial', 'Amount', 'Status', 'UTR'],
      ...normalizedClaims.map((c) => [
        c.id,
        `"${c.userName}"`,
        `"${c.userMobile}"`,
        `"${c.productName}"`,
        c.qrSerial,
        c.amount,
        c.status,
        c.utr,
      ]),
    ];
    const csv = rows.map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `DuraGrit_Contractor_Redemptions_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSync = async () => {
    setIsRefreshing(true);
    await refreshAllData();
    setIsRefreshing(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 text-[11px] font-bold text-[#A62C11] uppercase tracking-wider bg-[#FEF2EE] border border-[#F9CEB8] px-2.5 py-1 rounded-full mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#C84826]" />
            CONTRACTOR LOYALTY &amp; QR REDEMPTION STREAM
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Contractor QR Redemption &amp; Cash Incentive Ledger
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Live stream of QR code scans submitted from the Mobile App and synchronized with Supabase.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleSync}
            className="inline-flex items-center gap-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs px-3.5 py-2 rounded-xl cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[#C84826]' : ''}`} />
            Sync
          </button>
          <button
            onClick={handleExportCSV}
            disabled={normalizedClaims.length === 0}
            className="inline-flex items-center gap-1.5 bg-[#C84826] hover:bg-[#A62C11] disabled:opacity-50 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-sm cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Export Ledger (CSV)
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Settled</span>
            <Wallet className="w-4 h-4 text-[#C84826]" />
          </div>
          <div className="text-2xl font-black text-slate-900">₹{stats.totalRedeemedInr.toLocaleString('en-IN')}</div>
          <div className="text-[11px] text-slate-500 mt-1">{stats.disbursedCount} Disbursed Payouts</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">QR Scans Logged</span>
            <QrCode className="w-4 h-4 text-[#C84826]" />
          </div>
          <div className="text-2xl font-black text-slate-900">{stats.totalClaims.toLocaleString('en-IN')}</div>
          <div className="text-[11px] text-slate-500 mt-1">Verified Mobile App submissions</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Registered Contractors</span>
            <Users className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{stats.contractorsCount}</div>
          <div className="text-[11px] text-slate-500 mt-1">Active partner directory</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Quarantined / Rejected</span>
            <ShieldAlert className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-black text-rose-600">{stats.flaggedCount}</div>
          <div className="text-[11px] text-slate-500 mt-1">Anti-fraud velocity guard</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 p-3.5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Contractor, Mobile, Claim ID, or QR Serial..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#C84826]"
          />
        </div>
        <div className="flex items-center flex-wrap gap-1.5">
          {['All', 'Pending', 'Approved', 'Disbursed', 'Rejected'].map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusTab(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                statusTab === tab
                  ? 'bg-[#C84826] text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-bold tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Claim ID &amp; Time</th>
                <th className="py-3.5 px-4">Contractor</th>
                <th className="py-3.5 px-4">Product &amp; QR Serial</th>
                <th className="py-3.5 px-4">Cashback</th>
                <th className="py-3.5 px-4">Payout &amp; UTR</th>
                <th className="py-3.5 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-14 text-center">
                    <CheckCircle2 className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm font-bold text-slate-700">No QR Redemptions Logged Yet</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Scan a QR serial in the Vendor Mobile App to see live redemptions appear here.
                    </p>
                  </td>
                </tr>
              ) : (
                filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/70">
                    <td className="py-3.5 px-4">
                      <div className="font-mono font-bold text-slate-900">{c.id}</div>
                      <div className="text-[11px] text-slate-400">{c.date}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-800">{c.userName}</div>
                      <div className="font-mono text-[11px] text-slate-500">{c.userMobile}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800">{c.productName}</div>
                      <div className="font-mono text-[11px] text-slate-500">{c.qrSerial}</div>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-[#C84826]">₹{c.amount}</td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-700">{c.paymentMode}</div>
                      <div className="font-mono text-[11px] text-slate-400">{c.utr}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          c.status === 'Disbursed'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : c.status === 'Approved'
                            ? 'bg-[#FEF2EE] text-[#A62C11] border-[#F9CEB8]'
                            : c.status === 'Rejected'
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}
                      >
                        {c.status}
                      </span>
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
